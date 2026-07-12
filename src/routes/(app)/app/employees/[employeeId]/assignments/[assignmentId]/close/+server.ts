import { redirect, type RequestHandler } from '@sveltejs/kit';

import { createSupabaseServiceRoleClient } from '$lib/server/supabase/service';
import { getEmployeeDetail } from '$lib/server/master-data/employees';
import { applyEmployeeAssignmentRpc } from '$lib/server/master-data/employee-assignment-rpc';
import { MasterDataError } from '$lib/server/master-data/errors';
import { assertEmployeeManager } from '$lib/server/master-data/auth';

function buildErrorRedirect(employeeId: string, message: string): string {
	return `/app/employees/${employeeId}/assignments?closeError=${encodeURIComponent(message)}`;
}

export const POST: RequestHandler = async (event) => {
	const { locals, params, request } = event;
	const employeeId = params.employeeId!;
	const assignmentId = params.assignmentId!;

	if (!locals.auth) {
		throw redirect(303, '/login');
	}

	const serviceClient = createSupabaseServiceRoleClient();

	try {
		const employee = await getEmployeeDetail(locals.supabase, employeeId, locals.auth);
		assertEmployeeManager(locals.auth, employee.branch?.id ?? null);

		const formData = await request.formData();
		const expectedUpdatedAt = String(formData.get('expectedUpdatedAt') ?? '').trim() || null;
		const closeEffectiveUntil = String(formData.get('closeEffectiveUntil') ?? '').trim() || null;

		await applyEmployeeAssignmentRpc(serviceClient, {
			action: 'close_assignment',
			payload: {
				employeeId: employee.id,
				assignmentId,
				expectedUpdatedAt,
				closeEffectiveUntil,
				employmentStatus: 'inactive'
			},
			actorProfileId: locals.auth.profile.id,
			requestId: locals.requestId,
			userAgent: request.headers.get('user-agent')
		});

		throw redirect(303, `/app/employees/${employee.id}/assignments`);
	} catch (error) {
		if (error instanceof MasterDataError) {
			throw redirect(303, buildErrorRedirect(employeeId, error.message));
		}

		throw error;
	}
};
