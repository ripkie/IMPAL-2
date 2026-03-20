'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, CheckCircle, XCircle, Clock, Search,
  MapPin, Phone, Building2, FileText, ChevronDown, Filter
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Petani {
  id: string
  user_id: string
  farm_name: string
  farm_location: string
  farm_size: string | null
  ktp_url: string | null
  cert_url: string | null
  verify_status: string
  reject_reason: string | null
  created_at: string
  verified_at: string | null
  profiles: { id: string; full_name: string; phone: string } | null
}

interface Props {
  petani: Petani[]
  adminId: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: 'Menunggu', color: '#856404', bg: '#FFF3CD', icon: Clock },
  approved: { label: 'Disetujui', color: '#155724', bg: '#D4EDDA', icon: CheckCircle },
  rejected: { label: 'Ditolak', color: '#721c24', bg: '#F8D7DA', icon: XCircle },
}

export default function VerifikasiClient({ petani, adminId }: Props) {
  const router = useRouter()
  const [list, setList] = useState(petani)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = list.filter(p => {
    const matchFilter = filter === 'all' || p.verify_status === filter
    const matchSearch = !search ||
      p.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.farm_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.farm_location?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const counts = {
    all: list.length,
    pending: list.filter(p => p.verify_status === 'pending').length,
    approved: list.filter(p => p.verify_status === 'approved').length,
    rejected: list.filter(p => p.verify_status === 'rejected').length,
  }

  async function handleApprove(petaniId: string, userId: string) {
    setLoading(petaniId)
    const supabase = createClient()

    const { error: fpError } = await supabase
      .from('farmer_profiles')
      .update({
        verify_status: 'approved',
        verified_by: adminId,
        verified_at: new Date().toISOString(),
        reject_reason: null,
      })
      .eq('id', petaniId)

    if (fpError) { showToast('Gagal menyetujui', 'error'); setLoading(null); return }

    // Update is_verified di profiles
    await supabase.from('profiles').update({ is_verified: true }).eq('id', userId)

    // Kirim notifikasi ke petani
    await supabase.from('notifications').insert({
      user_id: userId,
      title: '🎉 Akun Petani Disetujui!',
      body: 'Selamat! Akun petani kamu sudah diverifikasi. Kamu sekarang bisa mulai berjualan di KiTani.',
      type: 'system',
    })

    setList(prev => prev.map(p => p.id === petaniId ? { ...p, verify_status: 'approved' } : p))
    showToast('Petani berhasil disetujui! ✅')
    setLoading(null)
  }

  async function handleReject() {
    if (!rejectModal || !rejectReason.trim()) return
    setLoading(rejectModal.id)
    const supabase = createClient()

    const petani = list.find(p => p.id === rejectModal.id)
    if (!petani) return

    const { error } = await supabase
      .from('farmer_profiles')
      .update({
        verify_status: 'rejected',
        reject_reason: rejectReason.trim(),
        verified_by: adminId,
        verified_at: new Date().toISOString(),
      })
      .eq('id', rejectModal.id)

    if (error) { showToast('Gagal menolak', 'error'); setLoading(null); return }

    await supabase.from('profiles').update({ is_verified: false }).eq('id', petani.profiles?.id ?? '')

    // Notifikasi ke petani
    await supabase.from('notifications').insert({
      user_id: petani.profiles?.id,
      title: 'Verifikasi Akun Ditolak',
      body: `Maaf, akun petani kamu ditolak. Alasan: ${rejectReason.trim()}. Silakan perbaiki dan daftar ulang.`,
      type: 'system',
    })

    setList(prev => prev.map(p => p.id === rejectModal.id
      ? { ...p, verify_status: 'rejected', reject_reason: rejectReason.trim() } : p))
    showToast('Petani ditolak')
    setRejectModal(null)
    setRejectReason('')
    setLoading(null)
  }

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-lg transition"
          style={{ background: toast.type === 'success' ? '#0A4C3E' : '#dc3545' }}>
          {toast.msg}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setRejectModal(null)}>
          <div className="w-full max-w-md bg-white rounded-3xl p-6"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-1" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
              Tolak Verifikasi
            </h3>
            <p className="text-sm mb-4" style={{ color: '#6B7C6A' }}>
              Berikan alasan penolakan untuk <strong>{rejectModal.name}</strong>
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Contoh: Dokumen KTP tidak jelas, foto lahan tidak sesuai..."
              className="w-full border rounded-xl px-4 py-3 text-sm outline-none resize-none"
              style={{ borderColor: '#e5e7eb', fontFamily: 'DM Sans, sans-serif' }}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setRejectModal(null)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border"
                style={{ borderColor: '#e5e7eb', color: '#6B7C6A' }}>
                Batal
              </button>
              <button onClick={handleReject}
                disabled={!rejectReason.trim() || !!loading}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition"
                style={{ background: !rejectReason.trim() ? '#ccc' : '#dc3545', color: 'white' }}>
                {loading ? 'Memproses...' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0A4C3E 0%, #0d6b55 100%)' }}
        className="px-6 pt-6 pb-10">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => router.push('/admin/dashboard')}
            className="flex items-center gap-2 text-sm mb-4 transition hover:opacity-80"
            style={{ color: 'rgba(255,255,255,0.7)' }}>
            <ArrowLeft size={16} /> Kembali ke Dashboard
          </button>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
            Verifikasi Petani
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Review dan kelola pendaftaran petani
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-5 pb-16">

        {/* Filter Tabs + Search */}
        <div className="bg-white rounded-2xl p-4 mb-5 flex flex-col md:flex-row gap-3"
          style={{ border: '1px solid rgba(113,188,104,0.15)', boxShadow: '0 4px 16px rgba(10,76,62,0.08)' }}>
          
          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
              <button key={tab} onClick={() => setFilter(tab)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition"
                style={{
                  background: filter === tab ? '#0A4C3E' : '#F4FAF3',
                  color: filter === tab ? 'white' : '#6B7C6A',
                }}>
                {tab === 'all' ? 'Semua' : STATUS_CONFIG[tab].label}
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    background: filter === tab ? 'rgba(255,255,255,0.2)' : 'rgba(10,76,62,0.1)',
                    color: filter === tab ? 'white' : '#0A4C3E'
                  }}>
                  {counts[tab]}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-full md:max-w-xs ml-auto"
            style={{ background: '#F4FAF3', border: '1px solid rgba(113,188,104,0.2)' }}>
            <Search size={14} color="#6B7C6A" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari petani..."
              className="bg-transparent outline-none text-sm w-full"
              style={{ color: '#0A4C3E' }} />
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl"
            style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
            <CheckCircle size={48} color="#71BC68" className="mx-auto mb-3" />
            <p className="font-semibold" style={{ color: '#0A4C3E' }}>Tidak ada data</p>
            <p className="text-sm mt-1" style={{ color: '#6B7C6A' }}>Coba ganti filter atau kata kunci pencarian</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(p => {
              const status = STATUS_CONFIG[p.verify_status] ?? STATUS_CONFIG.pending
              const StatusIcon = status.icon
              const isExpanded = expandedId === p.id

              return (
                <div key={p.id} className="bg-white rounded-2xl overflow-hidden"
                  style={{ border: '1px solid rgba(113,188,104,0.15)' }}>

                  {/* Main row */}
                  <div className="flex items-center gap-4 p-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-lg font-bold"
                      style={{ background: status.bg, color: status.color }}>
                      {p.profiles?.full_name?.[0]?.toUpperCase() ?? 'P'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm" style={{ color: '#0A4C3E' }}>
                          {p.profiles?.full_name ?? 'Petani'}
                        </p>
                        <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: status.bg, color: status.color }}>
                          <StatusIcon size={11} />
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-xs" style={{ color: '#6B7C6A' }}>
                          <Building2 size={11} /> {p.farm_name}
                        </span>
                        <span className="flex items-center gap-1 text-xs" style={{ color: '#6B7C6A' }}>
                          <MapPin size={11} /> {p.farm_location}
                        </span>
                        {p.profiles?.phone && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: '#6B7C6A' }}>
                            <Phone size={11} /> {p.profiles.phone}
                          </span>
                        )}
                      </div>
                      {p.reject_reason && (
                        <p className="text-xs mt-1 px-2 py-1 rounded-lg" style={{ background: '#F8D7DA', color: '#721c24' }}>
                          Alasan: {p.reject_reason}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {p.verify_status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(p.id, p.user_id)}
                            disabled={loading === p.id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition hover:opacity-90"
                            style={{ background: '#0A4C3E', color: '#71BC68' }}>
                            <CheckCircle size={14} />
                            {loading === p.id ? '...' : 'Setujui'}
                          </button>
                          <button
                            onClick={() => setRejectModal({ id: p.id, name: p.profiles?.full_name ?? 'Petani' })}
                            disabled={loading === p.id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition hover:opacity-90"
                            style={{ background: '#F8D7DA', color: '#721c24' }}>
                            <XCircle size={14} />
                            Tolak
                          </button>
                        </>
                      )}
                      {p.verify_status === 'approved' && (
                        <button
                          onClick={() => setRejectModal({ id: p.id, name: p.profiles?.full_name ?? 'Petani' })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition hover:opacity-80"
                          style={{ background: '#F8D7DA', color: '#721c24' }}>
                          <XCircle size={12} /> Cabut
                        </button>
                      )}
                      {p.verify_status === 'rejected' && (
                        <button
                          onClick={() => handleApprove(p.id, p.user_id)}
                          disabled={loading === p.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition hover:opacity-80"
                          style={{ background: '#D4EDDA', color: '#155724' }}>
                          <CheckCircle size={12} /> Setujui
                        </button>
                      )}

                      {/* Expand toggle */}
                      <button onClick={() => setExpandedId(isExpanded ? null : p.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition hover:bg-gray-100">
                        <ChevronDown size={16} color="#6B7C6A"
                          style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t" style={{ borderColor: 'rgba(113,188,104,0.1)' }}>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                        <div className="p-3 rounded-xl" style={{ background: '#F4FAF3' }}>
                          <p className="text-xs font-medium mb-1" style={{ color: '#6B7C6A' }}>Luas Lahan</p>
                          <p className="text-sm font-semibold" style={{ color: '#0A4C3E' }}>{p.farm_size ?? '-'}</p>
                        </div>
                        <div className="p-3 rounded-xl" style={{ background: '#F4FAF3' }}>
                          <p className="text-xs font-medium mb-1" style={{ color: '#6B7C6A' }}>Tanggal Daftar</p>
                          <p className="text-sm font-semibold" style={{ color: '#0A4C3E' }}>
                            {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl" style={{ background: '#F4FAF3' }}>
                          <p className="text-xs font-medium mb-1" style={{ color: '#6B7C6A' }}>KTP</p>
                          {p.ktp_url ? (
                            <a href={p.ktp_url} target="_blank" rel="noopener noreferrer"
                              className="text-sm font-semibold flex items-center gap-1" style={{ color: '#71BC68' }}>
                              <FileText size={13} /> Lihat KTP
                            </a>
                          ) : (
                            <p className="text-sm font-semibold" style={{ color: '#6B7C6A' }}>Belum upload</p>
                          )}
                        </div>
                        <div className="p-3 rounded-xl" style={{ background: '#F4FAF3' }}>
                          <p className="text-xs font-medium mb-1" style={{ color: '#6B7C6A' }}>Sertifikat Lahan</p>
                          {p.cert_url ? (
                            <a href={p.cert_url} target="_blank" rel="noopener noreferrer"
                              className="text-sm font-semibold flex items-center gap-1" style={{ color: '#71BC68' }}>
                              <FileText size={13} /> Lihat Sertifikat
                            </a>
                          ) : (
                            <p className="text-sm font-semibold" style={{ color: '#6B7C6A' }}>Belum upload</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
