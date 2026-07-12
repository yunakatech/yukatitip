import type { SupabaseClient } from '@supabase/supabase-js';

import { ROLE_CODES } from '$lib/constants/access';
import type { AuthContext } from '$lib/types/auth';
import type { Database } from '$lib/supabase/database';

import { assertCustomerStoreManager, assertViewBranchScopedData } from './auth';
import { branchAccessDeniedError, conflictError, notFoundError, validationError } from './errors';
import { compactSearch, normalizePhone, normalizeWhitespace, optionalTrimmed } from './format';
import type { ParsedListQuery } from './query';
import { resolveBranchScope } from './query';

type StoreRow = Database['public']['Tables']['stores']['Row'];
type BranchRow = Database['public']['Tables']['branches']['Row'];

export interface StoreListItem {
	id: string;
	name: string;
	city: string | null;
	phone: string | null;
	isActive: boolean;
	branch: {
		id: string;
		code: string;
		name: string;
	} | null;
	createdAt: string;
	updatedAt: string;
}

export interface StoreDetail extends StoreListItem {
	address: string | null;
	mapsUrl: string | null;
	openingHours: string | null;
	notes: string | null;
}

export interface StoreInput {
	branchId: string | null;
	name: string;
	address: string | null;
	city: string | null;
	phone: string | null;
	mapsUrl: string | null;
	openingHours: string | null;
	notes: string | null;
	isActive: boolean;
	expectedUpdatedAt: string | null;
}

const STORE_SORT_COLUMNS: Record<string, keyof StoreRow> = {
	name: 'name',
	city: 'city',
	createdAt: 'created_at',
	updatedAt: 'updated_at'
};

function normalizeStoreSearch(value: string): string {
	return compactSearch(value).replace(/[%_,]/g, ' ').slice(0, 120);
}

async function loadBranchesMap(
	client: SupabaseClient<Database>,
	branchIds: string[]
): Promise<Map<string, StoreListItem['branch']>> {
	const uniqueBranchIds = [...new Set(branchIds.filter(Boolean))];

	if (uniqueBranchIds.length === 0) {
		return new Map();
	}

	const { data, error } = await client
		.from('branches')
		.select('id, code, name')
		.in('id', uniqueBranchIds);

	if (error || !data) {
		throw error ?? notFoundError();
	}

	return new Map(
		(data as BranchRow[]).map((branch) => [
			branch.id,
			{
				id: branch.id,
				code: branch.code,
				name: branch.name
			}
		])
	);
}

function normalizeStoreInput(input: StoreInput): StoreInput {
	return {
		...input,
		name: normalizeWhitespace(input.name),
		address: optionalTrimmed(input.address),
		city: optionalTrimmed(input.city),
		phone: input.phone ? normalizePhone(input.phone) : null,
		mapsUrl: optionalTrimmed(input.mapsUrl),
		openingHours: optionalTrimmed(input.openingHours),
		notes: optionalTrimmed(input.notes)
	};
}

function assertCanUseBranch(auth: AuthContext, branchId: string | null): string | null {
	if (auth.role.code === ROLE_CODES.OWNER) {
		return branchId;
	}

	if (!auth.branch) {
		throw branchAccessDeniedError();
	}

	if (branchId && branchId !== auth.branch.id) {
		throw branchAccessDeniedError();
	}

	return auth.branch.id;
}

function buildStoreListItem(store: StoreRow, branch: StoreListItem['branch']): StoreListItem {
	return {
		id: store.id,
		name: store.name,
		city: store.city,
		phone: store.phone,
		isActive: store.is_active,
		branch,
		createdAt: store.created_at,
		updatedAt: store.updated_at
	};
}

export function parseStoreInput(formData: FormData): StoreInput {
	return {
		branchId: optionalTrimmed(String(formData.get('branchId') ?? '')),
		name: String(formData.get('name') ?? ''),
		address: optionalTrimmed(String(formData.get('address') ?? '')),
		city: optionalTrimmed(String(formData.get('city') ?? '')),
		phone: optionalTrimmed(String(formData.get('phone') ?? '')),
		mapsUrl: optionalTrimmed(String(formData.get('mapsUrl') ?? '')),
		openingHours: optionalTrimmed(String(formData.get('openingHours') ?? '')),
		notes: optionalTrimmed(String(formData.get('notes') ?? '')),
		isActive: String(formData.get('isActive') ?? 'true') !== 'false',
		expectedUpdatedAt: optionalTrimmed(String(formData.get('expectedUpdatedAt') ?? ''))
	};
}

