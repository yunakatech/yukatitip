<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ActionData, PageData } from './$types';

	import Alert from '$lib/components/ui/Alert.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import OrderItemsEditor from '$lib/components/domain/orders/OrderItemsEditor.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import PageHeader from '$lib/components/app-shell/PageHeader.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import {
		ORDER_FULFILLMENT_OPTIONS,
		ORDER_SERVICE_TYPE_OPTIONS
	} from '$lib/constants/orders';

	type OrderFormValues = {
		serviceType?: string;
		fulfillmentMethod?: string;
		originBranchId?: string;
		destinationBranchId?: string;
		routeId?: string;
		senderCustomerId?: string;
		receiverCustomerId?: string | null;
		goodsAmount?: number;
		serviceRevenue?: number;
		additionalServiceFees?: number;
		discountAmount?: number;
		deliveryAddress?: string | null;
		publicNotes?: string | null;
		internalNotes?: string | null;
		items?: Array<{
			storeId?: string | null;
			productName?: string;
			productUrl?: string | null;
			quantity?: number;
			estimatedUnitPrice?: number;
			weightGrams?: number | null;
			attributes?: unknown;
			notes?: string | null;
		}>;
	};

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const values = $derived((form?.values ?? {}) as OrderFormValues);

	const selectedRoute = $derived(
		data.references.routes.find((route) => route.value === values.routeId) ?? data.references.routes[0]
	);
	const defaultOrigin = $derived(values.originBranchId ?? selectedRoute?.originBranchId ?? data.references.branches[0]?.value ?? '');
	const defaultDestination = $derived(values.destinationBranchId ?? selectedRoute?.destinationBranchId ?? data.references.branches[1]?.value ?? '');
</script>

<svelte:head>
	<title>Pesanan baru | Yukatitip</title>
</svelte:head>

<section class="order-form-page">
	<PageHeader
		eyebrow="Operasional"
		title="Pesanan baru"
		description="Catat customer, rute, nilai barang, pendapatan jasa, dan item awal."
	/>

	{#if form?.error}
		<Alert tone="danger" title="Gagal menyimpan">
			{form.error}
		</Alert>
	{/if}

	<form class="order-form" method="POST">
		<Card as="section">
			<div class="order-form__section">
				<h2>Customer dan rute</h2>
				<div class="order-form__grid">
					<Select label="Customer pengirim" name="senderCustomerId" value={values.senderCustomerId ?? ''} required>
						<option value="">Pilih customer</option>
						{#each data.references.customers as customer (customer.value)}
							<option value={customer.value}>{customer.label}</option>
						{/each}
					</Select>
					<Select label="Customer penerima" name="receiverCustomerId" value={values.receiverCustomerId ?? ''}>
						<option value="">Sama / belum diisi</option>
						{#each data.references.customers as customer (customer.value)}
							<option value={customer.value}>{customer.label}</option>
						{/each}
					</Select>
					<Select label="Rute" name="routeId" value={values.routeId ?? data.references.routes[0]?.value ?? ''} required>
						<option value="">Pilih rute</option>
						{#each data.references.routes as route (route.value)}
							<option value={route.value}>{route.label}</option>
						{/each}
					</Select>
					<Select label="Cabang asal" name="originBranchId" value={defaultOrigin} required>
						{#each data.references.branches as branch (branch.value)}
							<option value={branch.value}>{branch.label}</option>
						{/each}
					</Select>
					<Select label="Cabang tujuan" name="destinationBranchId" value={defaultDestination} required>
						{#each data.references.branches as branch (branch.value)}
							<option value={branch.value}>{branch.label}</option>
						{/each}
					</Select>
					<Select label="Jenis layanan" name="serviceType" value={values.serviceType ?? 'purchase'} required>
						{#each ORDER_SERVICE_TYPE_OPTIONS as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</Select>
					<Select label="Metode penerimaan" name="fulfillmentMethod" value={values.fulfillmentMethod ?? 'branch_pickup'} required>
						{#each ORDER_FULFILLMENT_OPTIONS as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</Select>
					<Input label="Alamat antar lokal" name="deliveryAddress" value={values.deliveryAddress ?? ''} />
				</div>
			</div>
		</Card>

		<Card as="section">
			<div class="order-form__section">
				<h2>Nilai pembayaran</h2>
				<div class="order-form__grid order-form__grid--money">
					<Input label="Nilai barang" name="goodsAmount" inputmode="numeric" value={values.goodsAmount ?? 0} required />
					<Input label="Pendapatan jasa" name="serviceRevenue" inputmode="numeric" value={values.serviceRevenue ?? 0} required />
					<Input label="Biaya jasa tambahan" name="additionalServiceFees" inputmode="numeric" value={values.additionalServiceFees ?? 0} required />
					<Input label="Diskon" name="discountAmount" inputmode="numeric" value={values.discountAmount ?? 0} required />
				</div>
			</div>
		</Card>

		<Card as="section">
			<div class="order-form__section">
				<OrderItemsEditor items={values.items ?? []} stores={data.references.stores} />
			</div>
		</Card>

		<Card as="section">
			<div class="order-form__section">
				<h2>Catatan</h2>
				<div class="order-form__grid">
					<Input label="Catatan publik" name="publicNotes" value={values.publicNotes ?? ''} />
					<Input label="Catatan internal" name="internalNotes" value={values.internalNotes ?? ''} />
				</div>
			</div>
		</Card>

		<div class="button-row">
			<a class="button button-secondary" href={resolve('/app/orders')}>Batal</a>
			<Button type="submit">Simpan pesanan</Button>
		</div>
	</form>
</section>

<style>
	.order-form-page,
	.order-form,
	.order-form__section {
		display: grid;
		gap: 1rem;
	}

	.order-form__section h2 {
		margin: 0;
		font-size: 1rem;
		color: var(--ink-950);
	}

	.order-form__grid {
		display: grid;
		gap: 1rem;
	}

	@media (min-width: 960px) {
		.order-form__grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.order-form__grid--money {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}
</style>
