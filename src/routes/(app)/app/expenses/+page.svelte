<script lang="ts">
	import ModulePlaceholder from '$lib/components/app-shell/ModulePlaceholder.svelte';
</script>

<svelte:head>
	<title>Biaya Petugas | Yukatitip</title>
</svelte:head>

<ModulePlaceholder
	eyebrow="Keuangan"
	title="Biaya Petugas"
	description="Biaya operasional harian petugas yang akan dipakai untuk pengajuan, verifikasi, dan komisi."
	emptyTitle="Belum ada biaya petugas"
	emptyDescription="Gunakan halaman ini untuk meninjau biaya yang sedang diajukan atau menunggu verifikasi."
	primaryActionLabel="Kembali ke dashboard"
	primaryActionHref="/app/dashboard"
	note="Hanya biaya berstatus approved yang masuk dasar komisi."
/>
