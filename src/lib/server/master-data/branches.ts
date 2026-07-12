import type { SupabaseClient } from '@supabase/supabase-js';

import type { AuthContext } from '$lib/types/auth';
import type { Database } from '$lib/supabase/database';
import { ROLE_CODES } from '$lib/constants/access';

import { assertOwner, assertBranchAccess } from './auth';
import {
	branchAccessDeniedError,
	conflictError,
	duplicateResourceError,
	notFoundError,
	validationError
} from './errors';
import { normalizeUppercaseCode, optionalTrimmed } from './format';
import type { ParsedListQuery } from './query';

type BranchRow = Database['public']['Tables']['branches']['Row'];
type EmployeeRow = Database['public']['Tables']['employees']['Row'];
type PositionRow = Database['public']['Tables']['positions']['Row'];

export interface BranchListItem {
	id: string;
	code: string;
	name: string;
	city: string;
	address: string | null;
	whatsapp: string | null;
	mapsUrl: string | null;
	openingHours: string | null;
	isActive: boolean;
	headEmployee: {
		id: string;
		fullName: string;
		positionName: string;
		status: string;
	} | null;
	createdAt: string;
	updatedAt: string;
}

export interface BranchDetail extends BranchListItem {
	counts: {
		routes: number;
		customers: number;
		stores: number;
		employees: number;
	};
}

export interface BranchInput {
	code: string;
	name: string;
	city: string;
	address: string | null;
	whatsapp: string | null;
	mapsUrl: string | null;
	openingHours: string | null;
	isActive: boolean;
	headEmployeeId: string | null;
	expectedUpdatedAt: string | null;
}

export interface BranchActionResult {
	branch: BranchDetail;
}

export function parseBranchInput(formData: FormData): BranchInput {
	const isActiveValue = String(formData.get('isActive') ?? 'true');

	return {
		code: String(formData.get('code') ?? ''),
		name: String(formData.get('name') ?? ''),
		city: String(formData.get('city') ?? ''),
		address: optionalTrimmed(String(formData.get('address') ?? '')),
		whatsapp: optionalTrimmed(String(formData.get('whatsapp') ?? '')),
		mapsUrl: optionalTrimmed(String(formData.get('mapsUrl') ?? '')),
		openingHours: optionalTrimmed(String(formData.get('openingHours') ?? '')),
		isActive: isActiveValue === 'true' || isActiveValue === 'on' || isActiveValue === '1',
		headEmployeeId: optionalTrimmed(String(formData.get('headEmployeeId') ?? '')),
		expectedUpdatedAt: optionalTrimmed(String(formData.get('expectedUpdatedAt') ?? ''))
	};
}

const BRANCH_SORT_COLUMNS: Record<string, keyof BranchRow> = {
	code: 'code',
	name: 'name',
	city: 'city',
	status: 'is_active',
	createdAt: 'created_at',
	updatedAt: 'updated_at'
};

function mapHeadEmployee(
	employee: EmployeeRow & { position: Pick<PositionRow, 'name'> | null }
): BranchListItem['headEmployee'] {
	return {
		id: employee.id,
		fullName: employee.full_name,
		positionName: employee.position?.name ?? 'Jabatan tidak diketahui',
		status: employee.employment_status
	};
}

function normalizeBranchSearch(value: string): string {
	return value.trim().replace(/[%_,]/g, ' ');
}

async function loadHeadEmployees(
	client: SupabaseClient<Database>,
	headEmployeeIds: string[]
): Promise<Map<string, BranchListItem['headEmployee']>> {
	if (headEmployeeIds.length === 0) {
		return new Map();
	}

	const { data, error } = await client
		.from('employees')
		.select('id, full_name, employment_status, position:positions(name)')
		.in('id', headEmployeeIds);

	if (error || !data) {
		throw error ?? notFoundError();
	}

	return new Map(
		(data as Array<EmployeeRow & { position: Pick<PositionRow, 'name'> | null }>).map((row) => [
			row.id,
			mapHeadEmployee(row)
		])
	);
}

function buildBranchDetail(
	branch: BranchRow,
	headEmployee: BranchListItem['headEmployee'] | null,
	counts: BranchDetail['counts']
): BranchDetail {
	return {
		id: branch.id,
		code: branch.code,
		name: branch.name,
		city: branch.city,
		address: branch.address,
		whatsapp: branch.whatsapp,
		mapsUrl: branch.maps_url,
		openingHours: branch.opening_hours,
		isActive: branch.is_active,
		headEmployee,
		createdAt: branch.created_at,
		updatedAt: branch.updated_at,
		counts
	};
}

