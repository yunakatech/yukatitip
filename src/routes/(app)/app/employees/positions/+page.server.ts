import type { PageServerLoad } from './$types';

import { getAppConfig } from '$lib/server/config/env';
import { listPositions } from '$lib/server/master-data/positions';
import { parseListQuery } from '$lib/server/master-data/query';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.auth) {
		return {
			positions: [],
			pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
			filters: { search: '', status: null, branchId: null, sort: 'createdAt' },
			canCreate: false
		};
	}

	const config = getAppConfig();
	const query = parseListQuery(url, {
		defaultPageSize: config.business.defaultPageSize,
		maxPageSize: config.business.maxPageSize,
		defaultSortField: 'createdAt',
		allowedSortFields: ['code', 'name', 'level', 'createdAt', 'updatedAt'],
		allowedStatuses: ['active', 'inactive']
	});

	const data = await listPositions(locals.supabase, locals.auth, query);

	return {
		positions: data.items,
		pagination: {
			page: data.page,
			pageSize: data.pageSize,
			total: data.total,
			totalPages: data.totalPages
		},
		filters: {
			search: query.search,
			status: query.status,
			branchId: query.branchId,
			sort: `${query.sortDirection === 'desc' ? '-' : ''}${query.sortField}`
		},
		canCreate: true
	};
};
