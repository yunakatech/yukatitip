import type { SupabaseClient } from '@supabase/supabase-js';

import type { Json } from '$lib/supabase/database';
import type { Database } from '$lib/supabase/database';

export interface AuditLogInput {
	requestId: string;
	actorProfileId: string;
	action: string;
	entityType: string;
	entityId: string | null;
	oldValues?: Json | null;
	newValues?: Json | null;
	ipAddress?: string | null;
	userAgent?: string | null;
}

export async function writeAuditLog(
	client: SupabaseClient<Database>,
	input: AuditLogInput
): Promise<void> {
	const payload = {
		request_id: input.requestId,
		actor_profile_id: input.actorProfileId,
		action: input.action,
		entity_type: input.entityType,
		entity_id: input.entityId,
		old_values: input.oldValues ?? null,
		new_values: input.newValues ?? null,
		ip_address: input.ipAddress ?? null,
		user_agent: input.userAgent ?? null
	} as never;

	const { error } = await client.from('audit_logs').insert(payload);

	if (error) {
		throw error;
	}
}
