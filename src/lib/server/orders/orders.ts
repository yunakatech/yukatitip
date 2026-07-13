import type { SupabaseClient } from '@supabase/supabase-js';

import { ROLE_CODES } from '$lib/constants/access';
import {
	EDITABLE_ORDER_STATUSES,
	FULFILLMENT_METHOD_LABELS,
	ORDER_STATUS_LABELS,
	ORDER_STATUSES,
	PAYMENT_STATUS_LABELS,
	SERVICE_TYPE_LABELS,
	type FulfillmentMethod,
	type OrderItemStatus,
	type OrderStatus,
	type PaymentStatus,
	type ServiceType
} from '$lib/constants/orders';
import type { Database, Json } from '$lib/supabase/database';
import type { AuthContext } from '$lib/types/auth';
import {
	branchAccessDeniedError,
	conflictError,
	forbiddenError,
	invalidStatusTransitionError,
	notFoundError,
	orderRouteMismatchError,
	paymentAmountInvalidError,
	validationError
} from '$lib/server/master-data/errors';
import {
	compactSearch,
	normalizeWhitespace,
	optionalTrimmed,
	parseIntegerValue,
	parseUuidValue
} from '$lib/server/master-data/format';
import type { ParsedListQuery } from '$lib/server/master-data/query';
import { resolveBranchScope } from '$lib/server/master-data/query';
import {
	addOrderPaymentRpc,
	createOrderWithItemsRpc,
	updateOrderWithItemsRpc,
	updateOrderStatusWithEventRpc,
	verifyOrderPaymentRpc
} from './order-rpc';

type BranchRow = Database['public']['Tables']['branches']['Row'];
type CustomerRow = Database['public']['Tables']['customers']['Row'];
type RouteRow = Database['public']['Tables']['routes']['Row'];
type StoreRow = Database['public']['Tables']['stores']['Row'];
type OrderRow = Database['public']['Tables']['orders']['Row'];
type OrderItemRow = Database['public']['Tables']['order_items']['Row'];
type TrackingEventRow = Database['public']['Tables']['tracking_events']['Row'];
type PaymentRow = Database['public']['Tables']['payments']['Row'];
type AttachmentRow = Database['public']['Tables']['attachments']['Row'];

export interface OrderListItem {
	id: string;
	trackingNumber: string;
	customer: { id: string; name: string; phone: string };
	receiver: { id: string; name: string; phone: string } | null;
	route: { id: string; name: string };
	origin: { id: string; code: string; name: string };
	destination: { id: string; code: string; name: string };
	serviceType: ServiceType;
	serviceLabel: string;
	status: OrderStatus;
	statusLabel: string;
	paymentStatus: PaymentStatus;
	paymentStatusLabel: string;
	goodsAmount: number;
	serviceRevenue: number;
	additionalServiceFees: number;
	discountAmount: number;
	totalCustomerPayment: number;
	createdAt: string;
	updatedAt: string;
	version: number;
}

export interface OrderItemDetail {
	id: string;
	store: { id: string; name: string } | null;
	productName: string;
	productUrl: string | null;
	quantity: number;
	estimatedUnitPrice: number;
	actualUnitPrice: number | null;
	weightGrams: number | null;
	attributes: Json;
	notes: string | null;
	status: OrderItemStatus;
}

export interface TrackingEventDetail {
	id: string;
	status: OrderStatus;
	statusLabel: string;
	publicDescription: string;
	internalDescription: string | null;
	location: string | null;
	createdAt: string;
}

export interface PaymentDetail {
	id: string;
	amount: number;
	paymentMethod: string;
	status: PaymentStatus;
	statusLabel: string;
	attachment: { id: string; originalFilename: string; mimeType: string; sizeBytes: number } | null;
	paidAt: string | null;
	verifiedBy: string | null;
	verifiedAt: string | null;
	notes: string | null;
	createdAt: string;
}

export interface OrderDetail extends OrderListItem {
	fulfillmentMethod: FulfillmentMethod;
	fulfillmentLabel: string;
	deliveryAddress: string | null;
	publicNotes: string | null;
	internalNotes: string | null;
	createdBy: string;
	updatedBy: string | null;
	items: OrderItemDetail[];
	timeline: TrackingEventDetail[];
	payments: PaymentDetail[];
	canEdit: boolean;
}

export interface OrderItemInput {
	id?: string | null;
	storeId: string | null;
	productName: string;
	productUrl: string | null;
	quantity: number;
	estimatedUnitPrice: number;
	actualUnitPrice: number | null;
	weightGrams: number | null;
	attributes: Json;
	notes: string | null;
	status: OrderItemStatus;
}

export interface OrderInput {
	serviceType: ServiceType;
	fulfillmentMethod: FulfillmentMethod;
	originBranchId: string;
	destinationBranchId: string;
	routeId: string;
	senderCustomerId: string;
	receiverCustomerId: string | null;
	goodsAmount: number;
	serviceRevenue: number;
	additionalServiceFees: number;
	discountAmount: number;
	deliveryAddress: string | null;
	publicNotes: string | null;
	internalNotes: string | null;
	items: OrderItemInput[];
	expectedVersion: number | null;
}

export interface OrderStatusInput {
	status: OrderStatus;
	publicDescription: string;
	internalDescription: string | null;
	location: string | null;
	expectedVersion: number | null;
}

export interface OrderPaymentInput {
	amount: number;
	paymentMethod: string;
	paidAt: string | null;
	notes: string | null;
	attachment: {
		objectKey: string;
		originalFilename: string;
		mimeType: string;
		sizeBytes: number;
	} | null;
}

export interface VerifyPaymentInput {
	decision: 'approve' | 'reject';
	notes: string | null;
}

