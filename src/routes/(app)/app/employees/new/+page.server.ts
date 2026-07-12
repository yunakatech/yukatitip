import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { createEmployee, parseEmployeeInput } from '$lib/server/master-data/employees';
import { MasterDataError } from '$lib/server/master-data/errors';
import { createSupabaseServiceRoleClient } from '$lib/server/supabase/service';
import {
	loadAssignmentBranchOptions,
	loadAssignmentPositionOptions,
	loadAssignmentSupervisorOptions
} from '$lib/server/master-data/employee-assignment-form';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.auth) {
		throw redirect(303, '/login');
	}

	const auth = locals.auth;
	const [branchOptions, positionOptions] = await Promise.all([
		loadAssignmentBranchOptions(auth, locals.supabase),
		loadAssignmentPositionOptions(locals.supabase)
	]);
	const supervisorOptions = auth.branch
		? await loadAssignmentSupervisorOptions(locals.supabase, auth.branch.id, '00000000-0000-4000-8000-000000000000')
		: [];

	return {
		branchOptions,
		positionOptions,
		supervisorOptions
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
		const input = parseEmployeeInput(await event.request.formData());

		try {
			const employee = await createEmployee(serviceClient, auth, input);

			throw redirect(303, `/app/employees/${employee.id}`);
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
