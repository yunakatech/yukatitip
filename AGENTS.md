## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: eslint, vitest, tailwindcss, sveltekit-adapter

---

# AGENTS.md — Yukatitip Project Instructions

Dokumen ini berisi instruksi permanen untuk Codex dan AI coding agent yang bekerja pada repository Yukatitip.

## 1. Sumber Kebenaran

- Baca `PRD_Yukatitip.md` sebelum merencanakan atau mengubah fitur.
- `PRD_Yukatitip.md` adalah sumber kebenaran kebutuhan bisnis dan ruang lingkup produk.
- File ini adalah sumber kebenaran konvensi teknis dan cara AI bekerja.
- Jangan mengubah `PRD_Yukatitip.md` atau `AGENTS.md` kecuali pengguna secara eksplisit meminta perubahan.
- Jika implementasi lama bertentangan dengan PRD, laporkan konflik dan ikuti PRD.
- Jangan mengarang kebutuhan, alur bisnis, role, status, formula, atau integrasi yang tidak tercantum di PRD.

## 2. Ruang Lingkup Produk

Yukatitip adalah:

- Web app internal untuk operasional jasa titip antar-kota.
- Landing page publik.
- Halaman tracking barang tanpa akun customer.
- Sistem multi-cabang, multi-rute, dan perjalanan dua arah.
- Sistem pencatatan customer, pesanan, barang, batch, handover, karyawan, biaya operasional, komisi, dan payroll sederhana.

Fokus awal:

- Cabang Makassar.
- Cabang Pinrang.
- Rute Makassar → Pinrang.
- Rute Pinrang → Makassar.

Sistem harus memungkinkan cabang dan rute baru ditambahkan melalui data atau konfigurasi, bukan melalui hard-code kota.

## 3. Tech Stack Resmi

Gunakan stack berikut:

### Frontend dan Full-stack Framework

- SvelteKit.
- TypeScript dengan mode strict.
- Tailwind CSS.
- SvelteKit form actions dan server routes.
- Progressive enhancement untuk form bila memungkinkan.
- Responsive web design; utamakan penggunaan melalui browser desktop dan HP.

### Hosting dan Backend Runtime

- Cloudflare Pages untuk hosting.
- Cloudflare Pages Functions atau Workers untuk:
  - API.
  - Business logic.
  - Validasi akses.
  - Nomor tracking.
  - Tracking publik.
  - Perhitungan tarif.
  - Perhitungan komisi.
  - Upload authorization.
  - Audit log.
  - Rate limiting.

### Database dan Authentication

- Supabase PostgreSQL sebagai database utama.
- Supabase Auth untuk login pengguna internal.
- Supabase Row Level Security untuk kontrol akses.
- Supabase Realtime hanya jika benar-benar diperlukan oleh fitur yang sedang dikerjakan.

### File Storage

- Cloudflare R2 untuk file.
- Bucket sensitif harus private.
- Database hanya menyimpan object key dan metadata file.
- Gunakan URL sementara atau endpoint terotorisasi untuk akses file private.

### Layanan Cloudflare Tambahan

- Cloudflare Turnstile untuk form dan endpoint publik yang membutuhkan perlindungan bot.
- Cloudflare KV hanya untuk cache atau konfigurasi non-transaksional seperti tarif publik, jadwal, FAQ, dan label status.
- Jangan gunakan KV sebagai sumber utama data pesanan, pembayaran, biaya, komisi, atau payroll.

### Package Manager

- Ikuti lockfile repository.
- Jika belum ada lockfile, gunakan `npm`.
- Jangan mengganti package manager tanpa permintaan eksplisit.

## 3A. Dokumentasi Resmi dan Internal

Gunakan dokumentasi resmi berikut sebagai referensi teknis. Jangan mengandalkan artikel pihak ketiga jika dokumentasi resmi tersedia.

### Dokumentasi Internal Repository

- Kebutuhan produk: `PRD_Yukatitip.md`
- Konvensi proyek dan aturan AI: `AGENTS.md`
- Referensi desain: `DESIGN_REFERENCE.md`
- Dokumentasi API internal: `API.md`
- Dokumentasi database: `schema.md`
- Schema PostgreSQL: `schema.sql`
- Data contoh: `sample-data.json`
- Template environment variables: `.env.example`