export interface OrderReferenceOptions {
	branches: Array<{ value: string; label: string }>;
	routes: Array<{
		value: string;
		label: string;
		originBranchId: string;
		destinationBranchId: string;
	}>;
	customers: Array<{ value: string; label: string; phone: string; homeBranchId: string | null }>;
	stores: Array<{ value: string; label: string; branchId: string | null }>;
}

const ORDER_SORT_COLUMNS: Record<string, keyof OrderRow> = {
	trackingNumber: 'tracking_number',
	createdAt: 'created_at',
	updatedAt: 'updated_at',
	status: 'status',
	paymentStatus: 'payment_status',
	serviceRevenue: 'service_revenue'
};

const ORDER_MANAGER_ROLES = [ROLE_CODES.OWNER, ROLE_CODES.BRANCH_MANAGER, ROLE_CODES.BRANCH_ADMIN] as const;

function assertOrderManager(auth: AuthContext): void {
	if (!ORDER_MANAGER_ROLES.includes(auth.role.code as (typeof ORDER_MANAGER_ROLES)[number])) {
		throw forbiddenError();
	}
}

function assertOrderBranchAccess(auth: AuthContext, originBranchId: string, destinationBranchId: string): void {
	if (auth.role.code === ROLE_CODES.OWNER) {
		return;
	}

	if (!auth.branch) {
		throw branchAccessDeniedError();
	}

	if (auth.branch.id !== originBranchId && auth.branch.id !== destinationBranchId) {
		throw branchAccessDeniedError();
	}
}

function parseFieldWithValidation<T>(fieldKey: string, fieldName: string, parser: () => T): T {
	try {
		return parser();
	} catch (error) {
		const message = error instanceof Error ? error.message : `${fieldName} tidak valid.`;
		throw validationError(message, { [fieldKey]: [message] });
	}
}

function parseMoney(formData: FormData, fieldName: string, label: string): number {
	const value = String(formData.get(fieldName) ?? '0');
	const parsed = parseFieldWithValidation(fieldName, label, () => parseIntegerValue(value, label));

	if (parsed < 0) {
		throw validationError(`${label} tidak boleh negatif.`, { [fieldName]: [`${label} tidak boleh negatif.`] });
	}

	return parsed;
}

function parseServiceType(value: string): ServiceType {
	if (value === 'purchase' || value === 'pickup' || value === 'delivery') {
		return value;
	}

	throw validationError('Jenis layanan tidak valid.', {
		serviceType: ['Pilih jenis layanan yang tersedia.']
	});
}

function parseFulfillmentMethod(value: string): FulfillmentMethod {
	if (value === 'branch_pickup' || value === 'local_delivery') {
		return value;
	}

	throw validationError('Metode penerimaan tidak valid.', {
		fulfillmentMethod: ['Pilih metode penerimaan yang tersedia.']
	});
}

function parseOrderStatus(value: string): OrderStatus {
	if ((ORDER_STATUSES as readonly string[]).includes(value)) {
		return value as OrderStatus;
	}

	throw validationError('Status pesanan tidak valid.', { status: ['Pilih status pesanan yang tersedia.'] });
}

function parseOrderItemStatus(value: string): OrderItemStatus {
	if (
		[
			'recorded',
			'waiting_confirmation',
			'available',
			'unavailable',
			'purchased',
			'collected',
			'received_at_origin',
			'packed',
			'completed',
			'cancelled'
		].includes(value)
	) {
		return value as OrderItemStatus;
	}

	throw validationError('Status item tidak valid.');
}

function parseOptionalUuid(value: string | null | undefined, label: string): string | null {
	const trimmed = optionalTrimmed(value);

	if (!trimmed) {
		return null;
	}

	return parseFieldWithValidation(label, label, () => parseUuidValue(trimmed, label));
}

function parseOptionalTimestamp(value: string | null | undefined, fieldName: string): string | null {
	const trimmed = optionalTrimmed(value);

	if (!trimmed) {
		return null;
	}

	const timestamp = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
	const parsed = Date.parse(timestamp);

	if (Number.isNaN(parsed)) {
		throw validationError(`${fieldName} tidak valid.`);
	}

	return new Date(parsed).toISOString();
}

function parseOptionalVersion(value: string | null | undefined): number | null {
	const trimmed = optionalTrimmed(value);

	if (!trimmed) {
		return null;
	}

	const parsed = Number(trimmed);

	if (!Number.isInteger(parsed) || parsed < 1) {
		throw validationError('Versi data tidak valid.');
	}

	return parsed;
}

function optionalVersionFromUnknown(value: unknown): number | null {
	if (value === null || value === undefined || value === '') {
		return null;
	}

	if (typeof value === 'number') {
		if (!Number.isInteger(value) || value < 1) {
			throw validationError('Versi data tidak valid.');
		}

		return value;
	}

	if (typeof value === 'string') {
		return parseOptionalVersion(value);
	}

	throw validationError('Versi data tidak valid.');
}

function parseItemAttributes(value: string | null): Json {
	const trimmed = optionalTrimmed(value);

	if (!trimmed) {
		return {};
	}

	try {
		const parsed = JSON.parse(trimmed) as Json;
		return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
	} catch {
		throw validationError('Atribut item harus JSON object valid.', {
			itemAttributes: ['Gunakan format JSON seperti {"warna":"Hitam"}.']
		});
	}
}

