# PRD — Yukatitip

**Dokumen:** Product Requirements Document  
**Produk:** Yukatitip  
**Versi:** MVP Web App & Landing Page Tracking  
**Tanggal:** 12 Juli 2026  
**Status:** Draft siap pengembangan

---

## 1. Ringkasan Produk

Yukatitip adalah sistem operasional jasa titip antar-kota yang membantu tim internal mencatat, memproses, membawa, menerima, dan menyerahkan barang titipan secara terstruktur.

Produk terdiri dari dua bagian:

1. **Web app internal** untuk owner, kepala cabang, admin, dan petugas lapangan.
2. **Landing page publik** untuk memperkenalkan layanan dan memantau status barang menggunakan nomor tracking.

Yukatitip mendukung:

- Titip beli.
- Titip ambil.
- Titip kirim.
- Perjalanan dua arah.
- Banyak cabang atau titik layanan.
- Banyak rute antar-kota.
- Batch perjalanan.
- Manajemen pelanggan.
- Manajemen karyawan.
- Biaya operasional cabang.
- Biaya operasional harian petugas.
- Perhitungan komisi petugas.
- Monitoring status barang oleh pelanggan.

Contoh rute awal:

- Makassar → Pinrang.
- Pinrang → Makassar.

Cabang baru seperti Parepare dapat ditambahkan melalui konfigurasi cabang dan rute tanpa membuat aplikasi terpisah.

---

## 2. Latar Belakang

Proses jasa titip yang hanya dikelola melalui WhatsApp berisiko menimbulkan:

- Pesanan tercecer.
- Data pelanggan berulang atau tidak lengkap.
- Barang tidak jelas berada di tangan siapa.
- Tidak ada riwayat status yang konsisten.
- Biaya petugas tidak tercatat dengan rapi.
- Uang pembelian barang tercampur dengan pendapatan jasa.
- Sulit mengetahui keuntungan per batch, rute, cabang, dan petugas.
- Sulit melakukan serah terima barang antar-cabang.
- Pelanggan harus terus bertanya melalui WhatsApp untuk mengetahui status barang.

Yukatitip dibangun untuk mengubah proses tersebut menjadi operasional yang tercatat, dapat diaudit, dan mudah dipantau.

---

## 3. Tujuan Produk

### 3.1 Tujuan Utama

- Memusatkan data operasional jasa titip dalam satu web app.
- Memastikan setiap barang memiliki nomor tracking dan riwayat status.
- Memisahkan harga barang pelanggan dari pendapatan jasa Yukatitip.
- Mengelola perjalanan dua arah dan banyak kota.
- Mengetahui tanggung jawab setiap cabang dan petugas.
- Mengelola biaya tetap cabang dan biaya lapangan.
- Menghitung komisi petugas berdasarkan kontribusi bersih.
- Memberikan halaman tracking sederhana kepada pelanggan.

### 3.2 Indikator Keberhasilan MVP

- Semua pesanan aktif memiliki nomor tracking.
- Semua pesanan memiliki kota asal, kota tujuan, customer, dan status.
- Semua barang dalam perjalanan terhubung ke batch.
- Semua biaya operasional petugas memiliki petugas, tanggal, dan status persetujuan.
- Semua komisi petugas dapat ditelusuri ke revenue tugas dan biaya operasionalnya.
- Semua biaya cabang tercatat per periode.
- Pelanggan dapat memantau barang tanpa login.
- Akses data dibatasi berdasarkan role dan cabang.

---

## 4. Ruang Lingkup MVP

MVP Yukatitip adalah **web app responsif** dan **landing page publik**.

### 4.1 Web App Internal

Web app internal mencakup:

- Dashboard.
- Manajemen cabang.
- Manajemen rute.
- Manajemen batch perjalanan.
- Manajemen pelanggan.
- Manajemen pesanan.
- Manajemen item barang.
- Manajemen toko atau lokasi pengambilan.
- Penugasan petugas.
- Checklist keberangkatan dan penerimaan.
- Manajemen pembayaran manual.
- Manajemen karyawan.
- Manajemen akun dan role.
- Biaya operasional cabang.
- Biaya operasional harian petugas.
- Uang muka operasional.
- Verifikasi pengeluaran.
- Komisi petugas.
- Payroll sederhana.
- Laporan operasional dan keuangan dasar.
- Pengaturan tarif dan status.

### 4.2 Landing Page Publik

Landing page mencakup:

- Informasi layanan.
- Cara kerja.
- Rute aktif.
- Jadwal keberangkatan.
- Tarif dasar.
- Tombol WhatsApp.
- Form tracking.
- Halaman detail tracking barang.

