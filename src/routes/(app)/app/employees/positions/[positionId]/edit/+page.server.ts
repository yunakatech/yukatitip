import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { writeAuditLog } from '$lib/server/master-data/audit';
import { getPositionDetail, parsePositionInput, updatePosition } from '$lib/server/master-data/positions';
import { MasterDataError } from '$lib/server/master-data/errors';
import { createSupabaseServiceRoleClient } from '$lib/server/supabase/service';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.auth) {
		throw redirect(303, '/login');
	}

	const position = await getPositionDetail(locals.supabase, params.positionId, locals.auth);
	return { position };
};

export const actions: Actions = {
	default: async (event) => {
		const { locals } = event;
		const auth = locals.auth;

		if (!auth) {
			throw redirect(303, '/login');
		}

		const serviceClient = createSupabaseServiceRoleClient();
		const input = parsePositionInput(await event.request.formData());

		try {
			const position = await updatePosition(serviceClient, auth, event.params.positionId, input);

			await writeAuditLog(serviceClient, {
				requestId: locals.requestId,
				actorProfileId: auth.profile.id,
				action: 'position.updated',
				entityType: 'position',
				entityId: position.id,
				oldValues: null,
				newValues: {
					code: position.code,
					name: position.name,
					level: position.level,
					isActive: position.isActive
				}
			});

			throw redirect(303, `/app/employees/positions/${position.id}`);
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
