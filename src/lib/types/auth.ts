import type { Database } from '$lib/supabase/database';
import type { PermissionCode, RoleCode } from '$lib/constants/access';

type AccountStatus = Database['public']['Enums']['account_status'];

export interface SanitizedAuthUser {
	id: string;
	email: string | null;
}

export interface SanitizedAuthPermission {
	id: string;
	code: PermissionCode;
	module: string;
	name: string;
}

export interface SanitizedAuthRole {
	id: string;
	code: RoleCode;
	name: string;
}

export interface SanitizedAuthBranch {
	id: string;
	code: string;
	name: string;
}

export interface SanitizedAuthProfile {
	id: string;
	fullName: string;
	phone: string | null;
	status: AccountStatus;
	role: SanitizedAuthRole;
	branch: SanitizedAuthBranch | null;
	permissions: SanitizedAuthPermission[];
}

export interface AuthContext {
	user: SanitizedAuthUser;
	profile: SanitizedAuthProfile;
	role: SanitizedAuthRole;
	branch: SanitizedAuthBranch | null;
	permissions: SanitizedAuthPermission[];
}
