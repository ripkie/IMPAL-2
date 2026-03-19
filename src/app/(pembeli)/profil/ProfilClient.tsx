'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  User, Phone, MapPin, Mail, Edit2, Check, X,
  ShoppingBag, Package, ArrowLeft, LogOut,
  ChevronRight, Bell, Camera, Loader, Sprout, Code
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

interface Props {
  profile: Profile
  email: string
  stats: { totalOrder: number; totalDone: number; totalBelanja: number }
}

export default function ProfilClient({ profile: initialProfile, email, stats }: Props) {
  const router = useRouter()
  const [profile, setProfile] = useState(initialProfile)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) { showToast('Ukuran foto maksimal 2MB', 'error'); return }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Format foto harus JPG, PNG, atau WebP', 'error'); return
    }

    setUploadingAvatar(true)
    const supabase = createClient()
    try {
      const ext = file.name.split('.').pop()
      const filePath = `${profile.id}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const avatarUrl = `${publicUrl}?t=${Date.now()}`

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', profile.id)
      if (updateError) throw updateError

      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }))
      showToast('Foto profil berhasil diperbarui')
    } catch {
      showToast('Gagal mengupload foto', 'error')
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSave() {
    if (!fullName.trim()) { showToast('Nama tidak boleh kosong', 'error'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({
      full_name: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id)

    if (error) { showToast('Gagal menyimpan perubahan', 'error') }
    else {
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
  const totalBelanjaStr = stats.totalBelanja >= 1000000
    ? `Rp ${(stats.totalBelanja / 1000000).toFixed(1)}jt`
    : `Rp ${(stats.totalBelanja / 1000).toFixed(0)}rb`

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>

      {/* HEADER */}
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

          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div style={{ position: 'relative', width: 80, height: 80, marginBottom: 12 }}>
              <div style={{ width: 80, height: 80, borderRadius: 20, overflow: 'hidden', background: '#71BC68', color: '#0A4C3E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700 }}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar"
                    style={{ width: 80, height: 80, objectFit: 'cover', display: 'block' }} />
                ) : initials}
              </div>
              <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}
                style={{ position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: '50%', background: uploadingAvatar ? '#ccc' : '#71BC68', border: '2px solid #0d6b55', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                {uploadingAvatar ? <Loader size={13} color="#0A4C3E" /> : <Camera size={13} color="#0A4C3E" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                className="hidden" onChange={handleAvatarChange} />
            </div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
              {profile.full_name ?? 'Pengguna'}
            </h2>
            <div className="flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full"
              style={{ background: email === 'rifki.dupon07@gmail.com' ? 'rgba(99,102,241,0.2)' : 'rgba(113,188,104,0.2)' }}>
              {email === 'rifki.dupon07@gmail.com'
                ? <Code size={12} color="#818cf8" />
                : profile.role === 'pembeli'
                  ? <ShoppingBag size={12} color="#71BC68" />
                  : profile.role === 'petani'
                    ? <Sprout size={12} color="#71BC68" />
                    : <User size={12} color="#71BC68" />
              }
              <span className="text-xs font-bold" style={{ color: email === 'rifki.dupon07@gmail.com' ? '#818cf8' : '#71BC68' }}>
                {email === 'rifki.dupon07@gmail.com' ? 'Developer' : profile.role === 'pembeli' ? 'Pembeli' : profile.role === 'petani' ? 'Petani' : 'Admin'}
              </span>
            </div>
            <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Bergabung sejak {joinDate}</p>
            {uploadingAvatar && <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Mengupload foto...</p>}
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-8 pb-24">

        {/* STATS */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Total Pesanan', value: stats.totalOrder, icon: ShoppingBag, color: '#CCE5FF', iconColor: '#004085' },
            { label: 'Selesai', value: stats.totalDone, icon: Package, color: '#D4EDDA', iconColor: '#155724' },
            { label: 'Total Belanja', value: totalBelanjaStr, icon: Check, color: '#FFF3CD', iconColor: '#856404' },
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

        {/* INFO PROFIL */}
        <div className="bg-white rounded-2xl overflow-hidden mb-4"
          style={{ border: '1px solid rgba(113,188,104,0.15)', boxShadow: '0 4px 16px rgba(10,76,62,0.06)' }}>
          <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: '1px solid #f3f4f6' }}>
            <h3 className="font-bold text-sm" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>Informasi Akun</h3>
            {editing && (
              <div className="flex gap-2">
                <button onClick={cancelEdit} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
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
            {[
              {
                icon: User, label: 'Nama Lengkap', value: profile.full_name, editing: true,
                input: <input value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none"
                  style={{ borderColor: '#71BC68', color: '#0A4C3E' }} />
              },
              {
                icon: Mail, label: 'Email', value: email, editing: false,
                note: 'Email tidak dapat diubah'
              },
              {
                icon: Phone, label: 'Nomor HP', value: profile.phone, editing: true,
                input: <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none"
                  style={{ borderColor: '#71BC68', color: '#0A4C3E' }} />
              },
              {
                icon: MapPin, label: 'Alamat', value: profile.address, editing: true,
                input: <textarea value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="Masukkan alamat lengkap" rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none resize-none"
                  style={{ borderColor: '#71BC68', color: '#0A4C3E' }} />
              },
            ].map(field => (
              <div key={field.label}>
                <div className="flex items-center gap-2 mb-1.5">
                  <field.icon size={14} color="#6B7C6A" />
                  <label className="text-xs font-semibold" style={{ color: '#6B7C6A' }}>{field.label}</label>
                </div>
                {editing && field.editing && field.input
                  ? field.input
                  : <p className="text-sm font-medium" style={{ color: '#0A4C3E' }}>{field.value || '-'}</p>
                }
                {'note' in field && field.note && (
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{field.note}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* MENU */}
        <div className="bg-white rounded-2xl overflow-hidden mb-4"
          style={{ border: '1px solid rgba(113,188,104,0.15)', boxShadow: '0 4px 16px rgba(10,76,62,0.06)' }}>
          {[
            { icon: ShoppingBag, label: 'Pesanan Saya', desc: 'Lihat riwayat transaksi', href: '/transaksi', color: '#CCE5FF', iconColor: '#004085' },
            { icon: Bell, label: 'Notifikasi', desc: 'Kelola notifikasi', href: '/notifikasi', color: '#D4EDDA', iconColor: '#155724' },
          ].map((item, i) => (
            <button key={item.label} onClick={() => router.push(item.href)}
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

        {/* KELUAR */}
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm"
          style={{ background: '#FEE2E2', color: '#dc3545', border: '1px solid rgba(220,53,69,0.15)' }}>
          <LogOut size={18} /> Keluar dari Akun
        </button>

        <p className="text-center text-xs mt-3" style={{ color: '#9CA3AF' }}>
          Foto profil maks. 2MB · Format JPG, PNG, WebP
        </p>
      </div>

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg"
          style={{ background: toast.type === 'success' ? '#0A4C3E' : '#dc3545', color: 'white', minWidth: '200px', textAlign: 'center' }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}