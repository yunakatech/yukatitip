<script lang="ts">
	import type { Snippet } from 'svelte';

	import type { AuthContext } from '$lib/types/auth';
	import { getNavigationMatch, getVisibleNavigation } from '$lib/constants/navigation';
	import AppSidebar from './AppSidebar.svelte';
	import AppTopbar from './AppTopbar.svelte';
	import MobileNavigationDrawer from './MobileNavigationDrawer.svelte';

	interface Props {
		auth: AuthContext;
		currentPath: string;
		children: Snippet;
	}

	let { auth, currentPath, children }: Props = $props();

	let isMobileNavigationOpen = $state(false);
	let visibleNavigation = $derived(getVisibleNavigation(auth));
	let currentNavigation = $derived(getNavigationMatch(visibleNavigation, currentPath));
	let topbarTitle = $derived(currentNavigation?.label ?? 'Dashboard');
	let previousPath = '';

	$effect(() => {
		if (!previousPath) {
			previousPath = currentPath;
			return;
		}

		if (currentPath !== previousPath) {
			isMobileNavigationOpen = false;
			previousPath = currentPath;
		}
	});

	function openNavigation(): void {
		isMobileNavigationOpen = true;
	}

	function closeNavigation(): void {
		isMobileNavigationOpen = false;
	}
</script>

<div class="app-shell-layout">
	<div class="app-shell-layout__sidebar">
		<AppSidebar navigation={visibleNavigation} {currentPath} />
	</div>

	<div class="app-shell-layout__workspace">
		<AppTopbar
			{auth}
			title={topbarTitle}
			isNavigationOpen={isMobileNavigationOpen}
			onOpenNavigation={openNavigation}
		/>

		<main class="app-shell-layout__content">
			<div class="app-shell-layout__content-inner">
				{@render children()}
			</div>
		</main>
	</div>

	<MobileNavigationDrawer
		open={isMobileNavigationOpen}
		navigation={visibleNavigation}
		{currentPath}
		onClose={closeNavigation}
	/>
</div>

<style>
	.app-shell-layout {
		display: grid;
		min-height: 100vh;
		background: var(--surface-50);
	}

	.app-shell-layout__sidebar {
		display: none;
	}

	.app-shell-layout__workspace {
		min-width: 0;
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
	}

	.app-shell-layout__content {
		min-width: 0;
		padding: 0.875rem;
	}

	.app-shell-layout__content-inner {
		display: grid;
		gap: 0.875rem;
		max-width: 88rem;
	}

	@media (min-width: 1024px) {
		.app-shell-layout {
			grid-template-columns: 15rem minmax(0, 1fr);
		}

		.app-shell-layout__sidebar {
			display: block;
			position: sticky;
			top: 0;
			height: 100vh;
		}

		.app-shell-layout__content {
			padding: 1rem 1.25rem 1.5rem;
		}
	}
</style>
