'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, Sprout, ArrowRight, ArrowLeft, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Role = 'pembeli' | 'petani'

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
  boxSizing: 'border-box' as const,
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [role, setRole] = useState<Role>('pembeli')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [phone, setPhone] = useState('')
  const [farmName, setFarmName] = useState('')
  const [farmLocation, setFarmLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } }
    })

    if (authError || !data.user) {
      setError(authError?.message || 'Gagal mendaftar, coba lagi.')
      setLoading(false)
      return
    }

    await supabase.from('profiles').update({ phone }).eq('id', data.user.id)

    if (role === 'petani') {
      await supabase.from('farmer_profiles').insert({
        user_id: data.user.id,
        farm_name: farmName,
        farm_location: farmLocation,
        verify_status: 'pending'
      })
    }

    if (role === 'petani') router.push('/petani/menunggu-verifikasi')
    else router.push('/')
    router.refresh()
  }

  const labelStyle = {
    display: 'block' as const,
    fontSize: '13px',
    fontWeight: 600,
    color: '#0A4C3E',
    marginBottom: '6px',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4FAF3', padding: '24px 16px', fontFamily: 'DM Sans, sans-serif' }}>
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

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            {[1, 2].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700,
                  background: step >= s ? '#0A4C3E' : '#f3f4f6',
                  color: step >= s ? '#71BC68' : '#9CA3AF',
                  transition: 'all 0.2s',
                }}>
                  {s}
                </div>
                <span style={{ fontSize: '12px', color: step >= s ? '#0A4C3E' : '#9CA3AF', fontWeight: step >= s ? 600 : 400 }}>
                  {s === 1 ? 'Tipe Akun' : 'Data Diri'}
                </span>
                {s < 2 && <div style={{ width: '24px', height: '1.5px', background: step > s ? '#0A4C3E' : '#e5e7eb', borderRadius: '99px' }} />}
              </div>
            ))}
          </div>

          <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '20px', fontWeight: 700, color: '#0A4C3E', marginBottom: '4px', marginTop: 0 }}>
            Buat Akun Baru
          </h2>
          <p style={{ color: '#6B7C6A', fontSize: '13px', marginBottom: '20px' }}>
            {step === 1 ? 'Pilih tipe akun kamu' : 'Lengkapi data diri'}
          </p>

          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: '13px', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {/* STEP 1 — Pilih Role */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {([
                  { r: 'pembeli' as Role, icon: ShoppingCart, title: 'Pembeli', desc: 'Beli sayuran segar' },
                  { r: 'petani' as Role, icon: Sprout, title: 'Petani', desc: 'Jual hasil panen' },
                ] as const).map(({ r, icon: Icon, title, desc }) => (
                  <button key={r} onClick={() => setRole(r)}
                    style={{
                      padding: '16px', borderRadius: '14px', border: `2px solid ${role === r ? '#71BC68' : '#e5e7eb'}`,
                      background: role === r ? '#F4FAF3' : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', background: role === r ? '#D4EDDA' : '#f5f5f5' }}>
                      <Icon size={20} color={role === r ? '#155724' : '#9CA3AF'} />
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0A4C3E' }}>{title}</div>
                    <div style={{ fontSize: '12px', color: '#6B7C6A', marginTop: '2px' }}>{desc}</div>
                  </button>
                ))}
              </div>

              {role === 'petani' && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '10px 14px' }}>
                  <AlertTriangle size={14} color="#92400E" style={{ marginTop: '1px', flexShrink: 0 }} />
                  <p style={{ fontSize: '12px', color: '#92400E', margin: 0 }}>
                    Akun petani perlu verifikasi admin sebelum bisa berjualan.
                  </p>
                </div>
              )}

              <button onClick={() => setStep(2)}
                style={{ width: '100%', padding: '13px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer', background: '#0A4C3E', color: '#71BC68', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                Lanjut <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* STEP 2 — Isi Data */}
          {step === 2 && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              <div>
                <label style={labelStyle}>Nama Lengkap</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  required placeholder="Nama lengkap kamu" style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = '#71BC68'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'} />
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required placeholder="email@contoh.com" style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = '#71BC68'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'} />
              </div>

              <div>
                <label style={labelStyle}>No. HP</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx" style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = '#71BC68'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'} />
              </div>

              <div>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    required minLength={6} placeholder="Minimal 6 karakter"
                    style={{ ...inputStyle, paddingRight: '44px' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#71BC68'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'} />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
                    {showPass ? <EyeOff size={16} color="#9CA3AF" /> : <Eye size={16} color="#9CA3AF" />}
                  </button>
                </div>
              </div>

              {/* Extra untuk petani */}
              {role === 'petani' && (
                <>
                  <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '14px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B7C6A', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 14px' }}>
                      Data Pertanian
                    </p>
                  </div>
                  <div>
                    <label style={labelStyle}>Nama Usaha / Kebun</label>
                    <input type="text" value={farmName} onChange={e => setFarmName(e.target.value)}
                      required placeholder="Contoh: Kebun Pak Sunaryo" style={inputStyle}
                      onFocus={e => e.currentTarget.style.borderColor = '#71BC68'}
                      onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'} />
                  </div>
                  <div>
                    <label style={labelStyle}>Lokasi Pertanian</label>
                    <input type="text" value={farmLocation} onChange={e => setFarmLocation(e.target.value)}
                      required placeholder="Contoh: Malang, Jawa Timur" style={inputStyle}
                      onFocus={e => e.currentTarget.style.borderColor = '#71BC68'}
                      onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'} />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setStep(1)}
                  style={{ flex: 1, padding: '13px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', background: '#f3f4f6', color: '#6B7C6A', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <ArrowLeft size={15} /> Kembali
                </button>
                <button type="submit" disabled={loading}
                  style={{ flex: 1, padding: '13px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: loading ? '#9CA3AF' : '#0A4C3E', color: '#71BC68', fontFamily: 'DM Sans, sans-serif' }}>
                  {loading ? 'Memproses...' : 'Daftar'}
                </button>
              </div>
            </form>
          )}

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#6B7C6A', marginTop: '20px', marginBottom: 0 }}>
            Sudah punya akun?{' '}
            <Link href="/login" style={{ color: '#71BC68', fontWeight: 700, textDecoration: 'none' }}>
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
