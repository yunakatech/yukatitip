<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	import { classNames } from '$lib/utils/classnames';

	type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
	type Size = 'sm' | 'md' | 'lg';

	interface Props extends HTMLButtonAttributes {
		children?: Snippet;
		variant?: Variant;
		size?: Size;
		busy?: boolean;
		fullWidth?: boolean;
	}

	let {
		children,
		variant = 'primary',
		size = 'md',
		busy = false,
		fullWidth = false,
		class: className = '',
		disabled = false,
		type = 'button',
		...rest
	}: Props = $props();

	let resolvedDisabled = $derived(disabled || busy);
	let classes = $derived(
		classNames(
			'ui-button',
			`ui-button--${variant}`,
			`ui-button--${size}`,
			fullWidth && 'ui-button--full',
			className
		)
	);
</script>

<button
	class={classes}
	{type}
	disabled={resolvedDisabled}
	aria-busy={busy ? 'true' : undefined}
	{...rest}
>
	{#if busy}
		<span class="ui-button__spinner" aria-hidden="true"></span>
	{/if}
	<span class="ui-button__content">
		{@render children?.()}
	</span>
</button>

<style>
	.ui-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		font: inherit;
		font-weight: 700;
		letter-spacing: 0;
		transition:
			transform 140ms ease,
			background-color 140ms ease,
			border-color 140ms ease,
			color 140ms ease,
			box-shadow 140ms ease,
			opacity 140ms ease;
		cursor: pointer;
		user-select: none;
		text-decoration: none;
		white-space: nowrap;
	}

	.ui-button:focus-visible {
		outline: 3px solid rgb(99 102 241 / 0.35);
		outline-offset: 2px;
	}

	.ui-button:hover:not(:disabled) {
		transform: translateY(-1px);
	}

	.ui-button:disabled {
		cursor: not-allowed;
		opacity: 0.65;
		transform: none;
	}

	.ui-button--full {
		width: 100%;
	}

	.ui-button--sm {
		min-height: 36px;
		padding: 0 0.75rem;
		font-size: 0.875rem;
	}

	.ui-button--md {
		min-height: 44px;
		padding: 0 1rem;
		font-size: 0.9375rem;
	}

	.ui-button--lg {
		min-height: 52px;
		padding: 0 1.25rem;
		font-size: 1rem;
	}

	.ui-button--primary {
		background: var(--brand-600);
		color: var(--white);
		box-shadow: 0 10px 24px rgb(79 70 229 / 0.18);
	}

	.ui-button--primary:hover:not(:disabled) {
		background: var(--brand-700);
	}

	.ui-button--secondary {
		border-color: var(--line-200);
		background: rgb(255 255 255 / 0.92);
		color: var(--ink-800);
	}

	.ui-button--secondary:hover:not(:disabled) {
		border-color: var(--brand-100);
		background: var(--brand-50);
	}

	.ui-button--ghost {
		background: transparent;
		color: var(--ink-800);
	}

	.ui-button--ghost:hover:not(:disabled) {
		background: rgb(79 70 229 / 0.06);
	}

	.ui-button--danger {
		background: var(--danger);
		color: var(--white);
		box-shadow: 0 10px 24px rgb(185 28 28 / 0.12);
	}

	.ui-button--danger:hover:not(:disabled) {
		background: #991b1b;
	}

	.ui-button__spinner {
		width: 0.875rem;
		height: 0.875rem;
		border: 2px solid rgb(255 255 255 / 0.5);
		border-top-color: currentColor;
		border-radius: 999px;
		animation: ui-button-spin 0.8s linear infinite;
	}

	@keyframes ui-button-spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ui-button,
		.ui-button__spinner {
			transition: none;
			animation: none;
		}
	}
</style>
