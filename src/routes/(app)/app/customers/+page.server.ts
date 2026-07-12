import type { PageServerLoad } from './$types';

import { ROLE_CODES } from '$lib/constants/access';
import { getAppConfig } from '$lib/server/config/env';
import { listCustomers, type CustomerListQuery } from '$lib/server/master-data/customers';
import { parseListQuery } from '$lib/server/master-data/query';
import { validationError } from '$lib/server/master-data/errors';

const CUSTOMER_TYPE_VALUES = ['individual', 'business', 'reseller'] as const;
function canEditCustomers(roleCode: string): boolean {
	return (
		roleCode === ROLE_CODES.OWNER ||
		roleCode === ROLE_CODES.BRANCH_MANAGER ||
		roleCode === ROLE_CODES.BRANCH_ADMIN
	);
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.auth) {
		return {
			customers: [],
			pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
			filters: { search: '', status: null, branchId: null, sort: 'createdAt', customerType: null },
			branchOptions: [],
			canCreate: false
		};
	}

	const config = getAppConfig();
	const query = parseListQuery(url, {
		defaultPageSize: config.business.defaultPageSize,
		maxPageSize: config.business.maxPageSize,
		defaultSortField: 'createdAt',
		allowedSortFields: ['name', 'phone', 'city', 'status', 'createdAt', 'updatedAt'],
		allowedStatuses: ['active', 'inactive', 'suspended']
	});

	const rawCustomerType = url.searchParams.get('customerType');
	const customerType =
		rawCustomerType && rawCustomerType.trim()
			? ((() => {
					const normalized = rawCustomerType.trim();
					if (!CUSTOMER_TYPE_VALUES.includes(normalized as (typeof CUSTOMER_TYPE_VALUES)[number])) {
						throw validationError('Filter tipe customer tidak valid.');
					}

					return normalized as CustomerListQuery['customerType'];
				})())
			: null;

	const data = await listCustomers(locals.supabase, locals.auth, {
		...query,
		customerType
	});
	const canCreate = canEditCustomers(locals.auth.role.code);

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
		customers: data.items,
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
			sort: `${query.sortDirection === 'desc' ? '-' : ''}${query.sortField}`,
			customerType
		},
		branchOptions,
		canCreate
	};
};
