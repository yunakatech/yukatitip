<script lang="ts">
	import ModulePlaceholder from '$lib/components/app-shell/ModulePlaceholder.svelte';
</script>

<svelte:head>
	<title>Akun & Role | Yukatitip</title>
</svelte:head>

<ModulePlaceholder
	eyebrow="Organisasi"
	title="Akun & Role"
	description="Manajemen akun internal, role, dan permission untuk mengatur akses aplikasi."
	emptyTitle="Belum ada panel akun dan role"
	emptyDescription="Halaman ini hanya tersedia untuk owner dan akan memuat kontrol akses internal."
	primaryActionLabel="Kembali ke dashboard"
	primaryActionHref="/app/dashboard"
	note="Role dan permission tetap menjadi sumber akses utama di server dan RLS."
/>
