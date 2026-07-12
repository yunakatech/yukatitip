import type { RequestEvent } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';

import { getAppConfig, type AppConfig } from '$lib/server/config/env';
import type { Database } from '$lib/supabase/database';

function assertSupabaseConfig(
	config: AppConfig
): asserts config is AppConfig & {
	public: {
		supabaseUrl: string;
		supabasePublishableKey: string;
	};
} {
	if (!config.public.supabaseUrl || !config.public.supabasePublishableKey) {
		throw new Error(
			'Konfigurasi Yukatitip tidak valid: PUBLIC_SUPABASE_URL dan PUBLIC_SUPABASE_PUBLISHABLE_KEY wajib tersedia.'
		);
	}
}

export function createSupabaseServerClient(event: RequestEvent, config: AppConfig = getAppConfig()) {
	assertSupabaseConfig(config);

	return createServerClient<Database>(config.public.supabaseUrl, config.public.supabasePublishableKey, {
		cookies: {
			getAll() {
				return event.cookies.getAll();
			},
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, {
						...options,
						path: '/'
					});
				});
			}
		}
	});
}