### SvelteKit

- Dokumentasi utama: https://svelte.dev/docs/kit
- Routing dan server endpoints: https://svelte.dev/docs/kit/routing
- Form actions: https://svelte.dev/docs/kit/form-actions
- Hooks: https://svelte.dev/docs/kit/hooks
- Private environment variables: https://svelte.dev/docs/kit/%24env-dynamic-private
- Public environment variables: https://svelte.dev/docs/kit/%24env-dynamic-public
- Server-only modules: https://svelte.dev/docs/kit/server-only-modules

### Cloudflare

- Pages: https://developers.cloudflare.com/pages/
- Pages Functions: https://developers.cloudflare.com/pages/functions/
- Pages Functions bindings: https://developers.cloudflare.com/pages/functions/bindings/
- R2: https://developers.cloudflare.com/r2/
- R2 presigned URLs: https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- Turnstile: https://developers.cloudflare.com/turnstile/
- Turnstile server-side validation: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- Workers KV: https://developers.cloudflare.com/kv/
- Environment variables Pages: https://developers.cloudflare.com/pages/functions/bindings/#environment-variables
- Environment variables Workers: https://developers.cloudflare.com/workers/configuration/environment-variables/
- Workers bindings: https://developers.cloudflare.com/workers/runtime-apis/bindings/

### Supabase

- SvelteKit tutorial: https://supabase.com/docs/guides/getting-started/tutorials/with-sveltekit
- Auth server-side rendering: https://supabase.com/docs/guides/auth/server-side
- SSR client setup: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Securing the Data API: https://supabase.com/docs/guides/api/securing-your-api

### Tailwind CSS

- Dokumentasi utama: https://tailwindcss.com/docs
- Instalasi dengan SvelteKit: https://tailwindcss.com/docs/guides/sveltekit

Aturan penggunaan dokumentasi:

- Periksa dokumentasi resmi sebelum menggunakan API platform yang belum dipakai di repository.
- Ikuti versi package yang benar-benar terpasang pada `package.json` dan lockfile.
- Jangan menyalin contoh resmi tanpa menyesuaikan keamanan, tipe data, error handling, serta pola repository.
- Jika perilaku implementasi berbeda dari dokumentasi internal, laporkan konflik dan jangan mengubah contract secara diam-diam.

## 3B. Environment Variables dan Cloudflare Bindings

`.env.example` adalah contract nama konfigurasi yang digunakan proyek.

Aturan wajib:

- Salin `.env.example` menjadi `.env` hanya untuk development lokal.
- `.env.example` hanya berisi placeholder dan boleh di-commit.
- `.env`, `.env.local`, `.dev.vars`, dan file credential asli tidak boleh di-commit.
- Jangan mengganti nama variabel tanpa memperbarui `.env.example`, `API.md`, type binding, dan kode pemakai.
- Jangan menambahkan nilai rahasia ke source code, test snapshot, log, dokumentasi, atau sample data.
- Jangan menyediakan fallback produksi untuk secret yang hilang.
- Aplikasi harus gagal dengan pesan konfigurasi yang jelas jika secret wajib tidak tersedia.
- Pisahkan konfigurasi Preview dan Production pada Cloudflare.
- Jangan menggunakan credential production pada local development atau Preview.

### Variabel Public

Variabel dengan prefix `PUBLIC_` dapat masuk ke bundle browser.

Variabel public yang diizinkan:

```text
PUBLIC_APP_NAME
PUBLIC_APP_URL
PUBLIC_API_BASE_URL
PUBLIC_SUPABASE_URL
PUBLIC_SUPABASE_PUBLISHABLE_KEY
PUBLIC_TURNSTILE_SITE_KEY
PUBLIC_ASSET_BASE_URL
```

Aturan:

- Jangan menaruh secret pada variabel `PUBLIC_`.
- Import variabel public hanya melalui mekanisme environment SvelteKit yang sesuai.
- Publishable key Supabase tetap harus dilindungi grants dan RLS.

