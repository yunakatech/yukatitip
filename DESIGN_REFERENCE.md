# DESIGN_REFERENCE.md — Yukatitip

Dokumen ini adalah sumber kebenaran untuk arah visual, UI, UX, dan perilaku antarmuka Yukatitip.

Baca bersama:

- `PRD_Yukatitip.md`
- `AGENTS.md`
- `schema.md`
- `schema.sql`

Jika ada konflik:

1. `PRD_Yukatitip.md` menentukan kebutuhan bisnis.
2. `AGENTS.md` menentukan aturan teknis dan cara AI bekerja.
3. `DESIGN_REFERENCE.md` menentukan pengalaman pengguna dan konsistensi visual.

Jangan mengubah arah visual utama tanpa persetujuan pengguna.

---

## 1. Identitas Produk

**Nama brand:** Yukatitip  
**Tagline:** Belanja Jauh Jadi Lebih Dekat  
**Kategori:** Jasa titip antar-kota dan web app operasional internal  
**Karakter:** Tepercaya, dekat, praktis, transparan, lokal, dan profesional

Yukatitip bukan marketplace umum dan bukan perusahaan logistik berskala besar. Desain harus terasa dekat dengan pengguna lokal, tetapi tetap rapi dan dapat dipercaya.

---

## 2. Tujuan Desain

Desain Yukatitip harus membantu pengguna:

- Memahami status barang dalam beberapa detik.
- Menyelesaikan pekerjaan operasional tanpa kebingungan.
- Menggunakan web app melalui HP saat berada di lapangan.
- Membedakan data barang, biaya, revenue, dan pembayaran dengan jelas.
- Mengetahui aksi berikutnya dari setiap halaman.
- Menghindari kesalahan saat mengubah status, biaya, dan pembayaran.
- Merasakan bahwa data pesanan aman dan terkelola.

Prioritas desain:

```text
Kejelasan
→ Kecepatan
→ Kepercayaan
→ Konsistensi
→ Estetika
```

Estetika tidak boleh mengorbankan fungsi operasional.

---

## 3. Prinsip UX

### 3.1 Satu Halaman, Satu Tujuan Utama

Setiap halaman harus memiliki satu aksi primer yang jelas.

Contoh:

- Halaman daftar pesanan: `Tambah Pesanan`.
- Detail pesanan: `Perbarui Status`.
- Detail tugas: `Mulai Tugas` atau `Selesaikan Tugas`.
- Pengeluaran: `Ajukan Biaya`.
- Tracking: `Lacak Pesanan`.

### 3.2 Status Harus Terlihat

Status utama selalu terlihat pada:

- Header halaman detail.
- Daftar tabel atau kartu.
- Timeline tracking.
- Dashboard operasional.

Jangan menyembunyikan status dalam menu tambahan.

### 3.3 Nominal Harus Mudah Dibedakan

Pisahkan secara visual:

- Harga barang customer.
- Pendapatan jasa.
- Biaya operasional.
- Komisi.
- Total pembayaran.

Gunakan label yang eksplisit. Jangan hanya menampilkan satu angka “Total”.

### 3.4 Hindari Informasi Berlebihan

Gunakan progressive disclosure:

- Ringkasan pada kartu atau tabel.
- Detail lengkap di halaman detail.
- Informasi teknis hanya muncul jika dibutuhkan.

### 3.5 Mobile-First untuk Petugas

Halaman petugas harus dapat digunakan dengan satu tangan:

- Tombol besar.
- Form singkat.
- Input angka mudah diakses.
- Aksi utama berada di area bawah layar.
- Tidak mengandalkan tabel lebar.

### 3.6 Konfirmasi untuk Aksi Sensitif

Gunakan dialog konfirmasi untuk:

- Membatalkan pesanan.
- Menyelesaikan batch.
- Menyetujui biaya.
- Menolak biaya.
- Mengunci komisi.
- Mengunci payroll.
- Menonaktifkan akun.
- Menghapus file.

---

## 4. Arah Visual

Arah visual Yukatitip:

