import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { ROLE_CODES } from '$lib/constants/access';
import { writeAuditLog } from '$lib/server/master-data/audit';
import { getRouteDetail, parseRouteTariffInput, updateRouteTariff } from '$lib/server/master-data/routes';
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
	const tariff = route.tariffs.find((item) => item.id === params.tariffId);

	if (!tariff) {
		throw error(404, 'Tarif route tidak ditemukan.');
	}

	if (!route.isActive) {
		throw error(409, 'Route harus aktif sebelum tarif dapat diubah.');
	}

	return {
		route,
		tariff
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
		const input = parseRouteTariffInput(await event.request.formData());

		try {
			const route = await updateRouteTariff(serviceClient, auth, params.routeId, params.tariffId, input);

			await writeAuditLog(serviceClient, {
				requestId: locals.requestId,
				actorProfileId: auth.profile.id,
				action: 'route_tariff.updated',
				entityType: 'route_tariff',
				entityId: params.tariffId,
				oldValues: null,
				newValues: {
					serviceType: input.serviceType,
					minimumServiceFee: input.minimumServiceFee,
					percentageFee: input.percentageFee,
					localDeliveryFee: input.localDeliveryFee,
					handlingFee: input.handlingFee,
					effectiveFrom: input.effectiveFrom,
					effectiveUntil: input.effectiveUntil,
					isActive: input.isActive
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
