import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

import { parseAppConfig } from '$lib/server/config/env';

import { buildLoginRateLimitKey, allowLoginAttempt } from './login-rate-limit';
import { resetInMemoryRateLimitState } from './rate-limit';

describe('login rate limit', () => {
	beforeEach(() => {
		resetInMemoryRateLimitState();
	});

	it('uses the Cloudflare rate limiting binding in production', async () => {
		const limit = vi.fn().mockResolvedValue({ success: true });
		const event = {
			platform: {
				env: {
					LOGIN_RATE_LIMITER: {
						limit
					}
				}
			}
		} as unknown as Pick<RequestEvent, 'platform'>;
		const config = parseAppConfig({}, { APP_ENV: 'production' });
		const expectedKey = await buildLoginRateLimitKey('  Owner@Yukatitip.Local ');

		await expect(allowLoginAttempt(event, '  Owner@Yukatitip.Local ', config)).resolves.toBe(true);
		expect(limit).toHaveBeenCalledWith({ key: expectedKey });
	});

	it('falls back to in-memory rate limiting only in development', async () => {
		const config = parseAppConfig(
			{},
			{
				APP_ENV: 'development',
				LOGIN_RATE_LIMIT_REQUESTS: '1',
				LOGIN_RATE_LIMIT_WINDOW_SECONDS: '60'
			}
		);
		const event = {} as unknown as Pick<RequestEvent, 'platform'>;

		await expect(allowLoginAttempt(event, 'operator@yukatitip.local', config)).resolves.toBe(true);
		await expect(allowLoginAttempt(event, 'operator@yukatitip.local', config)).resolves.toBe(
			false
		);
	});

	it('fails safely when production is missing the binding', async () => {
		const config = parseAppConfig({}, { APP_ENV: 'production' });
		const event = {} as unknown as Pick<RequestEvent, 'platform'>;

		await expect(allowLoginAttempt(event, 'operator@yukatitip.local', config)).rejects.toThrow(
			/LOGIN_RATE_LIMITER/
		);
	});
});
