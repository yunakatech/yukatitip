<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	import { classNames } from '$lib/utils/classnames';

	interface Props extends HTMLAttributes<HTMLElement> {
		label?: string;
		lines?: number;
	}

	let { label = 'Memuat data...', lines = 3, class: className = '', ...rest }: Props = $props();

	const skeletonWidths = ['72%', '88%', '64%', '90%'];

	function slugify(value: string): string {
		return value
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	let labelId = $derived(`loading-state-${slugify(label)}`);
	let skeletonLineWidths = $derived(
		Array.from(
			{ length: lines },
			(_, index) => skeletonWidths[index % skeletonWidths.length]
		)
	);
	let classes = $derived(classNames('ui-loading-state', className));
</script>

<section
	class={classes}
	role="status"
	aria-live="polite"
	aria-busy="true"
	aria-labelledby={labelId}
	{...rest}
>
	<div class="ui-loading-state__spinner" aria-hidden="true"></div>
	<p class="ui-loading-state__label" id={labelId}>{label}</p>
	<div class="ui-loading-state__lines" aria-hidden="true">
		{#each skeletonLineWidths as width, index (index)}
			<span class="ui-loading-state__line" style={`width: ${width}`}></span>
		{/each}
	</div>
</section>

<style>
	.ui-loading-state {
		display: grid;
		justify-items: start;
		gap: 0.75rem;
		border: 1px solid var(--line-200);
		border-radius: var(--radius-lg);
		background: rgb(255 255 255 / 0.9);
		padding: 1.25rem;
	}

	.ui-loading-state__spinner {
		width: 1.25rem;
		height: 1.25rem;
		border: 3px solid rgb(79 70 229 / 0.16);
		border-top-color: var(--brand-600);
		border-radius: 999px;
		animation: ui-loading-spin 0.8s linear infinite;
	}

	.ui-loading-state__label {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--ink-600);
	}

	.ui-loading-state__lines {
		width: 100%;
		display: grid;
		gap: 0.625rem;
	}

	.ui-loading-state__line {
		height: 0.875rem;
		border-radius: 999px;
		background: linear-gradient(90deg, var(--surface-100), var(--brand-50), var(--surface-100));
		background-size: 200% 100%;
		animation: ui-loading-shimmer 1.4s ease-in-out infinite;
	}

	@keyframes ui-loading-spin {
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes ui-loading-shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ui-loading-state__spinner,
		.ui-loading-state__line {
			animation: none;
		}
	}
</style>
