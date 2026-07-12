import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

import { ROLE_CODES } from '$lib/constants/access';
import type { AuthContext } from '$lib/types/auth';
import type { Database } from '$lib/supabase/database';

import { createEmployee, updateEmployee } from './employees';

type BranchRow = Database['public']['Tables']['branches']['Row'];
type PositionRow = Database['public']['Tables']['positions']['Row'] & {
	is_active: boolean;
	updated_at: string;
};
type EmployeeRow = Database['public']['Tables']['employees']['Row'];
type EmployeeAssignmentRow = Database['public']['Tables']['employee_assignments']['Row'] & {
	supervisor_employee_id: string | null;
	reason: string;
	created_by: string | null;
	updated_by: string | null;
	updated_at: string;
};

type MockState = {
	branches: Record<string, BranchRow>;
	positions: Record<string, PositionRow>;
	profiles: Record<string, { id: string; full_name: string }>;
	employees: Record<string, EmployeeRow>;
	employeeAssignments: EmployeeAssignmentRow[];
	insertedAssignments: EmployeeAssignmentRow[];
	updatedAssignments: Array<{ id: string; payload: Partial<EmployeeAssignmentRow> }>;
	rpcCalls: Array<{ action: string; payload: Record<string, unknown> }>;
	nextEmployeeId: number;
	nextAssignmentId: number;
};

type MockQueryBuilder = {
	select: (...args: Array<string | Record<string, unknown> | undefined>) => MockQueryBuilder;
	insert: (payload: Record<string, unknown>) => MockQueryBuilder;
	update: (payload: Record<string, unknown>) => MockQueryBuilder;
	delete: () => MockQueryBuilder;
	eq: (column: string, value: unknown) => MockQueryBuilder;
	in: (column: string, value: unknown) => MockQueryBuilder;
	order: (...args: unknown[]) => MockQueryBuilder;
	range: (...args: unknown[]) => Promise<{ data: Array<Record<string, unknown>>; error: null; count: number }>;
	maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: null }>;
	single: () => Promise<{ data: Record<string, unknown> | null; error: null }>;
	then: PromiseLike<unknown>['then'];
};

function nowDate(): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar' }).format(new Date());
}

function previousDate(value: string): string {
	const date = new Date(`${value}T00:00:00Z`);
	date.setUTCDate(date.getUTCDate() - 1);
	return date.toISOString().slice(0, 10);
}

function createAuthContext(): AuthContext {
	return {
		user: {
			id: '30000000-0000-4000-8000-000000000001',
			email: 'owner@yukatitip.local'
		},
		profile: {
			id: '30000000-0000-4000-8000-000000000001',
			fullName: 'Yunaka Owner',
			phone: null,
			status: 'active',
			role: {
				id: '10000000-0000-4000-8000-000000000001',
				code: ROLE_CODES.OWNER,
				name: 'Owner'
			},
			branch: null,
			permissions: []
		},
		role: {
			id: '10000000-0000-4000-8000-000000000001',
			code: ROLE_CODES.OWNER,
			name: 'Owner'
		},
		branch: null,
		permissions: []
	};
}

