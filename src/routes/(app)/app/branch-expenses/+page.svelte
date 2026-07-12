<script lang="ts">
	import ModulePlaceholder from '$lib/components/app-shell/ModulePlaceholder.svelte';
</script>

<svelte:head>
	<title>Biaya Cabang | Yukatitip</title>
</svelte:head>

<ModulePlaceholder
	eyebrow="Keuangan"
	title="Biaya Cabang"
	description="Biaya tetap cabang seperti sewa, listrik, air, internet, dan kebutuhan operasional kantor."
	emptyTitle="Belum ada biaya cabang"
	emptyDescription="Catat biaya cabang secara periodik agar laporan tetap konsisten."
	primaryActionLabel="Kembali ke dashboard"
	primaryActionHref="/app/dashboard"
	note="Sewa tahunan dan alokasi bulanan tetap dipisahkan."
/>
