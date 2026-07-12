import type { SupabaseClient } from '@supabase/supabase-js';

import { ROLE_CODES } from '$lib/constants/access';
import type { Database } from '$lib/supabase/database';
import type { AuthContext } from '$lib/types/auth';

import type { EmployeeAssignmentItem, EmployeeDetail } from './employees';
import { normalizeWhitespace, optionalTrimmed, parseDateValue, parseUuidValue } from './format';

export type AssignmentSelectOption = {
	value: string;
	label: string;
};

export type AssignmentFormValues = {
	branchId: string;
	positionId: string;
	supervisorEmployeeId: string;
	effectiveFrom: string;
	reason: string;
	expectedUpdatedAt: string;
};

export type ParsedAssignmentInput = {
	employeeId: string;
	assignmentId: string | null;
	branchId: string;
	positionId: string;
	supervisorEmployeeId: string | null;
	effectiveFrom: string;
	reason: string;
	expectedUpdatedAt: string | null;
	closeEffectiveUntil: string | null;
};

export function canManageAssignmentRoutes(roleCode: string): boolean {
	return roleCode === ROLE_CODES.OWNER || roleCode === ROLE_CODES.BRANCH_MANAGER;
}

function currentMakassarDate(): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar' }).format(new Date());
}

export async function loadAssignmentBranchOptions(
	auth: AuthContext,
	client: SupabaseClient<Database>
): Promise<AssignmentSelectOption[]> {
	if (auth.role.code === ROLE_CODES.OWNER) {
		const { data } = await client
			.from('branches')
			.select('id, code, name, is_active')
			.order('name', { ascending: true });

		return (
			data?.map((branch) => ({
				value: branch.id,
				label: `${branch.code} - ${branch.name}${branch.is_active ? '' : ' (nonaktif)'}`
			})) ?? []
		);
	}

	if (!auth.branch) {
		return [];
	}

	return [
		{
			value: auth.branch.id,
			label: `${auth.branch.code} - ${auth.branch.name}`
		}
	];
}

export async function loadAssignmentPositionOptions(
	client: SupabaseClient<Database>
): Promise<AssignmentSelectOption[]> {
	const { data } = await client
		.from('positions')
		.select('id, code, name, is_active')
		.order('name', { ascending: true });

	const positions = (data ?? []) as unknown as Array<{
		id: string;
		code: string;
		name: string;
		is_active: boolean | null;
	}>;

	return (
		positions
			.filter((position) => position.is_active !== false)
			.map((position) => ({
				value: position.id,
				label: `${position.code} - ${position.name}`
			}))
	);
}

export async function loadAssignmentSupervisorOptions(
	client: SupabaseClient<Database>,
	branchId: string,
	employeeId: string
): Promise<AssignmentSelectOption[]> {
	const { data } = await client
		.from('employees')
		.select('id, full_name, employment_status, position:positions(code, is_active)')
		.eq('branch_id', branchId)
		.eq('employment_status', 'active')
		.neq('id', employeeId)
		.order('full_name', { ascending: true });

	const employees = (data ?? []) as Array<{
		id: string;
		full_name: string;
		employment_status: string;
		position: { code?: string; is_active?: boolean } | null;
	}>;

	return (
		employees
			.filter((employee) => {
				const position = employee.position as { code?: string; is_active?: boolean } | null;
				return position?.is_active === true && position.code === 'branch_manager';
			})
			.map((employee) => ({
				value: employee.id,
				label: employee.full_name
			}))
	);
}

export function buildAssignmentDefaults(
	employee: EmployeeDetail,
	assignment: EmployeeAssignmentItem | null = employee.assignments.find((item) => item.isCurrent) ?? null
): AssignmentFormValues {
	const branchId = assignment?.branch?.id ?? employee.branch?.id ?? '';
	const positionId = assignment?.position?.id ?? employee.position?.id ?? '';
	const supervisorEmployeeId = assignment?.supervisor?.id ?? employee.supervisor?.id ?? '';

	return {
		branchId,
		positionId,
		supervisorEmployeeId,
		effectiveFrom: currentMakassarDate(),
		reason: assignment ? 'Penempatan diperbarui' : 'Penempatan awal',
		expectedUpdatedAt: employee.updatedAt
	};
}

export function buildAssignmentEditDefaults(
	employee: EmployeeDetail,
	assignment: EmployeeAssignmentItem
): AssignmentFormValues {
	return {
		branchId: assignment.branch?.id ?? employee.branch?.id ?? '',
		positionId: assignment.position?.id ?? employee.position?.id ?? '',
		supervisorEmployeeId: assignment.supervisor?.id ?? employee.supervisor?.id ?? '',
		effectiveFrom: assignment.effectiveFrom,
		reason: assignment.reason,
		expectedUpdatedAt: assignment.updatedAt
	};
}

export function parseAssignmentFormData(formData: FormData): ParsedAssignmentInput {
	return {
		employeeId: parseUuidValue(String(formData.get('employeeId') ?? ''), 'Karyawan'),
		assignmentId: optionalTrimmed(String(formData.get('assignmentId') ?? '')),
		branchId: parseUuidValue(String(formData.get('branchId') ?? ''), 'Cabang'),
		positionId: parseUuidValue(String(formData.get('positionId') ?? ''), 'Jabatan'),
		supervisorEmployeeId: optionalTrimmed(String(formData.get('supervisorEmployeeId') ?? '')),
		effectiveFrom: parseDateValue(String(formData.get('effectiveFrom') ?? ''), 'Tanggal mulai'),
		reason: normalizeWhitespace(String(formData.get('reason') ?? '')),
		expectedUpdatedAt: optionalTrimmed(String(formData.get('expectedUpdatedAt') ?? '')),
		closeEffectiveUntil: optionalTrimmed(String(formData.get('closeEffectiveUntil') ?? ''))
	};
}
