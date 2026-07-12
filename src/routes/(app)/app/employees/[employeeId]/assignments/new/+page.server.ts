import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { createSupabaseServiceRoleClient } from '$lib/server/supabase/service';
import { getEmployeeDetail } from '$lib/server/master-data/employees';
import { applyEmployeeAssignmentRpc } from '$lib/server/master-data/employee-assignment-rpc';
import { MasterDataError } from '$lib/server/master-data/errors';
import { assertEmployeeManager } from '$lib/server/master-data/auth';
import {
	buildAssignmentDefaults,
	canManageAssignmentRoutes,
	loadAssignmentBranchOptions,
	loadAssignmentPositionOptions,
	loadAssignmentSupervisorOptions,
	parseAssignmentFormData
} from '$lib/server/master-data/employee-assignment-form';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.auth) {
		throw redirect(303, '/login');
	}

	const auth = locals.auth;
	const employee = await getEmployeeDetail(locals.supabase, params.employeeId, auth);
	const branchOptions = await loadAssignmentBranchOptions(auth, locals.supabase);
	const positionOptions = await loadAssignmentPositionOptions(locals.supabase);
	const branchId = employee.branch?.id ?? auth.branch?.id ?? '';
	const supervisorOptions = branchId
		? await loadAssignmentSupervisorOptions(locals.supabase, branchId, employee.id)
		: [];

	return {
		employee,
		branchOptions,
		positionOptions,
		supervisorOptions,
		defaults: buildAssignmentDefaults(employee),
		canManageAssignments: canManageAssignmentRoutes(auth.role.code)
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { locals, params, request } = event;
		const auth = locals.auth;

		if (!auth) {
			throw redirect(303, '/login');
		}

		const employee = await getEmployeeDetail(locals.supabase, params.employeeId, auth);
		const input = parseAssignmentFormData(await request.formData());
		assertEmployeeManager(auth, input.branchId ?? employee.branch?.id ?? null);

		const serviceClient = createSupabaseServiceRoleClient();
		const hasCurrentAssignment = employee.assignments.some((assignment) => assignment.isCurrent);
		const action = hasCurrentAssignment ? 'transfer_assignment' : 'create_assignment';

		try {
			const result = await applyEmployeeAssignmentRpc(serviceClient, {
				action,
				payload: {
					employeeId: employee.id,
					branchId: input.branchId,
					positionId: input.positionId,
					supervisorEmployeeId: input.supervisorEmployeeId,
					effectiveFrom: input.effectiveFrom,
					reason: input.reason,
					expectedUpdatedAt: input.expectedUpdatedAt ?? employee.updatedAt
				},
				actorProfileId: auth.profile.id,
				requestId: locals.requestId,
				userAgent: request.headers.get('user-agent')
			});

			throw redirect(
				303,
				result.assignmentId
					? `/app/employees/${employee.id}/assignments/${result.assignmentId}`
					: `/app/employees/${employee.id}/assignments`
			);
		} catch (error) {
			if (error instanceof MasterDataError) {
				return fail(error.status, {
					error: error.message,
					fieldErrors: error.fieldErrors,
					values: {
						branchId: input.branchId,
						positionId: input.positionId,
						supervisorEmployeeId: input.supervisorEmployeeId ?? '',
						effectiveFrom: input.effectiveFrom,
						reason: input.reason,
						expectedUpdatedAt: input.expectedUpdatedAt ?? employee.updatedAt
					}
				});
			}

			throw error;
		}
	}
};