### Variabel Private Server

Variabel berikut hanya boleh dibaca dari modul server:

```text
SUPABASE_SERVICE_ROLE_KEY
TURNSTILE_SECRET_KEY
CSRF_SECRET
IDEMPOTENCY_SECRET
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
CLOUDFLARE_ACCOUNT_ID
```

Aturan:

- Modul yang membaca private environment harus berada di `src/lib/server`, `hooks.server.ts`, `+page.server.ts`, atau `+server.ts`.
- Jangan mengimpor private environment dari `.svelte`, `+page.ts`, atau modul yang dapat masuk ke browser.
- Service-role/secret Supabase melewati RLS dan hanya boleh dipakai untuk operasi server yang sudah melalui authorization.
- Jangan membuat satu Supabase service-role client global yang dapat tercampur dengan session user.

### Cloudflare Resource Bindings

Pada deployment Cloudflare, akses resource menggunakan binding yang dikonfigurasi di Wrangler atau dashboard:

```text
YUKATITIP_PRIVATE_BUCKET
YUKATITIP_PUBLIC_BUCKET
YUKATITIP_CONFIG_KV
LOGIN_RATE_LIMITER
```

Nama pada `.env.example`:

```text
R2_PRIVATE_BUCKET_BINDING
R2_PUBLIC_BUCKET_BINDING
KV_CONFIG_BINDING
```

adalah dokumentasi contract nama binding, bukan credential resource.

Aturan:

- Di production, utamakan native R2/KV bindings daripada memanggil REST API Cloudflare.
- Login rate limiting production harus memakai binding `LOGIN_RATE_LIMITER`; Map in-memory hanya untuk local development dan test.
- Credential S3-compatible R2 hanya digunakan untuk local development atau tooling yang memang membutuhkannya.
- Jangan mengirim object binding Cloudflare ke browser.
- Type environment/bindings harus dideklarasikan dan divalidasi.

### Validasi Environment

Buat satu modul server terpusat, misalnya:

```text
src/lib/server/config/env.ts
```

Modul harus:

- Membaca dan memvalidasi nilai.
- Mengubah string angka menjadi number secara aman.
- Memvalidasi URL dan enum environment.
- Menolak placeholder seperti `<...>` pada runtime selain test yang disengaja.
- Mengekspos object config typed, bukan `process.env` mentah ke seluruh aplikasi.
- Tidak menulis nilai secret ke log.

Variabel opsional development harus default aman:

```text
ENABLE_DEV_SEED=false
ENABLE_DEBUG_ROUTES=false
DISABLE_TURNSTILE_IN_LOCAL=false
MOCK_R2_UPLOADS=false
```

Flag development tidak boleh aktif di production.

## 4. Teknologi yang Tidak Digunakan

Jangan menambahkan teknologi berikut tanpa persetujuan eksplisit:

- Laravel.
- Inertia.js.
- PHP backend.
- Cloudflare D1 sebagai database transaksi.
- Supabase Storage.
- Supabase Edge Functions.
- Durable Objects.
- Cloudflare Workflows.
- Firebase.
- Database kedua untuk data operasional yang sama.
- ORM baru tanpa kebutuhan yang jelas.
- State management library global jika state lokal atau Svelte stores sudah cukup.

Jangan menambahkan dependency produksi hanya untuk menghemat beberapa baris kode. Gunakan API bawaan platform atau dependency yang sudah tersedia terlebih dahulu.

## 5. Fitur yang Tidak Boleh Dibuat Tanpa Permintaan Eksplisit

Jangan membuat, menyiapkan placeholder, tabel, route, service, atau abstraksi prematur untuk:

- Aplikasi native Android atau iOS.
- Pelacakan GPS kendaraan.
- Dompet digital atau saldo customer.
- Marketplace multi-penjual.
- Optimasi rute otomatis.
- Payment gateway otomatis.
- WhatsApp Business API penuh.
- Sistem agen, waralaba, atau komisi jaringan.
- Customer login.
- Transfer gaji otomatis.
- Payroll pajak otomatis.
- Absensi biometrik.
- Rekrutmen online.
- Multi-hop atau transit otomatis antar-tiga kota.
- Sistem logistik umum di luar proses Yukatitip.

