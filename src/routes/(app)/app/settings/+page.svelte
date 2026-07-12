<script lang="ts">
	import ModulePlaceholder from '$lib/components/app-shell/ModulePlaceholder.svelte';
</script>

<svelte:head>
	<title>Pengaturan | Yukatitip</title>
</svelte:head>

<ModulePlaceholder
	eyebrow="Organisasi"
	title="Pengaturan"
	description="Konfigurasi sistem, cabang, dan preferensi operasional yang akan dipakai di seluruh aplikasi."
	emptyTitle="Belum ada panel pengaturan"
	emptyDescription="Halaman ini menunggu konfigurasi yang benar-benar dibutuhkan oleh operasional."
	primaryActionLabel="Kembali ke dashboard"
	primaryActionHref="/app/dashboard"
	note="Pengaturan hanya dibuka untuk owner."
/>
