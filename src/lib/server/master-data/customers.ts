import type { SupabaseClient } from '@supabase/supabase-js';

import { ROLE_CODES } from '$lib/constants/access';
import type { AuthContext } from '$lib/types/auth';
import type { Database } from '$lib/supabase/database';

import { assertCustomerStoreManager, assertViewBranchScopedData } from './auth';
import {
	branchAccessDeniedError,
	customerPhoneExistsError,
	conflictError,
	notFoundError,
	validationError
} from './errors';
import {
	compactSearch,
	normalizeEmail,
	normalizePhone,
	normalizeWhitespace,
	optionalTrimmed
} from './format';
import type { ParsedListQuery } from './query';
import { resolveBranchScope } from './query';

type CustomerRow = Database['public']['Tables']['customers']['Row'];
type BranchRow = Database['public']['Tables']['branches']['Row'];

type CustomerStatus = Database['public']['Enums']['account_status'];
type CustomerType = Database['public']['Enums']['customer_type'];

export interface CustomerListItem {
	id: string;
	name: string;
	phone: string;
	email: string | null;
	customerType: CustomerType;
	city: string | null;
	status: CustomerStatus;
	homeBranch: {
		id: string;
		code: string;
		name: string;
	} | null;
	createdAt: string;
	updatedAt: string;
}

export interface CustomerDetail extends CustomerListItem {
	email: string | null;
	address: string | null;
	district: string | null;
	landmark: string | null;
	notes: string | null;
	orderCount: number;
}

export interface CustomerInput {
	homeBranchId: string | null;
	name: string;
	phone: string;
	email: string | null;
	customerType: CustomerType;
	address: string | null;
	district: string | null;
	city: string | null;
	landmark: string | null;
	notes: string | null;
	status: CustomerStatus;
	expectedUpdatedAt: string | null;
}

const CUSTOMER_SORT_COLUMNS: Record<string, keyof CustomerRow> = {
	name: 'name',
	phone: 'phone',
	city: 'city',
	status: 'status',
	createdAt: 'created_at',
	updatedAt: 'updated_at'
};

const ALLOWED_CUSTOMER_TYPES: CustomerType[] = ['individual', 'business', 'reseller'];
const ALLOWED_CUSTOMER_STATUSES: CustomerStatus[] = ['active', 'inactive', 'suspended'];

export interface CustomerListQuery extends ParsedListQuery {
	customerType?: CustomerType | null;
}

function normalizeCustomerSearch(value: string): string {
	return compactSearch(value).replace(/[%_,]/g, ' ').slice(0, 120);
}

function mapBranch(branch: BranchRow | null): CustomerListItem['homeBranch'] {
	if (!branch) {
		return null;
	}

	return {
		id: branch.id,
		code: branch.code,
		name: branch.name
	};
}

async function loadBranchesMap(
	client: SupabaseClient<Database>,
	branchIds: string[]
): Promise<Map<string, CustomerListItem['homeBranch']>> {
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
		(data as BranchRow[]).map((branch) => [branch.id, mapBranch(branch)])
	);
}

function assertCustomerType(value: string): CustomerType {
	if (ALLOWED_CUSTOMER_TYPES.includes(value as CustomerType)) {
		return value as CustomerType;
	}

	throw validationError('Tipe customer tidak valid.', {
		customerType: ['Pilih tipe customer yang tersedia.']
	});
}

function assertCustomerStatus(value: string): CustomerStatus {
	if (ALLOWED_CUSTOMER_STATUSES.includes(value as CustomerStatus)) {
		return value as CustomerStatus;
	}

	throw validationError('Status customer tidak valid.', {
		status: ['Pilih status customer yang tersedia.']
	});
}

function normalizeCustomerInput(input: CustomerInput): CustomerInput {
	return {
		...input,
		name: normalizeWhitespace(input.name),
		phone: normalizePhone(input.phone),
		email: input.email ? normalizeEmail(input.email) : null,
		address: optionalTrimmed(input.address),
		district: optionalTrimmed(input.district),
		city: optionalTrimmed(input.city),
		landmark: optionalTrimmed(input.landmark),
		notes: optionalTrimmed(input.notes)
	};
}