Kerjakan hanya fitur yang diminta dan tercantum dalam PRD atau task aktif.

## 6. Prinsip Arsitektur

- Gunakan satu repository SvelteKit.
- Pisahkan UI, domain logic, database access, validation, dan integrasi eksternal.
- Business logic penting harus berada di server, bukan hanya di browser.
- Browser tidak boleh menerima service role key, secret R2, atau secret API.
- Jangan mengakses tabel sensitif secara anonymous langsung dari browser.
- Gunakan server route atau form action untuk operasi publik seperti tracking.
- Hindari hard-code kota, cabang, rute, role, tarif, dan persentase komisi.
- Nilai yang dapat berubah harus berasal dari database atau konfigurasi.
- Hindari over-engineering, generic repository yang tidak perlu, dan abstraksi sebelum ada penggunaan nyata.
- Satu fungsi harus memiliki satu tanggung jawab yang jelas.
- Gunakan transaksi database untuk operasi yang mengubah beberapa data yang harus konsisten.
- Semua perubahan keuangan dan status penting harus dapat diaudit.

## 7. Struktur Folder

Gunakan struktur berikut sebagai arah utama. Sesuaikan hanya bila repository yang ada sudah memiliki struktur konsisten.

```text
src/
├── lib/
│   ├── components/
│   │   ├── ui/
│   │   ├── forms/
│   │   ├── tables/
│   │   └── domain/
│   ├── server/
│   │   ├── auth/
│   │   ├── database/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── policies/
│   │   ├── storage/
│   │   ├── tracking/
│   │   ├── finance/
│   │   └── audit/
│   ├── schemas/
│   ├── types/
│   ├── constants/
│   ├── utils/
│   └── config/
├── routes/
│   ├── (public)/
│   │   ├── +page.svelte
│   │   ├── cara-kerja/
│   │   ├── tarif/
│   │   ├── jadwal/
│   │   └── track/
│   ├── (auth)/
│   │   └── login/
│   ├── (app)/
│   │   └── app/
│   │       ├── dashboard/
│   │       ├── customers/
│   │       ├── orders/
│   │       ├── tasks/
│   │       ├── trips/
│   │       ├── branches/
│   │       ├── routes/
│   │       ├── employees/
│   │       ├── expenses/
│   │       ├── commissions/
│   │       ├── payroll/
│   │       ├── reports/
│   │       └── settings/
│   └── api/
│       ├── tracking/
│       ├── uploads/
│       └── webhooks/
├── hooks.server.ts
└── app.html

supabase/
├── migrations/
├── seed.sql
└── tests/

static/
tests/
docs/
```

Ketentuan:

- Komponen yang hanya digunakan satu route boleh berada dekat route tersebut.
- Komponen reusable lintas domain berada di `src/lib/components`.
- Semua akses secret, service role, dan R2 berada di `src/lib/server`.
- Jangan mengimpor file dari `src/lib/server` ke komponen browser.
- Migrasi database harus versioned dan tidak diedit ulang setelah digunakan di environment bersama.

## 8. Konvensi Penamaan

### File dan Folder

- Folder route: `kebab-case`.
- File utility dan service: `kebab-case.ts`.
- Svelte component: `PascalCase.svelte`.
- Test mengikuti nama file: `order-service.test.ts`.
- Migration menggunakan timestamp dan deskripsi jelas.

### TypeScript

- Variable dan function: `camelCase`.
- Type, interface, class, component: `PascalCase`.
- Constant global: `UPPER_SNAKE_CASE`.
- Boolean diawali `is`, `has`, `can`, atau `should`.
- Function async yang mengambil data menggunakan nama jelas seperti `getOrderById`, bukan `fetchData`.
- Hindari nama umum seperti `data`, `item`, `result`, atau `handler` bila konteksnya tidak jelas.

### Database

- Tabel dan kolom: `snake_case`.
- Primary key: `id`.
- Foreign key: `<entity>_id`.
- Timestamp: `created_at`, `updated_at`, `deleted_at` bila soft delete diperlukan.
- Status database: lowercase `snake_case`.
- Gunakan UUID untuk primary key kecuali ada alasan kuat lain.
- Nomor bisnis seperti tracking dan batch disimpan terpisah dari primary key.

