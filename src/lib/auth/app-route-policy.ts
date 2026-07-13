import { PERMISSION_CODES, ROLE_CODES, type PermissionCode, type RoleCode } from '$lib/constants/access';
import type { AuthContext } from '$lib/types/auth';

interface AuthenticatedAppRoutePolicy {
	access: 'authenticated';
}

interface RestrictedAppRoutePolicy {
	access: 'restricted';
	allowedRoles?: readonly RoleCode[];
	requiredPermissions?: readonly PermissionCode[];
}

export type AppRoutePolicy = AuthenticatedAppRoutePolicy | RestrictedAppRoutePolicy;

export const APP_ROUTE_POLICIES = {
	'/(app)/app': {
		access: 'authenticated'
	},
	'/(app)/app/dashboard': {
		access: 'authenticated'
	},
	'/(app)/app/tracking': {
		access: 'authenticated'
	},
	'/(app)/app/orders': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER, ROLE_CODES.BRANCH_ADMIN],
		requiredPermissions: [PERMISSION_CODES.ORDERS_MANAGE]
	},
	'/(app)/app/orders/new': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER, ROLE_CODES.BRANCH_ADMIN],
		requiredPermissions: [PERMISSION_CODES.ORDERS_MANAGE]
	},
	'/(app)/app/orders/[orderId]': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER, ROLE_CODES.BRANCH_ADMIN],
		requiredPermissions: [PERMISSION_CODES.ORDERS_MANAGE]
	},
	'/(app)/app/orders/[orderId]/edit': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER, ROLE_CODES.BRANCH_ADMIN],
		requiredPermissions: [PERMISSION_CODES.ORDERS_MANAGE]
	},
	'/(app)/app/tasks': {
		access: 'restricted',
		allowedRoles: [
			ROLE_CODES.OWNER,
			ROLE_CODES.BRANCH_MANAGER,
			ROLE_CODES.BRANCH_ADMIN,
			ROLE_CODES.FIELD_STAFF,
			ROLE_CODES.DESTINATION_STAFF
		],
		requiredPermissions: [PERMISSION_CODES.TASKS_EXECUTE]
	},
	'/(app)/app/trips': {
		access: 'restricted',
		allowedRoles: [
			ROLE_CODES.OWNER,
			ROLE_CODES.BRANCH_MANAGER,
			ROLE_CODES.BRANCH_ADMIN,
			ROLE_CODES.FIELD_STAFF,
			ROLE_CODES.DESTINATION_STAFF
		],
		requiredPermissions: [PERMISSION_CODES.ORDERS_MANAGE, PERMISSION_CODES.TASKS_EXECUTE]
	},
	'/(app)/app/customers': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER, ROLE_CODES.BRANCH_ADMIN],
		requiredPermissions: [PERMISSION_CODES.ORDERS_MANAGE]
	},
	'/(app)/app/customers/new': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER, ROLE_CODES.BRANCH_ADMIN],
		requiredPermissions: [PERMISSION_CODES.ORDERS_MANAGE]
	},
	'/(app)/app/customers/[customerId]': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER, ROLE_CODES.BRANCH_ADMIN],
		requiredPermissions: [PERMISSION_CODES.ORDERS_MANAGE]
	},
	'/(app)/app/customers/[customerId]/edit': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER, ROLE_CODES.BRANCH_ADMIN],
		requiredPermissions: [PERMISSION_CODES.ORDERS_MANAGE]
	},
	'/(app)/app/stores': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER, ROLE_CODES.BRANCH_ADMIN],
		requiredPermissions: [PERMISSION_CODES.ORDERS_MANAGE]
	},
	'/(app)/app/stores/new': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER, ROLE_CODES.BRANCH_ADMIN],
		requiredPermissions: [PERMISSION_CODES.ORDERS_MANAGE]
	},
	'/(app)/app/stores/[storeId]': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER, ROLE_CODES.BRANCH_ADMIN],
		requiredPermissions: [PERMISSION_CODES.ORDERS_MANAGE]
	},
	'/(app)/app/stores/[storeId]/edit': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER, ROLE_CODES.BRANCH_ADMIN],
		requiredPermissions: [PERMISSION_CODES.ORDERS_MANAGE]
	},
	'/(app)/app/branches': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER]
	},
	'/(app)/app/branches/new': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER]
	},
	'/(app)/app/branches/[branchId]': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER, ROLE_CODES.BRANCH_ADMIN]
	},
	'/(app)/app/branches/[branchId]/edit': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER]
	},
	'/(app)/app/routes': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER, ROLE_CODES.BRANCH_ADMIN]
	},
	'/(app)/app/routes/new': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER]
	},
	'/(app)/app/routes/[routeId]': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER, ROLE_CODES.BRANCH_ADMIN]
	},
	'/(app)/app/routes/[routeId]/edit': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER]
	},
	'/(app)/app/routes/[routeId]/schedules/new': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER]
	},
	'/(app)/app/routes/[routeId]/schedules/[scheduleId]/edit': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER]
	},
	'/(app)/app/routes/[routeId]/tariffs/new': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER]
	},
	'/(app)/app/routes/[routeId]/tariffs/[tariffId]/edit': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER]
	},
	'/(app)/app/payments': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER, ROLE_CODES.BRANCH_ADMIN],
		requiredPermissions: [PERMISSION_CODES.ORDERS_MANAGE]
	},
	'/(app)/app/expenses': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER, ROLE_CODES.BRANCH_ADMIN],
		requiredPermissions: [PERMISSION_CODES.EXPENSES_APPROVE]
	},
	'/(app)/app/branch-expenses': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER]
	},
	'/(app)/app/commissions': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER],
		requiredPermissions: [PERMISSION_CODES.PAYROLL_MANAGE]
	},
	'/(app)/app/payroll': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER],
		requiredPermissions: [PERMISSION_CODES.PAYROLL_MANAGE]
	},
	'/(app)/app/reports': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER, ROLE_CODES.BRANCH_ADMIN]
	},
	'/(app)/app/employees': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER, ROLE_CODES.BRANCH_ADMIN]
	},
	'/(app)/app/employees/new': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER]
	},
	'/(app)/app/employees/[employeeId]': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER, ROLE_CODES.BRANCH_ADMIN]
	},
	'/(app)/app/employees/[employeeId]/edit': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER]
	},
	'/(app)/app/employees/[employeeId]/deactivate': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER]
	},
	'/(app)/app/employees/[employeeId]/assignments': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER]
	},
	'/(app)/app/employees/[employeeId]/assignments/new': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER]
	},
	'/(app)/app/employees/[employeeId]/assignments/[assignmentId]': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER]
	},
	'/(app)/app/employees/[employeeId]/assignments/[assignmentId]/edit': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER]
	},
	'/(app)/app/employees/positions': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER]
	},
	'/(app)/app/accounts': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER]
	},
	'/(app)/app/settings': {
		access: 'restricted',
		allowedRoles: [ROLE_CODES.OWNER]
	}
} as const satisfies Record<string, AppRoutePolicy>;

