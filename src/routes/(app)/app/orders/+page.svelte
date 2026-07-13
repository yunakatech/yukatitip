<script lang="ts">
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import type { PageData } from './$types';

	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import PageHeader from '$lib/components/app-shell/PageHeader.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_TONES } from '$lib/constants/orders';

	let { data }: { data: PageData } = $props();

	const currency = new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		maximumFractionDigits: 0
	});

	const statusOptions = [
		{ value: '', label: 'Semua status' },
		...Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({ value, label }))
	];

	const paymentStatusOptions = [
		{ value: '', label: 'Semua pembayaran' },
		...Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))
	];

	const sortOptions = [
		{ value: '-createdAt', label: 'Terbaru' },
		{ value: 'trackingNumber', label: 'Tracking' },
		{ value: 'status', label: 'Status' },
		{ value: 'paymentStatus', label: 'Pembayaran' },
		{ value: '-serviceRevenue', label: 'Jasa terbesar' }
	];

	function buildQuery(page = data.pagination.page): string {
		const params = new SvelteURLSearchParams();

		if (data.filters.search) params.set('search', data.filters.search);
		if (data.filters.status) params.set('status', data.filters.status);
		if (data.filters.paymentStatus) params.set('paymentStatus', data.filters.paymentStatus);
		if (data.filters.branchId) params.set('branchId', data.filters.branchId);
		if (data.filters.sort) params.set('sort', data.filters.sort);

		params.set('page', String(page));
		params.set('pageSize', String(data.pagination.pageSize));

		return params.toString();
	}

	const hasFilters = $derived(
		Boolean(data.filters.search || data.filters.status || data.filters.paymentStatus || data.filters.branchId)
	);
</script>

<svelte:head>
	<title>Pesanan | Yukatitip</title>
</svelte:head>

