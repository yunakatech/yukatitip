<script lang="ts">
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';

	import Alert from '$lib/components/ui/Alert.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import PageHeader from '$lib/components/app-shell/PageHeader.svelte';
	import { ROUTE_DAY_LABELS, ROUTE_SERVICE_LABELS } from '$lib/constants/routes';

	let { data }: { data: PageData } = $props();

	function formatMoney(value: number): string {
		return new Intl.NumberFormat('id-ID').format(value);
	}
</script>

<svelte:head>
	<title>{data.route.name} | Rute Yukatitip</title>
</svelte:head>

<section class="detail-page">
	<PageHeader
		eyebrow="Data"
		title={data.route.name}
		description="Rincian rute, jadwal keberangkatan, dan tarif yang digunakan oleh operasional cabang."
	/>

	<div class="detail-page__status">
		<Badge tone={data.route.isActive ? 'success' : 'neutral'}>
			{data.route.isActive ? 'Aktif' : 'Nonaktif'}
		</Badge>
		<Badge tone="brand">{data.route.scheduleCount} jadwal</Badge>
		<Badge tone="brand">{data.route.activeTariffCount} tarif aktif</Badge>
	</div>

	<div class="detail-page__summary">
		<Card as="section">
			<p class="detail-page__label">Origin</p>
			<strong>{data.route.origin.name}</strong>
			<span>{data.route.origin.code}</span>
		</Card>
		<Card as="section">
			<p class="detail-page__label">Destination</p>
			<strong>{data.route.destination.name}</strong>
			<span>{data.route.destination.code}</span>
		</Card>
		<Card as="section">
			<p class="detail-page__label">Durasi perkiraan</p>
			<strong>{data.route.estimatedDurationMinutes ?? 'Belum diisi'} menit</strong>
		</Card>
		<Card as="section">
			<p class="detail-page__label">Biaya dasar</p>
			<strong>Rp {formatMoney(data.route.baseFee)}</strong>
		</Card>
	</div>

	<Card as="section">
		<div class="detail-page__section-head">
			<div>
				<h2>Jadwal route</h2>
				<p>Jadwal aktif per hari dan waktu keberangkatan.</p>
			</div>
			{#if data.canEdit}
				<a class="button button-primary" href={resolve(`/app/routes/${data.route.id}/schedules/new`)}>
					Tambah jadwal
				</a>
			{/if}
		</div>

		{#if data.route.schedules.length === 0}
			<EmptyState
				title="Belum ada jadwal"
				description="Tambahkan jadwal keberangkatan untuk route ini agar operasional lebih mudah disusun."
			>
				{#if data.canEdit}
					<a class="button button-primary" href={resolve(`/app/routes/${data.route.id}/schedules/new`)}>
						Tambah jadwal
					</a>
				{/if}
			</EmptyState>
		{:else}
			<div class="detail-table">
				<table class="master-table">
					<caption class="sr-only">Jadwal route {data.route.name}</caption>
					<thead>
						<tr>
							<th>Hari</th>
							<th>Waktu</th>
							<th>Status</th>
							<th>Catatan</th>
							<th class="master-table__action">Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each data.route.schedules as schedule (schedule.id)}
							<tr>
								<td>{ROUTE_DAY_LABELS[schedule.dayOfWeek]}</td>
								<td class="master-table__code">{schedule.departureTime.slice(0, 5)}</td>
								<td>
									<Badge tone={schedule.isActive ? 'success' : 'neutral'}>
										{schedule.isActive ? 'Aktif' : 'Nonaktif'}
									</Badge>
								</td>
								<td>{schedule.notes ?? '-'}</td>
								<td class="master-table__action">
									{#if data.canEdit}
										<a
											class="button button-secondary"
											href={resolve(`/app/routes/${data.route.id}/schedules/${schedule.id}/edit`)}
										>
											Ubah
										</a>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</Card>

	<Card as="section">
		<div class="detail-page__section-head">
			<div>
				<h2>Tarif route</h2>
				<p>Tarif aktif dan historis per jenis layanan.</p>
			</div>
			{#if data.canEdit}
				<a class="button button-primary" href={resolve(`/app/routes/${data.route.id}/tariffs/new`)}>
					Tambah tarif
				</a>
			{/if}
		</div>

		{#if data.route.tariffs.length === 0}
			<EmptyState
				title="Belum ada tarif"
				description="Tambahkan tarif route untuk jenis layanan yang tersedia."
			>
				{#if data.canEdit}
					<a class="button button-primary" href={resolve(`/app/routes/${data.route.id}/tariffs/new`)}>
						Tambah tarif
					</a>
				{/if}
			</EmptyState>
		{:else}
			<div class="detail-table">
				<table class="master-table">
					<caption class="sr-only">Tarif route {data.route.name}</caption>
					<thead>
						<tr>
							<th>Layanan</th>
							<th>Minimum</th>
							<th>Persen</th>
							<th>Efektif</th>
							<th>Status</th>
							<th class="master-table__action">Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each data.route.tariffs as tariff (tariff.id)}
							<tr>
								<td>
									<div class="master-table__primary">
										<strong>{ROUTE_SERVICE_LABELS[tariff.serviceType]}</strong>
										<span>{tariff.serviceType}</span>
									</div>
								</td>
								<td>Rp {formatMoney(tariff.minimumServiceFee)}</td>
								<td>{tariff.percentageFee}%</td>
								<td>
									<div class="master-table__primary">
										<strong>{tariff.effectiveFrom}</strong>
										<span>{tariff.effectiveUntil ?? 'Berjalan'}</span>
									</div>
								</td>
								<td>
									<Badge tone={tariff.isActive ? 'success' : 'neutral'}>
										{tariff.isActive ? 'Aktif' : 'Nonaktif'}
									</Badge>
								</td>
								<td class="master-table__action">
									{#if data.canEdit}
										<a
											class="button button-secondary"
											href={resolve(`/app/routes/${data.route.id}/tariffs/${tariff.id}/edit`)}
										>
											Ubah
										</a>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</Card>

	<Card as="section">
		<Alert tone={data.route.isActive ? 'info' : 'warning'} title="Catatan route">
			Route ini digunakan sebagai sumber data operasional untuk batch dan pesanan. Jadwal dan tarif
			hanya boleh dikelola oleh owner.
		</Alert>
		<div class="button-row">
			<a class="button button-secondary" href={resolve('/app/routes')}>Kembali</a>
			{#if data.canEdit}
				<a class="button button-primary" href={resolve(`/app/routes/${data.route.id}/edit`)}>
					Ubah route
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
		display: block;
		margin-top: 0.25rem;
		font-size: 1.125rem;
		color: var(--ink-950);
	}

	.detail-page__summary span {
		font-size: 0.875rem;
		color: var(--ink-500);
	}

	.detail-page__section-head {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: start;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.detail-page__section-head h2 {
		margin: 0;
		font-size: 1rem;
		color: var(--ink-950);
	}

	.detail-page__section-head p {
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
		color: var(--ink-500);
	}

	.detail-table {
		overflow-x: auto;
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

	.master-table__code {
		font-variant-numeric: tabular-nums;
	}

	.master-table__action {
		width: 1%;
		white-space: nowrap;
	}

	@media (max-width: 720px) {
		.detail-page__summary {
			grid-template-columns: 1fr;
		}
	}
</style>
