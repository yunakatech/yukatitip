<script lang="ts">
	import { resolve } from '$app/paths';
	import type { VisibleNavigationGroup } from '$lib/constants/navigation';
	import { classNames } from '$lib/utils/classnames';
	import NavigationItem from './NavigationItem.svelte';

	interface Props {
		navigation: VisibleNavigationGroup[];
		currentPath: string;
		class?: string;
	}

	let { navigation, currentPath, class: className = '' }: Props = $props();

	let classes = $derived(classNames('app-sidebar', className));
</script>

<aside class={classes}>
	<a class="app-sidebar__brand" href={resolve('/app/dashboard')}>
		<span class="app-sidebar__mark" aria-hidden="true">Y</span>
		<span class="app-sidebar__brand-copy">
			<strong>Yukatitip</strong>
		</span>
	</a>

	<nav class="app-sidebar__nav" aria-label="Navigasi utama">
		{#each navigation as group (group.label)}
			<section class="app-sidebar__group">
				<p class="app-sidebar__group-label">{group.label}</p>
				<div class="app-sidebar__items">
					{#each group.items as item (item.href)}
						<NavigationItem
							href={item.href}
							label={item.label}
							description={item.description}
							icon={item.icon}
							active={currentPath === item.href || currentPath.startsWith(`${item.href}/`)}
						/>
					{/each}
				</div>
			</section>
		{/each}
	</nav>
</aside>

<style>
	.app-sidebar {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		height: 100%;
		border-right: 1px solid var(--line-200);
		background: rgb(255 255 255 / 0.96);
		padding: 1rem;
	}

	.app-sidebar__brand {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		border-radius: var(--radius-sm);
		padding: 0.375rem 0.25rem;
		color: var(--ink-950);
	}

	.app-sidebar__brand:hover {
		background: var(--brand-50);
	}

	.app-sidebar__brand:focus-visible {
		outline: 3px solid rgb(99 102 241 / 0.28);
		outline-offset: 2px;
	}

	.app-sidebar__mark {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.625rem;
		background: var(--brand-600);
		font-size: 0.875rem;
		font-weight: 800;
		color: var(--white);
	}

	.app-sidebar__brand-copy strong {
		font-size: 0.875rem;
		line-height: 1.25;
	}

	.app-sidebar__nav {
		display: grid;
		gap: 0.75rem;
		min-width: 0;
		overflow: auto;
		padding-right: 0.125rem;
	}

	.app-sidebar__group {
		display: grid;
		gap: 0.375rem;
	}

	.app-sidebar__group-label {
		margin: 0;
		padding-inline: 0.25rem;
		font-size: 0.6875rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink-500);
	}

	.app-sidebar__items {
		display: grid;
		gap: 0.125rem;
	}
</style>
