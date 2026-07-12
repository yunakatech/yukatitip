# Database Schema — Yukatitip

Dokumen ini menjelaskan struktur database pada `schema.sql`.

## 1. Prinsip Utama

- Database utama: **Supabase PostgreSQL**.
- Login internal: **Supabase Auth**.
- File fisik: **Cloudflare R2**.
- Database hanya menyimpan `object_key` dan metadata file.
- Tabel transaksi sensitif menggunakan **RLS deny-by-default**.
- Cloudflare Pages Functions/Workers melakukan validasi role dan cabang lalu mengakses Supabase dengan service-role key.
- Harga barang customer dipisahkan dari pendapatan jasa Yukatitip.
- Semua nilai uang disimpan sebagai `bigint` dalam satuan rupiah.

## 2. Kelompok Tabel

### Organisasi dan Akses

| Tabel | Fungsi |
|---|---|
| `roles` | Role akun internal |
| `permissions` | Daftar permission |
| `role_permissions` | Relasi role dan permission |
| `branches` | Cabang atau titik layanan |
| `profiles` | Profil akun yang terhubung ke `auth.users` |
| `routes` | Arah perjalanan antar-cabang |
| `route_schedules` | Jadwal keberangkatan |
| `route_tariffs` | Tarif berdasarkan rute dan jenis layanan |
| `system_settings` | Konfigurasi global atau per cabang |

### Karyawan

| Tabel | Fungsi |
|---|---|
| `positions` | Jabatan kerja dan status aktif |
| `employees` | Data karyawan |
| `employee_assignments` | Riwayat cabang, jabatan, supervisor, dan alasan penempatan |
| `employee_compensations` | Gaji, tunjangan kendaraan, pulsa/internet, dan rate komisi |

### Customer dan Pesanan

| Tabel | Fungsi |
|---|---|
| `customers` | Data customer tanpa akun |
| `stores` | Toko atau lokasi pengambilan |
| `orders` | Header pesanan |
| `order_items` | Barang dalam pesanan |
| `tracking_events` | Timeline status publik dan internal |
| `payments` | Pembayaran manual customer |

### Perjalanan dan Tugas

| Tabel | Fungsi |
|---|---|
| `trips` | Batch perjalanan |
| `trip_orders` | Pesanan yang masuk ke batch |
| `trip_handovers` | Checklist keberangkatan dan kedatangan |
| `staff_tasks` | Tugas petugas |
| `task_items` | Item barang dalam tugas |

### Biaya Petugas dan Komisi

| Tabel | Fungsi |
|---|---|
| `expense_categories` | Kategori biaya |
| `daily_operational_advances` | Uang muka operasional harian |
| `daily_operational_expenses` | BBM, makan, parkir, tol, dan biaya tugas |
| `staff_task_revenues` | Revenue jasa yang dialokasikan ke petugas. `revenue_type` memakai kode canonical `purchase_service`, `pickup_service`, `delivery_service`, `local_delivery_service`, `handling_service`, atau `other_service`. |
| `commission_periods` | Periode komisi |
| `employee_commissions` | Hasil perhitungan komisi petugas |

### Payroll dan Biaya Cabang

| Tabel | Fungsi |
|---|---|
| `payroll_periods` | Periode payroll |
| `payroll_items` | Komponen gaji, tunjangan, komisi, potongan |
| `branch_expenses` | Listrik, air, internet, dan biaya cabang |
| `branch_budgets` | Anggaran bulanan |
| `branch_rent_contracts` | Kontrak sewa dan alokasi bulanan |
| `petty_cash_transactions` | Kas kecil cabang |

### File dan Audit

| Tabel | Fungsi |
|---|---|
| `attachments` | Metadata file yang disimpan di R2 |
| `audit_logs` | Riwayat aksi sensitif, termasuk `request_id` |

## 3. Relasi Utama

```text
branches
├── routes
├── employees
├── profiles
├── customers
├── trips
├── staff_tasks
├── operational advances/expenses
└── branch expenses/budgets/rent/petty cash

orders
├── order_items
├── tracking_events
├── payments
├── trip_orders → trips
└── staff_task_revenues

employees
├── employee_assignments
├── employee_compensations
├── staff_tasks
├── operational advances/expenses
├── employee_commissions
└── payroll_items
```

## 4. Formula Keuangan

### Total pembayaran customer

