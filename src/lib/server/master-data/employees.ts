import type { SupabaseClient } from '@supabase/supabase-js';

import { ROLE_CODES } from '$lib/constants/access';
import type { AuthContext } from '$lib/types/auth';
import type { Database } from '$lib/supabase/database';

import { assertEmployeeManager, assertViewBranchScopedData } from './auth';
import {
	branchAccessDeniedError,
	conflictError,
	notFoundError,
	validationError
} from './errors';
import {
	compactSearch,
	normalizeEmail,
	normalizePhone,
	normalizeWhitespace,
	optionalTrimmed,
	parseDateValue,
	parseUuidValue
} from './format';
import type { ParsedListQuery } from './query';
import { resolveBranchScope } from './query';
import { applyEmployeeAssignmentRpc } from './employee-assignment-rpc';

type EmployeeRow = Database['public']['Tables']['employees']['Row'];
type BranchRow = Database['public']['Tables']['branches']['Row'];
type PositionRow = Database['public']['Tables']['positions']['Row'] & {
	is_active: boolean;
	updated_at: string;
};
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type EmployeeAssignmentRow = Database['public']['Tables']['employee_assignments']['Row'] & {
	supervisor_employee_id: string | null;
	reason: string;
	created_by: string | null;
	updated_by: string | null;
	updated_at: string;
};

type EmploymentStatus = Database['public']['Enums']['employment_status'];

export interface EmployeeListItem {
	id: string;
	employeeNumber: string;
	fullName: string;
	phone: string | null;
	email: string | null;
	branch: {
		id: string;
		code: string;
		name: string;
	} | null;
	position: {
		id: string;
		code: string;
		name: string;
	} | null;
	supervisor: {
		id: string;
		fullName: string;
	} | null;
	joinDate: string;
	employmentStatus: EmploymentStatus;
	createdAt: string;
	updatedAt: string;
}

export interface EmployeeDetail extends EmployeeListItem {
	address: string | null;
	bankName: string | null;
	bankAccountMasked: string | null;
	notes: string | null;
	assignments: EmployeeAssignmentItem[];
}

export interface EmployeeAssignmentItem {
	id: string;
	branch: {
		id: string;
		code: string;
		name: string;
	} | null;
	position: {
		id: string;
		code: string;
		name: string;
	} | null;
	supervisor: {
		id: string;
		fullName: string;
	} | null;
	effectiveFrom: string;
	effectiveUntil: string | null;
	reason: string;
	actor: {
		id: string;
		fullName: string;
	} | null;
	createdAt: string;
	updatedAt: string;
	isCurrent: boolean;
}

export interface EmployeeInput {
	employeeNumber: string;
	fullName: string;
	phone: string | null;
	email: string | null;
	address: string | null;
	branchId: string;
	positionId: string;
	supervisorEmployeeId: string | null;
	joinDate: string;
	bankName: string | null;
	bankAccount: string | null;
	notes: string | null;
	employmentStatus: EmploymentStatus;
	expectedUpdatedAt: string | null;
}

const EMPLOYEE_SORT_COLUMNS: Record<string, keyof EmployeeRow> = {
	employeeNumber: 'employee_number',
	fullName: 'full_name',
	joinDate: 'join_date',
	createdAt: 'created_at',
	updatedAt: 'updated_at'
};

const ALLOWED_EMPLOYMENT_STATUSES: EmploymentStatus[] = ['active', 'inactive', 'suspended', 'resigned'];

function normalizeEmployeeSearch(value: string): string {
	return compactSearch(value).replace(/[%_,]/g, ' ').slice(0, 120);
}

