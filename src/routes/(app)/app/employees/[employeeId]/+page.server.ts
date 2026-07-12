import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

import { ROLE_CODES } from '$lib/constants/access';
import { getEmployeeDetail } from '$lib/server/master-data/employees';

function canEditEmployees(roleCode: string): boolean {
	return roleCode === ROLE_CODES.OWNER || roleCode === ROLE_CODES.BRANCH_MANAGER;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.auth) {
		throw redirect(303, '/login');
	}

	const employee = await getEmployeeDetail(locals.supabase, params.employeeId, locals.auth);
	const canEdit = canEditEmployees(locals.auth.role.code);

	return {
		employee,
		canEdit
	};
};
