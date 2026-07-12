<script lang="ts">
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import PageHeader from '$lib/components/app-shell/PageHeader.svelte';
	import Select from '$lib/components/ui/Select.svelte';

	let { data }: { data: PageData } = $props();

	const statusOptions = [
		{ value: '', label: 'Semua status' },
		{ value: 'active', label: 'Aktif' },
		{ value: 'inactive', label: 'Nonaktif' }
	];

	const sortOptions = [
		{ value: 'createdAt', label: 'Terbaru' },
		{ value: '-createdAt', label: 'Terbaru dulu' },
		{ value: 'name', label: 'Nama rute' }
	];

	function buildQuery(page = data.pagination.page): string {
		const params = new SvelteURLSearchParams();

		if (data.filters.search) {
			params.set('search', data.filters.search);
		}

		if (data.filters.status) {
			params.set('status', data.filters.status);
		}

		if (data.filters.branchId) {
			params.set('branchId', data.filters.branchId);
		}

		if (data.filters.sort) {
			params.set('sort', data.filters.sort);
		}

		params.set('page', String(page));
		params.set('pageSize', String(data.pagination.pageSize));

		return params.toString();
	}

	const hasFilters = $derived(
		Boolean(data.filters.search || data.filters.status || data.filters.branchId || data.filters.sort !== 'createdAt')
	);

	const pageTitle = $derived(data.canCreate ? 'Rute' : 'Rute Cabang');
</script>

<svelte:head>
	<title>{pageTitle} | Yukatitip</title>
</svelte:head>

