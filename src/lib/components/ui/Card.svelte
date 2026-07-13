<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { classNames } from '$lib/utils/classnames';

	type As = 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'form';
	type Padding = 'sm' | 'md' | 'lg';

	interface Props extends HTMLAttributes<HTMLElement> {
		children?: Snippet;
		as?: As;
		padding?: Padding;
	}

	let { children, as = 'div', padding = 'md', class: className = '', ...rest }: Props = $props();

	let classes = $derived(classNames('ui-card', `ui-card--${padding}`, className));
</script>

<svelte:element this={as} class={classes} {...rest}>
	{@render children?.()}
</svelte:element>

<style>
	.ui-card {
		border: 1px solid var(--line-200);
		border-radius: var(--radius-md);
		background: rgb(255 255 255 / 0.94);
		box-shadow: var(--shadow-card);
		color: var(--ink-950);
	}

	.ui-card--sm {
		padding: 0.875rem;
	}

	.ui-card--md {
		padding: 1rem;
	}

	.ui-card--lg {
		padding: 1.25rem;
	}
</style>
