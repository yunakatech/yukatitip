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
		{ value: 'code', label: 'Kode cabang' },
		{ value: 'name', label: 'Nama cabang' },
		{ value: 'city', label: 'Kota' }
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

	const pageTitle = $derived(data.canCreate ? 'Cabang' : 'Cabang Aktif');
</script>

<svelte:head>
	<title>{pageTitle} | Yukatitip</title>
</svelte:head>

<section class="master-data-page">
	<PageHeader
		eyebrow="Data"
		title={pageTitle}
		description="Kelola cabang operasional, cabang aktif, dan penanggung jawab tanpa membuka data di luar scope."
	/>

	{#if data.canCreate}
		<div class="master-data-page__actions">
			<a class="button button-primary" href={resolve('/app/branches/new')}>Cabang baru</a>
		</div>
	{/if}

	<Card as="section">
		<form class="branch-toolbar" method="GET">
			<div class="branch-toolbar__search">
				<Input
					label="Cari cabang"
					name="search"
					value={data.filters.search}
					placeholder="Kode, nama, atau kota"
				/>
			</div>
			<div class="branch-toolbar__filter">
				<Select label="Status" name="status" value={data.filters.status ?? ''}>
					{#each statusOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</Select>
			</div>
			{#if data.branchOptions.length > 0}
				<div class="branch-toolbar__filter">
					<Select label="Cabang" name="branchId" value={data.filters.branchId ?? ''}>
						<option value="">Semua cabang</option>
						{#each data.branchOptions as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</Select>
				</div>
			{/if}
			<div class="branch-toolbar__filter">
				<Select label="Urutkan" name="sort" value={data.filters.sort}>
					{#each sortOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</Select>
			</div>
			<div class="branch-toolbar__submit">
				<Button type="submit">Terapkan</Button>
			</div>
		</form>
	</Card>

	{#if data.branches.length === 0}
		{#if hasFilters}
			<EmptyState
				title="Tidak ada cabang yang cocok"
				description="Ubah filter atau kata kunci untuk melihat cabang lainnya."
			/>
		{:else}
			<EmptyState
				title="Belum ada cabang"
				description="Tambahkan cabang pertama agar data operasional bisa mulai disusun."
			>
				{#if data.canCreate}
					<a class="button button-primary" href={resolve('/app/branches/new')}>Cabang baru</a>
				{/if}
			</EmptyState>
		{/if}
	{:else}
		<Card as="section" padding="sm">
			<div class="branch-list branch-list--desktop">
				<table class="branch-table">
					<caption class="sr-only">Daftar cabang Yukatitip</caption>
					<thead>
						<tr>
							<th>Kode</th>
							<th>Nama</th>
							<th>Kota</th>
							<th>Status</th>
							<th>Kepala cabang</th>
							<th class="branch-table__action">Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each data.branches as branch (branch.id)}
							<tr>
								<td class="branch-table__code">{branch.code}</td>
								<td>
									<div class="branch-table__primary">
										<strong>{branch.name}</strong>
										<span>{branch.address ?? 'Alamat belum diisi'}</span>
									</div>
								</td>
								<td>{branch.city}</td>
								<td>
									<Badge tone={branch.isActive ? 'success' : 'neutral'}>
										{branch.isActive ? 'Aktif' : 'Nonaktif'}
									</Badge>
								</td>
								<td>
									{#if branch.headEmployee}
										<div class="branch-table__primary">
											<strong>{branch.headEmployee.fullName}</strong>
											<span>{branch.headEmployee.positionName}</span>
										</div>
									{:else}
										<span class="branch-table__muted">Belum ditetapkan</span>
									{/if}
								</td>
								<td class="branch-table__action">
									<div class="button-row">
										<a class="button button-secondary" href={resolve(`/app/branches/${branch.id}`)}>
											Detail
										</a>
										{#if data.canCreate}
											<a
												class="button button-ghost"
												href={resolve(`/app/branches/${branch.id}/edit`)}
											>
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

			<div class="branch-list branch-list--mobile">
				{#each data.branches as branch (branch.id)}
					<article class="branch-card">
						<div class="branch-card__header">
							<div class="branch-card__copy">
								<p>{branch.code}</p>
								<h3>{branch.name}</h3>
							</div>
							<Badge tone={branch.isActive ? 'success' : 'neutral'}>
								{branch.isActive ? 'Aktif' : 'Nonaktif'}
							</Badge>
						</div>
						<div class="branch-card__meta">
							<span>{branch.city}</span>
							<span>{branch.address ?? 'Alamat belum diisi'}</span>
						</div>
						<div class="branch-card__meta">
							<span class="branch-card__label">Kepala cabang</span>
							{#if branch.headEmployee}
								<strong>{branch.headEmployee.fullName}</strong>
								<span>{branch.headEmployee.positionName}</span>
							{:else}
								<span class="branch-table__muted">Belum ditetapkan</span>
							{/if}
						</div>
						<div class="button-row">
							<a class="button button-secondary" href={resolve(`/app/branches/${branch.id}`)}>
								Detail
							</a>
							{#if data.canCreate}
								<a class="button button-ghost" href={resolve(`/app/branches/${branch.id}/edit`)}>
									Ubah
								</a>
							{/if}
						</div>
					</article>
				{/each}
			</div>
		</Card>

		<Card as="section">
			<div class="pagination">
					<p>
						Menampilkan {data.branches.length} dari {data.pagination.total} cabang
					</p>
					<div class="button-row">
						<a
							class="button button-secondary"
							href={data.pagination.page > 1 ? resolve(`/app/branches?${buildQuery(data.pagination.page - 1)}`) : '#'}
							aria-disabled={data.pagination.page <= 1}
						>
							Sebelumnya
						</a>
						<a
							class="button button-secondary"
							href={data.pagination.page < data.pagination.totalPages ? resolve(`/app/branches?${buildQuery(data.pagination.page + 1)}`) : '#'}
							aria-disabled={data.pagination.page >= data.pagination.totalPages}
						>
							Selanjutnya
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

	.branch-toolbar {
		display: grid;
		gap: 1rem;
	}

	.branch-toolbar__submit {
		display: flex;
		align-items: end;
	}

	.branch-list {
		display: grid;
		gap: 0.75rem;
	}

	.branch-list--mobile {
		display: grid;
	}

	.branch-list--desktop {
		display: none;
	}

	.branch-card {
		display: grid;
		gap: 0.75rem;
		border: 1px solid var(--line-200);
		border-radius: var(--radius-md);
		background: var(--white);
		padding: 1rem;
	}

	.branch-card__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.branch-card__copy {
		display: grid;
		gap: 0.125rem;
	}

	.branch-card__copy p,
	.branch-card__copy h3,
	.branch-card__meta,
	.branch-table__primary span,
	.branch-table__muted {
		margin: 0;
	}

	.branch-card__copy p {
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-500);
	}

	.branch-card__copy h3 {
		font-size: 1rem;
		line-height: 1.35;
		color: var(--ink-950);
	}

	.branch-card__meta {
		display: grid;
		gap: 0.125rem;
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--ink-600);
	}

	.branch-card__label {
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-500);
	}

	.branch-table {
		width: 100%;
		border-collapse: collapse;
	}

	.branch-table th,
	.branch-table td {
		border-bottom: 1px solid var(--line-200);
		padding: 0.875rem 0.75rem;
		vertical-align: top;
		text-align: left;
	}

	.branch-table th {
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-500);
	}

	.branch-table td {
		font-size: 0.9375rem;
		color: var(--ink-800);
	}

	.branch-table__code {
		font-weight: 800;
		color: var(--brand-700);
	}

	.branch-table__primary {
		display: grid;
		gap: 0.1rem;
	}

	.branch-table__primary strong {
		font-size: 0.9375rem;
		color: var(--ink-950);
	}

	.branch-table__primary span,
	.branch-table__muted {
		font-size: 0.8125rem;
		line-height: 1.45;
		color: var(--ink-500);
	}

	.branch-table__action {
		width: 1%;
		white-space: nowrap;
	}

	.pagination {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.pagination p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--ink-600);
	}

	@media (min-width: 960px) {
		.branch-toolbar {
			grid-template-columns: minmax(0, 1.2fr) repeat(3, minmax(0, 0.6fr)) auto;
			align-items: end;
		}

		.branch-list--mobile {
			display: none;
		}

		.branch-list--desktop {
			display: block;
		}
	}
</style>
