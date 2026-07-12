<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		eyebrow?: string;
		title: string;
		description?: string;
		actions?: Snippet;
	}

	let { eyebrow, title, description, actions }: Props = $props();
</script>

<header class="page-header">
	<div class="page-header__copy">
		{#if eyebrow}
			<p class="page-header__eyebrow">{eyebrow}</p>
		{/if}
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
		gap: 1rem;
	}

	.page-header__copy {
		display: grid;
		gap: 0.25rem;
		min-width: 0;
	}

	.page-header__eyebrow {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-500);
	}

	.page-header__title {
		margin: 0;
		font-size: 1.5rem;
		line-height: 1.2;
		color: var(--ink-950);
	}

	.page-header__description {
		margin: 0;
		max-width: 58ch;
		font-size: 0.9375rem;
		line-height: 1.65;
		color: var(--ink-600);
	}

	.page-header__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
	}
</style>