function parseOrderItem(formData: FormData, index: number): OrderItemInput {
	const prefix = `items[${index}]`;

	return {
		storeId: parseOptionalUuid(String(formData.get(`${prefix}.storeId`) ?? ''), 'Toko'),
		productName: normalizeWhitespace(String(formData.get(`${prefix}.productName`) ?? '')),
		productUrl: optionalTrimmed(String(formData.get(`${prefix}.productUrl`) ?? '')),
		quantity: parseFieldWithValidation(`${prefix}.quantity`, 'Jumlah barang', () =>
			parseIntegerValue(String(formData.get(`${prefix}.quantity`) ?? '1'), 'Jumlah barang')
		),
		estimatedUnitPrice: parseFieldWithValidation(`${prefix}.estimatedUnitPrice`, 'Harga perkiraan', () =>
			parseIntegerValue(String(formData.get(`${prefix}.estimatedUnitPrice`) ?? '0'), 'Harga perkiraan')
		),
		actualUnitPrice: optionalTrimmed(String(formData.get(`${prefix}.actualUnitPrice`) ?? ''))
			? parseFieldWithValidation(`${prefix}.actualUnitPrice`, 'Harga aktual', () =>
					parseIntegerValue(String(formData.get(`${prefix}.actualUnitPrice`) ?? '0'), 'Harga aktual')
				)
			: null,
		weightGrams: optionalTrimmed(String(formData.get(`${prefix}.weightGrams`) ?? ''))
			? parseFieldWithValidation(`${prefix}.weightGrams`, 'Berat', () =>
					parseIntegerValue(String(formData.get(`${prefix}.weightGrams`) ?? '0'), 'Berat')
				)
			: null,
		attributes: parseItemAttributes(String(formData.get(`${prefix}.attributes`) ?? '')),
		notes: optionalTrimmed(String(formData.get(`${prefix}.notes`) ?? '')),
		status: parseOrderItemStatus(String(formData.get(`${prefix}.status`) ?? 'recorded'))
	};
}

function parseOrderItemCount(formData: FormData): number {
	const raw = String(formData.get('itemCount') ?? '1');
	const parsed = Number(raw);

	if (!Number.isInteger(parsed) || parsed < 1 || parsed > 50) {
		throw validationError('Jumlah item pesanan tidak valid.');
	}

	return parsed;
}

function numberFromUnknown(value: unknown, fieldName: string): number {
	if (typeof value === 'number' && Number.isInteger(value)) {
		return value;
	}

	if (typeof value === 'string') {
		return parseIntegerValue(value, fieldName);
	}

	throw validationError(`${fieldName} harus berupa bilangan bulat.`);
}

function nonNegativeNumberFromUnknown(value: unknown, fieldName: string): number {
	const parsed = numberFromUnknown(value ?? 0, fieldName);

	if (parsed < 0) {
		throw validationError(`${fieldName} tidak boleh negatif.`);
	}

	return parsed;
}

function stringFromPayload(payload: Record<string, unknown>, key: string): string {
	const value = payload[key];
	return typeof value === 'string' ? value : '';
}

export function parseOrderJsonPayload(payload: unknown): OrderInput {
	if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
		throw validationError('Payload pesanan tidak valid.');
	}

	const record = payload as Record<string, unknown>;
	const rawItems = Array.isArray(record.items) ? record.items : [];

	if (rawItems.length === 0) {
		throw validationError('Pesanan wajib memiliki minimal satu item.');
	}

	return {
		serviceType: parseServiceType(stringFromPayload(record, 'serviceType')),
		fulfillmentMethod: parseFulfillmentMethod(stringFromPayload(record, 'fulfillmentMethod') || 'branch_pickup'),
		originBranchId: parseUuidValue(stringFromPayload(record, 'originBranchId'), 'Cabang asal'),
		destinationBranchId: parseUuidValue(stringFromPayload(record, 'destinationBranchId'), 'Cabang tujuan'),
		routeId: parseUuidValue(stringFromPayload(record, 'routeId'), 'Rute'),
		senderCustomerId: parseUuidValue(stringFromPayload(record, 'senderCustomerId'), 'Customer pengirim'),
		receiverCustomerId: parseOptionalUuid(stringFromPayload(record, 'receiverCustomerId'), 'Customer penerima'),
		goodsAmount: nonNegativeNumberFromUnknown(record.goodsAmount, 'Nilai barang'),
		serviceRevenue: nonNegativeNumberFromUnknown(record.serviceRevenue, 'Pendapatan jasa'),
		additionalServiceFees: nonNegativeNumberFromUnknown(record.additionalServiceFees, 'Biaya jasa tambahan'),
		discountAmount: nonNegativeNumberFromUnknown(record.discountAmount, 'Diskon'),
		deliveryAddress: optionalTrimmed(stringFromPayload(record, 'deliveryAddress')),
		publicNotes: optionalTrimmed(stringFromPayload(record, 'publicNotes')),
		internalNotes: optionalTrimmed(stringFromPayload(record, 'internalNotes')),
		items: rawItems.map((item) => {
			if (!item || typeof item !== 'object' || Array.isArray(item)) {
				throw validationError('Item pesanan tidak valid.');
			}

			const itemRecord = item as Record<string, unknown>;
			return {
				storeId: parseOptionalUuid(stringFromPayload(itemRecord, 'storeId'), 'Toko'),
				productName: normalizeWhitespace(stringFromPayload(itemRecord, 'productName')),
				productUrl: optionalTrimmed(stringFromPayload(itemRecord, 'productUrl')),
				quantity: numberFromUnknown(itemRecord.quantity ?? 1, 'Jumlah barang'),
				estimatedUnitPrice: nonNegativeNumberFromUnknown(itemRecord.estimatedUnitPrice, 'Harga perkiraan'),
				actualUnitPrice:
					itemRecord.actualUnitPrice === null || itemRecord.actualUnitPrice === undefined || itemRecord.actualUnitPrice === ''
						? null
						: nonNegativeNumberFromUnknown(itemRecord.actualUnitPrice, 'Harga aktual'),
				weightGrams:
					itemRecord.weightGrams === null || itemRecord.weightGrams === undefined || itemRecord.weightGrams === ''
						? null
						: nonNegativeNumberFromUnknown(itemRecord.weightGrams, 'Berat'),
				attributes: (itemRecord.attributes ?? {}) as Json,
				notes: optionalTrimmed(stringFromPayload(itemRecord, 'notes')),
				status: parseOrderItemStatus(stringFromPayload(itemRecord, 'status') || 'recorded')
			};
		}),
		expectedVersion: optionalVersionFromUnknown(record.expectedVersion)
	};
}

