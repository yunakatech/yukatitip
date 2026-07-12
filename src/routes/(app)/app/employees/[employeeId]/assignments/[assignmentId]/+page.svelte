<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	import Alert from '$lib/components/ui/Alert.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import PageHeader from '$lib/components/app-shell/PageHeader.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.employee.fullName} | Detail Assignment</title>
</svelte:head>

<section class="assignment-detail">
	<PageHeader
		eyebrow="Organisasi"
		title={`Detail penempatan ${data.employee.fullName}`}
		description="Detail penempatan aktif atau historis dengan jejak perubahan yang tersimpan."
	/>

	<div class="assignment-detail__status">
		<Badge tone={data.assignment.isCurrent ? 'success' : 'neutral'}>
			{data.assignment.isCurrent ? 'Aktif' : 'Histori'}
		</Badge>
		<Badge tone="brand">{data.employee.employeeNumber}</Badge>
	</div>

	<div class="assignment-detail__summary">
		<Card as="section">
			<p class="assignment-detail__label">Cabang</p>
			<strong>{data.assignment.branch?.name ?? 'Cabang tidak diketahui'}</strong>
		</Card>
		<Card as="section">
			<p class="assignment-detail__label">Jabatan</p>
			<strong>{data.assignment.position?.name ?? 'Jabatan tidak diketahui'}</strong>
		</Card>
		<Card as="section">
			<p class="assignment-detail__label">Supervisor</p>
			<strong>{data.assignment.supervisor?.fullName ?? 'Tanpa supervisor'}</strong>
		</Card>
		<Card as="section">
			<p class="assignment-detail__label">Mulai berlaku</p>
			<strong>{data.assignment.effectiveFrom}</strong>
		</Card>
	</div>

	<Card as="section">
		<div class="assignment-detail__grid">
			<div>
				<p class="assignment-detail__label">Selesai berlaku</p>
				<p>{data.assignment.effectiveUntil ?? 'Berjalan'}</p>
			</div>
			<div>
				<p class="assignment-detail__label">Alasan</p>
				<p>{data.assignment.reason}</p>
			</div>
			<div>
				<p class="assignment-detail__label">Diperbarui oleh</p>
				<p>{data.assignment.actor?.fullName ?? 'Tidak diketahui'}</p>
			</div>
			<div>
				<p class="assignment-detail__label">Waktu perubahan</p>
				<p>{data.assignment.updatedAt}</p>
			</div>
			<div>
				<p class="assignment-detail__label">Dibuat</p>
				<p>{data.assignment.createdAt}</p>
			</div>
			<div>
				<p class="assignment-detail__label">Status karyawan</p>
				<p>{data.employee.employmentStatus}</p>
			</div>
		</div>
	</Card>

	<Card as="section">
		<Alert tone="info" title="Catatan">
			Perubahan assignment disimpan sebagai histori terpisah agar jejak operasional dan audit tetap utuh.
		</Alert>

		<div class="button-row">
			<a class="button button-secondary" href={resolve(`/app/employees/${data.employee.id}/assignments`)}>
				Kembali
			</a>
			{#if data.canManageAssignments}
				{#if data.assignment.isCurrent}
					<a
						class="button button-primary"
						href={resolve(`/app/employees/${data.employee.id}/assignments/${data.assignment.id}/edit`)}
					>
						Ubah
					</a>
					<form
						method="POST"
						action={resolve(`/app/employees/${data.employee.id}/assignments/${data.assignment.id}/close`)}
					>
						<input type="hidden" name="expectedUpdatedAt" value={data.assignment.updatedAt} />
						<Button variant="danger" type="submit">Tutup penempatan</Button>
					</form>
				{/if}
			{/if}
		</div>
	</Card>
</section>

<style>
	.assignment-detail {
		display: grid;
		gap: 1rem;
	}

	.assignment-detail__status {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.assignment-detail__summary {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}

	.assignment-detail__grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}

	.assignment-detail__grid p,
	.assignment-detail__summary strong {
		margin: 0.2rem 0 0;
		line-height: 1.6;
	}

	.assignment-detail__label {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-500);
	}

	.assignment-detail__summary strong {
		font-size: 1.125rem;
		color: var(--ink-950);
	}

	@media (max-width: 720px) {
		.assignment-detail__summary,
		.assignment-detail__grid {
			grid-template-columns: 1fr;
		}
	}
</style>