### Nomor Bisnis

- Tracking: `YKT-YYMM-SEQUENCE`, contoh `YKT-2607-00125`.
- Batch: `BTH-YYMM-SEQUENCE`.
- Tugas: `TSK-YYMM-SEQUENCE`.
- Nomor harus dibuat di server dan unik di database.

## 9. Bahasa dan UI

- Bahasa utama antarmuka: Bahasa Indonesia.
- Gunakan istilah yang mudah dipahami operator lapangan.
- Jangan menampilkan nama enum teknis kepada pengguna.
- Gunakan label manusia seperti “Dalam perjalanan”, bukan `in_transit`.
- Pesan error harus menjelaskan masalah dan tindakan berikutnya.
- Dashboard harus berorientasi tindakan, bukan dekorasi.
- Hindari chart jika angka ringkas dan tabel sudah cukup.
- Semua halaman internal wajib responsif.
- Form lapangan harus nyaman digunakan dengan satu tangan di HP.
- Aksi berbahaya harus memiliki konfirmasi.
- Tampilkan loading, success, dan error state yang jelas.
- Jangan menggunakan modal untuk form panjang jika halaman tersendiri lebih baik.

## 10. Validasi dan Error Handling

- Validasi input di server.
- Validasi client hanya untuk pengalaman pengguna, bukan keamanan.
- Gunakan schema validation yang konsisten; gunakan Zod jika sudah tersedia.
- Jangan percaya nilai harga, role, cabang, komisi, atau status dari client.
- Error internal tidak boleh membocorkan secret, SQL, stack trace, atau konfigurasi.
- Log error dengan konteks yang cukup tanpa menyimpan data sensitif berlebihan.
- Gunakan error domain yang terstruktur untuk kasus bisnis.

## 11. Authentication dan Authorization

- Login internal menggunakan Supabase Auth.
- Authorization tidak cukup hanya dengan menyembunyikan menu.
- Periksa role, cabang, dan kepemilikan data di server dan RLS.
- Owner dapat melihat seluruh cabang.
- Kepala cabang hanya mengelola cabangnya.
- Admin cabang hanya mengelola data sesuai akses.
- Petugas hanya melihat tugas yang diberikan dan data yang diperlukan.
- Kepala cabang tidak boleh menyetujui klaim, bonus, atau kompensasinya sendiri.
- Petugas tidak boleh menyetujui pengeluarannya sendiri.
- Akun nonaktif harus kehilangan akses tanpa menghapus histori.
- Jangan menyimpan role hanya pada metadata client yang dapat dimanipulasi.

## 12. Keamanan Data dan File

- Jangan commit `.env`, secret, token, key, atau credential.
- Gunakan environment variables Cloudflare untuk secret.
- `SUPABASE_SERVICE_ROLE_KEY` hanya di server.
- R2 private untuk:
  - Bukti pembayaran.
  - Nota.
  - Bukti pengeluaran.
  - Foto serah terima.
  - Dokumen karyawan.
  - Kontrak sewa.
- Validasi MIME type dan ukuran file di server.
- Gunakan nama object acak; jangan memakai nama file asli sebagai object key utama.
- Simpan nama asli hanya sebagai metadata.
- Tracking publik harus mengembalikan data yang sudah disanitasi.
- Jangan tampilkan nomor telepon lengkap, alamat lengkap, catatan internal, bukti transaksi, harga modal, komisi, atau payroll di tracking publik.
- Terapkan Turnstile dan rate limiting pada tracking publik.
- Semua aksi sensitif wajib masuk `audit_logs`.

## 13. Aturan Bisnis Pesanan

- Satu pesanan memiliki satu cabang asal dan satu cabang tujuan.
- Satu pesanan memiliki satu rute langsung.
- Satu pesanan hanya masuk ke batch yang rutenya sesuai.
- Customer tidak perlu akun pada MVP.
- Nomor WhatsApp menjadi identifier utama untuk mencegah duplikasi customer.
- Pesanan dapat memiliki beberapa item barang.
- Setiap perubahan status membuat tracking event.
- Pisahkan `public_description` dan `internal_description`.
- Jangan mengubah status secara lompat tanpa alasan yang tercatat.
- Handover keberangkatan dan kedatangan harus mencatat petugas, jumlah paket, dan waktu.

