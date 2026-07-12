<script lang="ts">
	import ModulePlaceholder from '$lib/components/app-shell/ModulePlaceholder.svelte';
</script>

<svelte:head>
	<title>Batch perjalanan | Yukatitip</title>
</svelte:head>

<ModulePlaceholder
	eyebrow="Operasional"
	title="Batch perjalanan"
	description="Kelola batch perjalanan, serah terima keberangkatan, dan serah terima kedatangan untuk rute yang aktif."
	emptyTitle="Belum ada batch perjalanan"
	emptyDescription="Tambahkan batch untuk mengelompokkan pesanan dalam satu keberangkatan."
	primaryActionLabel="Kembali ke dashboard"
	primaryActionHref="/app/dashboard"
	note="Nama UI memakai Batch perjalanan, sedangkan entity dan table tetap trip/trips."
/>
