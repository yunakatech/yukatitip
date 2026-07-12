<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	import Alert from '$lib/components/ui/Alert.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { sanitizeRedirectPath } from '$lib/utils/redirect';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let isSubmitting = $state(false);

	const next = $derived(sanitizeRedirectPath(data.next, '/app/dashboard'));
</script>

<svelte:head>
	<title>Login Yukatitip</title>
	<meta name="description" content="Masuk ke aplikasi internal Yukatitip." />
</svelte:head>

<main class="auth-shell">
	<section class="auth-grid">
		<div class="auth-hero">
			<Badge tone="brand">Akses internal</Badge>
			<h1 class="headline auth-hero__title">Masuk ke Yukatitip</h1>
			<p class="lede">
				Gunakan akun internal yang aktif untuk membuka dashboard, navigasi operasional, dan
				akses cabang sesuai role.
			</p>
			<ul class="auth-hero__list">
				<li>Session diverifikasi di server.</li>
				<li>Akun nonaktif langsung ditolak.</li>
				<li>Redirect tetap dibatasi ke path internal.</li>
			</ul>
		</div>

		<Card as="section">
			<form
				class="auth-form"
				method="POST"
				use:enhance={() => {
					isSubmitting = true;

					return async ({ update }) => {
						try {
							await update();
						} finally {
							isSubmitting = false;
						}
					};
				}}
			>
				<input type="hidden" name="next" value={next} />

				{#if form?.error}
					<Alert tone="danger" title="Login gagal">
						{form.error}
					</Alert>
				{/if}

				<div class="auth-stack">
					<Input
						label="Email"
						type="email"
						name="email"
						autocomplete="email"
						placeholder="nama@yukatitip.id"
						value={form?.email ?? ''}
						error={form?.fieldErrors?.email}
						required
					/>

					<Input
						label="Password"
						type="password"
						name="password"
						autocomplete="current-password"
						placeholder="********"
						error={form?.fieldErrors?.password}
						required
					/>

					<p class="auth-note">
						Lupa akses? Hubungi kepala cabang atau owner untuk aktivasi akun.
					</p>

					<Button type="submit" fullWidth busy={isSubmitting}>
						Masuk
					</Button>
				</div>
			</form>
		</Card>
	</section>
</main>

<style>
	.auth-hero {
		display: grid;
		gap: 1rem;
		align-content: start;
		padding-top: 1rem;
	}

	.auth-hero__title {
		margin-top: 0;
		max-width: 12ch;
	}

	.auth-hero__list {
		margin: 0;
		padding: 0 0 0 1rem;
		display: grid;
		gap: 0.5rem;
		color: var(--ink-600);
		line-height: 1.6;
	}

	.auth-form {
		display: grid;
		gap: 1rem;
	}

	.auth-stack {
		display: grid;
		gap: 1rem;
	}

	.auth-note {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.6;
		color: var(--ink-500);
	}
</style>
