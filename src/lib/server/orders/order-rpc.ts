import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Json } from '$lib/supabase/database';

import {
	conflictError,
	duplicateResourceError,
	invalidStatusTransitionError,
	notFoundError,
	orderRouteMismatchError,
	paymentAmountInvalidError,
	type MasterDataError,
	validationError
} from '$lib/server/master-data/errors';

type DatabaseWithOrderRpc = Omit<Database, 'public'> & {
	public: Omit<Database['public'], 'Functions'> & {
		Functions: {
			create_order_with_items: {
				Args: {
					p_payload: Json;
					p_actor_profile_id: string;
					p_request_id: string;
					p_idempotency_key?: string | null;
					p_ip_address?: string | null;
					p_user_agent?: string | null;
				};
				Returns: Json;
			};
			update_order_with_items: {
				Args: {
					p_order_id: string;
					p_payload: Json;
					p_expected_version: number | null;
					p_actor_profile_id: string;
					p_request_id: string;
					p_ip_address?: string | null;
					p_user_agent?: string | null;
				};
				Returns: Json;
			};
			update_order_status_with_event: {
				Args: {
					p_order_id: string;
					p_next_status: string;
					p_public_description: string;
					p_internal_description: string | null;
					p_location: string | null;
					p_expected_version: number | null;
					p_actor_profile_id: string;
					p_request_id: string;
					p_ip_address?: string | null;
					p_user_agent?: string | null;
				};
				Returns: Json;
			};
			add_order_payment: {
				Args: {
					p_order_id: string;
					p_amount: number;
					p_payment_method: string;
					p_paid_at: string | null;
					p_notes: string | null;
					p_actor_profile_id: string;
					p_request_id: string;
					p_attachment_object_key?: string | null;
					p_attachment_original_filename?: string | null;
					p_attachment_mime_type?: string | null;
					p_attachment_size_bytes?: number | null;
					p_ip_address?: string | null;
					p_user_agent?: string | null;
				};
				Returns: Json;
			};
			verify_order_payment: {
				Args: {
					p_payment_id: string;
					p_decision: string;
					p_notes: string | null;
					p_actor_profile_id: string;
					p_request_id: string;
					p_ip_address?: string | null;
					p_user_agent?: string | null;
				};
				Returns: Json;
			};
		};
	};
};

export interface OrderCreateRpcResult {
	order?: {
		id?: string;
		trackingNumber?: string;
		status?: string;
		paymentStatus?: string;
		totalCustomerPayment?: number;
		version?: number;
	} | null;
}

export interface OrderStatusRpcResult {
	orderId?: string;
	status?: string;
	version?: number;
	updatedAt?: string;
}

export interface OrderPaymentRpcResult {
	paymentId?: string;
	orderId?: string;
	status?: string;
	orderPaymentStatus?: string;
	orderStatus?: string;
	orderVersion?: number;
	verifiedAt?: string;
	attachmentId?: string | null;
}

function mapOrderRpcError(error: { code?: string | null; message: string }): MasterDataError {
	if (error.code === '40001') {
		return conflictError();
	}

	if (error.code === '23505') {
		return duplicateResourceError('Nomor tracking atau idempotency key sudah digunakan.');
	}

	if (/rute|route|arah/i.test(error.message)) {
		return orderRouteMismatchError();
	}

	if (/status/i.test(error.message)) {
		return invalidStatusTransitionError(error.message);
	}

	if (/nominal|pembayaran/i.test(error.message)) {
		return paymentAmountInvalidError(error.message);
	}

	if (/tidak ditemukan/i.test(error.message)) {
		return notFoundError(error.message);
	}

	return validationError(error.message || 'Data pesanan tidak valid.');
}

function orderRpcClient(client: SupabaseClient<Database>) {
	return client as unknown as SupabaseClient<DatabaseWithOrderRpc>;
}

export async function createOrderWithItemsRpc(
	client: SupabaseClient<Database>,
	args: {
		payload: Json;
		actorProfileId: string;
		requestId: string;
		idempotencyKey?: string | null;
		ipAddress?: string | null;
		userAgent?: string | null;
	}
): Promise<OrderCreateRpcResult> {
	const { data, error } = await orderRpcClient(client).rpc('create_order_with_items', {
		p_payload: args.payload,
		p_actor_profile_id: args.actorProfileId,
		p_request_id: args.requestId,
		p_idempotency_key: args.idempotencyKey ?? null,
		p_ip_address: args.ipAddress ?? null,
		p_user_agent: args.userAgent ?? null
	} as never);

	if (error) {
		throw mapOrderRpcError(error);
	}

	return data as OrderCreateRpcResult;
}