export async function listBranches(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	query: ParsedListQuery
): Promise<{
	items: BranchListItem[];
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
}> {
	const page = query.page;
	const pageSize = query.pageSize;
	const offset = (page - 1) * pageSize;
	const sortColumn = BRANCH_SORT_COLUMNS[query.sortField] ?? 'created_at';
	let request = client
		.from('branches')
		.select('id, code, name, city, address, whatsapp, maps_url, opening_hours, is_active, head_employee_id, created_at, updated_at', {
			count: 'exact'
		})
		.order(sortColumn, { ascending: query.sortDirection === 'asc' });

	if (query.search) {
		const search = normalizeBranchSearch(query.search);
		request = request.or(`code.ilike.%${search}%,name.ilike.%${search}%,city.ilike.%${search}%`);
	}

	if (query.branchId) {
		if (auth.role.code !== ROLE_CODES.OWNER && auth.branch?.id !== query.branchId) {
			throw branchAccessDeniedError();
		}

		request = request.eq('id', query.branchId);
	}

	if (query.status) {
		request = request.eq('is_active', query.status === 'active');
	}

	const { data, error, count } = await request.range(offset, offset + pageSize - 1);

	if (error || !data) {
		throw error ?? notFoundError();
	}

	const branches = data as BranchRow[];
	const headEmployeeIds = branches
		.map((branch) => branch.head_employee_id)
		.filter((value): value is string => Boolean(value));
	const headEmployeeMap = await loadHeadEmployees(client, headEmployeeIds);

	const items = branches.map<BranchListItem>((branch) => ({
		id: branch.id,
		code: branch.code,
		name: branch.name,
		city: branch.city,
		address: branch.address,
		whatsapp: branch.whatsapp,
		mapsUrl: branch.maps_url,
		openingHours: branch.opening_hours,
		isActive: branch.is_active,
		headEmployee: branch.head_employee_id ? headEmployeeMap.get(branch.head_employee_id) ?? null : null,
		createdAt: branch.created_at,
		updatedAt: branch.updated_at
	}));

	return {
		items,
		page,
		pageSize,
		total: count ?? items.length,
		totalPages: count ? Math.max(1, Math.ceil(count / pageSize)) : 1
	};
}