### 4.3 Cara Pemesanan

Untuk MVP, pelanggan melakukan pemesanan melalui WhatsApp.

Admin kemudian:

1. Mencari atau membuat data customer.
2. Membuat pesanan.
3. Memasukkan item barang.
4. Menentukan asal dan tujuan.
5. Menghitung biaya.
6. Mencatat pembayaran manual.
7. Memberikan nomor tracking kepada pelanggan.

---

## 5. Model Operasional

### 5.1 Cabang atau Titik Layanan

Setiap kota dapat memiliki satu cabang atau titik layanan.

Contoh:

| Kode | Nama |
|---|---|
| MKS | Yukatitip Makassar |
| PIN | Yukatitip Pinrang |
| PRP | Yukatitip Parepare |

Data cabang:

- Kode cabang.
- Nama cabang.
- Kota.
- Alamat.
- Nomor WhatsApp.
- Penanggung jawab.
- Jam operasional.
- Tautan Google Maps.
- Status aktif.

Pada tahap awal, cabang dapat berupa rumah operator, toko mitra, atau titik pengumpulan.

### 5.2 Rute

Rute menghubungkan satu cabang asal dengan satu cabang tujuan.

Contoh:

- Makassar → Pinrang.
- Pinrang → Makassar.
- Pinrang → Parepare.
- Parepare → Pinrang.

Setiap arah adalah rute berbeda karena dapat memiliki:

- Jadwal berbeda.
- Tarif berbeda.
- Biaya berbeda.
- Petugas berbeda.
- Volume pesanan berbeda.

Data rute:

- Cabang asal.
- Cabang tujuan.
- Nama rute.
- Estimasi waktu.
- Tarif dasar.
- Jadwal.
- Status aktif.

### 5.3 Batch Perjalanan

Batch adalah kumpulan pesanan dalam satu keberangkatan.

Contoh nomor batch:

`BTH-2607-0021`

Data batch:

- Nomor batch.
- Rute.
- Cabang asal.
- Cabang tujuan.
- Waktu berangkat.
- Waktu tiba.
- Petugas asal.
- Petugas tujuan.
- Jumlah pesanan.
- Jumlah paket.
- Status.
- Catatan.

Status batch:

- Draft.
- Persiapan.
- Siap berangkat.
- Dalam perjalanan.
- Tiba di tujuan.
- Selesai.
- Dibatalkan.

Satu pesanan hanya dapat dimasukkan ke batch dengan rute yang sesuai.

---

## 6. Jenis Layanan

### 6.1 Titip Beli

Petugas membeli barang di kota asal berdasarkan detail dari customer.

### 6.2 Titip Ambil

Barang telah dibeli atau dibayar oleh customer. Petugas hanya mengambil dan membawanya.

### 6.3 Titip Kirim

Customer menyerahkan barang ke titik Yukatitip untuk dibawa ke kota tujuan.

---

## 7. Peran Pengguna

### 7.1 Owner

Hak akses:

- Seluruh cabang.
- Seluruh pesanan.
- Seluruh batch dan rute.
- Seluruh data karyawan.
- Kompensasi dan payroll.
- Seluruh biaya cabang.
- Seluruh biaya petugas.
- Laporan keuangan.
- Pengaturan sistem.
- Persetujuan tingkat tertinggi.

### 7.2 Kepala Cabang

Hak akses terbatas pada cabangnya:

- Dashboard cabang.
- Pesanan masuk dan keluar cabang.
- Penugasan petugas.
- Batch terkait cabang.
- Biaya cabang.
- Uang muka petugas.
- Verifikasi biaya sesuai batas kewenangan.
- Usulan insentif dan komisi.
- Monitoring karyawan cabang.

Kepala cabang tidak boleh menyetujui klaim, bonus, atau perubahan kompensasinya sendiri.

### 7.3 Admin Cabang

Hak akses:

- Customer.
- Pesanan.
- Item barang.
- Pembayaran manual.
- Tracking.
- Toko.
- Batch.
- Input biaya.
- Input data operasional.

Admin tidak dapat mengubah gaji, benefit, atau pengaturan sensitif.

### 7.4 Petugas Lapangan

Hak akses:

- Tugas yang diberikan.
- Detail toko.
- Daftar barang.
- Mulai dan selesaikan tugas.
- Input harga aktual.
- Upload foto barang.
- Upload nota.
- Input biaya operasional.
- Melihat uang muka dan penyelesaiannya.
- Melihat ringkasan komisi pribadi.

