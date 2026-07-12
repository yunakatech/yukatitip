import type { RequestEvent } from '@sveltejs/kit';

export function clearSupabaseSessionCookies(event: Pick<RequestEvent, 'cookies'>): void {
	event.cookies.getAll().forEach(({ name }) => {
		if (name.startsWith('sb-')) {
			event.cookies.delete(name, { path: '/' });
		}
	});
}
