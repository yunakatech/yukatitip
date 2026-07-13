import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { MasterDataError } from '$lib/server/master-data/errors';
import {
	addPaymentToOrder,
	getOrderDetail,
	parseOrderPaymentInput,
	parseOrderStatusInput,
	parseVerifyPaymentInput,
	updateOrderStatus,
	verifyOrderPayment
} from '$lib/server/orders/orders';
import { hasUploadedFile, uploadPaymentProofToR2 } from '$lib/server/storage/payment-proof';
import { createSupabaseServiceRoleClient } from '$lib/server/supabase/service';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.auth) {
		throw redirect(303, '/login');
	}

	return {
		order: await getOrderDetail(createSupabaseServiceRoleClient(), locals.auth, params.orderId)
	};
};

export const actions: Actions = {
	status: async (event) => {
		const auth = event.locals.auth;

		if (!auth) {
			throw redirect(303, '/login');
		}

		const serviceClient = createSupabaseServiceRoleClient();
		const input = parseOrderStatusInput(await event.request.formData());

		try {
			await updateOrderStatus(serviceClient, auth, event.params.orderId, input, {
				requestId: event.locals.requestId,
				ipAddress: event.getClientAddress(),
				userAgent: event.request.headers.get('user-agent')
			});

			throw redirect(303, `/app/orders/${event.params.orderId}`);
		} catch (error) {
			if (error instanceof MasterDataError) {
				return fail(error.status, {
					statusError: error.message,
					statusValues: input
				});
			}

			throw error;
		}
	},
	payment: async (event) => {
		const auth = event.locals.auth;

		if (!auth) {
			throw redirect(303, '/login');
		}

		const serviceClient = createSupabaseServiceRoleClient();
		const formData = await event.request.formData();
		const input = parseOrderPaymentInput(formData);

		try {
			const attachment = formData.get('attachment');
			const paymentProof = attachment instanceof File ? attachment : null;

			if (hasUploadedFile(paymentProof)) {
				const order = await getOrderDetail(serviceClient, auth, event.params.orderId);
				input.attachment = await uploadPaymentProofToR2({
					bucket: event.platform?.env.YUKATITIP_PRIVATE_BUCKET,
					file: paymentProof,
					trackingNumber: order.trackingNumber,
					uploadedBy: auth.profile.id
				});
			}

			await addPaymentToOrder(serviceClient, auth, event.params.orderId, input, {
				requestId: event.locals.requestId,
				ipAddress: event.getClientAddress(),
				userAgent: event.request.headers.get('user-agent')
			});

			throw redirect(303, `/app/orders/${event.params.orderId}`);
		} catch (error) {
			if (error instanceof MasterDataError) {
				return fail(error.status, {
					paymentError: error.message,
					paymentValues: input
				});
			}

			throw error;
		}
	},
	verifyPayment: async (event) => {
		const auth = event.locals.auth;

		if (!auth) {
			throw redirect(303, '/login');
		}

		const serviceClient = createSupabaseServiceRoleClient();
		const formData = await event.request.formData();
		const paymentId = String(formData.get('paymentId') ?? '');
		const input = parseVerifyPaymentInput(formData);

		try {
			await verifyOrderPayment(serviceClient, auth, paymentId, input, {
				requestId: event.locals.requestId,
				ipAddress: event.getClientAddress(),
				userAgent: event.request.headers.get('user-agent')
			});

			throw redirect(303, `/app/orders/${event.params.orderId}`);
		} catch (error) {
			if (error instanceof MasterDataError) {
				return fail(error.status, {
					paymentError: error.message
				});
			}

			throw error;
		}
	}
};