Petugas tidak dapat melihat laba lengkap cabang atau data yang tidak terkait tugasnya.

### 7.5 Petugas Tujuan

Hak akses:

- Batch masuk.
- Checklist barang tiba.
- Konfirmasi jumlah paket.
- Catatan kerusakan atau kekurangan.
- Status siap diambil.
- Konfirmasi serah terima kepada customer.

---

## 8. Dashboard

### 8.1 Dashboard Owner

Menampilkan:

- Total pesanan seluruh cabang.
- Pesanan per cabang.
- Pesanan per rute.
- Batch aktif.
- Barang dalam perjalanan.
- Pesanan bermasalah.
- Pendapatan jasa.
- Biaya langsung.
- Biaya tetap cabang.
- Kontribusi bersih.
- Uang muka belum diselesaikan.
- Komisi petugas.
- Tagihan cabang belum dibayar.

### 8.2 Dashboard Cabang

Menampilkan:

- Pesanan keluar dari cabang.
- Pesanan masuk ke cabang.
- Menunggu diproses.
- Menunggu keberangkatan.
- Dalam perjalanan.
- Siap diserahkan.
- Tugas petugas hari ini.
- Pengeluaran hari ini.
- Uang muka belum selesai.
- Batch aktif cabang.

### 8.3 Dashboard Petugas

Menampilkan:

- Tugas hari ini.
- Tugas belum dimulai.
- Tugas sedang berjalan.
- Daftar toko.
- Jumlah barang.
- Uang muka hari ini.
- Biaya yang sudah diinput.
- Biaya menunggu persetujuan.
- Ringkasan kontribusi bulan berjalan.

---

## 9. Manajemen Pelanggan

Customer tidak perlu memiliki akun pada MVP.

Data customer:

- Nama.
- Nomor WhatsApp.
- Email opsional.
- Jenis customer.
- Alamat.
- Kecamatan.
- Kota.
- Patokan alamat.
- Status.
- Catatan.
- Tanggal pertama transaksi.

Jenis customer:

- Individu.
- Pemilik usaha.
- Reseller.

Nomor WhatsApp menjadi identitas utama untuk mencegah duplikasi.

Halaman detail customer menampilkan:

- Riwayat pesanan.
- Total transaksi.
- Total harga barang.
- Total jasa.
- Pembayaran belum selesai.
- Alamat terakhir.
- Catatan kendala.

---

## 10. Manajemen Pesanan

### 10.1 Data Pesanan

Setiap pesanan memiliki:

- Nomor tracking.
- Jenis layanan.
- Cabang asal.
- Cabang tujuan.
- Customer pengirim.
- Customer penerima.
- Metode penerimaan.
- Alamat tujuan.
- Status pesanan.
- Status pembayaran.
- Batch.
- Petugas utama.
- Biaya jasa.
- Biaya tambahan.
- Total pembayaran.
- Catatan internal.

Contoh nomor tracking:

`YKT-2607-00125`

### 10.2 Data Item Barang

Setiap item memiliki:

- Nama barang.
- Jumlah.
- Harga perkiraan.
- Harga aktual.
- Toko.
- Tautan produk.
- Foto referensi.
- Warna.
- Ukuran.
- Berat opsional.
- Catatan.
- Status item.

### 10.3 Status Pesanan

- Pesanan dicatat.
- Menunggu pembayaran.
- Pembayaran diterima.
- Menunggu diproses di kota asal.
- Sedang dibeli atau diambil.
- Barang diterima di titik asal.
- Menunggu keberangkatan.
- Dalam perjalanan.
- Tiba di kota tujuan.
- Siap diambil atau diserahkan.
- Selesai.
- Bermasalah.
- Dibatalkan.

### 10.4 Riwayat Status

Setiap perubahan status menyimpan:

- Status.
- Deskripsi publik.
- Catatan internal.
- Lokasi.
- Pengguna yang mengubah.
- Tanggal dan waktu.

---

## 11. Manajemen Tugas Petugas

Tugas dikelompokkan berdasarkan:

- Tanggal.
- Cabang.
- Area.
- Toko.
- Batch.
- Petugas.

Data tugas:

- Nomor tugas.
- Petugas.
- Area.
- Daftar toko.
- Daftar item.
- Anggaran belanja.
- Anggaran operasional.
- Waktu mulai.
- Waktu selesai.
- Status.
- Catatan.

Status tugas:

- Draft.
- Ditugaskan.
- Dimulai.
- Sedang dikerjakan.
- Menunggu konfirmasi.
- Selesai.
- Bermasalah.
- Dibatalkan.

