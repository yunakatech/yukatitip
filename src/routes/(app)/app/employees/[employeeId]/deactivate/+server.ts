import { redirect, type RequestHandler } from '@sveltejs/kit';

import { writeAuditLog } from '$lib/server/master-data/audit';
import { deactivateEmployee } from '$lib/server/master-data/employees';
import { MasterDataError } from '$lib/server/master-data/errors';
import { createSupabaseServiceRoleClient } from '$lib/server/supabase/service';
import { apiError, apiSuccess } from '$lib/server/http/api';

export const POST: RequestHandler = async (event) => {
	const { locals } = event;

	if (!locals.auth) {
		throw redirect(303, '/login');
	}

	const serviceClient = createSupabaseServiceRoleClient();

	try {
		const employee = await deactivateEmployee(serviceClient, locals.auth, event.params.employeeId!);

		await writeAuditLog(serviceClient, {
			requestId: locals.requestId,
			actorProfileId: locals.auth.profile.id,
			action: 'employee.deactivated',
			entityType: 'employee',
			entityId: employee.id,
			oldValues: null,
			newValues: { employmentStatus: employee.employmentStatus }
		});

		return apiSuccess(event, { employeeId: employee.id, employmentStatus: employee.employmentStatus });
	} catch (error) {
		if (error instanceof MasterDataError) {
			return apiError(event, error.status, error.code, error.message, error.fieldErrors);
		}

		throw error;
	}
};