export type AppRouteId = keyof typeof APP_ROUTE_POLICIES;

function resolveAppRoutePolicy(routeId: string | null | undefined): AppRoutePolicy | null {
	if (!routeId) {
		return null;
	}

	if (isAppRouteId(routeId)) {
		return APP_ROUTE_POLICIES[routeId];
	}

	let bestMatch: AppRoutePolicy | null = null;
	let bestMatchLength = -1;

	for (const [policyRouteId, policy] of Object.entries(APP_ROUTE_POLICIES)) {
		if (!routeId.startsWith(policyRouteId + '/')) {
			continue;
		}

		if (policyRouteId.length > bestMatchLength) {
			bestMatch = policy;
			bestMatchLength = policyRouteId.length;
		}
	}

	return bestMatch;
}

function normalizePathname(pathname: string): string {
	if (!pathname || pathname === '/') {
		return '/';
	}

	return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

function hasRequiredRole(auth: AuthContext, allowedRoles?: readonly RoleCode[]): boolean {
	if (!allowedRoles || allowedRoles.length === 0) {
		return true;
	}

	return allowedRoles.includes(auth.role.code);
}

function hasRequiredPermission(
	auth: AuthContext,
	requiredPermissions?: readonly PermissionCode[]
): boolean {
	if (!requiredPermissions || requiredPermissions.length === 0) {
		return true;
	}

	const permissionCodes = new Set(auth.permissions.map((permission) => permission.code));
	return requiredPermissions.some((permissionCode) => permissionCodes.has(permissionCode));
}

export function isAppRouteId(routeId: string | null | undefined): routeId is AppRouteId {
	return typeof routeId === 'string' && routeId in APP_ROUTE_POLICIES;
}

export function pathnameToAppRouteId(pathname: string): AppRouteId | null {
	const normalizedPathname = normalizePathname(pathname);

	if (normalizedPathname === '/app') {
		return '/(app)/app';
	}

	if (!normalizedPathname.startsWith('/app/')) {
		return null;
	}

	const routeId = `/(app)${normalizedPathname}`;
	return isAppRouteId(routeId) ? routeId : null;
}

export function canAccessAppRoute(auth: AuthContext | null, routeId: string | null | undefined): boolean {
	const policy = resolveAppRoutePolicy(routeId);

	if (!auth || !policy) {
		return false;
	}

	if (policy.access === 'authenticated') {
		return true;
	}

	const allowedRoles = 'allowedRoles' in policy ? policy.allowedRoles : undefined;
	const requiredPermissions = 'requiredPermissions' in policy ? policy.requiredPermissions : undefined;

	return hasRequiredRole(auth, allowedRoles) && hasRequiredPermission(auth, requiredPermissions);
}

export function canAccessAppPath(auth: AuthContext | null, pathname: string): boolean {
	const routeId = pathnameToAppRouteId(pathname);
	return canAccessAppRoute(auth, routeId);
}