- Modern SaaS.
- Bersih dan ringan.
- Putih sebagai kanvas utama.
- Warna indigo sebagai warna kepercayaan dan sistem.
- Warna coral sebagai aksen hangat dan identitas.
- Banyak ruang kosong.
- Border halus.
- Shadow lembut.
- Tidak menggunakan gradien berlebihan.
- Tidak menggunakan ilustrasi dekoratif pada halaman operasional.

Hindari tampilan yang menyerupai:

- Marketplace penuh promo.
- Aplikasi bank.
- Dashboard enterprise yang padat.
- Tema hijau dominan yang dekat dengan identitas Tokopedia atau Grab.
- Tampilan neon atau cyberpunk.

---

## 5. Palet Warna

Palet berikut adalah referensi desain awal dan dapat disesuaikan jika aset logo final memiliki warna yang berbeda.

### 5.1 Brand Colors

| Token | Hex | Penggunaan |
|---|---|---|
| `brand-900` | `#312E81` | Teks brand gelap, header tertentu |
| `brand-700` | `#4338CA` | Primary hover |
| `brand-600` | `#4F46E5` | Primary action |
| `brand-500` | `#6366F1` | Focus dan aksen |
| `brand-100` | `#E0E7FF` | Background badge |
| `brand-50` | `#EEF2FF` | Background ringan |

### 5.2 Accent Colors

| Token | Hex | Penggunaan |
|---|---|---|
| `accent-600` | `#E95B3F` | Aksen utama, highlight penting |
| `accent-500` | `#F26B4F` | Aksen hangat |
| `accent-100` | `#FFE4DE` | Background aksen |
| `accent-50` | `#FFF4F1` | Background ringan |

### 5.3 Neutral Colors

| Token | Hex | Penggunaan |
|---|---|---|
| `ink-950` | `#111827` | Judul dan teks utama |
| `ink-800` | `#1F2937` | Teks sekunder kuat |
| `ink-600` | `#4B5563` | Teks sekunder |
| `ink-500` | `#6B7280` | Helper text |
| `line-300` | `#D1D5DB` | Border input |
| `line-200` | `#E5E7EB` | Border card |
| `surface-100` | `#F3F4F6` | Background section |
| `surface-50` | `#F9FAFB` | Background app |
| `white` | `#FFFFFF` | Card dan halaman |

### 5.4 Semantic Colors

| Fungsi | Warna |
|---|---|
| Success | `#15803D` |
| Success background | `#DCFCE7` |
| Warning | `#B45309` |
| Warning background | `#FEF3C7` |
| Danger | `#B91C1C` |
| Danger background | `#FEE2E2` |
| Info | `#0369A1` |
| Info background | `#E0F2FE` |

### 5.5 CSS Variables

```css
:root {
  --color-brand-900: #312e81;
  --color-brand-700: #4338ca;
  --color-brand-600: #4f46e5;
  --color-brand-500: #6366f1;
  --color-brand-100: #e0e7ff;
  --color-brand-50: #eef2ff;

  --color-accent-600: #e95b3f;
  --color-accent-500: #f26b4f;
  --color-accent-100: #ffe4de;
  --color-accent-50: #fff4f1;

  --color-ink-950: #111827;
  --color-ink-800: #1f2937;
  --color-ink-600: #4b5563;
  --color-ink-500: #6b7280;

  --color-line-300: #d1d5db;
  --color-line-200: #e5e7eb;
  --color-surface-100: #f3f4f6;
  --color-surface-50: #f9fafb;
  --color-white: #ffffff;
}
```

---

## 6. Tipografi

### 6.1 Font

Gunakan satu keluarga font UI utama:

