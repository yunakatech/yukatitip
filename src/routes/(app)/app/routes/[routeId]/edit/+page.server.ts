import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { ROLE_CODES } from '$lib/constants/access';
import { writeAuditLog } from '$lib/server/master-data/audit';
import { getRouteDetail, parseRouteInput, updateRoute } from '$lib/server/master-data/routes';
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
	const { data: branches } = await locals.supabase
		.from('branches')
		.select('id, code, name, is_active')
		.order('name', { ascending: true });

	return {
		route,
		branchOptions:
			branches?.map((branch) => ({
				value: branch.id,
				label: `${branch.code} - ${branch.name}${branch.is_active ? '' : ' (nonaktif)'}`
			})) ?? []
	};
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
		const input = parseRouteInput(await event.request.formData());

		try {
			const current = await getRouteDetail(locals.supabase, params.routeId, auth);
			const route = await updateRoute(serviceClient, auth, params.routeId, input);

			await writeAuditLog(serviceClient, {
				requestId: locals.requestId,
				actorProfileId: auth.profile.id,
				action: 'route.updated',
				entityType: 'route',
				entityId: route.id,
				oldValues: {
					name: current.name,
					originBranchId: current.origin.id,
					destinationBranchId: current.destination.id,
					baseFee: current.baseFee,
					isActive: current.isActive
				},
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