export function parseOrderInput(formData: FormData): OrderInput {
	const itemCount = parseOrderItemCount(formData);
	const items = Array.from({ length: itemCount }, (_value, index) => parseOrderItem(formData, index));

	return {
		serviceType: parseServiceType(String(formData.get('serviceType') ?? '')),
		fulfillmentMethod: parseFulfillmentMethod(String(formData.get('fulfillmentMethod') ?? 'branch_pickup')),
		originBranchId: parseFieldWithValidation('originBranchId', 'Cabang asal', () =>
			parseUuidValue(String(formData.get('originBranchId') ?? ''), 'Cabang asal')
		),
		destinationBranchId: parseFieldWithValidation('destinationBranchId', 'Cabang tujuan', () =>
			parseUuidValue(String(formData.get('destinationBranchId') ?? ''), 'Cabang tujuan')
		),
		routeId: parseFieldWithValidation('routeId', 'Rute', () =>
			parseUuidValue(String(formData.get('routeId') ?? ''), 'Rute')
		),
		senderCustomerId: parseFieldWithValidation('senderCustomerId', 'Customer pengirim', () =>
			parseUuidValue(String(formData.get('senderCustomerId') ?? ''), 'Customer pengirim')
		),
		receiverCustomerId: parseOptionalUuid(String(formData.get('receiverCustomerId') ?? ''), 'Customer penerima'),
		goodsAmount: parseMoney(formData, 'goodsAmount', 'Nilai barang'),
		serviceRevenue: parseMoney(formData, 'serviceRevenue', 'Pendapatan jasa'),
		additionalServiceFees: parseMoney(formData, 'additionalServiceFees', 'Biaya jasa tambahan'),
		discountAmount: parseMoney(formData, 'discountAmount', 'Diskon'),
		deliveryAddress: optionalTrimmed(String(formData.get('deliveryAddress') ?? '')),
		publicNotes: optionalTrimmed(String(formData.get('publicNotes') ?? '')),
		internalNotes: optionalTrimmed(String(formData.get('internalNotes') ?? '')),
		items,
		expectedVersion: parseOptionalVersion(String(formData.get('expectedVersion') ?? ''))
	};
}

export function parseOrderStatusJsonPayload(payload: unknown): OrderStatusInput {
	if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
		throw validationError('Payload status tidak valid.');
	}

	const record = payload as Record<string, unknown>;

	return {
		status: parseOrderStatus(stringFromPayload(record, 'status')),
		publicDescription: normalizeWhitespace(stringFromPayload(record, 'publicDescription')),
		internalDescription: optionalTrimmed(stringFromPayload(record, 'internalDescription')),
		location: optionalTrimmed(stringFromPayload(record, 'location')),
		expectedVersion: optionalVersionFromUnknown(record.expectedVersion)
	};
}

export function parseOrderStatusInput(formData: FormData): OrderStatusInput {
	return {
		status: parseOrderStatus(String(formData.get('status') ?? '')),
		publicDescription: normalizeWhitespace(String(formData.get('publicDescription') ?? '')),
		internalDescription: optionalTrimmed(String(formData.get('internalDescription') ?? '')),
		location: optionalTrimmed(String(formData.get('location') ?? '')),
		expectedVersion: parseOptionalVersion(String(formData.get('expectedVersion') ?? ''))
	};
}

export function parseOrderPaymentJsonPayload(payload: unknown): OrderPaymentInput {
	if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
		throw validationError('Payload pembayaran tidak valid.');
	}

	const record = payload as Record<string, unknown>;
	const amount = nonNegativeNumberFromUnknown(record.amount, 'Nominal pembayaran');

	if (amount <= 0) {
		throw paymentAmountInvalidError('Nominal pembayaran harus lebih dari 0.');
	}

	return {
		amount,
		paymentMethod: normalizeWhitespace(stringFromPayload(record, 'paymentMethod')),
		paidAt: parseOptionalTimestamp(stringFromPayload(record, 'paidAt'), 'Waktu pembayaran'),
		notes: optionalTrimmed(stringFromPayload(record, 'notes')),
		attachment: null
	};
}

export function parseOrderPaymentInput(formData: FormData): OrderPaymentInput {
	const amount = parseMoney(formData, 'amount', 'Nominal pembayaran');

	if (amount <= 0) {
		throw paymentAmountInvalidError('Nominal pembayaran harus lebih dari 0.');
	}

	return {
		amount,
		paymentMethod: normalizeWhitespace(String(formData.get('paymentMethod') ?? '')),
		paidAt: parseOptionalTimestamp(String(formData.get('paidAt') ?? ''), 'Waktu pembayaran'),
		notes: optionalTrimmed(String(formData.get('notes') ?? '')),
		attachment: null
	};
}

export function parseVerifyPaymentJsonPayload(payload: unknown): VerifyPaymentInput {
	if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
		throw validationError('Payload verifikasi pembayaran tidak valid.');
	}

	const record = payload as Record<string, unknown>;
	const decision = stringFromPayload(record, 'decision');

	if (decision !== 'approve' && decision !== 'reject') {
		throw validationError('Keputusan pembayaran tidak valid.');
	}

	return {
		decision,
		notes: optionalTrimmed(stringFromPayload(record, 'notes'))
	};
}

