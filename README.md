# 🌿 KiTani - Marketplace Pertanian Digital

**KiTani** adalah platform marketplace yang dirancang untuk menghubungkan petani lokal secara langsung dengan pembeli. Platform ini bertujuan menciptakan ekosistem pertanian yang lebih **adil, transparan, dan efisien** melalui pemanfaatan teknologi digital.

---

## 🚀 Teknologi Utama

Proyek ini dibangun menggunakan teknologi modern untuk memastikan performa, skalabilitas, dan maintainability:

- **Framework**: [Next.js 16.1.7 (App Router)](https://nextjs.org/)
- **Bahasa**: [TypeScript 5](https://www.typescriptlang.org/)
- **Backend & Database**: [Supabase](https://supabase.com/) (SSR Support)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animasi**: [Framer Motion](https://www.framer.com/motion/)
- **Payment Gateway**: [Midtrans](https://midtrans.com/)

---

## 🛠️ Fitur Utama

### 👥 Manajemen Role Pengguna

Sistem mendukung tiga jenis role utama:

- **Pembeli**
  - Mencari produk
  - Mengelola keranjang
  - Melakukan pembelian

- **Petani**
  - Mengelola profil pertanian
  - Mengelola produk

- **Admin**
  - Verifikasi akun petani
  - Monitoring aktivitas platform

---

### 💳 Alur Transaksi & Pembayaran

- **Status Pesanan**
pending → paid → processing → shipped → done

- **Integrasi Midtrans**
- paid
- failed
- refunded

---

### 🔐 Verifikasi Keamanan

Untuk menjaga kepercayaan platform:

- Petani wajib mengunggah:
- KTP
- Sertifikat pertanian
- Admin akan melakukan verifikasi sebelum petani dapat berjualan

---

## 📊 Data Flow Diagram (DFD)

### 🔹 DFD Level 0 (Context Diagram)

- **Pembeli**
- Mengirim data pesanan
- Menerima informasi produk & status transaksi

- **Petani**
- Mengirim data produk & dokumen legalitas
- Menerima notifikasi pesanan

- **Admin**
- Validasi data
- Monitoring aktivitas platform

- **Midtrans**
- Menerima instruksi pembayaran
- Mengirim status transaksi


---

### 🔹 DFD Level 1 (Diagram Dekomposisi)

- **Manajemen Pengguna**
  - Registrasi & autentikasi (Supabase Auth)

- **Modul Verifikasi**
  - Validasi dokumen petani oleh admin

- **Katalog & Inventaris**
  - Manajemen produk (stok, harga, kategori)

- **Transaksi & Checkout**
  - Proses keranjang hingga order

- **Gateway Pembayaran**
  - Sinkronisasi dengan Midtrans API

- **Notifikasi**
  - Notifikasi sistem (order, promo, dll)


---

## 🚦 Cara Menjalankan Project

### 1. Install Dependencies

```bash
npm install

### 2. Konfigurasi Environment

Buat file .env dan isi dengan:

Supabase URL & Key

Midtrans Server Key & Client Key

### Jalankan Server Lokal 
npm run dev

Buka:

http://localhost:3000/login
4. Build untuk Produksi
npm run build
npm run start
📌 Catatan

Pastikan environment variables sudah dikonfigurasi

Gunakan Midtrans sandbox untuk testing

© 2026 KiTani

All rights reserved.


Kalau mau next step, aku bisa:
- bikin versi README yang “wow” (dengan badge + preview UI + demo link)
- atau bantu bikin struktur repo biar kelihatan profesional di GitHub 👍
