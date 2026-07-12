<script lang="ts">
	import ModulePlaceholder from '$lib/components/app-shell/ModulePlaceholder.svelte';
</script>

<svelte:head>
	<title>Tracking | Yukatitip</title>
</svelte:head>

<ModulePlaceholder
	eyebrow="Operasional"
	title="Tracking"
	description="Pantau status barang dan riwayat pergerakan dari dashboard internal tanpa membuka data sensitif."
	emptyTitle="Belum ada panel tracking internal"
	emptyDescription="Halaman ini disiapkan sebagai penghubung ke status pesanan dan timeline internal."
	primaryActionLabel="Kembali ke dashboard"
	primaryActionHref="/app/dashboard"
	note="Tracking publik tetap dipisahkan dari shell internal dan akan tetap sanitasi data."
/>
