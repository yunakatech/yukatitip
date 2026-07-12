import type { Pathname } from '$app/types';
import { canAccessAppPath } from '$lib/auth/app-route-policy';
import type { AuthContext } from '$lib/types/auth';

export type NavigationIconName =
	| 'dashboard'
	| 'orders'
	| 'tasks'
	| 'trips'
	| 'tracking'
	| 'customers'
	| 'stores'
	| 'branches'
	| 'routes'
	| 'payments'
	| 'expenses'
	| 'commissions'
	| 'payroll'
	| 'reports'
	| 'employees'
	| 'roles'
	| 'settings';

export interface NavigationItemDefinition {
	label: string;
	href: Pathname;
	icon: NavigationIconName;
	description: string;
}

export interface NavigationGroupDefinition {
	label: string;
	items: readonly NavigationItemDefinition[];
}

export interface VisibleNavigationItem extends NavigationItemDefinition {
	active: boolean;
}

export interface VisibleNavigationGroup {
	label: string;
	items: VisibleNavigationItem[];
}

export const NAVIGATION_GROUPS = [
	{
		label: 'Ringkasan',
		items: [
			{
				label: 'Dashboard',
				href: '/app/dashboard',
				icon: 'dashboard',
				description: 'Ringkasan aktivitas harian'
			}
		]
	},
	{
		label: 'Operasional',
		items: [
			{
				label: 'Pesanan',
				href: '/app/orders',
				icon: 'orders',
				description: 'Kelola pesanan masuk dan status'
			},
			{
				label: 'Tugas',
				href: '/app/tasks',
				icon: 'tasks',
				description: 'Kerjakan tugas lapangan dan titik layanan'
			},
			{
				label: 'Batch perjalanan',
				href: '/app/trips',
				icon: 'trips',
				description: 'Kelola keberangkatan dan serah terima'
			},
			{
				label: 'Tracking',
				href: '/app/tracking',
				icon: 'tracking',
				description: 'Lacak status barang dan riwayat'
			}
		]
	},
	{
		label: 'Data',
		items: [
			{
				label: 'Customer',
				href: '/app/customers',
				icon: 'customers',
				description: 'Data customer dan riwayat transaksi'
			},
			{
				label: 'Toko',
				href: '/app/stores',
				icon: 'stores',
				description: 'Lokasi pengambilan dan mitra'
			},
			{
				label: 'Cabang',
				href: '/app/branches',
				icon: 'branches',
				description: 'Data cabang dan titik layanan'
			},
			{
				label: 'Rute',
				href: '/app/routes',
				icon: 'routes',
				description: 'Arah perjalanan dan jadwal aktif'
			}
		]
	},
	{
		label: 'Keuangan',
		items: [
			{
				label: 'Pembayaran',
				href: '/app/payments',
				icon: 'payments',
				description: 'Verifikasi pembayaran customer'
			},
			{
				label: 'Biaya Petugas',
				href: '/app/expenses',
				icon: 'expenses',
				description: 'Biaya operasional harian petugas'
			},
			{
				label: 'Biaya Cabang',
				href: '/app/branch-expenses',
				icon: 'expenses',
				description: 'Biaya operasional cabang'
			},
			{
				label: 'Komisi',
				href: '/app/commissions',
				icon: 'commissions',
				description: 'Perhitungan kontribusi dan komisi'
			},
			{
				label: 'Payroll',
				href: '/app/payroll',
				icon: 'payroll',
				description: 'Ringkasan payroll sederhana'
			},
			{
				label: 'Laporan',
				href: '/app/reports',
				icon: 'reports',
				description: 'Laporan operasional dan keuangan'
			}
		]
	},
	{
		label: 'Organisasi',
		items: [
			{
				label: 'Karyawan',
				href: '/app/employees',
				icon: 'employees',
				description: 'Data karyawan dan penempatan'
			},
			{
				label: 'Akun & Role',
				href: '/app/accounts',
				icon: 'roles',
				description: 'Akses internal dan role pengguna'
			},
			{
				label: 'Pengaturan',
				href: '/app/settings',
				icon: 'settings',
				description: 'Konfigurasi sistem dan cabang'
			}
		]
	}
] as const satisfies readonly NavigationGroupDefinition[];

function normalizePath(pathname: string): string {
	if (!pathname || pathname === '/') {
		return '/';
	}

	return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

export function isNavigationItemActive(pathname: string, href: string): boolean {
	const normalizedPath = normalizePath(pathname);
	const normalizedHref = normalizePath(href);

	return normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/`);
}

function canAccessItem(auth: AuthContext | null, item: NavigationItemDefinition): boolean {
	return canAccessAppPath(auth, item.href);
}

export function getVisibleNavigation(auth: AuthContext | null): VisibleNavigationGroup[] {
	return NAVIGATION_GROUPS.map((group) => {
		const items = group.items
			.filter((item) => canAccessItem(auth, item))
			.map((item) => ({
				...item,
				active: false
			}));

		return {
			label: group.label,
			items
		};
	}).filter((group) => group.items.length > 0);
}

export function getNavigationMatch(
	navigation: VisibleNavigationGroup[],
	pathname: string
): VisibleNavigationItem | null {
	for (const group of navigation) {
		for (const item of group.items) {
			if (isNavigationItemActive(pathname, item.href)) {
				return {
					...item,
					active: true
				};
			}
		}
	}

	return null;
}
