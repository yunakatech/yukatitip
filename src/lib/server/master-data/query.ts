import { branchAccessDeniedError, validationError } from './errors';
import { compactSearch } from './format';
import type { AuthContext } from '$lib/types/auth';

export interface ParsedListQuery {
	page: number;
	pageSize: number;
	search: string;
	branchId: string | null;
	status: string | null;
	sortField: string;
	sortDirection: 'asc' | 'desc';
}

function parseNumber(value: string | null, fallback: number): number {
	if (value === null || value.trim() === '') {
		return fallback;
	}

	const parsed = Number(value);

	if (!Number.isInteger(parsed) || parsed <= 0) {
		throw validationError('Parameter pagination tidak valid.');
	}

	return parsed;
}

export function parseListQuery(
	url: URL,
	options: {
		defaultPageSize: number;
		maxPageSize: number;
		defaultSortField: string;
		allowedSortFields: readonly string[];
		allowedStatuses?: readonly string[];
	}
): ParsedListQuery {
	const page = parseNumber(url.searchParams.get('page'), 1);
	const requestedPageSize = parseNumber(url.searchParams.get('pageSize'), options.defaultPageSize);
	const pageSize = Math.min(requestedPageSize, options.maxPageSize);
	const rawSearch = url.searchParams.get('search') ?? '';
	const search = compactSearch(rawSearch).slice(0, 120);
	const rawBranchId = url.searchParams.get('branchId');
	const branchId = rawBranchId && rawBranchId.trim() ? rawBranchId.trim() : null;
	const rawStatus = url.searchParams.get('status');
	const status = rawStatus && rawStatus.trim() ? rawStatus.trim() : null;
	const rawSort = url.searchParams.get('sort') ?? options.defaultSortField;
	const sortDirection = rawSort.startsWith('-') ? 'desc' : 'asc';
	const sortField = rawSort.replace(/^-/, '');

	if (!options.allowedSortFields.includes(sortField)) {
		throw validationError('Field sorting tidak valid.');
	}

	if (status && options.allowedStatuses && !options.allowedStatuses.includes(status)) {
		throw validationError('Status filter tidak valid.');
	}

	return {
		page,
		pageSize,
		search,
		branchId,
		status,
		sortField,
		sortDirection
	};
}

export function resolveBranchScope(auth: AuthContext, branchId: string | null): string | null {
	if (auth.role.code === 'owner') {
		return branchId ? branchId : null;
	}

	if (!auth.branch) {
		throw branchAccessDeniedError();
	}

	if (branchId && branchId !== auth.branch.id) {
		throw branchAccessDeniedError();
	}

	return auth.branch.id;
}

export function resolveOwnedBranchId(auth: AuthContext): string {
	if (!auth.branch) {
		throw branchAccessDeniedError();
	}

	return auth.branch.id;
}
