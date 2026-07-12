<script lang="ts">
	import type { ResolvedPathname } from '$app/types';
	import PageHeader from './PageHeader.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';

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
	<PageHeader {eyebrow} {title} {description} />

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
			<Alert tone="info" title="Catatan">
				{note}
			</Alert>
		{/if}
	</div>
</section>

<style>
	.module-placeholder {
		display: grid;
		gap: 1rem;
	}

	.module-placeholder__body {
		display: grid;
		gap: 1rem;
	}
</style>
