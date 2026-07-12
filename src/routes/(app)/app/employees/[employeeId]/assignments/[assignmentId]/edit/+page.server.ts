import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { createSupabaseServiceRoleClient } from '$lib/server/supabase/service';
import { applyEmployeeAssignmentRpc } from '$lib/server/master-data/employee-assignment-rpc';
import { MasterDataError } from '$lib/server/master-data/errors';
import { getEmployeeDetail } from '$lib/server/master-data/employees';
import { assertEmployeeManager } from '$lib/server/master-data/auth';
import {
	buildAssignmentEditDefaults,
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

	const employee = await getEmployeeDetail(locals.supabase, params.employeeId, locals.auth);
	const assignment = employee.assignments.find((item) => item.id === params.assignmentId);

	if (!assignment) {
		throw error(404, 'Assignment tidak ditemukan.');
	}

	const branchOptions = await loadAssignmentBranchOptions(locals.auth, locals.supabase);
	const positionOptions = await loadAssignmentPositionOptions(locals.supabase);
	const branchId = assignment.branch?.id ?? employee.branch?.id ?? locals.auth.branch?.id ?? '';
	const supervisorOptions = branchId
		? await loadAssignmentSupervisorOptions(locals.supabase, branchId, employee.id)
		: [];

	return {
		employee,
		assignment,
		branchOptions,
		positionOptions,
		supervisorOptions,
		defaults: buildAssignmentEditDefaults(employee, assignment),
		canManageAssignments: canManageAssignmentRoutes(locals.auth.role.code)
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
		const assignment = employee.assignments.find((item) => item.id === params.assignmentId);

		if (!assignment) {
			throw redirect(303, `/app/employees/${employee.id}/assignments`);
		}

		const input = parseAssignmentFormData(await request.formData());
		assertEmployeeManager(auth, input.branchId ?? assignment.branch?.id ?? employee.branch?.id ?? null);

		const serviceClient = createSupabaseServiceRoleClient();

		try {
			const result = await applyEmployeeAssignmentRpc(serviceClient, {
				action: 'correct_assignment',
				payload: {
					employeeId: employee.id,
					assignmentId: assignment.id,
					branchId: input.branchId,
					positionId: input.positionId,
					supervisorEmployeeId: input.supervisorEmployeeId,
					effectiveFrom: input.effectiveFrom,
					reason: input.reason,
					expectedUpdatedAt: input.expectedUpdatedAt ?? assignment.updatedAt
				},
				actorProfileId: auth.profile.id,
				requestId: locals.requestId,
				userAgent: request.headers.get('user-agent')
			});

			throw redirect(303, `/app/employees/${employee.id}/assignments/${result.assignmentId ?? assignment.id}`);
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
						expectedUpdatedAt: input.expectedUpdatedAt ?? assignment.updatedAt
					}
				});
			}

			throw error;
		}
	}
};
