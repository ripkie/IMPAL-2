import Link from 'next/link'
import { Bell, Clock, FileCheck2, ShieldCheck, Sprout } from 'lucide-react'

export default function MenungguVerifikasiPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F4FAF3] px-3 py-6 sm:px-4 sm:py-10" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-5xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[28px] sm:rounded-[36px] bg-white shadow-[0_24px_80px_rgba(10,76,62,0.14)] ring-1 ring-[#71BC68]/15 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative overflow-hidden bg-[#0A4C3E] p-8 text-white md:p-10">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#71BC68]/15" />
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-white/10 ring-1 ring-white/15">
                <Sprout size={34} color="#71BC68" />
              </div>
              <p className="mt-8 text-xs font-black uppercase tracking-[0.22em] text-[#B9E8B4]">KiTani Seller Center</p>
              <h1 className="mt-3 text-2xl font-black sm:text-3xl leading-tight md:text-4xl" style={{ fontFamily: 'Sora, sans-serif' }}>
                Pendaftaran petani berhasil dikirim.
              </h1>
              <p className="mt-4 text-sm leading-7 text-white/68">
                Akun kamu sedang dicek admin agar marketplace tetap aman, terpercaya, dan berisi petani yang valid.
              </p>
            </div>
          </div>

          <div className="p-6 md:p-10">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-[#FFF5D6] px-4 py-2 text-sm font-black text-[#8A5B00]">
              <Clock size={16} /> Menunggu Verifikasi
            </div>
            <h2 className="text-2xl font-black text-[#0A4C3E]" style={{ fontFamily: 'Sora, sans-serif' }}>Tahap berikutnya</h2>
            <p className="mt-2 text-sm leading-6 text-[#6B7C6A]">
              Biasanya proses verifikasi membutuhkan waktu <strong>1–2 hari kerja</strong>. Kamu akan mendapat notifikasi setelah akun disetujui.
            </p>

            <div className="mt-6 space-y-3">
              {[
                { icon: FileCheck2, title: 'Data masuk ke admin', desc: 'Admin akan memeriksa data profil dan informasi kebun.' },
                { icon: ShieldCheck, title: 'Verifikasi keamanan', desc: 'Akun diverifikasi agar pembeli lebih percaya.' },
                { icon: Bell, title: 'Notifikasi persetujuan', desc: 'Setelah disetujui, kamu bisa mulai mengelola produk.' },
              ].map(step => (
                <div key={step.title} className="flex gap-4 rounded-[24px] bg-[#F8FBF7] p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0A4C3E] shadow-sm"><step.icon size={20} /></div>
                  <div>
                    <p className="font-black text-[#0A4C3E]">{step.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[#6B7C6A]">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/login" className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-[#0A4C3E] px-6 py-3.5 text-sm font-black text-[#71BC68] transition hover:-translate-y-0.5 sm:w-auto">
              Kembali ke Login
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
