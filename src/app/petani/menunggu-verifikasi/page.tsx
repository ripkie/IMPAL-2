import Link from 'next/link'

export default function MenungguVerifikasiPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4FAF3] px-4">
      <div className="w-full max-w-md text-center">
        <div className="text-6xl mb-6">🌾</div>
        <h1 className="text-2xl font-bold text-[#0A4C3E] mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>
          Pendaftaran Diterima!
        </h1>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Akun petani kamu sedang dalam proses verifikasi oleh admin KiTani.
          Biasanya membutuhkan waktu <strong>1-2 hari kerja</strong>.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 text-sm text-yellow-700 mb-6">
          Kamu akan mendapat notifikasi email setelah akun disetujui.
        </div>
        <Link
          href="/login"
          className="inline-block px-6 py-3 rounded-xl font-bold text-sm"
          style={{ background: '#0A4C3E', color: '#71BC68' }}
        >
          Kembali ke Login
        </Link>
      </div>
    </div>
  )
}