export function parseCustomerInput(formData: FormData): CustomerInput {
	const rawType = String(formData.get('customerType') ?? 'individual');
	const rawStatus = String(formData.get('status') ?? 'active');
	const rawHomeBranchId = optionalTrimmed(String(formData.get('homeBranchId') ?? ''));

	return {
		homeBranchId: rawHomeBranchId,
		name: String(formData.get('name') ?? ''),
		phone: String(formData.get('phone') ?? ''),
		email: optionalTrimmed(String(formData.get('email') ?? '')),
		customerType: assertCustomerType(rawType),
		address: optionalTrimmed(String(formData.get('address') ?? '')),
		district: optionalTrimmed(String(formData.get('district') ?? '')),
		city: optionalTrimmed(String(formData.get('city') ?? '')),
		landmark: optionalTrimmed(String(formData.get('landmark') ?? '')),
		notes: optionalTrimmed(String(formData.get('notes') ?? '')),
		status: assertCustomerStatus(rawStatus),
		expectedUpdatedAt: optionalTrimmed(String(formData.get('expectedUpdatedAt') ?? ''))
	};
}

function assertCanUseHomeBranch(auth: AuthContext, homeBranchId: string | null): string | null {
	if (auth.role.code === ROLE_CODES.OWNER) {
		return homeBranchId;
	}

	if (!auth.branch) {
		throw branchAccessDeniedError();
	}

	if (homeBranchId && homeBranchId !== auth.branch.id) {
		throw branchAccessDeniedError();
	}

	return auth.branch.id;
}

async function assertUniquePhone(
	client: SupabaseClient<Database>,
	phone: string,
	customerId: string | null = null
): Promise<void> {
	let request = client.from('customers').select('id').eq('phone', phone);

	if (customerId) {
		request = request.neq('id', customerId);
	}

	const { data, error } = await request.maybeSingle();

	if (error) {
		throw error;
	}

	if (data) {
		throw customerPhoneExistsError();
	}
}

function buildCustomerListItem(
	customer: CustomerRow,
	homeBranch: CustomerListItem['homeBranch']
): CustomerListItem {
	return {
		id: customer.id,
		name: customer.name,
		phone: customer.phone,
		email: customer.email,
		customerType: customer.customer_type,
		city: customer.city,
		status: customer.status,
		homeBranch,
		createdAt: customer.created_at,
		updatedAt: customer.updated_at
	};
}

export async function listCustomers(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	query: CustomerListQuery
): Promise<{
	items: CustomerListItem[];
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
}> {
	const page = query.page;
	const pageSize = query.pageSize;
	const offset = (page - 1) * pageSize;
	const sortColumn = CUSTOMER_SORT_COLUMNS[query.sortField] ?? 'created_at';
	const branchId = resolveBranchScope(auth, query.branchId);
	let request = client
		.from('customers')
		.select('id, home_branch_id, name, phone, email, customer_type, address, district, city, landmark, status, notes, first_transaction_at, created_by, created_at, updated_at', {
			count: 'exact'
		})
		.order(sortColumn, { ascending: query.sortDirection === 'asc' });

	if (query.search) {
		const search = normalizeCustomerSearch(query.search);
		request = request.or(
			`name.ilike.%${search}%,phone.ilike.%${search}%,city.ilike.%${search}%,email.ilike.%${search}%`
		);
	}

	if (branchId) {
		request = request.eq('home_branch_id', branchId);
	}

	if (query.status) {
		request = request.eq('status', query.status as CustomerStatus);
	}

	if (query.customerType) {
		request = request.eq('customer_type', query.customerType);
	}

	const { data, error, count } = await request.range(offset, offset + pageSize - 1);

	if (error || !data) {
		throw error ?? notFoundError();
	}

	const customers = data as CustomerRow[];
	const branchMap = await loadBranchesMap(
		client,
		customers.map((customer) => customer.home_branch_id).filter((value): value is string => Boolean(value))
	);

	const items = customers.map((customer) =>
		buildCustomerListItem(customer, customer.home_branch_id ? branchMap.get(customer.home_branch_id) ?? null : null)
	);

	return {
		items,
		page,
		pageSize,
		total: count ?? items.length,
		totalPages: count ? Math.max(1, Math.ceil(count / pageSize)) : 1
	};
}

