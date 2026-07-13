<script lang="ts">
	import type { AuthContext } from '$lib/types/auth';
	import {
		MOBILE_NAVIGATION_DIALOG_ID,
		MOBILE_NAVIGATION_TOGGLE_ID
	} from './mobile-navigation';
	import Icon from './Icon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import BranchIndicator from './BranchIndicator.svelte';
	import UserMenu from './UserMenu.svelte';

	interface Props {
		auth: AuthContext;
		title: string;
		isNavigationOpen: boolean;
		onOpenNavigation: () => void;
	}

	let { auth, title, isNavigationOpen, onOpenNavigation }: Props = $props();
</script>

<header class="topbar">
	<div class="topbar__primary">
		<div class="topbar__menu-button">
			<Button
				id={MOBILE_NAVIGATION_TOGGLE_ID}
				variant="secondary"
				size="sm"
				aria-label="Buka navigasi aplikasi"
				aria-controls={MOBILE_NAVIGATION_DIALOG_ID}
				aria-expanded={isNavigationOpen}
				aria-haspopup="dialog"
				onclick={onOpenNavigation}
			>
				<Icon name="menu" size={18} />
			</Button>
		</div>

		<div class="topbar__titles">
			<h1 class="topbar__title">{title}</h1>
		</div>
	</div>

	<div class="topbar__meta">
		<div class="topbar__branch">
			<BranchIndicator branch={auth.branch} roleName={auth.role.name} compact />
		</div>
		<UserMenu {auth} />
	</div>
</header>

<style>
	.topbar {
		position: sticky;
		top: 0;
		z-index: 15;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		border-bottom: 1px solid var(--line-200);
		background: rgb(249 250 251 / 0.92);
		backdrop-filter: blur(12px);
		padding: 0.625rem 0.875rem;
	}

	.topbar__primary {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		min-width: 0;
	}

	.topbar__menu-button {
		flex: none;
	}

	.topbar__titles {
		display: grid;
		gap: 0.125rem;
		min-width: 0;
	}

	.topbar__title {
		margin: 0;
		font-size: 1rem;
		font-weight: 750;
		line-height: 1.25;
		color: var(--ink-950);
	}

	.topbar__meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-left: auto;
	}

	@media (min-width: 960px) {
		.topbar {
			padding: 0.625rem 1rem;
		}

		.topbar__menu-button {
			display: none;
		}
	}
</style>
