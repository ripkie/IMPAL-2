'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sprout, User, Lock, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Mapping username → email admin dari environment variable
// Format env: NEXT_PUBLIC_ADMIN_CREDENTIALS=username:email|username2:email2
function getAdminCredentials(): Record<string, string> {
  const raw = process.env.NEXT_PUBLIC_ADMIN_CREDENTIALS ?? ''
  return Object.fromEntries(
    raw.split('|')
      .filter(Boolean)
      .map(pair => {
        const [username, email] = pair.split(':')
        return [username.toLowerCase().trim(), email.trim()]
      })
  )
}
const ADMIN_CREDENTIALS = getAdminCredentials()

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Cek username valid
    const email = ADMIN_CREDENTIALS[username.toLowerCase().trim()]
    if (!email) {
      setError('Username atau password salah.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !data.user) {
      setError('Username atau password salah.')
      setLoading(false)
      return
    }

    // Verifikasi role admin
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
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #0A4C3E 0%, #0d6b55 100%)' }}>

      {/* Decorative circles */}
      <div className="fixed" style={{ width: 400, height: 400, borderRadius: '50%', background: 'rgba(113,188,104,0.08)', top: -150, right: -100 }} />
      <div className="fixed" style={{ width: 300, height: 300, borderRadius: '50%', background: 'rgba(113,188,104,0.06)', bottom: -100, left: -80 }} />

      <div className="w-full max-w-sm relative">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(113,188,104,0.2)', border: '1px solid rgba(113,188,104,0.3)' }}>
            <Sprout size={32} color="#71BC68" />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
            Ki<span style={{ color: '#71BC68' }}>Tani</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Panel Administrator</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-6" style={{ background: 'white' }}>
          <h2 className="text-lg font-bold mb-1" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
            Masuk sebagai Admin
          </h2>
          <p className="text-xs mb-5" style={{ color: '#6B7C6A' }}>
            Akses terbatas — hanya untuk administrator
          </p>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm"
              style={{ background: '#FEE2E2', color: '#dc3545' }}>
              <Lock size={14} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7C6A' }}>
                Username
              </label>
              <div className="flex items-center gap-2 px-3 py-3 rounded-xl border"
                style={{ borderColor: username ? '#71BC68' : '#e5e7eb' }}>
                <User size={16} color="#9CA3AF" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  placeholder="Masukkan username"
                  className="bg-transparent border-none outline-none text-sm flex-1"
                  style={{ color: '#0A4C3E', fontFamily: 'DM Sans, sans-serif' }}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7C6A' }}>
                Password
              </label>
              <div className="flex items-center gap-2 px-3 py-3 rounded-xl border"
                style={{ borderColor: password ? '#71BC68' : '#e5e7eb' }}>
                <Lock size={16} color="#9CA3AF" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Masukkan password"
                  className="bg-transparent border-none outline-none text-sm flex-1"
                  style={{ color: '#0A4C3E', fontFamily: 'DM Sans, sans-serif' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword
                    ? <EyeOff size={16} color="#9CA3AF" />
                    : <Eye size={16} color="#9CA3AF" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm transition hover:opacity-90"
              style={{ background: loading ? '#ccc' : '#0A4C3E', color: '#71BC68', fontFamily: 'DM Sans, sans-serif' }}>
              {loading ? 'Memverifikasi...' : 'Masuk ke Panel Admin'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
          KiTani Admin Panel · Akses terbatas
        </p>
      </div>
    </div>
  )
}
