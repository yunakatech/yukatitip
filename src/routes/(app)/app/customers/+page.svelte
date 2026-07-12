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
		{ value: 'inactive', label: 'Nonaktif' },
		{ value: 'suspended', label: 'Disuspensi' }
	];

	const customerTypeOptions = [
		{ value: '', label: 'Semua tipe' },
		{ value: 'individual', label: 'Perorangan' },
		{ value: 'business', label: 'Bisnis' },
		{ value: 'reseller', label: 'Reseller' }
	];

	const sortOptions = [
		{ value: 'createdAt', label: 'Terbaru' },
		{ value: '-createdAt', label: 'Terbaru dulu' },
		{ value: 'name', label: 'Nama' },
		{ value: 'phone', label: 'Nomor WhatsApp' },
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

		if (data.filters.customerType) {
			params.set('customerType', data.filters.customerType);
		}

		if (data.filters.sort) {
			params.set('sort', data.filters.sort);
		}

		params.set('page', String(page));
		params.set('pageSize', String(data.pagination.pageSize));

		return params.toString();
	}

	const hasFilters = $derived(
		Boolean(
			data.filters.search ||
				data.filters.status ||
				data.filters.branchId ||
				data.filters.customerType ||
				data.filters.sort !== 'createdAt'
		)
	);

	const pageTitle = $derived(data.canCreate ? 'Customer' : 'Customer Cabang');
</script>

<svelte:head>
	<title>{pageTitle} | Yukatitip</title>
</svelte:head>

