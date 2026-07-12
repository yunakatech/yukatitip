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
	<title>{data.position.name} | Jabatan Yukatitip</title>
</svelte:head>

<section class="detail-page">
	<PageHeader
		eyebrow="Organisasi"
		title={data.position.name}
		description="Rincian jabatan kerja dan status aktifnya."
	/>

	<div class="detail-page__status">
		<Badge tone={data.position.isActive ? 'success' : 'neutral'}>
			{data.position.isActive ? 'Aktif' : 'Nonaktif'}
		</Badge>
		<Badge tone="brand">Level {data.position.level}</Badge>
	</div>

	<div class="detail-page__summary">
		<Card as="section">
			<p class="detail-page__label">Kode</p>
			<strong>{data.position.code}</strong>
		</Card>
		<Card as="section">
			<p class="detail-page__label">Karyawan aktif</p>
			<strong>{data.position.activeEmployeeCount}</strong>
		</Card>
		<Card as="section">
			<p class="detail-page__label">Dibuat</p>
			<strong>{new Date(data.position.createdAt).toLocaleString('id-ID')}</strong>
		</Card>
		<Card as="section">
			<p class="detail-page__label">Diperbarui</p>
			<strong>{new Date(data.position.updatedAt).toLocaleString('id-ID')}</strong>
		</Card>
	</div>

	<Card as="section">
		<div class="detail-page__grid">
			<div>
				<p class="detail-page__label">Deskripsi</p>
				<p>{data.position.description ?? 'Belum diisi'}</p>
			</div>
		</div>
	</Card>

	<Card as="section">
		<Alert tone="info" title="Aksi jabatan">
			Jabatan yang dipakai karyawan aktif tidak boleh dihapus permanen.
		</Alert>
		<div class="button-row">
			<a class="button button-secondary" href={resolve('/app/employees/positions')}>Kembali</a>
			<a class="button button-primary" href={resolve(`/app/employees/positions/${data.position.id}/edit`)}>
				Ubah jabatan
			</a>
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

	.detail-page__grid p {
		margin: 0.2rem 0 0;
		line-height: 1.6;
	}

	@media (max-width: 720px) {
		.detail-page__summary {
			grid-template-columns: 1fr;
		}
	}
</style>
