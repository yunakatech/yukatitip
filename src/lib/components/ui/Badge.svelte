<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { classNames } from '$lib/utils/classnames';

	type Tone = 'neutral' | 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
	type Size = 'sm' | 'md';

	interface Props extends HTMLAttributes<HTMLSpanElement> {
		children?: Snippet;
		tone?: Tone;
		size?: Size;
	}

	let { children, tone = 'neutral', size = 'md', class: className = '', ...rest }: Props = $props();

	let classes = $derived(classNames('ui-badge', `ui-badge--${tone}`, `ui-badge--${size}`, className));
</script>

<span class={classes} {...rest}>
	{@render children?.()}
</span>

<style>
	.ui-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		border: 1px solid transparent;
		border-radius: 999px;
		font-weight: 700;
		letter-spacing: 0;
		white-space: nowrap;
	}

	.ui-badge--sm {
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
	}

	.ui-badge--md {
		padding: 0.35rem 0.625rem;
		font-size: 0.8125rem;
	}

	.ui-badge--neutral {
		background: var(--surface-100);
		color: var(--ink-700);
		border-color: var(--line-200);
	}

	.ui-badge--brand {
		background: var(--brand-50);
		color: var(--brand-700);
		border-color: var(--brand-100);
	}

	.ui-badge--accent {
		background: var(--accent-50);
		color: #b45309;
		border-color: var(--accent-100);
	}

	.ui-badge--success {
		background: #dcfce7;
		color: #166534;
		border-color: #bbf7d0;
	}

	.ui-badge--warning {
		background: #fef3c7;
		color: #92400e;
		border-color: #fde68a;
	}

	.ui-badge--danger {
		background: #fee2e2;
		color: var(--danger);
		border-color: #fecaca;
	}

	.ui-badge--info {
		background: #e0f2fe;
		color: #075985;
		border-color: #bae6fd;
	}
</style>
