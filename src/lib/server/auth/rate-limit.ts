interface RateLimitBucket {
	count: number;
	resetAt: number;
}

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	retryAfterSeconds: number;
	resetAt: number;
}

const buckets = new Map<string, RateLimitBucket>();

function purgeExpiredBuckets(now: number): void {
	for (const [key, bucket] of buckets.entries()) {
		if (bucket.resetAt <= now) {
			buckets.delete(key);
		}
	}
}

export function consumeInMemoryRateLimit(
	key: string,
	limit: number,
	windowMs: number,
	now = Date.now()
): RateLimitResult {
	purgeExpiredBuckets(now);

	const existingBucket = buckets.get(key);

	if (!existingBucket || existingBucket.resetAt <= now) {
		const resetAt = now + windowMs;
		buckets.set(key, { count: 1, resetAt });

		return {
			allowed: true,
			remaining: Math.max(0, limit - 1),
			retryAfterSeconds: Math.ceil(windowMs / 1000),
			resetAt
		};
	}

	if (existingBucket.count >= limit) {
		return {
			allowed: false,
			remaining: 0,
			retryAfterSeconds: Math.max(1, Math.ceil((existingBucket.resetAt - now) / 1000)),
			resetAt: existingBucket.resetAt
		};
	}

	existingBucket.count += 1;

	return {
		allowed: true,
		remaining: Math.max(0, limit - existingBucket.count),
		retryAfterSeconds: Math.max(1, Math.ceil((existingBucket.resetAt - now) / 1000)),
		resetAt: existingBucket.resetAt
	};
}

export function resetInMemoryRateLimitState(): void {
	buckets.clear();
}