```css
font-family:
  Inter,
  "Plus Jakarta Sans",
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

Prioritas:

1. Inter.
2. Plus Jakarta Sans.
3. System UI.

Jangan menambahkan banyak keluarga font.

### 6.2 Skala Tipografi

| Style | Desktop | Mobile | Weight |
|---|---:|---:|---:|
| Display | 48px | 36px | 700 |
| H1 | 32px | 28px | 700 |
| H2 | 24px | 22px | 700 |
| H3 | 20px | 18px | 600 |
| Body large | 18px | 17px | 400 |
| Body | 16px | 16px | 400 |
| Body small | 14px | 14px | 400 |
| Label | 13px | 13px | 600 |
| Caption | 12px | 12px | 500 |

### 6.3 Aturan Tipografi

- Gunakan sentence case, bukan seluruhnya uppercase.
- Uppercase hanya untuk label kecil tertentu.
- Hindari judul lebih dari dua baris.
- Gunakan tabular numbers untuk nominal dan angka operasional.
- Nominal penting menggunakan weight 600 atau 700.
- Helper text tidak boleh lebih kecil dari 12px.

---

## 7. Spacing dan Layout

Gunakan skala 4px.

```text
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80
```

### 7.1 Container

| Area | Max Width |
|---|---:|
| Landing page | 1200px |
| Dashboard | Full width dengan padding |
| Form utama | 720px |
| Detail pesanan | 960px |
| Tracking publik | 720px |

### 7.2 Page Padding

| Breakpoint | Padding |
|---|---:|
| Mobile | 16px |
| Tablet | 24px |
| Desktop | 32px |

### 7.3 Grid

- Dashboard desktop: 12 kolom.
- Tablet: 6 kolom.
- Mobile: 1 kolom.
- Kartu statistik: maksimal 4 kartu per baris.
- Form: 1 kolom pada mobile, 2 kolom jika field pendek pada desktop.

---

## 8. Border Radius dan Shadow

### 8.1 Radius

| Token | Nilai | Penggunaan |
|---|---:|---|
| `radius-sm` | 8px | Input kecil, badge |
| `radius-md` | 12px | Button, card |
| `radius-lg` | 16px | Panel utama |
| `radius-xl` | 24px | Hero atau card promosi |

### 8.2 Shadow

Gunakan shadow ringan.

```css
--shadow-card:
  0 1px 2px rgb(17 24 39 / 0.04),
  0 8px 24px rgb(17 24 39 / 0.06);

--shadow-overlay:
  0 20px 50px rgb(17 24 39 / 0.18);
```

Jangan menggunakan shadow gelap berlebihan.

---

## 9. Iconography

- Gunakan satu library ikon outline.
- Ukuran umum: 16px, 20px, 24px.
- Stroke konsisten.
- Gunakan ikon sebagai pendukung label, bukan pengganti label.
- Aksi penting harus tetap memiliki teks.
- Jangan menggunakan emoji sebagai ikon utama UI.

Contoh ikon:

- Pesanan: package.
- Customer: user.
- Cabang: building.
- Rute: route.
- Batch: truck.
- Tugas: clipboard-check.
- Pengeluaran: receipt.
- Komisi: wallet-cards atau badge-percent.
- Payroll: banknote.
- Tracking: map-pin atau scan-line.

---

## 10. App Shell

### 10.1 Desktop

Struktur:

```text
Sidebar tetap
+ Topbar
+ Main content
```

Sidebar:

- Lebar 256px.
- Logo di bagian atas.
- Navigasi dikelompokkan.
- Item aktif menggunakan background brand-50 dan teks brand-700.
- Hindari menu lebih dari dua tingkat.

Topbar:

- Judul halaman.
- Cabang aktif.
- Notifikasi penting.
- Profil pengguna.

### 10.2 Mobile

- Gunakan topbar sederhana.
- Sidebar berubah menjadi drawer.
- Aksi utama dapat menggunakan sticky action bar di bawah.
- Jangan menggunakan bottom navigation jika menu lebih dari lima.

### 10.3 Grup Navigasi

```text
Ringkasan
- Dashboard

Operasional
- Pesanan
- Tugas
- Batch
- Tracking

Data
- Customer
- Toko
- Cabang
- Rute

Keuangan
- Pembayaran
- Biaya Petugas
- Biaya Cabang
- Komisi
- Payroll
- Laporan

