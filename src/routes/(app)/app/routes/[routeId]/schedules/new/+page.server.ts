import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { ROLE_CODES } from '$lib/constants/access';
import { writeAuditLog } from '$lib/server/master-data/audit';
import { createRouteSchedule, parseRouteScheduleInput, getRouteDetail } from '$lib/server/master-data/routes';
import { MasterDataError } from '$lib/server/master-data/errors';
import { createSupabaseServiceRoleClient } from '$lib/server/supabase/service';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.auth) {
		throw redirect(303, '/login');
	}

	if (locals.auth.role.code !== ROLE_CODES.OWNER) {
		throw error(403, 'Anda tidak memiliki akses ke halaman ini.');
	}

	const route = await getRouteDetail(locals.supabase, params.routeId, locals.auth);

	if (!route.isActive) {
		throw error(409, 'Route harus aktif sebelum jadwal baru dapat dibuat.');
	}

	return { route };
};

export const actions: Actions = {
	default: async (event) => {
		const { locals, params } = event;
		const auth = locals.auth;

		if (!auth) {
			throw redirect(303, '/login');
		}

		if (auth.role.code !== ROLE_CODES.OWNER) {
			throw error(403, 'Anda tidak memiliki akses ke aksi ini.');
		}

		const serviceClient = createSupabaseServiceRoleClient();
		const input = parseRouteScheduleInput(await event.request.formData());

		try {
			const route = await createRouteSchedule(serviceClient, auth, params.routeId, input);

			await writeAuditLog(serviceClient, {
				requestId: locals.requestId,
				actorProfileId: auth.profile.id,
				action: 'route_schedule.created',
				entityType: 'route_schedule',
				entityId: params.routeId,
				oldValues: null,
				newValues: {
					dayOfWeek: input.dayOfWeek,
					departureTime: input.departureTime,
					isActive: input.isActive,
					notes: input.notes
				}
			});

			throw redirect(303, `/app/routes/${route.id}`);
		} catch (error) {
			if (error instanceof MasterDataError) {
				return fail(error.status, {
					error: error.message,
					fieldErrors: error.fieldErrors,
					values: input
				});
			}

			throw error;
		}
	}
};
