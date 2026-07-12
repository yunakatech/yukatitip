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
	<title>{data.branch.name} | Cabang Yukatitip</title>
</svelte:head>

<section class="branch-detail">
	<PageHeader
		eyebrow="Data"
		title={data.branch.name}
		description="Rincian cabang operasional, penanggung jawab, dan ringkasan relasi yang dipakai modul lain."
	/>

	<div class="branch-detail__status">
		<Badge tone={data.branch.isActive ? 'success' : 'neutral'}>
			{data.branch.isActive ? 'Aktif' : 'Nonaktif'}
		</Badge>
		{#if data.branch.headEmployee}
			<Badge tone="brand">Kepala: {data.branch.headEmployee.fullName}</Badge>
		{/if}
	</div>

	<div class="branch-detail__summary">
		<Card as="section">
			<p class="branch-detail__label">Kode</p>
			<strong>{data.branch.code}</strong>
		</Card>
		<Card as="section">
			<p class="branch-detail__label">Kota</p>
			<strong>{data.branch.city}</strong>
		</Card>
		<Card as="section">
			<p class="branch-detail__label">Rute terkait</p>
			<strong>{data.branch.counts.routes}</strong>
		</Card>
		<Card as="section">
			<p class="branch-detail__label">Karyawan</p>
			<strong>{data.branch.counts.employees}</strong>
		</Card>
	</div>

	<Card as="section">
	<div class="branch-detail__grid">
		<div>
			<p class="branch-detail__label">Alamat</p>
			<p>{data.branch.address ?? 'Belum diisi'}</p>
		</div>
		<div>
			<p class="branch-detail__label">WhatsApp</p>
			<p>{data.branch.whatsapp ?? 'Belum diisi'}</p>
		</div>
		<div>
			<p class="branch-detail__label">Jam operasional</p>
			<p>{data.branch.openingHours ?? 'Belum diisi'}</p>
		</div>
		<div>
			<p class="branch-detail__label">Tautan peta</p>
			<p>{data.branch.mapsUrl ?? 'Belum diisi'}</p>
		</div>
		<div>
			<p class="branch-detail__label">Dibuat</p>
				<p>{new Date(data.branch.createdAt).toLocaleString('id-ID')}</p>
			</div>
		</div>
	</Card>

	<Card as="section">
		<Alert tone="info" title="Aksi cabang">
			Cabang hanya dapat diubah melalui halaman edit. Penonaktifan dibatasi jika masih ada dependency aktif.
		</Alert>
		<div class="button-row">
			<a class="button button-secondary" href={resolve('/app/branches')}>Kembali</a>
			<a class="button button-primary" href={resolve(`/app/branches/${data.branch.id}/edit`)}>
				Ubah cabang
			</a>
		</div>
	</Card>
</section>

<style>
	.branch-detail {
		display: grid;
		gap: 1rem;
	}

	.branch-detail__status {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.branch-detail__summary {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}

	.branch-detail__label {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-500);
	}

	.branch-detail__summary strong {
		font-size: 1.125rem;
		color: var(--ink-950);
	}

	.branch-detail__grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}

	.branch-detail__grid p {
		margin: 0.2rem 0 0;
		line-height: 1.6;
	}

	@media (max-width: 720px) {
		.branch-detail__summary,
		.branch-detail__grid {
			grid-template-columns: 1fr;
		}
	}
</style>
