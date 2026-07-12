<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { classNames } from '$lib/utils/classnames';

	interface Props extends HTMLAttributes<HTMLElement> {
		children?: Snippet;
		title: string;
		description: string;
	}

	let { children, title, description, class: className = '', ...rest }: Props = $props();

	function slugify(value: string): string {
		return value
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	let headingId = $derived(`empty-state-${slugify(title)}`);
	let classes = $derived(classNames('ui-empty-state', className));
</script>

<section class={classes} aria-labelledby={headingId} {...rest}>
	<div class="ui-empty-state__body">
		<h2 class="ui-empty-state__title" id={headingId}>{title}</h2>
		<p class="ui-empty-state__description">{description}</p>
	</div>
	<div class="ui-empty-state__actions">
		{@render children?.()}
	</div>
</section>

<style>
	.ui-empty-state {
		display: grid;
		justify-items: start;
		gap: 1rem;
		border: 1px dashed var(--line-300);
		border-radius: var(--radius-lg);
		background: rgb(255 255 255 / 0.88);
		padding: 1.25rem;
	}

	.ui-empty-state__body {
		display: grid;
		gap: 0.375rem;
	}

	.ui-empty-state__title {
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
		line-height: 1.4;
		color: var(--ink-950);
	}

	.ui-empty-state__description {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.65;
		color: var(--ink-600);
	}

	.ui-empty-state__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}
</style>