export function parseVerifyPaymentInput(formData: FormData): VerifyPaymentInput {
	const decision = String(formData.get('decision') ?? '');

	if (decision !== 'approve' && decision !== 'reject') {
		throw validationError('Keputusan pembayaran tidak valid.');
	}

	return {
		decision,
		notes: optionalTrimmed(String(formData.get('notes') ?? ''))
	};
}

function normalizeOrderSearch(value: string): string {
	return compactSearch(value).replace(/[%_,]/g, ' ').slice(0, 120);
}

async function loadBranchesMap(client: SupabaseClient<Database>, branchIds: string[]) {
	const unique = [...new Set(branchIds.filter(Boolean))];

	if (unique.length === 0) {
		return new Map<string, { id: string; code: string; name: string }>();
	}

	const { data, error } = await client.from('branches').select('id, code, name').in('id', unique);

	if (error || !data) {
		throw error ?? notFoundError();
	}

	return new Map(
		(data as BranchRow[]).map((branch) => [
			branch.id,
			{ id: branch.id, code: branch.code, name: branch.name }
		])
	);
}

async function loadCustomersMap(client: SupabaseClient<Database>, customerIds: string[]) {
	const unique = [...new Set(customerIds.filter(Boolean))];

	if (unique.length === 0) {
		return new Map<string, { id: string; name: string; phone: string }>();
	}

	const { data, error } = await client.from('customers').select('id, name, phone').in('id', unique);

	if (error || !data) {
		throw error ?? notFoundError();
	}

	return new Map(
		(data as CustomerRow[]).map((customer) => [
			customer.id,
			{ id: customer.id, name: customer.name, phone: customer.phone }
		])
	);
}

async function loadRoutesMap(client: SupabaseClient<Database>, routeIds: string[]) {
	const unique = [...new Set(routeIds.filter(Boolean))];

	if (unique.length === 0) {
		return new Map<string, { id: string; name: string }>();
	}

	const { data, error } = await client.from('routes').select('id, name').in('id', unique);

	if (error || !data) {
		throw error ?? notFoundError();
	}

	return new Map((data as RouteRow[]).map((route) => [route.id, { id: route.id, name: route.name }]));
}

async function loadStoresMap(client: SupabaseClient<Database>, storeIds: string[]) {
	const unique = [...new Set(storeIds.filter(Boolean))];

	if (unique.length === 0) {
		return new Map<string, { id: string; name: string }>();
	}

	const { data, error } = await client.from('stores').select('id, name').in('id', unique);

	if (error || !data) {
		throw error ?? notFoundError();
	}

	return new Map((data as StoreRow[]).map((store) => [store.id, { id: store.id, name: store.name }]));
}

async function loadPaymentAttachmentsMap(client: SupabaseClient<Database>, paymentIds: string[]) {
	const unique = [...new Set(paymentIds.filter(Boolean))];

	if (unique.length === 0) {
		return new Map<string, PaymentDetail['attachment']>();
	}

	const { data, error } = await client
		.from('attachments')
		.select('id, entity_id, original_filename, mime_type, size_bytes')
		.eq('entity_type', 'payment')
		.in('entity_id', unique)
		.order('created_at', { ascending: false });

	if (error || !data) {
		throw error ?? notFoundError();
	}

	const map = new Map<string, PaymentDetail['attachment']>();

	for (const attachment of data as AttachmentRow[]) {
		if (!map.has(attachment.entity_id)) {
			map.set(attachment.entity_id, {
				id: attachment.id,
				originalFilename: attachment.original_filename,
				mimeType: attachment.mime_type,
				sizeBytes: attachment.size_bytes
			});
		}
	}

	return map;
}

function buildOrderListItem(
	order: OrderRow,
	refs: {
		branches: Map<string, { id: string; code: string; name: string }>;
		customers: Map<string, { id: string; name: string; phone: string }>;
		routes: Map<string, { id: string; name: string }>;
	}
): OrderListItem {
	return {
		id: order.id,
		trackingNumber: order.tracking_number,
		customer: refs.customers.get(order.sender_customer_id) ?? {
			id: order.sender_customer_id,
			name: 'Customer',
			phone: ''
		},
		receiver: order.receiver_customer_id
			? refs.customers.get(order.receiver_customer_id) ?? { id: order.receiver_customer_id, name: 'Customer', phone: '' }
			: null,
		route: refs.routes.get(order.route_id) ?? { id: order.route_id, name: 'Rute' },
		origin: refs.branches.get(order.origin_branch_id) ?? { id: order.origin_branch_id, code: '', name: 'Cabang asal' },
		destination: refs.branches.get(order.destination_branch_id) ?? {
			id: order.destination_branch_id,
			code: '',
			name: 'Cabang tujuan'
		},
		serviceType: order.service_type,
		serviceLabel: SERVICE_TYPE_LABELS[order.service_type],
		status: order.status,
		statusLabel: ORDER_STATUS_LABELS[order.status],
		paymentStatus: order.payment_status,
		paymentStatusLabel: PAYMENT_STATUS_LABELS[order.payment_status],
		goodsAmount: order.goods_amount,
		serviceRevenue: order.service_revenue,
		additionalServiceFees: order.additional_service_fees,
		discountAmount: order.discount_amount,
		totalCustomerPayment: order.total_customer_payment,
		createdAt: order.created_at,
		updatedAt: order.updated_at,
		version: order.version
	};
}

