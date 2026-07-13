import type { PageServerLoad } from './$types';

import { getAppConfig } from '$lib/server/config/env';
import { validationError } from '$lib/server/master-data/errors';
import { parseListQuery } from '$lib/server/master-data/query';
import { listOrders, parseOrderListExtras } from '$lib/server/orders/orders';
import { createSupabaseServiceRoleClient } from '$lib/server/supabase/service';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.auth) {
		return {
			orders: [],
			pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
			filters: {
				search: '',
				status: null,
				paymentStatus: null,
				branchId: null,
				sort: '-createdAt'
			}
		};
	}

	const config = getAppConfig();
	const query = parseListQuery(url, {
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
	const extras = parseOrderListExtras(url);

	if ((extras.originBranchId || extras.destinationBranchId) && query.branchId) {
		throw validationError('Gunakan salah satu filter cabang saja.');
	}

	const data = await listOrders(createSupabaseServiceRoleClient(), locals.auth, {
		...query,
		...extras
	});

	return {
		orders: data.items,
		pagination: {
			page: data.page,
			pageSize: data.pageSize,
			total: data.total,
			totalPages: data.totalPages
		},
		filters: {
			search: query.search,
			status: query.status,
			paymentStatus: extras.paymentStatus,
			branchId: query.branchId,
			sort: `${query.sortDirection === 'desc' ? '-' : ''}${query.sortField}`
		}
	};
};
