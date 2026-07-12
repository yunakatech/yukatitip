import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

const PRIVATE_SECRET_KEYS = [
	'SUPABASE_SERVICE_ROLE_KEY',
	'TURNSTILE_SECRET_KEY',
	'CSRF_SECRET',
	'IDEMPOTENCY_SECRET',
	'R2_ACCESS_KEY_ID',
	'R2_SECRET_ACCESS_KEY',
	'CLOUDFLARE_ACCOUNT_ID'
] as const;

export type PrivateSecretKey = (typeof PRIVATE_SECRET_KEYS)[number];

export type AppEnvironment = 'development' | 'preview' | 'production';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type CookieSameSite = 'lax' | 'strict';

type EnvSource = Record<string, string | undefined>;

export interface AppConfig {
	app: {
		name: string;
		environment: AppEnvironment;
		url: string;
		apiBaseUrl: string;
		timezone: string;
		locale: string;
		logLevel: LogLevel;
		assetBaseUrl: string | null;
	};
	public: {
		supabaseUrl: string | null;
		supabasePublishableKey: string | null;
		turnstileSiteKey: string | null;
	};
	private: {
		secretKeys: Record<PrivateSecretKey, string | null>;
		r2S3Endpoint: string | null;
		r2PrivateBucketName: string | null;
		r2PublicBucketName: string | null;
	};
	bindings: {
		r2PrivateBucketBinding: string;
		r2PublicBucketBinding: string;
		kvConfigBinding: string;
	};
	security: {
		sessionCookieName: string;
		cookieDomain: string | null;
		cookieSecure: boolean;
		cookieSameSite: CookieSameSite;
		trustedOrigins: string[];
	};
	uploads: {
		maxUploadSizeBytes: number;
		allowedImageMimeTypes: string[];
		allowedDocumentMimeTypes: string[];
		r2UploadUrlTtlSeconds: number;
		r2DownloadUrlTtlSeconds: number;
	};
	rateLimits: {
		trackingRequests: number;
		trackingWindowSeconds: number;
		loginRequests: number;
		loginWindowSeconds: number;
		orderCreateRequests: number;
		orderCreateWindowSeconds: number;
	};
	business: {
		defaultCurrency: string;
		defaultLocale: string;
		defaultPageSize: number;
		maxPageSize: number;
		trackingPhoneLastDigits: number;
	};
	flags: {
		enableDevSeed: boolean;
		enableDebugRoutes: boolean;
		disableTurnstileInLocal: boolean;
		mockR2Uploads: boolean;
	};
}

const DEFAULTS = {
	appName: 'Yukatitip',
	appEnvironment: 'development' as AppEnvironment,
	appUrl: 'http://localhost:5173',
	apiBaseUrl: '/api/v1',
	timezone: 'Asia/Makassar',
	locale: 'id-ID',
	logLevel: 'info' as LogLevel,
	assetBaseUrl: null as string | null,
	supabaseUrl: null as string | null,
	supabasePublishableKey: null as string | null,
	turnstileSiteKey: null as string | null,
	sessionCookieName: 'yukatitip_session',
	cookieDomain: null as string | null,
	cookieSecure: false,
	cookieSameSite: 'lax' as CookieSameSite,
	trustedOrigins: [] as string[],
	maxUploadSizeBytes: 5_242_880,
	allowedImageMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
	allowedDocumentMimeTypes: ['application/pdf'],
	r2UploadUrlTtlSeconds: 600,
	r2DownloadUrlTtlSeconds: 300,
	trackingRequests: 10,
	trackingWindowSeconds: 60,
	loginRequests: 5,
	loginWindowSeconds: 60,
	orderCreateRequests: 5,
	orderCreateWindowSeconds: 3600,
	defaultCurrency: 'IDR',
	defaultLocale: 'id-ID',
	defaultPageSize: 20,
	maxPageSize: 100,
	trackingPhoneLastDigits: 4
} as const;

function placeholderError(name: string, value: string): Error {
	return new Error(`Konfigurasi Yukatitip tidak valid: ${name} masih placeholder (${value}).`);
}

function configError(message: string): Error {
	return new Error(`Konfigurasi Yukatitip tidak valid: ${message}`);
}

function readRawValue(source: EnvSource, name: string): string | undefined {
	const value = source[name];

	if (value === undefined) {
		return undefined;
	}

	const trimmed = value.trim();

	if (!trimmed) {
		return undefined;
	}

	if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
		throw placeholderError(name, trimmed);
	}

	return trimmed;
}

