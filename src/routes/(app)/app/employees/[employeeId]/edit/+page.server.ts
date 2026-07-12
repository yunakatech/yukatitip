import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { getEmployeeDetail, parseEmployeeInput, updateEmployee } from '$lib/server/master-data/employees';
import { MasterDataError } from '$lib/server/master-data/errors';
import { createSupabaseServiceRoleClient } from '$lib/server/supabase/service';
import {
	loadAssignmentBranchOptions,
	loadAssignmentPositionOptions,
	loadAssignmentSupervisorOptions
} from '$lib/server/master-data/employee-assignment-form';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.auth) {
		throw redirect(303, '/login');
	}

	const auth = locals.auth;
	const employee = await getEmployeeDetail(locals.supabase, params.employeeId, auth);
	const [branchOptions, positionOptions] = await Promise.all([
		loadAssignmentBranchOptions(auth, locals.supabase),
		loadAssignmentPositionOptions(locals.supabase)
	]);
	const supervisorBranchId = employee.branch?.id ?? auth.branch?.id ?? '';
	const supervisorOptions = supervisorBranchId
		? await loadAssignmentSupervisorOptions(locals.supabase, supervisorBranchId, params.employeeId)
		: [];

	return {
		employee,
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
			const employee = await updateEmployee(serviceClient, auth, event.params.employeeId, input);

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
