import { createBrowserClient } from '@supabase/ssr';

import type { Database } from './database';

export interface SupabaseBrowserClientConfig {
	url: string;
	publishableKey: string;
}

export function createSupabaseBrowserClient(config: SupabaseBrowserClientConfig) {
	return createBrowserClient<Database>(config.url, config.publishableKey);
}
