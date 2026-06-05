'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  CheckCircle,
  ChevronDown,
  Clock,
  FileText,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  XCircle,
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

const STATUS_CONFIG: Record<string, { label: string; badge: string; icon: any; card: string }> = {
  pending: {
    label: 'Menunggu',
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
    card: 'bg-amber-50 text-amber-700',
    icon: Clock,
  },
  approved: {
    label: 'Disetujui',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    card: 'bg-emerald-50 text-emerald-700',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Ditolak',
    badge: 'bg-red-50 text-red-700 ring-red-200',
    card: 'bg-red-50 text-red-700',
    icon: XCircle,
  },
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

  const counts = useMemo(() => ({
    all: list.length,
    pending: list.filter((p) => p.verify_status === 'pending').length,
    approved: list.filter((p) => p.verify_status === 'approved').length,
    rejected: list.filter((p) => p.verify_status === 'rejected').length,
  }), [list])

  const filtered = useMemo(() => {
    return list.filter((p) => {
      const matchFilter = filter === 'all' || p.verify_status === filter
      const keyword = search.toLowerCase().trim()
      const matchSearch = !keyword ||
        p.profiles?.full_name?.toLowerCase().includes(keyword) ||
        p.farm_name?.toLowerCase().includes(keyword) ||
        p.farm_location?.toLowerCase().includes(keyword) ||
        p.profiles?.phone?.toLowerCase().includes(keyword)
      return matchFilter && matchSearch
    })
  }, [filter, list, search])

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

    if (fpError) {
      showToast('Gagal menyetujui petani.', 'error')
      setLoading(null)
      return
    }

    await supabase.from('profiles').update({ is_verified: true }).eq('id', userId)

    await supabase.from('notifications').insert({
      user_id: userId,
      title: '🎉 Akun Petani Disetujui!',
      body: 'Selamat! Akun petani kamu sudah diverifikasi. Kamu sekarang bisa mulai berjualan di KiTani.',
      type: 'system',
    })

    setList((prev) => prev.map((p) => p.id === petaniId ? { ...p, verify_status: 'approved', reject_reason: null } : p))
    showToast('Petani berhasil disetujui.')
    setLoading(null)
  }

  async function handleReject() {
    if (!rejectModal || !rejectReason.trim()) return

    setLoading(rejectModal.id)
    const supabase = createClient()
    const selected = list.find((p) => p.id === rejectModal.id)

    if (!selected) {
      showToast('Data petani tidak ditemukan.', 'error')
      setLoading(null)
      return
    }

    const reason = rejectReason.trim()
    const { error } = await supabase
      .from('farmer_profiles')
      .update({
        verify_status: 'rejected',
        reject_reason: reason,
        verified_by: adminId,
        verified_at: new Date().toISOString(),
      })
      .eq('id', rejectModal.id)

    if (error) {
      showToast('Gagal menolak verifikasi.', 'error')
      setLoading(null)
      return
    }

    await supabase.from('profiles').update({ is_verified: false }).eq('id', selected.profiles?.id ?? '')

    await supabase.from('notifications').insert({
      user_id: selected.profiles?.id,
      title: 'Verifikasi Akun Ditolak',
      body: `Maaf, akun petani kamu ditolak. Alasan: ${reason}. Silakan perbaiki dan daftar ulang.`,
      type: 'system',
    })

    setList((prev) => prev.map((p) => p.id === rejectModal.id ? { ...p, verify_status: 'rejected', reject_reason: reason } : p))
    showToast('Status petani berhasil diperbarui.')
    setRejectModal(null)
    setRejectReason('')
    setLoading(null)
  }

  return (
    <div className="min-h-screen bg-[#F5FAF4] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      {toast && (
        <div
          className="fixed right-4 top-4 z-[80] rounded-2xl px-5 py-3 text-sm font-extrabold text-white shadow-xl lg:right-8"
          style={{ background: toast.type === 'success' ? '#0A4C3E' : '#DC2626' }}
        >
          {toast.msg}
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm" onClick={() => setRejectModal(null)}>
          <div className="w-full max-w-md rounded-[30px] bg-white p-6 shadow-[0_30px_90px_rgba(0,0,0,0.22)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <XCircle size={25} />
            </div>
            <h3 className="mt-4 font-['Sora'] text-xl font-extrabold text-[#0A4C3E]">Tolak Verifikasi</h3>
            <p className="mt-2 text-sm font-medium leading-6 text-[#6B7C6A]">
              Berikan alasan penolakan untuk <b>{rejectModal.name}</b>. Alasan ini akan dikirim ke petani.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Contoh: Dokumen KTP belum jelas atau data lahan belum lengkap."
              className="mt-5 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#0A4C3E] outline-none transition focus:border-[#71BC68] focus:ring-4 focus:ring-[#71BC68]/15"
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => setRejectModal(null)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-extrabold text-[#6B7C6A] transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || !!loading}
                className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading ? 'Memproses...' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[34px] border border-[#0A4C3E]/10 bg-white p-6 shadow-[0_20px_70px_rgba(10,76,62,0.08)] sm:p-8">
          <div className="pointer-events-none absolute right-[-60px] top-[-90px] h-72 w-72 rounded-full bg-[#71BC68]/10" />
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#F0F8EE] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.22em] text-[#71BC68]">
                <ShieldCheck size={16} />
                Farmer Verification
              </div>
              <h1 className="mt-5 font-['Sora'] text-3xl font-extrabold tracking-[-1px] text-[#0A4C3E] sm:text-4xl">
                Verifikasi Petani
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-[#6B7C6A]">
                Review kelengkapan profil petani, dokumen pendukung, dan status pengajuan agar marketplace tetap aman.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:min-w-[360px]">
              <div className="rounded-2xl bg-[#F8FCF7] p-4">
                <p className="text-xs font-extrabold text-[#6B7C6A]">Pending</p>
                <p className="mt-2 font-['Sora'] text-2xl font-extrabold text-[#0A4C3E]">{counts.pending}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-xs font-extrabold text-emerald-700">Approved</p>
                <p className="mt-2 font-['Sora'] text-2xl font-extrabold text-emerald-800">{counts.approved}</p>
              </div>
              <div className="rounded-2xl bg-red-50 p-4">
                <p className="text-xs font-extrabold text-red-700">Rejected</p>
                <p className="mt-2 font-['Sora'] text-2xl font-extrabold text-red-800">{counts.rejected}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[28px] border border-[#0A4C3E]/10 bg-white p-4 shadow-[0_16px_50px_rgba(10,76,62,0.06)]">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => {
                const active = filter === tab
                const label = tab === 'all' ? 'Semua' : STATUS_CONFIG[tab].label
                return (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className="flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold transition"
                    style={{ background: active ? '#0A4C3E' : '#F4FAF3', color: active ? 'white' : '#49645B' }}
                  >
                    {label}
                    <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: active ? 'rgba(255,255,255,0.16)' : 'rgba(10,76,62,0.08)' }}>
                      {counts[tab]}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-[#F8FCF7] px-4 py-3 ring-1 ring-[#0A4C3E]/8 xl:w-[360px]">
              <Search size={18} className="text-[#8A9A89]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, kebun, lokasi, atau nomor HP..."
                className="w-full bg-transparent text-sm font-semibold text-[#0A4C3E] outline-none placeholder:text-[#9CA3AF]"
              />
              <SlidersHorizontal size={17} className="text-[#8A9A89]" />
            </div>
          </div>
        </section>

        <section className="mt-5">
          {filtered.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[30px] border border-[#0A4C3E]/10 bg-white text-center shadow-[0_16px_50px_rgba(10,76,62,0.06)]">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F0F8EE] text-[#71BC68]">
                <CheckCircle size={34} />
              </div>
              <p className="mt-5 font-['Sora'] text-lg font-extrabold text-[#0A4C3E]">Tidak ada data</p>
              <p className="mt-2 text-sm font-medium text-[#6B7C6A]">Coba ubah filter atau kata kunci pencarian.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((p) => {
                const status = STATUS_CONFIG[p.verify_status] ?? STATUS_CONFIG.pending
                const StatusIcon = status.icon
                const isExpanded = expandedId === p.id

                return (
                  <div key={p.id} className="overflow-hidden rounded-[28px] border border-[#0A4C3E]/10 bg-white shadow-[0_14px_45px_rgba(10,76,62,0.05)]">
                    <div className="grid gap-4 p-4 lg:grid-cols-[1fr_auto] lg:items-center lg:p-5">
                      <div className="flex min-w-0 gap-4">
                        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold ${status.card}`}>
                          {p.profiles?.full_name?.[0]?.toUpperCase() ?? 'P'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-base font-extrabold text-[#0A4C3E]">{p.profiles?.full_name ?? 'Petani'}</p>
                            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${status.badge}`}>
                              <StatusIcon size={12} />
                              {status.label}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-[#6B7C6A]">
                            <span className="inline-flex items-center gap-1"><Building2 size={13} /> {p.farm_name}</span>
                            <span className="inline-flex items-center gap-1"><MapPin size={13} /> {p.farm_location}</span>
                            {p.profiles?.phone && <span className="inline-flex items-center gap-1"><Phone size={13} /> {p.profiles.phone}</span>}
                          </div>
                          {p.reject_reason && (
                            <div className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-xs font-bold leading-5 text-red-700">
                              Alasan penolakan: {p.reject_reason}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        {p.verify_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(p.id, p.user_id)}
                              disabled={loading === p.id}
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0A4C3E] px-4 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-300 sm:flex-none"
                            >
                              <CheckCircle size={16} />
                              {loading === p.id ? 'Memproses...' : 'Setujui'}
                            </button>
                            <button
                              onClick={() => setRejectModal({ id: p.id, name: p.profiles?.full_name ?? 'Petani' })}
                              disabled={loading === p.id}
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-extrabold text-red-700 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 sm:flex-none"
                            >
                              <XCircle size={16} />
                              Tolak
                            </button>
                          </>
                        )}

                        {p.verify_status === 'approved' && (
                          <button
                            onClick={() => setRejectModal({ id: p.id, name: p.profiles?.full_name ?? 'Petani' })}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-extrabold text-red-700 transition hover:-translate-y-0.5 sm:flex-none"
                          >
                            <XCircle size={16} />
                            Cabut
                          </button>
                        )}

                        {p.verify_status === 'rejected' && (
                          <button
                            onClick={() => handleApprove(p.id, p.user_id)}
                            disabled={loading === p.id}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-700 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 sm:flex-none"
                          >
                            <CheckCircle size={16} />
                            Setujui
                          </button>
                        )}

                        <button
                          onClick={() => setExpandedId(isExpanded ? null : p.id)}
                          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4FAF3] text-[#6B7C6A] transition hover:bg-[#EAF7E7]"
                          aria-label="Buka detail"
                        >
                          <ChevronDown size={18} className="transition" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }} />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-[#0A4C3E]/8 bg-[#FBFEFA] px-4 pb-5 pt-4 lg:px-5">
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-2xl bg-white p-4 ring-1 ring-[#0A4C3E]/8">
                            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#8A9A89]">Luas Lahan</p>
                            <p className="mt-2 text-sm font-extrabold text-[#0A4C3E]">{p.farm_size ?? '-'}</p>
                          </div>
                          <div className="rounded-2xl bg-white p-4 ring-1 ring-[#0A4C3E]/8">
                            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#8A9A89]">Tanggal Daftar</p>
                            <p className="mt-2 text-sm font-extrabold text-[#0A4C3E]">
                              {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white p-4 ring-1 ring-[#0A4C3E]/8">
                            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#8A9A89]">KTP</p>
                            {p.ktp_url ? (
                              <a href={p.ktp_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm font-extrabold text-[#0A4C3E]">
                                <FileText size={15} /> Lihat KTP
                              </a>
                            ) : <p className="mt-2 text-sm font-extrabold text-[#6B7C6A]">Belum upload</p>}
                          </div>
                          <div className="rounded-2xl bg-white p-4 ring-1 ring-[#0A4C3E]/8">
                            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#8A9A89]">Sertifikat</p>
                            {p.cert_url ? (
                              <a href={p.cert_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm font-extrabold text-[#0A4C3E]">
                                <FileText size={15} /> Lihat Sertifikat
                              </a>
                            ) : <p className="mt-2 text-sm font-extrabold text-[#6B7C6A]">Belum upload</p>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
