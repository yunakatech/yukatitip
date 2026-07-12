import { describe, expect, it } from 'vitest';
import { parseAppConfig } from './env';

describe('parseAppConfig', () => {
	it('uses safe defaults when env missing', () => {
		const config = parseAppConfig();

		expect(config.app.name).toBe('Yukatitip');
		expect(config.app.environment).toBe('development');
		expect(config.app.url).toBe('http://localhost:5173');
		expect(config.public.supabaseUrl).toBeNull();
		expect(config.uploads.maxUploadSizeBytes).toBe(5_242_880);
		expect(config.security.cookieSecure).toBe(false);
		expect(config.rateLimits.loginWindowSeconds).toBe(60);
		expect(config.flags.enableDebugRoutes).toBe(false);
	});

	it('normalizes api base path and trusted origins', () => {
		const config = parseAppConfig(
			{
				PUBLIC_API_BASE_URL: '/api/v1/',
				PUBLIC_APP_URL: 'http://localhost:5173'
			},
			{
				TRUSTED_ORIGINS: 'http://localhost:5173, https://example.com '
			}
		);

		expect(config.app.apiBaseUrl).toBe('/api/v1');
		expect(config.security.trustedOrigins).toEqual([
			'http://localhost:5173',
			'https://example.com'
		]);
	});

	it('rejects placeholder values', () => {
		expect(() =>
			parseAppConfig(
				{
					PUBLIC_APP_URL: '<http://localhost:5173>'
				},
				{}
			)
		).toThrow(/PUBLIC_APP_URL/);
	});

	it('rejects mismatched mirrored config', () => {
		expect(() =>
			parseAppConfig(
				{ PUBLIC_APP_NAME: 'Yukatitip' },
				{ APP_NAME: 'Yukatitip Internal' }
			)
		).toThrow(/PUBLIC_APP_NAME dan APP_NAME/);
	});

	it('requires secrets when requested', () => {
		expect(() => parseAppConfig({}, {}, ['SUPABASE_SERVICE_ROLE_KEY'])).toThrow(
			/SUPABASE_SERVICE_ROLE_KEY/
		);
	});

	it('blocks production with insecure cookie or dev flags', () => {
		expect(() =>
			parseAppConfig(
				{},
				{
					APP_ENV: 'production',
					COOKIE_SECURE: 'false'
				}
			)
		).toThrow(/COOKIE_SECURE wajib true di production/);

		expect(() =>
			parseAppConfig(
				{},
				{
					APP_ENV: 'production',
					COOKIE_SECURE: 'true',
					ENABLE_DEBUG_ROUTES: 'true'
				}
			)
		).toThrow(/Flag development wajib false di production/);
	});
});
