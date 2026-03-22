'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Style input yang konsisten — teks hitam jelas
const inputStyle = {
  color: '#111827',
  background: '#ffffff',
  border: '1.5px solid #e5e7eb',
  borderRadius: '12px',
  padding: '12px 16px',
  fontSize: '14px',
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.15s',
  fontFamily: 'DM Sans, sans-serif',
}

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4FAF3', padding: '16px', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '28px', fontWeight: 700, margin: 0 }}>
            <span style={{ color: '#0A4C3E' }}>Ki</span>
            <span style={{ color: '#71BC68' }}>Tani</span>
          </h1>
          <p style={{ color: '#6B7C6A', fontSize: '13px', marginTop: '6px' }}>Sayuran segar langsung dari petani</p>
        </div>

        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid rgba(113,188,104,0.2)', padding: '32px', boxShadow: '0 2px 16px rgba(10,76,62,0.06)' }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '20px', fontWeight: 700, color: '#0A4C3E', marginBottom: '24px', marginTop: 0 }}>
            Masuk ke Akun
          </h2>

          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: '13px', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0A4C3E', marginBottom: '6px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="email@contoh.com"
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = '#71BC68'}
                onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0A4C3E', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Masukkan password"
                  style={{ ...inputStyle, paddingRight: '44px' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#71BC68'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
                  {showPass ? <EyeOff size={16} color="#9CA3AF" /> : <Eye size={16} color="#9CA3AF" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px', borderRadius: '12px',
                fontWeight: 700, fontSize: '14px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? '#9CA3AF' : '#0A4C3E', color: '#71BC68',
                fontFamily: 'DM Sans, sans-serif', marginTop: '4px',
                transition: 'opacity 0.15s',
              }}>
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#6B7C6A', marginTop: '20px', marginBottom: 0 }}>
            Belum punya akun?{' '}
            <Link href="/register" style={{ color: '#71BC68', fontWeight: 700, textDecoration: 'none' }}>
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