export async function listStores(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	query: ParsedListQuery
): Promise<{
	items: StoreListItem[];
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
}> {
	const page = query.page;
	const pageSize = query.pageSize;
	const offset = (page - 1) * pageSize;
	const sortColumn = STORE_SORT_COLUMNS[query.sortField] ?? 'created_at';
	const branchId = resolveBranchScope(auth, query.branchId);
	let request = client
		.from('stores')
		.select('id, branch_id, name, address, city, phone, maps_url, opening_hours, notes, is_active, created_at, updated_at', {
			count: 'exact'
		})
		.order(sortColumn, { ascending: query.sortDirection === 'asc' });

	if (query.search) {
		const search = normalizeStoreSearch(query.search);
		request = request.or(`name.ilike.%${search}%,city.ilike.%${search}%,phone.ilike.%${search}%`);
	}

	if (branchId) {
		request = request.eq('branch_id', branchId);
	}

	if (query.status) {
		request = request.eq('is_active', query.status === 'active');
	}

	const { data, error, count } = await request.range(offset, offset + pageSize - 1);

	if (error || !data) {
		throw error ?? notFoundError();
	}

	const stores = data as StoreRow[];
	const branchMap = await loadBranchesMap(
		client,
		stores.map((store) => store.branch_id).filter((value): value is string => Boolean(value))
	);

	const items = stores.map((store) =>
		buildStoreListItem(store, store.branch_id ? branchMap.get(store.branch_id) ?? null : null)
	);

	return {
		items,
		page,
		pageSize,
		total: count ?? items.length,
		totalPages: count ? Math.max(1, Math.ceil(count / pageSize)) : 1
	};
}

export async function getStoreDetail(
	client: SupabaseClient<Database>,
	storeId: string,
	auth: AuthContext
): Promise<StoreDetail> {
	const { data, error } = await client
		.from('stores')
		.select('id, branch_id, name, address, city, phone, maps_url, opening_hours, notes, is_active, created_at, updated_at')
		.eq('id', storeId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	if (!data) {
		throw notFoundError('Toko tidak ditemukan.');
	}

	const store = data as StoreRow;
	const branchId = assertViewBranchScopedData(auth, store.branch_id, [
		ROLE_CODES.BRANCH_MANAGER,
		ROLE_CODES.BRANCH_ADMIN
	]);

	if (auth.role.code !== ROLE_CODES.OWNER && branchId !== store.branch_id) {
		throw branchAccessDeniedError();
	}

	const branchMap = await loadBranchesMap(client, store.branch_id ? [store.branch_id] : []);

	return {
		...buildStoreListItem(store, store.branch_id ? branchMap.get(store.branch_id) ?? null : null),
		address: store.address,
		mapsUrl: store.maps_url,
		openingHours: store.opening_hours,
		notes: store.notes
	};
}

export async function createStore(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	input: StoreInput
): Promise<StoreDetail> {
	assertCustomerStoreManager(auth, input.branchId ?? null);

	const normalized = normalizeStoreInput(input);
	const branchId = assertCanUseBranch(auth, normalized.branchId);

	if (!normalized.name) {
		throw validationError('Nama toko wajib diisi.', { name: ['Nama toko wajib diisi.'] });
	}

	if (!normalized.city) {
		throw validationError('Kota wajib diisi.', { city: ['Kota wajib diisi.'] });
	}

	const { data, error } = await client
		.from('stores')
		.insert({
			branch_id: branchId,
			name: normalized.name,
			address: normalized.address,
			city: normalized.city,
			phone: normalized.phone,
			maps_url: normalized.mapsUrl,
			opening_hours: normalized.openingHours,
			notes: normalized.notes,
			is_active: normalized.isActive
		})
		.select('id')
		.single();

	if (error) {
		throw error;
	}

	return getStoreDetail(client, data.id, auth);
}

export async function updateStore(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	storeId: string,
	input: StoreInput
): Promise<StoreDetail> {
	const current = await getStoreDetail(client, storeId, auth);
	assertCustomerStoreManager(auth, current.branch?.id ?? input.branchId);

	if (input.expectedUpdatedAt && input.expectedUpdatedAt !== current.updatedAt) {
		throw conflictError();
	}

	const normalized = normalizeStoreInput(input);
	const branchId = assertCanUseBranch(auth, normalized.branchId ?? current.branch?.id ?? null);

	if (!normalized.name) {
		throw validationError('Nama toko wajib diisi.', { name: ['Nama toko wajib diisi.'] });
	}

	if (!normalized.city) {
		throw validationError('Kota wajib diisi.', { city: ['Kota wajib diisi.'] });
	}

	const { error } = await client
		.from('stores')
		.update({
			branch_id: branchId,
			name: normalized.name,
			address: normalized.address,
			city: normalized.city,
			phone: normalized.phone,
			maps_url: normalized.mapsUrl,
			opening_hours: normalized.openingHours,
			notes: normalized.notes,
			is_active: normalized.isActive
		})
		.eq('id', storeId);

	if (error) {
		throw error;
	}

	return getStoreDetail(client, storeId, auth);
}
