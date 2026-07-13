import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { MasterDataError } from '$lib/server/master-data/errors';
import { getOrderDetail, loadOrderReferenceOptions, parseOrderInput, updateOrder } from '$lib/server/orders/orders';
import { createSupabaseServiceRoleClient } from '$lib/server/supabase/service';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.auth) {
		throw redirect(303, '/login');
	}

	const serviceClient = createSupabaseServiceRoleClient();
	const [order, references] = await Promise.all([
		getOrderDetail(serviceClient, locals.auth, params.orderId),
		loadOrderReferenceOptions(serviceClient, locals.auth)
	]);

	return { order, references };
};

export const actions: Actions = {
	default: async (event) => {
		const auth = event.locals.auth;

		if (!auth) {
			throw redirect(303, '/login');
		}

		const serviceClient = createSupabaseServiceRoleClient();
		const input = parseOrderInput(await event.request.formData());

		try {
			const order = await updateOrder(serviceClient, auth, event.params.orderId, input, {
				requestId: event.locals.requestId,
				ipAddress: event.getClientAddress(),
				userAgent: event.request.headers.get('user-agent')
			});
			throw redirect(303, `/app/orders/${order.id}`);
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
