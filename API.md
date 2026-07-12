# API.md — Yukatitip Internal API

Dokumen ini mendefinisikan contract API internal Yukatitip.

Baca bersama:

- `PRD_Yukatitip.md`
- `AGENTS.md`
- `schema.md`
- `schema.sql`
- `sample-data.json`
- `.env.example`

## 1. Prinsip API

- Base path: `/api/v1`
- Format request dan response: `application/json`
- Semua timestamp menggunakan ISO-8601.
- Database menyimpan timestamp dalam UTC.
- UI menampilkan waktu dalam WITA.
- Semua nominal uang berupa integer rupiah.
- Endpoint mutasi wajib divalidasi di server.
- Endpoint internal wajib memeriksa session, role, cabang, dan permission.
- Endpoint publik wajib dibatasi datanya dan dilindungi Turnstile serta rate limiting.
- Supabase service-role key hanya digunakan di server.
- File private berada di Cloudflare R2.
- Login dan logout utama menggunakan SvelteKit form actions, bukan REST API.
- Endpoint di bawah dapat diimplementasikan sebagai SvelteKit `+server.ts` atau handler Worker yang mengikuti contract yang sama.

## 1A. Environment Contract

Nama variabel dan binding mengikuti `.env.example`.

### Public browser configuration

| Variable | Fungsi |
|---|---|
| `PUBLIC_APP_NAME` | Nama aplikasi yang ditampilkan |
| `PUBLIC_APP_URL` | Canonical URL aplikasi |
| `PUBLIC_API_BASE_URL` | Prefix API, default contract `/api/v1` |
| `PUBLIC_SUPABASE_URL` | URL project Supabase |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key untuk client yang dilindungi RLS |
| `PUBLIC_TURNSTILE_SITE_KEY` | Site key widget Turnstile |
| `PUBLIC_ASSET_BASE_URL` | Domain aset publik jika digunakan |

Nilai public tidak boleh dianggap rahasia.

### Private server configuration

| Variable | Fungsi |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Operasi administratif server setelah authorization |
| `TURNSTILE_SECRET_KEY` | Validasi token Turnstile |
| `CSRF_SECRET` | Penandatanganan atau validasi token CSRF |
| `IDEMPOTENCY_SECRET` | Penandatanganan key/idempotency record |
| `TRUSTED_ORIGINS` | Origin yang diizinkan untuk request cookie-based |
| `COOKIE_DOMAIN` | Domain cookie |
| `COOKIE_SECURE` | Secure flag cookie |
| `COOKIE_SAME_SITE` | SameSite cookie |
| `MAX_UPLOAD_SIZE_BYTES` | Batas upload server |
| `ALLOWED_IMAGE_MIME_TYPES` | MIME gambar yang diterima |
| `ALLOWED_DOCUMENT_MIME_TYPES` | MIME dokumen yang diterima |
| `R2_UPLOAD_URL_TTL_SECONDS` | Masa berlaku URL upload |
| `R2_DOWNLOAD_URL_TTL_SECONDS` | Masa berlaku URL download |
| `TRACKING_RATE_LIMIT_REQUESTS` | Batas request tracking |
| `TRACKING_RATE_LIMIT_WINDOW_SECONDS` | Jendela rate limit tracking |
| `LOGIN_RATE_LIMIT_REQUESTS` | Batas percobaan login |
| `LOGIN_RATE_LIMIT_WINDOW_SECONDS` | Jendela rate limit login (60 detik) |
| `DEFAULT_PAGE_SIZE` | Pagination default |
| `MAX_PAGE_SIZE` | Pagination maksimum |
| `TRACKING_PHONE_LAST_DIGITS` | Jumlah digit telepon untuk verifikasi |

### Cloudflare bindings

Production menggunakan native binding:

| Binding | Resource |
|---|---|
| `LOGIN_RATE_LIMITER` | Binding rate limit login produksi |
| `YUKATITIP_PRIVATE_BUCKET` | Bucket R2 file private |
| `YUKATITIP_PUBLIC_BUCKET` | Bucket R2 aset publik |
| `YUKATITIP_CONFIG_KV` | KV konfigurasi/cache non-transaksional |

Login production memakai binding `LOGIN_RATE_LIMITER` dengan jendela 60 detik. Fallback in-memory hanya untuk local development dan test.

Nama binding aktual dikonfigurasi di Wrangler atau dashboard Cloudflare. Jangan mengirim binding ke browser.

### R2 local tooling

Variabel berikut hanya digunakan jika local development/tooling mengakses S3-compatible API:

```text
CLOUDFLARE_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_S3_ENDPOINT
R2_PRIVATE_BUCKET_NAME
R2_PUBLIC_BUCKET_NAME
```

Production runtime sebaiknya memakai binding R2, bukan access key S3.

### Validation rules

- Environment wajib divalidasi satu kali di server startup/request bootstrap.
- Placeholder `<...>` dianggap konfigurasi tidak valid.
- Secret yang hilang harus menghasilkan error konfigurasi, bukan fallback kosong.
- Nilai angka harus diparsing dan diperiksa batas minimumnya.
- `PUBLIC_API_BASE_URL` harus cocok dengan prefix API pada dokumen ini.
- `COOKIE_SECURE` wajib `true` di production.
- `DISABLE_TURNSTILE_IN_LOCAL`, `ENABLE_DEBUG_ROUTES`, dan `MOCK_R2_UPLOADS` tidak boleh aktif di production.
- Error konfigurasi tidak boleh mengembalikan nilai secret ke client atau log.