<section class="master-data-page">
	<PageHeader
		eyebrow="Data"
		title={pageTitle}
		description="Kelola arah perjalanan antar cabang, jadwal aktif, dan tarif operasional yang dipakai modul lain."
	/>

	{#if data.canCreate}
		<div class="master-data-page__actions">
			<a class="button button-primary" href={resolve('/app/routes/new')}>Rute baru</a>
		</div>
	{/if}

	<Card as="section">
		<form class="master-toolbar" method="GET">
			<div class="master-toolbar__search">
				<Input
					label="Cari rute"
					name="search"
					value={data.filters.search}
					placeholder="Nama rute atau cabang"
				/>
			</div>
			<div class="master-toolbar__filter">
				<Select label="Status" name="status" value={data.filters.status ?? ''}>
					{#each statusOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</Select>
			</div>
			{#if data.branchOptions.length > 0}
				<div class="master-toolbar__filter">
					<Select label="Cabang" name="branchId" value={data.filters.branchId ?? ''}>
						<option value="">Semua cabang</option>
						{#each data.branchOptions as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</Select>
				</div>
			{/if}
			<div class="master-toolbar__filter">
				<Select label="Urutkan" name="sort" value={data.filters.sort}>
					{#each sortOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</Select>
			</div>
			<div class="master-toolbar__submit">
				<Button type="submit">Terapkan</Button>
			</div>
		</form>
	</Card>

	{#if data.routes.length === 0}
		{#if hasFilters}
			<EmptyState
				title="Tidak ada route yang cocok"
				description="Coba ubah filter atau kata kunci untuk menampilkan route lainnya."
			/>
		{:else}
			<EmptyState
				title="Belum ada route"
				description="Tambahkan route pertama agar jadwal dan tarif bisa diatur untuk operasional."
			>
				{#if data.canCreate}
					<a class="button button-primary" href={resolve('/app/routes/new')}>Rute baru</a>
				{/if}
			</EmptyState>
		{/if}
	{:else}
		<Card as="section" padding="sm">
			<div class="master-list master-list--desktop">
				<table class="master-table">
					<caption class="sr-only">Daftar route Yukatitip</caption>
					<thead>
						<tr>
							<th>Rute</th>
							<th>Origin</th>
							<th>Destination</th>
							<th>Jadwal</th>
							<th>Tarif aktif</th>
							<th>Status</th>
							<th class="master-table__action">Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each data.routes as route (route.id)}
							<tr>
								<td>
									<div class="master-table__primary">
										<strong>{route.name}</strong>
										<span>{route.estimatedDurationMinutes ?? 'Durasi belum diisi'} menit</span>
									</div>
								</td>
								<td>
									<div class="master-table__primary">
										<strong>{route.origin.name}</strong>
										<span>{route.origin.code}</span>
									</div>
								</td>
								<td>
									<div class="master-table__primary">
										<strong>{route.destination.name}</strong>
										<span>{route.destination.code}</span>
									</div>
								</td>
								<td>{route.scheduleCount}</td>
								<td>
									<div class="master-table__primary">
										<strong>{route.activeTariffCount}</strong>
										<span>{route.tariffCount} total</span>
									</div>
								</td>
								<td>
									<Badge tone={route.isActive ? 'success' : 'neutral'}>
										{route.isActive ? 'Aktif' : 'Nonaktif'}
									</Badge>
								</td>
								<td class="master-table__action">
									<div class="button-row">
										<a class="button button-secondary" href={resolve(`/app/routes/${route.id}`)}>
											Detail
										</a>
										{#if data.canCreate}
											<a class="button button-ghost" href={resolve(`/app/routes/${route.id}/edit`)}>
												Ubah
											</a>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="master-list master-list--mobile">
				{#each data.routes as route (route.id)}
					<article class="master-card">
						<div class="master-card__header">
							<div class="master-card__copy">
								<p>{route.origin.name} -> {route.destination.name}</p>
								<h3>{route.name}</h3>
							</div>
							<Badge tone={route.isActive ? 'success' : 'neutral'}>
								{route.isActive ? 'Aktif' : 'Nonaktif'}
							</Badge>
						</div>
						<div class="master-card__meta">
							<span>{route.estimatedDurationMinutes ?? 'Durasi belum diisi'} menit</span>
							<span>{route.scheduleCount} jadwal</span>
							<span>{route.activeTariffCount} tarif aktif</span>
							<span>{route.tariffCount} total tarif</span>
						</div>
						<div class="button-row">
							<a class="button button-secondary" href={resolve(`/app/routes/${route.id}`)}>
								Detail
							</a>
							{#if data.canCreate}
								<a class="button button-ghost" href={resolve(`/app/routes/${route.id}/edit`)}>
									Ubah
								</a>
							{/if}
						</div>
					</article>
				{/each}
			</div>
		</Card>

		<Card as="section" padding="sm">
			<div class="pagination">
				<span class="pagination__meta">
					Halaman {data.pagination.page} dari {data.pagination.totalPages} • {data.pagination.total}
					data
				</span>
				<div class="button-row">
					<a
						class="button button-secondary"
						href={resolve(`/app/routes?${buildQuery(Math.max(1, data.pagination.page - 1))}`)}
						aria-disabled={data.pagination.page <= 1 ? 'true' : undefined}
					>
						Sebelumnya
					</a>
					<a
						class="button button-secondary"
						href={resolve(`/app/routes?${buildQuery(Math.min(data.pagination.totalPages, data.pagination.page + 1))}`)}
						aria-disabled={data.pagination.page >= data.pagination.totalPages ? 'true' : undefined}
					>
						Berikutnya
					</a>
				</div>
			</div>
		</Card>
	{/if}
</section>

<style>
	.master-data-page {
		display: grid;
		gap: 1rem;
	}

	.master-data-page__actions {
		display: flex;
		justify-content: flex-end;
	}

	.master-toolbar {
		display: grid;
		gap: 1rem;
	}

	.master-toolbar__submit {
		display: flex;
		align-items: end;
	}

	.master-table {
		width: 100%;
		border-collapse: collapse;
	}

	.master-table th,
	.master-table td {
		border-bottom: 1px solid var(--line-200);
		padding: 0.875rem 0.75rem;
		vertical-align: top;
		text-align: left;
	}

	.master-table th {
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--ink-500);
	}

	.master-table td {
		font-size: 0.9375rem;
		color: var(--ink-800);
	}

	.master-table__primary {
		display: grid;
		gap: 0.15rem;
	}

	.master-table__primary strong {
		font-weight: 700;
		color: var(--ink-950);
	}

	.master-table__primary span {
		font-size: 0.8125rem;
		line-height: 1.45;
		color: var(--ink-500);
	}

	.master-table__action {
		width: 1%;
		white-space: nowrap;
	}

	.master-card {
		display: grid;
		gap: 0.875rem;
		border-bottom: 1px solid var(--line-200);
		padding: 1rem 0;
	}

	.master-card__header {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.master-card__copy {
		display: grid;
		gap: 0.125rem;
	}

	.master-card__copy p,
	.master-card__copy h3 {
		margin: 0;
	}

	.master-card__copy p {
		font-size: 0.8125rem;
		color: var(--ink-500);
	}

	.master-card__copy h3 {
		font-size: 1rem;
		color: var(--ink-950);
	}

	.master-card__meta {
		display: grid;
		gap: 0.35rem;
		font-size: 0.875rem;
		color: var(--ink-700);
	}

	.pagination {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
		justify-content: space-between;
	}

	.pagination__meta {
		font-size: 0.875rem;
		color: var(--ink-600);
	}

	@media (min-width: 960px) {
		.master-toolbar {
			grid-template-columns: minmax(0, 2fr) repeat(3, minmax(0, 1fr)) auto;
		}
	}

	@media (max-width: 959px) {
		.master-list--desktop {
			display: none;
		}
	}

	@media (min-width: 960px) {
		.master-list--mobile {
			display: none;
		}
	}
</style>
