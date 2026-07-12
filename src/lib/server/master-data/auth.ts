import { ROLE_CODES } from '$lib/constants/access';
import type { AuthContext } from '$lib/types/auth';

import { branchAccessDeniedError, forbiddenError } from './errors';

export function assertOwner(auth: AuthContext): void {
	if (auth.role.code !== ROLE_CODES.OWNER) {
		throw forbiddenError();
	}
}

export function assertBranchAccess(auth: AuthContext, branchId: string): void {
	if (auth.role.code === ROLE_CODES.OWNER) {
		return;
	}

	if (!auth.branch || auth.branch.id !== branchId) {
		throw branchAccessDeniedError();
	}
}

export function assertBranchMutator(
	auth: AuthContext,
	branchId: string | null,
	allowedRoles: readonly string[]
): void {
	if (auth.role.code === ROLE_CODES.OWNER) {
		return;
	}

	if (!allowedRoles.includes(auth.role.code)) {
		throw forbiddenError();
	}

	if (!auth.branch) {
		throw branchAccessDeniedError();
	}

	if (branchId && branchId !== auth.branch.id) {
		throw branchAccessDeniedError();
	}
}

export function assertViewBranchScopedData(
	auth: AuthContext,
	branchId: string | null,
	allowedRoles: readonly string[]
): string | null {
	if (auth.role.code === ROLE_CODES.OWNER) {
		return branchId ?? null;
	}

	if (!allowedRoles.includes(auth.role.code)) {
		throw forbiddenError();
	}

	if (!auth.branch) {
		throw branchAccessDeniedError();
	}

	if (branchId && branchId !== auth.branch.id) {
		throw branchAccessDeniedError();
	}

	return auth.branch.id;
}

export function assertEmployeeManager(auth: AuthContext, branchId: string | null): void {
	assertBranchMutator(auth, branchId, [ROLE_CODES.BRANCH_MANAGER]);
}

export function assertCustomerStoreManager(auth: AuthContext, branchId: string | null): void {
	assertBranchMutator(auth, branchId, [ROLE_CODES.BRANCH_MANAGER, ROLE_CODES.BRANCH_ADMIN]);
}

export function assertPositionManager(auth: AuthContext): void {
	assertOwner(auth);
}

export function assertRouteManager(auth: AuthContext): void {
	assertOwner(auth);
}
