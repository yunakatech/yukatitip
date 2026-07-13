<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		eyebrow?: string;
		title: string;
		description?: string;
		actions?: Snippet;
	}

	let { eyebrow, title, description, actions }: Props = $props();

	let accessibleLabel = $derived(eyebrow ? `${eyebrow}: ${title}` : title);
</script>

<header class="page-header" aria-label={accessibleLabel}>
	<div class="page-header__copy">
		<h2 class="page-header__title">{title}</h2>
		{#if description}
			<p class="page-header__description">{description}</p>
		{/if}
	</div>

	{#if actions}
		<div class="page-header__actions">
			{@render actions()}
		</div>
	{/if}
</header>

<style>
	.page-header {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.page-header__copy {
		display: grid;
		gap: 0.1875rem;
		min-width: 0;
	}

	.page-header__title {
		margin: 0;
		font-size: 1.25rem;
		line-height: 1.2;
		color: var(--ink-950);
	}

	.page-header__description {
		margin: 0;
		max-width: 58ch;
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--ink-600);
	}

	.page-header__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}
</style>