## 2. Authentication

### Endpoint internal

Gunakan session Supabase Auth melalui secure HTTP-only cookie.

Request browser:

```http
GET /api/v1/me
Cookie: <supabase-session-cookie>
Accept: application/json
```

Untuk request mutasi:

```http
Content-Type: application/json
X-CSRF-Token: <token>
```

Server wajib:

1. Memvalidasi session.
2. Memvalidasi `Origin`.
3. Memvalidasi CSRF untuk request mutasi berbasis cookie.
4. Memastikan akun berstatus `active`.
5. Memeriksa role, cabang, dan permission.

### Endpoint publik

Tidak membutuhkan login, tetapi dapat membutuhkan:

```json
{
  "turnstileToken": "token-dari-widget"
}
```

Turnstile harus diverifikasi di server menggunakan `TURNSTILE_SECRET_KEY`. Widget browser menggunakan `PUBLIC_TURNSTILE_SITE_KEY`.

## 3. Response Envelope

### Berhasil dengan data

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "req_01J..."
  }
}
```

### Berhasil untuk list

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 120,
    "totalPages": 6,
    "requestId": "req_01J..."
  }
}
```

### Gagal

```json
{
  "success": false,
  "error": {
    "code": "ORDER_ROUTE_MISMATCH",
    "message": "Pesanan tidak dapat dimasukkan ke batch karena arah rutenya berbeda.",
    "fieldErrors": {
      "tripId": ["Rute batch tidak sesuai dengan rute pesanan."]
    }
  },
  "meta": {
    "requestId": "req_01J..."
  }
}
```

## 4. Status HTTP

| Status | Penggunaan |
|---|---|
| `200` | Request berhasil |
| `201` | Resource berhasil dibuat |
| `204` | Berhasil tanpa response body |
| `400` | Request tidak valid |
| `401` | Belum login atau session tidak valid |
| `403` | Tidak memiliki akses |
| `404` | Resource tidak ditemukan |
| `409` | Konflik status, nomor unik, atau resource terkunci |
| `422` | Validasi field atau aturan bisnis gagal |
| `429` | Terlalu banyak request |
| `500` | Kesalahan internal |

## 5. Pagination, Filter, dan Sort

Parameter standar:

```text
page=1
pageSize=20
search=YKT-2607
sort=-createdAt
status=in_transit
branchId=<uuid>
```

Aturan:

- `pageSize` default berasal dari `DEFAULT_PAGE_SIZE`.
- `pageSize` maksimum berasal dari `MAX_PAGE_SIZE`.
- Prefix `-` berarti descending.
- Server hanya menerima field sort yang sudah di-whitelist.
- Filter cabang tetap dibatasi oleh authorization.

---

# 6. Public API

## 6.1 Health Check

### `GET /api/v1/health`

