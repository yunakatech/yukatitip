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
		{ value: 'active', label: 'Aktif' },
		{ value: 'inactive', label: 'Nonaktif' },
		{ value: 'suspended', label: 'Disuspensi' },
		{ value: 'resigned', label: 'Resign' }
	];
</script>

<svelte:head>
	<title>Ubah karyawan | Yukatitip</title>
</svelte:head>

<section class="master-form-page">
	<PageHeader
		eyebrow="Organisasi"
		title={`Ubah ${data.employee.fullName}`}
		description="Perbarui data karyawan tanpa membuat akun Supabase Auth baru."
	/>

	{#if form?.error}
		<Alert tone="danger" title="Gagal menyimpan">
			{form.error}
		</Alert>
	{/if}

	<form class="master-form" method="POST">
		<Card as="section">
			<input type="hidden" name="expectedUpdatedAt" value={data.employee.updatedAt} />

			<div class="master-form__grid">
				{#if data.branchOptions.length > 0}
					<Select label="Cabang" name="branchId" value={form?.values?.branchId ?? data.employee.branch?.id ?? ''} required>
						{#each data.branchOptions as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</Select>
				{/if}
				{#if data.positionOptions.length > 0}
					<Select label="Jabatan" name="positionId" value={form?.values?.positionId ?? data.employee.position?.id ?? ''} required>
						{#each data.positionOptions as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</Select>
				{/if}
				<Input label="Nomor karyawan" name="employeeNumber" value={form?.values?.employeeNumber ?? data.employee.employeeNumber} required />
				<Input label="Nama lengkap" name="fullName" value={form?.values?.fullName ?? data.employee.fullName} required />
				<Input label="Telepon" name="phone" value={form?.values?.phone ?? data.employee.phone ?? ''} />
				<Input label="Email" name="email" type="email" value={form?.values?.email ?? data.employee.email ?? ''} />
				<Input label="Alamat" name="address" value={form?.values?.address ?? data.employee.address ?? ''} />
				<Select label="Supervisor" name="supervisorEmployeeId" value={form?.values?.supervisorEmployeeId ?? data.employee.supervisor?.id ?? ''}>
					<option value="">Belum ditetapkan</option>
					{#each data.supervisorOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</Select>
				<Input label="Tanggal bergabung" name="joinDate" type="date" value={form?.values?.joinDate ?? data.employee.joinDate} required />
				<Input label="Nama bank" name="bankName" value={form?.values?.bankName ?? data.employee.bankName ?? ''} />
				<Input label="Rekening bank" name="bankAccount" value={form?.values?.bankAccount ?? ''} />
				<Select label="Status" name="employmentStatus" value={form?.values?.employmentStatus ?? data.employee.employmentStatus}>
					{#each statusOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</Select>
				<Input label="Catatan" name="notes" value={form?.values?.notes ?? data.employee.notes ?? ''} />
			</div>

			<div class="button-row">
				<a class="button button-secondary" href={resolve(`/app/employees/${data.employee.id}`)}>Batal</a>
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