export async function updateOrderWithItemsRpc(
	client: SupabaseClient<Database>,
	args: {
		orderId: string;
		payload: Json;
		expectedVersion: number | null;
		actorProfileId: string;
		requestId: string;
		ipAddress?: string | null;
		userAgent?: string | null;
	}
): Promise<OrderStatusRpcResult> {
	const { data, error } = await orderRpcClient(client).rpc('update_order_with_items', {
		p_order_id: args.orderId,
		p_payload: args.payload,
		p_expected_version: args.expectedVersion,
		p_actor_profile_id: args.actorProfileId,
		p_request_id: args.requestId,
		p_ip_address: args.ipAddress ?? null,
		p_user_agent: args.userAgent ?? null
	} as never);

	if (error) {
		throw mapOrderRpcError(error);
	}

	return data as OrderStatusRpcResult;
}

export async function updateOrderStatusWithEventRpc(
	client: SupabaseClient<Database>,
	args: {
		orderId: string;
		status: string;
		publicDescription: string;
		internalDescription: string | null;
		location: string | null;
		expectedVersion: number | null;
		actorProfileId: string;
		requestId: string;
		ipAddress?: string | null;
		userAgent?: string | null;
	}
): Promise<OrderStatusRpcResult> {
	const { data, error } = await orderRpcClient(client).rpc('update_order_status_with_event', {
		p_order_id: args.orderId,
		p_next_status: args.status,
		p_public_description: args.publicDescription,
		p_internal_description: args.internalDescription,
		p_location: args.location,
		p_expected_version: args.expectedVersion,
		p_actor_profile_id: args.actorProfileId,
		p_request_id: args.requestId,
		p_ip_address: args.ipAddress ?? null,
		p_user_agent: args.userAgent ?? null
	} as never);

	if (error) {
		throw mapOrderRpcError(error);
	}

	return data as OrderStatusRpcResult;
}

export async function addOrderPaymentRpc(
	client: SupabaseClient<Database>,
	args: {
		orderId: string;
		amount: number;
		paymentMethod: string;
		paidAt: string | null;
		notes: string | null;
		attachment?: {
			objectKey: string;
			originalFilename: string;
			mimeType: string;
			sizeBytes: number;
		} | null;
		actorProfileId: string;
		requestId: string;
		ipAddress?: string | null;
		userAgent?: string | null;
	}
): Promise<OrderPaymentRpcResult> {
	const { data, error } = await orderRpcClient(client).rpc('add_order_payment', {
		p_order_id: args.orderId,
		p_amount: args.amount,
		p_payment_method: args.paymentMethod,
		p_paid_at: args.paidAt,
		p_notes: args.notes,
		p_actor_profile_id: args.actorProfileId,
		p_request_id: args.requestId,
		p_attachment_object_key: args.attachment?.objectKey ?? null,
		p_attachment_original_filename: args.attachment?.originalFilename ?? null,
		p_attachment_mime_type: args.attachment?.mimeType ?? null,
		p_attachment_size_bytes: args.attachment?.sizeBytes ?? null,
		p_ip_address: args.ipAddress ?? null,
		p_user_agent: args.userAgent ?? null
	} as never);

	if (error) {
		throw mapOrderRpcError(error);
	}

	return data as OrderPaymentRpcResult;
}

export async function verifyOrderPaymentRpc(
	client: SupabaseClient<Database>,
	args: {
		paymentId: string;
		decision: 'approve' | 'reject';
		notes: string | null;
		actorProfileId: string;
		requestId: string;
		ipAddress?: string | null;
		userAgent?: string | null;
	}
): Promise<OrderPaymentRpcResult> {
	const { data, error } = await orderRpcClient(client).rpc('verify_order_payment', {
		p_payment_id: args.paymentId,
		p_decision: args.decision,
		p_notes: args.notes,
		p_actor_profile_id: args.actorProfileId,
		p_request_id: args.requestId,
		p_ip_address: args.ipAddress ?? null,
		p_user_agent: args.userAgent ?? null
	} as never);

	if (error) {
		throw mapOrderRpcError(error);
	}

	return data as OrderPaymentRpcResult;
}
