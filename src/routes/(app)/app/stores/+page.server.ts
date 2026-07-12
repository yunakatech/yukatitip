import type { PageServerLoad } from './$types';

import { ROLE_CODES } from '$lib/constants/access';
import { getAppConfig } from '$lib/server/config/env';
import { listStores } from '$lib/server/master-data/stores';
import { parseListQuery } from '$lib/server/master-data/query';

function canEditStores(roleCode: string): boolean {
	return (
		roleCode === ROLE_CODES.OWNER ||
		roleCode === ROLE_CODES.BRANCH_MANAGER ||
		roleCode === ROLE_CODES.BRANCH_ADMIN
	);
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.auth) {
		return {
			stores: [],
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
		allowedSortFields: ['name', 'city', 'createdAt', 'updatedAt'],
		allowedStatuses: ['active', 'inactive']
	});

	const data = await listStores(locals.supabase, locals.auth, query);
	const canCreate = canEditStores(locals.auth.role.code);

	let branchOptions: Array<{ value: string; label: string }> = [];

	if (locals.auth.role.code === ROLE_CODES.OWNER) {
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
		stores: data.items,
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
