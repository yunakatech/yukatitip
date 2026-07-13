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

	it('uses the configured KV binding when Pages cannot provide a rate limiting binding', async () => {
		const store = new Map<string, string>();
		const kv = {
			get: vi.fn(async (key: string) => {
				const value = store.get(key);
				return value ? JSON.parse(value) : null;
			}),
			put: vi.fn(async (key: string, value: string) => {
				store.set(key, value);
			})
		};
		const event = {
			platform: {
				env: {
					YUKATITIP_CONFIG_KV: kv
				}
			}
		} as unknown as Pick<RequestEvent, 'platform'>;
		const config = parseAppConfig(
			{},
			{
				APP_ENV: 'production',
				LOGIN_RATE_LIMIT_STRATEGY: 'kv',
				LOGIN_RATE_LIMIT_REQUESTS: '1',
				LOGIN_RATE_LIMIT_WINDOW_SECONDS: '60'
			}
		);

		await expect(allowLoginAttempt(event, 'operator@yukatitip.local', config)).resolves.toBe(true);
		await expect(allowLoginAttempt(event, 'operator@yukatitip.local', config)).resolves.toBe(false);
		expect(kv.put).toHaveBeenCalledWith(
			expect.stringContaining('rate-limit:login:'),
			expect.any(String),
			expect.objectContaining({ expirationTtl: 60 })
		);
	});

	it('fails safely when production is missing the binding', async () => {
		const config = parseAppConfig({}, { APP_ENV: 'production' });
		const event = {} as unknown as Pick<RequestEvent, 'platform'>;

		await expect(allowLoginAttempt(event, 'operator@yukatitip.local', config)).rejects.toThrow(
			/LOGIN_RATE_LIMITER atau YUKATITIP_CONFIG_KV/
		);
	});

	it('allows production to delegate login rate limiting to Cloudflare WAF explicitly', async () => {
		const config = parseAppConfig(
			{},
			{
				APP_ENV: 'production',
				LOGIN_RATE_LIMIT_STRATEGY: 'waf'
			}
		);
		const event = {} as unknown as Pick<RequestEvent, 'platform'>;

		await expect(allowLoginAttempt(event, 'operator@yukatitip.local', config)).resolves.toBe(true);
	});
});