async function buildOrderRefs(client: SupabaseClient<Database>, orders: OrderRow[]) {
	const branches = await loadBranchesMap(
		client,
		orders.flatMap((order) => [order.origin_branch_id, order.destination_branch_id])
	);
	const customers = await loadCustomersMap(
		client,
		orders.flatMap((order) => [order.sender_customer_id, order.receiver_customer_id ?? ''])
	);
	const routes = await loadRoutesMap(client, orders.map((order) => order.route_id));

	return { branches, customers, routes };
}

export async function listOrders(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	query: ParsedListQuery & {
		paymentStatus?: PaymentStatus | null;
		originBranchId?: string | null;
		destinationBranchId?: string | null;
		routeId?: string | null;
	}
) {
	assertOrderManager(auth);

	const page = query.page;
	const pageSize = query.pageSize;
	const offset = (page - 1) * pageSize;
	const sortColumn = ORDER_SORT_COLUMNS[query.sortField] ?? 'created_at';
	const scopedBranchId = resolveBranchScope(auth, query.branchId);

	let request = client
		.from('orders')
		.select(
			'id, tracking_number, service_type, fulfillment_method, origin_branch_id, destination_branch_id, route_id, sender_customer_id, receiver_customer_id, status, payment_status, goods_amount, service_revenue, additional_service_fees, discount_amount, total_customer_payment, delivery_address, public_notes, internal_notes, created_by, updated_by, created_at, updated_at, version',
			{ count: 'exact' }
		)
		.order(sortColumn, { ascending: query.sortDirection === 'asc' });

	if (query.search) {
		const search = normalizeOrderSearch(query.search);
		request = request.ilike('tracking_number', `%${search.toUpperCase()}%`);
	}

	if (scopedBranchId) {
		request = request.or(`origin_branch_id.eq.${scopedBranchId},destination_branch_id.eq.${scopedBranchId}`);
	}

	if (query.status) {
		request = request.eq('status', query.status as OrderStatus);
	}

	if (query.paymentStatus) {
		request = request.eq('payment_status', query.paymentStatus);
	}

	if (query.originBranchId) {
		request = request.eq('origin_branch_id', query.originBranchId);
	}

	if (query.destinationBranchId) {
		request = request.eq('destination_branch_id', query.destinationBranchId);
	}

	if (query.routeId) {
		request = request.eq('route_id', query.routeId);
	}

	const { data, error, count } = await request.range(offset, offset + pageSize - 1);

	if (error || !data) {
		throw error ?? notFoundError();
	}

	const orders = data as OrderRow[];
	const refs = await buildOrderRefs(client, orders);
	const items = orders.map((order) => buildOrderListItem(order, refs));

	return {
		items,
		page,
		pageSize,
		total: count ?? items.length,
		totalPages: count ? Math.max(1, Math.ceil(count / pageSize)) : 1
	};
}

