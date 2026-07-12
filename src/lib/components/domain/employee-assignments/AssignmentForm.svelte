<script lang="ts">
	import type { ResolvedPathname } from '$app/types';

	import Alert from '$lib/components/ui/Alert.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';

	interface SelectOption {
		value: string;
		label: string;
	}

	interface Props {
		title: string;
		description: string;
		submitLabel: string;
		cancelHref: ResolvedPathname;
		employeeId: string;
		values: {
			branchId: string;
			positionId: string;
			supervisorEmployeeId: string;
			effectiveFrom: string;
			reason: string;
			expectedUpdatedAt: string;
		};
		branchOptions: SelectOption[];
		positionOptions: SelectOption[];
		supervisorOptions: SelectOption[];
		errorMessage?: string;
		fieldErrors?: Record<string, string[]>;
		isBusy?: boolean;
		assignmentId?: string | null;
	}

	let {
		title,
		description,
		submitLabel,
		cancelHref,
		employeeId,
		values,
		branchOptions,
		positionOptions,
		supervisorOptions,
		errorMessage,
		fieldErrors,
		isBusy = false,
		assignmentId = null
	}: Props = $props();

	function firstError(key: keyof Props['values'] | 'employeeId' | 'assignmentId'): string | undefined {
		const messages = fieldErrors?.[key];
		return messages && messages.length > 0 ? messages[0] : undefined;
	}

	let branchError = $derived(firstError('branchId'));
	let positionError = $derived(firstError('positionId'));
	let supervisorError = $derived(firstError('supervisorEmployeeId'));
	let effectiveFromError = $derived(firstError('effectiveFrom'));
	let reasonError = $derived(firstError('reason'));
</script>

<form class="assignment-form" method="POST">
	<Card as="section">
		<div class="assignment-form__header">
			<div>
				<h2>{title}</h2>
				<p>{description}</p>
			</div>
		</div>

		{#if errorMessage}
			<Alert tone="danger" title="Gagal menyimpan">
				{errorMessage}
			</Alert>
		{/if}

		<input type="hidden" name="employeeId" value={employeeId} />
		{#if assignmentId}
			<input type="hidden" name="assignmentId" value={assignmentId} />
		{/if}
		<input type="hidden" name="expectedUpdatedAt" value={values.expectedUpdatedAt} />

		<div class="assignment-form__grid">
			<Select
				label="Cabang"
				name="branchId"
				value={values.branchId}
				required
				error={branchError}
				hint="Pilih cabang aktif untuk penempatan ini."
			>
				<option value="">Pilih cabang</option>
				{#each branchOptions as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</Select>

			<Select
				label="Jabatan"
				name="positionId"
				value={values.positionId}
				required
				error={positionError}
				hint="Jabatan harus aktif dan sesuai struktur operasional."
			>
				<option value="">Pilih jabatan</option>
				{#each positionOptions as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</Select>

			<Select
				label="Supervisor"
				name="supervisorEmployeeId"
				value={values.supervisorEmployeeId}
				error={supervisorError}
				hint="Kosongkan bila belum ada supervisor aktif."
			>
				<option value="">Tanpa supervisor</option>
				{#each supervisorOptions as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</Select>

			<Input
				label="Mulai berlaku"
				name="effectiveFrom"
				type="date"
				value={values.effectiveFrom}
				required
				error={effectiveFromError}
				hint="Tanggal ini menentukan histori penempatan yang disimpan."
			/>

			<div class="assignment-form__field assignment-form__field--full">
				<label class="ui-field__label" for="assignment-reason">Alasan</label>
				<textarea
					id="assignment-reason"
					class={reasonError ? 'assignment-form__textarea assignment-form__textarea--error' : 'assignment-form__textarea'}
					name="reason"
					rows="4"
					required
					aria-invalid={reasonError ? 'true' : undefined}
					aria-describedby="assignment-reason-hint assignment-reason-error"
				>{values.reason}</textarea>
				<p class="ui-field__hint" id="assignment-reason-hint">
					Jelaskan alasan mutasi, penempatan awal, atau koreksi histori.
				</p>
				{#if reasonError}
					<p class="ui-field__error" id="assignment-reason-error">{reasonError}</p>
				{/if}
			</div>
		</div>

	<div class="button-row">
		<a class="button button-secondary" href={cancelHref}>Batal</a>
		<Button type="submit" busy={isBusy}>{submitLabel}</Button>
	</div>
</Card>
</form>

<style>
	.assignment-form {
		display: grid;
		gap: 1rem;
	}

	.assignment-form__header {
		display: grid;
		gap: 0.375rem;
		margin-bottom: 1rem;
	}

	.assignment-form__header h2 {
		margin: 0;
		font-size: 1rem;
		color: var(--ink-950);
	}

	.assignment-form__header p {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.6;
		color: var(--ink-500);
	}

	.assignment-form__grid {
		display: grid;
		gap: 1rem;
	}

	.assignment-form__field {
		display: grid;
		gap: 0.375rem;
	}

	.assignment-form__field--full {
		grid-column: 1 / -1;
	}

	.assignment-form__textarea {
		width: 100%;
		min-height: 120px;
		border: 1px solid var(--line-300);
		border-radius: var(--radius-md);
		background: var(--white);
		padding: 0.75rem 0.875rem;
		font: inherit;
		color: var(--ink-950);
		resize: vertical;
	}

	.assignment-form__textarea:focus {
		border-color: var(--brand-500);
		box-shadow: 0 0 0 3px rgb(99 102 241 / 0.14);
		outline: none;
	}

	.assignment-form__textarea--error {
		border-color: #fca5a5;
		background: #fff7f7;
	}

	.ui-field__label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--ink-800);
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

	@media (min-width: 960px) {
		.assignment-form__grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
