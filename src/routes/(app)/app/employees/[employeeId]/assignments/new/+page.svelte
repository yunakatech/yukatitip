<script lang="ts">
	import type { Pathname } from '$app/types';
	import type { ActionData, PageData } from './$types';

	import AssignmentForm from '$lib/components/domain/employee-assignments/AssignmentForm.svelte';
	import PageHeader from '$lib/components/app-shell/PageHeader.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Penempatan baru | {data.employee.fullName}</title>
</svelte:head>

<section class="assignment-page">
	<PageHeader
		eyebrow="Organisasi"
		title={`Penempatan baru ${data.employee.fullName}`}
		description="Tambahkan penempatan pertama atau mutasi cabang dengan histori yang tetap utuh."
	/>

	<AssignmentForm
		title="Form penempatan"
		description="Cabang, jabatan, dan supervisor disimpan sebagai histori yang dapat diaudit."
		submitLabel="Simpan penempatan"
		cancelHref={`/app/employees/${data.employee.id}/assignments` as Pathname}
		employeeId={data.employee.id}
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
</style>