function createMockClient(state: MockState): SupabaseClient<Database> {
	function cloneBranch(row: BranchRow): BranchRow {
		return { ...row };
	}

	function clonePosition(row: PositionRow): PositionRow {
		return { ...row };
	}

	function cloneEmployee(row: EmployeeRow): EmployeeRow {
		return { ...row };
	}

	function cloneAssignment(row: EmployeeAssignmentRow): EmployeeAssignmentRow {
		return { ...row };
	}

	function getSelectRows(table: string, filters: Record<string, unknown>): Array<Record<string, unknown>> {
		if (table === 'branches') {
			const ids = filters.id;
			const rows = Object.values(state.branches).map(cloneBranch);
			if (Array.isArray(ids)) {
				return rows.filter((row) => ids.includes(row.id));
			}
			if (typeof ids === 'string') {
				return rows.filter((row) => row.id === ids);
			}
			return rows;
		}

		if (table === 'positions') {
			const ids = filters.id;
			const rows = Object.values(state.positions).map(clonePosition);
			if (Array.isArray(ids)) {
				return rows.filter((row) => ids.includes(row.id));
			}
			if (typeof ids === 'string') {
				return rows.filter((row) => row.id === ids);
			}
			return rows;
		}

		if (table === 'profiles') {
			const ids = filters.id;
			const rows = Object.values(state.profiles).map((profile) => ({ ...profile }));
			if (typeof ids === 'string') {
				return rows.filter((row) => row.id === ids);
			}
			if (Array.isArray(ids)) {
				return rows.filter((row) => ids.includes(row.id));
			}
			return rows;
		}

		if (table === 'employees') {
			const rows = Object.values(state.employees).map((employee) => ({
				...cloneEmployee(employee),
				position: state.positions[employee.position_id]
					? {
							code: state.positions[employee.position_id].code,
							is_active: state.positions[employee.position_id].is_active
						}
					: null
			}));
			if (typeof filters.id === 'string') {
				return rows.filter((row) => row.id === filters.id);
			}
			if (typeof filters.branch_id === 'string') {
				return rows.filter((row) => row.branch_id === filters.branch_id);
			}
			return rows;
		}

		if (table === 'employee_assignments') {
			let rows = state.employeeAssignments.map(cloneAssignment);
			if (typeof filters.employee_id === 'string') {
				rows = rows.filter((row) => row.employee_id === filters.employee_id);
			}
			return rows.sort((left, right) => {
				if (left.effective_from !== right.effective_from) {
					return left.effective_from < right.effective_from ? 1 : -1;
				}

				if (left.created_at !== right.created_at) {
					return left.created_at < right.created_at ? 1 : -1;
				}

				return 0;
			});
		}

		return [];
	}

	function getSingleRow(table: string, filters: Record<string, unknown>): Record<string, unknown> | null {
		const rows = getSelectRows(table, filters);
		return rows[0] ?? null;
	}

	function applyInsert(table: string, payload: Record<string, unknown>): Record<string, unknown> {
		if (table === 'employees') {
			const id = `40000000-0000-4000-8000-${String(state.nextEmployeeId++).padStart(12, '0')}`;
			const row: EmployeeRow = {
				id,
				employee_number: String(payload.employee_number),
				profile_id: null,
				full_name: String(payload.full_name),
				phone: (payload.phone as string | null | undefined) ?? null,
				email: (payload.email as string | null | undefined) ?? null,
				address: (payload.address as string | null | undefined) ?? null,
				branch_id: String(payload.branch_id),
				position_id: String(payload.position_id),
				supervisor_employee_id: (payload.supervisor_employee_id as string | null | undefined) ?? null,
				join_date: String(payload.join_date),
				employment_status: (payload.employment_status as EmployeeRow['employment_status']) ?? 'active',
				bank_name: (payload.bank_name as string | null | undefined) ?? null,
				bank_account: (payload.bank_account as string | null | undefined) ?? null,
				notes: (payload.notes as string | null | undefined) ?? null,
				created_at: '2026-07-12T00:00:00Z',
				updated_at: '2026-07-12T00:00:00Z'
			};
			state.employees[id] = row;
			return row;
		}

		if (table === 'employee_assignments') {
			const id = `50000000-0000-4000-8000-${String(state.nextAssignmentId++).padStart(12, '0')}`;
			const row: EmployeeAssignmentRow = {
				id,
				employee_id: String(payload.employee_id),
				branch_id: String(payload.branch_id),
				position_id: String(payload.position_id),
				supervisor_employee_id:
					(payload.supervisor_employee_id as string | null | undefined) ?? null,
				effective_from: String(payload.effective_from),
				effective_until: (payload.effective_until as string | null | undefined) ?? null,
				reason: String(payload.reason ?? ''),
				created_by: (payload.created_by as string | null | undefined) ?? null,
				updated_by: (payload.updated_by as string | null | undefined) ?? null,
				created_at: '2026-07-12T00:00:00Z',
				updated_at: '2026-07-12T00:00:00Z'
			};
			state.employeeAssignments.push(row);
			state.insertedAssignments.push(row);
			return row;
		}

		return {};
	}

	function applyUpdate(table: string, filters: Record<string, unknown>, payload: Record<string, unknown>): void {
		if (table === 'employees' && typeof filters.id === 'string') {
			const current = state.employees[filters.id];
			if (current) {
				state.employees[filters.id] = {
					...current,
					...payload,
					updated_at: '2026-07-12T00:00:00Z'
				};
			}
			return;
		}

		if (table === 'employee_assignments' && typeof filters.id === 'string') {
			state.employeeAssignments = state.employeeAssignments.map((row) => {
				if (row.id !== filters.id) {
					return row;
				}

				const nextRow = {
					...row,
					...payload,
					updated_at: '2026-07-12T00:00:00Z'
				} as EmployeeAssignmentRow;
				state.updatedAssignments.push({ id: row.id, payload });
				return nextRow;
			});
		}
	}

	function applyDelete(table: string, filters: Record<string, unknown>): void {
		if (table === 'employees' && typeof filters.id === 'string') {
			delete state.employees[filters.id];
		}
	}

	function readString(value: unknown): string | null {
		if (typeof value === 'string' && value.trim()) {
			return value;
		}

		return null;
	}

	function getCurrentAssignment(employeeId: string): EmployeeAssignmentRow | null {
		const assignments = state.employeeAssignments
			.filter((assignment) => assignment.employee_id === employeeId && assignment.effective_until === null)
			.sort((left, right) => {
				if (left.effective_from !== right.effective_from) {
					return left.effective_from < right.effective_from ? 1 : -1;
				}

				if (left.created_at !== right.created_at) {
					return left.created_at < right.created_at ? 1 : -1;
				}

				return 0;
			});

		return assignments[0] ?? null;
	}

	function nextAssignmentRow(payload: {
		employeeId: string;
		branchId: string;
		positionId: string;
		supervisorEmployeeId: string | null;
		effectiveFrom: string;
		effectiveUntil: string | null;
		reason: string;
		actorProfileId: string;
	}): EmployeeAssignmentRow {
		const row: EmployeeAssignmentRow = {
			id: `50000000-0000-4000-8000-${String(state.nextAssignmentId++).padStart(12, '0')}`,
			employee_id: payload.employeeId,
			branch_id: payload.branchId,
			position_id: payload.positionId,
			supervisor_employee_id: payload.supervisorEmployeeId,
			effective_from: payload.effectiveFrom,
			effective_until: payload.effectiveUntil,
			reason: payload.reason,
			created_by: payload.actorProfileId,
			updated_by: payload.actorProfileId,
			created_at: '2026-07-12T00:00:00Z',
			updated_at: '2026-07-12T00:00:00Z'
		};

		state.employeeAssignments.push(row);
		state.insertedAssignments.push(row);
		return row;
	}

	function updateAssignmentRow(
		row: EmployeeAssignmentRow,
		payload: Partial<EmployeeAssignmentRow> & { updated_by?: string | null }
	): EmployeeAssignmentRow {
		const nextRow = {
			...row,
			...payload,
			updated_at: '2026-07-12T00:00:00Z'
		} as EmployeeAssignmentRow;

		state.employeeAssignments = state.employeeAssignments.map((assignment) =>
			assignment.id === row.id ? nextRow : assignment
		);
		state.updatedAssignments.push({ id: row.id, payload });
		return nextRow;
	}

	function syncEmployeeFromAssignment(
		employeeId: string,
		payload: {
			employeeNumber?: string | null;
			fullName?: string | null;
			phone?: string | null;
			email?: string | null;
			address?: string | null;
			branchId?: string | null;
			positionId?: string | null;
			supervisorEmployeeId?: string | null;
			joinDate?: string | null;
			bankName?: string | null;
			bankAccount?: string | null;
			notes?: string | null;
			employmentStatus?: string | null;
		}
	): EmployeeRow {
		const current = state.employees[employeeId];
		if (!current) {
			throw { code: 'P0002', message: 'Karyawan tidak ditemukan.' };
		}

		const nextRow: EmployeeRow = {
			...current,
			employee_number: payload.employeeNumber ?? current.employee_number,
			full_name: payload.fullName ?? current.full_name,
			phone: (payload.phone as string | null | undefined) ?? current.phone,
			email: (payload.email as string | null | undefined) ?? current.email,
			address: (payload.address as string | null | undefined) ?? current.address,
			branch_id: payload.branchId ?? current.branch_id,
			position_id: payload.positionId ?? current.position_id,
			supervisor_employee_id:
				(payload.supervisorEmployeeId as string | null | undefined) ?? current.supervisor_employee_id,
			join_date: payload.joinDate ?? current.join_date,
			employment_status: (payload.employmentStatus as EmployeeRow['employment_status']) ?? current.employment_status,
			bank_name: (payload.bankName as string | null | undefined) ?? current.bank_name,
			bank_account: (payload.bankAccount as string | null | undefined) ?? current.bank_account,
			notes: (payload.notes as string | null | undefined) ?? current.notes,
			updated_at: '2026-07-12T00:00:00Z'
		};

		state.employees[employeeId] = nextRow;
		return nextRow;
	}

	function makeError(code: string, message: string) {
		return { code, message };
	}

	function rpcResult(employeeId: string, assignmentId: string | null = null) {
		return {
			data: {
				employee: { id: employeeId },
				assignment: assignmentId ? { id: assignmentId } : null
			},
			error: null
		};
	}

	async function rpc(functionName: string, args: Record<string, unknown>) {
		if (functionName !== 'apply_employee_assignment') {
			return {
				data: null,
				error: makeError('42883', `Function ${functionName} not found`)
			};
		}

		state.rpcCalls.push({
			action: String(args.action ?? ''),
			payload: {
				...args
			}
		});

		const action = String(args.action ?? '');
		const payload = (args.payload as Record<string, unknown>) ?? {};
		const actorProfileId = readString(args.actor_profile_id) ?? '30000000-0000-4000-8000-000000000001';
		const employeeId = readString(payload.employeeId);
		const assignmentId = readString(payload.assignmentId);
		const branchId = readString(payload.branchId);
		const positionId = readString(payload.positionId);
		const supervisorEmployeeId = readString(payload.supervisorEmployeeId);
		const employeeNumber = readString(payload.employeeNumber);
		const fullName = readString(payload.fullName);
		const phone = readString(payload.phone);
		const email = readString(payload.email);
		const address = readString(payload.address);
		const joinDate = readString(payload.joinDate);
		const bankName = readString(payload.bankName);
		const bankAccount = readString(payload.bankAccount);
		const notes = readString(payload.notes);
		const employmentStatus = readString(payload.employmentStatus) as EmployeeRow['employment_status'] | null;
		const effectiveFrom = readString(payload.effectiveFrom);
		const effectiveUntil = readString(payload.effectiveUntil);
		const reason = readString(payload.reason);
		const closeEffectiveUntil = readString(payload.closeEffectiveUntil);
		const currentDate = nowDate();
		const yesterday = previousDate(currentDate);

		try {
			if (action === 'create_employee') {
				if (!employeeNumber || !fullName || !branchId || !positionId || !joinDate) {
					return {
						data: null,
						error: makeError('P0001', 'Data karyawan tidak lengkap.')
					};
				}

				const employee = applyInsert('employees', {
					employee_number: employeeNumber,
					full_name: fullName,
					phone,
					email,
					address,
					branch_id: branchId,
					position_id: positionId,
					supervisor_employee_id: supervisorEmployeeId,
					join_date: joinDate,
					employment_status: employmentStatus ?? 'active',
					bank_name: bankName,
					bank_account: bankAccount,
					notes
				}) as EmployeeRow;

				const assignment = nextAssignmentRow({
					employeeId: employee.id,
					branchId,
					positionId,
					supervisorEmployeeId,
					effectiveFrom: joinDate,
					effectiveUntil: null,
					reason: reason ?? 'Penempatan awal',
					actorProfileId
				});

				return rpcResult(employee.id, assignment.id);
			}

			if (action === 'update_employee') {
				if (!employeeId || !employeeNumber || !fullName || !branchId || !positionId || !joinDate) {
					return {
						data: null,
						error: makeError('P0001', 'Data karyawan tidak lengkap.')
					};
				}

				const employee = syncEmployeeFromAssignment(employeeId, {
					employeeNumber,
					fullName,
					phone,
					email,
					address,
					branchId,
					positionId,
					supervisorEmployeeId,
					joinDate,
					bankName,
					bankAccount,
					notes,
					employmentStatus: employmentStatus ?? undefined
				});

				const currentAssignment = getCurrentAssignment(employee.id);

				if (!currentAssignment) {
					const assignment = nextAssignmentRow({
						employeeId: employee.id,
						branchId,
						positionId,
						supervisorEmployeeId,
						effectiveFrom: currentDate,
						effectiveUntil: null,
						reason: reason ?? 'Penempatan awal',
						actorProfileId
					});

					return rpcResult(employee.id, assignment.id);
				}

				const sameScope =
					currentAssignment.branch_id === branchId &&
					currentAssignment.position_id === positionId &&
					(currentAssignment.supervisor_employee_id ?? null) === (supervisorEmployeeId ?? null);

				if (!sameScope) {
					updateAssignmentRow(currentAssignment, {
						effective_until: yesterday,
						updated_by: actorProfileId
					});

					const assignment = nextAssignmentRow({
						employeeId: employee.id,
						branchId,
						positionId,
						supervisorEmployeeId,
						effectiveFrom: currentDate,
						effectiveUntil: null,
						reason: reason ?? 'Penempatan diperbarui',
						actorProfileId
					});

					return rpcResult(employee.id, assignment.id);
				}

				updateAssignmentRow(currentAssignment, {
					reason: reason ?? currentAssignment.reason,
					updated_by: actorProfileId
				});

				return rpcResult(employee.id, currentAssignment.id);
			}

			if (action === 'create_assignment' || action === 'transfer_assignment') {
				if (!employeeId || !branchId || !positionId || !effectiveFrom || !reason) {
					return {
						data: null,
						error: makeError('P0001', 'Data penempatan tidak lengkap.')
					};
				}

				const employee = state.employees[employeeId];

				if (!employee) {
					return {
						data: null,
						error: makeError('P0002', 'Karyawan tidak ditemukan.')
					};
				}

				const currentAssignment = getCurrentAssignment(employeeId);

				if (action === 'transfer_assignment' && !currentAssignment) {
					return {
						data: null,
						error: makeError('P0001', 'Karyawan belum memiliki assignment aktif.')
					};
				}

				if (currentAssignment) {
					updateAssignmentRow(currentAssignment, {
						effective_until: previousDate(effectiveFrom),
						updated_by: actorProfileId
					});
				}

				const assignment = nextAssignmentRow({
					employeeId,
					branchId,
					positionId,
					supervisorEmployeeId,
					effectiveFrom,
					effectiveUntil: effectiveUntil ?? null,
					reason,
					actorProfileId
				});

				syncEmployeeFromAssignment(employeeId, {
					branchId,
					positionId,
					supervisorEmployeeId
				});

				return rpcResult(employeeId, assignment.id);
			}

			if (action === 'correct_assignment') {
				if (!employeeId || !assignmentId) {
					return {
						data: null,
						error: makeError('P0001', 'Data penempatan tidak lengkap.')
					};
				}

				const target = state.employeeAssignments.find(
					(assignment) => assignment.id === assignmentId && assignment.employee_id === employeeId
				);

				if (!target) {
					return {
						data: null,
						error: makeError('P0002', 'Assignment tidak ditemukan.')
					};
				}

				if (target.effective_until && target.effective_until < currentDate) {
					return {
						data: null,
						error: makeError('P0001', 'Assignment historis yang sudah efektif tidak dapat diubah.')
					};
				}

				const updatedAssignment = updateAssignmentRow(target, {
					branch_id: branchId ?? target.branch_id,
					position_id: positionId ?? target.position_id,
					supervisor_employee_id: supervisorEmployeeId ?? target.supervisor_employee_id,
					effective_from: effectiveFrom ?? target.effective_from,
					effective_until: effectiveUntil ?? target.effective_until,
					reason: reason ?? target.reason,
					updated_by: actorProfileId
				});

				if (updatedAssignment.effective_until === null) {
					syncEmployeeFromAssignment(employeeId, {
						branchId: updatedAssignment.branch_id,
						positionId: updatedAssignment.position_id,
						supervisorEmployeeId: updatedAssignment.supervisor_employee_id
					});
				}

				return rpcResult(employeeId, assignmentId);
			}

			if (action === 'close_assignment') {
				if (!employeeId || !assignmentId) {
					return {
						data: null,
						error: makeError('P0001', 'Data penempatan tidak lengkap.')
					};
				}

				const target = state.employeeAssignments.find(
					(assignment) => assignment.id === assignmentId && assignment.employee_id === employeeId
				);

				if (!target) {
					return {
						data: null,
						error: makeError('P0002', 'Assignment tidak ditemukan.')
					};
				}

				const closedAssignment = updateAssignmentRow(target, {
					effective_until: closeEffectiveUntil ?? currentDate,
					updated_by: actorProfileId
				});

				syncEmployeeFromAssignment(employeeId, {
					employmentStatus: (readString(payload.employmentStatus) as EmployeeRow['employment_status'] | null) ?? 'inactive'
				});

				return rpcResult(employeeId, closedAssignment.id);
			}

			return {
				data: null,
				error: makeError('P0001', 'Aksi penempatan tidak valid.')
			};
		} catch (error) {
			if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
				return {
					data: null,
					error: error as { code: string; message: string }
				};
			}

			throw error;
		}
	}

	function buildQuery(table: string) {
		const filters: Record<string, unknown> = {};
		let operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
		let payload: Record<string, unknown> = {};

		const query: MockQueryBuilder = {
			select: (...args: Array<string | Record<string, unknown> | undefined>) => {
				void args;
				return query;
			},
			insert: (nextPayload: Record<string, unknown>) => {
				operation = 'insert';
				payload = nextPayload;
				return query;
			},
			update: (nextPayload: Record<string, unknown>) => {
				operation = 'update';
				payload = nextPayload;
				return query;
			},
			delete: () => {
				operation = 'delete';
				return query;
			},
			eq: (column: string, value: unknown) => {
				filters[column] = value;
				return query;
			},
			in: (column: string, value: unknown) => {
				filters[column] = value;
				return query;
			},
			order: (...args: unknown[]) => {
				void args;
				return query;
			},
			range: async (...args: unknown[]) => {
				void args;
				const rows = getSelectRows(table, filters);
				return {
					data: rows,
					error: null,
					count: rows.length
				};
			},
			maybeSingle: async () => ({
				data: getSingleRow(table, filters),
				error: null
			}),
			single: async () => {
				if (operation === 'insert') {
					const row = applyInsert(table, payload);
					return { data: { id: row.id }, error: null };
				}

				const row = getSingleRow(table, filters);
				return { data: row, error: null };
			},
			then: ((resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => {
				try {
					if (operation === 'insert') {
						applyInsert(table, payload);
						return Promise.resolve({ data: null, error: null }).then(resolve, reject);
					}

					if (operation === 'update') {
						applyUpdate(table, filters, payload);
						return Promise.resolve({ data: null, error: null }).then(resolve, reject);
					}

					if (operation === 'delete') {
						applyDelete(table, filters);
						return Promise.resolve({ data: null, error: null }).then(resolve, reject);
					}

					return Promise.resolve({
						data: getSelectRows(table, filters),
						error: null,
						count: getSelectRows(table, filters).length
					}).then(resolve, reject);
				} catch (error) {
					return Promise.reject(error).then(resolve, reject);
				}
			}) as PromiseLike<unknown>['then']
		};

		return query;
	}

	return {
		from: (table: string) => buildQuery(table),
		rpc
	} as unknown as SupabaseClient<Database>;
}

