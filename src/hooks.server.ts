import type { Handle } from '@sveltejs/kit';

import { loadActiveAuthContext } from '$lib/server/auth/session';
import { createSupabaseServerClient } from '$lib/server/supabase/server';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.requestId = crypto.randomUUID();
	event.locals.supabase = createSupabaseServerClient(event);
	event.locals.auth = await loadActiveAuthContext(event.locals.supabase);

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
