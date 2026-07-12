import {
	ROLE_CODES,
	isPermissionCode as isKnownPermissionCode,
	isRoleCode as isKnownRoleCode,
	type PermissionCode,
	type RoleCode
} from '$lib/constants/access';
import type { AuthContext } from '$lib/types/auth';

export function getRoleCode(auth: AuthContext | null): RoleCode | null {
	return auth?.role.code ?? null;
}

export function isRole(auth: AuthContext | null, roleCode: RoleCode): boolean {
	return getRoleCode(auth) === roleCode;
}

export function isOwner(auth: AuthContext | null): boolean {
	return isRole(auth, ROLE_CODES.OWNER);
}

export function getPermissionCodes(auth: AuthContext | null): PermissionCode[] {
	return auth?.permissions.map((permission) => permission.code) ?? [];
}

export function hasPermission(auth: AuthContext | null, permissionCode: PermissionCode): boolean {
	return getPermissionCodes(auth).includes(permissionCode);
}

export function hasAnyPermission(auth: AuthContext | null, permissionCodes: readonly PermissionCode[]): boolean {
	return permissionCodes.some((permissionCode) => hasPermission(auth, permissionCode));
}

export function hasAnyRole(auth: AuthContext | null, roleCodes: readonly RoleCode[]): boolean {
	const roleCode = getRoleCode(auth);

	if (!roleCode) {
		return false;
	}

	return roleCodes.includes(roleCode);
}

export function canAccessBranch(auth: AuthContext | null, branchId: string | null): boolean {
	if (!auth) {
		return false;
	}

	if (isOwner(auth)) {
		return true;
	}

	if (!branchId) {
		return false;
	}

	return auth.branch?.id === branchId;
}

export function isPermissionCode(value: string): value is PermissionCode {
	return isKnownPermissionCode(value);
}

export function isRoleCode(value: string): value is RoleCode {
	return isKnownRoleCode(value);
}