function maskBankAccount(value: string | null): string | null {
	if (!value) {
		return null;
	}

	const digits = value.replace(/\D+/g, '');
	if (digits.length <= 4) {
		return '****';
	}

	return `${'*'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}

async function loadBranchMap(
	client: SupabaseClient<Database>,
	branchIds: string[]
): Promise<Map<string, EmployeeListItem['branch']>> {
	const uniqueBranchIds = [...new Set(branchIds.filter(Boolean))];

	if (uniqueBranchIds.length === 0) {
		return new Map();
	}

	const { data, error } = await client
		.from('branches')
		.select('id, code, name')
		.in('id', uniqueBranchIds);

	if (error || !data) {
		throw error ?? notFoundError();
	}

	return new Map(
		(data as BranchRow[]).map((branch) => [
			branch.id,
			{
				id: branch.id,
				code: branch.code,
				name: branch.name
			}
		])
	);
}

async function loadPositionMap(
	client: SupabaseClient<Database>,
	positionIds: string[]
): Promise<Map<string, EmployeeListItem['position']>> {
	const uniquePositionIds = [...new Set(positionIds.filter(Boolean))];

	if (uniquePositionIds.length === 0) {
		return new Map();
	}

	const { data, error } = await client
		.from('positions')
		.select('id, code, name, is_active, updated_at')
		.in('id', uniquePositionIds);

	if (error || !data) {
		throw error ?? notFoundError();
	}

	return new Map(
	(data as unknown as PositionRow[]).map((position) => [
			position.id,
			{
				id: position.id,
				code: position.code,
				name: position.name
			}
		])
	);
}

async function loadEmployeeMap(
	client: SupabaseClient<Database>,
	employeeIds: string[]
): Promise<Map<string, EmployeeListItem['supervisor']>> {
	const uniqueEmployeeIds = [...new Set(employeeIds.filter(Boolean))];

	if (uniqueEmployeeIds.length === 0) {
		return new Map();
	}

	const { data, error } = await client
		.from('employees')
		.select('id, full_name')
		.in('id', uniqueEmployeeIds);

	if (error || !data) {
		throw error ?? notFoundError();
	}

	return new Map(
		(data as Array<Pick<EmployeeRow, 'id' | 'full_name'>>).map((employee) => [
			employee.id,
			{
				id: employee.id,
				fullName: employee.full_name
			}
		])
	);
}

async function loadEmployeeAssignmentMaps(
	client: SupabaseClient<Database>,
	assignmentRows: EmployeeAssignmentRow[]
): Promise<{
	branchMap: Map<string, EmployeeAssignmentItem['branch']>;
	positionMap: Map<string, EmployeeAssignmentItem['position']>;
	supervisorMap: Map<string, EmployeeAssignmentItem['supervisor']>;
	actorMap: Map<string, EmployeeAssignmentItem['actor']>;
}> {
	const branchIds = assignmentRows.map((assignment) => assignment.branch_id);
	const positionIds = assignmentRows.map((assignment) => assignment.position_id);
	const supervisorIds = assignmentRows
		.map((assignment) => assignment.supervisor_employee_id)
		.filter((value): value is string => Boolean(value));
	const actorIds = assignmentRows
		.map((assignment) => assignment.updated_by ?? assignment.created_by)
		.filter((value): value is string => Boolean(value));
	const [branchMap, positionMap] = await Promise.all([
		loadBranchMap(client, branchIds),
		loadPositionMap(client, positionIds)
	]);
	const [supervisorMap, actorMap] = await Promise.all([
		loadEmployeeMap(client, supervisorIds),
		loadProfileMap(client, actorIds)
	]);

	return {
		branchMap,
		positionMap,
		supervisorMap,
		actorMap
	};
}

function buildEmployeeAssignment(
	assignment: EmployeeAssignmentRow,
	branch: EmployeeAssignmentItem['branch'],
	position: EmployeeAssignmentItem['position'],
	supervisor: EmployeeAssignmentItem['supervisor'],
	actor: EmployeeAssignmentItem['actor']
): EmployeeAssignmentItem {
	return {
		id: assignment.id,
		branch,
		position,
		supervisor,
		effectiveFrom: assignment.effective_from,
		effectiveUntil: assignment.effective_until,
		reason: assignment.reason,
		actor,
		createdAt: assignment.created_at,
		updatedAt: assignment.updated_at,
		isCurrent: assignment.effective_until === null
	};
}

async function loadProfileMap(
	client: SupabaseClient<Database>,
	profileIds: string[]
): Promise<Map<string, EmployeeAssignmentItem['actor']>> {
	const uniqueProfileIds = [...new Set(profileIds.filter(Boolean))];

	if (uniqueProfileIds.length === 0) {
		return new Map();
	}

	const { data, error } = await client
		.from('profiles')
		.select('id, full_name')
		.in('id', uniqueProfileIds);

	if (error || !data) {
		throw error ?? notFoundError();
	}

	return new Map(
		(data as Array<Pick<ProfileRow, 'id' | 'full_name'>>).map((profile) => [
			profile.id,
			{
				id: profile.id,
				fullName: profile.full_name
			}
		])
	);
}

async function loadEmployeeAssignments(
	client: SupabaseClient<Database>,
	employeeId: string
): Promise<EmployeeAssignmentItem[]> {
	const { data, error } = await client
		.from('employee_assignments')
		.select(
			'id, employee_id, branch_id, position_id, supervisor_employee_id, effective_from, effective_until, reason, created_by, updated_by, created_at, updated_at'
		)
		.eq('employee_id', employeeId)
		.order('effective_from', { ascending: false })
		.order('created_at', { ascending: false });

	if (error) {
		throw error;
	}

	const assignments = (data ?? []) as unknown as EmployeeAssignmentRow[];
	const { branchMap, positionMap, supervisorMap, actorMap } = await loadEmployeeAssignmentMaps(
		client,
		assignments
	);

	return assignments.map((assignment) =>
		buildEmployeeAssignment(
			assignment,
			assignment.branch_id ? branchMap.get(assignment.branch_id) ?? null : null,
			assignment.position_id ? positionMap.get(assignment.position_id) ?? null : null,
			assignment.supervisor_employee_id
				? supervisorMap.get(assignment.supervisor_employee_id) ?? null
				: null,
			assignment.updated_by
				? actorMap.get(assignment.updated_by) ?? null
				: assignment.created_by
					? actorMap.get(assignment.created_by) ?? null
					: null
		)
	);
}

function assertEmploymentStatus(value: string): EmploymentStatus {
	if (ALLOWED_EMPLOYMENT_STATUSES.includes(value as EmploymentStatus)) {
		return value as EmploymentStatus;
	}

	throw validationError('Status karyawan tidak valid.', {
		employmentStatus: ['Pilih status karyawan yang tersedia.']
	});
}

function normalizeEmployeeInput(input: EmployeeInput): EmployeeInput {
	return {
		...input,
		employeeNumber: normalizeWhitespace(input.employeeNumber),
		fullName: normalizeWhitespace(input.fullName),
		phone: input.phone ? normalizePhone(input.phone) : null,
		email: input.email ? normalizeEmail(input.email) : null,
		address: optionalTrimmed(input.address),
		bankName: optionalTrimmed(input.bankName),
		bankAccount: optionalTrimmed(input.bankAccount),
		notes: optionalTrimmed(input.notes)
	};
}

export function parseEmployeeInput(formData: FormData): EmployeeInput {
	const rawStatus = String(formData.get('employmentStatus') ?? 'active');

	return {
		employeeNumber: String(formData.get('employeeNumber') ?? ''),
		fullName: String(formData.get('fullName') ?? ''),
		phone: optionalTrimmed(String(formData.get('phone') ?? '')),
		email: optionalTrimmed(String(formData.get('email') ?? '')),
		address: optionalTrimmed(String(formData.get('address') ?? '')),
		branchId: parseUuidValue(String(formData.get('branchId') ?? ''), 'Cabang'),
		positionId: parseUuidValue(String(formData.get('positionId') ?? ''), 'Jabatan'),
		supervisorEmployeeId: optionalTrimmed(String(formData.get('supervisorEmployeeId') ?? '')),
		joinDate: parseDateValue(String(formData.get('joinDate') ?? ''), 'Tanggal bergabung'),
		bankName: optionalTrimmed(String(formData.get('bankName') ?? '')),
		bankAccount: optionalTrimmed(String(formData.get('bankAccount') ?? '')),
		notes: optionalTrimmed(String(formData.get('notes') ?? '')),
		employmentStatus: assertEmploymentStatus(rawStatus),
		expectedUpdatedAt: optionalTrimmed(String(formData.get('expectedUpdatedAt') ?? ''))
	};
}

async function assertEmployeeDependencies(
	client: SupabaseClient<Database>,
	branchId: string,
	positionId: string,
	supervisorEmployeeId: string | null,
	employeeId: string | null = null
): Promise<void> {
	const [{ data: branch }, { data: position }] = await Promise.all([
		client.from('branches').select('id, is_active').eq('id', branchId).maybeSingle(),
		client.from('positions').select('id, is_active, code, updated_at').eq('id', positionId).maybeSingle()
	]);

	if (!branch) {
		throw validationError('Cabang tidak ditemukan.', { branchId: ['Cabang tidak ditemukan.'] });
	}

	if (!branch.is_active) {
		throw validationError('Cabang harus aktif.', { branchId: ['Cabang harus aktif.'] });
	}

	if (!position || !(position as unknown as PositionRow).is_active) {
		throw validationError('Jabatan harus aktif.', { positionId: ['Jabatan harus aktif.'] });
	}

	if (supervisorEmployeeId) {
		const { data: supervisorData } = await client
			.from('employees')
			.select('id, branch_id, employment_status, position:positions(code, is_active)')
			.eq('id', supervisorEmployeeId)
			.maybeSingle();
		const supervisor = supervisorData as
			| {
					id: string;
					branch_id: string;
					employment_status: EmploymentStatus;
					position: { code?: string; is_active?: boolean } | null;
			  }
			| null;

		if (!supervisor) {
			throw validationError('Supervisor tidak ditemukan.', {
				supervisorEmployeeId: ['Supervisor tidak ditemukan.']
			});
		}

		if (supervisor.id === employeeId) {
			throw validationError('Supervisor tidak boleh sama dengan karyawan.', {
				supervisorEmployeeId: ['Supervisor tidak boleh sama dengan karyawan.']
			});
		}

		if (supervisor.branch_id !== branchId) {
			throw validationError('Supervisor harus berada di cabang yang sama.', {
				supervisorEmployeeId: ['Pilih supervisor dari cabang yang sama.']
			});
		}

		if (supervisor.employment_status !== 'active') {
			throw validationError('Supervisor harus aktif.', {
				supervisorEmployeeId: ['Supervisor harus aktif.']
			});
		}

		const supervisorPosition = supervisor.position as { code?: string; is_active?: boolean } | null;

		if (!supervisorPosition || supervisorPosition.is_active !== true) {
			throw validationError('Supervisor harus memiliki jabatan aktif.', {
				supervisorEmployeeId: ['Supervisor harus memiliki jabatan aktif.']
			});
		}

		if (supervisorPosition.code !== 'branch_manager') {
			throw validationError('Supervisor harus memiliki jabatan branch_manager.', {
				supervisorEmployeeId: ['Supervisor harus memiliki jabatan branch_manager.']
			});
		}
	}
}

function buildEmployee(employee: EmployeeRow, context: {
	branch: EmployeeListItem['branch'];
	position: EmployeeListItem['position'];
	supervisor: EmployeeListItem['supervisor'];
}): EmployeeListItem {
	return {
		id: employee.id,
		employeeNumber: employee.employee_number,
		fullName: employee.full_name,
		phone: employee.phone,
		email: employee.email,
		branch: context.branch,
		position: context.position,
		supervisor: context.supervisor,
		joinDate: employee.join_date,
		employmentStatus: employee.employment_status,
		createdAt: employee.created_at,
		updatedAt: employee.updated_at
	};
}

export async function listEmployees(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	query: ParsedListQuery
): Promise<{
	items: EmployeeListItem[];
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
}> {
	const page = query.page;
	const pageSize = query.pageSize;
	const offset = (page - 1) * pageSize;
	const sortColumn = EMPLOYEE_SORT_COLUMNS[query.sortField] ?? 'created_at';
	const branchId = resolveBranchScope(auth, query.branchId);
	let request = client
		.from('employees')
		.select('id, employee_number, profile_id, full_name, phone, email, address, branch_id, position_id, supervisor_employee_id, join_date, employment_status, bank_name, bank_account, notes, created_at, updated_at', {
			count: 'exact'
		})
		.order(sortColumn, { ascending: query.sortDirection === 'asc' });

	if (query.search) {
		const search = normalizeEmployeeSearch(query.search);
		request = request.or(
			`employee_number.ilike.%${search}%,full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
		);
	}

	if (branchId) {
		request = request.eq('branch_id', branchId);
	}

	if (query.status) {
		request = request.eq('employment_status', query.status as EmploymentStatus);
	}

	const { data, error, count } = await request.range(offset, offset + pageSize - 1);

	if (error || !data) {
		throw error ?? notFoundError();
	}

	const employees = data as EmployeeRow[];
	const branchMap = await loadBranchMap(
		client,
		employees.map((employee) => employee.branch_id).filter((value): value is string => Boolean(value))
	);
	const positionMap = await loadPositionMap(
		client,
		employees.map((employee) => employee.position_id).filter((value): value is string => Boolean(value))
	);
	const supervisorMap = await loadEmployeeMap(
		client,
		employees
			.map((employee) => employee.supervisor_employee_id)
			.filter((value): value is string => Boolean(value))
	);

	const items = employees.map((employee) =>
		buildEmployee(employee, {
			branch: employee.branch_id ? branchMap.get(employee.branch_id) ?? null : null,
			position: employee.position_id ? positionMap.get(employee.position_id) ?? null : null,
			supervisor: employee.supervisor_employee_id ? supervisorMap.get(employee.supervisor_employee_id) ?? null : null
		})
	);

	return {
		items,
		page,
		pageSize,
		total: count ?? items.length,
		totalPages: count ? Math.max(1, Math.ceil(count / pageSize)) : 1
	};
}

