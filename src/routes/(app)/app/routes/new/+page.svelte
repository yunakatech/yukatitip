<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { resolve } from '$app/paths';

	import Alert from '$lib/components/ui/Alert.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import PageHeader from '$lib/components/app-shell/PageHeader.svelte';
	import Select from '$lib/components/ui/Select.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const statusOptions = [
		{ value: 'true', label: 'Aktif' },
		{ value: 'false', label: 'Nonaktif' }
	];
</script>

<svelte:head>
	<title>Rute baru | Yukatitip</title>
</svelte:head>

<section class="master-form-page">
	<PageHeader
		eyebrow="Data"
		title="Rute baru"
		description="Tambahkan arah perjalanan baru dengan origin, destination, dan biaya dasar."
	/>

	{#if form?.error}
		<Alert tone="danger" title="Gagal menyimpan">
			{form.error}
		</Alert>
	{/if}

	<form class="master-form" method="POST">
		<Card as="section">
			<div class="master-form__grid">
				<Select
					label="Origin"
					name="originBranchId"
					value={form?.values?.originBranchId ?? data.branchOptions[0]?.value ?? ''}
					error={form?.fieldErrors?.originBranchId?.[0]}
					required
				>
					<option value="">Pilih origin</option>
					{#each data.branchOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</Select>
				<Select
					label="Destination"
					name="destinationBranchId"
					value={form?.values?.destinationBranchId ?? data.branchOptions[1]?.value ?? ''}
					error={form?.fieldErrors?.destinationBranchId?.[0]}
					required
				>
					<option value="">Pilih destination</option>
					{#each data.branchOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</Select>
				<Input
					label="Nama rute"
					name="name"
					value={form?.values?.name ?? ''}
					error={form?.fieldErrors?.name?.[0]}
					hint="Kosongkan bila ingin mengikuti nama origin dan destination."
				/>
				<Input
					label="Durasi perkiraan (menit)"
					name="estimatedDurationMinutes"
					type="number"
					min="1"
					step="1"
					value={form?.values?.estimatedDurationMinutes ?? ''}
					error={form?.fieldErrors?.estimatedDurationMinutes?.[0]}
				/>
				<Input
					label="Biaya dasar"
					name="baseFee"
					type="number"
					min="0"
					step="1"
					value={form?.values?.baseFee ?? 0}
					error={form?.fieldErrors?.baseFee?.[0]}
					required
				/>
				<Select
					label="Status"
					name="isActive"
					value={form?.values?.isActive === false ? 'false' : 'true'}
					error={form?.fieldErrors?.isActive?.[0]}
				>
					{#each statusOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</Select>
			</div>

			<div class="button-row">
				<a class="button button-secondary" href={resolve('/app/routes')}>Batal</a>
				<Button type="submit">Simpan route</Button>
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
