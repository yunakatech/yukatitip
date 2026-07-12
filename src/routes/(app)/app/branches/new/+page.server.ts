import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { createSupabaseServiceRoleClient } from '$lib/server/supabase/service';
import { createBranch, parseBranchInput } from '$lib/server/master-data/branches';
import { writeAuditLog } from '$lib/server/master-data/audit';
import { MasterDataError } from '$lib/server/master-data/errors';
import { assertOwner } from '$lib/server/master-data/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.auth) {
		throw redirect(303, '/login');
	}

	assertOwner(locals.auth);

	return {
		branch: null
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
		const input = parseBranchInput(await event.request.formData());

		try {
			const branch = await createBranch(serviceClient, auth, input);

			await writeAuditLog(serviceClient, {
				requestId: locals.requestId,
				actorProfileId: auth.profile.id,
				action: 'branch.created',
				entityType: 'branch',
				entityId: branch.id,
				newValues: {
					code: branch.code,
					name: branch.name,
					city: branch.city,
					isActive: branch.isActive,
					headEmployeeId: branch.headEmployee?.id ?? null
				}
			});

			throw redirect(303, `/app/branches/${branch.id}`);
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
