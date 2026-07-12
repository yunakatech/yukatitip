<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	let { error }: { error: App.Error } = $props();
</script>

<svelte:head>
	<title>Terjadi kesalahan | Yukatitip</title>
</svelte:head>

<main class="error-shell">
	<Card as="section">
		<div class="error-card">
			<p class="error-card__kicker">Kesalahan aplikasi</p>
			<h1 class="error-card__title">Halaman tidak dapat ditampilkan</h1>
			<p class="error-card__status">Status {page.status}</p>

			<Alert tone="danger" title="Pesan error">
				{error.message || 'Terjadi kesalahan yang tidak dapat diproses.'}
			</Alert>

			<div class="error-card__actions">
		<a class="button button-primary" href={resolve('/')}>Ke landing</a>
		<a class="button button-secondary" href={resolve('/login')}>Ke login</a>
	</div>
		</div>
	</Card>
</main>

<style>
	.error-shell {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 1rem;
	}

	.error-card {
		display: grid;
		gap: 1rem;
		width: min(100%, 40rem);
	}

	.error-card__kicker {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-500);
	}

	.error-card__title {
		margin: 0;
		font-size: 1.5rem;
		line-height: 1.2;
		color: var(--ink-950);
	}

	.error-card__status {
		margin: 0;
		color: var(--ink-600);
	}

	.error-card__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}
</style>
