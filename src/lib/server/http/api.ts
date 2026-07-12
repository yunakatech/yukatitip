import { json, type RequestEvent } from '@sveltejs/kit';

import type { FieldErrors, MasterDataErrorCode } from '$lib/server/master-data/errors';

export interface ApiMeta {
	requestId: string;
	page?: number;
	pageSize?: number;
	total?: number;
	totalPages?: number;
}

export interface ApiSuccessEnvelope<T> {
	success: true;
	data: T;
	meta: ApiMeta;
}

export interface ApiErrorEnvelope {
	success: false;
	error: {
		code: MasterDataErrorCode | 'INTERNAL_ERROR';
		message: string;
		fieldErrors?: FieldErrors;
	};
	meta: ApiMeta;
}

export function createApiMeta(event: Pick<RequestEvent, 'locals'>, overrides: Partial<ApiMeta> = {}): ApiMeta {
	return {
		requestId: event.locals.requestId ?? crypto.randomUUID(),
		...overrides
	};
}

export function apiSuccess<T>(
	event: Pick<RequestEvent, 'locals'>,
	data: T,
	status = 200,
	metaOverrides: Partial<ApiMeta> = {}
) {
	return json(
		{
			success: true,
			data,
			meta: createApiMeta(event, metaOverrides)
		} satisfies ApiSuccessEnvelope<T>,
		{
			status,
			headers: {
				'cache-control': 'no-store'
			}
		}
	);
}

export function apiError(
	event: Pick<RequestEvent, 'locals'>,
	status: number,
	code: MasterDataErrorCode | 'INTERNAL_ERROR',
	message: string,
	fieldErrors?: FieldErrors
) {
	return json(
		{
			success: false,
			error: {
				code,
				message,
				fieldErrors
			},
			meta: createApiMeta(event)
		} satisfies ApiErrorEnvelope,
		{
			status,
			headers: {
				'cache-control': 'no-store'
			}
		}
	);
}
