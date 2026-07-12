import { redirect, type RequestHandler } from '@sveltejs/kit';

import { clearSupabaseSessionCookies } from '$lib/server/auth/cookies';
import { isTrustedMutationOrigin } from '$lib/server/auth/origin';
import { getAppConfig } from '$lib/server/config/env';

export const POST: RequestHandler = async (event) => {
	const { locals, request, url } = event;
	const config = getAppConfig();
	const origin = request.headers.get('origin');

	if (!isTrustedMutationOrigin(origin, url.origin, config)) {
		throw redirect(303, '/login');
	}

	await locals.supabase.auth.signOut();
	clearSupabaseSessionCookies(event);

	throw redirect(303, '/login');
};
