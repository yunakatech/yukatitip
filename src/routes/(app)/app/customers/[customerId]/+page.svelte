<script lang="ts">
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';

	import Alert from '$lib/components/ui/Alert.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import PageHeader from '$lib/components/app-shell/PageHeader.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.customer.name} | Customer Yukatitip</title>
</svelte:head>

<section class="detail-page">
	<PageHeader
		eyebrow="Data"
		title={data.customer.name}
		description="Rincian customer internal dan ringkasan cabang yang menaunginya."
	/>

	<div class="detail-page__status">
		<Badge tone={data.customer.status === 'active' ? 'success' : 'neutral'}>
			{data.customer.status === 'active'
				? 'Aktif'
				: data.customer.status === 'inactive'
					? 'Nonaktif'
					: 'Disuspensi'}
		</Badge>
		<Badge tone="brand">{data.customer.customerType}</Badge>
	</div>

	<div class="detail-page__summary">
		<Card as="section">
			<p class="detail-page__label">WhatsApp</p>
			<strong>{data.customer.phone}</strong>
		</Card>
		<Card as="section">
			<p class="detail-page__label">Cabang</p>
			<strong>{data.customer.homeBranch?.name ?? 'Semua cabang'}</strong>
		</Card>
		<Card as="section">
			<p class="detail-page__label">Pesanan</p>
			<strong>{data.customer.orderCount}</strong>
		</Card>
		<Card as="section">
			<p class="detail-page__label">Kota</p>
			<strong>{data.customer.city ?? 'Belum diisi'}</strong>
		</Card>
	</div>

	<Card as="section">
		<div class="detail-page__grid">
			<div>
				<p class="detail-page__label">Email</p>
				<p>{data.customer.email ?? 'Belum diisi'}</p>
			</div>
			<div>
				<p class="detail-page__label">Alamat</p>
				<p>{data.customer.address ?? 'Belum diisi'}</p>
			</div>
			<div>
				<p class="detail-page__label">Kecamatan</p>
				<p>{data.customer.district ?? 'Belum diisi'}</p>
			</div>
			<div>
				<p class="detail-page__label">Patokan</p>
				<p>{data.customer.landmark ?? 'Belum diisi'}</p>
			</div>
			<div>
				<p class="detail-page__label">Catatan</p>
				<p>{data.customer.notes ?? 'Belum diisi'}</p>
			</div>
			<div>
				<p class="detail-page__label">Dibuat</p>
				<p>{new Date(data.customer.createdAt).toLocaleString('id-ID')}</p>
			</div>
		</div>
	</Card>

	<Card as="section">
		<Alert tone="info" title="Aksi customer">
			Customer tidak memiliki login dan hanya dikelola dari halaman internal.
		</Alert>
		<div class="button-row">
			<a class="button button-secondary" href={resolve('/app/customers')}>Kembali</a>
			{#if data.canEdit}
				<a class="button button-primary" href={resolve(`/app/customers/${data.customer.id}/edit`)}>
					Ubah customer
				</a>
			{/if}
		</div>
	</Card>
</section>

<style>
	.detail-page {
		display: grid;
		gap: 1rem;
	}

	.detail-page__status {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.detail-page__summary {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}

	.detail-page__label {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-500);
	}

	.detail-page__summary strong {
		font-size: 1.125rem;
		color: var(--ink-950);
	}

	.detail-page__grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}

	.detail-page__grid p {
		margin: 0.2rem 0 0;
		line-height: 1.6;
	}

	@media (max-width: 720px) {
		.detail-page__summary,
		.detail-page__grid {
			grid-template-columns: 1fr;
		}
	}
</style>
