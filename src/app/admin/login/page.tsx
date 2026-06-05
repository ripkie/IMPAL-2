'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Loader2,
  ShieldCheck,
  Sprout,
  User,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? ''

export default function AdminLoginPage() {
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: FormEvent) {
    e.preventDefault()

    setLoading(true)
    setError('')

    if (username.toLowerCase().trim() !== 'admin') {
      setError('Username atau password salah.')
      setLoading(false)
      return
    }

    if (!ADMIN_EMAIL) {
      setError('Email admin belum dikonfigurasi.')
      setLoading(false)
      return
    }

    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password,
    })

    if (authError || !data.user) {
      setError('Username atau password salah.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role !== 'admin') {
      await supabase.auth.signOut()
      setError('Akun ini tidak memiliki akses admin.')
      setLoading(false)
      return
    }

    router.push('/admin/dashboard')
    router.refresh()
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F4FAF3] font-['DM_Sans'] text-[#0A4C3E]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(113,188,104,0.20)_0%,transparent_28%),radial-gradient(circle_at_88%_10%,rgba(10,76,62,0.18)_0%,transparent_30%),linear-gradient(135deg,#F8FCF7_0%,#EEF8EC_48%,#FFFFFF_100%)]" />

      <section className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#71BC68]/25 bg-white/70 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.22em] text-[#71BC68] shadow-sm backdrop-blur">
            <ShieldCheck size={16} />
            Admin Control Center
          </div>

          <h1 className="mt-7 max-w-xl font-['Sora'] text-[52px] font-extrabold leading-[1.05] tracking-[-2px] text-[#0A4C3E]">
            Kelola ekosistem KiTani dengan aman.
          </h1>

          <p className="mt-5 max-w-lg text-base font-medium leading-8 text-[#49645B]">
            Panel khusus administrator untuk memantau aktivitas platform,
            verifikasi petani dan validasi kelayakan akun petani KiTani.
          </p>

          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            {[
              ['Verifikasi', 'Petani'],
              ['Validasi', 'Dokumen'],
              ['Jaga', 'Kepercayaan'],
            ].map(([title, desc]) => (
              <div
                key={title}
                className="rounded-[24px] border border-[#0A4C3E]/10 bg-white/80 p-5 shadow-[0_18px_50px_rgba(10,76,62,0.08)] backdrop-blur"
              >
                <p className="font-['Sora'] text-lg font-extrabold text-[#0A4C3E]">
                  {title}
                </p>
                <p className="mt-1 text-sm font-bold text-[#6B7C6A]">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-[460px]">
          <div className="rounded-[34px] border border-[#0A4C3E]/10 bg-white/95 p-6 shadow-[0_30px_90px_rgba(10,76,62,0.14)] backdrop-blur sm:p-8">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0F8EE] text-[#0A4C3E]">
                <Sprout size={28} />
              </div>
              <div>
                <p className="font-['Sora'] text-2xl font-extrabold tracking-tight text-[#0A4C3E]">
                  Ki<span className="text-[#71BC68]">Tani</span>
                </p>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#6B7C6A]">
                  Administrator
                </p>
              </div>
            </div>

            <div className="mb-7">
              <p className="text-sm font-extrabold text-[#71BC68]">
                Akses terbatas
              </p>
              <h2 className="mt-2 font-['Sora'] text-3xl font-extrabold tracking-[-0.8px] text-[#0A4C3E]">
                Masuk Admin
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#6B7C6A]">
                Gunakan username <b>admin</b> dan password akun admin KiTani.
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-bold text-red-600">
                <AlertCircle className="mt-0.5 shrink-0" size={19} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-extrabold text-slate-700">
                  Username Admin
                </label>
                <div className="group relative flex h-16 items-center rounded-2xl border border-slate-200 bg-white transition focus-within:border-[#71BC68] focus-within:ring-4 focus-within:ring-[#71BC68]/15">
                  <User size={20} className="absolute left-5 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="admin"
                    autoComplete="off"
                    className="h-full w-full rounded-2xl bg-transparent pl-14 pr-5 text-sm font-bold text-[#0A4C3E] outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-extrabold text-slate-700">
                  Password
                </label>
                <div className="group relative flex h-16 items-center rounded-2xl border border-slate-200 bg-white transition focus-within:border-[#71BC68] focus-within:ring-4 focus-within:ring-[#71BC68]/15">
                  <Lock size={20} className="absolute left-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Masukkan password admin"
                    className="h-full w-full rounded-2xl bg-transparent pl-14 pr-14 text-sm font-bold text-[#0A4C3E] outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-5 text-slate-400 transition hover:text-[#0A4C3E]"
                    aria-label={
                      showPassword
                        ? 'Sembunyikan password'
                        : 'Tampilkan password'
                    }
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0A4C3E] to-[#0C6A52] text-sm font-extrabold text-white shadow-[0_18px_45px_rgba(10,76,62,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400"
              >
                {loading ? (
                  <>
                    <Loader2 size={19} className="animate-spin" />
                    Memverifikasi akses...
                  </>
                ) : (
                  <>
                    Masuk ke Panel Admin
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 rounded-2xl border border-[#71BC68]/20 bg-[#F4FAF3] px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#0A4C3E] shadow-sm">
                  <ShieldCheck size={21} />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-[#0A4C3E]">
                    Login khusus administrator
                  </p>
                  <p className="mt-1 text-xs font-medium leading-5 text-[#6B7C6A]">
                    Username dikunci sebagai <b>admin</b>. Akses tetap
                    diverifikasi melalui Supabase Auth dan role admin.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-5 text-center text-xs font-bold text-[#6B7C6A]">
            KiTani Admin Panel · Akses internal
          </p>
        </div>
      </section>
    </main>
  )
}