import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { assertOwner } from '$lib/server/master-data/auth';
import { writeAuditLog } from '$lib/server/master-data/audit';
import { getBranchDetail, parseBranchInput, updateBranch } from '$lib/server/master-data/branches';
import { MasterDataError } from '$lib/server/master-data/errors';
import { createSupabaseServiceRoleClient } from '$lib/server/supabase/service';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.auth) {
		throw redirect(303, '/login');
	}

	assertOwner(locals.auth);

	const branch = await getBranchDetail(locals.supabase, params.branchId, locals.auth);
	const { data: branchManagerPosition } = await locals.supabase
		.from('positions')
		.select('id, code, name')
		.eq('code', 'branch_manager')
		.maybeSingle();

	const employees = branchManagerPosition
		? (
				await locals.supabase
					.from('employees')
					.select('id, full_name')
					.eq('branch_id', params.branchId)
					.eq('employment_status', 'active')
					.eq('position_id', branchManagerPosition.id)
					.order('full_name', { ascending: true })
			).data ?? []
		: [];

	const headEmployeeOptions =
		employees?.map((employee) => ({
			value: employee.id,
			label: `${employee.full_name} - Kepala Cabang`,
			selected: branch.headEmployee?.id === employee.id
		})) ?? [];

	return {
		branch,
		headEmployeeOptions
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
			const branch = await updateBranch(serviceClient, auth, event.params.branchId, input);

			await writeAuditLog(serviceClient, {
				requestId: locals.requestId,
				actorProfileId: auth.profile.id,
				action: 'branch.updated',
				entityType: 'branch',
				entityId: branch.id,
				oldValues: null,
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
