# TOKOin - Aplikasi POS (Point of Sale) & Kasir Warung Pintar

**TOKOin** adalah aplikasi kasir modern (Point of Sale) yang dirancang khusus untuk operasional warung, toko kelontong, dan UMKM retail. Dibangun dengan performa cepat, antarmuka responsif (desktop & mobile smartphone), dan fitur manajemen lengkap.

---

## ✨ Fitur Utama

- 🛒 **Mesin Kasir (POS)**: Scan barcode / SKU, pencarian instan, kalkulasi kembalian otomatis, diskon belanja, cetak struk belanja, dan dukungan pembayaran Tunai & QRIS.
- 📊 **Dasbor Pemilik**: Statistik omset harian/bulanan, estimasi profit bersih, total transaksi, dan notifikasi stok menipis.
- 📦 **Produk & Kategori**: Manajemen produk, harga modal, harga jual, stok minimum, dan pengelolaan kategori.
- 🔄 **Stok & Mutasi**: Pencatatan mutasi stok otomatis (penjualan, restock, opname/penyesuaian stok).
- 🧾 **Riwayat Transaksi**: Detail riwayat transaksi, cetak ulang nota, serta pembatalan transaksi dengan pengembalian stok otomatis.
- 📈 **Laporan Penjualan**: Filter periode penjualan, laba kotor, dan ekspor/cetak laporan.
- 👥 **Kelola Kasir & Pengaturan Toko**: Manajemen hak akses kasir dan kustomisasi profil toko/struk.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router & Server Actions)
- **Database**: SQLite dengan Prisma ORM
- **Styling**: Tailwind CSS & Lucide Icons
- **Autentikasi**: JWT (Jose) & Bcrypt

---

## 🚀 Panduan Memulai

### 1. Kloning Repository
```bash
git clone https://github.com/RickNazmudin/TOKOin-POS.git
cd TOKOin-POS
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment
Salin file `.env.example` ke `.env`:
```bash
cp .env.example .env
```

### 4. Setup Database & Inisialisasi Data
Jalankan migrasi Prisma dan seed data awal:
```bash
npx prisma db push
npx prisma db seed
```

### 5. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka browser di `http://localhost:3000`.

---

## 🔑 Akun Default (Demo)

| Role | Username | Password | Akses |
| :--- | :--- | :--- | :--- |
| **Pemilik / Admin** | `admin` | `admin123` | Akses Penuh (Dasbor, Laporan, Stok, Kasir, Pengaturan) |
| **Kasir** | `kasir` | `kasir123` | Akses Kasir POS & Riwayat Transaksi Kasir |

---

## 📄 Lisensi
Didistribusikan di bawah lisensi MIT.