Response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "yukatitip",
    "version": "1.0.0",
    "timestamp": "2026-07-12T00:00:00Z"
  },
  "meta": {
    "requestId": "req_01J..."
  }
}
```

Jangan menampilkan credential, nama database, atau detail infrastruktur sensitif.

---

## 6.2 Daftar Rute Publik

### `GET /api/v1/public/routes`

Query opsional:

```text
origin=MKS
destination=PIN
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "50000000-0000-4000-8000-000000000001",
      "origin": {
        "code": "MKS",
        "name": "Yukatitip Makassar",
        "city": "Makassar"
      },
      "destination": {
        "code": "PIN",
        "name": "Yukatitip Pinrang",
        "city": "Pinrang"
      },
      "name": "Makassar → Pinrang",
      "baseFee": 20000,
      "estimatedDurationMinutes": 300
    }
  ],
  "meta": {
    "requestId": "req_01J..."
  }
}
```

---

## 6.3 Jadwal Publik

### `GET /api/v1/public/schedules`

Query:

```text
routeId=<uuid>
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "routeId": "50000000-0000-4000-8000-000000000001",
      "dayOfWeek": 5,
      "dayLabel": "Jumat",
      "departureTime": "08:00",
      "notes": "Jumat pagi"
    }
  ],
  "meta": {
    "requestId": "req_01J..."
  }
}
```

---

## 6.4 Lacak Pesanan

### `POST /api/v1/tracking/lookup`

Rate limit berasal dari:

```text
TRACKING_RATE_LIMIT_REQUESTS
TRACKING_RATE_LIMIT_WINDOW_SECONDS
```

Nilai contoh `.env.example` adalah 10 request per 60 detik per IP.

Request:

```json
{
  "trackingNumber": "YKT-2607-00125",
  "phoneLast4": "0001",
  "turnstileToken": "turnstile-token"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "trackingNumber": "YKT-2607-00125",
    "serviceType": "purchase",
    "serviceLabel": "Titip beli",
    "origin": {
      "city": "Makassar",
      "branchName": "Yukatitip Makassar"
    },
    "destination": {
      "city": "Pinrang",
      "branchName": "Yukatitip Pinrang"
    },
    "status": "in_transit",
    "statusLabel": "Dalam perjalanan",
    "lastUpdatedAt": "2026-07-12T00:00:00Z",
    "publicNotes": "Ambil di titik Yukatitip Pinrang.",
    "timeline": [
      {
        "status": "in_transit",
        "label": "Dalam perjalanan",
        "description": "Barang sedang dalam perjalanan ke Pinrang.",
        "location": "Makassar",
        "createdAt": "2026-07-12T00:00:00Z"
      },
      {
        "status": "purchasing_or_collecting",
        "label": "Sedang dibeli/diambil",
        "description": "Barang sedang dibeli di Makassar.",
        "location": "Makassar",
        "createdAt": "2026-07-11T05:00:00Z"
      }
    ]
  },
  "meta": {
    "requestId": "req_01J..."
  }
}
```

Data berikut tidak boleh dikembalikan:

- Nomor telepon lengkap.
- Alamat lengkap.
- Catatan internal.
- Bukti pembayaran.
- Nota.
- Harga barang.
- Revenue.
- Biaya operasional.
- Nama lengkap petugas.
- Komisi dan payroll.

Error yang disamarkan:

```json
{
  "success": false,
  "error": {
    "code": "TRACKING_NOT_FOUND",
    "message": "Nomor tracking atau data verifikasi tidak sesuai."
  },
  "meta": {
    "requestId": "req_01J..."
  }
}
```

Jangan membedakan error nomor tracking tidak ada dengan empat digit telepon salah.

---

# 7. Session dan Profil

## 7.1 Profil Aktif

### `GET /api/v1/me`

Response:

```json
{
  "success": true,
  "data": {
    "id": "30000000-0000-4000-8000-000000000004",
    "fullName": "Andi Saputra",
    "phone": "6281111110004",
    "role": {
      "code": "field_staff",
      "name": "Petugas Lapangan"
    },
    "branch": {
      "id": "20000000-0000-4000-8000-000000000001",
      "code": "MKS",
      "name": "Yukatitip Makassar"
    },
    "permissions": [
      "tasks.execute"
    ]
  },
  "meta": {
    "requestId": "req_01J..."
  }
}
```

---

# 8. Customer API

## 8.1 Daftar Customer

### `GET /api/v1/customers`

Query:

```text
page=1
pageSize=20
search=Siti
customerType=individual
status=active
```

Response item:

```json
{
  "id": "70000000-0000-4000-8000-000000000001",
  "name": "Siti Rahma",
  "phone": "6285210000001",
  "customerType": "individual",
  "city": "Pinrang",
  "status": "active",
  "orderCount": 4,
  "createdAt": "2026-07-05T00:00:00Z"
}
```

## 8.2 Buat Customer

### `POST /api/v1/customers`

Request:

```json
{
  "homeBranchId": "20000000-0000-4000-8000-000000000002",
  "name": "Siti Rahma",
  "phone": "6285210000001",
  "email": null,
  "customerType": "individual",
  "address": "Watang Sawitto",
  "district": "Watang Sawitto",
  "city": "Pinrang",
  "landmark": "Dekat pasar",
  "notes": "Sering titip skincare."
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "id": "70000000-0000-4000-8000-000000000001",
    "name": "Siti Rahma",
    "phone": "6285210000001",
    "status": "active"
  },
  "meta": {
    "requestId": "req_01J..."
  }
}
```

Possible error:

```json
{
  "success": false,
  "error": {
    "code": "CUSTOMER_PHONE_EXISTS",
    "message": "Customer dengan nomor WhatsApp tersebut sudah tersedia.",
    "fieldErrors": {
      "phone": ["Gunakan data customer yang sudah ada."]
    }
  },
  "meta": {
    "requestId": "req_01J..."
  }
}
```

## 8.3 Detail dan Perbarui Customer

```http
GET   /api/v1/customers/:customerId
PATCH /api/v1/customers/:customerId
```

Customer dinonaktifkan melalui `PATCH`, bukan dihapus.

---

# 9. Order API

## 9.1 Daftar Pesanan

### `GET /api/v1/orders`

Filter:

```text
search=YKT-2607
status=in_transit
paymentStatus=paid
originBranchId=<uuid>
destinationBranchId=<uuid>
routeId=<uuid>
assignedEmployeeId=<uuid>
dateFrom=2026-07-01
dateTo=2026-07-31
```

Response item:

```json
{
  "id": "80000000-0000-4000-8000-000000000001",
  "trackingNumber": "YKT-2607-00125",
  "customer": {
    "id": "70000000-0000-4000-8000-000000000001",
    "name": "Siti Rahma"
  },
  "route": {
    "name": "Makassar → Pinrang"
  },
  "serviceType": "purchase",
  "status": "in_transit",
  "statusLabel": "Dalam perjalanan",
  "paymentStatus": "paid",
  "goodsAmount": 350000,
  "serviceRevenue": 50000,
  "additionalServiceFees": 10000,
  "totalCustomerPayment": 410000,
  "createdAt": "2026-07-10T01:00:00Z"
}
```

## 9.2 Buat Pesanan

### `POST /api/v1/orders`

Gunakan header idempotency untuk mencegah pesanan ganda akibat retry:

```http
Idempotency-Key: order-client-generated-uuid
```

Request:

```json
{
  "serviceType": "purchase",
  "fulfillmentMethod": "branch_pickup",
  "originBranchId": "20000000-0000-4000-8000-000000000001",
  "destinationBranchId": "20000000-0000-4000-8000-000000000002",
  "routeId": "50000000-0000-4000-8000-000000000001",
  "senderCustomerId": "70000000-0000-4000-8000-000000000001",
  "receiverCustomerId": "70000000-0000-4000-8000-000000000001",
  "goodsAmount": 350000,
  "serviceRevenue": 50000,
  "additionalServiceFees": 10000,
  "discountAmount": 0,
  "deliveryAddress": null,
  "publicNotes": "Ambil di titik Yukatitip Pinrang.",
  "internalNotes": "Pastikan varian sesuai foto.",
  "items": [
    {
      "storeId": "71000000-0000-4000-8000-000000000001",
      "productName": "Skincare Paket A",
      "productUrl": "https://example.test/products/skincare-a",
      "quantity": 1,
      "estimatedUnitPrice": 350000,
      "weightGrams": 700,
      "attributes": {
        "variant": "Brightening",
        "size": "Regular"
      },
      "notes": "Pastikan segel utuh."
    }
  ]
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "id": "80000000-0000-4000-8000-000000000001",
    "trackingNumber": "YKT-2607-00125",
    "status": "recorded",
    "paymentStatus": "unpaid",
    "totalCustomerPayment": 410000
  },
  "meta": {
    "requestId": "req_01J..."
  }
}
```

Server wajib:

- Membuat nomor tracking.
- Memvalidasi arah route.
- Membuat item secara transaksional.
- Membuat tracking event awal.
- Menulis audit log.

## 9.3 Detail dan Edit Pesanan

```http
GET   /api/v1/orders/:orderId
PATCH /api/v1/orders/:orderId
```

Field keuangan atau route tidak boleh diedit setelah status tertentu tanpa aksi koreksi terotorisasi.

## 9.4 Perbarui Status Pesanan

### `POST /api/v1/orders/:orderId/status`

Request:

```json
{
  "status": "in_transit",
  "publicDescription": "Barang sedang dalam perjalanan ke Pinrang.",
  "internalDescription": "Masuk batch BTH-2607-0021.",
  "location": "Makassar",
  "expectedVersion": 4
}
```

Response:

```json
{
  "success": true,
  "data": {
    "orderId": "80000000-0000-4000-8000-000000000001",
    "status": "in_transit",
    "version": 5,
    "updatedAt": "2026-07-12T00:00:00Z"
  },
  "meta": {
    "requestId": "req_01J..."
  }
}
```

`expectedVersion` direkomendasikan untuk mencegah lost update.

## 9.5 Tambah Pembayaran

### `POST /api/v1/orders/:orderId/payments`

Request:

```json
{
  "amount": 410000,
  "paymentMethod": "bank_transfer",
  "paidAt": "2026-07-10T01:45:00Z",
  "attachmentId": "D0000000-0000-4000-8000-000000000001",
  "notes": "Pembayaran penuh."
}
```

Server tidak otomatis memverifikasi pembayaran kecuali user memiliki permission.

## 9.6 Verifikasi Pembayaran

### `POST /api/v1/payments/:paymentId/verify`

Request:

```json
{
  "decision": "approve",
  "notes": "Nominal sesuai."
}
```

Response:

```json
{
  "success": true,
  "data": {
    "paymentId": "83000000-0000-4000-8000-000000000001",
    "status": "paid",
    "orderPaymentStatus": "paid",
    "verifiedAt": "2026-07-10T02:00:00Z"
  },
  "meta": {
    "requestId": "req_01J..."
  }
}
```

---

# 10. Trip dan Handover API

## 10.1 Daftar dan Buat Batch

```http
GET  /api/v1/trips
POST /api/v1/trips
```

Request create:

```json
{
  "routeId": "50000000-0000-4000-8000-000000000001",
  "departureAt": "2026-07-12T00:00:00Z",
  "originStaffId": "40000000-0000-4000-8000-000000000004",
  "destinationStaffId": "40000000-0000-4000-8000-000000000007",
  "vehicleDescription": "Mobil operasional MPV",
  "notes": "Batch Makassar ke Pinrang."
}
```

Server membuat `tripNumber`.

## 10.2 Masukkan Pesanan ke Batch

### `POST /api/v1/trips/:tripId/orders`

Request:

```json
{
  "orderIds": [
    "80000000-0000-4000-8000-000000000001"
  ]
}
```

Response:

```json
{
  "success": true,
  "data": {
    "tripId": "90000000-0000-4000-8000-000000000001",
    "added": 1,
    "skipped": []
  },
  "meta": {
    "requestId": "req_01J..."
  }
}
```

Conflict:

```json
{
  "success": false,
  "error": {
    "code": "ORDER_ROUTE_MISMATCH",
    "message": "Satu atau lebih pesanan memiliki arah rute yang berbeda."
  },
  "meta": {
    "requestId": "req_01J..."
  }
}
```

## 10.3 Handover Keberangkatan

### `POST /api/v1/trips/:tripId/handovers/departure`

Request:

```json
{
  "totalPackages": 18,
  "attachmentIds": [
    "D0000000-0000-4000-8000-000000000003"
  ],
  "notes": "Jumlah sesuai manifest."
}
```

Server dapat:

- Membuat handover.
- Mengubah trip menjadi `in_transit`.
- Mengubah seluruh order menjadi `in_transit`.
- Membuat tracking event.
- Menulis audit log.

## 10.4 Handover Kedatangan

### `POST /api/v1/trips/:tripId/handovers/arrival`

Request:

```json
{
  "totalPackages": 18,
  "receivedPackages": 18,
  "attachmentIds": [],
  "notes": "Semua paket diterima dalam kondisi baik."
}
```

Jika jumlah berbeda, server wajib meminta detail selisih.

## 10.5 Perbarui Status Batch

### `POST /api/v1/trips/:tripId/status`

Request:

```json
{
  "status": "completed",
  "notes": "Semua barang telah diterima cabang tujuan."
}
```

---

# 11. Task API

## 11.1 Daftar Tugas

### `GET /api/v1/tasks`

Petugas hanya menerima tugasnya sendiri.

Filter:

```text
status=assigned
date=2026-07-12
tripId=<uuid>
```

## 11.2 Buat Tugas

### `POST /api/v1/tasks`

Request:

```json
{
  "branchId": "20000000-0000-4000-8000-000000000001",
  "tripId": "90000000-0000-4000-8000-000000000001",
  "assignedTo": "40000000-0000-4000-8000-000000000004",
  "area": "Panakkukang",
  "operationalBudget": 165000,
  "notes": "Pengambilan skincare.",
  "orderItemIds": [
    "81000000-0000-4000-8000-000000000001"
  ]
}
```

## 11.3 Mulai Tugas

### `POST /api/v1/tasks/:taskId/start`

Request:

```json
{
  "startedAt": "2026-07-11T03:00:00Z"
}
```

## 11.4 Perbarui Item Tugas

### `PATCH /api/v1/tasks/:taskId/items/:taskItemId`

Request:

```json
{
  "status": "waiting_confirmation",
  "actualPrice": 375000,
  "notes": "Harga aktual lebih tinggi Rp25.000."
}
```

## 11.5 Selesaikan Tugas

### `POST /api/v1/tasks/:taskId/complete`

Request:

```json
{
  "completedAt": "2026-07-11T08:00:00Z",
  "notes": "Semua item berhasil diproses."
}
```

Server tidak boleh menandai selesai jika masih ada item dengan status yang tidak final tanpa alasan yang valid.

---

# 12. Uang Muka dan Biaya Operasional

## 12.1 Buat Uang Muka

### `POST /api/v1/operational-advances`

Request:

```json
{
  "employeeId": "40000000-0000-4000-8000-000000000004",
  "branchId": "20000000-0000-4000-8000-000000000001",
  "taskId": "92000000-0000-4000-8000-000000000001",
  "tripId": "90000000-0000-4000-8000-000000000001",
  "advanceDate": "2026-07-11",
  "amount": 165000,
  "notes": "Anggaran BBM, makan, dan parkir."
}
```

## 12.2 Setujui dan Cairkan Uang Muka

```http
POST /api/v1/operational-advances/:advanceId/approve
POST /api/v1/operational-advances/:advanceId/disburse
```

Request pencairan:

```json
{
  "disbursedAt": "2026-07-11T02:30:00Z",
  "source": "petty_cash"
}
```

## 12.3 Input Biaya

### `POST /api/v1/operational-expenses`

Request:

```json
{
  "advanceId": "A1000000-0000-4000-8000-000000000001",
  "employeeId": "40000000-0000-4000-8000-000000000004",
  "branchId": "20000000-0000-4000-8000-000000000001",
  "taskId": "92000000-0000-4000-8000-000000000001",
  "tripId": "90000000-0000-4000-8000-000000000001",
  "categoryId": "60000000-0000-4000-8000-000000000001",
  "expenseDate": "2026-07-11",
  "amount": 100000,
  "notes": "BBM tugas Panakkukang.",
  "attachmentIds": [
    "D0000000-0000-4000-8000-000000000002"
  ]
}
```

## 12.4 Ajukan Biaya

### `POST /api/v1/operational-expenses/:expenseId/submit`

Response mengubah status menjadi `submitted` atau `waiting_verification`.

## 12.5 Verifikasi Biaya

### `POST /api/v1/operational-expenses/:expenseId/review`

Request approve:

```json
{
  "decision": "approve",
  "approvedAmount": 100000,
  "notes": "Bukti valid."
}
```

Request reject:

```json
{
  "decision": "reject",
  "notes": "Bukti tidak sesuai tanggal tugas."
}
```

Kepala cabang tidak boleh memverifikasi klaimnya sendiri.

## 12.6 Selesaikan Uang Muka

### `POST /api/v1/operational-advances/:advanceId/settle`

Request:

```json
{
  "returnedAmount": 25000,
  "reimbursedAmount": 0,
  "settledAt": "2026-07-12T02:00:00Z",
  "notes": "Sisa dikembalikan ke kas kecil."
}
```

Response:

```json
{
  "success": true,
  "data": {
    "advanceAmount": 165000,
    "approvedExpenses": 140000,
    "expectedReturn": 25000,
    "returnedAmount": 25000,
    "reimbursedAmount": 0,
    "status": "settled"
  },
  "meta": {
    "requestId": "req_01J..."
  }
}
```

---

# 13. Commission API

## 13.1 Daftar dan Buat Periode

```http
GET  /api/v1/commission-periods
POST /api/v1/commission-periods
```

Request create:

```json
{
  "branchId": "20000000-0000-4000-8000-000000000001",
  "periodStart": "2026-07-01",
  "periodEnd": "2026-07-31"
}
```

## 13.2 Hitung Komisi

### `POST /api/v1/commission-periods/:periodId/calculate`

Response:

```json
{
  "success": true,
  "data": {
    "periodId": "A0000000-0000-4000-8000-000000000001",
    "employees": [
      {
        "employeeId": "40000000-0000-4000-8000-000000000004",
        "totalRevenue": 7000000,
        "totalOperationalExpense": 2000000,
        "netContribution": 5000000,
        "commissionRate": 20,
        "commissionAmount": 1000000
      }
    ],
    "status": "calculated"
  },
  "meta": {
    "requestId": "req_01J..."
  }
}
```

Perhitungan hanya menggunakan:

- Revenue berstatus eligible.
- Biaya berstatus approved.
- Tugas pada periode dan cabang yang sesuai.
- Rate kompensasi yang efektif pada periode.

Hasil final mengikuti database: `netContribution` negatif menjadi `0` dan `commissionAmount` dibulatkan matematis ke rupiah terdekat sebelum disimpan.

## 13.3 Setujui dan Kunci

```http
POST /api/v1/commission-periods/:periodId/approve
POST /api/v1/commission-periods/:periodId/lock
```

Periode terkunci tidak dapat dihitung ulang tanpa proses koreksi terotorisasi.

---

# 14. Payroll API

## 14.1 Buat dan Hitung Payroll

```http
POST /api/v1/payroll-periods
POST /api/v1/payroll-periods/:periodId/calculate
```

Request create:

```json
{
  "branchId": "20000000-0000-4000-8000-000000000001",
  "periodStart": "2026-07-01",
  "periodEnd": "2026-07-31",
  "commissionPeriodId": "A0000000-0000-4000-8000-000000000001"
}
```

Response calculation item:

```json
{
  "employeeId": "40000000-0000-4000-8000-000000000004",
  "baseSalary": 2500000,
  "vehicleAllowance": 400000,
  "communicationAllowance": 150000,
  "commission": 1000000,
  "deductions": 0,
  "totalPay": 4050000
}
```

## 14.2 Setujui, Bayar, dan Kunci

```http
POST /api/v1/payroll-periods/:periodId/approve
POST /api/v1/payroll-periods/:periodId/mark-paid
POST /api/v1/payroll-periods/:periodId/lock
```

Request mark-paid:

```json
{
  "paidAt": "2026-08-01T02:00:00Z",
  "paymentReference": "PAYROLL-MKS-2026-07"
}
```

---

# 15. Branch Expense API

## 15.1 Daftar dan Input Biaya Cabang

```http
GET  /api/v1/branch-expenses
POST /api/v1/branch-expenses
```

Request:

```json
{
  "branchId": "20000000-0000-4000-8000-000000000001",
  "categoryId": "60000000-0000-4000-8000-000000000005",
  "vendor": "PLN",
  "amount": 425000,
  "periodStart": "2026-07-01",
  "periodEnd": "2026-07-31",
  "invoiceDate": "2026-07-05",
  "dueDate": "2026-07-20",
  "notes": "Tagihan listrik Juli 2026.",
  "attachmentIds": []
}
```

## 15.2 Review dan Tandai Dibayar

```http
POST /api/v1/branch-expenses/:expenseId/review
POST /api/v1/branch-expenses/:expenseId/mark-paid
```

Request mark-paid:

```json
{
  "paidAt": "2026-07-10T02:00:00Z",
  "paymentMethod": "bank_transfer",
  "notes": "Dibayar dari rekening operasional."
}
```

## 15.3 Anggaran Cabang

```http
GET  /api/v1/branch-budgets
POST /api/v1/branch-budgets
PATCH /api/v1/branch-budgets/:budgetId
```

## 15.4 Kontrak Sewa

```http
GET  /api/v1/rent-contracts
POST /api/v1/rent-contracts
PATCH /api/v1/rent-contracts/:contractId
```

Request:

```json
{
  "branchId": "20000000-0000-4000-8000-000000000001",
  "landlordName": "Pemilik Ruko Contoh",
  "startDate": "2026-01-01",
  "endDate": "2026-12-31",
  "totalAmount": 24000000,
  "paymentDate": "2026-01-02",
  "monthlyAllocation": 2000000,
  "notes": "Kontrak tahunan.",
  "attachmentIds": [
    "D0000000-0000-4000-8000-000000000004"
  ]
}
```

---

# 16. Employee API

## 16.1 Daftar dan Detail Karyawan

```http
GET /api/v1/employees
GET /api/v1/employees/:employeeId
```

Kepala cabang hanya melihat karyawan cabangnya. Data bank, kompensasi, dan payroll harus dibatasi lebih ketat.

## 16.2 Buat Karyawan

### `POST /api/v1/employees`

Request:

```json
{
  "employeeNumber": "EMP-MKS-0003",
  "fullName": "Andi Saputra",
  "phone": "6281111110004",
  "email": "petugas.makassar@yukatitip.local",
  "address": "Makassar",
  "branchId": "20000000-0000-4000-8000-000000000001",
  "positionId": "12000000-0000-4000-8000-000000000004",
  "supervisorEmployeeId": "40000000-0000-4000-8000-000000000002",
  "joinDate": "2026-03-15",
  "bankName": "Bank Contoh",
  "bankAccount": "0001000004"
}
```

Pembuatan akun Supabase Auth dipisahkan dari pembuatan record karyawan dan wajib ditangani secara aman.

## 16.3 Atur Kompensasi

### `POST /api/v1/employees/:employeeId/compensations`

Request:

```json
{
  "baseSalary": 2500000,
  "vehicleAllowance": 400000,
  "communicationAllowance": 150000,
  "commissionRate": 20,
  "effectiveFrom": "2026-07-01",
  "effectiveUntil": null
}
```

Perubahan tidak boleh mengubah record lama. Buat record efektif baru dan tutup periode sebelumnya.

## 16.4 Nonaktifkan Karyawan

### `POST /api/v1/employees/:employeeId/deactivate`

Request:

```json
{
  "effectiveDate": "2026-08-01",
  "reason": "Mengundurkan diri."
}
```

Akun dan histori tidak dihapus.

## 16.5 Histori Penempatan Karyawan

Route berikut adalah route internal app shell untuk mengelola histori penempatan:

```http
GET /app/employees/:employeeId/assignments
GET /app/employees/:employeeId/assignments/:assignmentId
GET /app/employees/:employeeId/assignments/:assignmentId/edit
GET /app/employees/:employeeId/assignments/new
POST /app/employees/:employeeId/assignments/:assignmentId/close
```

Aturan:

- Hanya owner atau `branch_manager` aktif yang boleh mengakses.
- `branch_manager` wajib berada di cabang yang sama dengan karyawan target.
- `supervisorEmployeeId` harus aktif, berada di cabang yang sama, dan berjabatan `branch_manager`.
- `reason` wajib diisi untuk histori baru atau mutasi.
- `expectedUpdatedAt` dipakai untuk mencegah penimpaan perubahan yang lebih baru.
- Penutupan assignment menutup periode histori dan dapat menonaktifkan karyawan sesuai aturan database.

---

# 17. Upload dan File API

## 17.1 Minta Presigned Upload

### `POST /api/v1/uploads/presign`

Request:

```json
{
  "entityType": "operational_expense",
  "entityId": "A2000000-0000-4000-8000-000000000001",
  "filename": "nota-bbm.jpg",
  "contentType": "image/jpeg",
  "sizeBytes": 198765
}
```

Response:

```json
{
  "success": true,
  "data": {
    "uploadId": "upl_01J...",
    "method": "PUT",
    "uploadUrl": "https://temporary-presigned-url.example",
    "objectKey": "expenses/2026/07/40000000-0000-4000-8000-000000000004/<uuid>.jpg",
    "requiredHeaders": {
      "Content-Type": "image/jpeg"
    },
    "expiresAt": "2026-07-12T03:10:00Z"
  },
  "meta": {
    "requestId": "req_01J..."
  }
}
```

Server wajib memvalidasi:

- Session.
- Authorization terhadap entity.
- MIME type.
- Ukuran file.
- Ekstensi.
- Batas ukuran berdasarkan `MAX_UPLOAD_SIZE_BYTES`.
- MIME berdasarkan `ALLOWED_IMAGE_MIME_TYPES` dan `ALLOWED_DOCUMENT_MIME_TYPES`.
- TTL URL berdasarkan `R2_UPLOAD_URL_TTL_SECONDS`.
- Bucket private melalui binding `YUKATITIP_PRIVATE_BUCKET`.
- Kuota.
- Entity benar-benar ada.

## 17.2 Selesaikan Upload

### `POST /api/v1/uploads/complete`

Request:

```json
{
  "uploadId": "upl_01J...",
  "entityType": "operational_expense",
  "entityId": "A2000000-0000-4000-8000-000000000001",
  "objectKey": "expenses/2026/07/40000000-0000-4000-8000-000000000004/<uuid>.jpg",
  "originalFilename": "nota-bbm.jpg",
  "contentType": "image/jpeg",
  "sizeBytes": 198765
}
```

Server memeriksa object di R2 sebelum membuat record `attachments`.

## 17.3 Akses File Private

### `POST /api/v1/files/:attachmentId/access`

Response:

```json
{
  "success": true,
  "data": {
    "url": "https://temporary-download-url.example",
    "expiresAt": "2026-07-12T03:05:00Z"
  },
  "meta": {
    "requestId": "req_01J..."
  }
}
```

Jangan menyimpan presigned URL permanen di database. Masa berlaku download mengikuti `R2_DOWNLOAD_URL_TTL_SECONDS`.

---

# 18. Reports API

Laporan harus mengembalikan data teragregasi, bukan menarik seluruh row ke browser.

```http
GET /api/v1/reports/orders
GET /api/v1/reports/branch-performance
GET /api/v1/reports/staff-contribution
GET /api/v1/reports/operational-expenses
GET /api/v1/reports/commissions
GET /api/v1/reports/payroll
```

Contoh:

### `GET /api/v1/reports/branch-performance`

Query:

```text
branchId=<uuid>
dateFrom=2026-07-01
dateTo=2026-07-31
```

Response:

```json
{
  "success": true,
  "data": {
    "branch": {
      "id": "20000000-0000-4000-8000-000000000001",
      "name": "Yukatitip Makassar"
    },
    "serviceRevenue": 15000000,
    "directOperationalExpenses": 3000000,
    "staffCompensation": 6500000,
    "rentAllocation": 2000000,
    "utilities": 1000000,
    "officeExpenses": 500000,
    "operatingResult": 2000000
  },
  "meta": {
    "requestId": "req_01J..."
  }
}
```

---

# 19. Error Codes

| Code | Arti |
|---|---|
| `AUTH_REQUIRED` | Session tidak tersedia |
| `SESSION_INVALID` | Session tidak valid |
| `ACCOUNT_INACTIVE` | Akun dinonaktifkan |
| `FORBIDDEN` | Tidak memiliki akses |
| `BRANCH_ACCESS_DENIED` | Tidak boleh mengakses cabang |
| `VALIDATION_ERROR` | Validasi field gagal |
| `RESOURCE_NOT_FOUND` | Data tidak ditemukan |
| `RESOURCE_LOCKED` | Periode atau data sudah dikunci |
| `DUPLICATE_RESOURCE` | Data unik sudah ada |
| `CUSTOMER_PHONE_EXISTS` | Nomor customer sudah terdaftar |
| `ORDER_ROUTE_MISMATCH` | Arah pesanan dan route berbeda |
| `TRIP_ROUTE_MISMATCH` | Arah batch dan route berbeda |
| `ORDER_ALREADY_IN_TRIP` | Pesanan sudah masuk batch |
| `INVALID_STATUS_TRANSITION` | Perubahan status tidak diperbolehkan |
| `PAYMENT_AMOUNT_INVALID` | Nilai pembayaran tidak valid |
| `EXPENSE_SELF_APPROVAL_FORBIDDEN` | User mencoba menyetujui klaim sendiri |
| `ADVANCE_NOT_SETTLED` | Uang muka lama belum diselesaikan |
| `COMMISSION_PERIOD_LOCKED` | Periode komisi terkunci |
| `PAYROLL_PERIOD_LOCKED` | Periode payroll terkunci |
| `FILE_TYPE_NOT_ALLOWED` | Tipe file tidak didukung |
| `FILE_TOO_LARGE` | Ukuran file melebihi batas |
| `TURNSTILE_INVALID` | Verifikasi Turnstile gagal |
| `RATE_LIMITED` | Terlalu banyak request |
| `TRACKING_NOT_FOUND` | Tracking atau verifikasi tidak cocok |
| `CONFLICTING_UPDATE` | Data telah berubah sejak terakhir dibaca |
| `CONFIGURATION_ERROR` | Konfigurasi server tidak lengkap atau tidak valid |
| `STORAGE_UNAVAILABLE` | Binding atau layanan storage tidak tersedia |
| `INTERNAL_ERROR` | Kesalahan internal |

---

# 20. Audit Requirements

Aksi berikut wajib menulis `audit_logs`:

- Membuat atau mengubah pesanan.
- Mengubah status pesanan.
- Verifikasi pembayaran.
- Menambah atau menghapus pesanan dari batch.
- Konfirmasi handover.
- Persetujuan atau penolakan biaya.
- Pencairan dan penyelesaian uang muka.
- Perhitungan, persetujuan, dan penguncian komisi.
- Perhitungan, persetujuan, pembayaran, dan penguncian payroll.
- Perubahan gaji, tunjangan, dan rate komisi.
- Perubahan role atau status akun.
- Perubahan biaya atau kontrak cabang.
- Akses file sensitif tertentu bila diperlukan.

Audit log minimal menyimpan:

```json
{
  "actorProfileId": "uuid",
  "action": "expense.approved",
  "entityType": "daily_operational_expense",
  "entityId": "uuid",
  "oldValues": {},
  "newValues": {},
  "ipAddress": "192.0.2.10",
  "userAgent": "Browser"
}
```

---

# 21. API Implementation Rules

- Gunakan service atau use-case layer; jangan menulis seluruh business logic di `+server.ts`.
- Request schema dan response type harus type-safe.
- Gunakan transaksi untuk operasi multi-tabel.
- Jangan percaya `branchId`, `employeeId`, status, atau nilai komisi dari browser tanpa authorization.
- Jangan mengembalikan row database mentah langsung ke client.
- Map `snake_case` database ke `camelCase` API.
- Jangan membocorkan pesan SQL.
- Jangan menampilkan stack trace di production.
- Jangan membuat endpoint baru tanpa memperbarui file ini.
- Breaking change membutuhkan versi endpoint baru atau persetujuan eksplisit.
- Endpoint list wajib pagination.
- Endpoint mutasi yang berisiko duplikasi sebaiknya mendukung `Idempotency-Key`.
- Endpoint update sensitif sebaiknya memakai optimistic concurrency melalui `expectedVersion` atau `updatedAt`.
- Semua response memiliki `requestId`.
- Semua environment dibaca melalui modul config server yang typed dan tervalidasi.
- Jangan membaca secret dari komponen browser atau mengembalikannya melalui endpoint.
- Variabel atau binding baru wajib ditambahkan ke `.env.example` dan dokumentasi ini.
- Di Cloudflare production, gunakan R2/KV binding dari environment runtime.
- Jangan menggunakan flag development di production.

---

# 22. Route Structure Reference

Struktur yang direkomendasikan:

```text
src/routes/api/v1/
├── health/
├── public/
│   ├── routes/
│   └── schedules/
├── tracking/
│   └── lookup/
├── me/
├── customers/
│   └── [customerId]/
├── orders/
│   └── [orderId]/
│       ├── status/
│       └── payments/
├── payments/
│   └── [paymentId]/
│       └── verify/
├── trips/
│   └── [tripId]/
│       ├── orders/
│       ├── status/
│       └── handovers/
│           ├── departure/
│           └── arrival/
├── tasks/
│   └── [taskId]/
│       ├── start/
│       ├── complete/
│       └── items/
│           └── [taskItemId]/
├── operational-advances/
├── operational-expenses/
├── commission-periods/
├── payroll-periods/
├── branch-expenses/
├── branch-budgets/
├── rent-contracts/
├── employees/
├── uploads/
│   ├── presign/
│   └── complete/
├── files/
│   └── [attachmentId]/
│       └── access/
└── reports/
```

Implementasi folder dapat disesuaikan dengan pola repository selama URL contract tetap konsisten.
