export type FieldErrors = Record<string, string[]>;

export type MasterDataErrorCode =
	| 'VALIDATION_ERROR'
	| 'FORBIDDEN'
	| 'RESOURCE_NOT_FOUND'
	| 'RESOURCE_LOCKED'
	| 'CONFLICTING_UPDATE'
	| 'DUPLICATE_RESOURCE'
	| 'CUSTOMER_PHONE_EXISTS'
	| 'BRANCH_ACCESS_DENIED'
	| 'ACCOUNT_INACTIVE';

export class MasterDataError extends Error {
	readonly code: MasterDataErrorCode;
	readonly status: number;
	readonly fieldErrors: FieldErrors;

	constructor(
		code: MasterDataErrorCode,
		status: number,
		message: string,
		fieldErrors: FieldErrors = {}
	) {
		super(message);
		this.code = code;
		this.status = status;
		this.fieldErrors = fieldErrors;
	}
}

export function validationError(message: string, fieldErrors: FieldErrors = {}): MasterDataError {
	return new MasterDataError('VALIDATION_ERROR', 422, message, fieldErrors);
}

export function forbiddenError(message = 'Anda tidak memiliki akses ke aksi ini.'): MasterDataError {
	return new MasterDataError('FORBIDDEN', 403, message);
}

export function notFoundError(message = 'Data tidak ditemukan.'): MasterDataError {
	return new MasterDataError('RESOURCE_NOT_FOUND', 404, message);
}

export function resourceLockedError(message = 'Data terkunci dan tidak dapat diubah.'): MasterDataError {
	return new MasterDataError('RESOURCE_LOCKED', 409, message);
}

export function conflictError(
	message = 'Data telah berubah. Muat ulang halaman sebelum menyimpan kembali.'
): MasterDataError {
	return new MasterDataError('CONFLICTING_UPDATE', 409, message);
}

export function duplicateResourceError(
	message = 'Data dengan nilai tersebut sudah ada.',
	fieldErrors: FieldErrors = {}
): MasterDataError {
	return new MasterDataError('DUPLICATE_RESOURCE', 409, message, fieldErrors);
}

export function customerPhoneExistsError(): MasterDataError {
	return new MasterDataError(
		'CUSTOMER_PHONE_EXISTS',
		409,
		'Customer dengan nomor WhatsApp tersebut sudah tersedia.',
		{
			phone: ['Gunakan data customer yang sudah ada.']
		}
	);
}

export function branchAccessDeniedError(message = 'Cabang tidak dapat diakses.'): MasterDataError {
	return new MasterDataError('BRANCH_ACCESS_DENIED', 403, message);
}
