<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ActionData, PageData } from './$types';

	import Alert from '$lib/components/ui/Alert.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import PageHeader from '$lib/components/app-shell/PageHeader.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import {
		ORDER_PAYMENT_METHOD_OPTIONS,
		ORDER_STATUS_LABELS,
		ORDER_STATUS_TONES,
		PAYMENT_STATUS_TONES
	} from '$lib/constants/orders';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const currency = new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		maximumFractionDigits: 0
	});

	const statusOptions = Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({ value, label }));
</script>

<svelte:head>
	<title>{data.order.trackingNumber} | Yukatitip</title>
</svelte:head>

<section class="order-detail">
	<PageHeader
		eyebrow="Pesanan"
		title={data.order.trackingNumber}
		description={`${data.order.customer.name} - ${data.order.route.name}`}
	/>

	<div class="order-detail__actions">
		<a class="button button-secondary" href={resolve('/app/orders')}>Kembali</a>
		{#if data.order.canEdit}
			<a class="button button-primary" href={resolve(`/app/orders/${data.order.id}/edit`)}>Ubah pesanan</a>
		{/if}
	</div>

	{#if form?.statusError}
		<Alert tone="danger" title="Gagal memperbarui status">{form.statusError}</Alert>
	{/if}
	{#if form?.paymentError}
		<Alert tone="danger" title="Gagal memproses pembayaran">{form.paymentError}</Alert>
	{/if}

	<div class="summary-grid">
		<Card as="section">
			<div class="summary-card">
				<span>Status</span>
				<Badge tone={ORDER_STATUS_TONES[data.order.status]}>{data.order.statusLabel}</Badge>
				<p>{data.order.fulfillmentLabel}</p>
			</div>
		</Card>
		<Card as="section">
			<div class="summary-card">
				<span>Pembayaran</span>
				<Badge tone={PAYMENT_STATUS_TONES[data.order.paymentStatus]}>{data.order.paymentStatusLabel}</Badge>
				<p>{currency.format(data.order.totalCustomerPayment)}</p>
			</div>
		</Card>
		<Card as="section">
			<div class="summary-card">
				<span>Rute</span>
				<strong>{data.order.origin.code} ke {data.order.destination.code}</strong>
				<p>{data.order.route.name}</p>
			</div>
		</Card>
	</div>

	<Card as="section">
		<div class="money-grid">
			<div>
				<span>Nilai barang</span>
				<strong>{currency.format(data.order.goodsAmount)}</strong>
			</div>
			<div>
				<span>Pendapatan jasa</span>
				<strong>{currency.format(data.order.serviceRevenue)}</strong>
			</div>
			<div>
				<span>Jasa tambahan</span>
				<strong>{currency.format(data.order.additionalServiceFees)}</strong>
			</div>
			<div>
				<span>Diskon</span>
				<strong>{currency.format(data.order.discountAmount)}</strong>
			</div>
		</div>
	</Card>

	<div class="detail-grid">
		<Card as="section">
			<div class="section-heading">
				<h2>Item barang</h2>
			</div>
			<div class="item-list">
				{#each data.order.items as item (item.id)}
					<article class="item-row">
						<div>
							<h3>{item.productName}</h3>
							<p>{item.store?.name ?? 'Toko belum dipilih'}</p>
						</div>
						<div class="item-row__money">
							<strong>{currency.format(item.estimatedUnitPrice)}</strong>
							<span>{item.quantity} item</span>
						</div>
					</article>
				{/each}
			</div>
		</Card>

		<Card as="section">
			<div class="section-heading">
				<h2>Perbarui status</h2>
			</div>
			<form class="stack-form" method="POST" action="?/status">
				<input type="hidden" name="expectedVersion" value={data.order.version} />
				<Select label="Status baru" name="status" value={form?.statusValues?.status ?? data.order.status}>
					{#each statusOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</Select>
				<Input label="Deskripsi publik" name="publicDescription" value={form?.statusValues?.publicDescription ?? ''} required />
				<Input label="Catatan internal" name="internalDescription" value={form?.statusValues?.internalDescription ?? ''} />
				<Input label="Lokasi" name="location" value={form?.statusValues?.location ?? ''} />
				<Button type="submit">Simpan status</Button>
			</form>
		</Card>
	</div>

	<div class="detail-grid">
		<Card as="section">
			<div class="section-heading">
				<h2>Pembayaran</h2>
			</div>
			<form class="stack-form" method="POST" action="?/payment" enctype="multipart/form-data">
				<Input label="Nominal" name="amount" inputmode="numeric" value={form?.paymentValues?.amount ?? data.order.totalCustomerPayment} required />
				<Select label="Metode" name="paymentMethod" value={form?.paymentValues?.paymentMethod ?? 'bank_transfer'}>
					{#each ORDER_PAYMENT_METHOD_OPTIONS as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</Select>
				<Input label="Waktu pembayaran" name="paidAt" type="datetime-local" value="" />
				<Input label="Bukti pembayaran" name="attachment" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" />
				<Input label="Catatan" name="notes" value={form?.paymentValues?.notes ?? ''} />
				<Button type="submit">Catat pembayaran</Button>
			</form>

			<div class="payment-list">
				{#each data.order.payments as payment (payment.id)}
					<article class="payment-row">
						<div>
							<strong>{currency.format(payment.amount)}</strong>
							<span>{payment.paymentMethod}</span>
							{#if payment.attachment}
								<span>Bukti: {payment.attachment.originalFilename}</span>
							{/if}
						</div>
						<Badge tone={PAYMENT_STATUS_TONES[payment.status]}>{payment.statusLabel}</Badge>
						{#if payment.status === 'unpaid'}
							<form class="verify-row" method="POST" action="?/verifyPayment">
								<input type="hidden" name="paymentId" value={payment.id} />
								<button class="button button-secondary" type="submit" name="decision" value="reject">Tolak</button>
								<button class="button button-primary" type="submit" name="decision" value="approve">Verifikasi</button>
							</form>
						{/if}
					</article>
				{/each}
			</div>
		</Card>

		<Card as="section">
			<div class="section-heading">
				<h2>Timeline internal</h2>
			</div>
			<ol class="timeline">
				{#each data.order.timeline as event (event.id)}
					<li>
						<Badge tone={ORDER_STATUS_TONES[event.status]}>{event.statusLabel}</Badge>
						<p>{event.publicDescription}</p>
						{#if event.internalDescription}
							<span>{event.internalDescription}</span>
						{/if}
					</li>
				{/each}
			</ol>
		</Card>
	</div>
</section>

<style>
	.order-detail {
		display: grid;
		gap: 1rem;
	}

	.order-detail__actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.summary-grid,
	.detail-grid,
	.money-grid {
		display: grid;
		gap: 1rem;
	}

	.summary-card,
	.stack-form,
	.section-heading,
	.item-list,
	.payment-list {
		display: grid;
		gap: 0.75rem;
	}

	.summary-card span,
	.money-grid span,
	.item-row p,
	.payment-row span,
	.timeline span {
		font-size: 0.8125rem;
		color: var(--ink-500);
	}

	.summary-card p,
	.summary-card strong,
	.section-heading h2,
	.item-row h3,
	.timeline p {
		margin: 0;
	}

	.summary-card strong,
	.money-grid strong {
		color: var(--ink-950);
	}

	.money-grid div {
		display: grid;
		gap: 0.25rem;
	}

	.item-row,
	.payment-row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		border-bottom: 1px solid var(--line-200);
		padding-bottom: 0.75rem;
	}

	.item-row__money,
	.payment-row div {
		display: grid;
		gap: 0.125rem;
		text-align: right;
	}

	.verify-row {
		display: flex;
		gap: 0.5rem;
	}

	.timeline {
		display: grid;
		gap: 0.75rem;
		margin: 0;
		padding-left: 1.25rem;
	}

	.timeline li {
		display: grid;
		gap: 0.375rem;
	}

	@media (min-width: 960px) {
		.summary-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.detail-grid {
			grid-template-columns: minmax(0, 1.2fr) minmax(18rem, 0.8fr);
		}

		.money-grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}
</style>