Aksi petugas:

- Mulai tugas.
- Tiba di toko.
- Barang tersedia.
- Barang tidak tersedia.
- Harga berbeda.
- Upload foto.
- Upload nota.
- Barang berhasil dibeli.
- Barang berhasil diambil.
- Selesaikan tugas.

Jika harga aktual melebihi anggaran, status item berubah menjadi menunggu konfirmasi admin.

---

## 12. Serah Terima Antar-Cabang

### 12.1 Saat Keberangkatan

Petugas asal:

- Melakukan checklist paket.
- Memastikan nomor tracking.
- Mengunggah foto kumpulan barang.
- Mengonfirmasi jumlah paket.
- Mengonfirmasi keberangkatan.

### 12.2 Saat Tiba

Petugas tujuan:

- Melakukan checklist paket.
- Membandingkan jumlah dikirim dan diterima.
- Mengunggah foto penerimaan.
- Mencatat kerusakan atau kekurangan.
- Mengonfirmasi waktu tiba.

Data handover:

- Batch.
- Jenis handover.
- Petugas.
- Jumlah paket.
- Foto.
- Catatan.
- Waktu konfirmasi.

Jenis handover:

- Keberangkatan.
- Kedatangan.

---

## 13. Pembayaran Pelanggan

Pembayaran dicatat manual oleh admin.

Data pembayaran:

- Pesanan.
- Nominal.
- Metode pembayaran.
- Tanggal pembayaran.
- Bukti pembayaran.
- Status.
- Diverifikasi oleh.
- Waktu verifikasi.

Status pembayaran:

- Belum dibayar.
- Dibayar sebagian.
- Lunas.
- Dikembalikan.
- Dibatalkan.

Pemisahan nilai wajib:

```text
Harga barang pelanggan
+ Pendapatan jasa
+ Biaya tambahan
= Total pembayaran customer
```

Harga barang pelanggan bukan pendapatan Yukatitip.

---

## 14. Manajemen Karyawan

### 14.1 Data Karyawan

- Nomor karyawan.
- Nama.
- Nomor WhatsApp.
- Email.
- Alamat.
- Cabang.
- Jabatan.
- Atasan langsung.
- Tanggal bergabung.
- Status hubungan kerja.
- Status aktif.
- Rekening bank.
- Akun aplikasi.
- Dokumen.
- Catatan.

Karyawan yang keluar dinonaktifkan, bukan dihapus.

### 14.2 Riwayat Penempatan

Sistem menyimpan riwayat:

- Cabang.
- Jabatan.
- Tanggal mulai.
- Tanggal berakhir.

### 14.3 Jabatan

Jabatan minimal:

- Owner.
- Kepala cabang.
- Admin cabang.
- Petugas lapangan.
- Petugas tujuan.

---

## 15. Kompensasi Petugas Lapangan

Struktur penghasilan petugas:

```text
Gaji pokok
+ tunjangan kendaraan
+ tunjangan pulsa/internet
+ komisi bulanan
= penghasilan kotor
```

Petugas tidak memiliki tunjangan tetap umum.

### 15.1 Tunjangan Kendaraan

Tunjangan kendaraan dibayar melalui payroll untuk membantu menanggung:

- Penggunaan kendaraan pribadi.
- Penyusutan.
- Perawatan rutin.
- Oli.
- Ban.
- Komponen kendaraan.

Tunjangan kendaraan tidak menggantikan:

- BBM tugas.
- Parkir.
- Tol.
- Uang makan tugas.

### 15.2 Tunjangan Pulsa/Internet

Tunjangan pulsa/internet dibayar bulanan untuk:

- Komunikasi dengan admin, toko, dan customer.
- Menggunakan peta.
- Mengunggah foto.
- Mengunggah nota.
- Memperbarui status melalui web app.

---

## 16. Biaya Operasional Harian Petugas

Biaya operasional diberikan ketika petugas menjalankan tugas.

Kategori:

- BBM.
- Uang makan.
- Parkir.
- Tol.
- Transportasi tambahan.
- Biaya angkut.
- Biaya masuk lokasi.
- Pengemasan.
- Biaya lain yang disetujui.

Biaya operasional:

- Bukan tunjangan.
- Bukan penghasilan.
- Tidak mengurangi gaji pokok.
- Mengurangi dasar perhitungan komisi.
- Harus terhubung ke petugas, tugas, tanggal, dan cabang.

### 16.1 Uang Muka Harian

