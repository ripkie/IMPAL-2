'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { ArrowLeft, CheckCircle2, Loader2, Mail, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      setError(error.message || 'Gagal mengirim email reset password.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
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
              <p className="text-sm font-extrabold text-[#71BC68]">Reset password</p>
              <h1 className="mt-2 font-['Sora'] text-3xl font-extrabold tracking-[-0.8px] text-[#0A4C3E] sm:text-[34px]">
                Lupa Password?
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Masukkan email akun KiTani kamu. Kami akan mengirim link untuk membuat password baru.
              </p>
            </div>

            {success && (
              <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-700">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
                  <div>
                    <p className="font-extrabold">Email reset password terkirim.</p>
                    <p className="mt-1 font-medium leading-6">
                      Cek inbox atau folder spam email kamu, lalu klik link reset password.
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

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-extrabold text-slate-700">
                  Email Akun
                </label>
                <div className="relative">
                  <Mail size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="contoh@email.com"
                    className="h-16 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-5 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#71BC68] focus:ring-4 focus:ring-[#71BC68]/15"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0A4C3E] to-[#0C6A52] text-sm font-extrabold text-white shadow-[0_15px_35px_rgba(10,76,62,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(10,76,62,0.28)] active:translate-y-0 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? 'Mengirim...' : 'Kirim Link Reset Password'}
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
                  Link reset hanya dikirim ke email akun yang terdaftar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}