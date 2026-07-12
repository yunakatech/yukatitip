<script lang="ts">
	import ModulePlaceholder from '$lib/components/app-shell/ModulePlaceholder.svelte';
</script>

<svelte:head>
	<title>Tugas | Yukatitip</title>
</svelte:head>

<ModulePlaceholder
	eyebrow="Operasional"
	title="Tugas"
	description="Area kerja petugas lapangan dan petugas tujuan untuk menyelesaikan tugas, mengubah status, dan melampirkan bukti."
	emptyTitle="Belum ada tugas aktif"
	emptyDescription="Gunakan halaman ini untuk melihat dan mengerjakan tugas yang telah ditugaskan."
	primaryActionLabel="Kembali ke dashboard"
	primaryActionHref="/app/dashboard"
	note="Halaman ini masih placeholder dan belum memuat workflow tugas bisnis."
/>
