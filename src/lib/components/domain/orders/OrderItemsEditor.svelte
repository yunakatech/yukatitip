<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { ORDER_ITEM_STATUS_OPTIONS } from '$lib/constants/orders';

	type StoreOption = {
		value: string;
		label: string;
	};

	export type EditableOrderItem = {
		storeId?: string | null;
		productName?: string;
		productUrl?: string | null;
		quantity?: number;
		estimatedUnitPrice?: number;
		actualUnitPrice?: number | null;
		weightGrams?: number | null;
		attributes?: unknown;
		notes?: string | null;
		status?: string;
	};

	type Row = EditableOrderItem & {
		key: string;
	};

	let {
		items = [],
		stores = [],
		includeStatus = false
	}: {
		items?: EditableOrderItem[];
		stores: StoreOption[];
		includeStatus?: boolean;
	} = $props();

	function toRow(item: EditableOrderItem = {}): Row {
		return {
			key: crypto.randomUUID(),
			storeId: item.storeId ?? '',
			productName: item.productName ?? '',
			productUrl: item.productUrl ?? '',
			quantity: item.quantity ?? 1,
			estimatedUnitPrice: item.estimatedUnitPrice ?? 0,
			actualUnitPrice: item.actualUnitPrice ?? null,
			weightGrams: item.weightGrams ?? null,
			attributes: item.attributes ?? {},
			notes: item.notes ?? '',
			status: item.status ?? 'recorded'
		};
	}

	function createInitialRows(): Row[] {
		return items.length > 0 ? items.map((item) => toRow(item)) : [toRow()];
	}

	let rows = $state<Row[]>(createInitialRows());

	function addItem() {
		rows = [...rows, toRow()];
	}

	function removeItem(key: string) {
		if (rows.length === 1) {
			return;
		}

		rows = rows.filter((row) => row.key !== key);
	}

	function stringifyAttributes(value: unknown): string {
		if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) {
			return '';
		}

		try {
			return JSON.stringify(value);
		} catch {
			return '';
		}
	}
</script>

<div class="items-editor">
	<input type="hidden" name="itemCount" value={rows.length} />

	<div class="items-editor__header">
		<h2>Item barang</h2>
		<Button type="button" variant="secondary" size="sm" onclick={addItem}>Tambah item</Button>
	</div>

	<div class="items-editor__list">
		{#each rows as row, index (row.key)}
			<section class="item-panel" aria-labelledby={`order-item-${index}`}>
				<div class="item-panel__header">
					<h3 id={`order-item-${index}`}>Item {index + 1}</h3>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						disabled={rows.length === 1}
						onclick={() => removeItem(row.key)}
					>
						Hapus
					</Button>
				</div>

				<div class="item-panel__grid">
					<Select id={`items-${index}-store`} label="Toko" name={`items[${index}].storeId`} value={row.storeId ?? ''}>
						<option value="">Belum dipilih</option>
						{#each stores as store (store.value)}
							<option value={store.value}>{store.label}</option>
						{/each}
					</Select>
					<Input id={`items-${index}-product-name`} label="Nama barang" name={`items[${index}].productName`} value={row.productName ?? ''} required />
					<Input id={`items-${index}-quantity`} label="Jumlah" name={`items[${index}].quantity`} inputmode="numeric" value={row.quantity ?? 1} required />
					<Input
						id={`items-${index}-estimated-unit-price`}
						label="Harga perkiraan"
						name={`items[${index}].estimatedUnitPrice`}
						inputmode="numeric"
						value={row.estimatedUnitPrice ?? 0}
						required
					/>
					<Input id={`items-${index}-product-url`} label="Link produk" name={`items[${index}].productUrl`} value={row.productUrl ?? ''} />
					<Input id={`items-${index}-weight-grams`} label="Berat gram" name={`items[${index}].weightGrams`} inputmode="numeric" value={row.weightGrams ?? ''} />
					{#if includeStatus}
						<Select id={`items-${index}-status`} label="Status item" name={`items[${index}].status`} value={row.status ?? 'recorded'}>
							{#each ORDER_ITEM_STATUS_OPTIONS as option (option.value)}
								<option value={option.value}>{option.label}</option>
							{/each}
						</Select>
						<Input
							id={`items-${index}-actual-unit-price`}
							label="Harga aktual"
							name={`items[${index}].actualUnitPrice`}
							inputmode="numeric"
							value={row.actualUnitPrice ?? ''}
						/>
					{:else}
						<input type="hidden" name={`items[${index}].status`} value="recorded" />
					{/if}
					<Input id={`items-${index}-attributes`} label="Atribut JSON" name={`items[${index}].attributes`} value={stringifyAttributes(row.attributes)} />
					<Input id={`items-${index}-notes`} label="Catatan item" name={`items[${index}].notes`} value={row.notes ?? ''} />
				</div>
			</section>
		{/each}
	</div>
</div>

<style>
	.items-editor,
	.items-editor__list,
	.item-panel {
		display: grid;
		gap: 1rem;
	}

	.items-editor__header,
	.item-panel__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.items-editor__header h2,
	.item-panel__header h3 {
		margin: 0;
		color: var(--ink-950);
	}

	.items-editor__header h2 {
		font-size: 1rem;
	}

	.item-panel {
		border: 1px solid var(--line-200);
		border-radius: var(--radius-md);
		padding: 1rem;
	}

	.item-panel__header h3 {
		font-size: 0.9375rem;
	}

	.item-panel__grid {
		display: grid;
		gap: 1rem;
	}

	@media (min-width: 960px) {
		.item-panel__grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