Organisasi
- Karyawan
- Akun & Role
- Pengaturan
```

Menu ditampilkan sesuai role.

---

## 11. Landing Page

### 11.1 Struktur Halaman

1. Navbar.
2. Hero.
3. Cara kerja.
4. Jenis layanan.
5. Rute aktif.
6. Tracking cepat.
7. Keunggulan.
8. Jadwal keberangkatan.
9. FAQ.
10. CTA WhatsApp.
11. Footer.

### 11.2 Hero

Konten utama:

```text
Belanja Jauh Jadi Lebih Dekat
Titip beli, titip ambil, dan titip kirim antar-kota dengan status barang yang dapat dipantau.
```

CTA utama:

- `Lacak Pesanan`

CTA sekunder:

- `Pesan lewat WhatsApp`

Visual hero tidak boleh menyerupai marketplace promo. Gunakan:

- Ilustrasi rute sederhana.
- Kartu status pesanan.
- Simulasi timeline.
- Foto operasional autentik jika tersedia.

### 11.3 Navbar

- Logo Yukatitip.
- Cara Kerja.
- Tarif.
- Jadwal.
- Tracking.
- Tombol WhatsApp.

### 11.4 Tracking Cepat

Form tracking harus terlihat jelas:

- Input nomor tracking.
- Input empat digit terakhir WhatsApp.
- Tombol `Lacak Pesanan`.
- Link bantuan jika tracking tidak ditemukan.

---

## 12. Halaman Tracking Publik

### 12.1 Struktur

```text
Logo
Nomor tracking
Asal → Tujuan
Status utama
Estimasi atau jadwal batch
Timeline
Titik pengambilan
Kontak admin
```

### 12.2 Status Hero

Gunakan card utama:

- Ikon status.
- Label status.
- Penjelasan singkat.
- Waktu pembaruan terakhir.

Contoh:

```text
Dalam perjalanan ke Pinrang
Barang telah berangkat dari Makassar.
Diperbarui 12 Juli 2026, 08.30 WITA
```

### 12.3 Timeline

- Urutan terbaru di atas pada desktop.
- Urutan kronologis yang mudah dibaca pada mobile.
- Status aktif menggunakan brand color.
- Status selesai menggunakan success color.
- Status bermasalah menggunakan danger color.
- Jangan tampilkan catatan internal.

---

## 13. Dashboard

### 13.1 Kartu Statistik

Kartu statistik berisi:

- Label.
- Angka.
- Perubahan atau konteks.
- Ikon ringan.

Contoh:

```text
Pesanan menunggu diproses
12
3 perlu tindakan hari ini
```

Jangan membuat kartu statistik dengan warna berbeda-beda tanpa arti.

### 13.2 Action Queue

Dashboard harus memiliki bagian “Perlu Tindakan”:

- Pembayaran belum diverifikasi.
- Biaya menunggu persetujuan.
- Batch siap berangkat.
- Barang tiba belum diterima.
- Uang muka belum diselesaikan.
- Pesanan bermasalah.

Bagian ini lebih penting daripada chart dekoratif.

### 13.3 Chart

Chart hanya digunakan jika membantu keputusan:

- Pendapatan jasa per bulan.
- Biaya operasional per bulan.
- Pesanan per rute.
- Perbandingan cabang.

Gunakan maksimal dua chart pada dashboard.

---

## 14. Tabel Data

### 14.1 Desktop

Tabel digunakan untuk:

- Pesanan.
- Customer.
- Karyawan.
- Biaya.
- Payroll.
- Batch.

Fitur:

- Header sticky jika data panjang.
- Search.
- Filter.
- Sort.
- Pagination.
- Column visibility jika diperlukan.
- Bulk action hanya jika benar-benar dibutuhkan.

### 14.2 Mobile

Jangan memaksa tabel desktop ke layar kecil.

Ubah menjadi card list dengan:

- Identitas utama.
- Status.
- Nominal utama.
- Metadata penting.
- Aksi cepat.

### 14.3 Kolom Pesanan

Urutan rekomendasi:

```text
Tracking
Customer
Rute
Layanan
Status
Pembayaran
Total jasa
Tanggal
Aksi
```

Jangan menampilkan semua kolom database.

---

## 15. Form

### 15.1 Input

- Tinggi minimum 44px.
- Label berada di atas input.
- Required marker jelas.
- Helper text singkat.
- Error muncul di bawah field.
- Jangan hanya mengandalkan placeholder.

### 15.2 Input Nominal

- Gunakan format rupiah saat blur.
- Simpan angka mentah pada state.
- Gunakan input mode numeric di mobile.
- Tampilkan pemisahan:
  - Harga barang.
  - Jasa.
  - Biaya tambahan.
  - Diskon.
  - Total.

### 15.3 Form Pesanan

Kelompokkan menjadi:

1. Customer.
2. Rute dan layanan.
3. Item barang.
4. Pembayaran.
5. Penerimaan.
6. Catatan.

Gunakan stepper hanya jika form benar-benar panjang.

### 15.4 Upload File

- Tampilkan tipe file.
- Tampilkan batas ukuran.
- Tampilkan progress.
- Tampilkan preview.
- Berikan opsi ganti atau hapus.
- Foto petugas harus dapat diambil langsung dari kamera HP.

---

## 16. Buttons

### 16.1 Hierarki

- Primary: brand-600.
- Secondary: putih dengan border.
- Tertiary: text button.
- Danger: merah.
- Success action khusus: hijau jika benar-benar berarti menyelesaikan.

### 16.2 Ukuran

| Ukuran | Tinggi |
|---|---:|
| Small | 36px |
| Medium | 44px |
| Large | 52px |

### 16.3 Aturan

- Satu primary button per area.
- Jangan menempatkan dua tombol primer berdampingan.
- Button harus memiliki state:
  - Default.
  - Hover.
  - Focus.
  - Loading.
  - Disabled.

---

## 17. Badge dan Status

Badge harus memiliki:

- Background lembut.
- Teks kontras.
- Tidak hanya mengandalkan warna.
- Label manusia, bukan enum teknis.

### 17.1 Order Status Mapping

| Status | Label UI | Warna |
|---|---|---|
| `recorded` | Pesanan dicatat | Neutral |
| `waiting_payment` | Menunggu pembayaran | Warning |
| `payment_received` | Pembayaran diterima | Info |
| `waiting_origin_process` | Menunggu diproses | Warning |
| `purchasing_or_collecting` | Sedang dibeli/diambil | Brand |
| `received_at_origin` | Diterima di titik asal | Info |
| `waiting_departure` | Menunggu keberangkatan | Warning |
| `in_transit` | Dalam perjalanan | Brand |
| `arrived_at_destination` | Tiba di kota tujuan | Info |
| `ready_for_handover` | Siap diserahkan | Success |
| `completed` | Selesai | Success |
| `problem` | Bermasalah | Danger |
| `cancelled` | Dibatalkan | Neutral |

### 17.2 Expense Status Mapping

| Status | Label UI | Warna |
|---|---|---|
| `draft` | Draft | Neutral |
| `submitted` | Diajukan | Info |
| `waiting_verification` | Menunggu verifikasi | Warning |
| `approved` | Disetujui | Success |
| `rejected` | Ditolak | Danger |
| `included_in_commission` | Masuk perhitungan komisi | Brand |

---

## 18. Halaman Detail Pesanan

Struktur desktop:

```text
Header
├── Tracking
├── Status
├── Customer
├── Rute
└── Aksi utama

