<script lang="ts">
	import ModulePlaceholder from '$lib/components/app-shell/ModulePlaceholder.svelte';
</script>

<svelte:head>
	<title>Laporan | Yukatitip</title>
</svelte:head>

<ModulePlaceholder
	eyebrow="Keuangan"
	title="Laporan"
	description="Laporan operasional dan keuangan dasar untuk cabang, rute, dan petugas."
	emptyTitle="Belum ada laporan"
	emptyDescription="Area ini akan memuat ringkasan data setelah workflow bisnis aktif."
	primaryActionLabel="Kembali ke dashboard"
	primaryActionHref="/app/dashboard"
	note="Laporan tetap dibatasi oleh role dan cabang."
/>
