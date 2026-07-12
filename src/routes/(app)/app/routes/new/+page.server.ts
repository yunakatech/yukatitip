import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { ROLE_CODES } from '$lib/constants/access';
import { writeAuditLog } from '$lib/server/master-data/audit';
import { createRoute, parseRouteInput } from '$lib/server/master-data/routes';
import { MasterDataError } from '$lib/server/master-data/errors';
import { createSupabaseServiceRoleClient } from '$lib/server/supabase/service';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.auth) {
		throw redirect(303, '/login');
	}

	if (locals.auth.role.code !== ROLE_CODES.OWNER) {
		throw error(403, 'Anda tidak memiliki akses ke halaman ini.');
	}

	const { data: branches } = await locals.supabase
		.from('branches')
		.select('id, code, name, is_active')
		.order('name', { ascending: true });

	return {
		branchOptions:
			branches?.map((branch) => ({
				value: branch.id,
				label: `${branch.code} - ${branch.name}${branch.is_active ? '' : ' (nonaktif)'}`
			})) ?? []
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { locals } = event;
		const auth = locals.auth;

		if (!auth) {
			throw redirect(303, '/login');
		}

		if (auth.role.code !== ROLE_CODES.OWNER) {
			throw error(403, 'Anda tidak memiliki akses ke aksi ini.');
		}

		const serviceClient = createSupabaseServiceRoleClient();
		const input = parseRouteInput(await event.request.formData());

		try {
			const route = await createRoute(serviceClient, auth, input);

			await writeAuditLog(serviceClient, {
				requestId: locals.requestId,
				actorProfileId: auth.profile.id,
				action: 'route.created',
				entityType: 'route',
				entityId: route.id,
				oldValues: null,
				newValues: {
					name: route.name,
					originBranchId: route.origin.id,
					destinationBranchId: route.destination.id,
					baseFee: route.baseFee,
					isActive: route.isActive
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
