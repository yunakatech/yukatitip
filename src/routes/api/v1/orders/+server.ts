import type { RequestHandler } from './$types';

import { createApiMeta, apiError, apiSuccess } from '$lib/server/http/api';
import { MasterDataError } from '$lib/server/master-data/errors';
import { parseListQuery } from '$lib/server/master-data/query';
import { getAppConfig } from '$lib/server/config/env';
import {
	createOrder,
	listOrders,
	parseOrderJsonPayload,
	parseOrderListExtras
} from '$lib/server/orders/orders';
import { createSupabaseServiceRoleClient } from '$lib/server/supabase/service';

function handleApiError(event: Parameters<typeof createApiMeta>[0], error: unknown) {
	if (error instanceof MasterDataError) {
		return apiError(event, error.status, error.code, error.message, error.fieldErrors);
	}

	return apiError(event, 500, 'INTERNAL_ERROR', 'Terjadi kesalahan internal.');
}

export const GET: RequestHandler = async (event) => {
	if (!event.locals.auth) {
		return apiError(event, 401, 'AUTH_REQUIRED', 'Login diperlukan.');
	}

	try {
		const config = getAppConfig();
		const query = parseListQuery(event.url, {
			defaultPageSize: config.business.defaultPageSize,
			maxPageSize: config.business.maxPageSize,
			defaultSortField: '-createdAt',
			allowedSortFields: ['trackingNumber', 'createdAt', 'updatedAt', 'status', 'paymentStatus', 'serviceRevenue'],
			allowedStatuses: [
				'recorded',
				'waiting_payment',
				'payment_received',
				'waiting_origin_process',
				'purchasing_or_collecting',
				'received_at_origin',
				'waiting_departure',
				'in_transit',
				'arrived_at_destination',
				'ready_for_handover',
				'completed',
				'problem',
				'cancelled'
			]
		});
		const extras = parseOrderListExtras(event.url);
		const data = await listOrders(createSupabaseServiceRoleClient(), event.locals.auth, { ...query, ...extras });

		return apiSuccess(event, data.items, 200, {
			page: data.page,
			pageSize: data.pageSize,
			total: data.total,
			totalPages: data.totalPages
		});
	} catch (error) {
		return handleApiError(event, error);
	}
};

export const POST: RequestHandler = async (event) => {
	if (!event.locals.auth) {
		return apiError(event, 401, 'AUTH_REQUIRED', 'Login diperlukan.');
	}

	try {
		const input = parseOrderJsonPayload(await event.request.json());
		const order = await createOrder(createSupabaseServiceRoleClient(), event.locals.auth, input, {
			requestId: event.locals.requestId,
			idempotencyKey: event.request.headers.get('Idempotency-Key'),
			ipAddress: event.getClientAddress(),
			userAgent: event.request.headers.get('user-agent')
		});

		return apiSuccess(
			event,
			{
				id: order.id,
				trackingNumber: order.trackingNumber,
				status: order.status,
				paymentStatus: order.paymentStatus,
				totalCustomerPayment: order.totalCustomerPayment,
				version: order.version
			},
			201
		);
	} catch (error) {
		return handleApiError(event, error);
	}
};
