<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { classNames } from '$lib/utils/classnames';

	type Tone = 'info' | 'success' | 'warning' | 'danger';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		children?: Snippet;
		tone?: Tone;
		title?: string;
	}

	let { children, tone = 'info', title, class: className = '', ...rest }: Props = $props();

	let classes = $derived(classNames('ui-alert', `ui-alert--${tone}`, className));
	let role = $derived(tone === 'danger' || tone === 'warning' ? 'alert' : 'status');
</script>

<div class={classes} {role} {...rest}>
	{#if title}
		<strong class="ui-alert__title">{title}</strong>
	{/if}
	<div class="ui-alert__body">
		{@render children?.()}
	</div>
</div>

<style>
	.ui-alert {
		display: grid;
		gap: 0.375rem;
		border: 1px solid transparent;
		border-left-width: 4px;
		border-radius: var(--radius-md);
		padding: 0.875rem 1rem;
	}

	.ui-alert__title {
		font-size: 0.9375rem;
		line-height: 1.4;
	}

	.ui-alert__body {
		font-size: 0.875rem;
		line-height: 1.65;
		color: var(--ink-700);
	}

	.ui-alert--info {
		background: #ecfeff;
		border-color: #a5f3fc;
		border-left-color: #0891b2;
		color: #0f766e;
	}

	.ui-alert--success {
		background: #f0fdf4;
		border-color: #bbf7d0;
		border-left-color: #16a34a;
		color: #166534;
	}

	.ui-alert--warning {
		background: #fffbeb;
		border-color: #fde68a;
		border-left-color: #d97706;
		color: #92400e;
	}

	.ui-alert--danger {
		background: #fef2f2;
		border-color: #fecaca;
		border-left-color: var(--danger);
		color: #991b1b;
	}
</style>
