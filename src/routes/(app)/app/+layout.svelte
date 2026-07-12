<script lang="ts">
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';

	import type { LayoutData } from './$types';
	import AppShell from '$lib/components/app-shell/AppShell.svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const auth = $derived({
		user: data.user,
		profile: data.profile,
		role: data.profile.role,
		branch: data.profile.branch,
		permissions: data.profile.permissions
	});
</script>

<svelte:head>
	<title>Yukatitip Internal</title>
	<meta
		name="description"
		content="Shell internal Yukatitip yang diproteksi auth Supabase."
	/>
</svelte:head>

<AppShell {auth} currentPath={page.url.pathname}>
	{@render children()}
</AppShell>
