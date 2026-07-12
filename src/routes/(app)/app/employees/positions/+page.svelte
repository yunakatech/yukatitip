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
		{ value: 'inactive', label: 'Nonaktif' }
	];

	const sortOptions = [
		{ value: 'createdAt', label: 'Terbaru' },
		{ value: '-createdAt', label: 'Terbaru dulu' },
		{ value: 'code', label: 'Kode' },
		{ value: 'name', label: 'Nama' },
		{ value: 'level', label: 'Level' }
	];

	const hasFilters = $derived(Boolean(data.filters.search || data.filters.status || data.filters.sort !== 'createdAt'));
</script>

<svelte:head>
	<title>Jabatan | Yukatitip</title>
</svelte:head>

<section class="master-data-page">
	<PageHeader
		eyebrow="Organisasi"
		title="Jabatan"
		description="Kelola jabatan kerja dan status aktifnya tanpa mencampurkan role aplikasi."
	/>

	<div class="master-data-page__actions">
		<a class="button button-primary" href={resolve('/app/employees/positions/new')}>Jabatan baru</a>
	</div>

	<Card as="section">
		<form class="master-toolbar" method="GET">
			<div class="master-toolbar__search">
				<Input label="Cari jabatan" name="search" value={data.filters.search} placeholder="Kode atau nama" />
			</div>
			<div class="master-toolbar__filter">
				<Select label="Status" name="status" value={data.filters.status ?? ''}>
					{#each statusOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</Select>
			</div>
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

	{#if data.positions.length === 0}
		{#if hasFilters}
			<EmptyState title="Tidak ada jabatan yang cocok" description="Ubah filter atau kata kunci untuk mencoba lagi." />
		{:else}
			<EmptyState
				title="Belum ada jabatan"
				description="Tambahkan jabatan kerja agar karyawan bisa ditugaskan dengan jelas."
			>
				<a class="button button-primary" href={resolve('/app/employees/positions/new')}>Jabatan baru</a>
			</EmptyState>
		{/if}
	{:else}
		<Card as="section" padding="sm">
			<table class="master-table">
				<caption class="sr-only">Daftar jabatan Yukatitip</caption>
				<thead>
					<tr>
						<th>Kode</th>
						<th>Nama</th>
						<th>Level</th>
						<th>Status</th>
						<th class="master-table__action">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each data.positions as position (position.id)}
						<tr>
							<td class="master-table__code">{position.code}</td>
							<td>
								<div class="master-table__primary">
									<strong>{position.name}</strong>
									<span>{position.description ?? 'Deskripsi belum diisi'}</span>
								</div>
							</td>
							<td>{position.level}</td>
							<td>
								<Badge tone={position.isActive ? 'success' : 'neutral'}>
									{position.isActive ? 'Aktif' : 'Nonaktif'}
								</Badge>
							</td>
							<td class="master-table__action">
								<div class="button-row">
									<a class="button button-secondary" href={resolve(`/app/employees/positions/${position.id}`)}>
										Detail
									</a>
									<a class="button button-ghost" href={resolve(`/app/employees/positions/${position.id}/edit`)}>
										Ubah
									</a>
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
			grid-template-columns: minmax(0, 1.2fr) repeat(2, minmax(0, 0.6fr)) auto;
			align-items: end;
		}
	}
</style>