Sebelum bertugas, petugas dapat menerima uang muka berdasarkan anggaran harian.

Data uang muka:

- Petugas.
- Cabang.
- Tanggal.
- Tugas.
- Batch.
- Nominal.
- Status.
- Waktu pencairan.
- Waktu penyelesaian.

Status:

- Diajukan.
- Disetujui.
- Dicairkan.
- Sedang digunakan.
- Menunggu pertanggungjawaban.
- Selesai.
- Terlambat.

### 16.2 Pertanggungjawaban

Setelah tugas:

1. Petugas mencatat biaya aktual.
2. Petugas mengunggah bukti bila tersedia.
3. Petugas mengirim klaim.
4. Kepala cabang atau owner memverifikasi.
5. Sistem menghitung selisih uang muka.
6. Sisa dikembalikan atau kekurangan diganti.

Contoh:

```text
Uang muka: Rp300.000
Biaya disetujui: Rp260.000
Sisa: Rp40.000
```

Atau:

```text
Uang muka: Rp300.000
Biaya disetujui: Rp340.000
Kekurangan: Rp40.000
```

### 16.3 Status Pengeluaran

- Draft.
- Diajukan.
- Menunggu verifikasi.
- Disetujui.
- Ditolak.
- Sudah diperhitungkan.

Hanya biaya disetujui yang mengurangi dasar komisi.

---

## 17. Komisi Petugas

Komisi dihitung dari kontribusi bersih tugas selama satu periode bulanan.

### 17.1 Revenue Petugas

Revenue yang dapat dialokasikan:

- Jasa titip beli.
- Jasa titip ambil.
- Jasa titip kirim.
- Biaya pengantaran.
- Biaya penanganan.
- Biaya toko tambahan.
- Pendapatan jasa lain yang terkait tugas.

Revenue tidak termasuk:

- Harga barang.
- Dana pembelian customer.
- Deposit yang dikembalikan.
- Pembayaran pihak ketiga.
- Pesanan batal.
- Pesanan belum dibayar.

### 17.2 Rumus Komisi

```text
Total revenue jasa dari tugas petugas
- total biaya operasional disetujui
= kontribusi bersih petugas
```

```text
MAX(0, kontribusi bersih)
× persentase komisi
= komisi bulanan
```

Jika kontribusi bersih negatif, dasar komisi menjadi nol. Selisih tidak otomatis mengurangi gaji pokok. Komisi dibulatkan matematis ke rupiah terdekat oleh database, dan nilai final disimpan dari database.

### 17.3 Contoh

```text
Revenue jasa: Rp7.000.000
Biaya operasional: Rp2.000.000
Kontribusi bersih: Rp5.000.000
Komisi: 20%
Komisi bulanan: Rp1.000.000
```

Persentase komisi ditetapkan melalui pengaturan dan memiliki tanggal efektif.

### 17.4 Penutupan Komisi

Alur:

1. Periode komisi dibuat.
2. Sistem mengambil tugas selesai dan dibayar.
3. Revenue dijumlahkan.
4. Biaya operasional disetujui dijumlahkan.
5. Kontribusi bersih dihitung.
6. Komisi dihitung.
7. Kepala cabang memeriksa.
8. Owner menyetujui.
9. Komisi masuk payroll.
10. Periode dikunci.

---

## 18. Payroll Sederhana

Payroll MVP berfungsi untuk pencatatan dan persetujuan, bukan transfer otomatis.

Komponen petugas:

- Gaji pokok.
- Tunjangan kendaraan.
- Tunjangan pulsa/internet.
- Komisi.
- Potongan yang sah.

Rumus:

```text
Gaji pokok
+ tunjangan kendaraan
+ tunjangan pulsa/internet
+ komisi
- potongan
= total dibayar
```

Status payroll:

- Draft.
- Dihitung.
- Menunggu persetujuan.
- Disetujui.
- Sudah dibayar.
- Dikunci.

---

## 19. Biaya Operasional Cabang

Biaya cabang dipisahkan dari biaya tugas petugas.

Kategori:

- Sewa ruko.
- Listrik.
- Air.
- Wi-Fi atau internet.
- Kebersihan.
- Keamanan.
- ATK.
- Perlengkapan.
- Perawatan.
- Telepon cabang.
- Biaya administrasi.
- Biaya kantor lain.

Data biaya cabang:

- Cabang.
- Kategori.
- Vendor.
- Nominal.
- Periode.
- Tanggal tagihan.
- Jatuh tempo.
- Status pembayaran.
- Bukti.
- Dibuat oleh.
- Disetujui oleh.
- Catatan.

