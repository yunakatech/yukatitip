import { describe, expect, it } from 'vitest';

import { canAccessAppRoute } from '$lib/auth/app-route-policy';
import { PERMISSION_CODES, ROLE_CODES } from '$lib/constants/access';
import { parseOrderJsonPayload, parseOrderPaymentJsonPayload, parseOrderStatusJsonPayload } from './orders';
import type { AuthContext } from '$lib/types/auth';

const orderPayload = {
	serviceType: 'purchase',
	fulfillmentMethod: 'branch_pickup',
	originBranchId: '20000000-0000-4000-8000-000000000001',
	destinationBranchId: '20000000-0000-4000-8000-000000000002',
	routeId: '50000000-0000-4000-8000-000000000001',
	senderCustomerId: '70000000-0000-4000-8000-000000000001',
	receiverCustomerId: '70000000-0000-4000-8000-000000000002',
	goodsAmount: 350000,
	serviceRevenue: 50000,
	additionalServiceFees: 10000,
	discountAmount: 0,
	items: [
		{
			productName: 'Skincare Paket A',
			quantity: 1,
			estimatedUnitPrice: 350000,
			attributes: { variant: 'Brightening' }
		}
	]
};

const branchAdminAuth = {
	user: { id: '30000000-0000-4000-8000-000000000003', email: 'admin@yukatitip.local' },
	profile: {
		id: '30000000-0000-4000-8000-000000000003',
		fullName: 'Admin',
		phone: null,
		status: 'active',
		role: { id: '10000000-0000-4000-8000-000000000003', code: ROLE_CODES.BRANCH_ADMIN, name: 'Admin Cabang' },
		branch: { id: '20000000-0000-4000-8000-000000000001', code: 'MKS', name: 'Yukatitip Makassar' },
		permissions: [
			{
				id: '11000000-0000-4000-8000-000000000001',
				code: PERMISSION_CODES.ORDERS_MANAGE,
				module: 'orders',
				name: 'Kelola Pesanan'
			}
		]
	},
	role: { id: '10000000-0000-4000-8000-000000000003', code: ROLE_CODES.BRANCH_ADMIN, name: 'Admin Cabang' },
	branch: { id: '20000000-0000-4000-8000-000000000001', code: 'MKS', name: 'Yukatitip Makassar' },
	permissions: [
		{
			id: '11000000-0000-4000-8000-000000000001',
			code: PERMISSION_CODES.ORDERS_MANAGE,
			module: 'orders',
			name: 'Kelola Pesanan'
		}
	]
} satisfies AuthContext;

describe('order payload parsing', () => {
	it('parses the order create API payload with separated money fields', () => {
		const parsed = parseOrderJsonPayload(orderPayload);

		expect(parsed.goodsAmount).toBe(350000);
		expect(parsed.serviceRevenue).toBe(50000);
		expect(parsed.additionalServiceFees).toBe(10000);
		expect(parsed.items).toHaveLength(1);
		expect(parsed.items[0]?.productName).toBe('Skincare Paket A');
		expect(parsed.expectedVersion).toBeNull();
	});

	it('parses expectedVersion and multiple order items', () => {
		const parsed = parseOrderJsonPayload({
			...orderPayload,
			expectedVersion: 4,
			items: [
				...orderPayload.items,
				{
					productName: 'Sepatu anak',
					quantity: 2,
					estimatedUnitPrice: 125000,
					attributes: { warna: 'Hitam' }
				}
			]
		});

		expect(parsed.expectedVersion).toBe(4);
		expect(parsed.items).toHaveLength(2);
		expect(parsed.items[1]?.quantity).toBe(2);
	});

	it('rejects negative money values', () => {
		expect(() => parseOrderJsonPayload({ ...orderPayload, serviceRevenue: -1 })).toThrow(
			/Pendapatan jasa tidak boleh negatif/
		);
	});

	it('rejects empty item arrays', () => {
		expect(() => parseOrderJsonPayload({ ...orderPayload, items: [] })).toThrow(
			/Pesanan wajib memiliki minimal satu item/
		);
	});

	it('parses status and payment payloads', () => {
		expect(
			parseOrderStatusJsonPayload({
				status: 'waiting_payment',
				publicDescription: 'Menunggu pembayaran.',
				expectedVersion: 3
			})
		).toMatchObject({ status: 'waiting_payment', expectedVersion: 3 });

		expect(
			parseOrderPaymentJsonPayload({
				amount: 410000,
				paymentMethod: 'bank_transfer',
				paidAt: '2026-07-13T10:00:00.000Z'
			})
		).toMatchObject({ amount: 410000, attachment: null });
	});
});

describe('order app route policy', () => {
	it('allows branch admin with order permission to access order create and detail routes', () => {
		expect(canAccessAppRoute(branchAdminAuth, '/(app)/app/orders/new')).toBe(true);
		expect(canAccessAppRoute(branchAdminAuth, '/(app)/app/orders/[orderId]')).toBe(true);
	});
});
