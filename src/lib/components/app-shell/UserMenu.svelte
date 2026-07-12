<script lang="ts">
	import { resolve } from '$app/paths';
	import type { AuthContext } from '$lib/types/auth';
	import Icon from './Icon.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		auth: AuthContext;
	}

	let { auth }: Props = $props();

	let firstName = $derived(auth.profile.fullName.split(' ')[0] ?? auth.profile.fullName);
</script>

<details class="user-menu">
	<summary class="user-menu__summary">
		<span class="user-menu__avatar" aria-hidden="true">
			<Icon name="user" size={16} />
		</span>
		<span class="user-menu__copy">
			<strong>{firstName}</strong>
			<span>{auth.profile.role.name}</span>
		</span>
		<span class="user-menu__chevron" aria-hidden="true">
			<Icon name="chevron-down" size={16} />
		</span>
	</summary>

	<div class="user-menu__panel">
		<div class="user-menu__profile">
			<strong>{auth.profile.fullName}</strong>
			<span>{auth.user.email ?? 'Email tidak tersedia'}</span>
			<span>{auth.branch ? auth.branch.name : 'Seluruh cabang'}</span>
		</div>

		<a class="user-menu__link" href={resolve('/')}>Buka landing publik</a>

		<form class="user-menu__logout" method="POST" action={resolve('/logout')}>
			<Button variant="secondary" fullWidth type="submit">
				<Icon name="logout" size={16} />
				<span>Keluar</span>
			</Button>
		</form>
	</div>
</details>

<style>
	.user-menu {
		position: relative;
	}

	.user-menu > summary {
		list-style: none;
	}

	.user-menu > summary::-webkit-details-marker {
		display: none;
	}

	.user-menu__summary {
		display: inline-flex;
		align-items: center;
		gap: 0.625rem;
		border: 1px solid var(--line-200);
		border-radius: 999px;
		background: rgb(255 255 255 / 0.92);
		padding: 0.5rem 0.625rem 0.5rem 0.5rem;
		color: var(--ink-800);
		cursor: pointer;
		transition:
			border-color 140ms ease,
			background-color 140ms ease,
			box-shadow 140ms ease;
	}

	.user-menu__summary:hover {
		border-color: var(--brand-100);
		background: var(--brand-50);
	}

	.user-menu__summary:focus-visible {
		outline: 3px solid rgb(99 102 241 / 0.28);
		outline-offset: 2px;
	}

	.user-menu__avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 999px;
		background: var(--brand-50);
		color: var(--brand-700);
	}

	.user-menu__copy {
		display: grid;
		gap: 0.1rem;
		min-width: 0;
	}

	.user-menu__copy strong {
		font-size: 0.875rem;
		line-height: 1.25;
	}

	.user-menu__copy span {
		font-size: 0.75rem;
		line-height: 1.3;
		color: var(--ink-500);
	}

	.user-menu__chevron {
		display: inline-flex;
		color: var(--ink-500);
	}

	.user-menu[open] .user-menu__summary {
		border-color: var(--brand-100);
		box-shadow: 0 0 0 3px rgb(99 102 241 / 0.12);
	}

	.user-menu__panel {
		position: absolute;
		right: 0;
		top: calc(100% + 0.5rem);
		z-index: 20;
		width: min(24rem, calc(100vw - 2rem));
		border: 1px solid var(--line-200);
		border-radius: var(--radius-lg);
		background: rgb(255 255 255 / 0.98);
		box-shadow: var(--shadow-overlay);
		padding: 1rem;
		display: grid;
		gap: 0.875rem;
	}

	.user-menu__profile {
		display: grid;
		gap: 0.2rem;
	}

	.user-menu__profile strong {
		font-size: 0.9375rem;
		color: var(--ink-950);
	}

	.user-menu__profile span {
		font-size: 0.8125rem;
		line-height: 1.45;
		color: var(--ink-500);
	}

	.user-menu__link {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		border-radius: var(--radius-md);
		padding: 0 0.875rem;
		color: var(--ink-800);
		background: var(--surface-100);
	}

	.user-menu__link:hover {
		background: var(--brand-50);
		color: var(--brand-700);
	}

	.user-menu__logout :global(.ui-button) {
		justify-content: center;
	}
</style>
