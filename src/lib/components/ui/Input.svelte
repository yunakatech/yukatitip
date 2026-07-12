<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	import { classNames } from '$lib/utils/classnames';

	type Size = 'sm' | 'md';

	interface Props extends Omit<HTMLInputAttributes, 'size'> {
		label?: string;
		hint?: string;
		error?: string;
		size?: Size;
	}

	let {
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

	let inputId = $derived(id ?? (label ? `input-${slugify(label)}` : undefined));
	let hintId = $derived(inputId ? `${inputId}-hint` : undefined);
	let errorId = $derived(inputId ? `${inputId}-error` : undefined);
	let describedBy = $derived([hintId, errorId].filter(Boolean).join(' ') || undefined);
</script>

<div class={classNames('ui-field', className)}>
	{#if label}
		<label class="ui-field__label" for={inputId}>{label}</label>
	{/if}

	<input
		id={inputId}
		class={classNames(
			'ui-input',
			`ui-input--${size}`,
			error && 'ui-input--error'
		)}
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={describedBy}
		{...rest}
	/>

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

	.ui-input {
		width: 100%;
		border: 1px solid var(--line-300);
		border-radius: var(--radius-md);
		background: var(--white);
		color: var(--ink-950);
		transition:
			border-color 140ms ease,
			box-shadow 140ms ease,
			background-color 140ms ease;
	}

	.ui-input--sm {
		min-height: 40px;
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
	}

	.ui-input--md {
		min-height: 44px;
		padding: 0.75rem 0.875rem;
		font-size: 0.9375rem;
	}

	.ui-input:focus {
		border-color: var(--brand-500);
		box-shadow: 0 0 0 3px rgb(99 102 241 / 0.14);
		outline: none;
	}

	.ui-input::placeholder {
		color: var(--ink-500);
	}

	.ui-input--error {
		border-color: #fca5a5;
		background: #fff7f7;
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
