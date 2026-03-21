'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Phone, MapPin, LogOut, Edit2, Check, X, Sprout, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string; full_name: string | null; phone: string | null
  address: string | null; role: string; created_at: string
}

interface FarmerProfile {
  id: string; farm_name: string; farm_location: string
  farm_size: string | null; verify_status: string
}

interface Props {
  profile: Profile
  farmerProfile: FarmerProfile | null
  email: string
}

export default function PetaniProfilClient({ profile: initialProfile, farmerProfile, email }: Props) {
  const router = useRouter()
  const [profile, setProfile] = useState(initialProfile)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState(initialProfile.full_name ?? '')
  const [phone, setPhone] = useState(initialProfile.phone ?? '')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSave() {
    if (!fullName.trim()) { showToast('Nama tidak boleh kosong', 'error'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles')
      .update({ full_name: fullName.trim(), phone: phone.trim(), updated_at: new Date().toISOString() })
      .eq('id', profile.id)
    if (error) showToast('Gagal menyimpan', 'error')
    else {
      setProfile(prev => ({ ...prev, full_name: fullName.trim(), phone: phone.trim() }))
      showToast('Profil diperbarui!')
      setEditing(false)
    }
    setLoading(false)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = profile.full_name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? 'P'
  const joinDate = new Date(profile.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0A4C3E, #0d6b55)' }} className="px-5 pt-5 pb-8 relative overflow-hidden">
        <div className="absolute" style={{ width: 180, height: 180, borderRadius: '50%', background: 'rgba(113,188,104,0.1)', top: -60, right: -30 }} />
        <div className="max-w-xl mx-auto relative">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-base font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>Profil Saya</h1>
            <button onClick={() => setEditing(!editing)}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: editing ? '#71BC68' : 'rgba(255,255,255,0.1)' }}>
              <Edit2 size={16} color={editing ? '#0A4C3E' : 'white'} />
            </button>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold mb-3"
              style={{ background: '#71BC68', color: '#0A4C3E' }}>
              {initials}
            </div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
              {profile.full_name ?? 'Petani'}
            </h2>
            <div className="flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full"
              style={{ background: 'rgba(113,188,104,0.2)' }}>
              <Sprout size={12} color="#71BC68" />
              <span className="text-xs font-bold" style={{ color: '#71BC68' }}>Petani</span>
            </div>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Bergabung sejak {joinDate}</p>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-4 pb-24">

        {/* Info Akun */}
        <div className="bg-white rounded-2xl overflow-hidden mb-4"
          style={{ border: '1px solid rgba(113,188,104,0.15)', boxShadow: '0 2px 8px rgba(10,76,62,0.06)' }}>
          <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: '1px solid #f3f4f6' }}>
            <h3 className="font-bold text-sm" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>Informasi Akun</h3>
            {editing && (
              <div className="flex gap-2">
                <button onClick={() => { setEditing(false); setFullName(profile.full_name ?? ''); setPhone(profile.phone ?? '') }}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: '#f5f5f5', color: '#666' }}>
                  <X size={12} /> Batal
                </button>
                <button onClick={handleSave} disabled={loading}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: '#0A4C3E', color: '#71BC68' }}>
                  <Check size={12} /> {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            )}
          </div>
          <div className="px-5 py-3 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1"><User size={13} color="#6B7C6A" /><p className="text-xs font-semibold" style={{ color: '#6B7C6A' }}>Nama Lengkap</p></div>
              {editing ? <input value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: '#71BC68', color: '#0A4C3E' }} />
                : <p className="text-sm font-medium" style={{ color: '#0A4C3E' }}>{profile.full_name || '-'}</p>}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1"><Mail size={13} color="#6B7C6A" /><p className="text-xs font-semibold" style={{ color: '#6B7C6A' }}>Email</p></div>
              <p className="text-sm font-medium" style={{ color: '#0A4C3E' }}>{email}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1"><Phone size={13} color="#6B7C6A" /><p className="text-xs font-semibold" style={{ color: '#6B7C6A' }}>Nomor HP</p></div>
              {editing ? <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: '#71BC68', color: '#0A4C3E' }} />
                : <p className="text-sm font-medium" style={{ color: '#0A4C3E' }}>{profile.phone || '-'}</p>}
            </div>
          </div>
        </div>

        {/* Info Kebun */}
        {farmerProfile && (
          <div className="bg-white rounded-2xl overflow-hidden mb-4"
            style={{ border: '1px solid rgba(113,188,104,0.15)', boxShadow: '0 2px 8px rgba(10,76,62,0.06)' }}>
            <div className="px-5 pt-4 pb-3" style={{ borderBottom: '1px solid #f3f4f6' }}>
              <h3 className="font-bold text-sm" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>Informasi Kebun</h3>
            </div>
            <div className="px-5 py-3 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1"><Building2 size={13} color="#6B7C6A" /><p className="text-xs font-semibold" style={{ color: '#6B7C6A' }}>Nama Kebun</p></div>
                <p className="text-sm font-medium" style={{ color: '#0A4C3E' }}>{farmerProfile.farm_name}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1"><MapPin size={13} color="#6B7C6A" /><p className="text-xs font-semibold" style={{ color: '#6B7C6A' }}>Lokasi</p></div>
                <p className="text-sm font-medium" style={{ color: '#0A4C3E' }}>{farmerProfile.farm_location}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1"><Check size={13} color="#6B7C6A" /><p className="text-xs font-semibold" style={{ color: '#6B7C6A' }}>Status Verifikasi</p></div>
                <span className="text-xs font-bold px-2 py-1 rounded-full"
                  style={{
                    background: farmerProfile.verify_status === 'approved' ? '#D4EDDA' : '#FFF3CD',
                    color: farmerProfile.verify_status === 'approved' ? '#155724' : '#856404'
                  }}>
                  {farmerProfile.verify_status === 'approved' ? 'Terverifikasi ✓' : 'Menunggu Verifikasi'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Keluar */}
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm"
          style={{ background: '#FEE2E2', color: '#dc3545', border: '1px solid rgba(220,53,69,0.15)' }}>
          <LogOut size={18} /> Keluar dari Akun
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg"
          style={{ background: toast.type === 'success' ? '#0A4C3E' : '#dc3545', color: 'white', minWidth: '200px', textAlign: 'center' }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
