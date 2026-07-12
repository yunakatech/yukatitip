export function normalizeWhitespace(value: string): string {
	return value.trim().replace(/\s+/g, ' ');
}

export function normalizeUppercaseCode(value: string): string {
	return normalizeWhitespace(value).toUpperCase();
}

export function normalizeEmail(value: string): string {
	return normalizeWhitespace(value).toLowerCase();
}

export function normalizePhone(value: string): string {
	const digits = normalizeWhitespace(value).replace(/[^\d+]/g, '').replace(/^\+/, '');

	if (!digits) {
		return '';
	}

	if (digits.startsWith('62')) {
		return digits;
	}

	if (digits.startsWith('0')) {
		return `62${digits.slice(1)}`;
	}

	if (digits.startsWith('8')) {
		return `62${digits}`;
	}

	return digits;
}

export function compactSearch(value: string): string {
	return normalizeWhitespace(value).toLowerCase();
}

export function parseIntegerValue(value: string, fieldName: string): number {
	if (!value) {
		throw new Error(`${fieldName} wajib diisi.`);
	}

	const normalized = normalizeWhitespace(value).replace(/[,_\s]/g, '');
	const parsed = Number(normalized);

	if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
		throw new Error(`${fieldName} harus berupa bilangan bulat.`);
	}

	return parsed;
}

export function parsePositiveIntegerValue(value: string, fieldName: string): number {
	const parsed = parseIntegerValue(value, fieldName);

	if (parsed <= 0) {
		throw new Error(`${fieldName} harus lebih dari 0.`);
	}

	return parsed;
}

export function parseBooleanValue(value: string | null | undefined, fieldName: string): boolean {
	if (value === undefined || value === null || value === '') {
		throw new Error(`${fieldName} wajib diisi.`);
	}

	if (value === 'true' || value === '1' || value === 'on') {
		return true;
	}

	if (value === 'false' || value === '0') {
		return false;
	}

	throw new Error(`${fieldName} harus bernilai true atau false.`);
}

export function parseDateValue(value: string, fieldName: string): string {
	const normalized = normalizeWhitespace(value);

	if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
		throw new Error(`${fieldName} harus berformat YYYY-MM-DD.`);
	}

	const date = new Date(`${normalized}T00:00:00Z`);

	if (Number.isNaN(date.getTime())) {
		throw new Error(`${fieldName} harus tanggal yang valid.`);
	}

	return normalized;
}

export function parseTimeValue(value: string, fieldName: string): string {
	const normalized = normalizeWhitespace(value);

	if (!/^\d{2}:\d{2}(:\d{2})?$/.test(normalized)) {
		throw new Error(`${fieldName} harus berformat HH:MM.`);
	}

	return normalized.length === 5 ? `${normalized}:00` : normalized;
}

export function parseUuidValue(value: string, fieldName: string): string {
	const normalized = normalizeWhitespace(value);

	if (
		!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalized)
	) {
		throw new Error(`${fieldName} harus berupa UUID yang valid.`);
	}

	return normalized;
}

export function optionalTrimmed(value: string | null | undefined): string | null {
	if (value === null || value === undefined) {
		return null;
	}

	const trimmed = normalizeWhitespace(value);
	return trimmed ? trimmed : null;
}
