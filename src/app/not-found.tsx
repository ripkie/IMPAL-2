import Link from 'next/link'
import { Sprout, ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="relative min-h-screen overflow-hidden font-['DM_Sans']"
      style={{ background: '#FBFEFA' }}>

      {/* Background — sama persis dengan login */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,#E8F7E5_0%,transparent_28%),radial-gradient(circle_at_85%_30%,#EAF7E7_0%,transparent_26%),linear-gradient(120deg,#FFFFFF_0%,#F4FAF3_50%,#FFFFFF_100%)]" />

      {/* Dekoratif daun — sama dengan login */}
      <span className="pointer-events-none absolute left-[8%] top-[20%] hidden h-8 w-14 rotate-[-18deg] rounded-[100%_0] bg-[#71BC68]/45 blur-[1px] lg:block" />
      <span className="pointer-events-none absolute right-[7%] top-[22%] hidden h-8 w-14 rotate-[-25deg] rounded-[100%_0] bg-[#71BC68]/40 blur-[1px] lg:block" />
      <span className="pointer-events-none absolute right-[11%] bottom-[18%] hidden h-7 w-12 rotate-[-25deg] rounded-[100%_0] bg-[#71BC68]/35 blur-[1px] lg:block" />
      <span className="pointer-events-none absolute left-[12%] bottom-[25%] hidden h-10 w-16 rotate-[35deg] rounded-[100%_0] bg-[#71BC68]/25 blur-[3px] lg:block" />

      {/* Angka 404 dekoratif di background */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span style={{
          fontFamily: 'Sora, sans-serif',
          fontSize: 'clamp(160px, 30vw, 320px)',
          fontWeight: 800,
          color: '#0A4C3E',
          opacity: 0.04,
          lineHeight: 1,
          userSelect: 'none',
          letterSpacing: '-8px',
        }}>
          404
        </span>
      </div>

      {/* Konten utama */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">

        {/* Logo */}
        <div className="mb-10 flex items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-[0_8px_24px_rgba(10,76,62,0.12)]"
            style={{ background: 'white' }}>
            <Sprout size={24} color="#71BC68" />
          </div>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '22px', letterSpacing: '-0.5px' }}>
            <span style={{ color: '#71BC68' }}>Ki</span>
            <span style={{ color: '#0A4C3E' }}>Tani</span>
          </span>
        </div>

        {/* Ilustrasi SVG */}
        <div className="mb-8">
          <svg width="180" height="160" viewBox="0 0 180 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Tanah */}
            <ellipse cx="90" cy="148" rx="70" ry="10" fill="#D4EDDA" opacity="0.6" />

            {/* Pot */}
            <path d="M65 120 L70 148 H110 L115 120 Z" fill="#A0522D" opacity="0.7" />
            <rect x="60" y="112" width="60" height="12" rx="6" fill="#8B4513" opacity="0.7" />

            {/* Tanaman utama */}
            <path d="M90 112 C90 90 90 72 90 55" stroke="#71BC68" strokeWidth="3" strokeLinecap="round" />
            {/* Daun kiri */}
            <path d="M90 85 C78 78 65 80 60 68 C72 65 82 70 90 85Z" fill="#71BC68" opacity="0.9" />
            {/* Daun kanan */}
            <path d="M90 72 C102 65 115 67 120 55 C108 52 98 57 90 72Z" fill="#0A4C3E" opacity="0.85" />
            {/* Daun tengah kiri */}
            <path d="M90 95 C80 88 68 91 64 80 C75 77 85 82 90 95Z" fill="#9BD982" opacity="0.8" />

            {/* Tanda tanya di atas tanaman */}
            <circle cx="90" cy="36" r="18" fill="#0A4C3E" opacity="0.08" />
            <text x="90" y="42" textAnchor="middle" fontFamily="Sora, sans-serif"
              fontSize="22" fontWeight="800" fill="#0A4C3E" opacity="0.55">?</text>

            {/* Bintang kecil dekoratif */}
            <circle cx="42" cy="55" r="3" fill="#71BC68" opacity="0.5" />
            <circle cx="140" cy="70" r="2" fill="#71BC68" opacity="0.4" />
            <circle cx="148" cy="45" r="4" fill="#0A4C3E" opacity="0.1" />
            <circle cx="35" cy="85" r="2.5" fill="#0A4C3E" opacity="0.12" />
          </svg>
        </div>

        {/* Card konten */}
        <div className="w-full max-w-sm rounded-[28px] px-8 py-8 shadow-[0_20px_60px_rgba(10,76,62,0.1)]"
          style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(10,76,62,0.08)', backdropFilter: 'blur(8px)' }}>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4 text-xs font-bold"
            style={{ background: '#FFF3CD', color: '#856404' }}>
            Ups, halaman nyasar! 🌿
          </div>

          <h1 className="text-2xl font-extrabold mb-2"
            style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif', letterSpacing: '-0.5px' }}>
            Halaman Tidak Ditemukan
          </h1>

          <p className="text-sm leading-relaxed mb-7" style={{ color: '#6B7C6A' }}>
            Sepertinya halaman yang kamu cari sudah dipindah, dihapus, atau memang tidak pernah ada.
          </p>

          <div className="flex flex-col gap-2.5">
            <Link href="/home"
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(10,76,62,0.2)] active:translate-y-0"
              style={{ background: 'linear-gradient(135deg, #0A4C3E, #0C6A52)', color: '#71BC68' }}>
              <ArrowLeft size={15} /> Kembali ke Beranda
            </Link>
            <Link href="/produk"
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition hover:bg-[#F4FAF3]"
              style={{ background: 'white', color: '#0A4C3E', border: '1.5px solid rgba(10,76,62,0.15)' }}>
              <Search size={15} /> Jelajahi Produk
            </Link>
          </div>
        </div>

        <p className="mt-8 text-xs" style={{ color: '#B0BAB8' }}>
          © 2025 KiTani · Sayuran segar langsung dari petani
        </p>
      </div>
    </main>
  )
}