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

	const branchStateOptions = [
		{ value: 'true', label: 'Aktif' },
		{ value: 'false', label: 'Nonaktif' }
	];
</script>

<svelte:head>
	<title>Cabang baru | Yukatitip</title>
</svelte:head>

<section class="master-form-page">
	<PageHeader
		eyebrow="Data"
		title="Cabang baru"
		description="Tambahkan cabang operasional baru tanpa mengubah data cabang yang sudah berjalan."
	/>

	{#if form?.error}
		<Alert tone="danger" title="Gagal menyimpan">
			{form.error}
		</Alert>
	{/if}

	<form class="master-form" method="POST">
		<Card as="section">
			<div class="master-form__grid">
				<Input label="Kode cabang" name="code" value={form?.values?.code ?? ''} required />
				<Input label="Nama cabang" name="name" value={form?.values?.name ?? ''} required />
				<Input label="Kota" name="city" value={form?.values?.city ?? ''} required />
				<Input label="Alamat" name="address" value={form?.values?.address ?? ''} />
				<Input label="WhatsApp" name="whatsapp" value={form?.values?.whatsapp ?? ''} />
				<Input label="Google Maps" name="mapsUrl" value={form?.values?.mapsUrl ?? ''} />
				<Input label="Jam operasional" name="openingHours" value={form?.values?.openingHours ?? ''} />
				<Select label="Status" name="isActive" value={form?.values?.isActive === false ? 'false' : 'true'}>
					{#each branchStateOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</Select>
			</div>

			<div class="master-form__grid master-form__grid--single">
				<Select label="Kepala cabang" name="headEmployeeId" value={form?.values?.headEmployeeId ?? ''}>
					<option value="">Belum ditetapkan</option>
				</Select>
				<p class="master-form__hint">
					Kepala cabang baru bisa dipilih setelah karyawan branch manager untuk cabang ini tersedia.
				</p>
			</div>

			<div class="button-row">
				<a class="button button-secondary" href={resolve('/app/branches')}>Batal</a>
				<Button type="submit">Simpan cabang</Button>
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

	.master-form__grid--single {
		max-width: 36rem;
	}

	.master-form__hint {
		margin: 0;
		font-size: 0.8125rem;
		line-height: 1.5;
		color: var(--ink-500);
	}

	@media (min-width: 960px) {
		.master-form__grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
