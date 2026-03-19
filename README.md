# 🌿 KiTani — Marketplace Pertanian Digital

**KiTani** adalah platform marketplace yang dirancang untuk menghubungkan petani lokal secara langsung dengan pembeli. Platform ini bertujuan untuk menciptakan ekosistem pertanian yang lebih adil, transparan, dan efisien melalui teknologi digital.

---

## 🚀 Teknologi Utama

Proyek ini dikembangkan menggunakan stack teknologi modern untuk memastikan performa dan skalabilitas:
* **Framework**: [Next.js 16.1.7 (App Router)](https://nextjs.org/).
* **Bahasa**: [TypeScript 5](https://www.typescriptlang.org/).
* **Backend & Database**: [Supabase](https://supabase.com/) dengan dukungan SSR.
* **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) dan [Lucide React](https://lucide.dev/) untuk ikon.
* **Animasi**: [Framer Motion 12](https://www.framer.com/motion/).
* **Payment Gateway**: [Midtrans](https://midtrans.com/).

---

## 🛠️ Fitur Utama
### 1. Manajemen Role Pengguna
Sistem mendukung tiga jenis role utama dengan hak akses yang berbeda:

Pembeli: Mencari produk, mengelola keranjang, dan melakukan pembelian.

Petani: Mengelola profil pertanian dan produk yang dijual.

Admin: Melakukan verifikasi terhadap akun petani dan memantau platform.

### 2. Alur Transaksi & Pembayaran
Status Pesanan: Mendukung pelacakan dari pending, paid, processing, shipped, hingga done.

Integrasi Pembayaran: Menggunakan Midtrans untuk menangani status pembayaran seperti paid, failed, atau refunded.

### 3. Verifikasi Keamanan
Setiap petani diwajibkan mengunggah dokumen identitas (KTP) dan sertifikat pertanian untuk diverifikasi oleh admin sebelum dapat mulai berjualan di platform.

## 📊 Data Flow Diagram (DFD)
### DFD Level 0 (Context Diagram)
Diagram ini menggambarkan aliran data antara sistem KiTani dengan entitas eksternal:

Pembeli: Mengirim data pesanan dan menerima informasi produk serta status transaksi.

Petani: Mengirim data produk dan dokumen legalitas; menerima pemberitahuan pesanan.

Admin: Melakukan validasi data dan menerima laporan aktivitas platform.

Midtrans: Menerima instruksi pembayaran dan mengirimkan status pelunasan transaksi.

FOTOOO

## DFD Level 1 (Diagram Dekomposisi)
Proses internal dibagi menjadi modul-modul berikut:

Manajemen Pengguna: Proses pendaftaran dan autentikasi menggunakan Supabase Auth.

Modul Verifikasi: Alur peninjauan dokumen petani oleh admin.

Katalog & Inventaris: Manajemen produk oleh petani (stok, harga, kategori).

Transaksi & Checkout: Pemrosesan keranjang belanja hingga pembuatan pesanan.

Gateway Pembayaran: Sinkronisasi status pembayaran dengan API Midtrans.

Notifikasi: Pengiriman pesan sistem kepada pengguna berdasarkan aktivitas (order, promo, dll).

[!IMPORTANT]
[TEMPATKAN FOTO DFD LEVEL 1 DI SINI]

## 🚦 Cara Penggunaan
Instalasi Dependensi:

### Bash
npm install
Konfigurasi Environment:
Siapkan environment variable untuk Supabase dan Midtrans di file .env.

Menjalankan Server Lokal:

### Bash
npm run dev
Buka http://localhost:3000/login untuk memulai pengujian.

Build untuk Produksi:

Bash
npm run build
npm run start
© 2026 KiTani.