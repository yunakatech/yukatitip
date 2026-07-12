import type { AppConfig } from '$lib/server/config/env';

function normalizeOrigin(value: string): string | null {
	try {
		return new URL(value).origin;
	} catch {
		return null;
	}
}

export function isTrustedMutationOrigin(
	requestOrigin: string | null,
	requestUrlOrigin: string,
	config: Pick<AppConfig, 'security'>
): boolean {
	const normalizedRequestOrigin = requestOrigin ? normalizeOrigin(requestOrigin) : null;
	const normalizedRequestUrlOrigin = normalizeOrigin(requestUrlOrigin);

	if (!normalizedRequestOrigin || !normalizedRequestUrlOrigin) {
		return false;
	}

	if (normalizedRequestOrigin === normalizedRequestUrlOrigin) {
		return true;
	}

	return config.security.trustedOrigins
		.map(normalizeOrigin)
		.filter((origin): origin is string => origin !== null)
		.includes(normalizedRequestOrigin);
}
