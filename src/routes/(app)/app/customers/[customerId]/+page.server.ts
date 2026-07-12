import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

import { ROLE_CODES } from '$lib/constants/access';
import { getCustomerDetail } from '$lib/server/master-data/customers';

function canEditCustomers(roleCode: string): boolean {
	return (
		roleCode === ROLE_CODES.OWNER ||
		roleCode === ROLE_CODES.BRANCH_MANAGER ||
		roleCode === ROLE_CODES.BRANCH_ADMIN
	);
}

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.auth) {
		throw redirect(303, '/login');
	}

	const customer = await getCustomerDetail(locals.supabase, params.customerId, locals.auth);
	const canEdit = canEditCustomers(locals.auth.role.code);

	return {
		customer,
		canEdit
	};
};
