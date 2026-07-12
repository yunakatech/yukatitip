import type { SupabaseClient, User } from '@supabase/supabase-js';

import { ROLE_CODES, isPermissionCode, isRoleCode } from '$lib/constants/access';
import type { Database } from '$lib/supabase/database';
import type {
	AuthContext,
	SanitizedAuthBranch,
	SanitizedAuthPermission,
	SanitizedAuthProfile,
	SanitizedAuthRole,
	SanitizedAuthUser
} from '$lib/types/auth';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type RoleRow = Database['public']['Tables']['roles']['Row'];
type BranchRow = Database['public']['Tables']['branches']['Row'];
type PermissionRow = Database['public']['Tables']['permissions']['Row'];

export type ProfileWithRelations = Pick<
	ProfileRow,
	'id' | 'full_name' | 'phone' | 'status' | 'role_id' | 'branch_id'
> & {
	role: Pick<RoleRow, 'id' | 'code' | 'name'> | null;
	branch: Pick<BranchRow, 'id' | 'code' | 'name' | 'is_active'> | null;
};

type RolePermissionWithRelation = {
	permission: Pick<PermissionRow, 'id' | 'code' | 'module' | 'name'> | null;
};

function sanitizeUser(user: User): SanitizedAuthUser {
	return {
		id: user.id,
		email: user.email ?? null
	};
}

function sanitizeRole(role: Pick<RoleRow, 'id' | 'code' | 'name'> | null): SanitizedAuthRole | null {
	if (!role || !isRoleCode(role.code)) {
		return null;
	}

	return {
		id: role.id,
		code: role.code,
		name: role.name
	};
}

function sanitizeBranch(branch: Pick<BranchRow, 'id' | 'code' | 'name' | 'is_active'>): SanitizedAuthBranch {
	return {
		id: branch.id,
		code: branch.code,
		name: branch.name
	};
}

function sanitizePermission(
	permission: Pick<PermissionRow, 'id' | 'code' | 'module' | 'name'> | null
): SanitizedAuthPermission | null {
	if (!permission || !isPermissionCode(permission.code)) {
		return null;
	}

	return {
		id: permission.id,
		code: permission.code,
		module: permission.module,
		name: permission.name
	};
}

function sanitizeProfile(
	profile: ProfileWithRelations,
	role: SanitizedAuthRole,
	permissions: SanitizedAuthPermission[]
): SanitizedAuthProfile {
	return {
		id: profile.id,
		fullName: profile.full_name,
		phone: profile.phone,
		status: profile.status,
		role,
		branch: profile.branch ? sanitizeBranch(profile.branch) : null,
		permissions
	};
}

function sortPermissions(permissions: SanitizedAuthPermission[]): SanitizedAuthPermission[] {
	return permissions.slice().sort((left, right) => {
		const moduleComparison = left.module.localeCompare(right.module);
		if (moduleComparison !== 0) {
			return moduleComparison;
		}

		return left.code.localeCompare(right.code);
	});
}

export function buildAuthContext(
	user: User,
	profile: ProfileWithRelations,
	permissions: SanitizedAuthPermission[] = []
): AuthContext | null {
	if (profile.status !== 'active' || !profile.role) {
		return null;
	}

	const role = sanitizeRole(profile.role);

	if (!role) {
		return null;
	}

	const branch = profile.branch && profile.branch.is_active ? sanitizeBranch(profile.branch) : null;

	if (role.code !== ROLE_CODES.OWNER && !branch) {
		return null;
	}

	const sanitizedPermissions = sortPermissions(permissions);
	const sanitizedProfile = sanitizeProfile(profile, role, sanitizedPermissions);

	return {
		user: sanitizeUser(user),
		profile: sanitizedProfile,
		role,
		branch,
		permissions: sanitizedPermissions
	};
}

export async function loadActiveAuthContext(
	supabase: SupabaseClient<Database>
): Promise<AuthContext | null> {
	const { data: userData, error: userError } = await supabase.auth.getUser();

	if (userError || !userData.user) {
		return null;
	}

	const { data: profileData, error: profileError } = await supabase
		.from('profiles')
		.select(
			'id, full_name, phone, status, role_id, branch_id, role:roles(id, code, name), branch:branches(id, code, name, is_active)'
		)
		.eq('id', userData.user.id)
		.maybeSingle();

	if (profileError || !profileData) {
		return null;
	}

	const activeProfile = profileData as ProfileWithRelations;

	if (activeProfile.status !== 'active' || !activeProfile.role) {
		return null;
	}

	const { data: rolePermissionData, error: permissionError } = await supabase
		.from('role_permissions')
		.select('permission:permissions(id, code, module, name)')
		.eq('role_id', activeProfile.role.id);

	if (permissionError || !rolePermissionData) {
		return null;
	}

	const permissions = rolePermissionData
		.map((entry: RolePermissionWithRelation) => entry.permission)
		.map((permission) => sanitizePermission(permission))
		.filter(
			(permission): permission is SanitizedAuthPermission => permission !== null
		);

	return buildAuthContext(userData.user, activeProfile, permissions);
}
