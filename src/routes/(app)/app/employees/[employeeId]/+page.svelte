<script lang="ts">
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';

	import Alert from '$lib/components/ui/Alert.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import PageHeader from '$lib/components/app-shell/PageHeader.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.employee.fullName} | Karyawan Yukatitip</title>
</svelte:head>

<section class="detail-page">
	<PageHeader
		eyebrow="Organisasi"
		title={data.employee.fullName}
		description="Rincian karyawan internal dan relasi cabang yang digunakan operasional."
	/>

	<div class="detail-page__status">
		<Badge tone={data.employee.employmentStatus === 'active' ? 'success' : 'neutral'}>
			{data.employee.employmentStatus}
		</Badge>
		<Badge tone="brand">{data.employee.employeeNumber}</Badge>
	</div>

	<div class="detail-page__summary">
		<Card as="section">
			<p class="detail-page__label">Cabang</p>
			<strong>{data.employee.branch?.name ?? 'Belum ditetapkan'}</strong>
		</Card>
		<Card as="section">
			<p class="detail-page__label">Jabatan</p>
			<strong>{data.employee.position?.name ?? 'Belum ditetapkan'}</strong>
		</Card>
		<Card as="section">
			<p class="detail-page__label">Supervisor</p>
			<strong>{data.employee.supervisor?.fullName ?? 'Belum ditetapkan'}</strong>
		</Card>
		<Card as="section">
			<p class="detail-page__label">Bergabung</p>
			<strong>{data.employee.joinDate}</strong>
		</Card>
	</div>

	<Card as="section">
		<div class="detail-page__section-head">
			<div>
				<h2>Histori penempatan</h2>
				<p>Urutan cabang dan jabatan yang pernah berlaku untuk karyawan ini.</p>
			</div>
		</div>

		{#if data.employee.assignments.length === 0}
			<EmptyState
				title="Belum ada histori penempatan"
				description="Assignment pertama akan muncul setelah data karyawan disimpan."
			/>
		{:else}
			<div class="detail-table">
				<table class="master-table">
					<caption class="sr-only">Histori penempatan {data.employee.fullName}</caption>
					<thead>
						<tr>
							<th>Cabang</th>
							<th>Jabatan</th>
							<th>Mulai</th>
							<th>Sampai</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{#each data.employee.assignments as assignment (assignment.id)}
							<tr>
								<td>
									<div class="master-table__primary">
										<strong>{assignment.branch?.name ?? 'Cabang tidak diketahui'}</strong>
										<span>{assignment.branch?.code ?? '-'}</span>
									</div>
								</td>
								<td>
									<div class="master-table__primary">
										<strong>{assignment.position?.name ?? 'Jabatan tidak diketahui'}</strong>
										<span>{assignment.position?.code ?? '-'}</span>
									</div>
								</td>
								<td>{assignment.effectiveFrom}</td>
								<td>{assignment.effectiveUntil ?? 'Berjalan'}</td>
								<td>
									<Badge tone={assignment.isCurrent ? 'success' : 'neutral'}>
										{assignment.isCurrent ? 'Aktif' : 'Histori'}
									</Badge>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</Card>

	<Card as="section">
		<div class="detail-page__grid">
			<div>
				<p class="detail-page__label">Telepon</p>
				<p>{data.employee.phone ?? 'Belum diisi'}</p>
			</div>
			<div>
				<p class="detail-page__label">Email</p>
				<p>{data.employee.email ?? 'Belum diisi'}</p>
			</div>
			<div>
				<p class="detail-page__label">Alamat</p>
				<p>{data.employee.address ?? 'Belum diisi'}</p>
			</div>
			<div>
				<p class="detail-page__label">Bank</p>
				<p>{data.employee.bankName ?? 'Belum diisi'}</p>
			</div>
			<div>
				<p class="detail-page__label">Rekening</p>
				<p>{data.employee.bankAccountMasked ?? 'Belum diisi'}</p>
			</div>
			<div>
				<p class="detail-page__label">Catatan</p>
				<p>{data.employee.notes ?? 'Belum diisi'}</p>
			</div>
		</div>
	</Card>

	<Card as="section">
		<Alert tone="info" title="Aksi karyawan">
			Karyawan dinonaktifkan tanpa menghapus histori. Akun Supabase Auth tidak dibuat otomatis.
		</Alert>
		<div class="button-row">
			<a class="button button-secondary" href={resolve('/app/employees')}>Kembali</a>
			{#if data.canEdit}
				<a class="button button-primary" href={resolve(`/app/employees/${data.employee.id}/edit`)}>
					Ubah karyawan
				</a>
				<form method="POST" action={resolve(`/app/employees/${data.employee.id}/deactivate`)}>
					<Button variant="danger" type="submit">Nonaktifkan</Button>
				</form>
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
