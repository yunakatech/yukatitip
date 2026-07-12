import type { SupabaseClient } from '@supabase/supabase-js';

import type { Json, Database } from '$lib/supabase/database';

import {
	conflictError,
	duplicateResourceError,
	notFoundError,
	type MasterDataError,
	validationError
} from './errors';

export type EmployeeAssignmentRpcAction =
	| 'create_employee'
	| 'update_employee'
	| 'create_assignment'
	| 'transfer_assignment'
	| 'correct_assignment'
	| 'close_assignment';

export interface EmployeeAssignmentRpcPayload {
	employeeId?: string | null;
	assignmentId?: string | null;
	branchId?: string | null;
	positionId?: string | null;
	supervisorEmployeeId?: string | null;
	employeeNumber?: string | null;
	fullName?: string | null;
	phone?: string | null;
	email?: string | null;
	address?: string | null;
	joinDate?: string | null;
	bankName?: string | null;
	bankAccount?: string | null;
	notes?: string | null;
	employmentStatus?: string | null;
	effectiveFrom?: string | null;
	effectiveUntil?: string | null;
	reason?: string | null;
	expectedUpdatedAt?: string | null;
	closeEffectiveUntil?: string | null;
}

interface ApplyEmployeeAssignmentArgs {
	action: EmployeeAssignmentRpcAction;
	payload: Json;
	actor_profile_id: string;
	request_id: string;
	ip_address?: string | null;
	user_agent?: string | null;
}

interface EmployeeAssignmentRpcResultNode {
	id?: string;
}

interface ApplyEmployeeAssignmentResult {
	employee?: EmployeeAssignmentRpcResultNode | null;
	assignment?: EmployeeAssignmentRpcResultNode | null;
}

type DatabaseWithAssignmentRpc = Omit<Database, 'public'> & {
	public: Omit<Database['public'], 'Functions'> & {
		Functions: {
			apply_employee_assignment: {
				Args: ApplyEmployeeAssignmentArgs;
				Returns: Json;
			};
		};
	};
};

function toNullableString(value: string | null | undefined): string | null {
	if (value === undefined || value === null) {
		return null;
	}

	const trimmed = value.trim();
	return trimmed ? trimmed : null;
}

function readNodeId(node: unknown): string | null {
	if (!node || typeof node !== 'object') {
		return null;
	}

	const maybeId = (node as EmployeeAssignmentRpcResultNode).id;
	return typeof maybeId === 'string' && maybeId ? maybeId : null;
}

function mapEmployeeAssignmentRpcError(error: { code?: string | null; message: string }): MasterDataError {
	switch (error.code) {
		case '40001':
			return conflictError();
		case '23505':
			return duplicateResourceError('Data dengan nilai tersebut sudah ada.');
		case '23503':
			return validationError('Relasi data tidak valid.');
		case 'P0001':
			return validationError(error.message);
		case 'P0002':
			return notFoundError(error.message);
		default:
			return validationError('Gagal menyimpan perubahan.');
	}
}

export function buildEmployeeAssignmentRpcPayload(payload: EmployeeAssignmentRpcPayload): Json {
	return {
		employeeId: toNullableString(payload.employeeId),
		assignmentId: toNullableString(payload.assignmentId),
		branchId: toNullableString(payload.branchId),
		positionId: toNullableString(payload.positionId),
		supervisorEmployeeId: toNullableString(payload.supervisorEmployeeId),
		employeeNumber: toNullableString(payload.employeeNumber),
		fullName: toNullableString(payload.fullName),
		phone: toNullableString(payload.phone),
		email: toNullableString(payload.email),
		address: toNullableString(payload.address),
		joinDate: toNullableString(payload.joinDate),
		bankName: toNullableString(payload.bankName),
		bankAccount: toNullableString(payload.bankAccount),
		notes: toNullableString(payload.notes),
		employmentStatus: toNullableString(payload.employmentStatus),
		effectiveFrom: toNullableString(payload.effectiveFrom),
		effectiveUntil: toNullableString(payload.effectiveUntil),
		reason: toNullableString(payload.reason),
		expectedUpdatedAt: toNullableString(payload.expectedUpdatedAt),
		closeEffectiveUntil: toNullableString(payload.closeEffectiveUntil)
	} satisfies Json;
}

export async function applyEmployeeAssignmentRpc(
	client: SupabaseClient<Database>,
	args: {
		action: EmployeeAssignmentRpcAction;
		payload: EmployeeAssignmentRpcPayload;
		actorProfileId: string;
		requestId: string;
		ipAddress?: string | null;
		userAgent?: string | null;
	}
): Promise<{
	employeeId: string;
	assignmentId: string | null;
}> {
	const rpcClient = client as unknown as SupabaseClient<DatabaseWithAssignmentRpc>;
	const { data, error } = await rpcClient.rpc('apply_employee_assignment', {
		action: args.action,
		payload: buildEmployeeAssignmentRpcPayload(args.payload),
		actor_profile_id: args.actorProfileId,
		request_id: args.requestId,
		ip_address: args.ipAddress ?? null,
		user_agent: args.userAgent ?? null
	} as never);

	if (error) {
		throw mapEmployeeAssignmentRpcError(error);
	}

	const result = data as ApplyEmployeeAssignmentResult | null;
	const employeeId = readNodeId(result?.employee);

	if (!employeeId) {
		throw validationError('RPC penempatan tidak mengembalikan data karyawan.');
	}

	return {
		employeeId,
		assignmentId: readNodeId(result?.assignment)
	};
}