async function getOrderRow(client: SupabaseClient<Database>, orderId: string): Promise<OrderRow> {
	const { data, error } = await client
		.from('orders')
		.select('id, tracking_number, service_type, fulfillment_method, origin_branch_id, destination_branch_id, route_id, sender_customer_id, receiver_customer_id, status, payment_status, goods_amount, service_revenue, additional_service_fees, discount_amount, total_customer_payment, delivery_address, public_notes, internal_notes, created_by, updated_by, created_at, updated_at, version')
		.eq('id', orderId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	if (!data) {
		throw notFoundError('Pesanan tidak ditemukan.');
	}

	return data as OrderRow;
}

export async function getOrderDetail(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	orderId: string
): Promise<OrderDetail> {
	assertOrderManager(auth);

	const order = await getOrderRow(client, orderId);
	assertOrderBranchAccess(auth, order.origin_branch_id, order.destination_branch_id);

	const refs = await buildOrderRefs(client, [order]);
	const [itemsResult, timelineResult, paymentsResult] = await Promise.all([
		client
			.from('order_items')
			.select('id, order_id, store_id, product_name, product_url, quantity, estimated_unit_price, actual_unit_price, weight_grams, attributes, notes, status, created_at, updated_at')
			.eq('order_id', orderId)
			.order('created_at', { ascending: true }),
		client
			.from('tracking_events')
			.select('id, order_id, status, public_description, internal_description, location, created_by, created_at')
			.eq('order_id', orderId)
			.order('created_at', { ascending: false }),
		client
			.from('payments')
			.select('id, order_id, amount, payment_method, status, paid_at, verified_by, verified_at, notes, created_at')
			.eq('order_id', orderId)
			.order('created_at', { ascending: false })
	]);

	if (itemsResult.error) throw itemsResult.error;
	if (timelineResult.error) throw timelineResult.error;
	if (paymentsResult.error) throw paymentsResult.error;

	const items = (itemsResult.data ?? []) as OrderItemRow[];
	const payments = (paymentsResult.data ?? []) as PaymentRow[];
	const stores = await loadStoresMap(
		client,
		items.map((item) => item.store_id ?? '')
	);
	const paymentAttachments = await loadPaymentAttachmentsMap(
		client,
		payments.map((payment) => payment.id)
	);
	const listItem = buildOrderListItem(order, refs);

	return {
		...listItem,
		fulfillmentMethod: order.fulfillment_method,
		fulfillmentLabel: FULFILLMENT_METHOD_LABELS[order.fulfillment_method],
		deliveryAddress: order.delivery_address,
		publicNotes: order.public_notes,
		internalNotes: order.internal_notes,
		createdBy: order.created_by,
		updatedBy: order.updated_by,
		items: items.map((item) => ({
			id: item.id,
			store: item.store_id ? stores.get(item.store_id) ?? { id: item.store_id, name: 'Toko' } : null,
			productName: item.product_name,
			productUrl: item.product_url,
			quantity: item.quantity,
			estimatedUnitPrice: item.estimated_unit_price,
			actualUnitPrice: item.actual_unit_price,
			weightGrams: item.weight_grams,
			attributes: item.attributes,
			notes: item.notes,
			status: item.status
		})),
		timeline: ((timelineResult.data ?? []) as TrackingEventRow[]).map((event) => ({
			id: event.id,
			status: event.status,
			statusLabel: ORDER_STATUS_LABELS[event.status],
			publicDescription: event.public_description,
			internalDescription: event.internal_description,
			location: event.location,
			createdAt: event.created_at
		})),
		payments: payments.map((payment) => ({
			id: payment.id,
			amount: payment.amount,
			paymentMethod: payment.payment_method,
			status: payment.status,
			statusLabel: PAYMENT_STATUS_LABELS[payment.status],
			attachment: paymentAttachments.get(payment.id) ?? null,
			paidAt: payment.paid_at,
			verifiedBy: payment.verified_by,
			verifiedAt: payment.verified_at,
			notes: payment.notes,
			createdAt: payment.created_at
		})),
		canEdit: EDITABLE_ORDER_STATUSES.includes(order.status as (typeof EDITABLE_ORDER_STATUSES)[number])
	};
}

async function assertOrderReferences(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	input: OrderInput
): Promise<void> {
	assertOrderManager(auth);
	assertOrderBranchAccess(auth, input.originBranchId, input.destinationBranchId);

	if (input.originBranchId === input.destinationBranchId) {
		throw validationError('Cabang asal dan tujuan tidak boleh sama.', {
			destinationBranchId: ['Pilih cabang tujuan yang berbeda.']
		});
	}

	const { data: route } = await client
		.from('routes')
		.select('id, origin_branch_id, destination_branch_id, is_active')
		.eq('id', input.routeId)
		.maybeSingle();

	if (!route || !route.is_active) {
		throw validationError('Rute tidak ditemukan atau tidak aktif.', {
			routeId: ['Pilih rute aktif.']
		});
	}

	if (route.origin_branch_id !== input.originBranchId || route.destination_branch_id !== input.destinationBranchId) {
		throw orderRouteMismatchError();
	}
}

function orderInputToPayload(input: OrderInput): Json {
	return {
		serviceType: input.serviceType,
		fulfillmentMethod: input.fulfillmentMethod,
		originBranchId: input.originBranchId,
		destinationBranchId: input.destinationBranchId,
		routeId: input.routeId,
		senderCustomerId: input.senderCustomerId,
		receiverCustomerId: input.receiverCustomerId,
		goodsAmount: input.goodsAmount,
		serviceRevenue: input.serviceRevenue,
		additionalServiceFees: input.additionalServiceFees,
		discountAmount: input.discountAmount,
		deliveryAddress: input.deliveryAddress,
		publicNotes: input.publicNotes,
		internalNotes: input.internalNotes,
		items: input.items.map((item) => ({
			storeId: item.storeId,
			productName: item.productName,
			productUrl: item.productUrl,
			quantity: item.quantity,
			estimatedUnitPrice: item.estimatedUnitPrice,
			actualUnitPrice: item.actualUnitPrice,
			weightGrams: item.weightGrams,
			attributes: item.attributes,
			notes: item.notes,
			status: item.status
		})),
		initialPublicDescription: 'Pesanan dicatat oleh admin.',
		initialInternalDescription: input.internalNotes,
		initialLocation: null
	} satisfies Json;
}

export async function createOrder(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	input: OrderInput,
	context: {
		requestId: string;
		idempotencyKey?: string | null;
		ipAddress?: string | null;
		userAgent?: string | null;
	}
): Promise<OrderDetail> {
	await assertOrderReferences(client, auth, input);

	if (input.items.some((item) => !item.productName || item.quantity <= 0 || item.estimatedUnitPrice < 0)) {
		throw validationError('Item pesanan belum lengkap.');
	}

	const result = await createOrderWithItemsRpc(client, {
		payload: orderInputToPayload(input),
		actorProfileId: auth.profile.id,
		requestId: context.requestId,
		idempotencyKey: context.idempotencyKey,
		ipAddress: context.ipAddress,
		userAgent: context.userAgent
	});

	const orderId = result.order?.id;

	if (!orderId) {
		throw validationError('Pesanan berhasil diproses tetapi ID tidak diterima.');
	}

	return getOrderDetail(client, auth, orderId);
}

export async function updateOrder(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	orderId: string,
	input: OrderInput,
	context: { requestId: string; ipAddress?: string | null; userAgent?: string | null }
): Promise<OrderDetail> {
	await assertOrderReferences(client, auth, input);
	const current = await getOrderDetail(client, auth, orderId);

	if (!current.canEdit) {
		throw invalidStatusTransitionError('Pesanan tidak dapat diedit setelah pembayaran atau proses operasional berjalan.');
	}

	if (input.expectedVersion && input.expectedVersion !== current.version) {
		throw conflictError();
	}

	await updateOrderWithItemsRpc(client, {
		orderId,
		payload: orderInputToPayload(input),
		expectedVersion: input.expectedVersion,
		actorProfileId: auth.profile.id,
		requestId: context.requestId,
		ipAddress: context.ipAddress,
		userAgent: context.userAgent
	});

	return getOrderDetail(client, auth, orderId);
}

export async function updateOrderStatus(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	orderId: string,
	input: OrderStatusInput,
	context: { requestId: string; ipAddress?: string | null; userAgent?: string | null }
): Promise<OrderDetail> {
	const current = await getOrderDetail(client, auth, orderId);
	assertOrderBranchAccess(auth, current.origin.id, current.destination.id);

	await updateOrderStatusWithEventRpc(client, {
		orderId,
		status: input.status,
		publicDescription: input.publicDescription,
		internalDescription: input.internalDescription,
		location: input.location,
		expectedVersion: input.expectedVersion,
		actorProfileId: auth.profile.id,
		requestId: context.requestId,
		ipAddress: context.ipAddress,
		userAgent: context.userAgent
	});

	return getOrderDetail(client, auth, orderId);
}

export async function addPaymentToOrder(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	orderId: string,
	input: OrderPaymentInput,
	context: { requestId: string; ipAddress?: string | null; userAgent?: string | null }
): Promise<OrderDetail> {
	const current = await getOrderDetail(client, auth, orderId);
	assertOrderBranchAccess(auth, current.origin.id, current.destination.id);

	if (!input.paymentMethod) {
		throw validationError('Metode pembayaran wajib diisi.', {
			paymentMethod: ['Pilih metode pembayaran.']
		});
	}

	await addOrderPaymentRpc(client, {
		orderId,
		amount: input.amount,
		paymentMethod: input.paymentMethod,
		paidAt: input.paidAt,
		notes: input.notes,
		attachment: input.attachment,
		actorProfileId: auth.profile.id,
		requestId: context.requestId,
		ipAddress: context.ipAddress,
		userAgent: context.userAgent
	});

	return getOrderDetail(client, auth, orderId);
}

export async function verifyOrderPayment(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	paymentId: string,
	input: VerifyPaymentInput,
	context: { requestId: string; ipAddress?: string | null; userAgent?: string | null }
): Promise<OrderDetail> {
	assertOrderManager(auth);

	const { data: payment, error } = await client
		.from('payments')
		.select('id, order_id')
		.eq('id', paymentId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	if (!payment) {
		throw notFoundError('Pembayaran tidak ditemukan.');
	}

	const current = await getOrderDetail(client, auth, payment.order_id);
	assertOrderBranchAccess(auth, current.origin.id, current.destination.id);

	await verifyOrderPaymentRpc(client, {
		paymentId,
		decision: input.decision,
		notes: input.notes,
		actorProfileId: auth.profile.id,
		requestId: context.requestId,
		ipAddress: context.ipAddress,
		userAgent: context.userAgent
	});

	return getOrderDetail(client, auth, payment.order_id);
}

export async function loadOrderReferenceOptions(
	client: SupabaseClient<Database>,
	auth: AuthContext
): Promise<OrderReferenceOptions> {
	assertOrderManager(auth);

	const branchId = auth.role.code === ROLE_CODES.OWNER ? null : auth.branch?.id ?? null;

	const [branchesResult, routesResult, customersResult, storesResult] = await Promise.all([
		client.from('branches').select('id, code, name, is_active').order('name', { ascending: true }),
		client
			.from('routes')
			.select('id, name, origin_branch_id, destination_branch_id, is_active')
			.order('name', { ascending: true }),
		client
			.from('customers')
			.select('id, name, phone, home_branch_id, status')
			.order('name', { ascending: true })
			.limit(100),
		client
			.from('stores')
			.select('id, name, branch_id, is_active')
			.order('name', { ascending: true })
			.limit(100)
	]);

	if (branchesResult.error) throw branchesResult.error;
	if (routesResult.error) throw routesResult.error;
	if (customersResult.error) throw customersResult.error;
	if (storesResult.error) throw storesResult.error;

	const branches = ((branchesResult.data ?? []) as BranchRow[])
		.filter((branch) => branch.is_active && (!branchId || branch.id === branchId))
		.map((branch) => ({ value: branch.id, label: `${branch.code} - ${branch.name}` }));

	const routes = ((routesResult.data ?? []) as RouteRow[])
		.filter(
			(route) =>
				route.is_active &&
				(!branchId || route.origin_branch_id === branchId || route.destination_branch_id === branchId)
		)
		.map((route) => ({
			value: route.id,
			label: route.name,
			originBranchId: route.origin_branch_id,
			destinationBranchId: route.destination_branch_id
		}));

	const customers = ((customersResult.data ?? []) as CustomerRow[])
		.filter((customer) => customer.status === 'active' && (!branchId || customer.home_branch_id === branchId))
		.map((customer) => ({
			value: customer.id,
			label: `${customer.name} - ${customer.phone}`,
			phone: customer.phone,
			homeBranchId: customer.home_branch_id
		}));

	const stores = ((storesResult.data ?? []) as StoreRow[])
		.filter((store) => store.is_active && (!branchId || store.branch_id === branchId))
		.map((store) => ({
			value: store.id,
			label: store.name,
			branchId: store.branch_id
		}));

	return { branches, routes, customers, stores };
}

export function parseOrderListExtras(url: URL): {
	paymentStatus: PaymentStatus | null;
	originBranchId: string | null;
	destinationBranchId: string | null;
	routeId: string | null;
} {
	const rawPaymentStatus = optionalTrimmed(url.searchParams.get('paymentStatus'));
	const paymentStatus =
		rawPaymentStatus && ['unpaid', 'partial', 'paid', 'refunded', 'cancelled'].includes(rawPaymentStatus)
			? (rawPaymentStatus as PaymentStatus)
			: null;

	if (rawPaymentStatus && !paymentStatus) {
		throw validationError('Filter pembayaran tidak valid.');
	}

	return {
		paymentStatus,
		originBranchId: optionalTrimmed(url.searchParams.get('originBranchId')),
		destinationBranchId: optionalTrimmed(url.searchParams.get('destinationBranchId')),
		routeId: optionalTrimmed(url.searchParams.get('routeId'))
	};
}
