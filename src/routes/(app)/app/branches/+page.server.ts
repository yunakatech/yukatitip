import type { PageServerLoad } from './$types';

import { ROLE_CODES } from '$lib/constants/access';
import { getAppConfig } from '$lib/server/config/env';
import { listBranches } from '$lib/server/master-data/branches';
import { parseListQuery } from '$lib/server/master-data/query';

export const load: PageServerLoad = async ({ locals, url }) => {
	const auth = locals.auth;

	if (!auth) {
		return {
			branches: [],
			pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
			filters: { search: '', status: null, branchId: null, sort: 'createdAt' },
			branchOptions: [],
			canCreate: false
		};
	}

	const config = getAppConfig();
	const query = parseListQuery(url, {
		defaultPageSize: config.business.defaultPageSize,
		maxPageSize: config.business.maxPageSize,
		defaultSortField: 'createdAt',
		allowedSortFields: ['code', 'name', 'city', 'createdAt', 'updatedAt'],
		allowedStatuses: ['active', 'inactive']
	});

	const data = await listBranches(locals.supabase, auth, query);
	const canCreate = auth.role.code === ROLE_CODES.OWNER;

	let branchOptions: Array<{ value: string; label: string }> = [];

	if (auth.role.code === ROLE_CODES.OWNER) {
		const { data: branches } = await locals.supabase
			.from('branches')
			.select('id, code, name, is_active')
			.order('name', { ascending: true });

		branchOptions =
			branches?.map((branch) => ({
				value: branch.id,
				label: `${branch.code} - ${branch.name}${branch.is_active ? '' : ' (nonaktif)'}`
			})) ?? [];
	}

	return {
		branches: data.items,
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
		branchOptions,
		canCreate
	};
};
