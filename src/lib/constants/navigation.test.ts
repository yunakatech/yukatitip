import { describe, expect, it } from 'vitest';

import { ROLE_CODES } from './access';
import { getNavigationMatch, getVisibleNavigation, isNavigationItemActive } from './navigation';
import type { AuthContext } from '$lib/types/auth';

function createAuth(overrides: Partial<AuthContext> = {}): AuthContext {
	return {
		user: {
			id: '30000000-0000-4000-8000-000000000001',
			email: 'owner@yukatitip.local'
		},
		profile: {
			id: '30000000-0000-4000-8000-000000000001',
			fullName: 'Yunaka Owner',
			phone: null,
			status: 'active',
			role: {
				id: '10000000-0000-4000-8000-000000000001',
				code: ROLE_CODES.OWNER,
				name: 'Owner'
			},
			branch: null,
			permissions: [
				{
					id: '11000000-0000-4000-8000-000000000001',
					code: 'orders.manage',
					module: 'orders',
					name: 'Kelola Pesanan'
				}
			]
		},
		role: {
			id: '10000000-0000-4000-8000-000000000001',
			code: ROLE_CODES.OWNER,
			name: 'Owner'
		},
		branch: null,
		permissions: [
			{
				id: '11000000-0000-4000-8000-000000000001',
				code: 'orders.manage',
				module: 'orders',
				name: 'Kelola Pesanan'
			}
		],
		...overrides
	};
}

describe('navigation', () => {
	it('marks nested paths as active', () => {
		expect(isNavigationItemActive('/app/orders/123', '/app/orders')).toBe(true);
		expect(isNavigationItemActive('/app/dashboard', '/app/orders')).toBe(false);
	});

	it('hides navigation items when role and permissions do not match', () => {
		const auth = createAuth({
			role: {
				id: '10000000-0000-4000-8000-000000000002',
				code: ROLE_CODES.BRANCH_ADMIN,
				name: 'Admin Cabang'
			},
			profile: {
				id: '30000000-0000-4000-8000-000000000001',
				fullName: 'Yunaka Owner',
				phone: null,
				status: 'active',
				role: {
					id: '10000000-0000-4000-8000-000000000002',
					code: ROLE_CODES.BRANCH_ADMIN,
					name: 'Admin Cabang'
				},
				branch: null,
				permissions: []
			},
			permissions: []
		});

		const navigation = getVisibleNavigation(auth);
		const labels = navigation.flatMap((group) => group.items.map((item) => item.label));

		expect(labels).toContain('Dashboard');
		expect(labels).not.toContain('Komisi');
		expect(labels).not.toContain('Akun & Role');
	});

	it('returns the matching active item', () => {
		const navigation = getVisibleNavigation(createAuth());
		const match = getNavigationMatch(navigation, '/app/orders/abc');

		expect(match?.label).toBe('Pesanan');
		expect(match?.active).toBe(true);
	});
});
