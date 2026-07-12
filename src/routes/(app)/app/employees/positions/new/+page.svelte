<script lang="ts">
	import type { ActionData } from './$types';
	import { resolve } from '$app/paths';

	import Alert from '$lib/components/ui/Alert.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import PageHeader from '$lib/components/app-shell/PageHeader.svelte';
	import Select from '$lib/components/ui/Select.svelte';

	let { form }: { form: ActionData } = $props();

	const statusOptions = [
		{ value: 'true', label: 'Aktif' },
		{ value: 'false', label: 'Nonaktif' }
	];
</script>

<svelte:head>
	<title>Jabatan baru | Yukatitip</title>
</svelte:head>

<section class="master-form-page">
	<PageHeader
		eyebrow="Organisasi"
		title="Jabatan baru"
		description="Tambahkan jabatan kerja yang tidak mencampur role aplikasi."
	/>

	{#if form?.error}
		<Alert tone="danger" title="Gagal menyimpan">
			{form.error}
		</Alert>
	{/if}

	<form class="master-form" method="POST">
		<Card as="section">
			<div class="master-form__grid">
				<Input label="Kode" name="code" value={form?.values?.code ?? ''} required />
				<Input label="Nama" name="name" value={form?.values?.name ?? ''} required />
				<Input label="Level" name="level" type="number" value={form?.values?.level ?? '1'} required />
				<Input label="Deskripsi" name="description" value={form?.values?.description ?? ''} />
				<Select label="Status" name="isActive" value={form?.values?.isActive === false ? 'false' : 'true'}>
					{#each statusOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</Select>
			</div>

			<div class="button-row">
				<a class="button button-secondary" href={resolve('/app/employees/positions')}>Batal</a>
				<Button type="submit">Simpan jabatan</Button>
			</div>
		</Card>
	</form>
</section>

<style>
	.master-form-page {
		display: grid;
		gap: 1rem;
	}

	.master-form {
		display: grid;
		gap: 1rem;
	}

	.master-form__grid {
		display: grid;
		gap: 1rem;
	}

	@media (min-width: 960px) {
		.master-form__grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