function buildState(): MockState {
	return {
		branches: {
			'20000000-0000-4000-8000-000000000001': {
				id: '20000000-0000-4000-8000-000000000001',
				code: 'MKS',
				name: 'Yukatitip Makassar',
				city: 'Makassar',
				address: null,
				whatsapp: null,
				maps_url: null,
				opening_hours: null,
				is_active: true,
				head_employee_id: null,
				created_at: '2026-07-01T00:00:00Z',
				updated_at: '2026-07-01T00:00:00Z'
			},
			'20000000-0000-4000-8000-000000000002': {
				id: '20000000-0000-4000-8000-000000000002',
				code: 'PIN',
				name: 'Yukatitip Pinrang',
				city: 'Pinrang',
				address: null,
				whatsapp: null,
				maps_url: null,
				opening_hours: null,
				is_active: true,
				head_employee_id: null,
				created_at: '2026-07-01T00:00:00Z',
				updated_at: '2026-07-01T00:00:00Z'
			}
		},
		positions: {
			'12000000-0000-4000-8000-000000000001': {
				id: '12000000-0000-4000-8000-000000000001',
				code: 'OPS',
				name: 'Petugas Operasional',
				level: 1,
				description: null,
				is_active: true,
				created_at: '2026-07-01T00:00:00Z',
				updated_at: '2026-07-01T00:00:00Z'
			},
			'12000000-0000-4000-8000-000000000002': {
				id: '12000000-0000-4000-8000-000000000002',
				code: 'BRM',
				name: 'Branch Manager',
				level: 2,
				description: null,
				is_active: true,
				created_at: '2026-07-01T00:00:00Z',
				updated_at: '2026-07-01T00:00:00Z'
			}
		},
		profiles: {
			'30000000-0000-4000-8000-000000000001': {
				id: '30000000-0000-4000-8000-000000000001',
				full_name: 'Yunaka Owner'
			}
		},
		employees: {},
		employeeAssignments: [],
		insertedAssignments: [],
		updatedAssignments: [],
		rpcCalls: [],
		nextEmployeeId: 1,
		nextAssignmentId: 1
	};
}