## 14. Status Canonical

Gunakan nilai status konsisten. Jangan membuat variasi baru tanpa memperbarui domain type, validasi, database constraint, label UI, dan PRD.

### Order Status

```text
recorded
waiting_payment
payment_received
waiting_origin_process
purchasing_or_collecting
received_at_origin
waiting_departure
in_transit
arrived_at_destination
ready_for_handover
completed
problem
cancelled
```

### Trip Status

```text
draft
preparing
ready_to_depart
in_transit
arrived
completed
cancelled
```

### Task Status

```text
draft
assigned
started
in_progress
waiting_confirmation
completed
problem
cancelled
```

### Expense Approval Status

```text
draft
submitted
waiting_verification
approved
rejected
included_in_commission
```

### Payroll Status

```text
draft
calculated
waiting_approval
approved
paid
locked
```

## 15. Aturan Keuangan

### Pemisahan Dana

Harga barang customer bukan revenue Yukatitip.

```text
total_customer_payment
= goods_amount
+ service_revenue
+ additional_service_fees
```

Hanya komponen jasa yang dihitung sebagai pendapatan usaha.

### Revenue Petugas

Revenue petugas hanya berasal dari tugas selesai, memenuhi aturan, dan pembayaran customer telah dikonfirmasi.

Revenue dapat mencakup:

- Jasa titip beli.
- Jasa titip ambil.
- Jasa titip kirim.
- Jasa pengantaran.
- Jasa penanganan.
- Pendapatan jasa lain yang sah.

### Biaya Operasional Harian Petugas

Kategori:

- BBM.
- Uang makan.
- Parkir.
- Tol.
- Transportasi tambahan.
- Angkut.
- Pengemasan.
- Biaya masuk lokasi.
- Biaya lain yang disetujui.

Biaya harus memiliki:

- Petugas.
- Cabang.
- Tanggal.
- Tugas atau batch.
- Nominal.
- Status persetujuan.
- Bukti bila tersedia.

Hanya biaya berstatus `approved` yang mengurangi dasar komisi.

### Kontribusi dan Komisi

```text
net_contribution
= total_staff_service_revenue
- total_approved_operational_expenses
```

```text
commission_amount
= max(0, net_contribution)
× effective_commission_rate
```

- Kontribusi negatif tidak mengurangi gaji pokok secara otomatis.
- Komisi rate harus memiliki periode efektif.
- Data periode komisi yang sudah dikunci tidak boleh dihitung ulang diam-diam.

### Kompensasi Petugas

```text
gross_pay
= base_salary
+ vehicle_allowance
+ communication_allowance
+ commission
- lawful_deductions
```

Petugas hanya memiliki:

- Gaji pokok.
- Tunjangan kendaraan.
- Tunjangan pulsa/internet.
- Komisi.

BBM, makan, parkir, dan tol adalah biaya operasional, bukan tunjangan payroll.

### Biaya Cabang

Pisahkan biaya tetap cabang dari biaya langsung petugas.

Biaya cabang mencakup:

- Sewa.
- Listrik.
- Air.
- Internet.
- Kebersihan.
- Keamanan.
- ATK.
- Perawatan.
- Biaya kantor.

Sewa tahunan harus menyimpan nilai pembayaran aktual dan alokasi bulanan.

## 16. Database dan Migration

- Semua perubahan schema dibuat melalui migration.
- Tambahkan foreign key, unique constraint, check constraint, dan index yang relevan.
- Index kolom yang sering digunakan untuk filter, join, RLS, dan tracking.
- Gunakan numeric/decimal untuk uang; jangan gunakan floating point.
- Simpan nominal uang dalam satuan rupiah sebagai integer bila tidak membutuhkan pecahan.
- Timestamp disimpan dalam UTC; konversi ke WITA di UI.
- Jangan menyimpan data turunan yang mudah dihitung kecuali ada alasan performa dan mekanisme konsistensi.
- Jika menyimpan snapshot keuangan, beri periode dan lock yang jelas.
- Seed hanya untuk data referensi dan development; jangan memasukkan data pribadi nyata.
- RLS policy wajib diuji.

