import { describe, expect, it } from 'vitest';
import type { User } from '@supabase/supabase-js';

import { buildAuthContext } from './session';

const user = {
	id: '30000000-0000-4000-8000-000000000001',
	email: 'owner@yukatitip.local'
} as User;

describe('buildAuthContext', () => {
	it('sanitizes the authenticated user and profile', () => {
		const context = buildAuthContext(user, {
			id: '30000000-0000-4000-8000-000000000001',
			full_name: 'Yunaka Owner',
			phone: '6281111110001',
			status: 'active',
			role_id: '10000000-0000-4000-8000-000000000001',
			branch_id: '20000000-0000-4000-8000-000000000001',
			role: {
				id: '10000000-0000-4000-8000-000000000001',
				code: 'owner',
				name: 'Owner'
			},
			branch: {
				id: '20000000-0000-4000-8000-000000000001',
				code: 'MKS',
				name: 'Yukatitip Makassar',
				is_active: true
			}
		}, [
			{
				id: '11000000-0000-4000-8000-000000000001',
				code: 'orders.manage',
				module: 'orders',
				name: 'Kelola Pesanan'
			},
			{
				id: '11000000-0000-4000-8000-000000000002',
				code: 'tasks.execute',
				module: 'tasks',
				name: 'Kerjakan Tugas'
			}
		]);

		expect(context).toEqual({
			user: {
				id: '30000000-0000-4000-8000-000000000001',
				email: 'owner@yukatitip.local'
			},
			profile: {
				id: '30000000-0000-4000-8000-000000000001',
				fullName: 'Yunaka Owner',
				phone: '6281111110001',
				status: 'active',
				role: {
					id: '10000000-0000-4000-8000-000000000001',
					code: 'owner',
					name: 'Owner'
				},
				branch: {
					id: '20000000-0000-4000-8000-000000000001',
					code: 'MKS',
					name: 'Yukatitip Makassar'
				},
				permissions: [
					{
						id: '11000000-0000-4000-8000-000000000001',
						code: 'orders.manage',
						module: 'orders',
						name: 'Kelola Pesanan'
					},
					{
						id: '11000000-0000-4000-8000-000000000002',
						code: 'tasks.execute',
						module: 'tasks',
						name: 'Kerjakan Tugas'
					}
				]
			},
			role: {
				id: '10000000-0000-4000-8000-000000000001',
				code: 'owner',
				name: 'Owner'
			},
			branch: {
				id: '20000000-0000-4000-8000-000000000001',
				code: 'MKS',
				name: 'Yukatitip Makassar'
			},
			permissions: [
				{
					id: '11000000-0000-4000-8000-000000000001',
					code: 'orders.manage',
					module: 'orders',
					name: 'Kelola Pesanan'
				},
				{
					id: '11000000-0000-4000-8000-000000000002',
					code: 'tasks.execute',
					module: 'tasks',
					name: 'Kerjakan Tugas'
				}
			]
		});
	});

	it('rejects inactive profiles', () => {
		const context = buildAuthContext(user, {
			id: '30000000-0000-4000-8000-000000000001',
			full_name: 'Yunaka Owner',
			phone: null,
			status: 'inactive',
			role_id: '10000000-0000-4000-8000-000000000001',
			branch_id: null,
				role: {
					id: '10000000-0000-4000-8000-000000000001',
					code: 'owner',
					name: 'Owner'
				},
				branch: null
			});

		expect(context).toBeNull();
	});

	it('allows owner profiles without a branch', () => {
		const context = buildAuthContext(user, {
			id: '30000000-0000-4000-8000-000000000001',
			full_name: 'Yunaka Owner',
			phone: null,
			status: 'active',
			role_id: '10000000-0000-4000-8000-000000000001',
			branch_id: null,
			role: {
				id: '10000000-0000-4000-8000-000000000001',
				code: 'owner',
				name: 'Owner'
			},
			branch: null
		});

		expect(context?.branch).toBeNull();
		expect(context?.role.code).toBe('owner');
	});

	it('rejects branch-scoped profiles without an active branch', () => {
		const context = buildAuthContext(user, {
			id: '30000000-0000-4000-8000-000000000001',
			full_name: 'Yunaka Manager',
			phone: null,
			status: 'active',
			role_id: '10000000-0000-4000-8000-000000000002',
			branch_id: null,
			role: {
				id: '10000000-0000-4000-8000-000000000002',
				code: 'branch_manager',
				name: 'Kepala Cabang'
			},
			branch: null
		});

		expect(context).toBeNull();
	});

	it('rejects branch-scoped profiles with inactive branches', () => {
		const context = buildAuthContext(user, {
			id: '30000000-0000-4000-8000-000000000001',
			full_name: 'Yunaka Manager',
			phone: null,
			status: 'active',
			role_id: '10000000-0000-4000-8000-000000000002',
			branch_id: '20000000-0000-4000-8000-000000000001',
			role: {
				id: '10000000-0000-4000-8000-000000000002',
				code: 'branch_manager',
				name: 'Kepala Cabang'
			},
			branch: {
				id: '20000000-0000-4000-8000-000000000001',
				code: 'MKS',
				name: 'Yukatitip Makassar',
				is_active: false
			}
		});

		expect(context).toBeNull();
	});
});
