import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

import { ROLE_CODES } from '$lib/constants/access';
import { getRouteDetail } from '$lib/server/master-data/routes';

function canEditRoutes(roleCode: string): boolean {
	return roleCode === ROLE_CODES.OWNER;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.auth) {
		throw redirect(303, '/login');
	}

	const route = await getRouteDetail(locals.supabase, params.routeId, locals.auth);

	return {
		route,
		canEdit: canEditRoutes(locals.auth.role.code)
	};
};
