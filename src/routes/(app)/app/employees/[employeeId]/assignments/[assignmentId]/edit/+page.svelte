<script lang="ts">
	import type { Pathname } from '$app/types';
	import type { ActionData, PageData } from './$types';

	import AssignmentForm from '$lib/components/domain/employee-assignments/AssignmentForm.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import PageHeader from '$lib/components/app-shell/PageHeader.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Ubah penempatan | {data.employee.fullName}</title>
</svelte:head>

<section class="assignment-page">
	<PageHeader
		eyebrow="Organisasi"
		title={`Ubah penempatan ${data.employee.fullName}`}
		description="Perbaiki histori penempatan tanpa menghapus jejak perubahan sebelumnya."
	/>

	<div class="assignment-page__status">
		<Badge tone={data.assignment.isCurrent ? 'success' : 'neutral'}>
			{data.assignment.isCurrent ? 'Aktif' : 'Histori'}
		</Badge>
		<Badge tone="brand">{data.employee.employeeNumber}</Badge>
	</div>

	<Card as="section">
		<Alert tone="info" title="Aturan perubahan">
			Assignment historis yang sudah berakhir tidak dapat diubah. Koreksi hanya berlaku untuk penempatan yang masih efektif.
		</Alert>
	</Card>

	<AssignmentForm
		title="Form koreksi penempatan"
		description="Gunakan form ini untuk mengoreksi cabang, jabatan, supervisor, atau tanggal efektif."
		submitLabel="Simpan perubahan"
		cancelHref={`/app/employees/${data.employee.id}/assignments/${data.assignment.id}` as Pathname}
		employeeId={data.employee.id}
		assignmentId={data.assignment.id}
		values={form?.values ?? data.defaults}
		branchOptions={data.branchOptions}
		positionOptions={data.positionOptions}
		supervisorOptions={data.supervisorOptions}
		errorMessage={form?.error}
		fieldErrors={form?.fieldErrors}
	/>
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
</style>
