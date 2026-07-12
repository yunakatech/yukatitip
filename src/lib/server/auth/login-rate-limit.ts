import type { RequestEvent } from '@sveltejs/kit';

import type { AppConfig } from '$lib/server/config/env';

import { consumeInMemoryRateLimit } from './rate-limit';

const textEncoder = new TextEncoder();

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

	if (config.app.environment !== 'development') {
		throw new Error(
			'Konfigurasi Yukatitip tidak valid: binding LOGIN_RATE_LIMITER wajib tersedia di preview/production.'
		);
	}

	return consumeInMemoryRateLimit(
		key,
		config.rateLimits.loginRequests,
		config.rateLimits.loginWindowSeconds * 1000
	).allowed;
}
