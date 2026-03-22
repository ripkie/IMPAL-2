import Link from 'next/link'
import { Sprout, ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div
      style={{
        fontFamily: 'DM Sans, sans-serif',
        background: '#F4FAF3',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <Sprout size={24} color="#71BC68" />
        <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 20 }}>
          <span style={{ color: '#71BC68' }}>Ki</span>
          <span style={{ color: '#0A4C3E' }}>Tani</span>
        </span>
      </div>

      {/* 404 text */}
      <p
        style={{
          fontFamily: 'Sora, sans-serif',
          fontSize: 96,
          fontWeight: 700,
          color: '#0A4C3E',
          lineHeight: 1,
          margin: 0,
          opacity: 0.12,
        }}
      >
        404
      </p>

      <div className="text-center mt-4 mb-8">
        <h1
          className="text-xl font-bold mb-2"
          style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}
        >
          Halaman tidak ditemukan
        </h1>
        <p className="text-sm" style={{ color: '#6B7C6A', maxWidth: 300, lineHeight: 1.6 }}>
          Halaman yang kamu cari tidak ada atau sedang dalam pengembangan.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/home"
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition hover:opacity-90"
          style={{ background: '#0A4C3E', color: '#71BC68' }}
        >
          <ArrowLeft size={16} /> Kembali ke Beranda
        </Link>
        <Link
          href="/produk"
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition hover:opacity-90"
          style={{ background: 'white', color: '#0A4C3E', border: '1px solid rgba(10,76,62,0.15)' }}
        >
          <Search size={16} /> Cari Produk
        </Link>
      </div>
    </div>
  )
}
