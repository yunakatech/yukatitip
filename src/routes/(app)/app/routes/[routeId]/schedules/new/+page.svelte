<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { resolve } from '$app/paths';

	import Alert from '$lib/components/ui/Alert.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import PageHeader from '$lib/components/app-shell/PageHeader.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { ROUTE_DAY_LABELS } from '$lib/constants/routes';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const statusOptions = [
		{ value: 'true', label: 'Aktif' },
		{ value: 'false', label: 'Nonaktif' }
	];
</script>

<svelte:head>
	<title>Jadwal baru | Yukatitip</title>
</svelte:head>

<section class="master-form-page">
	<PageHeader
		eyebrow="Data"
		title={`Tambah jadwal ${data.route.name}`}
		description="Tambahkan jadwal keberangkatan untuk route aktif ini."
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
					label="Hari"
					name="dayOfWeek"
					value={form?.values?.dayOfWeek ?? 1}
					error={form?.fieldErrors?.dayOfWeek?.[0]}
					required
				>
					{#each ROUTE_DAY_LABELS as label, index (label)}
						<option value={index}>{label}</option>
					{/each}
				</Select>
				<Input
					label="Waktu keberangkatan"
					name="departureTime"
					type="time"
					value={form?.values?.departureTime ?? ''}
					error={form?.fieldErrors?.departureTime?.[0]}
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
				<Input
					label="Catatan"
					name="notes"
					value={form?.values?.notes ?? ''}
					error={form?.fieldErrors?.notes?.[0]}
				/>
			</div>

			<div class="button-row">
				<a class="button button-secondary" href={resolve(`/app/routes/${data.route.id}`)}>Batal</a>
				<Button type="submit">Simpan jadwal</Button>
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
