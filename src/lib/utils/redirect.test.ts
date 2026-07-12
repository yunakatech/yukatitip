import { describe, expect, it } from 'vitest';

import { sanitizeRedirectPath } from './redirect';

describe('sanitizeRedirectPath', () => {
	it('keeps internal paths', () => {
		expect(sanitizeRedirectPath('/app/dashboard?tab=today', '/login')).toBe(
			'/app/dashboard?tab=today'
		);
	});

	it('rejects external origins', () => {
		expect(sanitizeRedirectPath('https://example.com/app/dashboard', '/login')).toBe(
			'/app/dashboard'
		);
	});

	it('rejects protocol-relative paths', () => {
		expect(sanitizeRedirectPath('//example.com/app/dashboard', '/login')).toBe('/app/dashboard');
	});

	it('rejects login routes as redirect targets', () => {
		expect(sanitizeRedirectPath('/login', '/login')).toBe('/app/dashboard');
	});
});
