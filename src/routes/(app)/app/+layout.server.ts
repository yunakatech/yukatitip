import { error, redirect } from '@sveltejs/kit';

import { canAccessAppRoute } from '$lib/auth/app-route-policy';
import { sanitizeRedirectPath } from '$lib/utils/redirect';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, route, url }) => {
	if (!locals.auth) {
		const next = sanitizeRedirectPath(`${url.pathname}${url.search}`, '/app/dashboard');
		throw redirect(303, `/login?next=${encodeURIComponent(next)}`);
	}

	if (!canAccessAppRoute(locals.auth, route.id)) {
		throw error(403, 'Anda tidak memiliki akses ke halaman ini.');
	}

	return {
		user: locals.auth.user,
		profile: locals.auth.profile
	};
};