export async function getBranchDetail(
	client: SupabaseClient<Database>,
	branchId: string,
	auth: AuthContext
): Promise<BranchDetail> {
	assertBranchAccess(auth, branchId);

	const { data, error } = await client
		.from('branches')
		.select('id, code, name, city, address, whatsapp, maps_url, opening_hours, is_active, head_employee_id, created_at, updated_at')
		.eq('id', branchId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	if (!data) {
		throw notFoundError('Cabang tidak ditemukan.');
	}

	const branch = data as BranchRow;
	const headEmployee = branch.head_employee_id
		? (await loadHeadEmployees(client, [branch.head_employee_id])).get(branch.head_employee_id) ?? null
		: null;

	const [routeCountResult, customerCountResult, storeCountResult, employeeCountResult] = await Promise.all([
		client.from('routes').select('id', { count: 'exact', head: true }).or(
			`origin_branch_id.eq.${branchId},destination_branch_id.eq.${branchId}`
		),
		client.from('customers').select('id', { count: 'exact', head: true }).eq('home_branch_id', branchId),
		client.from('stores').select('id', { count: 'exact', head: true }).eq('branch_id', branchId),
		client.from('employees').select('id', { count: 'exact', head: true }).eq('branch_id', branchId)
	]);

	return buildBranchDetail(branch, headEmployee, {
		routes: routeCountResult.count ?? 0,
		customers: customerCountResult.count ?? 0,
		stores: storeCountResult.count ?? 0,
		employees: employeeCountResult.count ?? 0
	});
}

export async function createBranch(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	input: BranchInput
): Promise<BranchDetail> {
	assertOwner(auth);

	const code = normalizeUppercaseCode(input.code);
	const name = input.name.trim();
	const city = input.city.trim();

	if (!code) {
		throw validationError('Kode cabang wajib diisi.', { code: ['Kode cabang wajib diisi.'] });
	}

	if (!name) {
		throw validationError('Nama cabang wajib diisi.', { name: ['Nama cabang wajib diisi.'] });
	}

	if (!city) {
		throw validationError('Kota wajib diisi.', { city: ['Kota wajib diisi.'] });
	}

	if (input.headEmployeeId) {
		await ensureValidBranchHead(client, null, input.headEmployeeId);
	}

	const { data, error } = await client
		.from('branches')
		.insert({
			code,
			name,
			city,
			address: optionalTrimmed(input.address),
			whatsapp: optionalTrimmed(input.whatsapp),
			maps_url: optionalTrimmed(input.mapsUrl),
			opening_hours: optionalTrimmed(input.openingHours),
			is_active: input.isActive,
			head_employee_id: input.headEmployeeId
		})
		.select('id, code, name, city, address, whatsapp, maps_url, opening_hours, is_active, head_employee_id, created_at, updated_at')
		.single();

	if (error) {
		if (error.code === '23505') {
			throw duplicateResourceError('Kode cabang sudah terdaftar.', {
				code: ['Gunakan kode cabang yang berbeda.']
			});
		}

		throw error;
	}

	return getBranchDetail(client, (data as BranchRow).id, auth);
}

export async function updateBranch(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	branchId: string,
	input: BranchInput
): Promise<BranchDetail> {
	assertOwner(auth);

	const current = await getBranchDetail(client, branchId, auth);

	if (input.expectedUpdatedAt && input.expectedUpdatedAt !== current.updatedAt) {
		throw conflictError();
	}

	const code = normalizeUppercaseCode(input.code);
	const name = input.name.trim();
	const city = input.city.trim();

	if (!code) {
		throw validationError('Kode cabang wajib diisi.', { code: ['Kode cabang wajib diisi.'] });
	}

	if (!name) {
		throw validationError('Nama cabang wajib diisi.', { name: ['Nama cabang wajib diisi.'] });
	}

	if (!city) {
		throw validationError('Kota wajib diisi.', { city: ['Kota wajib diisi.'] });
	}

	if (input.headEmployeeId) {
		await ensureValidBranchHead(client, branchId, input.headEmployeeId);
	}

	const { error } = await client
		.from('branches')
		.update({
			code,
			name,
			city,
			address: optionalTrimmed(input.address),
			whatsapp: optionalTrimmed(input.whatsapp),
			maps_url: optionalTrimmed(input.mapsUrl),
			opening_hours: optionalTrimmed(input.openingHours),
			is_active: input.isActive,
			head_employee_id: input.headEmployeeId
		})
		.eq('id', branchId);

	if (error) {
		if (error.code === '23505') {
			throw duplicateResourceError('Kode cabang sudah terdaftar.', {
				code: ['Gunakan kode cabang yang berbeda.']
			});
		}

		throw error;
	}

	return getBranchDetail(client, branchId, auth);
}

export async function toggleBranchStatus(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	branchId: string,
	isActive: boolean
): Promise<BranchDetail> {
	assertOwner(auth);

	if (!isActive) {
		const [routeCountResult, employeeCountResult, storeCountResult] = await Promise.all([
			client
				.from('routes')
				.select('id', { count: 'exact', head: true })
				.or(`origin_branch_id.eq.${branchId},destination_branch_id.eq.${branchId}`)
				.eq('is_active', true),
			client
				.from('employees')
				.select('id', { count: 'exact', head: true })
				.eq('branch_id', branchId)
				.eq('employment_status', 'active'),
			client
				.from('stores')
				.select('id', { count: 'exact', head: true })
				.eq('branch_id', branchId)
				.eq('is_active', true)
		]);

		if ((routeCountResult.count ?? 0) > 0 || (employeeCountResult.count ?? 0) > 0 || (storeCountResult.count ?? 0) > 0) {
			throw validationError('Cabang masih memiliki dependency aktif dan tidak dapat dinonaktifkan.');
		}
	}

	const { error } = await client.from('branches').update({ is_active: isActive }).eq('id', branchId);

	if (error) {
		throw error;
	}

	return getBranchDetail(client, branchId, auth);
}

async function ensureValidBranchHead(
	client: SupabaseClient<Database>,
	branchId: string | null,
	headEmployeeId: string
): Promise<void> {
	const { data, error } = await client
		.from('employees')
		.select('id, branch_id, employment_status, position:positions(code)')
		.eq('id', headEmployeeId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	if (!data) {
		throw validationError('Kepala cabang tidak ditemukan.', {
			headEmployeeId: ['Karyawan kepala cabang tidak ditemukan.']
		});
	}

	const employee = data as EmployeeRow & { position: Pick<PositionRow, 'code'> | null };

	if (branchId && employee.branch_id !== branchId) {
		throw validationError('Kepala cabang harus berasal dari cabang yang sama.', {
			headEmployeeId: ['Pilih karyawan dari cabang yang sama.']
		});
	}

	if (employee.employment_status !== 'active') {
		throw validationError('Kepala cabang harus aktif.', {
			headEmployeeId: ['Karyawan harus berstatus aktif.']
		});
	}

	if (employee.position?.code !== 'branch_manager') {
		throw validationError('Kepala cabang harus memiliki jabatan branch manager.', {
			headEmployeeId: ['Pilih karyawan dengan jabatan kepala cabang.']
		});
	}
}
