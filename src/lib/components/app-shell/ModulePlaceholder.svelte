<script lang="ts">
	import type { ResolvedPathname } from '$app/types';
	import PageHeader from './PageHeader.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';

	interface Props {
		eyebrow: string;
		title: string;
		description: string;
		emptyTitle: string;
		emptyDescription: string;
		primaryActionLabel?: string;
		primaryActionHref?: ResolvedPathname;
		secondaryActionLabel?: string;
		secondaryActionHref?: ResolvedPathname;
		note?: string;
	}

	let {
		eyebrow,
		title,
		description,
		emptyTitle,
		emptyDescription,
		primaryActionLabel,
		primaryActionHref,
		secondaryActionLabel,
		secondaryActionHref,
		note
	}: Props = $props();
</script>

<section class="module-placeholder">
	<PageHeader {eyebrow} {title} />
	<p class="module-placeholder__sr-description">{description}</p>

	<div class="module-placeholder__body">
		<EmptyState title={emptyTitle} description={emptyDescription}>
			{#if primaryActionLabel && primaryActionHref}
				<a class="button button-primary" href={primaryActionHref}>{primaryActionLabel}</a>
			{/if}

			{#if secondaryActionLabel && secondaryActionHref}
				<a class="button button-secondary" href={secondaryActionHref}>{secondaryActionLabel}</a>
			{/if}
		</EmptyState>

	{#if note}
		<p class="module-placeholder__note">{note}</p>
	{/if}
	</div>
</section>

<style>
	.module-placeholder {
		display: grid;
		gap: 0.75rem;
	}

	.module-placeholder__body {
		display: grid;
		gap: 0.625rem;
	}

	.module-placeholder__sr-description {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		clip-path: inset(50%);
		white-space: nowrap;
	}

	.module-placeholder__note {
		margin: 0;
		max-width: 62ch;
		border-left: 3px solid var(--brand-100);
		padding: 0.375rem 0 0.375rem 0.75rem;
		font-size: 0.8125rem;
		line-height: 1.45;
		color: var(--ink-500);
	}

	.module-placeholder :global(.button) {
		min-height: 40px;
		padding-inline: 0.875rem;
		font-size: 0.875rem;
	}
</style>
