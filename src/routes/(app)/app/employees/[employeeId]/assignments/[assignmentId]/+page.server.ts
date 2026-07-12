import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

import { canManageAssignmentRoutes } from '$lib/server/master-data/employee-assignment-form';
import { getEmployeeDetail } from '$lib/server/master-data/employees';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.auth) {
		throw redirect(303, '/login');
	}

	const employee = await getEmployeeDetail(locals.supabase, params.employeeId, locals.auth);
	const assignment = employee.assignments.find((item) => item.id === params.assignmentId);

	if (!assignment) {
		throw error(404, 'Assignment tidak ditemukan.');
	}

	return {
		employee,
		assignment,
		canManageAssignments: canManageAssignmentRoutes(locals.auth.role.code)
	};
};
