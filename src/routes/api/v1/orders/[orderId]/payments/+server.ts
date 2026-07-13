import type { RequestHandler } from './$types';

import { apiError, apiSuccess } from '$lib/server/http/api';
import { MasterDataError } from '$lib/server/master-data/errors';
import { addPaymentToOrder, parseOrderPaymentJsonPayload } from '$lib/server/orders/orders';
import { createSupabaseServiceRoleClient } from '$lib/server/supabase/service';

function handleApiError(event: Parameters<typeof apiError>[0], error: unknown) {
	if (error instanceof MasterDataError) {
		return apiError(event, error.status, error.code, error.message, error.fieldErrors);
	}

	return apiError(event, 500, 'INTERNAL_ERROR', 'Terjadi kesalahan internal.');
}

export const POST: RequestHandler = async (event) => {
	if (!event.locals.auth) {
		return apiError(event, 401, 'AUTH_REQUIRED', 'Login diperlukan.');
	}

	try {
		const input = parseOrderPaymentJsonPayload(await event.request.json());
		const order = await addPaymentToOrder(createSupabaseServiceRoleClient(), event.locals.auth, event.params.orderId, input, {
			requestId: event.locals.requestId,
			ipAddress: event.getClientAddress(),
			userAgent: event.request.headers.get('user-agent')
		});
		const payment = order.payments[0];

		return apiSuccess(event, {
			id: payment?.id,
			orderId: order.id,
			status: payment?.status ?? 'unpaid',
			attachmentId: payment?.attachment?.id ?? null
		}, 201);
	} catch (error) {
		return handleApiError(event, error);
	}
};
