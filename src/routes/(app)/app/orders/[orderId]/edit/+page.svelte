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
	import { ORDER_FULFILLMENT_OPTIONS, ORDER_SERVICE_TYPE_OPTIONS } from '$lib/constants/orders';

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
			actualUnitPrice?: number | null;
			weightGrams?: number | null;
			attributes?: unknown;
			notes?: string | null;
			status?: string;
		}>;
	};

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const values = $derived((form?.values ?? {}) as OrderFormValues);
	const orderItems = $derived(
		data.order.items.map((item) => ({
			storeId: item.store?.id ?? '',
			productName: item.productName,
			productUrl: item.productUrl,
			quantity: item.quantity,
			estimatedUnitPrice: item.estimatedUnitPrice,
			actualUnitPrice: item.actualUnitPrice,
			weightGrams: item.weightGrams,
			attributes: item.attributes,
			notes: item.notes,
			status: item.status
		}))
	);
</script>

<svelte:head>
	<title>Ubah {data.order.trackingNumber} | Yukatitip</title>
</svelte:head>

<section class="order-edit">
	<PageHeader
		eyebrow="Pesanan"
		title={`Ubah ${data.order.trackingNumber}`}
		description="Edit hanya tersedia sebelum pembayaran atau proses operasional berjalan."
	/>

	{#if form?.error}
		<Alert tone="danger" title="Gagal menyimpan">{form.error}</Alert>
	{/if}

	{#if !data.order.canEdit}
		<Alert tone="warning" title="Pesanan tidak dapat diedit">
			Pesanan yang sudah diproses hanya dapat diperbarui melalui status dan pembayaran.
		</Alert>
	{:else}
		<form class="order-form" method="POST">
			<input type="hidden" name="expectedVersion" value={data.order.version} />

			<Card as="section">
				<div class="order-form__grid">
					<Select label="Customer pengirim" name="senderCustomerId" value={values.senderCustomerId ?? data.order.customer.id} required>
						{#each data.references.customers as customer (customer.value)}
							<option value={customer.value}>{customer.label}</option>
						{/each}
					</Select>
					<Select label="Customer penerima" name="receiverCustomerId" value={values.receiverCustomerId ?? data.order.receiver?.id ?? ''}>
						<option value="">Sama / belum diisi</option>
						{#each data.references.customers as customer (customer.value)}
							<option value={customer.value}>{customer.label}</option>
						{/each}
					</Select>
					<Select label="Rute" name="routeId" value={values.routeId ?? data.order.route.id} required>
						{#each data.references.routes as route (route.value)}
							<option value={route.value}>{route.label}</option>
						{/each}
					</Select>
					<Select label="Cabang asal" name="originBranchId" value={values.originBranchId ?? data.order.origin.id} required>
						{#each data.references.branches as branch (branch.value)}
							<option value={branch.value}>{branch.label}</option>
						{/each}
					</Select>
					<Select label="Cabang tujuan" name="destinationBranchId" value={values.destinationBranchId ?? data.order.destination.id} required>
						{#each data.references.branches as branch (branch.value)}
							<option value={branch.value}>{branch.label}</option>
						{/each}
					</Select>
					<Select label="Jenis layanan" name="serviceType" value={values.serviceType ?? data.order.serviceType} required>
						{#each ORDER_SERVICE_TYPE_OPTIONS as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</Select>
					<Select label="Metode penerimaan" name="fulfillmentMethod" value={values.fulfillmentMethod ?? data.order.fulfillmentMethod} required>
						{#each ORDER_FULFILLMENT_OPTIONS as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</Select>
					<Input label="Alamat antar lokal" name="deliveryAddress" value={values.deliveryAddress ?? data.order.deliveryAddress ?? ''} />
				</div>
			</Card>

			<Card as="section">
				<div class="order-form__grid order-form__grid--money">
					<Input label="Nilai barang" name="goodsAmount" inputmode="numeric" value={values.goodsAmount ?? data.order.goodsAmount} required />
					<Input label="Pendapatan jasa" name="serviceRevenue" inputmode="numeric" value={values.serviceRevenue ?? data.order.serviceRevenue} required />
					<Input label="Biaya jasa tambahan" name="additionalServiceFees" inputmode="numeric" value={values.additionalServiceFees ?? data.order.additionalServiceFees} required />
					<Input label="Diskon" name="discountAmount" inputmode="numeric" value={values.discountAmount ?? data.order.discountAmount} required />
				</div>
			</Card>

			<Card as="section">
				<OrderItemsEditor items={values.items ?? orderItems} stores={data.references.stores} includeStatus />
			</Card>

			<Card as="section">
				<div class="order-form__grid">
					<Input label="Catatan publik" name="publicNotes" value={values.publicNotes ?? data.order.publicNotes ?? ''} />
					<Input label="Catatan internal" name="internalNotes" value={values.internalNotes ?? data.order.internalNotes ?? ''} />
				</div>
			</Card>

			<div class="button-row">
				<a class="button button-secondary" href={resolve(`/app/orders/${data.order.id}`)}>Batal</a>
				<Button type="submit">Simpan perubahan</Button>
			</div>
		</form>
	{/if}
</section>

<style>
	.order-edit,
	.order-form {
		display: grid;
		gap: 1rem;
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
