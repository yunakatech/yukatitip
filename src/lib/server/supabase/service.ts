import { createClient } from '@supabase/supabase-js';

import { getAppConfig } from '$lib/server/config/env';
import type { Database } from '$lib/supabase/database';

export function createSupabaseServiceRoleClient() {
	const config = getAppConfig(['SUPABASE_SERVICE_ROLE_KEY']);
	const supabaseUrl = config.public.supabaseUrl;
	const supabasePublishableKey = config.public.supabasePublishableKey;
	const serviceRoleKey = config.private.secretKeys.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !supabasePublishableKey || !serviceRoleKey) {
		throw new Error(
			'Konfigurasi Yukatitip tidak valid: PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, dan SUPABASE_SERVICE_ROLE_KEY wajib tersedia.'
		);
	}

	return createClient<Database>(supabaseUrl, serviceRoleKey, {
		auth: {
			autoRefreshToken: false,
			detectSessionInUrl: false,
			persistSession: false
		}
	});
}
