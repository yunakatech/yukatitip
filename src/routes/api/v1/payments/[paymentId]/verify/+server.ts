import type { RequestHandler } from './$types';

import { apiError, apiSuccess } from '$lib/server/http/api';
import { MasterDataError } from '$lib/server/master-data/errors';
import { parseVerifyPaymentJsonPayload, verifyOrderPayment } from '$lib/server/orders/orders';
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
		const input = parseVerifyPaymentJsonPayload(await event.request.json());
		const order = await verifyOrderPayment(createSupabaseServiceRoleClient(), event.locals.auth, event.params.paymentId, input, {
			requestId: event.locals.requestId,
			ipAddress: event.getClientAddress(),
			userAgent: event.request.headers.get('user-agent')
		});
		const payment = order.payments.find((item) => item.id === event.params.paymentId);

		return apiSuccess(event, {
			paymentId: event.params.paymentId,
			status: payment?.status ?? 'cancelled',
			orderPaymentStatus: order.paymentStatus,
			orderStatus: order.status,
			orderVersion: order.version,
			verifiedAt: payment?.verifiedAt ?? null
		});
	} catch (error) {
		return handleApiError(event, error);
	}
};