Content
├── Ringkasan biaya
├── Item barang
├── Timeline
├── Pembayaran
├── Batch dan tugas
├── File
└── Catatan internal
```

Struktur mobile:

- Ringkasan utama.
- Sticky status action.
- Section accordion jika diperlukan.
- Item barang sebagai card.
- Timeline di bagian bawah.

---

## 19. Halaman Tugas Petugas

Halaman tugas harus menjadi halaman paling sederhana.

### 19.1 Header

- Nomor tugas.
- Area.
- Batch.
- Status.
- Uang muka.

### 19.2 Isi

- Daftar toko.
- Daftar barang.
- Detail harga.
- Catatan customer.
- Tombol peta.
- Upload foto.
- Upload nota.
- Input biaya.

### 19.3 Sticky Action Bar

Aksi utama pada mobile:

- `Mulai Tugas`.
- `Ajukan Konfirmasi`.
- `Selesaikan Tugas`.

Jangan tampilkan banyak aksi sekaligus.

---

## 20. Keuangan dan Komisi

### 20.1 Ringkasan Biaya

Gunakan card ringkas:

```text
Revenue jasa
Rp7.000.000

Biaya operasional disetujui
Rp2.000.000

Kontribusi bersih
Rp5.000.000

Komisi 20%
Rp1.000.000
```

### 20.2 Warna Keuangan

- Revenue: ink/brand.
- Biaya: warning atau danger ringan.
- Kontribusi positif: success.
- Nilai nol: neutral.
- Jangan menggunakan merah untuk semua pengeluaran kecil.

### 20.3 Tabel Payroll

Kolom:

```text
Karyawan
Gaji pokok
Tunjangan kendaraan
Tunjangan komunikasi
Komisi
Potongan
Total
Status
```

Gunakan tabular numbers.

---

## 21. Empty, Loading, Error, dan Success States

### 21.1 Empty State

Harus menjelaskan:

- Apa yang belum ada.
- Mengapa halaman kosong.
- Aksi berikutnya.

Contoh:

```text
Belum ada batch perjalanan
Buat batch untuk mengelompokkan pesanan dalam satu keberangkatan.
[Tambah Batch]
```

### 21.2 Loading

- Gunakan skeleton untuk list dan detail.
- Gunakan spinner di button saat submit.
- Jangan memblokir seluruh halaman untuk aksi kecil.

### 21.3 Error

Pesan harus spesifik.

Buruk:

```text
Terjadi kesalahan.
```

Baik:

```text
Pesanan tidak dapat dimasukkan ke batch karena arah rutenya berbeda.
```

### 21.4 Success

Gunakan toast singkat:

```text
Status pesanan berhasil diperbarui.
```

Untuk aksi besar, tampilkan hasil pada halaman.

---

## 22. Modal, Drawer, dan Popover

### Gunakan Modal untuk:

- Konfirmasi.
- Form sangat singkat.
- Preview file.
- Penolakan dengan alasan.

### Gunakan Drawer untuk:

- Filter mobile.
- Navigasi mobile.
- Detail ringkas tanpa meninggalkan halaman.

### Gunakan Halaman Penuh untuk:

- Form pesanan.
- Detail pesanan.
- Form karyawan.
- Form kontrak sewa.
- Payroll.
- Pengaturan kompleks.

---

## 23. Responsif

### Breakpoints

```text
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Aturan Mobile

