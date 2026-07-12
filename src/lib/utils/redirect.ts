export const DEFAULT_LOGIN_REDIRECT = '/app/dashboard';
const APP_REDIRECT_PREFIX = '/app';

function normalizePathCandidate(value: string): string | null {
	try {
		const resolved = new URL(value, 'https://yukatitip.local');

		if (resolved.origin !== 'https://yukatitip.local') {
			return null;
		}

		const internalPath = `${resolved.pathname}${resolved.search}${resolved.hash}`;

		if (!internalPath.startsWith('/') || internalPath.startsWith('//')) {
			return null;
		}

		if (internalPath !== APP_REDIRECT_PREFIX && !internalPath.startsWith('/app/')) {
			return null;
		}

		return internalPath;
	} catch {
		return null;
	}
}

export function sanitizeRedirectPath(value: string | null | undefined, fallback = DEFAULT_LOGIN_REDIRECT): string {
	const safeFallback = normalizePathCandidate(fallback) ?? DEFAULT_LOGIN_REDIRECT;

	if (!value) {
		return safeFallback;
	}

	const normalized = normalizePathCandidate(value.trim());
	return normalized ?? safeFallback;
}