<section class="orders-page">
	<PageHeader
		eyebrow="Operasional"
		title="Pesanan"
		description="Catat dan pantau pesanan inti dengan tracking, pembayaran, item, dan timeline internal."
	/>

	<div class="orders-page__actions">
		<a class="button button-primary" href={resolve('/app/orders/new')}>Pesanan baru</a>
	</div>

	<Card as="section">
		<form class="orders-toolbar" method="GET">
			<div class="orders-toolbar__search">
				<Input
					label="Cari tracking"
					name="search"
					value={data.filters.search}
					placeholder="YKT-2607-00001"
				/>
			</div>
			<Select label="Status" name="status" value={data.filters.status ?? ''}>
				{#each statusOptions as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</Select>
			<Select label="Pembayaran" name="paymentStatus" value={data.filters.paymentStatus ?? ''}>
				{#each paymentStatusOptions as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</Select>
			<Select label="Urutkan" name="sort" value={data.filters.sort}>
				{#each sortOptions as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</Select>
			<div class="orders-toolbar__submit">
				<Button type="submit">Terapkan</Button>
			</div>
		</form>
	</Card>

	{#if data.orders.length === 0}
		<EmptyState
			title={hasFilters ? 'Tidak ada pesanan yang cocok' : 'Belum ada pesanan'}
			description={hasFilters
				? 'Coba ubah filter atau nomor tracking.'
				: 'Buat pesanan pertama untuk menghasilkan nomor tracking dan timeline internal.'}
		>
			<a class="button button-primary" href={resolve('/app/orders/new')}>Pesanan baru</a>
		</EmptyState>
	{:else}
		<Card as="section" padding="sm">
			<div class="orders-list orders-list--desktop">
				<table class="orders-table">
					<caption class="sr-only">Daftar pesanan Yukatitip</caption>
					<thead>
						<tr>
							<th>Tracking</th>
							<th>Customer</th>
							<th>Rute</th>
							<th>Layanan</th>
							<th>Status</th>
							<th>Pembayaran</th>
							<th>Jasa</th>
							<th class="orders-table__action">Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each data.orders as order (order.id)}
							<tr>
								<td class="orders-table__code">{order.trackingNumber}</td>
								<td>
									<div class="orders-table__primary">
										<strong>{order.customer.name}</strong>
										<span>{order.customer.phone}</span>
									</div>
								</td>
								<td>
									<div class="orders-table__primary">
										<strong>{order.route.name}</strong>
										<span>{order.origin.code} ke {order.destination.code}</span>
									</div>
								</td>
								<td>{order.serviceLabel}</td>
								<td>
									<Badge tone={ORDER_STATUS_TONES[order.status]}>{order.statusLabel}</Badge>
								</td>
								<td>
									<Badge tone={PAYMENT_STATUS_TONES[order.paymentStatus]}>{order.paymentStatusLabel}</Badge>
								</td>
								<td class="orders-table__money">{currency.format(order.serviceRevenue)}</td>
								<td class="orders-table__action">
									<a class="button button-secondary" href={resolve(`/app/orders/${order.id}`)}>Detail</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="orders-list orders-list--mobile">
				{#each data.orders as order (order.id)}
					<article class="order-card">
						<div class="order-card__header">
							<div>
								<p>{order.trackingNumber}</p>
								<h3>{order.customer.name}</h3>
							</div>
							<Badge tone={ORDER_STATUS_TONES[order.status]}>{order.statusLabel}</Badge>
						</div>
						<div class="order-card__meta">
							<span>{order.route.name}</span>
							<span>{order.serviceLabel}</span>
							<span>{currency.format(order.serviceRevenue)} jasa</span>
						</div>
						<div class="order-card__footer">
							<Badge tone={PAYMENT_STATUS_TONES[order.paymentStatus]}>{order.paymentStatusLabel}</Badge>
							<a class="button button-secondary" href={resolve(`/app/orders/${order.id}`)}>Detail</a>
						</div>
					</article>
				{/each}
			</div>
		</Card>

		<Card as="section">
			<div class="pagination">
				<p>Menampilkan {data.orders.length} dari {data.pagination.total} pesanan</p>
				<div class="button-row">
					<a
						class="button button-secondary"
						href={data.pagination.page > 1 ? resolve(`/app/orders?${buildQuery(data.pagination.page - 1)}`) : '#'}
						aria-disabled={data.pagination.page <= 1}
					>
						Sebelumnya
					</a>
					<a
						class="button button-secondary"
						href={data.pagination.page < data.pagination.totalPages ? resolve(`/app/orders?${buildQuery(data.pagination.page + 1)}`) : '#'}
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
	.orders-page {
		display: grid;
		gap: 1rem;
	}

	.orders-page__actions {
		display: flex;
		justify-content: flex-end;
	}

	.orders-toolbar {
		display: grid;
		gap: 1rem;
	}

	.orders-toolbar__submit {
		display: flex;
		align-items: end;
	}

	.orders-list--desktop {
		display: none;
	}

	.orders-list--mobile {
		display: grid;
		gap: 0.75rem;
	}

	.orders-table {
		width: 100%;
		border-collapse: collapse;
	}

	.orders-table th,
	.orders-table td {
		border-bottom: 1px solid var(--line-200);
		padding: 0.75rem;
		text-align: left;
		vertical-align: top;
	}

	.orders-table th {
		font-size: 0.75rem;
		font-weight: 800;
		color: var(--ink-500);
	}

	.orders-table td {
		font-size: 0.875rem;
		color: var(--ink-800);
	}

	.orders-table__code,
	.orders-table__money {
		font-weight: 800;
		color: var(--brand-700);
	}

	.orders-table__primary {
		display: grid;
		gap: 0.125rem;
	}

	.orders-table__primary span {
		font-size: 0.75rem;
		color: var(--ink-500);
	}

	.orders-table__action {
		width: 1%;
		white-space: nowrap;
	}

	.order-card {
		display: grid;
		gap: 0.75rem;
		border: 1px solid var(--line-200);
		border-radius: var(--radius-md);
		background: var(--white);
		padding: 1rem;
	}

	.order-card__header,
	.order-card__footer {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.order-card p,
	.order-card h3,
	.order-card__meta,
	.pagination p {
		margin: 0;
	}

	.order-card p {
		font-size: 0.75rem;
		font-weight: 800;
		color: var(--brand-700);
	}

	.order-card h3 {
		font-size: 1rem;
		color: var(--ink-950);
	}

	.order-card__meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 0.75rem;
		font-size: 0.8125rem;
		color: var(--ink-600);
	}

	.pagination {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.pagination p {
		font-size: 0.875rem;
		color: var(--ink-600);
	}

	@media (min-width: 960px) {
		.orders-toolbar {
			grid-template-columns: minmax(16rem, 1fr) repeat(3, minmax(0, 12rem)) auto;
			align-items: end;
		}

		.orders-list--desktop {
			display: block;
		}

		.orders-list--mobile {
			display: none;
		}
	}
</style>
