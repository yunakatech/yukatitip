<script lang="ts">
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';

	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import PageHeader from '$lib/components/app-shell/PageHeader.svelte';
	import Select from '$lib/components/ui/Select.svelte';

	let { data }: { data: PageData } = $props();

	const statusOptions = [
		{ value: '', label: 'Semua status' },
		{ value: 'active', label: 'Aktif' },
		{ value: 'inactive', label: 'Nonaktif' },
		{ value: 'suspended', label: 'Disuspensi' },
		{ value: 'resigned', label: 'Resign' }
	];

	const sortOptions = [
		{ value: 'createdAt', label: 'Terbaru' },
		{ value: '-createdAt', label: 'Terbaru dulu' },
		{ value: 'employeeNumber', label: 'Nomor' },
		{ value: 'fullName', label: 'Nama' },
		{ value: 'joinDate', label: 'Tanggal bergabung' }
	];

	const hasFilters = $derived(
		Boolean(data.filters.search || data.filters.status || data.filters.branchId || data.filters.sort !== 'createdAt')
	);
</script>

<svelte:head>
	<title>Karyawan | Yukatitip</title>
</svelte:head>

<section class="master-data-page">
	<PageHeader
		eyebrow="Organisasi"
		title="Karyawan"
		description="Kelola data karyawan internal, jabatan, dan cabang aktif tanpa membocorkan data sensitif."
	/>

	{#if data.canCreate}
		<div class="master-data-page__actions">
			<a class="button button-primary" href={resolve('/app/employees/new')}>Karyawan baru</a>
		</div>
	{/if}

	<Card as="section">
		<form class="master-toolbar" method="GET">
			<div class="master-toolbar__search">
				<Input
					label="Cari karyawan"
					name="search"
					value={data.filters.search}
					placeholder="Nomor, nama, telepon, atau email"
				/>
			</div>
			<div class="master-toolbar__filter">
				<Select label="Status" name="status" value={data.filters.status ?? ''}>
					{#each statusOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</Select>
			</div>
			{#if data.branchOptions.length > 0}
				<div class="master-toolbar__filter">
					<Select label="Cabang" name="branchId" value={data.filters.branchId ?? ''}>
						<option value="">Semua cabang</option>
						{#each data.branchOptions as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</Select>
				</div>
			{/if}
			<div class="master-toolbar__filter">
				<Select label="Urutkan" name="sort" value={data.filters.sort}>
					{#each sortOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</Select>
			</div>
			<div class="master-toolbar__submit">
				<Button type="submit">Terapkan</Button>
			</div>
		</form>
	</Card>

	{#if data.employees.length === 0}
		{#if hasFilters}
			<EmptyState
				title="Tidak ada karyawan yang cocok"
				description="Coba ubah filter atau kata kunci untuk menampilkan karyawan lainnya."
			/>
		{:else}
			<EmptyState
				title="Belum ada karyawan"
				description="Tambahkan karyawan pertama agar data operasional bisa dikelola."
			>
				{#if data.canCreate}
					<a class="button button-primary" href={resolve('/app/employees/new')}>Karyawan baru</a>
				{/if}
			</EmptyState>
		{/if}
	{:else}
		<Card as="section" padding="sm">
			<table class="master-table">
				<caption class="sr-only">Daftar karyawan Yukatitip</caption>
				<thead>
					<tr>
						<th>Nomor</th>
						<th>Nama</th>
						<th>Jabatan</th>
						<th>Cabang</th>
						<th>Status</th>
						<th class="master-table__action">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each data.employees as employee (employee.id)}
						<tr>
							<td class="master-table__code">{employee.employeeNumber}</td>
							<td>
								<div class="master-table__primary">
									<strong>{employee.fullName}</strong>
									<span>{employee.email ?? 'Email belum diisi'}</span>
								</div>
							</td>
							<td>{employee.position?.name ?? 'Jabatan belum diisi'}</td>
							<td>{employee.branch?.name ?? 'Cabang belum diisi'}</td>
							<td>
								<Badge tone={employee.employmentStatus === 'active' ? 'success' : 'neutral'}>
									{employee.employmentStatus}
								</Badge>
							</td>
							<td class="master-table__action">
								<div class="button-row">
									<a class="button button-secondary" href={resolve(`/app/employees/${employee.id}`)}>
										Detail
									</a>
									{#if data.canCreate}
										<a class="button button-ghost" href={resolve(`/app/employees/${employee.id}/edit`)}>
											Ubah
										</a>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</Card>
	{/if}
</section>

<style>
	.master-data-page {
		display: grid;
		gap: 1rem;
	}

	.master-data-page__actions {
		display: flex;
		justify-content: flex-end;
	}

	.master-toolbar {
		display: grid;
		gap: 1rem;
	}

	.master-toolbar__submit {
		display: flex;
		align-items: end;
	}

	.master-table {
		width: 100%;
		border-collapse: collapse;
	}

	.master-table th,
	.master-table td {
		border-bottom: 1px solid var(--line-200);
		padding: 0.875rem 0.75rem;
		vertical-align: top;
		text-align: left;
	}

	.master-table th {
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-500);
	}

	.master-table td {
		font-size: 0.9375rem;
		color: var(--ink-800);
	}

	.master-table__code {
		font-weight: 800;
		color: var(--brand-700);
	}

	.master-table__primary {
		display: grid;
		gap: 0.1rem;
	}

	.master-table__primary strong {
		font-size: 0.9375rem;
		color: var(--ink-950);
	}

	.master-table__primary span {
		font-size: 0.8125rem;
		line-height: 1.45;
		color: var(--ink-500);
	}

	.master-table__action {
		width: 1%;
		white-space: nowrap;
	}

	@media (min-width: 960px) {
		.master-toolbar {
			grid-template-columns: minmax(0, 1.2fr) repeat(3, minmax(0, 0.6fr)) auto;
			align-items: end;
		}
	}
</style>
