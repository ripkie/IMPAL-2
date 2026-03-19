import Link from 'next/link'
import { Sprout, Clock, Bell } from 'lucide-react'

export default function MenungguVerifikasiPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4FAF3] px-4">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'linear-gradient(135deg, #0A4C3E, #0d6b55)' }}>
          <Sprout size={40} color="#71BC68" />
        </div>
        <h1 className="text-2xl font-bold text-[#0A4C3E] mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>
          Pendaftaran Diterima!
        </h1>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Akun petani kamu sedang dalam proses verifikasi oleh admin KiTani.
          Biasanya membutuhkan waktu <strong>1-2 hari kerja</strong>.
        </p>

        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center gap-3 p-4 rounded-2xl text-left"
            style={{ background: '#FFF3CD', border: '1px solid #FFEAA7' }}>
            <Clock size={18} color="#856404" className="shrink-0" />
            <p className="text-sm text-yellow-700">Proses verifikasi membutuhkan waktu 1-2 hari kerja</p>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-2xl text-left"
            style={{ background: '#D4EDDA', border: '1px solid #C3E6CB' }}>
            <Bell size={18} color="#155724" className="shrink-0" />
            <p className="text-sm text-green-700">Kamu akan mendapat notifikasi setelah akun disetujui</p>
          </div>
        </div>

        <Link href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
          style={{ background: '#0A4C3E', color: '#71BC68' }}>
          Kembali ke Login
        </Link>
      </div>
    </div>
  )
}
