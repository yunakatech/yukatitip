<script lang="ts">
	import type { ResolvedPathname } from '$app/types';
	import Icon from './Icon.svelte';
	import { classNames } from '$lib/utils/classnames';
	import type { NavigationIconName } from '$lib/constants/navigation';

	interface Props {
		href: ResolvedPathname;
		label: string;
		description: string;
		icon: NavigationIconName;
		active?: boolean;
	}

	let { href, label, description, icon, active = false }: Props = $props();

	let classes = $derived(classNames('nav-item', active && 'nav-item--active'));
</script>

<a class={classes} href={href} aria-current={active ? 'page' : undefined}>
	<span class="nav-item__icon" aria-hidden="true">
		<Icon name={icon} size={18} />
	</span>
	<span class="nav-item__content">
		<span class="nav-item__label">{label}</span>
		<span class="nav-item__description">{description}</span>
	</span>
</a>

<style>
	.nav-item {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 0.75rem;
		align-items: start;
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		padding: 0.75rem 0.875rem;
		color: var(--ink-700);
		transition:
			background-color 140ms ease,
			border-color 140ms ease,
			color 140ms ease,
			transform 140ms ease;
	}

	.nav-item:hover {
		background: rgb(79 70 229 / 0.04);
		border-color: var(--brand-100);
		color: var(--ink-950);
		transform: translateY(-1px);
	}

	.nav-item:focus-visible {
		outline: 3px solid rgb(99 102 241 / 0.28);
		outline-offset: 2px;
	}

	.nav-item--active {
		background: var(--brand-50);
		border-color: var(--brand-100);
		color: var(--brand-700);
	}

	.nav-item__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 0.5rem;
		background: rgb(255 255 255 / 0.84);
		color: currentColor;
	}

	.nav-item__content {
		display: grid;
		gap: 0.125rem;
		min-width: 0;
	}

	.nav-item__label {
		font-size: 0.9375rem;
		font-weight: 700;
		line-height: 1.35;
	}

	.nav-item__description {
		font-size: 0.8125rem;
		line-height: 1.45;
		color: var(--ink-500);
	}

	.nav-item--active .nav-item__description {
		color: color-mix(in srgb, var(--brand-700) 72%, var(--ink-500));
	}
</style>
