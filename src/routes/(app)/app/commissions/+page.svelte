<script lang="ts">
	import ModulePlaceholder from '$lib/components/app-shell/ModulePlaceholder.svelte';
</script>

<svelte:head>
	<title>Komisi | Yukatitip</title>
</svelte:head>

<ModulePlaceholder
	eyebrow="Keuangan"
	title="Komisi"
	description="Perhitungan kontribusi bersih dan komisi petugas berdasarkan revenue dan biaya operasional."
	emptyTitle="Belum ada periode komisi"
	emptyDescription="Gunakan halaman ini untuk melihat hasil hitung komisi yang sudah dikunci."
	primaryActionLabel="Kembali ke dashboard"
	primaryActionHref="/app/dashboard"
	note="Database tetap menjadi sumber hasil final untuk komisi."
/>