function readMirroredString(
	publicSource: EnvSource,
	privateSource: EnvSource,
	publicName: string,
	privateName: string,
	defaultValue: string,
	normalize: (value: string) => string = (value) => value
): string {
	const publicValue = readRawValue(publicSource, publicName);
	const privateValue = readRawValue(privateSource, privateName);

	if (publicValue !== undefined && privateValue !== undefined) {
		const normalizedPublic = normalize(publicValue);
		const normalizedPrivate = normalize(privateValue);

		if (normalizedPublic !== normalizedPrivate) {
			throw configError(
				`${publicName} dan ${privateName} harus sama saat keduanya diisi (${normalizedPublic} !== ${normalizedPrivate}).`
			);
		}

		return normalizedPublic;
	}

	if (publicValue !== undefined) {
		return normalize(publicValue);
	}

	if (privateValue !== undefined) {
		return normalize(privateValue);
	}

	return normalize(defaultValue);
}

function readOptionalString(source: EnvSource, name: string): string | null {
	const value = readRawValue(source, name);
	return value ?? null;
}

function readEnumValue<T extends string>(
	source: EnvSource,
	name: string,
	allowedValues: readonly T[],
	defaultValue: T
): T {
	const value = readRawValue(source, name);

	if (value === undefined) {
		return defaultValue;
	}

	if ((allowedValues as readonly string[]).includes(value)) {
		return value as T;
	}

	throw configError(`${name} harus salah satu dari: ${allowedValues.join(', ')}.`);
}

function readBoolean(
	source: EnvSource,
	name: string,
	defaultValue: boolean
): boolean {
	const value = readRawValue(source, name);

	if (value === undefined) {
		return defaultValue;
	}

	if (value === 'true') {
		return true;
	}

	if (value === 'false') {
		return false;
	}

	throw configError(`${name} harus bernilai true atau false.`);
}

function readNumber(
	source: EnvSource,
	name: string,
	defaultValue: number,
	options: { min?: number; max?: number } = {}
): number {
	const value = readRawValue(source, name);

	if (value === undefined) {
		return defaultValue;
	}

	const parsed = Number(value);

	if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
		throw configError(`${name} harus berupa bilangan bulat.`);
	}

	if (options.min !== undefined && parsed < options.min) {
		throw configError(`${name} harus minimal ${options.min}.`);
	}

	if (options.max !== undefined && parsed > options.max) {
		throw configError(`${name} harus maksimal ${options.max}.`);
	}

	return parsed;
}

function readCsv(source: EnvSource, name: string, defaultValue: readonly string[]): string[] {
	const value = readRawValue(source, name);

	if (value === undefined) {
		return [...defaultValue];
	}

	return value
		.split(',')
		.map((part) => part.trim())
		.filter(Boolean);
}

function normalizeAbsoluteUrl(value: string): string {
	const url = new URL(value);
	return url.toString().replace(/\/$/, '');
}

function readUrl(source: EnvSource, name: string, defaultValue: string | null): string | null {
	const value = readRawValue(source, name);

	if (value === undefined) {
		return defaultValue;
	}

	return normalizeAbsoluteUrl(value);
}

function readPathPrefix(source: EnvSource, name: string, defaultValue: string): string {
	const value = readRawValue(source, name);
	const prefix = value ?? defaultValue;
	const normalized = prefix.trim().replace(/\/+$/, '');

	if (!normalized.startsWith('/')) {
		throw configError(`${name} harus diawali dengan /.`);
	}

	return normalized || defaultValue;
}

function readTextValue(
	source: EnvSource,
	name: string,
	defaultValue: string
): string {
	return readOptionalString(source, name) ?? defaultValue;
}

function readTrustedOrigins(source: EnvSource, name: string, fallbackOrigin: string): string[] {
	const values = readCsv(source, name, fallbackOrigin ? [fallbackOrigin] : []);
	const normalized = values.map(normalizeAbsoluteUrl);
	return Array.from(new Set(normalized));
}

function readAllowedMimeTypes(source: EnvSource, name: string, defaultValue: readonly string[]): string[] {
	const values = readCsv(source, name, defaultValue);

	if (values.some((value) => !value.includes('/'))) {
		throw configError(`${name} harus berisi daftar MIME type yang valid.`);
	}

	return values;
}

function readSecret(
	source: EnvSource,
	name: PrivateSecretKey,
	required: boolean
): string | null {
	const value = readRawValue(source, name);

	if (value === undefined) {
		if (required) {
			throw configError(`Secret wajib ${name} belum tersedia.`);
		}

		return null;
	}

	return value;
}

