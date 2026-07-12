import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';

import Alert from './Alert.svelte';
import Badge from './Badge.svelte';
import Button from './Button.svelte';
import Card from './Card.svelte';
import EmptyState from './EmptyState.svelte';
import Input from './Input.svelte';
import LoadingState from './LoadingState.svelte';
import Select from './Select.svelte';

function snippet(content: string) {
	return createRawSnippet(() => ({
		render: () => content
	}));
}

describe('ui primitives', () => {
	it('renders button with default type and loading state', () => {
		const { body } = render(Button, {
			props: {
				busy: true,
				children: snippet('Simpan')
			}
		});

		expect(body).toContain('type="button"');
		expect(body).toContain('aria-busy="true"');
		expect(body).toContain('disabled');
		expect(body).toContain('Simpan');
	});

	it('renders input with connected label and error state', () => {
		const input = render(Input, {
			props: {
				label: 'Email',
				hint: 'Gunakan email kantor',
				error: 'Email wajib diisi',
				placeholder: 'nama@yukatitip.id'
			}
		});

		expect(input.body).toContain('id="input-email"');
		expect(input.body).toContain('for="input-email"');
		expect(input.body).toContain('aria-invalid="true"');
		expect(input.body).toContain('aria-describedby="input-email-hint input-email-error"');
		expect(input.body).toContain('id="input-email-error"');
		expect(input.body).toContain('placeholder="nama@yukatitip.id"');
		expect(input.body).toContain('Gunakan email kantor');
	});

	it('renders select with connected label and error state', () => {
		const select = render(Select, {
			props: {
				label: 'Cabang',
				hint: 'Pilih cabang aktif',
				error: 'Cabang wajib dipilih',
				children: snippet('<option value="makassar">Makassar</option>')
			}
		});

		expect(select.body).toContain('id="select-cabang"');
		expect(select.body).toContain('for="select-cabang"');
		expect(select.body).toContain('aria-invalid="true"');
		expect(select.body).toContain('aria-describedby="select-cabang-hint select-cabang-error"');
		expect(select.body).toContain('id="select-cabang-error"');
		expect(select.body).toContain('<option value="makassar">Makassar</option>');
		expect(select.body).toContain('Pilih cabang aktif');
	});

	it('renders alert tone roles and child content', () => {
		const infoAlert = render(Alert, {
			props: {
				title: 'Info fondasi',
				tone: 'info',
				children: snippet('Pembaruan berhasil disimpan.')
			}
		});
		const dangerAlert = render(Alert, {
			props: {
				title: 'Kesalahan',
				tone: 'danger',
				children: snippet('Gagal menyimpan perubahan.')
			}
		});

		expect(infoAlert.body).toContain('role="status"');
		expect(infoAlert.body).toContain('Pembaruan berhasil disimpan.');
		expect(dangerAlert.body).toContain('role="alert"');
		expect(dangerAlert.body).toContain('Gagal menyimpan perubahan.');
	});

	it('renders badge, card, empty state, and loading state with semantic markup', () => {
		const alert = render(Alert, {
			props: {
				title: 'Info fondasi',
				tone: 'info'
			}
		});
		const badge = render(Badge, {
			props: {
				tone: 'brand',
				children: snippet('Baru')
			}
		});
		const card = render(Card, {
			props: {
				as: 'section',
				children: snippet('<p>Konten kartu</p>')
			}
		});
		const emptyState = render(EmptyState, {
			props: {
				title: 'Belum ada data',
				description: 'Placeholder.',
				children: snippet('<button type="button">Tambah data</button>')
			}
		});
		const loadingState = render(LoadingState, {
			props: {
				label: 'Memuat order',
				lines: 2
			}
		});

		expect(alert.body).toContain('ui-alert--info');
		expect(badge.body).toContain('ui-badge--brand');
		expect(badge.body).toContain('Baru');
		expect(card.body).toContain('ui-card');
		expect(card.body).toContain('<section');
		expect(card.body).toContain('Konten kartu');
		expect(emptyState.body).toContain('<section');
		expect(emptyState.body).toContain('<h2');
		expect(emptyState.body).toContain('aria-labelledby="empty-state-belum-ada-data"');
		expect(emptyState.body).toContain('Belum ada data');
		expect(emptyState.body).toContain('<button type="button">Tambah data</button>');
		expect(loadingState.body).toContain('role="status"');
		expect(loadingState.body).toContain('aria-busy="true"');
		expect(loadingState.body).toContain('aria-labelledby="loading-state-memuat-order"');
		expect(loadingState.body).toContain('Memuat order');
	});
});
