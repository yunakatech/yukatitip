import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '$lib/supabase/database';
import type { AuthContext } from '$lib/types/auth';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}

		interface Locals {
			requestId: string;
			supabase: SupabaseClient<Database>;
			auth: AuthContext | null;
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
	}
}

export {};