```text
total_customer_payment
= goods_amount
+ service_revenue
+ additional_service_fees
- discount_amount
```

`goods_amount` bukan pendapatan Yukatitip.

### Kontribusi petugas

```text
net_contribution
= max(0, total_revenue - total_operational_expense)
```

### Komisi petugas

```text
commission_amount
= round(net_contribution × commission_rate / 100)
```

### Payroll petugas

```text
base_salary
+ vehicle_allowance
+ communication_allowance
+ commission
- deduction
```

BBM, uang makan, parkir, dan tol tidak masuk sebagai tunjangan payroll.

## 5. Aturan Penting yang Dijaga Database

- Cabang asal dan tujuan harus berbeda.
- Arah pesanan harus sama dengan arah route.
- Arah batch harus sama dengan arah route.
- Pesanan hanya dapat masuk ke batch dengan route yang sama.
- Satu pesanan hanya dapat berada pada satu batch aktif melalui `trip_orders`.
- Tracking number, trip number, task number, employee number, dan nomor WhatsApp customer harus unik.
- Nilai uang tidak boleh negatif, kecuali `payroll_items.amount` yang dapat digunakan untuk potongan.
- Periode efektif dan kontrak tidak boleh berakhir sebelum tanggal mulai.
- Komisi negatif otomatis menjadi nol, lalu komisi dibulatkan matematis ke rupiah terdekat oleh database.

## 6. RLS dan Akses Aplikasi

Schema menggunakan model:

```text
Browser
  ↓
Cloudflare Pages Functions / Workers
  ↓ validasi session, role, cabang, dan kepemilikan
Supabase service-role
  ↓
PostgreSQL
```

Akses browser langsung hanya dibuka untuk data referensi tertentu:

- Profil sendiri.
- Role dan permission.
- Cabang.
- Rute.
- Jadwal.
- Tarif.
- Jabatan.
- Kategori biaya.

Tabel pesanan, pembayaran, biaya, komisi, payroll, dan audit tidak memiliki policy browser yang luas. Service-role tetap harus disimpan hanya sebagai secret Cloudflare.

## 7. Penyimpanan File

File disimpan di bucket private Cloudflare R2.

Contoh `object_key`:

```text
orders/2026/07/YKT-2607-00125/payment/<uuid>.jpg
orders/2026/07/YKT-2607-00125/receipt/<uuid>.jpg
expenses/2026/07/<employee-id>/<uuid>.jpg
branches/<branch-id>/rent-contracts/<uuid>.pdf
```

Tabel `attachments` menyimpan:

- Entity.
- Entity ID.
- Object key.
- Nama asli.
- MIME type.
- Ukuran.
- Pengunggah.
- Status private.

## 8. Urutan Instalasi

Jalankan melalui Supabase SQL Editor atau migration:

```bash
supabase migration new initial_yukatitip_schema
```

Salin isi `schema.sql` ke migration tersebut, lalu:

```bash
supabase db reset
```

Untuk project remote:

```bash
supabase db push
```

Sesudah schema diterapkan:

1. Buat user pertama melalui Supabase Auth.
2. Ambil UUID dari `auth.users`.
3. Buat branch awal.
4. Buat profile owner yang menunjuk ke role `owner`.
5. Buat cabang Makassar dan Pinrang.
6. Buat dua route:
   - Makassar → Pinrang.
   - Pinrang → Makassar.
7. Tambahkan tarif dan jadwal.

## 9. Contoh Bootstrap Owner

Ganti UUID sesuai data sebenarnya.

```sql
insert into public.branches (code, name, city)
values ('MKS', 'Yukatitip Makassar', 'Makassar')
returning id;

insert into public.profiles (
  id,
  full_name,
  role_id,
  branch_id,
  status
)
select
  '<AUTH_USER_UUID>'::uuid,
  'Owner Yukatitip',
  r.id,
  null,
  'active'
from public.roles r
where r.code = 'owner';
```

## 10. Catatan Implementasi Codex

- Jangan mengubah enum canonical tanpa memperbarui PRD dan AGENTS.md.
- Semua perubahan schema harus melalui migration baru.
- Jangan mengedit migration yang sudah dipakai environment bersama.
- Tambahkan index untuk query dan policy baru.
- Uji trigger route dan batch.
- Uji formula komisi dengan nilai nol, positif, dan biaya lebih besar dari revenue.
- Jangan memindahkan file binary ke Supabase Storage.