<section class="master-data-page">
	<PageHeader
		eyebrow="Data"
		title={pageTitle}
		description="Kelola customer internal tanpa membuka login customer atau data di luar scope cabang."
	/>

	{#if data.canCreate}
		<div class="master-data-page__actions">
			<a class="button button-primary" href={resolve('/app/customers/new')}>Customer baru</a>
		</div>
	{/if}

	<Card as="section">
		<form class="master-toolbar" method="GET">
			<div class="master-toolbar__search">
				<Input
					label="Cari customer"
					name="search"
					value={data.filters.search}
					placeholder="Nama, nomor, email, atau kota"
				/>
			</div>
			<div class="master-toolbar__filter">
				<Select label="Tipe" name="customerType" value={data.filters.customerType ?? ''}>
					{#each customerTypeOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</Select>
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

	{#if data.customers.length === 0}
		{#if hasFilters}
			<EmptyState
				title="Tidak ada customer yang cocok"
				description="Coba ubah filter atau kata kunci untuk menampilkan customer lainnya."
			/>
		{:else}
			<EmptyState
				title="Belum ada customer"
				description="Tambahkan customer pertama agar data pesanan bisa dipilih dengan lebih cepat."
			>
				{#if data.canCreate}
					<a class="button button-primary" href={resolve('/app/customers/new')}>Customer baru</a>
				{/if}
			</EmptyState>
		{/if}
	{:else}
		<Card as="section" padding="sm">
			<div class="master-list master-list--desktop">
				<table class="master-table">
					<caption class="sr-only">Daftar customer Yukatitip</caption>
					<thead>
						<tr>
							<th>Nama</th>
							<th>WhatsApp</th>
							<th>Tipe</th>
							<th>Kota</th>
							<th>Cabang</th>
							<th>Status</th>
							<th class="master-table__action">Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each data.customers as customer (customer.id)}
							<tr>
								<td>
									<div class="master-table__primary">
										<strong>{customer.name}</strong>
										<span>{customer.email ?? 'Email belum diisi'}</span>
									</div>
								</td>
								<td class="master-table__code">{customer.phone}</td>
								<td>{customer.customerType}</td>
								<td>{customer.city ?? 'Belum diisi'}</td>
								<td>
									{#if customer.homeBranch}
										<div class="master-table__primary">
											<strong>{customer.homeBranch.name}</strong>
											<span>{customer.homeBranch.code}</span>
										</div>
									{:else}
										<span class="master-table__muted">Semua cabang</span>
									{/if}
								</td>
								<td>
									<Badge tone={customer.status === 'active' ? 'success' : 'neutral'}>
										{customer.status === 'active' ? 'Aktif' : customer.status === 'inactive' ? 'Nonaktif' : 'Disuspensi'}
									</Badge>
								</td>
								<td class="master-table__action">
									<div class="button-row">
										<a class="button button-secondary" href={resolve(`/app/customers/${customer.id}`)}>
											Detail
										</a>
										{#if data.canCreate}
											<a
												class="button button-ghost"
												href={resolve(`/app/customers/${customer.id}/edit`)}
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

			<div class="master-list master-list--mobile">
				{#each data.customers as customer (customer.id)}
					<article class="master-card">
						<div class="master-card__header">
							<div class="master-card__copy">
								<p>{customer.phone}</p>
								<h3>{customer.name}</h3>
							</div>
							<Badge tone={customer.status === 'active' ? 'success' : 'neutral'}>
								{customer.status === 'active' ? 'Aktif' : customer.status === 'inactive' ? 'Nonaktif' : 'Disuspensi'}
							</Badge>
						</div>
						<div class="master-card__meta">
							<span>{customer.customerType}</span>
							<span>{customer.city ?? 'Belum diisi'}</span>
						</div>
						<div class="master-card__meta">
							<span class="master-card__label">Cabang</span>
							{#if customer.homeBranch}
								<strong>{customer.homeBranch.name}</strong>
								<span>{customer.homeBranch.code}</span>
							{:else}
								<span class="master-table__muted">Semua cabang</span>
							{/if}
						</div>
						<div class="button-row">
							<a class="button button-secondary" href={resolve(`/app/customers/${customer.id}`)}>
								Detail
							</a>
							{#if data.canCreate}
								<a class="button button-ghost" href={resolve(`/app/customers/${customer.id}/edit`)}>
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
						Menampilkan {data.customers.length} dari {data.pagination.total} customer
					</p>
					<div class="button-row">
						<a
							class="button button-secondary"
							href={data.pagination.page > 1 ? resolve(`/app/customers?${buildQuery(data.pagination.page - 1)}`) : '#'}
							aria-disabled={data.pagination.page <= 1}
						>
							Sebelumnya
						</a>
						<a
							class="button button-secondary"
							href={data.pagination.page < data.pagination.totalPages ? resolve(`/app/customers?${buildQuery(data.pagination.page + 1)}`) : '#'}
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

	.master-toolbar {
		display: grid;
		gap: 1rem;
	}

	.master-toolbar__submit {
		display: flex;
		align-items: end;
	}

	.master-list {
		display: grid;
		gap: 0.75rem;
	}

	.master-list--mobile {
		display: grid;
	}

	.master-list--desktop {
		display: none;
	}

	.master-card {
		display: grid;
		gap: 0.75rem;
		border: 1px solid var(--line-200);
		border-radius: var(--radius-md);
		background: var(--white);
		padding: 1rem;
	}

	.master-card__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.master-card__copy {
		display: grid;
		gap: 0.125rem;
	}

	.master-card__copy p,
	.master-card__copy h3,
	.master-card__meta,
	.master-table__primary span,
	.master-table__muted {
		margin: 0;
	}

	.master-card__copy p {
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-500);
	}

	.master-card__copy h3 {
		font-size: 1rem;
		line-height: 1.35;
		color: var(--ink-950);
	}

	.master-card__meta {
		display: grid;
		gap: 0.125rem;
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--ink-600);
	}

	.master-card__label {
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-500);
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
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-500);
	}

	.master-table td {
		font-size: 0.9375rem;
		color: var(--ink-800);
	}

	.master-table__code {
		font-weight: 800;
		color: var(--brand-700);
	}

	.master-table__primary {
		display: grid;
		gap: 0.1rem;
	}

	.master-table__primary strong {
		font-size: 0.9375rem;
		color: var(--ink-950);
	}

	.master-table__primary span,
	.master-table__muted {
		font-size: 0.8125rem;
		line-height: 1.45;
		color: var(--ink-500);
	}

	.master-table__action {
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
		.master-toolbar {
			grid-template-columns: minmax(0, 1.2fr) repeat(4, minmax(0, 0.55fr)) auto;
			align-items: end;
		}

		.master-list--mobile {
			display: none;
		}

		.master-list--desktop {
			display: block;
		}
	}
</style>