## 17. Testing

Setiap perubahan harus diuji sesuai risikonya.

Minimal:

- Jalankan type check.
- Jalankan lint.
- Jalankan test terkait.
- Jalankan build production sebelum menyatakan selesai.

Gunakan command yang tersedia pada `package.json`. Default yang diharapkan:

```bash
npm run check
npm run lint
npm run test
npm run build
```

Tambahkan test untuk:

- Formula revenue, biaya, kontribusi, dan komisi.
- Authorization role dan cabang.
- Nomor tracking unik.
- Validasi batch dan rute.
- Tracking publik tidak membocorkan data internal.
- Penyelesaian uang muka.
- Periode komisi dan payroll lock.
- RLS untuk tabel sensitif.

Jangan menghapus atau melemahkan test hanya agar build lolos.

## 18. Workflow AI Saat Mengerjakan Task

Sebelum coding:

1. Baca `AGENTS.md`.
2. Baca bagian relevan dari `PRD_Yukatitip.md`.
3. Periksa struktur dan pola kode yang sudah ada.
4. Identifikasi tabel, route, role, dan aturan bisnis yang terdampak.
5. Buat perubahan terkecil yang memenuhi kebutuhan.

Saat coding:

- Ikuti pola repository yang sudah mapan.
- Jangan refactor area tidak terkait.
- Jangan mengganti library atau arsitektur tanpa kebutuhan.
- Jangan mengubah contract API secara diam-diam.
- Jangan membuat data dummy production.
- Jangan memasukkan secret.
- Jangan menonaktifkan security untuk mempercepat development.
- Jangan menggunakan `any` kecuali benar-benar tidak dapat dihindari dan diberi alasan.
- Jangan menelan error dengan blok `catch` kosong.
- Jangan memakai `@ts-ignore` tanpa alasan tertulis.
- Jangan membuat TODO yang menggantikan implementasi inti.
- Jangan menghapus audit trail.

Setelah coding:

1. Jalankan check, lint, test, dan build yang relevan.
2. Periksa migration dan RLS.
3. Periksa tidak ada secret atau file sensitif.
4. Periksa variabel baru sudah ditambahkan ke `.env.example` dan divalidasi.
5. Ringkas file yang diubah.
6. Jelaskan keputusan penting.
7. Laporkan test yang dijalankan dan hasilnya.
8. Jelaskan risiko atau pekerjaan tersisa secara jujur.

## 19. Perubahan yang Membutuhkan Persetujuan Pengguna

Minta persetujuan eksplisit sebelum:

- Menambah dependency produksi.
- Mengganti framework, database, auth, storage, atau hosting.
- Mengubah formula keuangan.
- Mengubah struktur role dan hak akses.
- Menghapus data atau migration.
- Mengubah status canonical.
- Mengubah format nomor tracking.
- Menambahkan fitur di luar PRD.
- Membuat integrasi eksternal berbayar.
- Mengubah kebijakan keamanan.
- Mengubah alur payroll atau komisi.
- Membuat breaking change pada API atau database.

## 20. Definition of Done

Task dianggap selesai hanya jika:

- Sesuai PRD dan scope task.
- Tidak menambah fitur spekulatif.
- Type-safe.
- Validasi server tersedia.
- Authorization diperiksa.
- UI memiliki loading, empty, success, dan error state yang relevan.
- Migration dan RLS tersedia bila schema berubah.
- Audit log tersedia untuk aksi sensitif.
- Test terkait tersedia atau diperbarui.
- Check, lint, test, dan build yang relevan berhasil.
- Dokumentasi diperbarui jika contract atau perilaku berubah.
- Tidak ada secret atau data pribadi dalam commit.
- `.env.example` sesuai dengan variabel dan binding yang benar-benar digunakan.
- Environment wajib divalidasi dan flag development tidak aktif di production.