export async function getEmployeeDetail(
	client: SupabaseClient<Database>,
	employeeId: string,
	auth: AuthContext
): Promise<EmployeeDetail> {
	const { data, error } = await client
		.from('employees')
		.select('id, employee_number, profile_id, full_name, phone, email, address, branch_id, position_id, supervisor_employee_id, join_date, employment_status, bank_name, bank_account, notes, created_at, updated_at')
		.eq('id', employeeId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	if (!data) {
		throw notFoundError('Karyawan tidak ditemukan.');
	}

	const employee = data as EmployeeRow;
	const branchId = assertViewBranchScopedData(auth, employee.branch_id, [
		ROLE_CODES.BRANCH_MANAGER,
		ROLE_CODES.BRANCH_ADMIN
	]);

	if (auth.role.code !== ROLE_CODES.OWNER && branchId !== employee.branch_id) {
		throw branchAccessDeniedError();
	}

	const branchMap = await loadBranchMap(client, [employee.branch_id]);
	const positionMap = await loadPositionMap(client, [employee.position_id]);
	const supervisorMap = employee.supervisor_employee_id
		? await loadEmployeeMap(client, [employee.supervisor_employee_id])
		: new Map();
	const assignments = await loadEmployeeAssignments(client, employee.id);

	return {
		...buildEmployee(employee, {
			branch: branchMap.get(employee.branch_id) ?? null,
			position: positionMap.get(employee.position_id) ?? null,
			supervisor: employee.supervisor_employee_id ? supervisorMap.get(employee.supervisor_employee_id) ?? null : null
		}),
		address: employee.address,
		bankName: employee.bank_name,
		bankAccountMasked: maskBankAccount(employee.bank_account),
		notes: employee.notes,
		assignments
	};
}

export async function createEmployee(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	input: EmployeeInput
): Promise<EmployeeDetail> {
	assertEmployeeManager(auth, input.branchId);

	const normalized = normalizeEmployeeInput(input);

	if (!normalized.employeeNumber) {
		throw validationError('Nomor karyawan wajib diisi.', {
			employeeNumber: ['Nomor karyawan wajib diisi.']
		});
	}

	if (!normalized.fullName) {
		throw validationError('Nama lengkap wajib diisi.', {
			fullName: ['Nama lengkap wajib diisi.']
		});
	}

	await assertEmployeeDependencies(
		client,
		normalized.branchId,
		normalized.positionId,
		normalized.supervisorEmployeeId
	);

	const result = await applyEmployeeAssignmentRpc(client, {
		action: 'create_employee',
		payload: {
			employeeNumber: normalized.employeeNumber,
			fullName: normalized.fullName,
			phone: normalized.phone,
			email: normalized.email,
			address: normalized.address,
			branchId: normalized.branchId,
			positionId: normalized.positionId,
			supervisorEmployeeId: normalized.supervisorEmployeeId,
			joinDate: normalized.joinDate,
			bankName: normalized.bankName,
			bankAccount: normalized.bankAccount,
			notes: normalized.notes,
			employmentStatus: normalized.employmentStatus
		},
		actorProfileId: auth.profile.id,
		requestId: crypto.randomUUID()
	});

	return getEmployeeDetail(client, result.employeeId, auth);
}

export async function updateEmployee(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	employeeId: string,
	input: EmployeeInput
): Promise<EmployeeDetail> {
	const current = await getEmployeeDetail(client, employeeId, auth);
	assertEmployeeManager(auth, current.branch?.id ?? input.branchId);

	if (input.expectedUpdatedAt && input.expectedUpdatedAt !== current.updatedAt) {
		throw conflictError();
	}

	const normalized = normalizeEmployeeInput(input);

	if (!normalized.employeeNumber) {
		throw validationError('Nomor karyawan wajib diisi.', {
			employeeNumber: ['Nomor karyawan wajib diisi.']
		});
	}

	if (!normalized.fullName) {
		throw validationError('Nama lengkap wajib diisi.', {
			fullName: ['Nama lengkap wajib diisi.']
		});
	}

	await assertEmployeeDependencies(
		client,
		normalized.branchId,
		normalized.positionId,
		normalized.supervisorEmployeeId,
		employeeId
	);

	const result = await applyEmployeeAssignmentRpc(client, {
		action: 'update_employee',
		payload: {
			employeeId,
			employeeNumber: normalized.employeeNumber,
			fullName: normalized.fullName,
			phone: normalized.phone,
			email: normalized.email,
			address: normalized.address,
			branchId: normalized.branchId,
			positionId: normalized.positionId,
			supervisorEmployeeId: normalized.supervisorEmployeeId,
			joinDate: normalized.joinDate,
			bankName: normalized.bankName,
			bankAccount: normalized.bankAccount,
			notes: normalized.notes,
			employmentStatus: normalized.employmentStatus,
			expectedUpdatedAt: normalized.expectedUpdatedAt ?? current.updatedAt
		},
		actorProfileId: auth.profile.id,
		requestId: crypto.randomUUID()
	});

	return getEmployeeDetail(client, result.employeeId, auth);
}

export async function deactivateEmployee(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	employeeId: string,
	effectiveStatus: EmploymentStatus = 'inactive'
): Promise<EmployeeDetail> {
	const current = await getEmployeeDetail(client, employeeId, auth);
	assertEmployeeManager(auth, current.branch?.id ?? null);

	const { error } = await client
		.from('employees')
		.update({ employment_status: effectiveStatus })
		.eq('id', employeeId);

	if (error) {
		throw error;
	}

	return getEmployeeDetail(client, employeeId, auth);
}