Status:

- Draft.
- Menunggu persetujuan.
- Disetujui.
- Sudah dibayar.
- Ditolak.
- Dibatalkan.

### 19.1 Sewa Tahunan

Sistem menyimpan:

- Nilai kontrak.
- Tanggal mulai.
- Tanggal berakhir.
- Tanggal pembayaran.
- Dokumen kontrak.
- Alokasi bulanan.

Contoh:

```text
Sewa tahunan: Rp24.000.000
Alokasi bulanan: Rp2.000.000
```

Laporan kas menampilkan pembayaran aktual.  
Laporan kinerja cabang menampilkan alokasi bulanan.

### 19.2 Anggaran Cabang

Setiap cabang dapat memiliki anggaran per kategori.

Sistem membandingkan:

- Anggaran.
- Realisasi.
- Selisih.
- Persentase penggunaan.

---

## 20. Kas Kecil Cabang

Kas kecil digunakan untuk biaya ringan.

Data:

- Cabang.
- Jenis transaksi.
- Kategori.
- Nominal.
- Petugas.
- Deskripsi.
- Bukti.
- Tanggal.
- Saldo setelah transaksi.

Jenis transaksi:

- Dana masuk.
- Dana keluar.
- Pengembalian uang muka.
- Penyesuaian.

Kas kecil direkonsiliasi secara berkala antara saldo sistem dan saldo fisik.

---

## 21. Laporan

### 21.1 Laporan Pesanan

- Jumlah pesanan.
- Pesanan per status.
- Pesanan per cabang.
- Pesanan per rute.
- Pesanan bermasalah.
- Pesanan dibatalkan.

### 21.2 Laporan Pendapatan Jasa

- Pendapatan jasa per periode.
- Pendapatan jasa per cabang.
- Pendapatan jasa per rute.
- Pendapatan jasa per batch.
- Pendapatan jasa per petugas.

### 21.3 Laporan Biaya Petugas

- BBM.
- Uang makan.
- Parkir.
- Tol.
- Pengeluaran tanpa bukti.
- Pengeluaran ditolak.
- Uang muka belum selesai.
- Biaya per tugas.
- Biaya per batch.
- Biaya per petugas.

### 21.4 Laporan Komisi

- Revenue petugas.
- Biaya operasional.
- Kontribusi bersih.
- Persentase komisi.
- Komisi bulanan.
- Status persetujuan.
- Status masuk payroll.

### 21.5 Laporan Cabang

Rumus:

```text
Pendapatan jasa cabang
- biaya langsung tugas
= kontribusi operasional
```

```text
Kontribusi operasional
- gaji dan benefit
- sewa
- listrik
- air
- internet
- biaya kantor
= hasil operasional cabang
```

### 21.6 Laporan Batch

- Jumlah pesanan.
- Jumlah paket.
- Pendapatan jasa.
- Biaya perjalanan.
- Biaya petugas.
- Kontribusi batch.
- Selisih paket.
- Kendala.

---

## 22. Landing Page dan Tracking

### 22.1 Halaman Publik

Rute:

- `/`
- `/cara-kerja`
- `/tarif`
- `/jadwal`
- `/track`
- `/track/[trackingNumber]`

### 22.2 Form Tracking

Pelanggan memasukkan:

- Nomor tracking.
- Verifikasi sederhana, misalnya empat digit terakhir nomor WhatsApp.

### 22.3 Data Tracking Publik

Boleh ditampilkan:

- Nomor tracking.
- Kota asal.
- Kota tujuan.
- Jenis layanan.
- Status umum.
- Timeline publik.
- Jadwal batch.
- Titik pengambilan.
- Kontak admin.

Tidak boleh ditampilkan:

- Nomor WhatsApp lengkap.
- Alamat lengkap.
- Bukti pembayaran.
- Nota.
- Catatan internal.
- Harga modal.
- Komisi.
- Identitas petugas secara rinci.
- Data keuangan internal.

---

## 23. Arsitektur Teknologi

### 23.1 Frontend

- SvelteKit.
- TypeScript.
- Tailwind CSS.
- Responsive web design.

### 23.2 Cloudflare

#### Cloudflare Pages

Digunakan untuk:

- Landing page.
- Web app.
- Halaman tracking.
- Aset frontend.

#### Pages Functions / Workers

Digunakan untuk:

- API.
- Business logic.
- Nomor tracking.
- Validasi role.
- Validasi cabang.
- Perhitungan tarif.
- Perhitungan komisi.
- Tracking publik.
- Upload authorization.
- Audit log.
- Rate limiting.
- Integrasi database dan storage.

