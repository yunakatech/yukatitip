<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	import Alert from '$lib/components/ui/Alert.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import PageHeader from '$lib/components/app-shell/PageHeader.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.employee.fullName} | Histori Penempatan</title>
</svelte:head>

<section class="assignment-page">
	<PageHeader
		eyebrow="Organisasi"
		title={`Histori penempatan ${data.employee.fullName}`}
		description="Riwayat cabang, jabatan, supervisor, alasan, dan aktor yang mengubah penempatan."
	/>

	<div class="assignment-page__status">
		<Badge tone={data.employee.employmentStatus === 'active' ? 'success' : 'neutral'}>
			{data.employee.employmentStatus}
		</Badge>
		<Badge tone="brand">{data.employee.employeeNumber}</Badge>
	</div>

	{#if data.closeError}
		<Alert tone="danger" title="Gagal menutup penempatan">
			{data.closeError}
		</Alert>
	{/if}

	<div class="assignment-page__summary">
		<Card as="section">
			<p class="assignment-page__label">Cabang saat ini</p>
			<strong>{data.employee.branch?.name ?? 'Belum ditetapkan'}</strong>
		</Card>
		<Card as="section">
			<p class="assignment-page__label">Jabatan saat ini</p>
			<strong>{data.employee.position?.name ?? 'Belum ditetapkan'}</strong>
		</Card>
		<Card as="section">
			<p class="assignment-page__label">Supervisor saat ini</p>
			<strong>{data.employee.supervisor?.fullName ?? 'Belum ditetapkan'}</strong>
		</Card>
		<Card as="section">
			<p class="assignment-page__label">Penempatan aktif</p>
			<strong>{data.employee.assignments.find((assignment) => assignment.isCurrent)?.effectiveFrom ?? 'Belum ada'}</strong>
		</Card>
	</div>

	<Card as="section">
		<div class="assignment-page__section-head">
			<div>
				<h2>Daftar histori</h2>
				<p>Assignment aktif dan historis tampil dari yang paling baru.</p>
			</div>
			{#if data.canManageAssignments}
				<a class="button button-primary" href={resolve(`/app/employees/${data.employee.id}/assignments/new`)}>
					Tambah penempatan
				</a>
			{/if}
		</div>

		{#if data.employee.assignments.length === 0}
			<EmptyState
				title="Belum ada histori penempatan"
				description="Penempatan pertama akan muncul setelah data karyawan disimpan."
			>
				{#if data.canManageAssignments}
					<a class="button button-primary" href={resolve(`/app/employees/${data.employee.id}/assignments/new`)}>
						Tambah penempatan
					</a>
				{/if}
			</EmptyState>
		{:else}
			<div class="assignment-table">
				<table class="master-table">
					<caption class="sr-only">Histori penempatan {data.employee.fullName}</caption>
					<thead>
						<tr>
							<th>Cabang</th>
							<th>Jabatan</th>
							<th>Supervisor</th>
							<th>Mulai</th>
							<th>Selesai</th>
							<th>Status</th>
							<th>Alasan</th>
							<th>Actor</th>
							<th>Waktu</th>
							<th>Aksi</th>
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
								<td>{assignment.supervisor?.fullName ?? 'Tanpa supervisor'}</td>
								<td>{assignment.effectiveFrom}</td>
								<td>{assignment.effectiveUntil ?? 'Berjalan'}</td>
								<td>
									<Badge tone={assignment.isCurrent ? 'success' : 'neutral'}>
										{assignment.isCurrent ? 'Aktif' : 'Histori'}
									</Badge>
								</td>
								<td>{assignment.reason}</td>
								<td>{assignment.actor?.fullName ?? '-'}</td>
								<td>{assignment.updatedAt}</td>
								<td>
									<div class="assignment-page__actions">
										<a
											class="button button-secondary button-small"
											href={resolve(`/app/employees/${data.employee.id}/assignments/${assignment.id}`)}
										>
											Detail
										</a>
								{#if data.canManageAssignments && assignment.isCurrent}
											<a
												class="button button-secondary button-small"
												href={resolve(
													`/app/employees/${data.employee.id}/assignments/${assignment.id}/edit`
												)}
											>
												Ubah
											</a>
											<form
												method="POST"
												action={resolve(
													`/app/employees/${data.employee.id}/assignments/${assignment.id}/close`
												)}
											>
												<input type="hidden" name="expectedUpdatedAt" value={assignment.updatedAt} />
												<Button variant="danger" size="sm" type="submit">Tutup</Button>
											</form>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</Card>

	<Card as="section">
		<Alert tone="info" title="Aturan penempatan">
			Assignment lama tidak dihapus. Perubahan penempatan wajib menyimpan histori dan sinkron dengan state karyawan.
		</Alert>
		<div class="button-row">
			<a class="button button-secondary" href={resolve(`/app/employees/${data.employee.id}`)}>Kembali</a>
		</div>
	</Card>
</section>

<style>
	.assignment-page {
		display: grid;
		gap: 1rem;
	}

	.assignment-page__status {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.assignment-page__summary {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}

	.assignment-page__label {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-500);
	}

	.assignment-page__summary strong {
		font-size: 1.125rem;
		color: var(--ink-950);
	}

	.assignment-page__section-head {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: start;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.assignment-page__section-head h2 {
		margin: 0;
		font-size: 1rem;
		color: var(--ink-950);
	}

	.assignment-page__section-head p {
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
		color: var(--ink-500);
	}

	.assignment-table {
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

	.assignment-page__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}

	.button-small {
		min-height: 2.25rem;
		padding-inline: 0.75rem;
		font-size: 0.8125rem;
	}

	@media (max-width: 900px) {
		.assignment-page__summary {
			grid-template-columns: 1fr;
		}
	}
</style>