- Tidak ada horizontal scroll untuk layout utama.
- Tabel berubah menjadi card.
- Tombol penting minimal 44px.
- Form satu kolom.
- Sticky action digunakan secara terbatas.
- Sidebar menjadi drawer.
- Informasi sekunder dapat diringkas.

---

## 24. Accessibility

Target minimum:

- Kontras WCAG AA.
- Semua input memiliki label.
- Semua tombol dapat digunakan dengan keyboard.
- Focus ring terlihat.
- Status tidak hanya dibedakan dengan warna.
- Icon-only button memiliki `aria-label`.
- Modal mengunci fokus.
- Toast penting dapat dibaca screen reader.
- Gunakan elemen semantic HTML.
- Jangan menonaktifkan zoom mobile.
- Target sentuh minimal 44×44px.

Focus style:

```css
outline: 3px solid rgb(99 102 241 / 0.35);
outline-offset: 2px;
```

---

## 25. Content Style

Gunakan Bahasa Indonesia yang sederhana.

### Pilihan Kata

Gunakan:

- Pesanan.
- Barang.
- Cabang.
- Rute.
- Batch perjalanan.
- Tugas petugas.
- Biaya operasional.
- Komisi.
- Pembayaran diterima.
- Siap diserahkan.

Hindari di UI:

- Fulfillment.
- Consignment.
- Dispatch.
- Settlement.
- Reconciliation.
- Revenue allocation.

