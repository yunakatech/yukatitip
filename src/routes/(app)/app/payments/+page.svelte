<script lang="ts">
	import ModulePlaceholder from '$lib/components/app-shell/ModulePlaceholder.svelte';
</script>

<svelte:head>
	<title>Pembayaran | Yukatitip</title>
</svelte:head>

<ModulePlaceholder
	eyebrow="Keuangan"
	title="Pembayaran"
	description="Verifikasi pembayaran customer dan status settlement yang terhubung ke pesanan."
	emptyTitle="Belum ada panel pembayaran"
	emptyDescription="Halaman ini akan menampung verifikasi pembayaran manual."
	primaryActionLabel="Kembali ke dashboard"
	primaryActionHref="/app/dashboard"
	note="Nilai barang tetap dipisahkan dari revenue jasa."
/>