#### Cloudflare R2

Digunakan untuk:

- Foto barang.
- Nota.
- Bukti pembayaran.
- Bukti pengeluaran.
- Foto serah terima.
- Dokumen kontrak sewa.
- Dokumen karyawan.

Database hanya menyimpan object key dan metadata file.

#### Cloudflare Turnstile

Digunakan pada:

- Form tracking.
- Form kontak.
- Login.
- Endpoint publik yang membutuhkan perlindungan.

#### Cloudflare KV

Digunakan untuk cache data non-transaksional:

- Tarif publik.
- Jadwal.
- Konfigurasi tampilan.
- FAQ.
- Label status.

KV tidak digunakan sebagai sumber utama transaksi.

### 23.3 Supabase

#### Supabase PostgreSQL

Digunakan sebagai database utama.

#### Supabase Auth

Digunakan untuk login pengguna internal.

#### Supabase RLS

Digunakan untuk membatasi data berdasarkan:

- User.
- Role.
- Cabang.
- Penugasan.

#### Supabase Realtime

Opsional untuk memperbarui dashboard dan status tanpa reload penuh.

---

## 24. Keamanan

- Semua tabel sensitif menggunakan Row Level Security.
- Service role key hanya digunakan di Workers.
- Publishable key tidak memberikan akses tanpa kebijakan RLS.
- Bucket R2 private untuk dokumen sensitif.
- Akses file menggunakan URL sementara.
- Form publik dilindungi Turnstile.
- Endpoint penting menggunakan rate limiting.
- Password dikelola melalui Supabase Auth.
- Perubahan keuangan menyimpan audit log.
- Data payroll hanya dapat dilihat oleh role berwenang.
- Kepala cabang tidak dapat menyetujui klaimnya sendiri.
- Data yang sudah masuk payroll terkunci.
- Tracking publik hanya mengembalikan data yang disanitasi.

---

## 25. Struktur Data Utama

### 25.1 Organisasi

- `branches`
- `routes`
- `profiles`
- `roles`
- `permissions`
- `role_permissions`

### 25.2 Karyawan

- `employees`
- `positions`
- `employee_assignments`
- `employee_compensations`

### 25.3 Customer dan Pesanan

- `customers`
- `orders`
- `order_items`
- `stores`
- `tracking_events`
- `payments`
- `attachments`

### 25.4 Perjalanan

- `trips`
- `trip_orders`
- `trip_handovers`
- `staff_tasks`
- `task_items`

### 25.5 Biaya Petugas

- `daily_operational_advances`
- `daily_operational_expenses`
- `expense_claims`
- `expense_claim_items`

### 25.6 Komisi dan Payroll

- `staff_task_revenues`
- `commission_periods`
- `employee_commissions`
- `payroll_periods`
- `payroll_items`

### 25.7 Biaya Cabang

- `branch_expenses`
- `branch_budgets`
- `branch_rent_contracts`
- `petty_cash_transactions`

### 25.8 Audit

- `audit_logs`

---

## 26. Aturan Bisnis Utama

1. Satu pesanan memiliki satu kota asal dan satu kota tujuan.
2. Satu pesanan masuk ke satu batch langsung.
3. Batch harus menggunakan rute yang sesuai dengan pesanan.
4. Nomor tracking harus unik.
5. Nomor WhatsApp customer digunakan untuk mencegah duplikasi.
6. Harga barang customer tidak dihitung sebagai revenue.
7. Revenue petugas hanya berasal dari komponen jasa.
8. Biaya operasional hanya mengurangi komisi setelah disetujui.
9. Gaji pokok tidak dikurangi biaya operasional perusahaan.
10. Komisi negatif dibatasi menjadi nol.
11. Biaya tetap cabang tidak mengurangi kontribusi individual petugas.
12. Tunjangan kendaraan berbeda dari BBM.
13. Tunjangan pulsa/internet berbeda dari biaya operasional.
14. Petugas tidak dapat menyetujui pengeluarannya sendiri.
15. Kepala cabang tidak dapat menyetujui klaim atau bonusnya sendiri.
16. Data keuangan yang sudah dikunci tidak dapat diedit tanpa koreksi terotorisasi.
17. Akun karyawan nonaktif tidak dihapus.
18. Semua perubahan status menyimpan waktu dan pengguna.
19. Semua file sensitif disimpan private.
20. Tracking publik tidak membuka data internal.

---

## 27. Acceptance Criteria MVP

