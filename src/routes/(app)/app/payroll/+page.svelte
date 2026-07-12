<script lang="ts">
	import ModulePlaceholder from '$lib/components/app-shell/ModulePlaceholder.svelte';
</script>

<svelte:head>
	<title>Payroll | Yukatitip</title>
</svelte:head>

<ModulePlaceholder
	eyebrow="Keuangan"
	title="Payroll"
	description="Ringkasan payroll sederhana untuk gaji pokok, tunjangan, komisi, dan potongan yang sah."
	emptyTitle="Belum ada periode payroll"
	emptyDescription="Halaman ini menunggu data payroll yang dihitung dari periode aktif."
	primaryActionLabel="Kembali ke dashboard"
	primaryActionHref="/app/dashboard"
	note="Payroll tidak mencakup transfer otomatis pada MVP."
/>
