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

	const customerTypeOptions = [
		{ value: 'individual', label: 'Perorangan' },
		{ value: 'business', label: 'Bisnis' },
		{ value: 'reseller', label: 'Reseller' }
	];

	const statusOptions = [
		{ value: 'active', label: 'Aktif' },
		{ value: 'inactive', label: 'Nonaktif' },
		{ value: 'suspended', label: 'Disuspensi' }
	];
</script>

<svelte:head>
	<title>Ubah customer | Yukatitip</title>
</svelte:head>

<section class="master-form-page">
	<PageHeader
		eyebrow="Data"
		title={`Ubah ${data.customer.name}`}
		description="Perbarui customer tanpa membuat akun baru dan tanpa mengubah histori pesanan."
	/>

	{#if form?.error}
		<Alert tone="danger" title="Gagal menyimpan">
			{form.error}
		</Alert>
	{/if}

	<form class="master-form" method="POST">
		<Card as="section">
			<input type="hidden" name="expectedUpdatedAt" value={data.customer.updatedAt} />

			<div class="master-form__grid">
				{#if data.branchOptions.length > 0}
					<Select
						label="Cabang utama"
						name="homeBranchId"
						value={form?.values?.homeBranchId ?? data.customer.homeBranch?.id ?? ''}
						required
					>
						{#each data.branchOptions as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</Select>
				{/if}
				<Input
					label="Nama customer"
					name="name"
					value={form?.values?.name ?? data.customer.name}
					required
				/>
				<Input
					label="Nomor WhatsApp"
					name="phone"
					value={form?.values?.phone ?? data.customer.phone}
					required
				/>
				<Input
					label="Email"
					name="email"
					type="email"
					value={form?.values?.email ?? data.customer.email ?? ''}
				/>
				<Select
					label="Tipe customer"
					name="customerType"
					value={form?.values?.customerType ?? data.customer.customerType}
				>
					{#each customerTypeOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</Select>
				<Select label="Status" name="status" value={form?.values?.status ?? data.customer.status}>
					{#each statusOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</Select>
				<Input
					label="Alamat"
					name="address"
					value={form?.values?.address ?? data.customer.address ?? ''}
				/>
				<Input
					label="Kecamatan"
					name="district"
					value={form?.values?.district ?? data.customer.district ?? ''}
				/>
				<Input label="Kota" name="city" value={form?.values?.city ?? data.customer.city ?? ''} />
				<Input
					label="Patokan"
					name="landmark"
					value={form?.values?.landmark ?? data.customer.landmark ?? ''}
				/>
				<Input label="Catatan" name="notes" value={form?.values?.notes ?? data.customer.notes ?? ''} />
			</div>

			<div class="button-row">
				<a class="button button-secondary" href={resolve(`/app/customers/${data.customer.id}`)}>Batal</a>
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

	@media (min-width: 960px) {
		.master-form__grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
