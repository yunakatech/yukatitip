import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

import { getBranchDetail } from '$lib/server/master-data/branches';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.auth) {
		throw redirect(303, '/login');
	}

	const branch = await getBranchDetail(locals.supabase, params.branchId, locals.auth);

	return {
		branch
	};
};