describe('master data employee assignments', () => {
	it('creates the initial assignment when a new employee is created', async () => {
		const state = buildState();
		const client = createMockClient(state);
		const auth = createAuthContext();

		const employee = await createEmployee(client, auth, {
			employeeNumber: 'EMP-001',
			fullName: 'Sari Makassar',
			phone: '08123456789',
			email: 'sari@example.com',
			address: 'Jl. Pelabuhan',
			branchId: '20000000-0000-4000-8000-000000000001',
			positionId: '12000000-0000-4000-8000-000000000002',
			supervisorEmployeeId: null,
			joinDate: '2026-07-10',
			bankName: 'Bank Sulselbar',
			bankAccount: '1234567890',
			notes: 'Shift pagi',
			employmentStatus: 'active',
			expectedUpdatedAt: null
		});

		expect(employee.assignments).toHaveLength(1);
		expect(employee.assignments[0]).toMatchObject({
			branch: {
				id: '20000000-0000-4000-8000-000000000001',
				code: 'MKS',
				name: 'Yukatitip Makassar'
			},
			position: {
				id: '12000000-0000-4000-8000-000000000002',
				code: 'BRM',
				name: 'Branch Manager'
			},
			reason: 'Penempatan awal',
			actor: {
				id: '30000000-0000-4000-8000-000000000001',
				fullName: 'Yunaka Owner'
			},
			effectiveFrom: '2026-07-10',
			effectiveUntil: null,
			updatedAt: '2026-07-12T00:00:00Z',
			isCurrent: true
		});

		expect(state.employeeAssignments).toHaveLength(1);
		expect(state.insertedAssignments[0]).toMatchObject({
			employee_id: employee.id,
			branch_id: '20000000-0000-4000-8000-000000000001',
			position_id: '12000000-0000-4000-8000-000000000002',
			supervisor_employee_id: null,
			effective_from: '2026-07-10',
			reason: 'Penempatan awal',
			created_by: '30000000-0000-4000-8000-000000000001',
			updated_by: '30000000-0000-4000-8000-000000000001'
		});
	});

	it('moves assignment history forward when branch and position change', async () => {
		const state = buildState();
		const employeeId = '40000000-0000-4000-8000-000000000001';
		state.employees[employeeId] = {
			id: employeeId,
			employee_number: 'EMP-002',
			profile_id: null,
			full_name: 'Dian Pinrang',
			phone: '08123450000',
			email: 'dian@example.com',
			address: 'Jl. Pasar',
			branch_id: '20000000-0000-4000-8000-000000000001',
			position_id: '12000000-0000-4000-8000-000000000001',
			supervisor_employee_id: null,
			join_date: '2026-07-01',
			employment_status: 'active',
			bank_name: 'Bank Sulselbar',
			bank_account: '5555555555',
			notes: null,
			created_at: '2026-07-01T00:00:00Z',
			updated_at: '2026-07-01T00:00:00Z'
		};
		state.employeeAssignments.push({
			id: '50000000-0000-4000-8000-000000000001',
			employee_id: employeeId,
			branch_id: '20000000-0000-4000-8000-000000000001',
			position_id: '12000000-0000-4000-8000-000000000001',
			supervisor_employee_id: null,
			effective_from: '2026-07-01',
			effective_until: null,
			reason: 'Penempatan awal',
			created_by: '30000000-0000-4000-8000-000000000001',
			updated_by: '30000000-0000-4000-8000-000000000001',
			created_at: '2026-07-01T00:00:00Z',
			updated_at: '2026-07-01T00:00:00Z'
		});

		const client = createMockClient(state);
		const auth = createAuthContext();
		const today = nowDate();
		const yesterday = previousDate(today);

		const employee = await updateEmployee(client, auth, employeeId, {
			employeeNumber: 'EMP-002',
			fullName: 'Dian Pinrang',
			phone: '08123450000',
			email: 'dian@example.com',
			address: 'Jl. Pasar',
			branchId: '20000000-0000-4000-8000-000000000002',
			positionId: '12000000-0000-4000-8000-000000000002',
			supervisorEmployeeId: null,
			joinDate: '2026-07-01',
			bankName: 'Bank Sulselbar',
			bankAccount: '5555555555',
			notes: null,
			employmentStatus: 'active',
			expectedUpdatedAt: null
		});

		expect(employee.branch?.id).toBe('20000000-0000-4000-8000-000000000002');
		expect(employee.position?.id).toBe('12000000-0000-4000-8000-000000000002');
		expect(employee.assignments).toHaveLength(2);
		expect(employee.assignments[0]).toMatchObject({
			branch: {
				id: '20000000-0000-4000-8000-000000000002',
				code: 'PIN',
				name: 'Yukatitip Pinrang'
			},
			position: {
				id: '12000000-0000-4000-8000-000000000002',
				code: 'BRM',
				name: 'Branch Manager'
			},
			reason: 'Penempatan diperbarui',
			actor: {
				id: '30000000-0000-4000-8000-000000000001',
				fullName: 'Yunaka Owner'
			},
			effectiveFrom: today,
			effectiveUntil: null,
			updatedAt: '2026-07-12T00:00:00Z',
			isCurrent: true
		});
		expect(employee.assignments[1]).toMatchObject({
			branch: {
				id: '20000000-0000-4000-8000-000000000001',
				code: 'MKS',
				name: 'Yukatitip Makassar'
			},
			position: {
				id: '12000000-0000-4000-8000-000000000001',
				code: 'OPS',
				name: 'Petugas Operasional'
			},
			effectiveFrom: '2026-07-01',
			effectiveUntil: yesterday,
			reason: 'Penempatan awal',
			actor: {
				id: '30000000-0000-4000-8000-000000000001',
				fullName: 'Yunaka Owner'
			},
			updatedAt: '2026-07-12T00:00:00Z',
			isCurrent: false
		});
		expect(state.employeeAssignments).toHaveLength(2);
		expect(state.updatedAssignments).toEqual([
			{
				id: '50000000-0000-4000-8000-000000000001',
				payload: {
					effective_until: yesterday,
					updated_by: '30000000-0000-4000-8000-000000000001'
				}
			}
		]);
	});
});
