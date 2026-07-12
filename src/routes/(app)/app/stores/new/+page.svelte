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
	<title>Toko baru | Yukatitip</title>
</svelte:head>

<section class="master-form-page">
	<PageHeader
		eyebrow="Data"
		title="Toko baru"
		description="Tambahkan toko internal tanpa membuat katalog produk atau inventori."
	/>

	{#if form?.error}
		<Alert tone="danger" title="Gagal menyimpan">
			{form.error}
		</Alert>
	{/if}

	<form class="master-form" method="POST">
		<Card as="section">
			<div class="master-form__grid">
				{#if data.branchOptions.length > 0}
					<Select
						label="Cabang"
						name="branchId"
						value={form?.values?.branchId ?? data.branchOptions[0]?.value ?? ''}
					>
						{#each data.branchOptions as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</Select>
				{/if}
				<Input label="Nama toko" name="name" value={form?.values?.name ?? ''} required />
				<Input label="Alamat" name="address" value={form?.values?.address ?? ''} />
				<Input label="Kota" name="city" value={form?.values?.city ?? ''} required />
				<Input label="Nomor kontak" name="phone" value={form?.values?.phone ?? ''} />
				<Input label="Tautan peta" name="mapsUrl" value={form?.values?.mapsUrl ?? ''} />
				<Input label="Jam operasional" name="openingHours" value={form?.values?.openingHours ?? ''} />
				<Input label="Catatan" name="notes" value={form?.values?.notes ?? ''} />
				<Select label="Status" name="isActive" value={form?.values?.isActive === false ? 'false' : 'true'}>
					{#each statusOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</Select>
			</div>

			<div class="button-row">
				<a class="button button-secondary" href={resolve('/app/stores')}>Batal</a>
				<Button type="submit">Simpan toko</Button>
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
