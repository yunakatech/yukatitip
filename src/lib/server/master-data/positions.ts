import type { SupabaseClient } from '@supabase/supabase-js';

import type { AuthContext } from '$lib/types/auth';
import type { Database } from '$lib/supabase/database';

import { assertPositionManager } from './auth';
import { conflictError, duplicateResourceError, notFoundError, validationError } from './errors';
import { normalizeUppercaseCode, normalizeWhitespace, optionalTrimmed, parsePositiveIntegerValue } from './format';
import type { ParsedListQuery } from './query';

type PositionRow = Database['public']['Tables']['positions']['Row'] & {
	is_active: boolean;
	updated_at: string;
};

export interface PositionListItem {
	id: string;
	code: string;
	name: string;
	level: number;
	description: string | null;
	isActive: boolean;
	activeEmployeeCount: number;
	createdAt: string;
	updatedAt: string;
}

export type PositionDetail = PositionListItem;

export interface PositionInput {
	code: string;
	name: string;
	level: number;
	description: string | null;
	isActive: boolean;
	expectedUpdatedAt: string | null;
}

const POSITION_SORT_COLUMNS: Record<string, keyof PositionRow> = {
	code: 'code',
	name: 'name',
	level: 'level',
	createdAt: 'created_at',
	updatedAt: 'updated_at'
};

function normalizePositionSearch(value: string): string {
	return normalizeWhitespace(value).toLowerCase().replace(/[%_,]/g, ' ').slice(0, 120);
}

function buildPosition(position: PositionRow, activeEmployeeCount: number): PositionDetail {
	return {
		id: position.id,
		code: position.code,
		name: position.name,
		level: position.level,
		description: position.description,
		isActive: position.is_active,
		activeEmployeeCount,
		createdAt: position.created_at,
		updatedAt: position.updated_at
	};
}

export function parsePositionInput(formData: FormData): PositionInput {
	const rawLevel = String(formData.get('level') ?? '');
	return {
		code: String(formData.get('code') ?? ''),
		name: String(formData.get('name') ?? ''),
		level: parsePositiveIntegerValue(rawLevel, 'Level jabatan'),
		description: optionalTrimmed(String(formData.get('description') ?? '')),
		isActive: String(formData.get('isActive') ?? 'true') !== 'false',
		expectedUpdatedAt: optionalTrimmed(String(formData.get('expectedUpdatedAt') ?? ''))
	};
}

export async function listPositions(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	query: ParsedListQuery & { status?: string | null }
): Promise<{
	items: PositionListItem[];
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
}> {
	assertPositionManager(auth);

	const page = query.page;
	const pageSize = query.pageSize;
	const offset = (page - 1) * pageSize;
	const sortColumn = POSITION_SORT_COLUMNS[query.sortField] ?? 'created_at';
	const positionsTable = client.from('positions');

	let request = positionsTable
		.select('id, code, name, level, description, is_active, created_at, updated_at', {
			count: 'exact'
		})
		.order(sortColumn, { ascending: query.sortDirection === 'asc' });

	if (query.search) {
		const search = normalizePositionSearch(query.search);
		request = request.or(`code.ilike.%${search}%,name.ilike.%${search}%`);
	}

	if (query.status) {
		request = request.eq('is_active' as never, query.status === 'active');
	}

	const { data, error, count } = await request.range(offset, offset + pageSize - 1);

	if (error || !data) {
		throw error ?? notFoundError();
	}

	const positions = data as unknown as PositionRow[];
	const activeEmployeeCounts = await Promise.all(
		positions.map(async (position) => {
			const { count: activeCount } = await client
				.from('employees')
				.select('id', { count: 'exact', head: true })
				.eq('position_id', position.id)
				.eq('employment_status', 'active');

			return activeCount ?? 0;
		})
	);

	return {
		items: positions.map((position, index) => buildPosition(position, activeEmployeeCounts[index] ?? 0)),
		page,
		pageSize,
		total: count ?? positions.length,
		totalPages: count ? Math.max(1, Math.ceil(count / pageSize)) : 1
	};
}

export async function getPositionDetail(
	client: SupabaseClient<Database>,
	positionId: string,
	auth: AuthContext
): Promise<PositionDetail> {
	assertPositionManager(auth);
	const positionsTable = client.from('positions');

	const { data, error } = await positionsTable
		.select('id, code, name, level, description, is_active, created_at, updated_at')
		.eq('id', positionId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	if (!data) {
		throw notFoundError('Jabatan tidak ditemukan.');
	}

	const position = data as unknown as PositionRow;
	const { count: activeEmployeeCount } = await client
		.from('employees')
		.select('id', { count: 'exact', head: true })
		.eq('position_id', position.id)
		.eq('employment_status', 'active');

	return buildPosition(position, activeEmployeeCount ?? 0);
}

export async function createPosition(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	input: PositionInput
): Promise<PositionDetail> {
	assertPositionManager(auth);

	const code = normalizeUppercaseCode(input.code);
	const name = normalizeWhitespace(input.name);
	const level = input.level;

	if (!code) {
		throw validationError('Kode jabatan wajib diisi.', { code: ['Kode jabatan wajib diisi.'] });
	}

	if (!name) {
		throw validationError('Nama jabatan wajib diisi.', { name: ['Nama jabatan wajib diisi.'] });
	}

	const { data, error } = await client
		.from('positions')
		.insert({
			code,
			name,
			level,
			description: optionalTrimmed(input.description),
			is_active: input.isActive
		} as never)
		.select('id')
		.single();

	if (error) {
		if (error.code === '23505') {
			throw duplicateResourceError('Kode jabatan sudah terdaftar.', {
				code: ['Gunakan kode jabatan yang berbeda.']
			});
		}

		throw error;
	}

	return getPositionDetail(client, data.id, auth);
}

export async function updatePosition(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	positionId: string,
	input: PositionInput
): Promise<PositionDetail> {
	assertPositionManager(auth);

	const current = await getPositionDetail(client, positionId, auth);

	if (input.expectedUpdatedAt && input.expectedUpdatedAt !== current.updatedAt) {
		throw conflictError();
	}

	const code = normalizeUppercaseCode(input.code);
	const name = normalizeWhitespace(input.name);

	if (!code) {
		throw validationError('Kode jabatan wajib diisi.', { code: ['Kode jabatan wajib diisi.'] });
	}

	if (!name) {
		throw validationError('Nama jabatan wajib diisi.', { name: ['Nama jabatan wajib diisi.'] });
	}

	const { error } = await client
		.from('positions')
		.update({
			code,
			name,
			level: input.level,
			description: optionalTrimmed(input.description),
			is_active: input.isActive
		} as never)
		.eq('id', positionId);

	if (error) {
		if (error.code === '23505') {
			throw duplicateResourceError('Kode jabatan sudah terdaftar.', {
				code: ['Gunakan kode jabatan yang berbeda.']
			});
		}

		throw error;
	}

	return getPositionDetail(client, positionId, auth);
}

export async function togglePositionStatus(
	client: SupabaseClient<Database>,
	auth: AuthContext,
	positionId: string,
	isActive: boolean
): Promise<PositionDetail> {
	assertPositionManager(auth);

	const current = await getPositionDetail(client, positionId, auth);

	if (current.activeEmployeeCount > 0 && !isActive) {
		throw validationError('Jabatan masih dipakai karyawan aktif dan tidak dapat dinonaktifkan.');
	}

	const { error } = await client
		.from('positions')
		.update({ is_active: isActive } as never)
		.eq('id', positionId);

	if (error) {
		throw error;
	}

	return getPositionDetail(client, positionId, auth);
}
