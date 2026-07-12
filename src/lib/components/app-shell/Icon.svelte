<script lang="ts">
	type IconName =
		| 'dashboard'
		| 'orders'
		| 'tasks'
		| 'trips'
		| 'tracking'
		| 'customers'
		| 'stores'
		| 'branches'
		| 'routes'
		| 'payments'
		| 'expenses'
		| 'commissions'
		| 'payroll'
		| 'reports'
		| 'employees'
		| 'roles'
		| 'settings'
		| 'menu'
		| 'close'
		| 'user'
		| 'logout'
		| 'chevron-down'
		| 'branch';

	interface Props {
		name: IconName;
		size?: number;
		class?: string;
	}

	let { name, size = 20, class: className = '' }: Props = $props();

	let iconClasses = $derived(['app-icon', className].filter(Boolean).join(' '));
</script>

<svg
	class={iconClasses}
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.75"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
	focusable="false"
>
	{#if name === 'dashboard'}
		<path d="M4 13h6V4H4z" />
		<path d="M14 20h6v-7h-6z" />
		<path d="M14 4h6v5h-6z" />
		<path d="M4 16h6v4H4z" />
	{/if}

	{#if name === 'orders'}
		<path d="M7 3h10l4 4v14H3V7z" />
		<path d="M7 3v4h10" />
		<path d="M8 13h8" />
	{/if}

	{#if name === 'tasks'}
		<path d="M8 4h8" />
		<path d="M9 2h6v4H9z" />
		<path d="M6 6h12v16H6z" />
		<path d="m9 14 2 2 4-4" />
	{/if}

	{#if name === 'trips'}
		<path d="M3 16.5V11a2 2 0 0 1 2-2h11l3 3v4.5" />
		<path d="M3 16.5h2" />
		<path d="M19 16.5h2" />
		<circle cx="7" cy="17" r="2" />
		<circle cx="17" cy="17" r="2" />
	{/if}

	{#if name === 'tracking'}
		<path d="M12 21s6-4.35 6-10a6 6 0 1 0-12 0c0 5.65 6 10 6 10z" />
		<circle cx="12" cy="11" r="2.25" />
	{/if}

	{#if name === 'customers'}
		<circle cx="12" cy="8" r="3.25" />
		<path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
		<circle cx="19" cy="9" r="2" />
	{/if}

	{#if name === 'stores'}
		<path d="M4 10h16l-1-5H5z" />
		<path d="M5 10v10h14V10" />
		<path d="M9 20v-6h6v6" />
	{/if}

	{#if name === 'branches'}
		<path d="M6 20V7l6-3 6 3v13" />
		<path d="M10 20v-6h4v6" />
		<path d="M4 20h16" />
	{/if}

	{#if name === 'routes'}
		<path d="M4 7h8" />
		<path d="M12 7a3 3 0 1 1 0 6H8a3 3 0 1 0 0 6h8" />
		<path d="M14 5l2 2-2 2" />
		<path d="m16 13 2 2-2 2" />
	{/if}

	{#if name === 'payments'}
		<path d="M4 7h16v10H4z" />
		<path d="M4 11h16" />
		<path d="M8 15h3" />
	{/if}

	{#if name === 'expenses'}
		<path d="M5 4h14v16H5z" />
		<path d="M8 8h8" />
		<path d="M8 12h8" />
		<path d="M8 16h5" />
	{/if}

	{#if name === 'commissions'}
		<path d="M4 12h16" />
		<path d="M12 4v16" />
		<circle cx="12" cy="12" r="8" />
	{/if}

	{#if name === 'payroll'}
		<path d="M5 7h14v10H5z" />
		<path d="M8 11h8" />
		<path d="M8 14h4" />
	{/if}

	{#if name === 'reports'}
		<path d="M5 19V5" />
		<path d="M5 19h14" />
		<path d="M8 16v-5" />
		<path d="M12 16V9" />
		<path d="M16 16v-8" />
	{/if}

	{#if name === 'employees'}
		<circle cx="12" cy="8" r="3" />
		<path d="M5.5 20a7 7 0 0 1 13 0" />
		<path d="M18 8h1.5" />
		<path d="M18.75 6.5v3" />
	{/if}

	{#if name === 'roles'}
		<path d="M12 2 4 6v6c0 5.2 3.5 9.8 8 10 4.5-.2 8-4.8 8-10V6z" />
		<path d="M9.5 11.5 11 13l3.5-3.5" />
	{/if}

	{#if name === 'settings'}
		<path d="M10.6 3.2h2.8l.6 2.1a6.7 6.7 0 0 1 1.7.9l2.1-1 1.4 1.4-1 2.1a6.7 6.7 0 0 1 .9 1.7l2.1.6v2.8l-2.1.6a6.7 6.7 0 0 1-.9 1.7l1 2.1-1.4 1.4-2.1-1a6.7 6.7 0 0 1-1.7.9l-.6 2.1h-2.8l-.6-2.1a6.7 6.7 0 0 1-1.7-.9l-2.1 1-1.4-1.4 1-2.1a6.7 6.7 0 0 1-.9-1.7L2 13.4v-2.8l2.1-.6a6.7 6.7 0 0 1 .9-1.7l-1-2.1 1.4-1.4 2.1 1a6.7 6.7 0 0 1 1.7-.9z" />
		<circle cx="12" cy="12" r="3" />
	{/if}

	{#if name === 'menu'}
		<path d="M4 6h16" />
		<path d="M4 12h16" />
		<path d="M4 18h16" />
	{/if}

	{#if name === 'close'}
		<path d="m6 6 12 12" />
		<path d="m18 6-12 12" />
	{/if}

	{#if name === 'user'}
		<circle cx="12" cy="8" r="3.25" />
		<path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
	{/if}

	{#if name === 'logout'}
		<path d="M10 4H5v16h5" />
		<path d="M15 8l4 4-4 4" />
		<path d="M19 12H9" />
	{/if}

	{#if name === 'chevron-down'}
		<path d="m6 9 6 6 6-6" />
	{/if}

	{#if name === 'branch'}
		<path d="M7 4v8" />
		<path d="M7 12c0 2.2-1.8 4-4 4" />
		<path d="M7 12c0 2.2 1.8 4 4 4h2" />
		<path d="M15 8h4" />
		<path d="M15 16h4" />
	{/if}
</svg>

<style>
	.app-icon {
		display: inline-block;
		flex: none;
		color: currentColor;
	}
</style>
