export type FieldErrors = Record<string, string[]>;

export type MasterDataErrorCode =
	| 'AUTH_REQUIRED'
	| 'VALIDATION_ERROR'
	| 'FORBIDDEN'
	| 'RESOURCE_NOT_FOUND'
	| 'RESOURCE_LOCKED'
	| 'CONFLICTING_UPDATE'
	| 'DUPLICATE_RESOURCE'
	| 'CUSTOMER_PHONE_EXISTS'
	| 'BRANCH_ACCESS_DENIED'
	| 'ACCOUNT_INACTIVE'
	| 'ORDER_ROUTE_MISMATCH'
	| 'INVALID_STATUS_TRANSITION'
	| 'PAYMENT_AMOUNT_INVALID'
	| 'FILE_TYPE_NOT_ALLOWED'
	| 'FILE_TOO_LARGE'
	| 'STORAGE_UNAVAILABLE';

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

export function orderRouteMismatchError(): MasterDataError {
	return new MasterDataError(
		'ORDER_ROUTE_MISMATCH',
		422,
		'Arah pesanan tidak sesuai dengan rute yang dipilih.',
		{
			routeId: ['Pilih rute yang sesuai dengan cabang asal dan tujuan.']
		}
	);
}

export function invalidStatusTransitionError(
	message = 'Perubahan status pesanan tidak diperbolehkan.'
): MasterDataError {
	return new MasterDataError('INVALID_STATUS_TRANSITION', 409, message);
}

export function paymentAmountInvalidError(message = 'Nominal pembayaran tidak valid.'): MasterDataError {
	return new MasterDataError('PAYMENT_AMOUNT_INVALID', 422, message, {
		amount: [message]
	});
}

export function fileTypeNotAllowedError(message = 'Tipe file tidak didukung.'): MasterDataError {
	return new MasterDataError('FILE_TYPE_NOT_ALLOWED', 422, message, {
		attachment: [message]
	});
}

export function fileTooLargeError(message = 'Ukuran file melebihi batas.'): MasterDataError {
	return new MasterDataError('FILE_TOO_LARGE', 422, message, {
		attachment: [message]
	});
}

export function storageUnavailableError(message = 'Storage file belum tersedia.'): MasterDataError {
	return new MasterDataError('STORAGE_UNAVAILABLE', 503, message);
}
