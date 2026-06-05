'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Truck,
  BadgeCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Email atau password salah.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    const role = profile?.role

    if (role === 'admin') router.push('/admin/dashboard')
    else if (role === 'petani') router.push('/petani/dashboard')
    else router.push('/home')

    router.refresh()
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FBFEFA] font-['DM_Sans'] text-[#0A4C3E]">
      {/* Background Decorative Elements */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,#E8F7E5_0%,transparent_28%),radial-gradient(circle_at_85%_30%,#EAF7E7_0%,transparent_26%),linear-gradient(120deg,#FFFFFF_0%,#F4FAF3_50%,#FFFFFF_100%)]" />

      <div className="pointer-events-none absolute left-[48%] top-16 hidden text-[240px] font-black leading-none text-[#0A4C3E]/[0.035] blur-[2px] lg:block">
        K
      </div>

      <span className="pointer-events-none absolute left-[39%] top-[15%] hidden h-8 w-14 rotate-[-18deg] rounded-[100%_0] bg-[#71BC68]/45 blur-[1px] lg:block" />
      <span className="pointer-events-none absolute right-[7%] top-[22%] hidden h-8 w-14 rotate-[-25deg] rounded-[100%_0] bg-[#71BC68]/40 blur-[1px] lg:block" />
      <span className="pointer-events-none absolute right-[11%] bottom-[18%] hidden h-7 w-12 rotate-[-25deg] rounded-[100%_0] bg-[#71BC68]/35 blur-[1px] lg:block" />
      <span className="pointer-events-none absolute left-[50%] top-[50%] hidden h-10 w-16 rotate-[35deg] rounded-[100%_0] bg-[#71BC68]/25 blur-[3px] lg:block" />

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1440px] lg:grid-cols-[1.08fr_0.92fr]">

        {/* LEFT SECTION (DESKTOP) */}
        <section className="relative hidden min-h-screen flex-col justify-between px-14 pb-8 pt-10 lg:flex xl:px-24">
          <div>
            {/* Logo Desktop: Ukuran scale dinaikkan ke 1.65 agar lebih ngepress */}
            <div className="mb-8 flex max-w-xl items-center justify-start">
              <div className="flex h-[140px] w-[140px] items-center justify-center overflow-hidden rounded-[32px] bg-white p-0 shadow-[0_18px_45px_rgba(10,76,62,0.10)]">
                <Image
                  src="/images/logoKitani.png"
                  alt="KiTani"
                  width={140}
                  height={140}
                  priority
                  className="h-full w-full scale-[1.65] object-contain"
                />
              </div>
            </div>

            <h1 className="max-w-xl font-['Sora'] text-[48px] font-extrabold leading-[1.16] tracking-[-1.5px] text-[#0A4C3E] xl:text-[52px]">
              Belanja Sayuran Segar Langsung{' '}
              <span className="text-[#71BC68]">dari Petani</span>
            </h1>

            <p className="mt-5 max-w-lg text-[17px] leading-8 text-slate-600">
              KiTani menghubungkan pembeli dengan petani lokal. Produk segar,
              harga transparan, dan kualitas terjamin.
            </p>

            {/* Features List */}
            <div className="mt-7 grid max-w-[420px] gap-3">
              {[
                {
                  icon: <ShieldCheck size={24} />,
                  title: 'Produk Segar Setiap Hari',
                  desc: 'Dipetik langsung dari kebun petani',
                },
                {
                  icon: <Truck size={24} />,
                  title: 'Pengiriman Cepat & Aman',
                  desc: 'Pesanan sampai dengan kondisi segar',
                },
                {
                  icon: <BadgeCheck size={24} />,
                  title: 'Petani Terverifikasi',
                  desc: 'Belanja lebih aman dan terpercaya',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-center gap-4 rounded-2xl border border-[#0A4C3E]/10 bg-white/90 px-5 py-4 shadow-[0_12px_32px_rgba(10,76,62,0.08)] backdrop-blur"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F7E5] text-[#0A4C3E]">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-extrabold text-[#0A4C3E]">
                      {item.title}
                    </h3>
                    <p className="mt-0.5 text-sm text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Illustration */}
          <div className="relative mt-8">
            <div className="absolute inset-x-[-130px] bottom-[-44px] h-48 rounded-[55%_55%_0_0] bg-gradient-to-r from-[#71BC68] via-[#9BD982] to-[#71BC68]" />

            <div className="relative z-10 mx-auto flex max-w-[680px] items-end justify-center">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop"
                alt="Sayuran segar KiTani"
                className="h-[250px] w-[650px] rounded-[38px] object-cover object-center shadow-[0_24px_60px_rgba(10,76,62,0.18)] xl:h-[285px]"
              />
            </div>

            <div className="relative z-20 mx-auto -mt-9 flex w-fit items-center gap-4 rounded-2xl bg-white/95 px-6 py-4 shadow-[0_18px_45px_rgba(10,76,62,0.16)]">
              <div className="flex -space-x-3">
                <div className="h-10 w-10 rounded-full border-2 border-white bg-[#d1e7d0]" />
                <div className="h-10 w-10 rounded-full border-2 border-white bg-[#b7d9af]" />
                <div className="h-10 w-10 rounded-full border-2 border-white bg-[#89c77b]" />
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#0A4C3E] text-xs font-extrabold text-white">
                  1K+
                </div>
              </div>
              <p className="text-[15px] leading-6 text-slate-600">
                Lebih dari 1.000+ pelanggan <br />
                percaya <b className="text-[#0A4C3E]">KiTani</b>
              </p>
            </div>
          </div>

          <p className="relative z-20 mt-6 text-xs text-slate-500">
            © 2025 KiTani. All rights reserved.
          </p>
        </section>

        {/* RIGHT SECTION (LOGIN FORM) */}
        <section className="flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 lg:px-10 xl:px-16">
          <div className="w-full max-w-[520px]">

            {/* Logo Mobile: Ukuran scale dinaikkan ke 1.6 agar seimbang */}
            <div className="mb-6 flex justify-center lg:hidden">
              <div className="flex h-[125px] w-[125px] items-center justify-center overflow-hidden rounded-[30px] bg-white p-0 shadow-[0_18px_45px_rgba(10,76,62,0.10)]">
                <Image
                  src="/images/logoKitani.png"
                  alt="KiTani"
                  width={125}
                  height={125}
                  priority
                  className="h-full w-full scale-[1.6] object-contain"
                />
              </div>
            </div>

            <div className="rounded-[34px] border border-[#0A4C3E]/10 bg-white/92 px-6 py-8 shadow-[0_25px_90px_rgba(10,76,62,0.12)] backdrop-blur sm:px-9 sm:py-10 lg:px-12 lg:py-12">
              <div className="mb-8">
                <p className="text-sm font-extrabold text-[#71BC68]">
                  Selamat datang kembali
                </p>
                <h2 className="mt-2 font-['Sora'] text-3xl font-extrabold tracking-[-0.8px] text-[#0A4C3E] sm:text-[34px]">
                  Masuk ke Akun KiTani
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Yuk, lanjut belanja sayuran segar favoritmu.
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-extrabold text-slate-700">
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={20}
                      className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Masukkan email kamu"
                      className="h-16 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-5 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#71BC68] focus:ring-4 focus:ring-[#71BC68]/15"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-extrabold text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={20}
                      className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Masukkan password"
                      className="h-16 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-14 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#71BC68] focus:ring-4 focus:ring-[#71BC68]/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((p) => !p)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#0A4C3E]"
                    >
                      {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-sm font-extrabold text-[#0A4C3E] transition hover:text-[#71BC68]"
                  >
                    Lupa password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-16 w-full rounded-2xl bg-gradient-to-r from-[#0A4C3E] to-[#0C6A52] text-sm font-extrabold text-white shadow-[0_15px_35px_rgba(10,76,62,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(10,76,62,0.28)] active:translate-y-0 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400"
                >
                  {loading ? 'Memproses...' : 'Masuk'}
                </button>
              </form>

              <p className="mt-7 text-center text-sm text-slate-500">
                Belum punya akun?{' '}
                <Link
                  href="/register"
                  className="font-extrabold text-[#0A4C3E] transition hover:text-[#71BC68]"
                >
                  Daftar sekarang
                </Link>
              </p>

              <div className="mt-7 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-[#F4FAF3] to-[#EEF8EC] px-5 py-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0A4C3E]">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-[#0A4C3E]">
                    Keamanan terjamin
                  </p>
                  <p className="text-xs text-slate-500">
                    Data kamu aman bersama KiTani
                  </p>
                </div>
              </div>

              <div className="mt-7 text-center">
                <Link
                  href="/beranda"
                  className="text-xs font-extrabold text-slate-400 transition hover:text-[#0A4C3E]"
                >
                  Kembali ke beranda
                </Link>
              </div>
            </div>

            <div className="mt-8 hidden justify-center gap-8 text-xs font-bold text-[#0A4C3E] lg:flex">
              <span>Tentang Kami</span>
              <span>Kebijakan Privasi</span>
              <span>Syarat & Ketentuan</span>
              <span>Bantuan</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}