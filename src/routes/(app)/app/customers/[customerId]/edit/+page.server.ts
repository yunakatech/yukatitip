import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { ROLE_CODES } from '$lib/constants/access';
import { writeAuditLog } from '$lib/server/master-data/audit';
import { getCustomerDetail, parseCustomerInput, updateCustomer } from '$lib/server/master-data/customers';
import { MasterDataError } from '$lib/server/master-data/errors';
import { createSupabaseServiceRoleClient } from '$lib/server/supabase/service';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.auth) {
		throw redirect(303, '/login');
	}

	const customer = await getCustomerDetail(locals.supabase, params.customerId, locals.auth);
	const auth = locals.auth;
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
	} else if (auth.branch) {
		branchOptions = [{ value: auth.branch.id, label: `${auth.branch.code} - ${auth.branch.name}` }];
	}

	return {
		customer,
		branchOptions
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { locals } = event;
		const auth = locals.auth;

		if (!auth) {
			throw redirect(303, '/login');
		}

		const serviceClient = createSupabaseServiceRoleClient();
		const input = parseCustomerInput(await event.request.formData());

		try {
			const customer = await updateCustomer(serviceClient, auth, event.params.customerId, input);

			await writeAuditLog(serviceClient, {
				requestId: locals.requestId,
				actorProfileId: auth.profile.id,
				action: 'customer.updated',
				entityType: 'customer',
				entityId: customer.id,
				oldValues: null,
				newValues: {
					name: customer.name,
					phone: customer.phone,
					customerType: customer.customerType,
					homeBranchId: customer.homeBranch?.id ?? null,
					status: customer.status
				}
			});

			throw redirect(303, `/app/customers/${customer.id}`);
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
