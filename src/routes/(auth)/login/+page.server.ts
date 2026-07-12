import { fail, redirect } from '@sveltejs/kit';

import { clearSupabaseSessionCookies } from '$lib/server/auth/cookies';
import { isTrustedMutationOrigin } from '$lib/server/auth/origin';
import { allowLoginAttempt } from '$lib/server/auth/login-rate-limit';
import { getAppConfig } from '$lib/server/config/env';
import { buildAuthContext, type ProfileWithRelations } from '$lib/server/auth/session';
import { DEFAULT_LOGIN_REDIRECT, sanitizeRedirectPath } from '$lib/utils/redirect';
import type { PageServerLoad } from './$types';

type LoginFieldErrors = {
	email?: string;
	password?: string;
};

function failLogin(
	status: number,
	email: string,
	next: string,
	error: string,
	fieldErrors: LoginFieldErrors = {}
) {
	return fail(status, {
		email,
		next,
		error,
		fieldErrors
	});
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const next = sanitizeRedirectPath(url.searchParams.get('next'), DEFAULT_LOGIN_REDIRECT);

	if (locals.auth) {
		throw redirect(303, next);
	}

	return {
		next
	};
};

export const actions = {
	default: async (event) => {
		const { request, locals, url } = event;
		const config = getAppConfig();
		const origin = request.headers.get('origin');
		const next = sanitizeRedirectPath(url.searchParams.get('next'), DEFAULT_LOGIN_REDIRECT);
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '').trim().toLowerCase();
		const password = String(formData.get('password') ?? '');

		if (!isTrustedMutationOrigin(origin, url.origin, config)) {
			return failLogin(
				403,
				email,
				next,
				'Asal permintaan tidak valid. Muat ulang halaman lalu coba lagi.'
			);
		}

		if (!(await allowLoginAttempt(event, email, config))) {
			return failLogin(429, email, next, 'Terlalu banyak percobaan masuk. Coba lagi sebentar.');
		}

		if (!email || !password) {
			return failLogin(400, email, next, 'Email dan password wajib diisi.', {
				email: email ? undefined : 'Email wajib diisi.',
				password: password ? undefined : 'Password wajib diisi.'
			});
		}

		const { error: signInError } = await locals.supabase.auth.signInWithPassword({
			email,
			password
		});

		if (signInError) {
			return failLogin(401, email, next, 'Email atau password salah, atau akun belum aktif.');
		}

		const { data: activeUser } = await locals.supabase.auth.getUser();

		if (!activeUser.user) {
			clearSupabaseSessionCookies(event);
			return failLogin(403, email, next, 'Akun tidak dapat digunakan. Hubungi admin cabang.');
		}

		const { data: profileData, error: profileError } = await locals.supabase
			.from('profiles')
			.select(
				'id, full_name, phone, status, role_id, branch_id, role:roles(id, code, name), branch:branches(id, code, name, is_active)'
			)
			.eq('id', activeUser.user.id)
			.maybeSingle();
		const profile = profileData as ProfileWithRelations | null;
		const authContext = profile ? buildAuthContext(activeUser.user, profile) : null;

		if (profileError || !profile || !authContext) {
			await locals.supabase.auth.signOut();
			clearSupabaseSessionCookies(event);
			return failLogin(403, email, next, 'Akun tidak dapat digunakan. Hubungi admin cabang.');
		}

		throw redirect(303, next);
	}
};
