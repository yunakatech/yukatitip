import type { Database } from '$lib/supabase/database';

export type OrderStatus = Database['public']['Enums']['order_status'];
export type PaymentStatus = Database['public']['Enums']['payment_status'];
export type ServiceType = Database['public']['Enums']['service_type'];
export type FulfillmentMethod = Database['public']['Enums']['fulfillment_method'];
export type OrderItemStatus = Database['public']['Enums']['order_item_status'];

export const ORDER_STATUSES = [
	'recorded',
	'waiting_payment',
	'payment_received',
	'waiting_origin_process',
	'purchasing_or_collecting',
	'received_at_origin',
	'waiting_departure',
	'in_transit',
	'arrived_at_destination',
	'ready_for_handover',
	'completed',
	'problem',
	'cancelled'
] as const satisfies readonly OrderStatus[];

export const EDITABLE_ORDER_STATUSES = ['recorded', 'waiting_payment'] as const satisfies readonly OrderStatus[];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
	recorded: 'Pesanan dicatat',
	waiting_payment: 'Menunggu pembayaran',
	payment_received: 'Pembayaran diterima',
	waiting_origin_process: 'Menunggu diproses',
	purchasing_or_collecting: 'Sedang dibeli/diambil',
	received_at_origin: 'Diterima di titik asal',
	waiting_departure: 'Menunggu keberangkatan',
	in_transit: 'Dalam perjalanan',
	arrived_at_destination: 'Tiba di kota tujuan',
	ready_for_handover: 'Siap diserahkan',
	completed: 'Selesai',
	problem: 'Bermasalah',
	cancelled: 'Dibatalkan'
};

export const ORDER_STATUS_TONES: Record<OrderStatus, 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'> = {
	recorded: 'neutral',
	waiting_payment: 'warning',
	payment_received: 'info',
	waiting_origin_process: 'warning',
	purchasing_or_collecting: 'brand',
	received_at_origin: 'info',
	waiting_departure: 'warning',
	in_transit: 'brand',
	arrived_at_destination: 'info',
	ready_for_handover: 'success',
	completed: 'success',
	problem: 'danger',
	cancelled: 'neutral'
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
	unpaid: 'Belum dibayar',
	partial: 'Dibayar sebagian',
	paid: 'Lunas',
	refunded: 'Dikembalikan',
	cancelled: 'Dibatalkan'
};

export const PAYMENT_STATUS_TONES: Record<PaymentStatus, 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'> = {
	unpaid: 'warning',
	partial: 'info',
	paid: 'success',
	refunded: 'neutral',
	cancelled: 'danger'
};

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
	purchase: 'Titip beli',
	pickup: 'Titip ambil',
	delivery: 'Titip kirim'
};

export const FULFILLMENT_METHOD_LABELS: Record<FulfillmentMethod, string> = {
	branch_pickup: 'Ambil di cabang',
	local_delivery: 'Diantar lokal'
};

export const ORDER_SERVICE_TYPE_OPTIONS = [
	{ value: 'purchase', label: SERVICE_TYPE_LABELS.purchase },
	{ value: 'pickup', label: SERVICE_TYPE_LABELS.pickup },
	{ value: 'delivery', label: SERVICE_TYPE_LABELS.delivery }
] as const;

export const ORDER_FULFILLMENT_OPTIONS = [
	{ value: 'branch_pickup', label: FULFILLMENT_METHOD_LABELS.branch_pickup },
	{ value: 'local_delivery', label: FULFILLMENT_METHOD_LABELS.local_delivery }
] as const;

export const ORDER_ITEM_STATUS_LABELS: Record<OrderItemStatus, string> = {
	recorded: 'Dicatat',
	waiting_confirmation: 'Menunggu konfirmasi',
	available: 'Tersedia',
	unavailable: 'Tidak tersedia',
	purchased: 'Dibeli',
	collected: 'Diambil',
	received_at_origin: 'Diterima asal',
	packed: 'Dikemas',
	completed: 'Selesai',
	cancelled: 'Dibatalkan'
};

export const ORDER_ITEM_STATUS_OPTIONS = [
	{ value: 'recorded', label: ORDER_ITEM_STATUS_LABELS.recorded },
	{ value: 'waiting_confirmation', label: ORDER_ITEM_STATUS_LABELS.waiting_confirmation },
	{ value: 'available', label: ORDER_ITEM_STATUS_LABELS.available },
	{ value: 'unavailable', label: ORDER_ITEM_STATUS_LABELS.unavailable },
	{ value: 'purchased', label: ORDER_ITEM_STATUS_LABELS.purchased },
	{ value: 'collected', label: ORDER_ITEM_STATUS_LABELS.collected },
	{ value: 'received_at_origin', label: ORDER_ITEM_STATUS_LABELS.received_at_origin },
	{ value: 'packed', label: ORDER_ITEM_STATUS_LABELS.packed },
	{ value: 'completed', label: ORDER_ITEM_STATUS_LABELS.completed },
	{ value: 'cancelled', label: ORDER_ITEM_STATUS_LABELS.cancelled }
] as const;

export const ORDER_PAYMENT_METHOD_OPTIONS = [
	{ value: 'bank_transfer', label: 'Transfer bank' },
	{ value: 'qris_manual', label: 'QRIS manual' },
	{ value: 'cash', label: 'Tunai' }
] as const;
