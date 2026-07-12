<script lang="ts">
	import type { PageData } from './$types';

	import Alert from '$lib/components/ui/Alert.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import LoadingState from '$lib/components/ui/LoadingState.svelte';
	import PageHeader from '$lib/components/app-shell/PageHeader.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Dashboard Yukatitip</title>
</svelte:head>

<section class="dashboard-shell">
	<PageHeader
		eyebrow="Ringkasan"
		title="Dashboard"
		description="Ruang kerja awal untuk melihat status akses, cabang aktif, dan area yang akan diisi pada milestone berikutnya."
	/>

	<div class="dashboard-grid">
		<Card as="section">
			<div class="dashboard-card">
				<p class="dashboard-card__kicker">Akses aktif</p>
				<h3 class="dashboard-card__title">{data.profile.fullName}</h3>
				<p class="dashboard-card__text">{data.profile.role.name}</p>
				<div class="dashboard-card__badges">
					<Badge tone="brand">Profil aktif</Badge>
					<Badge tone="neutral">{data.profile.branch?.name ?? 'Seluruh cabang'}</Badge>
				</div>
			</div>
		</Card>

		<Card as="section">
			<div class="dashboard-card">
				<p class="dashboard-card__kicker">Akses data</p>
				<h3 class="dashboard-card__title">{data.profile.permissions.length} permission</h3>
				<p class="dashboard-card__text">Menu yang tampil mengikuti role dan permission aktif.</p>
				<div class="dashboard-card__badges">
					{#each data.profile.permissions.slice(0, 3) as permission (permission.code)}
						<Badge tone="brand">{permission.code}</Badge>
					{/each}
				</div>
			</div>
		</Card>

		<Card as="section">
			<div class="dashboard-card dashboard-card--loading">
				<LoadingState label="Menyiapkan ringkasan operasional..." lines={3} />
			</div>
		</Card>
	</div>

	<Card as="section">
		<Alert tone="info" title="Fondasi shell siap">
			Header, sidebar, drawer mobile, login, logout, dan route placeholder internal sudah
			terhubung. Data bisnis akan masuk pada milestone berikutnya tanpa mengubah shell ini.
		</Alert>
	</Card>
</section>

<style>
	.dashboard-shell {
		display: grid;
		gap: 1rem;
	}

	.dashboard-grid {
		display: grid;
		gap: 1rem;
	}

	.dashboard-card {
		display: grid;
	}

	.dashboard-card__kicker {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-500);
	}

	.dashboard-card__title {
		margin: 0;
		font-size: 1.25rem;
		line-height: 1.25;
		color: var(--ink-950);
	}

	.dashboard-card__text {
		margin: 0;
		line-height: 1.65;
		color: var(--ink-600);
	}

	.dashboard-card__badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.dashboard-card--loading {
		align-items: start;
	}

	@media (min-width: 1024px) {
		.dashboard-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			align-items: stretch;
		}
	}
</style>
