'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  Loader2,
  ShieldCheck,
  Sprout,
  UploadCloud,
  X,
  XCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type FarmerProfile = {
  id: string
  user_id: string
  verify_status: 'pending' | 'approved' | 'rejected'
  reject_reason: string | null
  ktp_url: string | null
  cert_url: string | null
}

export default function MenungguVerifikasiPage() {
  const [profile, setProfile] = useState<FarmerProfile | null>(null)
  const [ktpFile, setKtpFile] = useState<File | null>(null)
  const [certFile, setCertFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      setError('')

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      const { data, error } = await supabase
        .from('farmer_profiles')
        .select('id, user_id, verify_status, reject_reason, ktp_url, cert_url')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        setError('Gagal memuat status verifikasi.')
        setLoading(false)
        return
      }

      setProfile(data as FarmerProfile | null)
      setLoading(false)
    }

    loadProfile()
  }, [])

  function validateDocument(file: File, label: string) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    const maxSize = 5 * 1024 * 1024

    if (!allowedTypes.includes(file.type)) {
      return `${label} harus berupa JPG, PNG, WEBP, atau PDF.`
    }

    if (file.size > maxSize) {
      return `${label} maksimal 5MB.`
    }

    return ''
  }

  async function uploadDocument(userId: string, file: File, folder: 'ktp' | 'sertifikat') {
    const supabase = createClient()
    const extension = file.name.split('.').pop()?.toLowerCase() || 'file'
    const filePath = `${folder}/${userId}-${Date.now()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('farmer-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('farmer-documents').getPublicUrl(filePath)

    return data.publicUrl
  }

  async function handleResubmit() {
    if (!profile) return

    setSaving(true)
    setError('')
    setSuccess('')

    if (!ktpFile) {
      setError('KTP baru wajib diunggah sebelum mengajukan verifikasi ulang.')
      setSaving(false)
      return
    }

    const ktpError = validateDocument(ktpFile, 'KTP')
    if (ktpError) {
      setError(ktpError)
      setSaving(false)
      return
    }

    if (certFile) {
      const certError = validateDocument(certFile, 'Sertifikat')
      if (certError) {
        setError(certError)
        setSaving(false)
        return
      }
    }

    try {
      const newKtpUrl = await uploadDocument(profile.user_id, ktpFile, 'ktp')

      const newCertUrl = certFile
        ? await uploadDocument(profile.user_id, certFile, 'sertifikat')
        : profile.cert_url

      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('farmer_profiles')
        .update({
          ktp_url: newKtpUrl,
          cert_url: newCertUrl,
          verify_status: 'pending',
          reject_reason: null,
          verified_at: null,
          verified_by: null,
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      setProfile({
        ...profile,
        ktp_url: newKtpUrl,
        cert_url: newCertUrl,
        verify_status: 'pending',
        reject_reason: null,
      })
      setKtpFile(null)
      setCertFile(null)
      setSuccess('Dokumen berhasil dikirim ulang. Pengajuan kamu kembali masuk antrean verifikasi.')
    } catch (err: any) {
      setError(err?.message || 'Gagal mengirim ulang dokumen.')
    }

    setSaving(false)
  }

  const status = profile?.verify_status ?? 'pending'
  const isRejected = status === 'rejected'
  const isApproved = status === 'approved'

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F4FAF3] px-3 py-6 sm:px-4 sm:py-10" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-5xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(10,76,62,0.14)] ring-1 ring-[#71BC68]/15 sm:rounded-[36px] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative overflow-hidden bg-[#0A4C3E] p-8 text-white md:p-10">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#71BC68]/15" />
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-white/10 ring-1 ring-white/15">
                <Sprout size={34} color="#71BC68" />
              </div>
              <p className="mt-8 text-xs font-black uppercase tracking-[0.22em] text-[#B9E8B4]">
                KiTani Seller Center
              </p>
              <h1 className="mt-3 text-2xl font-black leading-tight sm:text-3xl md:text-4xl" style={{ fontFamily: 'Sora, sans-serif' }}>
                {isRejected
                  ? 'Pengajuan petani perlu diperbaiki.'
                  : isApproved
                    ? 'Akun petani sudah disetujui.'
                    : 'Pendaftaran petani berhasil dikirim.'}
              </h1>
              <p className="mt-4 text-sm leading-7 text-white/68">
                {isRejected
                  ? 'Periksa alasan penolakan dari admin, lalu unggah ulang dokumen jika diperlukan.'
                  : isApproved
                    ? 'Kamu sudah bisa menggunakan Seller Center KiTani.'
                    : 'Akun kamu sedang dicek admin agar marketplace tetap aman, terpercaya, dan berisi petani yang valid.'}
              </p>
            </div>
          </div>

          <div className="p-6 md:p-10">
            {loading ? (
              <div className="flex min-h-[360px] items-center justify-center">
                <div className="flex items-center gap-3 rounded-2xl bg-[#F0F8EE] px-5 py-4 text-sm font-black text-[#0A4C3E]">
                  <Loader2 className="animate-spin" size={20} />
                  Memuat status verifikasi...
                </div>
              </div>
            ) : (
              <>
                <div
                  className={`mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${isRejected
                      ? 'bg-red-50 text-red-700'
                      : isApproved
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-[#FFF5D6] text-[#8A5B00]'
                    }`}
                >
                  {isRejected ? <XCircle size={16} /> : isApproved ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                  {isRejected ? 'Pengajuan Ditolak' : isApproved ? 'Terverifikasi' : 'Menunggu Verifikasi'}
                </div>

                <h2 className="text-2xl font-black text-[#0A4C3E]" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {isRejected ? 'Alasan Penolakan' : isApproved ? 'Verifikasi Berhasil' : 'Tahap berikutnya'}
                </h2>

                {error && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                    {success}
                  </div>
                )}

                {isRejected && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 shrink-0 text-red-600" size={20} />
                      <div>
                        <p className="text-sm font-black text-red-700">
                          {profile?.reject_reason || 'Pengajuan belum sesuai. Silakan perbaiki dokumen dan ajukan ulang.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!isRejected && !isApproved && (
                  <>
                    <p className="mt-2 text-sm leading-6 text-[#6B7C6A]">
                      Biasanya proses verifikasi membutuhkan waktu <strong>1–2 hari kerja</strong>. Kamu akan mendapat notifikasi setelah akun disetujui.
                    </p>

                    <div className="mt-6 space-y-3">
                      {[
                        { icon: FileCheck2, title: 'Data masuk ke admin', desc: 'Admin akan memeriksa data profil, dokumen, dan informasi kebun.' },
                        { icon: ShieldCheck, title: 'Verifikasi keamanan', desc: 'Akun diverifikasi agar pembeli lebih percaya.' },
                        { icon: Bell, title: 'Notifikasi persetujuan', desc: 'Setelah disetujui, kamu bisa mulai mengelola produk.' },
                      ].map((step) => (
                        <div key={step.title} className="flex gap-4 rounded-[24px] bg-[#F8FBF7] p-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0A4C3E] shadow-sm">
                            <step.icon size={20} />
                          </div>
                          <div>
                            <p className="font-black text-[#0A4C3E]">{step.title}</p>
                            <p className="mt-1 text-sm leading-6 text-[#6B7C6A]">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {isApproved && (
                  <p className="mt-2 text-sm leading-6 text-[#6B7C6A]">
                    Akun petani kamu telah disetujui. Sekarang kamu bisa mengakses dashboard, menambahkan produk, dan mengelola pesanan.
                  </p>
                )}

                {isRejected && (
                  <div className="mt-6 rounded-[24px] border border-[#0A4C3E]/10 bg-[#FBFEFA] p-4">
                    <p className="text-sm font-black text-[#0A4C3E]">Upload Ulang Dokumen</p>
                    <p className="mt-1 text-xs font-medium leading-5 text-[#6B7C6A]">
                      KTP baru wajib diunggah sebelum pengajuan verifikasi dikirim ulang.
                    </p>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-black text-slate-700">
                          KTP Baru <span className="text-red-500">*</span>
                        </label>
                        <label className="flex min-h-[116px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#71BC68]/60 bg-white px-4 py-5 text-center transition hover:bg-[#F0F8EE]">
                          <UploadCloud size={24} className="text-[#0A4C3E]" />
                          <span className="mt-2 max-w-full truncate text-sm font-black text-[#0A4C3E]">
                            {ktpFile ? ktpFile.name : 'Upload KTP baru wajib'}
                          </span>
                          <span className="mt-1 text-xs font-medium text-slate-500">
                            JPG, PNG, WEBP, atau PDF · Maks 5MB
                          </span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            onChange={(e) => setKtpFile(e.target.files?.[0] ?? null)}
                            className="hidden"
                          />
                        </label>

                        {!ktpFile && (
                          <p className="mt-2 text-xs font-bold text-red-500">
                            KTP baru wajib diunggah untuk mengajukan verifikasi ulang.
                          </p>
                        )}

                        {ktpFile && (
                          <button
                            type="button"
                            onClick={() => setKtpFile(null)}
                            className="mt-2 inline-flex items-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600"
                          >
                            <X size={13} />
                            Hapus KTP
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-black text-slate-700">
                          Sertifikat <span className="text-xs text-slate-400">Opsional</span>
                        </label>
                        <label className="flex min-h-[116px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-center transition hover:bg-[#F8FCF7]">
                          <FileText size={24} className="text-[#6B7C6A]" />
                          <span className="mt-2 max-w-full truncate text-sm font-black text-[#0A4C3E]">
                            {certFile ? certFile.name : profile?.cert_url ? 'Sertifikat lama tersedia, pilih file baru jika perlu' : 'Pilih sertifikat'}
                          </span>
                          <span className="mt-1 text-xs font-medium text-slate-500">
                            Boleh dikosongkan jika belum punya
                          </span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            onChange={(e) => setCertFile(e.target.files?.[0] ?? null)}
                            className="hidden"
                          />
                        </label>

                        {certFile && (
                          <button
                            type="button"
                            onClick={() => setCertFile(null)}
                            className="mt-2 inline-flex items-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600"
                          >
                            <X size={13} />
                            Hapus Sertifikat
                          </button>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleResubmit}
                      disabled={saving || !ktpFile}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0A4C3E] px-6 py-3.5 text-sm font-black text-[#71BC68] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:text-white sm:w-auto"
                    >
                      {saving && <Loader2 className="animate-spin" size={17} />}
                      {saving ? 'Mengirim ulang...' : 'Ajukan Verifikasi Ulang'}
                    </button>
                  </div>
                )}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  {isApproved && (
                    <Link href="/petani/dashboard" className="inline-flex w-full items-center justify-center rounded-2xl bg-[#0A4C3E] px-6 py-3.5 text-sm font-black text-[#71BC68] transition hover:-translate-y-0.5 sm:w-auto">
                      Masuk Seller Center
                    </Link>
                  )}

                  <Link href="/login" className="inline-flex w-full items-center justify-center rounded-2xl border border-[#0A4C3E]/10 bg-white px-6 py-3.5 text-sm font-black text-[#0A4C3E] transition hover:-translate-y-0.5 sm:w-auto">
                    Kembali ke Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}