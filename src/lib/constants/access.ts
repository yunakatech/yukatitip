export const ROLE_CODES = {
	OWNER: 'owner',
	BRANCH_MANAGER: 'branch_manager',
	BRANCH_ADMIN: 'branch_admin',
	FIELD_STAFF: 'field_staff',
	DESTINATION_STAFF: 'destination_staff'
} as const;

export type RoleCode = (typeof ROLE_CODES)[keyof typeof ROLE_CODES];

export const PERMISSION_CODES = {
	ORDERS_MANAGE: 'orders.manage',
	TASKS_EXECUTE: 'tasks.execute',
	EXPENSES_APPROVE: 'expenses.approve',
	PAYROLL_MANAGE: 'payroll.manage'
} as const;

export type PermissionCode = (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES];

const ROLE_CODE_VALUES = Object.values(ROLE_CODES);
const PERMISSION_CODE_VALUES = Object.values(PERMISSION_CODES);

export function isRoleCode(value: string): value is RoleCode {
	return ROLE_CODE_VALUES.includes(value as RoleCode);
}

export function isPermissionCode(value: string): value is PermissionCode {
	return PERMISSION_CODE_VALUES.includes(value as PermissionCode);
}
