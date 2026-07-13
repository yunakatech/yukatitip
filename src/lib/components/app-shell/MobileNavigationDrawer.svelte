<script lang="ts">
	import type { VisibleNavigationGroup } from '$lib/constants/navigation';
	import AppSidebar from './AppSidebar.svelte';
	import Icon from './Icon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import {
		cancelMobileNavigationDrawer,
		closeMobileNavigationDrawer,
		isMobileNavigationBackdropClick,
		MOBILE_NAVIGATION_CLOSE_BUTTON_ID,
		MOBILE_NAVIGATION_DIALOG_ID,
		MOBILE_NAVIGATION_TITLE_ID,
		MOBILE_NAVIGATION_TOGGLE_ID,
		openMobileNavigationDrawer
	} from './mobile-navigation';

	interface Props {
		open: boolean;
		navigation: VisibleNavigationGroup[];
		currentPath: string;
		onClose: () => void;
	}

	let { open, navigation, currentPath, onClose }: Props = $props();

	let dialogElement = $state<HTMLDialogElement | null>(null);

	$effect(() => {
		if (!dialogElement) {
			return;
		}

		if (open && !dialogElement.open) {
			openMobileNavigationDrawer(
				dialogElement,
				document.getElementById(MOBILE_NAVIGATION_CLOSE_BUTTON_ID) as HTMLElement | null
			);
		} else if (!open && dialogElement.open) {
			closeMobileNavigationDrawer(
				dialogElement,
				document.getElementById(MOBILE_NAVIGATION_TOGGLE_ID) as HTMLElement | null
			);
		}
	});

	function handleBackdropClick(event: MouseEvent): void {
		if (isMobileNavigationBackdropClick(event, dialogElement)) {
			onClose();
		}
	}
</script>

<dialog
	bind:this={dialogElement}
	id={MOBILE_NAVIGATION_DIALOG_ID}
	class="drawer"
	aria-label="Navigasi internal"
	aria-labelledby={MOBILE_NAVIGATION_TITLE_ID}
	aria-modal="true"
	oncancel={(event) => cancelMobileNavigationDrawer(event, onClose)}
	onclick={handleBackdropClick}
>
	<div class="drawer__panel">
		<div class="drawer__header">
			<h2 id={MOBILE_NAVIGATION_TITLE_ID} class="drawer__title">Navigasi internal</h2>
			<Button
				id={MOBILE_NAVIGATION_CLOSE_BUTTON_ID}
				variant="secondary"
				size="sm"
				aria-label="Tutup navigasi aplikasi"
				onclick={onClose}
			>
				<Icon name="close" size={18} />
			</Button>
		</div>

		<div class="drawer__body">
			<div class="drawer__sidebar">
				<AppSidebar {navigation} {currentPath} />
			</div>
		</div>
	</div>
</dialog>

<style>
	.drawer {
		position: fixed;
		inset: 0 auto 0 0;
		width: min(18rem, calc(100vw - 2.5rem));
		height: 100dvh;
		border: 0;
		margin: 0;
		padding: 0;
		background: transparent;
		color: inherit;
	}

	.drawer::backdrop {
		background: rgb(17 24 39 / 0.42);
	}

	.drawer__panel {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		height: 100%;
		background: rgb(255 255 255 / 0.98);
		box-shadow: var(--shadow-overlay);
	}

	.drawer__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.75rem 0.75rem 0;
	}

	.drawer__title {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 800;
		line-height: 1.25;
		color: var(--ink-950);
	}

	.drawer__body {
		min-height: 0;
		overflow: auto;
	}

	.drawer__sidebar {
		border-right: 0;
		border-top: 1px solid var(--line-200);
		margin-top: 0.75rem;
		height: auto;
	}
</style>
