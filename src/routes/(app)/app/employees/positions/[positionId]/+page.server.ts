import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

import { getPositionDetail } from '$lib/server/master-data/positions';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.auth) {
		throw redirect(303, '/login');
	}

	const position = await getPositionDetail(locals.supabase, params.positionId, locals.auth);

	return { position };
};