Istilah teknis boleh digunakan dalam kode, bukan antarmuka.

### Tone

- Jelas.
- Ramah.
- Tidak terlalu formal.
- Tidak menggunakan slang berlebihan.
- Tidak menyalahkan pengguna.

---

## 26. Design Tokens untuk Tailwind

Contoh konsep mapping:

```ts
const colors = {
  brand: {
    50: "#EEF2FF",
    100: "#E0E7FF",
    500: "#6366F1",
    600: "#4F46E5",
    700: "#4338CA",
    900: "#312E81"
  },
  accent: {
    50: "#FFF4F1",
    100: "#FFE4DE",
    500: "#F26B4F",
    600: "#E95B3F"
  }
};
```

Jangan membuat warna baru langsung di setiap komponen.

Gunakan design token untuk:

- Warna.
- Radius.
- Shadow.
- Spacing.
- Typography.
- Z-index.
- Motion.

---

## 27. Motion

Gunakan animasi ringan:

- 120–200ms untuk hover dan focus.
- 180–240ms untuk drawer dan modal.
- Ease-out untuk masuk.
- Ease-in untuk keluar.

Jangan menggunakan:

- Animasi bouncing.
- Parallax.
- Scroll hijacking.
- Loading animation panjang.
- Animasi dekoratif pada dashboard.

Hormati `prefers-reduced-motion`.

---

## 28. Do dan Don't

### Do

- Fokus pada status dan aksi.
- Gunakan whitespace.
- Gunakan warna secara semantik.
- Buat UI petugas sangat sederhana.
- Tampilkan nominal dengan label jelas.
- Tampilkan audit atau riwayat pada data sensitif.
- Gunakan layout konsisten.
- Tampilkan cabang aktif.

### Don't

- Jangan membuat dashboard penuh chart.
- Jangan menggunakan gradient berlebihan.
- Jangan memakai warna hijau sebagai warna brand utama.
- Jangan menggunakan card untuk setiap elemen kecil.
- Jangan menyembunyikan aksi penting di menu tiga titik.
- Jangan membuat form panjang dalam modal.
- Jangan membuat halaman berbeda hanya karena role berbeda jika komponennya sama.
- Jangan menampilkan data internal pada tracking publik.
- Jangan menambahkan fitur atau menu di luar PRD.

---

## 29. Checklist Implementasi UI

Sebelum menyatakan halaman selesai, periksa:

- Apakah tujuan halaman jelas?
- Apakah aksi utama terlihat?
- Apakah role yang salah tidak melihat aksi?
- Apakah cabang aktif terlihat?
- Apakah status menggunakan label UI?
- Apakah loading state tersedia?
- Apakah empty state tersedia?
- Apakah error state spesifik?
- Apakah success feedback tersedia?
- Apakah mobile usable?
- Apakah nominal terpisah dengan jelas?
- Apakah focus state terlihat?
- Apakah data sensitif terlindungi?
- Apakah desain memakai token, bukan hard-code?

---

## 30. Referensi Halaman MVP

Halaman yang wajib memiliki desain konsisten:

### Publik

- Landing page.
- Cara kerja.
- Tarif.
- Jadwal.
- Form tracking.
- Detail tracking.

### Internal

- Login.
- Dashboard owner.
- Dashboard cabang.
- Dashboard petugas.
- Daftar dan detail customer.
- Daftar dan detail pesanan.
- Daftar dan detail tugas.
- Daftar dan detail batch.
- Handover.
- Pembayaran.
- Biaya petugas.
- Uang muka.
- Biaya cabang.
- Karyawan.
- Komisi.
- Payroll.
- Laporan.
- Pengaturan.

---

## 31. Keputusan Desain Final

Yukatitip menggunakan desain:

> **Modern, bersih, tepercaya, dan berorientasi operasional dengan warna indigo sebagai fondasi serta coral sebagai aksen hangat.**

Desain harus terasa profesional untuk owner dan admin, tetapi tetap sederhana untuk petugas lapangan serta mudah dipahami customer pada halaman tracking.

Fungsi selalu lebih penting daripada dekorasi.
