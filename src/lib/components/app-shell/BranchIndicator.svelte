<script lang="ts">
	import type { SanitizedAuthBranch } from '$lib/types/auth';
	import Icon from './Icon.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	interface Props {
		branch: SanitizedAuthBranch | null;
		roleName: string;
		compact?: boolean;
	}

	let { branch, roleName, compact = false }: Props = $props();

	let branchTitle = $derived(branch ? branch.name : 'Seluruh cabang');
	let branchCode = $derived(branch ? branch.code : 'OWNER');
</script>

<div class:branch-indicator--compact={compact} class="branch-indicator">
	<span class="branch-indicator__icon" aria-hidden="true">
		<Icon name="branch" size={16} />
	</span>
	<div class="branch-indicator__copy">
		<Badge tone="brand" size="sm">Cabang aktif</Badge>
		<strong class="branch-indicator__title">{branchTitle}</strong>
		<span class="branch-indicator__meta">{branchCode} · {roleName}</span>
	</div>
</div>

<style>
	.branch-indicator {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		border: 1px solid var(--line-200);
		border-radius: var(--radius-md);
		background: rgb(255 255 255 / 0.9);
		padding: 0.875rem;
		color: var(--ink-700);
	}

	.branch-indicator--compact {
		border-radius: 999px;
		padding: 0.625rem 0.75rem;
	}

	.branch-indicator__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 0.5rem;
		background: var(--brand-50);
		color: var(--brand-700);
	}

	.branch-indicator__copy {
		display: grid;
		gap: 0.125rem;
		min-width: 0;
	}

	.branch-indicator__title {
		font-size: 0.9375rem;
		line-height: 1.35;
		color: var(--ink-950);
	}

	.branch-indicator__meta {
		font-size: 0.8125rem;
		line-height: 1.4;
		color: var(--ink-500);
	}

	.branch-indicator--compact .branch-indicator__title {
		font-size: 0.875rem;
	}
</style>
