import type { SupabaseClient } from '@supabase/supabase-js';

import { ROLE_CODES } from '$lib/constants/access';
import type { AuthContext } from '$lib/types/auth';
import type { Database } from '$lib/supabase/database';

import { assertRouteManager, assertViewBranchScopedData } from './auth';
import {
	branchAccessDeniedError,
	conflictError,
	duplicateResourceError,
	notFoundError,
	validationError
} from './errors';
import {
	compactSearch,
	normalizeWhitespace,
	optionalTrimmed,
	parseDateValue,
	parseIntegerValue,
	parsePositiveIntegerValue,
	parseTimeValue,
	parseUuidValue
} from './format';
import type { ParsedListQuery } from './query';
import { resolveBranchScope } from './query';
import { ROUTE_DAY_LABELS, ROUTE_SERVICE_LABELS } from '$lib/constants/routes';

type RouteRow = Database['public']['Tables']['routes']['Row'];
type BranchRow = Database['public']['Tables']['branches']['Row'];
type RouteScheduleRow = Database['public']['Tables']['route_schedules']['Row'];
type RouteTariffRow = Database['public']['Tables']['route_tariffs']['Row'];

export interface RouteListItem {
	id: string;
	name: string;
	origin: { id: string; code: string; name: string };
	destination: { id: string; code: string; name: string };
	estimatedDurationMinutes: number | null;
	baseFee: number;
	isActive: boolean;
	scheduleCount: number;
	tariffCount: number;
	activeTariffCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface RouteScheduleItem {
	id: string;
	dayOfWeek: number;
	departureTime: string;
	isActive: boolean;
	notes: string | null;
	createdAt: string;
}

export interface RouteTariffItem {
	id: string;
	serviceType: Database['public']['Enums']['service_type'];
	minimumServiceFee: number;
	percentageFee: number;
	localDeliveryFee: number;
	handlingFee: number;
	effectiveFrom: string;
	effectiveUntil: string | null;
	isActive: boolean;
	createdAt: string;
}

export interface RouteDetail extends RouteListItem {
	schedules: RouteScheduleItem[];
	tariffs: RouteTariffItem[];
}

export interface RouteInput {
	originBranchId: string;
	destinationBranchId: string;
	name: string;
	estimatedDurationMinutes: number | null;
	baseFee: number;
	isActive: boolean;
	expectedUpdatedAt: string | null;
}

export interface RouteScheduleInput {
	dayOfWeek: number;
	departureTime: string;
	notes: string | null;
	isActive: boolean;
	expectedUpdatedAt: string | null;
}

export interface RouteTariffInput {
	serviceType: Database['public']['Enums']['service_type'];
	minimumServiceFee: number;
	percentageFee: number;
	localDeliveryFee: number;
	handlingFee: number;
	effectiveFrom: string;
	effectiveUntil: string | null;
	isActive: boolean;
	expectedUpdatedAt: string | null;
}

const ROUTE_SORT_COLUMNS: Record<string, keyof RouteRow> = {
	name: 'name',
	createdAt: 'created_at',
	updatedAt: 'updated_at'
};

export { ROUTE_DAY_LABELS, ROUTE_SERVICE_LABELS };

function normalizeRouteSearch(value: string): string {
	return compactSearch(value).replace(/[%_,]/g, ' ').slice(0, 120);
}

function buildRouteName(origin: BranchRow, destination: BranchRow): string {
	return `${origin.name} → ${destination.name}`;
}

async function loadBranchesMap(
	client: SupabaseClient<Database>,
	branchIds: string[]
): Promise<Map<string, { id: string; code: string; name: string }>> {
	const uniqueBranchIds = [...new Set(branchIds.filter(Boolean))];

	if (uniqueBranchIds.length === 0) {
		return new Map();
	}

	const { data, error } = await client
		.from('branches')
		.select('id, code, name, is_active')
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

function ensureBranchForRoute(
	branch: BranchRow | null,
	fieldName: 'originBranchId' | 'destinationBranchId',
	label: string
): BranchRow {
	if (!branch) {
		throw validationError(`${label} tidak ditemukan.`, {
			[fieldName]: [`${label} tidak ditemukan.`]
		});
	}

	if (!branch.is_active) {
		throw validationError(`${label} harus aktif.`, {
			[fieldName]: [`${label} harus aktif.`]
		});
	}

	return branch;
}

function assertRouteInputBranches(originBranch: BranchRow, destinationBranch: BranchRow): void {
	if (originBranch.id === destinationBranch.id) {
		throw validationError('Origin dan destination tidak boleh sama.', {
			originBranchId: ['Pilih cabang tujuan yang berbeda.'],
			destinationBranchId: ['Pilih cabang asal yang berbeda.']
		});
	}
}

function normalizeRouteInput(input: RouteInput, originBranch: BranchRow, destinationBranch: BranchRow): RouteInput {
	return {
		...input,
		name: normalizeWhitespace(input.name) || buildRouteName(originBranch, destinationBranch)
	};
}

function parseFieldWithValidation<T>(
	fieldKey: string,
	fieldName: string,
	parser: () => T
): T {
	try {
		return parser();
	} catch (error) {
		const message = error instanceof Error ? error.message : `${fieldName} tidak valid.`;
		throw validationError(message, {
			[fieldKey]: [message]
		});
	}
}

export function parseRouteInput(formData: FormData): RouteInput {
	const estimatedDurationRaw = String(formData.get('estimatedDurationMinutes') ?? '');
	const baseFeeRaw = String(formData.get('baseFee') ?? '0');
	return {
		originBranchId: parseFieldWithValidation('originBranchId', 'Cabang asal', () =>
			parseUuidValue(String(formData.get('originBranchId') ?? ''), 'Cabang asal')
		),
		destinationBranchId: parseFieldWithValidation('destinationBranchId', 'Cabang tujuan', () =>
			parseUuidValue(String(formData.get('destinationBranchId') ?? ''), 'Cabang tujuan')
		),
		name: String(formData.get('name') ?? ''),
		estimatedDurationMinutes: estimatedDurationRaw
			? parseFieldWithValidation('estimatedDurationMinutes', 'Durasi perkiraan', () =>
					parsePositiveIntegerValue(estimatedDurationRaw, 'Durasi perkiraan')
				)
			: null,
		baseFee: parseFieldWithValidation('baseFee', 'Biaya dasar', () =>
			parseIntegerValue(baseFeeRaw, 'Biaya dasar')
		),
		isActive: String(formData.get('isActive') ?? 'true') !== 'false',
		expectedUpdatedAt: optionalTrimmed(String(formData.get('expectedUpdatedAt') ?? ''))
	};
}

function buildRouteListItem(
	route: RouteRow,
	origin: { id: string; code: string; name: string },
	destination: { id: string; code: string; name: string },
	scheduleCount: number,
	tariffCount: number,
	activeTariffCount: number
): RouteListItem {
	return {
		id: route.id,
		name: route.name,
		origin,
		destination,
		estimatedDurationMinutes: route.estimated_duration_minutes,
		baseFee: route.base_fee,
		isActive: route.is_active,
		scheduleCount,
		tariffCount,
		activeTariffCount,
		createdAt: route.created_at,
		updatedAt: route.updated_at
	};
}

async function loadRouteChildren(
	client: SupabaseClient<Database>,
	routeIds: string[]
): Promise<Map<string, { scheduleCount: number; tariffCount: number; activeTariffCount: number }>> {
	if (routeIds.length === 0) {
		return new Map();
	}

	const [schedulesResult, tariffsResult] = await Promise.all([
		client
			.from('route_schedules')
			.select('route_id', { count: 'exact' })
			.in('route_id', routeIds),
		client
			.from('route_tariffs')
			.select('route_id', { count: 'exact' })
			.in('route_id', routeIds)
	]);

	const map = new Map<string, { scheduleCount: number; tariffCount: number; activeTariffCount: number }>();
	for (const routeId of routeIds) {
		map.set(routeId, { scheduleCount: 0, tariffCount: 0, activeTariffCount: 0 });
	}

	if (schedulesResult.count !== null) {
		for (const row of schedulesResult.data ?? []) {
			const current = map.get(row.route_id) ?? {
				scheduleCount: 0,
				tariffCount: 0,
				activeTariffCount: 0
			};
			current.scheduleCount += 1;
			map.set(row.route_id, current);
		}
	}

	if (tariffsResult.count !== null) {
		for (const row of tariffsResult.data ?? []) {
			const current = map.get(row.route_id) ?? {
				scheduleCount: 0,
				tariffCount: 0,
				activeTariffCount: 0
			};
			current.tariffCount += 1;
			if ((row as RouteTariffRow).is_active) {
				current.activeTariffCount += 1;
			}
			map.set(row.route_id, current);
		}
	}

	return map;
}

export async function listRoutes(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	query: ParsedListQuery
): Promise<{
	items: RouteListItem[];
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
}> {
	const page = query.page;
	const pageSize = query.pageSize;
	const offset = (page - 1) * pageSize;
	const sortColumn = ROUTE_SORT_COLUMNS[query.sortField] ?? 'created_at';
	const branchId = resolveBranchScope(auth, query.branchId);
	let request = client
		.from('routes')
		.select('id, origin_branch_id, destination_branch_id, name, estimated_duration_minutes, base_fee, is_active, created_at, updated_at', {
			count: 'exact'
		})
		.order(sortColumn, { ascending: query.sortDirection === 'asc' });

	if (query.search) {
		const search = normalizeRouteSearch(query.search);
		request = request.or(`name.ilike.%${search}%`);
	}

	if (branchId) {
		request = request.or(`origin_branch_id.eq.${branchId},destination_branch_id.eq.${branchId}`);
	}

	if (query.status) {
		request = request.eq('is_active', query.status === 'active');
	}

	const { data, error, count } = await request.range(offset, offset + pageSize - 1);

	if (error || !data) {
		throw error ?? notFoundError();
	}

	const routes = data as RouteRow[];
	const branchMap = await loadBranchesMap(
		client,
		routes.flatMap((route) => [route.origin_branch_id, route.destination_branch_id])
	);
	const childMap = await loadRouteChildren(client, routes.map((route) => route.id));

	const items = routes.map((route) => {
		const counts = childMap.get(route.id) ?? {
			scheduleCount: 0,
			tariffCount: 0,
			activeTariffCount: 0
		};
		return buildRouteListItem(
			route,
			branchMap.get(route.origin_branch_id) ?? { id: route.origin_branch_id, code: '', name: 'Cabang asal' },
			branchMap.get(route.destination_branch_id) ?? { id: route.destination_branch_id, code: '', name: 'Cabang tujuan' },
			counts.scheduleCount,
			counts.tariffCount,
			counts.activeTariffCount
		);
	});

	return {
		items,
		page,
		pageSize,
		total: count ?? items.length,
		totalPages: count ? Math.max(1, Math.ceil(count / pageSize)) : 1
	};
}

export async function getRouteDetail(
	client: SupabaseClient<Database>,
	routeId: string,
	auth: AuthContext
): Promise<RouteDetail> {
	const { data, error } = await client
		.from('routes')
		.select('id, origin_branch_id, destination_branch_id, name, estimated_duration_minutes, base_fee, is_active, created_at, updated_at')
		.eq('id', routeId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	if (!data) {
		throw notFoundError('Rute tidak ditemukan.');
	}

	const route = data as RouteRow;
	const branchId = assertViewBranchScopedData(auth, route.origin_branch_id, [
		ROLE_CODES.BRANCH_MANAGER,
		ROLE_CODES.BRANCH_ADMIN
	]);

	if (auth.role.code !== ROLE_CODES.OWNER && branchId !== route.origin_branch_id && branchId !== route.destination_branch_id) {
		throw branchAccessDeniedError();
	}

	const branchMap = await loadBranchesMap(client, [route.origin_branch_id, route.destination_branch_id]);
	const [schedulesResult, tariffsResult] = await Promise.all([
		client
			.from('route_schedules')
			.select('id, route_id, day_of_week, departure_time, is_active, notes, created_at')
			.eq('route_id', route.id)
			.order('day_of_week', { ascending: true })
			.order('departure_time', { ascending: true }),
		client
			.from('route_tariffs')
			.select('id, route_id, service_type, minimum_service_fee, percentage_fee, local_delivery_fee, handling_fee, effective_from, effective_until, is_active, created_at')
			.eq('route_id', route.id)
			.order('effective_from', { ascending: false })
	]);

	return {
		...buildRouteListItem(
			route,
			branchMap.get(route.origin_branch_id) ?? { id: route.origin_branch_id, code: '', name: 'Cabang asal' },
			branchMap.get(route.destination_branch_id) ?? { id: route.destination_branch_id, code: '', name: 'Cabang tujuan' },
			schedulesResult.data?.length ?? 0,
			tariffsResult.data?.length ?? 0,
			(tariffsResult.data ?? []).filter((tariff) => tariff.is_active).length
		),
		schedules:
			(schedulesResult.data ?? []).map((schedule) => ({
				id: schedule.id,
				dayOfWeek: schedule.day_of_week,
				departureTime: schedule.departure_time,
				isActive: schedule.is_active,
				notes: schedule.notes,
				createdAt: schedule.created_at
			})) ?? [],
		tariffs:
			(tariffsResult.data ?? []).map((tariff) => ({
				id: tariff.id,
				serviceType: tariff.service_type,
				minimumServiceFee: tariff.minimum_service_fee,
				percentageFee: Number(tariff.percentage_fee),
				localDeliveryFee: tariff.local_delivery_fee,
				handlingFee: tariff.handling_fee,
				effectiveFrom: tariff.effective_from,
				effectiveUntil: tariff.effective_until,
				isActive: tariff.is_active,
				createdAt: tariff.created_at
			})) ?? []
	};
}

export async function createRoute(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	input: RouteInput
): Promise<RouteDetail> {
	assertRouteManager(auth);

	const originBranch = ensureBranchForRoute(
		(await client.from('branches').select('id, code, name, is_active').eq('id', input.originBranchId).maybeSingle()).data as BranchRow | null,
		'originBranchId',
		'Cabang asal'
	);
	const destinationBranch = ensureBranchForRoute(
		(await client.from('branches').select('id, code, name, is_active').eq('id', input.destinationBranchId).maybeSingle()).data as BranchRow | null,
		'destinationBranchId',
		'Cabang tujuan'
	);
	assertRouteInputBranches(originBranch, destinationBranch);

	const normalized = normalizeRouteInput(input, originBranch, destinationBranch);

	if (!normalized.name) {
		throw validationError('Nama rute wajib diisi.', { name: ['Nama rute wajib diisi.'] });
	}

	const { data, error } = await client
		.from('routes')
		.insert({
			origin_branch_id: originBranch.id,
			destination_branch_id: destinationBranch.id,
			name: normalized.name,
			estimated_duration_minutes: normalized.estimatedDurationMinutes,
			base_fee: normalized.baseFee,
			is_active: normalized.isActive
		})
		.select('id')
		.single();

	if (error) {
		if (error.code === '23505') {
			throw duplicateResourceError('Rute dengan arah tersebut sudah ada.');
		}

		throw error;
	}

	return getRouteDetail(client, data.id, auth);
}

export async function updateRoute(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	routeId: string,
	input: RouteInput
): Promise<RouteDetail> {
	assertRouteManager(auth);

	const current = await getRouteDetail(client, routeId, auth);

	if (input.expectedUpdatedAt && input.expectedUpdatedAt !== current.updatedAt) {
		throw conflictError();
	}

	const originBranch = ensureBranchForRoute(
		(await client.from('branches').select('id, code, name, is_active').eq('id', input.originBranchId).maybeSingle()).data as BranchRow | null,
		'originBranchId',
		'Cabang asal'
	);
	const destinationBranch = ensureBranchForRoute(
		(await client.from('branches').select('id, code, name, is_active').eq('id', input.destinationBranchId).maybeSingle()).data as BranchRow | null,
		'destinationBranchId',
		'Cabang tujuan'
	);
	assertRouteInputBranches(originBranch, destinationBranch);

	const normalized = normalizeRouteInput(input, originBranch, destinationBranch);

	if (!normalized.name) {
		throw validationError('Nama rute wajib diisi.', { name: ['Nama rute wajib diisi.'] });
	}

	const { error } = await client
		.from('routes')
		.update({
			origin_branch_id: originBranch.id,
			destination_branch_id: destinationBranch.id,
			name: normalized.name,
			estimated_duration_minutes: normalized.estimatedDurationMinutes,
			base_fee: normalized.baseFee,
			is_active: normalized.isActive
		})
		.eq('id', routeId);

	if (error) {
		if (error.code === '23505') {
			throw duplicateResourceError('Rute dengan arah tersebut sudah ada.');
		}

		throw error;
	}

	return getRouteDetail(client, routeId, auth);
}

function normalizePercentageValue(value: string, fieldName: string, fieldKey: string): number {
	const normalized = normalizeWhitespace(value).replace(',', '.');

	if (!normalized) {
		throw validationError(`${fieldName} wajib diisi.`, {
			[fieldKey]: [`${fieldName} wajib diisi.`]
		});
	}

	const parsed = Number(normalized);

	if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
		throw validationError(`${fieldName} harus di antara 0 dan 100.`, {
			[fieldKey]: [`${fieldName} harus di antara 0 dan 100.`]
		});
	}

	return Number(parsed.toFixed(2));
}

function assertRouteDayOfWeek(dayOfWeek: number): number {
	if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
		throw validationError('Hari keberangkatan tidak valid.', {
			dayOfWeek: ['Pilih hari keberangkatan yang valid.']
		});
	}

	return dayOfWeek;
}

function parseRouteServiceType(value: string): Database['public']['Enums']['service_type'] {
	if (value === 'purchase' || value === 'pickup' || value === 'delivery') {
		return value;
	}

	throw validationError('Jenis layanan tidak valid.', {
		serviceType: ['Pilih jenis layanan yang tersedia.']
	});
}

async function assertRouteIsActive(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	routeId: string
): Promise<RouteDetail> {
	const route = await getRouteDetail(client, routeId, auth);

	if (!route.isActive) {
		throw validationError('Rute harus aktif terlebih dahulu.', {
			routeId: ['Rute harus aktif terlebih dahulu.']
		});
	}

	return route;
}

async function getRouteScheduleRow(
	client: SupabaseClient<Database>,
	routeId: string,
	scheduleId: string
): Promise<RouteScheduleRow> {
	const { data, error } = await client
		.from('route_schedules')
		.select('id, route_id, day_of_week, departure_time, is_active, notes, created_at')
		.eq('id', scheduleId)
		.eq('route_id', routeId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	if (!data) {
		throw notFoundError('Jadwal rute tidak ditemukan.');
	}

	return data as RouteScheduleRow;
}

async function getRouteTariffRow(
	client: SupabaseClient<Database>,
	routeId: string,
	tariffId: string
): Promise<RouteTariffRow> {
	const { data, error } = await client
		.from('route_tariffs')
		.select('id, route_id, service_type, minimum_service_fee, percentage_fee, local_delivery_fee, handling_fee, effective_from, effective_until, is_active, created_at')
		.eq('id', tariffId)
		.eq('route_id', routeId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	if (!data) {
		throw notFoundError('Tarif rute tidak ditemukan.');
	}

	return data as RouteTariffRow;
}

function assertRouteTariffPeriod(
	tariffs: RouteTariffRow[],
	tariffId: string | null,
	effectiveFrom: string,
	effectiveUntil: string | null
): void {
	const newStart = effectiveFrom;
	const newEnd = effectiveUntil ?? '9999-12-31';

	for (const tariff of tariffs) {
		if (tariffId && tariff.id === tariffId) {
			continue;
		}

		const existingStart = tariff.effective_from;
		const existingEnd = tariff.effective_until ?? '9999-12-31';

		if (newStart <= existingEnd && existingStart <= newEnd) {
			throw validationError('Periode tarif tidak boleh tumpang tindih.', {
				effectiveFrom: ['Sesuaikan periode efektif agar tidak bertabrakan.'],
				effectiveUntil: ['Sesuaikan periode efektif agar tidak bertabrakan.']
			});
		}
	}
}

export function parseRouteScheduleInput(formData: FormData): RouteScheduleInput {
	const rawDayOfWeek = String(formData.get('dayOfWeek') ?? '');

	return {
		dayOfWeek: assertRouteDayOfWeek(
			parseFieldWithValidation('dayOfWeek', 'Hari keberangkatan', () =>
				parseIntegerValue(rawDayOfWeek, 'Hari keberangkatan')
			)
		),
		departureTime: parseFieldWithValidation('departureTime', 'Waktu keberangkatan', () =>
			parseTimeValue(String(formData.get('departureTime') ?? ''), 'Waktu keberangkatan')
		),
		notes: optionalTrimmed(String(formData.get('notes') ?? '')),
		isActive: String(formData.get('isActive') ?? 'true') !== 'false',
		expectedUpdatedAt: optionalTrimmed(String(formData.get('expectedUpdatedAt') ?? ''))
	};
}

export function parseRouteTariffInput(formData: FormData): RouteTariffInput {
	return {
		serviceType: parseRouteServiceType(String(formData.get('serviceType') ?? '')),
		minimumServiceFee: parseFieldWithValidation('minimumServiceFee', 'Biaya minimum layanan', () =>
			parseIntegerValue(String(formData.get('minimumServiceFee') ?? '0'), 'Biaya minimum layanan')
		),
		percentageFee: normalizePercentageValue(String(formData.get('percentageFee') ?? '0'), 'Persentase biaya', 'percentageFee'),
		localDeliveryFee: parseFieldWithValidation('localDeliveryFee', 'Biaya antar lokal', () =>
			parseIntegerValue(String(formData.get('localDeliveryFee') ?? '0'), 'Biaya antar lokal')
		),
		handlingFee: parseFieldWithValidation('handlingFee', 'Biaya penanganan', () =>
			parseIntegerValue(String(formData.get('handlingFee') ?? '0'), 'Biaya penanganan')
		),
		effectiveFrom: parseFieldWithValidation('effectiveFrom', 'Tanggal mulai', () =>
			parseDateValue(String(formData.get('effectiveFrom') ?? ''), 'Tanggal mulai')
		),
		effectiveUntil: optionalTrimmed(String(formData.get('effectiveUntil') ?? '')),
		isActive: String(formData.get('isActive') ?? 'true') !== 'false',
		expectedUpdatedAt: optionalTrimmed(String(formData.get('expectedUpdatedAt') ?? ''))
	};
}

export async function createRouteSchedule(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	routeId: string,
	input: RouteScheduleInput
): Promise<RouteDetail> {
	assertRouteManager(auth);
	await assertRouteIsActive(client, auth, routeId);

	const { error } = await client
		.from('route_schedules')
		.insert({
			route_id: routeId,
			day_of_week: input.dayOfWeek,
			departure_time: input.departureTime,
			is_active: input.isActive,
			notes: input.notes
		})
		.select('id')
		.single();

	if (error) {
		if (error.code === '23505') {
			throw duplicateResourceError('Jadwal rute tersebut sudah ada.');
		}

		throw error;
	}

	return getRouteDetail(client, routeId, auth);
}

export async function updateRouteSchedule(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	routeId: string,
	scheduleId: string,
	input: RouteScheduleInput
): Promise<RouteDetail> {
	assertRouteManager(auth);
	await assertRouteIsActive(client, auth, routeId);
	await getRouteScheduleRow(client, routeId, scheduleId);

	const { error } = await client
		.from('route_schedules')
		.update({
			day_of_week: input.dayOfWeek,
			departure_time: input.departureTime,
			is_active: input.isActive,
			notes: input.notes
		})
		.eq('id', scheduleId)
		.eq('route_id', routeId);

	if (error) {
		if (error.code === '23505') {
			throw duplicateResourceError('Jadwal rute tersebut sudah ada.');
		}

		throw error;
	}

	return getRouteDetail(client, routeId, auth);
}

export async function toggleRouteScheduleStatus(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	routeId: string,
	scheduleId: string,
	isActive: boolean
): Promise<RouteDetail> {
	assertRouteManager(auth);
	await assertRouteIsActive(client, auth, routeId);
	await getRouteScheduleRow(client, routeId, scheduleId);

	const { error } = await client
		.from('route_schedules')
		.update({ is_active: isActive })
		.eq('id', scheduleId)
		.eq('route_id', routeId);

	if (error) {
		throw error;
	}

	return getRouteDetail(client, routeId, auth);
}

export async function createRouteTariff(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	routeId: string,
	input: RouteTariffInput
): Promise<RouteDetail> {
	assertRouteManager(auth);
	await assertRouteIsActive(client, auth, routeId);

	const routeTariffsRequest = client
		.from('route_tariffs')
		.select('id, route_id, service_type, minimum_service_fee, percentage_fee, local_delivery_fee, handling_fee, effective_from, effective_until, is_active, created_at')
		.eq('route_id', routeId)
		.eq('service_type', input.serviceType);

	const { data: routeTariffs, error: tariffsError } = await routeTariffsRequest;

	if (tariffsError) {
		throw tariffsError;
	}

	assertRouteTariffPeriod(routeTariffs ?? [], null, input.effectiveFrom, input.effectiveUntil);

	const { error } = await client
		.from('route_tariffs')
		.insert({
			route_id: routeId,
			service_type: input.serviceType,
			minimum_service_fee: input.minimumServiceFee,
			percentage_fee: input.percentageFee,
			local_delivery_fee: input.localDeliveryFee,
			handling_fee: input.handlingFee,
			effective_from: input.effectiveFrom,
			effective_until: input.effectiveUntil,
			is_active: input.isActive
		})
		.select('id')
		.single();

	if (error) {
		if (error.code === '23505') {
			throw duplicateResourceError('Tarif rute tersebut sudah ada.');
		}

		throw error;
	}

	return getRouteDetail(client, routeId, auth);
}

export async function updateRouteTariff(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	routeId: string,
	tariffId: string,
	input: RouteTariffInput
): Promise<RouteDetail> {
	assertRouteManager(auth);
	await assertRouteIsActive(client, auth, routeId);
	await getRouteTariffRow(client, routeId, tariffId);

	const { data: routeTariffs, error: tariffsError } = await client
		.from('route_tariffs')
		.select('id, route_id, service_type, minimum_service_fee, percentage_fee, local_delivery_fee, handling_fee, effective_from, effective_until, is_active, created_at')
		.eq('route_id', routeId)
		.eq('service_type', input.serviceType);

	if (tariffsError) {
		throw tariffsError;
	}

	assertRouteTariffPeriod(routeTariffs ?? [], tariffId, input.effectiveFrom, input.effectiveUntil);

	const { error } = await client
		.from('route_tariffs')
		.update({
			service_type: input.serviceType,
			minimum_service_fee: input.minimumServiceFee,
			percentage_fee: input.percentageFee,
			local_delivery_fee: input.localDeliveryFee,
			handling_fee: input.handlingFee,
			effective_from: input.effectiveFrom,
			effective_until: input.effectiveUntil,
			is_active: input.isActive
		})
		.eq('id', tariffId)
		.eq('route_id', routeId);

	if (error) {
		if (error.code === '23505') {
			throw duplicateResourceError('Tarif rute tersebut sudah ada.');
		}

		throw error;
	}

	return getRouteDetail(client, routeId, auth);
}

export async function toggleRouteTariffStatus(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	routeId: string,
	tariffId: string,
	isActive: boolean
): Promise<RouteDetail> {
	assertRouteManager(auth);
	await assertRouteIsActive(client, auth, routeId);
	await getRouteTariffRow(client, routeId, tariffId);

	const { error } = await client
		.from('route_tariffs')
		.update({ is_active: isActive })
		.eq('id', tariffId)
		.eq('route_id', routeId);

	if (error) {
		throw error;
	}

	return getRouteDetail(client, routeId, auth);
}