### 27.1 Cabang dan Rute

- Owner dapat membuat cabang.
- Owner dapat membuat rute dua arah.
- Admin hanya melihat cabang sesuai akses.
- Rute tidak dapat aktif tanpa cabang asal dan tujuan.

### 27.2 Pesanan

- Admin dapat membuat customer dan pesanan.
- Sistem membuat nomor tracking unik.
- Pesanan memiliki origin dan destination.
- Pesanan dapat memiliki beberapa item.
- Pesanan dapat dimasukkan ke batch yang sesuai.
- Timeline berubah ketika status diperbarui.

### 27.3 Tracking

- Pelanggan dapat membuka tracking tanpa login.
- Sistem memvalidasi tracking dan nomor WhatsApp.
- Data internal tidak muncul.
- Timeline tampil dari terbaru ke terlama.

### 27.4 Tugas Petugas

- Kepala cabang dapat memberikan tugas.
- Petugas hanya melihat tugasnya.
- Petugas dapat mengunggah foto dan nota.
- Harga berbeda dapat dikirim untuk konfirmasi.
- Tugas selesai menghasilkan data revenue bila memenuhi aturan.

### 27.5 Biaya Operasional

- Uang muka dapat dicatat.
- Petugas dapat memasukkan BBM, makan, parkir, dan tol.
- Bukti dapat diunggah.
- Kepala cabang dapat memverifikasi sesuai kewenangan.
- Sistem menghitung sisa atau kekurangan uang muka.

### 27.6 Komisi

- Sistem menjumlahkan revenue tugas per petugas.
- Sistem hanya mengambil biaya berstatus disetujui.
- Sistem menghitung kontribusi bersih.
- Sistem menghitung komisi berdasarkan rate efektif.
- Komisi dapat dimasukkan ke payroll.
- Periode dapat dikunci.

### 27.7 Biaya Cabang

- Tagihan listrik, air, dan internet dapat dicatat.
- Sewa tahunan memiliki alokasi bulanan.
- Anggaran dapat dibandingkan dengan realisasi.
- Bukti pembayaran dapat disimpan.
- Laporan cabang memisahkan biaya tetap dan biaya langsung.

---

## 28. Prioritas Implementasi

### Prioritas 1 — Operasional Inti

- Login.
- Role dan cabang.
- Customer.
- Pesanan.
- Item barang.
- Tracking.
- Status.
- Rute.
- Batch.
- Handover.

### Prioritas 2 — Petugas dan Biaya

- Data karyawan.
- Penugasan.
- Uang muka.
- Biaya harian.
- Upload bukti.
- Verifikasi.
- Penyelesaian uang muka.

### Prioritas 3 — Komisi dan Cabang

- Revenue petugas.
- Periode komisi.
- Perhitungan komisi.
- Payroll sederhana.
- Biaya cabang.
- Sewa.
- Anggaran.
- Kas kecil.

### Prioritas 4 — Laporan

- Laporan batch.
- Laporan petugas.
- Laporan komisi.
- Laporan cabang.
- Laporan hasil operasional.

---

## 29. Keputusan Produk Final

Yukatitip dibangun sebagai:

> **Web app operasional jasa titip antar-kota dengan cabang, rute, batch, tracking, pengelolaan karyawan, biaya operasional, dan komisi petugas.**

Implementasi awal berfokus pada:

- Makassar.
- Pinrang.
- Rute Makassar → Pinrang.
- Rute Pinrang → Makassar.

Cabang Parepare dapat ditambahkan melalui modul cabang dan rute ketika operasionalnya siap.

Produk tetap berupa satu web app dan satu landing page tracking yang digunakan seluruh cabang.

---

## 30. Ringkasan Formula Keuangan

### Revenue Yukatitip

```text
Revenue Yukatitip
= jasa titip
+ jasa pengantaran
+ biaya penanganan
+ pendapatan jasa lainnya
```

### Kontribusi Petugas

```text
Kontribusi bersih petugas
= revenue jasa tugas petugas
- biaya operasional disetujui
```

### Komisi Petugas

```text
Komisi
= MAX(0, kontribusi bersih)
× persentase komisi
```

### Payroll Petugas

```text
Total payroll
= gaji pokok
+ tunjangan kendaraan
+ tunjangan pulsa/internet
+ komisi
- potongan
```

### Hasil Operasional Cabang

```text
Hasil operasional cabang
= pendapatan jasa
- biaya langsung tugas
- gaji dan benefit
- alokasi sewa
- listrik
- air
- internet
- biaya kantor
```
