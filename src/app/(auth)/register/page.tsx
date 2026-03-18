'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Role = 'pembeli' | 'petani'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [role, setRole] = useState<Role>('pembeli')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

    // 1. Buat akun auth
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role }
      }
    })

    if (authError || !data.user) {
      setError(authError?.message || 'Gagal mendaftar, coba lagi.')
      setLoading(false)
      return
    }

    // 2. Update profile tambahan
    await supabase.from('profiles').update({ phone }).eq('id', data.user.id)

    // 3. Kalau petani, buat farmer_profile
    if (role === 'petani') {
      await supabase.from('farmer_profiles').insert({
        user_id: data.user.id,
        farm_name: farmName,
        farm_location: farmLocation,
        verify_status: 'pending'
      })
    }

    // Redirect
    if (role === 'petani') router.push('/petani/menunggu-verifikasi')
    else router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4FAF3] px-4 py-10">
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
          <h2 className="text-xl font-bold text-[#0A4C3E] mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
            Buat Akun Baru
          </h2>
          <p className="text-sm text-gray-500 mb-6">Pilih tipe akun kamu</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {/* STEP 1: Pilih Role */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setRole('pembeli')}
                  className="p-4 rounded-xl border-2 text-left transition"
                  style={{
                    borderColor: role === 'pembeli' ? '#71BC68' : '#e5e7eb',
                    background: role === 'pembeli' ? '#F4FAF3' : 'white'
                  }}
                >
                  <div className="text-2xl mb-2">🛒</div>
                  <div className="font-semibold text-sm text-[#0A4C3E]">Pembeli</div>
                  <div className="text-xs text-gray-500 mt-1">Beli sayuran segar</div>
                </button>
                <button
                  onClick={() => setRole('petani')}
                  className="p-4 rounded-xl border-2 text-left transition"
                  style={{
                    borderColor: role === 'petani' ? '#71BC68' : '#e5e7eb',
                    background: role === 'petani' ? '#F4FAF3' : 'white'
                  }}
                >
                  <div className="text-2xl mb-2">🌾</div>
                  <div className="font-semibold text-sm text-[#0A4C3E]">Petani</div>
                  <div className="text-xs text-gray-500 mt-1">Jual hasil panen</div>
                </button>
              </div>

              {role === 'petani' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-xs text-yellow-700">
                  ⚠ Akun petani perlu verifikasi admin sebelum bisa berjualan.
                </div>
              )}

              <button
                onClick={() => setStep(2)}
                className="w-full py-3 rounded-xl font-bold text-sm"
                style={{ background: '#0A4C3E', color: '#71BC68' }}
              >
                Lanjut →
              </button>
            </div>
          )}

          {/* STEP 2: Isi Data */}
          {step === 2 && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0A4C3E] mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  placeholder="Nama lengkap kamu"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#71BC68] focus:ring-1 focus:ring-[#71BC68] transition"
                />
              </div>

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
                <label className="block text-sm font-medium text-[#0A4C3E] mb-1">No. HP</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
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
                  minLength={6}
                  placeholder="Minimal 6 karakter"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#71BC68] focus:ring-1 focus:ring-[#71BC68] transition"
                />
              </div>

              {/* Extra fields for petani */}
              {role === 'petani' && (
                <>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold text-[#0A4C3E] mb-3 uppercase tracking-wide">Data Pertanian</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0A4C3E] mb-1">Nama Usaha / Kebun</label>
                    <input
                      type="text"
                      value={farmName}
                      onChange={e => setFarmName(e.target.value)}
                      required
                      placeholder="Contoh: Kebun Pak Sunaryo"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#71BC68] focus:ring-1 focus:ring-[#71BC68] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0A4C3E] mb-1">Lokasi Pertanian</label>
                    <input
                      type="text"
                      value={farmLocation}
                      onChange={e => setFarmLocation(e.target.value)}
                      required
                      placeholder="Contoh: Malang, Jawa Timur"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#71BC68] focus:ring-1 focus:ring-[#71BC68] transition"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm border border-gray-200 text-gray-500"
                >
                  ← Kembali
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl font-bold text-sm transition"
                  style={{ background: loading ? '#ccc' : '#0A4C3E', color: '#71BC68' }}
                >
                  {loading ? 'Memproses...' : 'Daftar'}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-semibold" style={{ color: '#71BC68' }}>
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
