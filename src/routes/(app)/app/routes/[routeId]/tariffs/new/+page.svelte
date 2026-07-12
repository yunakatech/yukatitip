<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { resolve } from '$app/paths';

	import Alert from '$lib/components/ui/Alert.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import PageHeader from '$lib/components/app-shell/PageHeader.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { ROUTE_SERVICE_LABELS } from '$lib/constants/routes';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const statusOptions = [
		{ value: 'true', label: 'Aktif' },
		{ value: 'false', label: 'Nonaktif' }
	];
</script>

<svelte:head>
	<title>Tarif baru | Yukatitip</title>
</svelte:head>

<section class="master-form-page">
	<PageHeader
		eyebrow="Data"
		title={`Tambah tarif ${data.route.name}`}
		description="Tambahkan tarif efektif untuk jenis layanan route aktif ini."
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
					label="Jenis layanan"
					name="serviceType"
					value={form?.values?.serviceType ?? 'purchase'}
					error={form?.fieldErrors?.serviceType?.[0]}
					required
				>
					{#each Object.entries(ROUTE_SERVICE_LABELS) as [value, label] (value)}
						<option value={value}>{label}</option>
					{/each}
				</Select>
				<Input
					label="Biaya minimum layanan"
					name="minimumServiceFee"
					type="number"
					min="0"
					step="1"
					value={form?.values?.minimumServiceFee ?? 0}
					error={form?.fieldErrors?.minimumServiceFee?.[0]}
				/>
				<Input
					label="Persentase biaya"
					name="percentageFee"
					type="number"
					min="0"
					max="100"
					step="0.01"
					value={form?.values?.percentageFee ?? 0}
					error={form?.fieldErrors?.percentageFee?.[0]}
				/>
				<Input
					label="Biaya antar lokal"
					name="localDeliveryFee"
					type="number"
					min="0"
					step="1"
					value={form?.values?.localDeliveryFee ?? 0}
					error={form?.fieldErrors?.localDeliveryFee?.[0]}
				/>
				<Input
					label="Biaya penanganan"
					name="handlingFee"
					type="number"
					min="0"
					step="1"
					value={form?.values?.handlingFee ?? 0}
					error={form?.fieldErrors?.handlingFee?.[0]}
				/>
				<Input
					label="Tanggal mulai"
					name="effectiveFrom"
					type="date"
					value={form?.values?.effectiveFrom ?? ''}
					error={form?.fieldErrors?.effectiveFrom?.[0]}
					required
				/>
				<Input
					label="Tanggal akhir"
					name="effectiveUntil"
					type="date"
					value={form?.values?.effectiveUntil ?? ''}
					error={form?.fieldErrors?.effectiveUntil?.[0]}
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
				<a class="button button-secondary" href={resolve(`/app/routes/${data.route.id}`)}>Batal</a>
				<Button type="submit">Simpan tarif</Button>
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