export async function getCustomerDetail(
	client: SupabaseClient<Database>,
	customerId: string,
	auth: AuthContext
): Promise<CustomerDetail> {
	const { data, error } = await client
		.from('customers')
		.select('id, home_branch_id, name, phone, email, customer_type, address, district, city, landmark, status, notes, first_transaction_at, created_by, created_at, updated_at')
		.eq('id', customerId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	if (!data) {
		throw notFoundError('Customer tidak ditemukan.');
	}

	const customer = data as CustomerRow;
	const branchId = assertViewBranchScopedData(auth, customer.home_branch_id, [
		ROLE_CODES.BRANCH_MANAGER,
		ROLE_CODES.BRANCH_ADMIN
	]);

	if (auth.role.code !== ROLE_CODES.OWNER && branchId !== customer.home_branch_id) {
		throw branchAccessDeniedError();
	}

	const branchMap = await loadBranchesMap(
		client,
		customer.home_branch_id ? [customer.home_branch_id] : []
	);
	const { count: orderCount } = await client
		.from('orders')
		.select('id', { count: 'exact', head: true })
		.eq('sender_customer_id', customerId);

	return {
		...buildCustomerListItem(customer, customer.home_branch_id ? branchMap.get(customer.home_branch_id) ?? null : null),
		email: customer.email,
		address: customer.address,
		district: customer.district,
		landmark: customer.landmark,
		notes: customer.notes,
		orderCount: orderCount ?? 0
	};
}

export async function createCustomer(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	input: CustomerInput
): Promise<CustomerDetail> {
	assertCustomerStoreManager(auth, input.homeBranchId ?? null);

	const normalized = normalizeCustomerInput(input);
	const homeBranchId = assertCanUseHomeBranch(auth, normalized.homeBranchId);

	if (!normalized.name) {
		throw validationError('Nama customer wajib diisi.', {
			name: ['Nama customer wajib diisi.']
		});
	}

	if (!normalized.phone) {
		throw validationError('Nomor WhatsApp wajib diisi.', {
			phone: ['Nomor WhatsApp wajib diisi.']
		});
	}

	await assertUniquePhone(client, normalized.phone);

	const { data, error } = await client
		.from('customers')
		.insert({
			home_branch_id: homeBranchId,
			name: normalized.name,
			phone: normalized.phone,
			email: normalized.email,
			customer_type: normalized.customerType,
			address: normalized.address,
			district: normalized.district,
			city: normalized.city,
			landmark: normalized.landmark,
			status: normalized.status,
			notes: normalized.notes,
			created_by: auth.profile.id
		})
		.select('id')
		.single();

	if (error) {
		if (error.code === '23505') {
			throw customerPhoneExistsError();
		}

		throw error;
	}

	return getCustomerDetail(client, data.id, auth);
}

export async function updateCustomer(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	customerId: string,
	input: CustomerInput
): Promise<CustomerDetail> {
	const current = await getCustomerDetail(client, customerId, auth);
	assertCustomerStoreManager(auth, current.homeBranch?.id ?? input.homeBranchId);

	if (input.expectedUpdatedAt && input.expectedUpdatedAt !== current.updatedAt) {
		throw conflictError();
	}

	const normalized = normalizeCustomerInput(input);
	const homeBranchId = assertCanUseHomeBranch(auth, normalized.homeBranchId ?? current.homeBranch?.id ?? null);

	if (!normalized.name) {
		throw validationError('Nama customer wajib diisi.', {
			name: ['Nama customer wajib diisi.']
		});
	}

	if (!normalized.phone) {
		throw validationError('Nomor WhatsApp wajib diisi.', {
			phone: ['Nomor WhatsApp wajib diisi.']
		});
	}

	await assertUniquePhone(client, normalized.phone, customerId);

	const { error } = await client
		.from('customers')
		.update({
			home_branch_id: homeBranchId,
			name: normalized.name,
			phone: normalized.phone,
			email: normalized.email,
			customer_type: normalized.customerType,
			address: normalized.address,
			district: normalized.district,
			city: normalized.city,
			landmark: normalized.landmark,
			status: normalized.status,
			notes: normalized.notes
		})
		.eq('id', customerId);

	if (error) {
		if (error.code === '23505') {
			throw customerPhoneExistsError();
		}

		throw error;
	}

	return getCustomerDetail(client, customerId, auth);
}

export async function toggleCustomerStatus(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	customerId: string,
	status: CustomerStatus
): Promise<CustomerDetail> {
	const current = await getCustomerDetail(client, customerId, auth);
	assertCustomerStoreManager(auth, current.homeBranch?.id ?? null);

	const { error } = await client
		.from('customers')
		.update({ status })
		.eq('id', customerId);

	if (error) {
		throw error;
	}

	return getCustomerDetail(client, customerId, auth);
}
