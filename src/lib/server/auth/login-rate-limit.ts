import type { RequestEvent } from '@sveltejs/kit';

import type { AppConfig } from '$lib/server/config/env';

import { consumeInMemoryRateLimit } from './rate-limit';

const textEncoder = new TextEncoder();
const KV_KEY_PREFIX = 'rate-limit:login';

type KvRateLimitState = {
	count: number;
	resetAt: number;
};

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

async function hashValue(value: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(value));

	return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function buildLoginRateLimitKey(email: string): Promise<string> {
	return hashValue(normalizeEmail(email));
}

function isKvRateLimitState(value: unknown): value is KvRateLimitState {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as KvRateLimitState).count === 'number' &&
		typeof (value as KvRateLimitState).resetAt === 'number'
	);
}

async function consumeKvRateLimit(
	kv: KVNamespace,
	key: string,
	limit: number,
	windowSeconds: number
): Promise<boolean> {
	const storageKey = `${KV_KEY_PREFIX}:${key}`;
	const now = Date.now();
	const current = await kv.get(storageKey, 'json');
	const windowMs = windowSeconds * 1000;
	const state =
		isKvRateLimitState(current) && current.resetAt > now
			? current
			: { count: 0, resetAt: now + windowMs };

	if (state.count >= limit) {
		return false;
	}

	const nextState = {
		count: state.count + 1,
		resetAt: state.resetAt
	};
	const ttlSeconds = Math.max(1, Math.ceil((nextState.resetAt - now) / 1000));

	await kv.put(storageKey, JSON.stringify(nextState), {
		expirationTtl: ttlSeconds
	});

	return true;
}

export async function allowLoginAttempt(
	event: Pick<RequestEvent, 'platform'>,
	email: string,
	config: AppConfig
): Promise<boolean> {
	const key = await buildLoginRateLimitKey(email);
	const rateLimiter = event.platform?.env.LOGIN_RATE_LIMITER;

	if (rateLimiter) {
		const outcome = await rateLimiter.limit({ key });
		return outcome.success;
	}

	if (config.rateLimits.loginStrategy === 'waf') {
		return true;
	}

	const kv = event.platform?.env.YUKATITIP_CONFIG_KV;

	if (kv && (config.rateLimits.loginStrategy === 'kv' || config.app.environment !== 'development')) {
		return consumeKvRateLimit(
			kv,
			key,
			config.rateLimits.loginRequests,
			config.rateLimits.loginWindowSeconds
		);
	}

	if (config.app.environment !== 'development') {
		throw new Error(
			'Konfigurasi Yukatitip tidak valid: LOGIN_RATE_LIMITER atau YUKATITIP_CONFIG_KV wajib tersedia di preview/production, kecuali LOGIN_RATE_LIMIT_STRATEGY=waf.'
		);
	}

	return consumeInMemoryRateLimit(
		key,
		config.rateLimits.loginRequests,
		config.rateLimits.loginWindowSeconds * 1000
	).allowed;
}
