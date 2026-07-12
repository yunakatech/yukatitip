import { describe, expect, it } from 'vitest';

import { PERMISSION_CODES, ROLE_CODES, type PermissionCode, type RoleCode } from '../src/lib/constants/access';
import type { AuthContext } from '../src/lib/types/auth';

import { load } from '../src/routes/(app)/app/+layout.server';

type LayoutLoadResult = {
	user: AuthContext['user'];
	profile: AuthContext['profile'];
};

function createAuth(roleCode: RoleCode, permissions: PermissionCode[] = []): AuthContext {
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
				code: roleCode,
				name: roleCode
			},
			branch: {
				id: '20000000-0000-4000-8000-000000000001',
				code: 'MKS',
				name: 'Yukatitip Makassar'
			},
			permissions: permissions.map((code, index) => ({
				id: `11000000-0000-4000-8000-00000000000${index + 1}`,
				code,
				module: code.split('.')[0],
				name: code
			}))
		},
		role: {
			id: '10000000-0000-4000-8000-000000000001',
			code: roleCode,
			name: roleCode
		},
		branch: {
			id: '20000000-0000-4000-8000-000000000001',
			code: 'MKS',
			name: 'Yukatitip Makassar'
		},
		permissions: permissions.map((code, index) => ({
			id: `11000000-0000-4000-8000-00000000000${index + 1}`,
			code,
			module: code.split('.')[0],
			name: code
		}))
	};
}

async function runLoad(options: {
	auth: AuthContext | null;
	routeId: string;
	pathname: string;
}): Promise<LayoutLoadResult> {
	return (await load({
		locals: {
			auth: options.auth
		},
		route: {
			id: options.routeId
		},
		url: new URL(`http://localhost${options.pathname}`)
	} as Parameters<typeof load>[0])) as LayoutLoadResult;
}

describe('app layout server auth policy', () => {
	it('allows owner access to payroll when the permission exists', async () => {
		const result = await runLoad({
			auth: createAuth(ROLE_CODES.OWNER, [PERMISSION_CODES.PAYROLL_MANAGE]),
			routeId: '/(app)/app/payroll',
			pathname: '/app/payroll'
		});

		expect(result.user.id).toBe('30000000-0000-4000-8000-000000000001');
		expect(result.profile.role.code).toBe(ROLE_CODES.OWNER);
	});

	it('denies branch managers from payroll', async () => {
		await expect(
			runLoad({
				auth: createAuth(ROLE_CODES.BRANCH_MANAGER, [PERMISSION_CODES.PAYROLL_MANAGE]),
				routeId: '/(app)/app/payroll',
				pathname: '/app/payroll'
			})
		).rejects.toMatchObject({ status: 403 });
	});

	it('allows owner access to settings', async () => {
		const result = await runLoad({
			auth: createAuth(ROLE_CODES.OWNER),
			routeId: '/(app)/app/settings',
			pathname: '/app/settings'
		});

		expect(result.profile.role.code).toBe(ROLE_CODES.OWNER);
	});

	it('denies branch managers from settings', async () => {
		await expect(
			runLoad({
				auth: createAuth(ROLE_CODES.BRANCH_MANAGER),
				routeId: '/(app)/app/settings',
				pathname: '/app/settings'
			})
		).rejects.toMatchObject({ status: 403 });
	});
});
