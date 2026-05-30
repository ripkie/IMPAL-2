'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Leaf, ShoppingBasket, ShieldCheck, Truck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

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
    <main className="min-h-screen bg-[#F4FAF3] flex items-center justify-center px-4 py-8 font-['DM_Sans']">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 bg-white rounded-[32px] overflow-hidden shadow-[0_24px_80px_rgba(10,76,62,0.14)] border border-[#71BC68]/20">

        {/* LEFT SIDE */}
        <section className="hidden lg:flex relative bg-[#0A4C3E] text-white p-12 flex-col justify-between overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#71BC68]/20" />
          <div className="absolute bottom-10 -left-16 w-56 h-56 rounded-full bg-[#71BC68]/10" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 rounded-2xl bg-[#71BC68] flex items-center justify-center">
                <Leaf size={26} className="text-[#0A4C3E]" />
              </div>
              <h1 className="font-['Sora'] text-3xl font-bold">
                Ki<span className="text-[#71BC68]">Tani</span>
              </h1>
            </div>

            <h2 className="font-['Sora'] text-4xl font-bold leading-tight mb-5">
              Belanja sayuran segar langsung dari petani lokal.
            </h2>

            <p className="text-white/75 text-base leading-relaxed max-w-md">
              Dapatkan produk pertanian terbaik, harga transparan, dan pengiriman cepat dari petani terpercaya.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/10 backdrop-blur p-4 border border-white/10">
              <ShoppingBasket size={22} className="text-[#71BC68] mb-3" />
              <p className="text-sm font-semibold">Produk Segar</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur p-4 border border-white/10">
              <Truck size={22} className="text-[#71BC68] mb-3" />
              <p className="text-sm font-semibold">Cepat Sampai</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur p-4 border border-white/10">
              <ShieldCheck size={22} className="text-[#71BC68] mb-3" />
              <p className="text-sm font-semibold">Aman</p>
            </div>
          </div>
        </section>

        {/* RIGHT SIDE */}
        <section className="p-6 sm:p-10 lg:p-14 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
              <div className="w-11 h-11 rounded-2xl bg-[#0A4C3E] flex items-center justify-center">
                <Leaf size={23} className="text-[#71BC68]" />
              </div>
              <h1 className="font-['Sora'] text-2xl font-bold text-[#0A4C3E]">
                Ki<span className="text-[#71BC68]">Tani</span>
              </h1>
            </div>

            <div className="mb-8">
              <p className="text-sm font-semibold text-[#71BC68] mb-2">Selamat datang kembali</p>
              <h2 className="font-['Sora'] text-3xl font-bold text-[#0A4C3E]">
                Masuk ke Akun
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Masuk untuk mulai belanja sayuran segar favoritmu.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-[#0A4C3E] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@contoh.com"
                  className="w-full rounded-2xl border border-gray-200 bg-[#F9FCF8] px-4 py-3.5 text-sm text-gray-900 outline-none transition focus:border-[#71BC68] focus:bg-white focus:ring-4 focus:ring-[#71BC68]/15"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-[#0A4C3E]">
                    Password
                  </label>
                </div>

                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Masukkan password"
                    className="w-full rounded-2xl border border-gray-200 bg-[#F9FCF8] px-4 py-3.5 pr-12 text-sm text-gray-900 outline-none transition focus:border-[#71BC68] focus:bg-white focus:ring-4 focus:ring-[#71BC68]/15"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPass((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0A4C3E]"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#0A4C3E] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#0A4C3E]/20 transition hover:bg-[#083d32] disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {loading ? 'Memproses...' : 'Masuk Sekarang'}
              </button>
            </form>

            <div className="mt-7 text-center">
              <p className="text-sm text-gray-500">
                Belum punya akun?{' '}
                <Link href="/register" className="font-bold text-[#0A4C3E] hover:text-[#71BC68]">
                  Daftar sekarang
                </Link>
              </p>

              <Link
                href="/beranda"
                className="mt-4 inline-block text-xs font-semibold text-gray-400 hover:text-[#0A4C3E]"
              >
                Kembali ke beranda
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}