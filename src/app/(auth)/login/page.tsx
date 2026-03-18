'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

    // Ambil role lalu redirect sesuai role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    const role = profile?.role
    if (role === 'admin') router.push('/admin/dashboard')
    else if (role === 'petani') router.push('/petani/dashboard')
    else router.push('/')

    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4FAF3] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>
            <span style={{ color: '#0A4C3E' }}>Ki</span>
            <span style={{ color: '#71BC68' }}>Tani</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Sayuran segar langsung dari petani</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-8">
          <h2 className="text-xl font-bold text-[#0A4C3E] mb-6" style={{ fontFamily: 'Sora, sans-serif' }}>
            Masuk ke Akun
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0A4C3E] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="email@contoh.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#71BC68] focus:ring-1 focus:ring-[#71BC68] transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0A4C3E] mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#71BC68] focus:ring-1 focus:ring-[#71BC68] transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm transition"
              style={{ background: loading ? '#ccc' : '#0A4C3E', color: '#71BC68' }}
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Belum punya akun?{' '}
            <Link href="/register" className="font-semibold" style={{ color: '#71BC68' }}>
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
