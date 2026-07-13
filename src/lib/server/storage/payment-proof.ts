import { getAppConfig } from '$lib/server/config/env';
import {
	fileTooLargeError,
	fileTypeNotAllowedError,
	storageUnavailableError
} from '$lib/server/master-data/errors';

export interface UploadedPaymentProof {
	objectKey: string;
	originalFilename: string;
	mimeType: string;
	sizeBytes: number;
}

const EXTENSION_BY_MIME: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'application/pdf': 'pdf'
};

function sanitizeFilename(filename: string): string {
	const cleaned = filename
		.normalize('NFKD')
		.replace(/[^\w.\- ]+/g, '')
		.trim()
		.slice(0, 120);

	return cleaned || 'bukti-pembayaran';
}

function buildObjectKey(trackingNumber: string, mimeType: string): string {
	const now = new Date();
	const year = String(now.getUTCFullYear());
	const month = String(now.getUTCMonth() + 1).padStart(2, '0');
	const extension = EXTENSION_BY_MIME[mimeType] ?? 'bin';

	return `orders/${year}/${month}/${trackingNumber}/payment/${crypto.randomUUID()}.${extension}`;
}

export function hasUploadedFile(file: File | null | undefined): file is File {
	return Boolean(file && file.size > 0);
}

export async function uploadPaymentProofToR2(args: {
	bucket: R2Bucket | null | undefined;
	file: File;
	trackingNumber: string;
	uploadedBy: string;
}): Promise<UploadedPaymentProof> {
	const config = getAppConfig();
	const allowedMimeTypes = new Set([
		...config.uploads.allowedImageMimeTypes,
		...config.uploads.allowedDocumentMimeTypes
	]);

	if (!allowedMimeTypes.has(args.file.type)) {
		throw fileTypeNotAllowedError('Bukti pembayaran harus berupa gambar atau PDF yang diizinkan.');
	}

	if (args.file.size > config.uploads.maxUploadSizeBytes) {
		throw fileTooLargeError(
			`Ukuran bukti pembayaran maksimal ${Math.floor(config.uploads.maxUploadSizeBytes / 1024 / 1024)} MB.`
		);
	}

	if (!args.bucket) {
		throw storageUnavailableError('Binding R2 private belum tersedia untuk menyimpan bukti pembayaran.');
	}

	const objectKey = buildObjectKey(args.trackingNumber, args.file.type);
	const originalFilename = sanitizeFilename(args.file.name);

	await args.bucket.put(objectKey, args.file.stream(), {
		httpMetadata: {
			contentType: args.file.type
		},
		customMetadata: {
			entityType: 'payment',
			uploadedBy: args.uploadedBy,
			originalFilename
		}
	});

	return {
		objectKey,
		originalFilename,
		mimeType: args.file.type,
		sizeBytes: args.file.size
	};
}
