import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

import { ROLE_CODES } from '$lib/constants/access';
import { getStoreDetail } from '$lib/server/master-data/stores';

function canEditStores(roleCode: string): boolean {
	return (
		roleCode === ROLE_CODES.OWNER ||
		roleCode === ROLE_CODES.BRANCH_MANAGER ||
		roleCode === ROLE_CODES.BRANCH_ADMIN
	);
}

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.auth) {
		throw redirect(303, '/login');
	}

	const store = await getStoreDetail(locals.supabase, params.storeId, locals.auth);
	const canEdit = canEditStores(locals.auth.role.code);

	return {
		store,
		canEdit
	};
};