function readEnvironment(source: EnvSource): AppEnvironment {
	const value = readRawValue(source, 'APP_ENV');

	if (value === undefined) {
		return DEFAULTS.appEnvironment;
	}

	if (value === 'development' || value === 'preview' || value === 'production') {
		return value;
	}

	throw configError('APP_ENV harus development, preview, atau production.');
}

export function parseAppConfig(
	publicSource: EnvSource = {},
	privateSource: EnvSource = {},
	requiredSecrets: readonly PrivateSecretKey[] = []
): AppConfig {
	const appEnvironment = readEnvironment(privateSource);
	const appName = readMirroredString(
		publicSource,
		privateSource,
		'PUBLIC_APP_NAME',
		'APP_NAME',
		DEFAULTS.appName
	);
	const appUrl = readMirroredString(
		publicSource,
		privateSource,
		'PUBLIC_APP_URL',
		'APP_URL',
		DEFAULTS.appUrl,
		normalizeAbsoluteUrl
	);
	const publicApiBaseUrl = readPathPrefix(
		publicSource,
		'PUBLIC_API_BASE_URL',
		DEFAULTS.apiBaseUrl
	);
	const timezone = readTextValue(privateSource, 'APP_TIMEZONE', DEFAULTS.timezone);
	const locale = readTextValue(privateSource, 'DEFAULT_LOCALE', DEFAULTS.locale);
	const logLevel = readEnumValue(privateSource, 'LOG_LEVEL', ['debug', 'info', 'warn', 'error'], DEFAULTS.logLevel);
	const assetBaseUrl = readUrl(publicSource, 'PUBLIC_ASSET_BASE_URL', null);

	const publicSupabaseUrl = readUrl(publicSource, 'PUBLIC_SUPABASE_URL', DEFAULTS.supabaseUrl);
	const publicSupabasePublishableKey = readOptionalString(
		publicSource,
		'PUBLIC_SUPABASE_PUBLISHABLE_KEY'
	);
	const turnstileSiteKey = readOptionalString(publicSource, 'PUBLIC_TURNSTILE_SITE_KEY');

	const secretKeys = Object.fromEntries(
		PRIVATE_SECRET_KEYS.map((key) => [key, readSecret(privateSource, key, requiredSecrets.includes(key))])
	) as Record<PrivateSecretKey, string | null>;

	const cookieSecure = readBoolean(
		privateSource,
		'COOKIE_SECURE',
		appEnvironment === 'production'
	);

	if (appEnvironment === 'production' && !cookieSecure) {
		throw configError('COOKIE_SECURE wajib true di production.');
	}

	const enableDevSeed = readBoolean(privateSource, 'ENABLE_DEV_SEED', false);
	const enableDebugRoutes = readBoolean(privateSource, 'ENABLE_DEBUG_ROUTES', false);
	const disableTurnstileInLocal = readBoolean(
		privateSource,
		'DISABLE_TURNSTILE_IN_LOCAL',
		false
	);
	const mockR2Uploads = readBoolean(privateSource, 'MOCK_R2_UPLOADS', false);

	if (
		appEnvironment === 'production' &&
		(enableDevSeed || enableDebugRoutes || disableTurnstileInLocal || mockR2Uploads)
	) {
		throw configError('Flag development wajib false di production.');
	}

	const maxPageSize = readNumber(privateSource, 'MAX_PAGE_SIZE', DEFAULTS.maxPageSize, {
		min: 1
	});
	const defaultPageSize = readNumber(privateSource, 'DEFAULT_PAGE_SIZE', DEFAULTS.defaultPageSize, {
		min: 1,
		max: maxPageSize
	});

	const trackingPhoneLastDigits = readNumber(
		privateSource,
		'TRACKING_PHONE_LAST_DIGITS',
		DEFAULTS.trackingPhoneLastDigits,
		{
			min: 1,
			max: 8
		}
	);

	const config: AppConfig = {
		app: {
			name: appName,
			environment: appEnvironment,
			url: appUrl,
			apiBaseUrl: publicApiBaseUrl,
			timezone,
			locale,
			logLevel,
			assetBaseUrl
		},
		public: {
			supabaseUrl: publicSupabaseUrl,
			supabasePublishableKey: publicSupabasePublishableKey,
			turnstileSiteKey
		},
		private: {
			secretKeys,
			r2S3Endpoint: readUrl(privateSource, 'R2_S3_ENDPOINT', null),
			r2PrivateBucketName: readOptionalString(privateSource, 'R2_PRIVATE_BUCKET_NAME'),
			r2PublicBucketName: readOptionalString(privateSource, 'R2_PUBLIC_BUCKET_NAME')
		},
		bindings: {
			r2PrivateBucketBinding:
				readOptionalString(privateSource, 'R2_PRIVATE_BUCKET_BINDING') ?? 'YUKATITIP_PRIVATE_BUCKET',
			r2PublicBucketBinding:
				readOptionalString(privateSource, 'R2_PUBLIC_BUCKET_BINDING') ?? 'YUKATITIP_PUBLIC_BUCKET',
			kvConfigBinding: readOptionalString(privateSource, 'KV_CONFIG_BINDING') ?? 'YUKATITIP_CONFIG_KV'
		},
		security: {
			sessionCookieName:
				readOptionalString(privateSource, 'SESSION_COOKIE_NAME') ?? DEFAULTS.sessionCookieName,
			cookieDomain: readOptionalString(privateSource, 'COOKIE_DOMAIN'),
			cookieSecure,
			cookieSameSite: readEnumValue(
				privateSource,
				'COOKIE_SAME_SITE',
				['lax', 'strict'],
				DEFAULTS.cookieSameSite
			),
			trustedOrigins: readTrustedOrigins(
				privateSource,
				'TRUSTED_ORIGINS',
				normalizeAbsoluteUrl(appUrl)
			)
		},
		uploads: {
			maxUploadSizeBytes: readNumber(
				privateSource,
				'MAX_UPLOAD_SIZE_BYTES',
				DEFAULTS.maxUploadSizeBytes,
				{ min: 1 }
			),
			allowedImageMimeTypes: readAllowedMimeTypes(
				privateSource,
				'ALLOWED_IMAGE_MIME_TYPES',
				DEFAULTS.allowedImageMimeTypes
			),
			allowedDocumentMimeTypes: readAllowedMimeTypes(
				privateSource,
				'ALLOWED_DOCUMENT_MIME_TYPES',
				DEFAULTS.allowedDocumentMimeTypes
			),
			r2UploadUrlTtlSeconds: readNumber(
				privateSource,
				'R2_UPLOAD_URL_TTL_SECONDS',
				DEFAULTS.r2UploadUrlTtlSeconds,
				{ min: 1 }
			),
			r2DownloadUrlTtlSeconds: readNumber(
				privateSource,
				'R2_DOWNLOAD_URL_TTL_SECONDS',
				DEFAULTS.r2DownloadUrlTtlSeconds,
				{ min: 1 }
			)
		},
		rateLimits: {
			trackingRequests: readNumber(
				privateSource,
				'TRACKING_RATE_LIMIT_REQUESTS',
				DEFAULTS.trackingRequests,
				{ min: 1 }
			),
			trackingWindowSeconds: readNumber(
				privateSource,
				'TRACKING_RATE_LIMIT_WINDOW_SECONDS',
				DEFAULTS.trackingWindowSeconds,
				{ min: 1 }
			),
			loginRequests: readNumber(privateSource, 'LOGIN_RATE_LIMIT_REQUESTS', DEFAULTS.loginRequests, {
				min: 1
			}),
			loginWindowSeconds: readNumber(
				privateSource,
				'LOGIN_RATE_LIMIT_WINDOW_SECONDS',
				DEFAULTS.loginWindowSeconds,
				{ min: 60, max: 60 }
			),
			orderCreateRequests: readNumber(
				privateSource,
				'ORDER_CREATE_RATE_LIMIT_REQUESTS',
				DEFAULTS.orderCreateRequests,
				{ min: 1 }
			),
			orderCreateWindowSeconds: readNumber(
				privateSource,
				'ORDER_CREATE_RATE_LIMIT_WINDOW_SECONDS',
				DEFAULTS.orderCreateWindowSeconds,
				{ min: 1 }
			)
		},
		business: {
			defaultCurrency:
				readOptionalString(privateSource, 'DEFAULT_CURRENCY') ?? 'IDR',
			defaultLocale: readOptionalString(privateSource, 'DEFAULT_LOCALE') ?? DEFAULTS.locale,
			defaultPageSize,
			maxPageSize,
			trackingPhoneLastDigits
		},
		flags: {
			enableDevSeed,
			enableDebugRoutes,
			disableTurnstileInLocal,
			mockR2Uploads
		}
	};

	return config;
}

export function getAppConfig(requiredSecrets: readonly PrivateSecretKey[] = []): AppConfig {
	return parseAppConfig(publicEnv, privateEnv, requiredSecrets);
}
