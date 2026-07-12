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

	const branchStateOptions = [
		{ value: 'true', label: 'Aktif' },
		{ value: 'false', label: 'Nonaktif' }
	];
</script>

<svelte:head>
	<title>Ubah cabang | Yukatitip</title>
</svelte:head>

<section class="master-form-page">
	<PageHeader
		eyebrow="Data"
		title={`Ubah ${data.branch.name}`}
		description="Perbarui cabang tanpa kehilangan histori relasi yang sudah tersimpan."
	/>

	{#if form?.error}
		<Alert tone="danger" title="Gagal menyimpan">
			{form.error}
		</Alert>
	{/if}

	<form class="master-form" method="POST">
		<Card as="section">
			<input type="hidden" name="expectedUpdatedAt" value={data.branch.updatedAt} />

			<div class="master-form__grid">
				<Input
					label="Kode cabang"
					name="code"
					value={form?.values?.code ?? data.branch.code}
					required
				/>
				<Input
					label="Nama cabang"
					name="name"
					value={form?.values?.name ?? data.branch.name}
					required
				/>
				<Input
					label="Kota"
					name="city"
					value={form?.values?.city ?? data.branch.city}
					required
				/>
				<Input
					label="Alamat"
					name="address"
					value={form?.values?.address ?? data.branch.address ?? ''}
				/>
				<Input
					label="WhatsApp"
					name="whatsapp"
					value={form?.values?.whatsapp ?? data.branch.whatsapp ?? ''}
				/>
				<Input
					label="Google Maps"
					name="mapsUrl"
					value={form?.values?.mapsUrl ?? data.branch.mapsUrl ?? ''}
				/>
				<Input
					label="Jam operasional"
					name="openingHours"
					value={form?.values?.openingHours ?? data.branch.openingHours ?? ''}
				/>
				<Select
					label="Status"
					name="isActive"
					value={form?.values?.isActive === false ? 'false' : data.branch.isActive ? 'true' : 'false'}
				>
					{#each branchStateOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</Select>
			</div>

			<div class="master-form__grid master-form__grid--single">
				<Select
					label="Kepala cabang"
					name="headEmployeeId"
					value={form?.values?.headEmployeeId ?? data.branch.headEmployee?.id ?? ''}
				>
					<option value="">Belum ditetapkan</option>
					{#each data.headEmployeeOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</Select>
				<p class="master-form__hint">
					Kepala cabang harus aktif, berasal dari cabang yang sama, dan memiliki jabatan branch
					manager.
				</p>
			</div>

			<div class="button-row">
				<a class="button button-secondary" href={resolve(`/app/branches/${data.branch.id}`)}>Batal</a>
				<Button type="submit">Simpan perubahan</Button>
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
