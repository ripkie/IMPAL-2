'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Building2, Check, Edit2, LogOut, Mail, MapPin, Phone, ShieldCheck, Sprout, User, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  address: string | null
  role: string
  created_at: string
}
interface FarmerProfile {
  id: string
  farm_name: string
  farm_location: string
  farm_size: string | null
  verify_status: string
}
interface Props { profile: Profile; farmerProfile: FarmerProfile | null; email: string }

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
    if (!fullName.trim()) return showToast('Nama tidak boleh kosong', 'error')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ full_name: fullName.trim(), phone: phone.trim(), updated_at: new Date().toISOString() }).eq('id', profile.id)
    if (error) showToast('Gagal menyimpan profil', 'error')
    else {
      setProfile(prev => ({ ...prev, full_name: fullName.trim(), phone: phone.trim() }))
      setEditing(false)
      showToast('Profil berhasil diperbarui')
    }
    setLoading(false)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function cancelEdit() {
    setEditing(false)
    setFullName(profile.full_name ?? '')
    setPhone(profile.phone ?? '')
  }

  const initials = profile.full_name?.split(' ').map(name => name[0]).slice(0, 2).join('').toUpperCase() ?? 'P'
  const joinDate = new Date(profile.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  const verified = farmerProfile?.verify_status === 'approved'

  return (
    <main className="min-h-screen bg-[#F4FAF3] px-4 pb-28 md:px-6 md:pb-10" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="mx-auto max-w-5xl">
        <section className="relative overflow-hidden rounded-[32px] bg-[#0A4C3E] p-5 shadow-[0_24px_70px_rgba(10,76,62,0.20)] md:p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#71BC68]/15" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[28px] bg-[#71BC68] text-2xl font-black text-[#0A4C3E] md:h-24 md:w-24 md:text-3xl" style={{ fontFamily: 'Sora, sans-serif' }}>{initials}</div>
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-[#B9E8B4] ring-1 ring-white/10"><Sprout size={14} /> Petani KiTani</div>
                <h1 className="text-2xl font-black text-white md:text-4xl" style={{ fontFamily: 'Sora, sans-serif' }}>{profile.full_name ?? 'Petani'}</h1>
                <p className="mt-2 text-sm text-white/65">Bergabung sejak {joinDate}</p>
              </div>
            </div>
            <button onClick={() => setEditing(prev => !prev)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#71BC68] px-5 py-3 text-sm font-black text-[#0A4C3E] transition hover:-translate-y-0.5"><Edit2 size={17} /> {editing ? 'Tutup Edit' : 'Edit Profil'}</button>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-[#71BC68]/15 md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#71BC68]">Account Detail</p>
                <h2 className="mt-2 text-xl font-black text-[#0A4C3E]" style={{ fontFamily: 'Sora, sans-serif' }}>Informasi Akun</h2>
              </div>
              {editing && <div className="flex gap-2"><button onClick={cancelEdit} className="rounded-2xl bg-[#F8FBF7] px-4 py-2 text-xs font-black text-[#6B7C6A]"><X className="inline" size={14} /> Batal</button><button onClick={handleSave} disabled={loading} className="rounded-2xl bg-[#0A4C3E] px-4 py-2 text-xs font-black text-[#71BC68]"><Check className="inline" size={14} /> {loading ? 'Simpan...' : 'Simpan'}</button></div>}
            </div>

            <div className="space-y-4">
              <InfoField icon={User} label="Nama Lengkap">
                {editing ? <input value={fullName} onChange={e => setFullName(e.target.value)} className="kitani-profile-input" /> : <p className="font-black text-[#0A4C3E]">{profile.full_name || '-'}</p>}
              </InfoField>
              <InfoField icon={Mail} label="Email">
                <p className="font-black text-[#0A4C3E]">{email}</p>
              </InfoField>
              <InfoField icon={Phone} label="Nomor HP">
                {editing ? <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" className="kitani-profile-input" /> : <p className="font-black text-[#0A4C3E]">{profile.phone || '-'}</p>}
              </InfoField>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-[#71BC68]/15 md:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#71BC68]">Farm Profile</p>
                  <h2 className="mt-2 text-xl font-black text-[#0A4C3E]" style={{ fontFamily: 'Sora, sans-serif' }}>Informasi Kebun</h2>
                </div>
                <span className="rounded-full px-3 py-1 text-xs font-black" style={{ background: verified ? '#E7F8EE' : '#FFF5D6', color: verified ? '#166534' : '#8A5B00' }}>{verified ? 'Terverifikasi' : 'Menunggu'}</span>
              </div>
              {farmerProfile ? (
                <div className="space-y-3">
                  <MiniInfo icon={Building2} label="Nama Kebun" value={farmerProfile.farm_name} />
                  <MiniInfo icon={MapPin} label="Lokasi" value={farmerProfile.farm_location} />
                  <MiniInfo icon={ShieldCheck} label="Status Verifikasi" value={verified ? 'Terverifikasi oleh admin KiTani' : 'Sedang menunggu verifikasi admin'} />
                </div>
              ) : (
                <div className="rounded-[24px] bg-[#F8FBF7] p-4 text-sm font-bold text-[#6B7C6A]">Data kebun belum tersedia.</div>
              )}
            </div>

            <div className="rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-[#71BC68]/15 md:p-6">
              <h2 className="text-xl font-black text-[#0A4C3E]" style={{ fontFamily: 'Sora, sans-serif' }}>Keamanan Akun</h2>
              <p className="mt-2 text-sm leading-6 text-[#6B7C6A]">Gunakan tombol keluar jika selesai mengelola toko di perangkat umum.</p>
              <button onClick={handleLogout} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FFF4F4] px-5 py-3 text-sm font-black text-[#C92A2A]"><LogOut size={18} /> Keluar dari Akun</button>
            </div>
          </aside>
        </section>
      </div>

      {toast && <div className="fixed bottom-24 left-1/2 z-50 min-w-[220px] -translate-x-1/2 rounded-2xl px-5 py-3 text-center text-sm font-black text-white shadow-xl md:bottom-8" style={{ background: toast.type === 'success' ? '#0A4C3E' : '#C92A2A' }}>{toast.msg}</div>}
      <style jsx global>{`.kitani-profile-input{width:100%;border-radius:16px;border:1px solid rgba(113,188,104,.24);background:#F8FBF7;padding:12px 14px;font-size:14px;font-weight:800;color:#0A4C3E;outline:none}.kitani-profile-input:focus{border-color:#71BC68;background:white}`}</style>
    </main>
  )
}

function InfoField({ icon: Icon, label, children }: { icon: typeof User; label: string; children: ReactNode }) {
  return <div className="rounded-[24px] bg-[#F8FBF7] p-4"><div className="mb-2 flex items-center gap-2 text-[#6B7C6A]"><Icon size={16} /><p className="text-xs font-black uppercase tracking-wide">{label}</p></div>{children}</div>
}

function MiniInfo({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return <div className="rounded-[24px] bg-[#F8FBF7] p-4"><div className="mb-1 flex items-center gap-2 text-[#6B7C6A]"><Icon size={16} /><p className="text-xs font-black uppercase tracking-wide">{label}</p></div><p className="font-black text-[#0A4C3E]">{value}</p></div>
}
