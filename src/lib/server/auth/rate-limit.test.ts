import { beforeEach, describe, expect, it } from 'vitest';

import { consumeInMemoryRateLimit, resetInMemoryRateLimitState } from './rate-limit';

describe('consumeInMemoryRateLimit', () => {
	beforeEach(() => {
		resetInMemoryRateLimitState();
	});

	it('allows requests until the limit is reached', () => {
		expect(consumeInMemoryRateLimit('login:1', 2, 1000, 0)).toEqual({
			allowed: true,
			remaining: 1,
			retryAfterSeconds: 1,
			resetAt: 1000
		});

		expect(consumeInMemoryRateLimit('login:1', 2, 1000, 1)).toEqual({
			allowed: true,
			remaining: 0,
			retryAfterSeconds: 1,
			resetAt: 1000
		});

		expect(consumeInMemoryRateLimit('login:1', 2, 1000, 2)).toEqual({
			allowed: false,
			remaining: 0,
			retryAfterSeconds: 1,
			resetAt: 1000
		});
	});

	it('resets after the window expires', () => {
		expect(consumeInMemoryRateLimit('login:2', 1, 1000, 0)).toEqual({
			allowed: true,
			remaining: 0,
			retryAfterSeconds: 1,
			resetAt: 1000
		});

		expect(consumeInMemoryRateLimit('login:2', 1, 1000, 1001)).toEqual({
			allowed: true,
			remaining: 0,
			retryAfterSeconds: 1,
			resetAt: 2001
		});
	});
});
