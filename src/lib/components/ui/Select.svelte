<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLSelectAttributes } from 'svelte/elements';

	import { classNames } from '$lib/utils/classnames';

	type Size = 'sm' | 'md';

	interface Props extends Omit<HTMLSelectAttributes, 'size'> {
		children?: Snippet;
		label?: string;
		hint?: string;
		error?: string;
		size?: Size;
	}

	let {
		children,
		label,
		hint,
		error,
		size = 'md',
		id,
		class: className = '',
		...rest
	}: Props = $props();

	function slugify(value: string): string {
		return value
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	let selectId = $derived(id ?? (label ? `select-${slugify(label)}` : undefined));
	let hintId = $derived(selectId ? `${selectId}-hint` : undefined);
	let errorId = $derived(selectId ? `${selectId}-error` : undefined);
	let describedBy = $derived([hintId, errorId].filter(Boolean).join(' ') || undefined);
</script>

<div class={classNames('ui-field', className)}>
	{#if label}
		<label class="ui-field__label" for={selectId}>{label}</label>
	{/if}

	<div class="ui-select-shell">
		<select
			id={selectId}
			class={classNames(
				'ui-select',
				`ui-select--${size}`,
				error && 'ui-select--error'
			)}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={describedBy}
			{...rest}
		>
			{@render children?.()}
		</select>
	</div>

	{#if hint}
		<p class="ui-field__hint" id={hintId}>{hint}</p>
	{/if}

	{#if error}
		<p class="ui-field__error" id={errorId}>{error}</p>
	{/if}
</div>

<style>
	.ui-field {
		display: grid;
		gap: 0.375rem;
	}

	.ui-field__label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--ink-800);
	}

	.ui-select-shell {
		position: relative;
	}

	.ui-select {
		width: 100%;
		border: 1px solid var(--line-300);
		border-radius: var(--radius-md);
		background-color: var(--white);
		color: var(--ink-950);
		appearance: none;
		background-image:
			linear-gradient(45deg, transparent 50%, var(--ink-500) 50%),
			linear-gradient(135deg, var(--ink-500) 50%, transparent 50%),
			linear-gradient(to right, transparent, transparent);
		background-position:
			calc(100% - 18px) calc(50% - 2px),
			calc(100% - 12px) calc(50% - 2px),
			100% 0;
		background-size: 6px 6px, 6px 6px, 2.75rem 100%;
		background-repeat: no-repeat;
		transition:
			border-color 140ms ease,
			box-shadow 140ms ease,
			background-color 140ms ease;
	}

	.ui-select--sm {
		min-height: 40px;
		padding: 0.5rem 2.25rem 0.5rem 0.75rem;
		font-size: 0.875rem;
	}

	.ui-select--md {
		min-height: 44px;
		padding: 0.75rem 2.25rem 0.75rem 0.875rem;
		font-size: 0.9375rem;
	}

	.ui-select:focus {
		border-color: var(--brand-500);
		box-shadow: 0 0 0 3px rgb(99 102 241 / 0.14);
		outline: none;
	}

	.ui-select--error {
		border-color: #fca5a5;
		background-color: #fff7f7;
	}

	.ui-field__hint {
		margin: 0;
		font-size: 0.8125rem;
		line-height: 1.5;
		color: var(--ink-500);
	}

	.ui-field__error {
		margin: 0;
		font-size: 0.8125rem;
		line-height: 1.5;
		color: var(--danger);
	}
</style>
