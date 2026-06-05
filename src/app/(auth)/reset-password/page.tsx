'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, Suspense, useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Lock, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function ResetPasswordContent() {
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)

  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [sessionReady, setSessionReady] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function prepareResetSession() {
      setCheckingSession(true)
      setError('')

      const supabase = createClient()
      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        setError('Link reset password tidak valid atau sudah kedaluwarsa. Silakan minta link baru.')
        setSessionReady(false)
        setCheckingSession(false)
        return
      }

      setSessionReady(true)
      setCheckingSession(false)
    }

    prepareResetSession()
  }, [])

  async function handleUpdatePassword(e: FormEvent) {
    e.preventDefault()

    setLoading(true)
    setError('')
    setSuccess(false)

    if (!sessionReady) {
      setError('Sesi reset password belum valid. Silakan minta link reset baru.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password belum sama.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message || 'Gagal memperbarui password.')
      setLoading(false)
      return
    }

    await supabase.auth.signOut()

    setSuccess(true)
    setLoading(false)

    setTimeout(() => {
      router.push('/login')
      router.refresh()
    }, 1400)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FBFEFA] font-['DM_Sans'] text-[#0A4C3E]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,#E8F7E5_0%,transparent_28%),radial-gradient(circle_at_85%_30%,#EAF7E7_0%,transparent_26%),linear-gradient(120deg,#FFFFFF_0%,#F4FAF3_50%,#FFFFFF_100%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-[520px]">
          <div className="mb-6 flex justify-center">
            <div className="flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-[30px] bg-white p-0 shadow-[0_18px_45px_rgba(10,76,62,0.10)]">
              <Image
                src="/images/logoKitani.png"
                alt="KiTani"
                width={120}
                height={120}
                priority
                className="h-full w-full scale-[1.6] object-contain"
              />
            </div>
          </div>

          <div className="rounded-[34px] border border-[#0A4C3E]/10 bg-white/95 px-6 py-8 shadow-[0_25px_90px_rgba(10,76,62,0.12)] backdrop-blur sm:px-9 sm:py-10">
            <Link
              href="/login"
              className="mb-7 inline-flex items-center gap-2 text-sm font-extrabold text-slate-500 transition hover:text-[#0A4C3E]"
            >
              <ArrowLeft size={18} />
              Kembali ke login
            </Link>

            <div className="mb-8">
              <p className="text-sm font-extrabold text-[#71BC68]">Password baru</p>
              <h1 className="mt-2 font-['Sora'] text-3xl font-extrabold tracking-[-0.8px] text-[#0A4C3E] sm:text-[34px]">
                Buat Password Baru
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Masukkan password baru untuk akun KiTani kamu.
              </p>
            </div>

            {checkingSession && (
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[#71BC68]/20 bg-[#F0F8EE] px-4 py-4 text-sm font-bold text-[#0A4C3E]">
                <Loader2 size={20} className="animate-spin" />
                Memvalidasi link reset password...
              </div>
            )}

            {!checkingSession && !sessionReady && !success && (
              <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-700">
                Link reset password belum valid atau sudah kedaluwarsa. Silakan minta link reset baru dari halaman lupa password.
              </div>
            )}

            {success && (
              <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-700">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
                  <div>
                    <p className="font-extrabold">Password berhasil diganti.</p>
                    <p className="mt-1 font-medium leading-6">
                      Kamu akan diarahkan ke halaman login.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-extrabold text-slate-700">
                  Password Baru
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
                    disabled={!sessionReady || checkingSession || success}
                    placeholder="Minimal 6 karakter"
                    className="h-16 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-14 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#71BC68] focus:ring-4 focus:ring-[#71BC68]/15 disabled:cursor-not-allowed disabled:bg-slate-50"
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

              <div>
                <label className="mb-2 block text-sm font-extrabold text-slate-700">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <Lock
                    size={20}
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={!sessionReady || checkingSession || success}
                    placeholder="Ulangi password baru"
                    className="h-16 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-14 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#71BC68] focus:ring-4 focus:ring-[#71BC68]/15 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass((p) => !p)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#0A4C3E]"
                  >
                    {showConfirmPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || checkingSession || !sessionReady || success}
                className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0A4C3E] to-[#0C6A52] text-sm font-extrabold text-white shadow-[0_15px_35px_rgba(10,76,62,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(10,76,62,0.28)] active:translate-y-0 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </form>

            <div className="mt-7 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-[#F4FAF3] to-[#EEF8EC] px-5 py-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0A4C3E]">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-[#0A4C3E]">
                  Aman lewat Supabase Auth
                </p>
                <p className="text-xs leading-5 text-slate-500">
                  Password lama tidak ditampilkan dan tidak disimpan di database publik.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  )
}