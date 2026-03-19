'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  User, Phone, MapPin, Mail, Edit2, Check, X,
  ShoppingBag, Package, ArrowLeft, LogOut,
  ChevronRight, Bell, Lock, Sprout
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

interface Props {
  profile: Profile
  email: string
  stats: {
    totalOrder: number
    totalDone: number
    totalBelanja: number
  }
}

export default function ProfilClient({ profile: initialProfile, email, stats }: Props) {
  const router = useRouter()
  const [profile, setProfile] = useState(initialProfile)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Form state
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [address, setAddress] = useState(profile.address ?? '')

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function cancelEdit() {
    setFullName(profile.full_name ?? '')
    setPhone(profile.phone ?? '')
    setAddress(profile.address ?? '')
    setEditing(false)
  }

  async function handleSave() {
    if (!fullName.trim()) { showToast('Nama tidak boleh kosong', 'error'); return }
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (error) {
      showToast('Gagal menyimpan perubahan', 'error')
    } else {
      setProfile(prev => ({ ...prev, full_name: fullName.trim(), phone: phone.trim(), address: address.trim() }))
      showToast('Profil berhasil diperbarui')
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

  const initials = profile.full_name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? 'U'
  const joinDate = new Date(profile.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>

      {/* ── HEADER ── */}
      <div style={{ background: 'linear-gradient(135deg, #0A4C3E, #0d6b55)' }} className="px-5 pt-6 pb-16 relative overflow-hidden">
        <div className="absolute" style={{ width: 200, height: 200, borderRadius: '50%', background: 'rgba(113,188,104,0.1)', top: -80, right: -40 }} />
        <div className="max-w-xl mx-auto relative">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => router.back()}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
              <ArrowLeft size={18} color="white" />
            </button>
            <h1 className="text-base font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>Profil Saya</h1>
            <button onClick={() => setEditing(!editing)}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: editing ? '#71BC68' : 'rgba(255,255,255,0.1)' }}>
              <Edit2 size={16} color={editing ? '#0A4C3E' : 'white'} />
            </button>
          </div>

          {/* Avatar + nama */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-2xl font-bold mb-3"
              style={{ background: '#71BC68', color: '#0A4C3E' }}>
              {initials}
            </div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
              {profile.full_name ?? 'Pengguna'}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Bergabung sejak {joinDate}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-8 pb-24">

        {/* ── STATS ── */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Total Pesanan', value: stats.totalOrder, icon: ShoppingBag, color: '#CCE5FF', iconColor: '#004085' },
            { label: 'Selesai', value: stats.totalDone, icon: Package, color: '#D4EDDA', iconColor: '#155724' },
            { label: 'Total Belanja', value: `Rp ${(stats.totalBelanja / 1000).toFixed(0)}rb`, icon: Check, color: '#FFF3CD', iconColor: '#856404' },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-2xl p-3 text-center"
              style={{ border: '1px solid rgba(113,188,104,0.15)', boxShadow: '0 4px 16px rgba(10,76,62,0.06)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: item.color }}>
                <item.icon size={16} color={item.iconColor} />
              </div>
              <p className="font-bold text-base" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>{item.value}</p>
              <p className="text-xs mt-0.5" style={{ color: '#6B7C6A' }}>{item.label}</p>
            </div>
          ))}
        </div>

        {/* ── INFO PROFIL ── */}
        <div className="bg-white rounded-2xl overflow-hidden mb-4"
          style={{ border: '1px solid rgba(113,188,104,0.15)', boxShadow: '0 4px 16px rgba(10,76,62,0.06)' }}>
          <div className="flex items-center justify-between px-5 pt-4 pb-3"
            style={{ borderBottom: '1px solid #f3f4f6' }}>
            <h3 className="font-bold text-sm" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
              Informasi Akun
            </h3>
            {editing && (
              <div className="flex gap-2">
                <button onClick={cancelEdit}
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
            {/* Nama */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <User size={14} color="#6B7C6A" />
                <label className="text-xs font-semibold" style={{ color: '#6B7C6A' }}>Nama Lengkap</label>
              </div>
              {editing ? (
                <input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2"
                  style={{ borderColor: '#71BC68', fontFamily: 'DM Sans, sans-serif', color: '#0A4C3E' }}
                />
              ) : (
                <p className="text-sm font-medium" style={{ color: '#0A4C3E' }}>{profile.full_name || '-'}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Mail size={14} color="#6B7C6A" />
                <label className="text-xs font-semibold" style={{ color: '#6B7C6A' }}>Email</label>
              </div>
              <p className="text-sm font-medium" style={{ color: '#0A4C3E' }}>{email}</p>
              <p className="text-xs mt-0.5" style={{ color: '#6B7C6A' }}>Email tidak dapat diubah</p>
            </div>

            {/* No HP */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Phone size={14} color="#6B7C6A" />
                <label className="text-xs font-semibold" style={{ color: '#6B7C6A' }}>Nomor HP</label>
              </div>
              {editing ? (
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2"
                  style={{ borderColor: '#71BC68', fontFamily: 'DM Sans, sans-serif', color: '#0A4C3E' }}
                />
              ) : (
                <p className="text-sm font-medium" style={{ color: '#0A4C3E' }}>{profile.phone || '-'}</p>
              )}
            </div>

            {/* Alamat */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <MapPin size={14} color="#6B7C6A" />
                <label className="text-xs font-semibold" style={{ color: '#6B7C6A' }}>Alamat</label>
              </div>
              {editing ? (
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Masukkan alamat lengkap kamu"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 resize-none"
                  style={{ borderColor: '#71BC68', fontFamily: 'DM Sans, sans-serif', color: '#0A4C3E' }}
                />
              ) : (
                <p className="text-sm font-medium" style={{ color: '#0A4C3E' }}>{profile.address || '-'}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── MENU LAINNYA ── */}
        <div className="bg-white rounded-2xl overflow-hidden mb-4"
          style={{ border: '1px solid rgba(113,188,104,0.15)', boxShadow: '0 4px 16px rgba(10,76,62,0.06)' }}>
          {[
            { icon: ShoppingBag, label: 'Pesanan Saya', desc: 'Lihat riwayat transaksi', href: '/transaksi', color: '#CCE5FF', iconColor: '#004085' },
            { icon: Bell, label: 'Notifikasi', desc: 'Kelola notifikasi', href: '/notifikasi', color: '#D4EDDA', iconColor: '#155724' },
          ].map((item, i) => (
            <button key={item.label}
              onClick={() => router.push(item.href)}
              className="w-full flex items-center gap-3 px-5 py-4 transition active:bg-gray-50"
              style={{ borderBottom: i < 1 ? '1px solid #f3f4f6' : 'none' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: item.color }}>
                <item.icon size={17} color={item.iconColor} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold" style={{ color: '#0A4C3E' }}>{item.label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#6B7C6A' }}>{item.desc}</p>
              </div>
              <ChevronRight size={16} color="#9CA3AF" />
            </button>
          ))}
        </div>

        {/* ── KELUAR ── */}
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition active:opacity-80"
          style={{ background: '#FEE2E2', color: '#dc3545', border: '1px solid rgba(220,53,69,0.15)' }}>
          <LogOut size={18} />
          Keluar dari Akun
        </button>

      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg"
          style={{
            background: toast.type === 'success' ? '#0A4C3E' : '#dc3545',
            color: 'white', minWidth: '200px', textAlign: 'center'
          }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
