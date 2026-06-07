'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ShoppingCart, Sprout, ArrowRight, ArrowLeft,
  AlertTriangle, Eye, EyeOff, User, Mail, Phone,
  Lock, MapPin, Store, Check, FileText, UploadCloud,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Role = 'pembeli' | 'petani'

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
  const [ktpFile, setKtpFile] = useState<File | null>(null)
  const [certFile, setCertFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  function removeKtpFile() {
    setKtpFile(null)
  }

  function removeCertFile() {
    setCertFile(null)
  }

  async function uploadFarmerDocument(userId: string, file: File, folder: 'ktp' | 'sertifikat') {
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

    const { data } = supabase.storage
      .from('farmer-documents')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (role === 'petani') {
      if (!farmName.trim() || !farmLocation.trim()) {
        setError('Nama kebun dan lokasi pertanian wajib diisi.')
        setLoading(false)
        return
      }

      if (!ktpFile) {
        setError('Upload KTP wajib untuk verifikasi petani.')
        setLoading(false)
        return
      }

      const ktpError = validateDocument(ktpFile, 'KTP')
      if (ktpError) {
        setError(ktpError)
        setLoading(false)
        return
      }

      if (certFile) {
        const certError = validateDocument(certFile, 'Sertifikat')
        if (certError) {
          setError(certError)
          setLoading(false)
          return
        }
      }
    }

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
      try {
        const ktpUrl = ktpFile ? await uploadFarmerDocument(data.user.id, ktpFile, 'ktp') : null
        const certUrl = certFile ? await uploadFarmerDocument(data.user.id, certFile, 'sertifikat') : null

        const { error: farmerError } = await supabase.from('farmer_profiles').insert({
          user_id: data.user.id,
          farm_name: farmName,
          farm_location: farmLocation,
          ktp_url: ktpUrl,
          cert_url: certUrl,
          verify_status: 'pending'
        })

        if (farmerError) throw farmerError
      } catch (uploadOrInsertError: any) {
        setError(uploadOrInsertError?.message || 'Gagal mengunggah dokumen verifikasi petani.')
        setLoading(false)
        return
      }
    }

    if (role === 'petani') router.push('/petani/menunggu-verifikasi')
    else router.push('/')
    router.refresh()
  }

  const inputCls = "h-14 w-full rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#71BC68] focus:ring-4 focus:ring-[#71BC68]/15"

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FBFEFA] font-['DM_Sans'] text-[#0A4C3E]">

      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,#E8F7E5_0%,transparent_28%),radial-gradient(circle_at_85%_30%,#EAF7E7_0%,transparent_26%),linear-gradient(120deg,#FFFFFF_0%,#F4FAF3_50%,#FFFFFF_100%)]" />
      <div className="pointer-events-none absolute left-[48%] top-16 hidden text-[240px] font-black leading-none text-[#0A4C3E]/[0.035] blur-[2px] lg:block">K</div>
      <span className="pointer-events-none absolute left-[39%] top-[15%] hidden h-8 w-14 rotate-[-18deg] rounded-[100%_0] bg-[#71BC68]/45 blur-[1px] lg:block" />
      <span className="pointer-events-none absolute right-[7%] top-[22%] hidden h-8 w-14 rotate-[-25deg] rounded-[100%_0] bg-[#71BC68]/40 blur-[1px] lg:block" />
      <span className="pointer-events-none absolute right-[11%] bottom-[18%] hidden h-7 w-12 rotate-[-25deg] rounded-[100%_0] bg-[#71BC68]/35 blur-[1px] lg:block" />

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1440px] lg:grid-cols-[1.08fr_0.92fr]">

        {/* ── LEFT PANEL (desktop only) ── */}
        <section className="relative hidden min-h-screen flex-col justify-between px-14 pb-8 pt-10 lg:flex xl:px-24">
          <div>
            <div className="mb-8">
              <div className="flex h-[140px] w-[140px] items-center justify-center rounded-[32px] bg-white p-3 shadow-[0_18px_45px_rgba(10,76,62,0.10)]">
                <Image src="/images/logoKitani.png" alt="KiTani" width={140} height={140} priority
                  className="h-full w-full object-contain" />
              </div>
            </div>

            <h1 className="max-w-xl font-['Sora'] text-[48px] font-extrabold leading-[1.16] tracking-[-1.5px] text-[#0A4C3E] xl:text-[52px]">
              Bergabung dengan{' '}
              <span className="text-[#71BC68]">KiTani</span>
            </h1>

            <p className="mt-5 max-w-lg text-[17px] leading-8 text-slate-600">
              Daftar sebagai pembeli dan nikmati sayuran segar langsung dari petani, atau jadilah petani mitra dan jual hasil panenmu.
            </p>

            <div className="mt-8 grid max-w-[420px] gap-3">
              <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-400">
                {role === 'petani' ? 'Keuntungan jadi petani mitra' : 'Keuntungan belanja di KiTani'}
              </p>
              {(role === 'pembeli' ? [
                { icon: <ShoppingCart size={20} />, title: 'Harga Langsung Petani', desc: 'Tanpa markup distributor, lebih hemat' },
                { icon: <Check size={20} />, title: 'Kualitas Terjamin', desc: 'Produk segar dipanen hari yang sama' },
                { icon: <Sprout size={20} />, title: 'Dukung Petani Lokal', desc: 'Setiap pembelian membantu petani' },
              ] : [
                { icon: <Store size={20} />, title: 'Jangkauan Lebih Luas', desc: 'Jual ke ribuan pembeli di seluruh Indonesia' },
                { icon: <Check size={20} />, title: 'Gratis Bergabung', desc: 'Tidak ada biaya pendaftaran atau komisi besar' },
                { icon: <MapPin size={20} />, title: 'Atur Harga Sendiri', desc: 'Kamu yang tentukan harga dan stok' },
              ]).map(item => (
                <div key={item.title}
                  className="flex items-center gap-4 rounded-2xl border border-[#0A4C3E]/10 bg-white/90 px-5 py-4 shadow-[0_12px_32px_rgba(10,76,62,0.08)] backdrop-blur">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F7E5] text-[#0A4C3E]">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-extrabold text-[#0A4C3E]">{item.title}</h3>
                    <p className="mt-0.5 text-sm text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-8">
            <div className="absolute inset-x-[-130px] bottom-[-44px] h-48 rounded-[55%_55%_0_0] bg-gradient-to-r from-[#71BC68] via-[#9BD982] to-[#71BC68]" />
            <div className="relative z-10 mx-auto flex max-w-[680px] items-end justify-center">
              <img
                src="https://images.unsplash.com/photo-1495908333425-29a1e0918c5f?q=80&w=1200&auto=format&fit=crop"
                alt="Petani KiTani"
                className="h-[250px] w-[650px] rounded-[38px] object-cover object-center shadow-[0_24px_60px_rgba(10,76,62,0.18)] xl:h-[285px]"
              />
            </div>
            <div className="relative z-20 mx-auto -mt-9 flex w-fit items-center gap-4 rounded-2xl bg-white/95 px-6 py-4 shadow-[0_18px_45px_rgba(10,76,62,0.16)]">
              <div className="flex -space-x-3">
                <div className="h-10 w-10 rounded-full border-2 border-white bg-[#d1e7d0]" />
                <div className="h-10 w-10 rounded-full border-2 border-white bg-[#b7d9af]" />
                <div className="h-10 w-10 rounded-full border-2 border-white bg-[#89c77b]" />
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#0A4C3E] text-xs font-extrabold text-white">200+</div>
              </div>
              <p className="text-[15px] leading-6 text-slate-600">
                Lebih dari <b className="text-[#0A4C3E]">200 petani</b> aktif<br />sudah bergabung
              </p>
            </div>
          </div>

          <p className="relative z-20 mt-6 text-xs text-slate-500">© 2025 KiTani. All rights reserved.</p>
        </section>

        {/* ── RIGHT PANEL (form) ── */}
        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10 xl:px-16">
          <div className="w-full max-w-[520px]">

            <div className="mb-6 flex justify-center lg:hidden">
              <div className="flex h-[125px] w-[125px] items-center justify-center rounded-[30px] bg-white p-3 shadow-[0_18px_45px_rgba(10,76,62,0.10)]">
                <Image src="/images/logoKitani.png" alt="KiTani" width={125} height={125} priority
                  className="h-full w-full object-contain" />
              </div>
            </div>

            <div className="rounded-[34px] border border-[#0A4C3E]/10 bg-white/92 px-6 py-8 shadow-[0_25px_90px_rgba(10,76,62,0.12)] backdrop-blur sm:px-9 sm:py-10 lg:px-12 lg:py-12">

              <div className="mb-7 flex items-center gap-2">
                {([1, 2] as const).map(s => (
                  <div key={s} className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold transition-all duration-200"
                      style={{
                        background: step >= s ? '#0A4C3E' : '#f1f5f9',
                        color: step >= s ? '#71BC68' : '#94a3b8',
                      }}>
                      {step > s ? <Check size={13} strokeWidth={3} /> : s}
                    </div>
                    <span className="text-xs font-extrabold transition-colors"
                      style={{ color: step >= s ? '#0A4C3E' : '#94a3b8' }}>
                      {s === 1 ? 'Tipe Akun' : 'Data Diri'}
                    </span>
                    {s < 2 && (
                      <div className="mx-1 h-px w-6 rounded-full transition-colors duration-300"
                        style={{ background: step > s ? '#0A4C3E' : '#e2e8f0' }} />
                    )}
                  </div>
                ))}
              </div>

              <div className="mb-7">
                <p className="text-sm font-extrabold text-[#71BC68]">
                  {step === 1 ? 'Langkah 1 dari 2' : 'Langkah 2 dari 2'}
                </p>
                <h2 className="mt-2 font-['Sora'] text-3xl font-extrabold tracking-[-0.8px] text-[#0A4C3E] sm:text-[34px]">
                  {step === 1 ? 'Pilih Tipe Akun' : 'Lengkapi Data Diri'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {step === 1
                    ? 'Kamu mau belanja atau jual hasil panen?'
                    : `Daftar sebagai ${role === 'petani' ? 'petani mitra' : 'pembeli'}`}
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {error}
                </div>
              )}

              {step === 1 && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { r: 'pembeli' as Role, icon: ShoppingCart, title: 'Pembeli', desc: 'Beli sayuran segar dari petani lokal' },
                      { r: 'petani' as Role, icon: Sprout, title: 'Petani', desc: 'Jual hasil panen langsung ke pembeli' },
                    ] as const).map(({ r, icon: Icon, title, desc }) => (
                      <button key={r} type="button" onClick={() => setRole(r)}
                        className="rounded-2xl p-4 text-left transition-all duration-150 hover:-translate-y-0.5"
                        style={{
                          border: `2px solid ${role === r ? '#71BC68' : '#e2e8f0'}`,
                          background: role === r ? '#F4FAF3' : 'white',
                          boxShadow: role === r ? '0 8px 24px rgba(10,76,62,0.08)' : 'none',
                        }}>
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl transition-colors"
                          style={{ background: role === r ? '#D4EDDA' : '#f8fafc' }}>
                          <Icon size={20} color={role === r ? '#155724' : '#94a3b8'} />
                        </div>
                        <div className="text-sm font-extrabold text-[#0A4C3E]">{title}</div>
                        <div className="mt-1 text-xs leading-relaxed text-slate-500">{desc}</div>
                        {role === r && (
                          <div className="mt-2.5 flex items-center gap-1 text-xs font-extrabold text-[#71BC68]">
                            <Check size={12} strokeWidth={3} /> Dipilih
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {role === 'petani' && (
                    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <AlertTriangle size={15} color="#92400E" className="mt-0.5 shrink-0" />
                      <p className="text-xs leading-relaxed text-amber-800">
                        Akun petani perlu verifikasi oleh admin sebelum bisa mulai berjualan.
                      </p>
                    </div>
                  )}

                  <button type="button" onClick={() => setStep(2)}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0A4C3E] to-[#0C6A52] text-sm font-extrabold text-white shadow-[0_15px_35px_rgba(10,76,62,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(10,76,62,0.28)] active:translate-y-0">
                    Lanjut ke Data Diri <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {step === 2 && (
                <form onSubmit={handleRegister} className="flex flex-col gap-5">

                  <div>
                    <label className="mb-2 block text-sm font-extrabold text-slate-700">Nama Lengkap</label>
                    <div className="relative">
                      <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                        required placeholder="Nama lengkap kamu"
                        className={`${inputCls} pl-12 pr-5`} />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-extrabold text-slate-700">Email</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        required placeholder="email@contoh.com"
                        className={`${inputCls} pl-12 pr-5`} />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-extrabold text-slate-700">No. HP</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        className={`${inputCls} pl-12 pr-5`} />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-extrabold text-slate-700">Password</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                        required minLength={6} placeholder="Minimal 6 karakter"
                        className={`${inputCls} pl-12 pr-14`} />
                      <button type="button" onClick={() => setShowPass(p => !p)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#0A4C3E]">
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {role === 'petani' && (
                    <>
                      <div className="flex items-center gap-3 border-t border-slate-100 pt-2">
                        <div className="h-px flex-1 bg-slate-100" />
                        <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-400">Data Pertanian</span>
                        <div className="h-px flex-1 bg-slate-100" />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-extrabold text-slate-700">Nama Usaha / Kebun</label>
                        <div className="relative">
                          <Store size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input type="text" value={farmName} onChange={e => setFarmName(e.target.value)}
                            required placeholder="Contoh: Kebun Pak Sunaryo"
                            className={`${inputCls} pl-12 pr-5`} />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-extrabold text-slate-700">Lokasi Pertanian</label>
                        <div className="relative">
                          <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input type="text" value={farmLocation} onChange={e => setFarmLocation(e.target.value)}
                            required placeholder="Contoh: Malang, Jawa Timur"
                            className={`${inputCls} pl-12 pr-5`} />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-extrabold text-slate-700">
                            Upload KTP <span className="text-red-500">*</span>
                          </label>
                          <label className="flex min-h-[116px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#71BC68]/60 bg-[#F8FCF7] px-4 py-5 text-center transition hover:border-[#0A4C3E] hover:bg-[#F0F8EE]">
                            <UploadCloud size={24} className="text-[#0A4C3E]" />
                            <span className="mt-2 max-w-full truncate text-sm font-extrabold text-[#0A4C3E]">
                              {ktpFile ? ktpFile.name : 'Pilih file KTP'}
                            </span>
                            <span className="mt-1 text-xs font-medium text-slate-500">JPG, PNG, WEBP, atau PDF · Maks 5MB</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,application/pdf"
                              required={role === 'petani'}
                              onChange={(e) => setKtpFile(e.target.files?.[0] ?? null)}
                              className="hidden"
                            />
                          </label>

                          {!ktpFile && role === 'petani' && (
                            <p className="mt-2 text-xs font-bold text-red-500">
                              KTP wajib diunggah untuk proses verifikasi petani.
                            </p>
                          )}

                          {ktpFile && (
                            <button
                              type="button"
                              onClick={removeKtpFile}
                              className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-extrabold text-red-600 transition hover:bg-red-100"
                            >
                              Hapus KTP
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-extrabold text-slate-700">
                            Sertifikat <span className="text-xs font-bold text-slate-400">Opsional</span>
                          </label>
                          <label className="flex min-h-[116px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-center transition hover:border-[#71BC68] hover:bg-[#F8FCF7]">
                            <FileText size={24} className="text-[#6B7C6A]" />
                            <span className="mt-2 max-w-full truncate text-sm font-extrabold text-[#0A4C3E]">
                              {certFile ? certFile.name : 'Pilih sertifikat'}
                            </span>
                            <span className="mt-1 text-xs font-medium text-slate-500">Boleh dikosongkan jika belum punya</span>
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
                              onClick={removeCertFile}
                              className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-extrabold text-red-600 transition hover:bg-red-100"
                            >
                              Hapus Sertifikat
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium leading-5 text-amber-800">
                        KTP wajib diunggah untuk proses verifikasi admin. Sertifikat bersifat opsional sebagai dokumen pendukung petani.
                      </div>
                    </>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setStep(1)}
                      className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-extrabold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]">
                      <ArrowLeft size={15} /> Kembali
                    </button>
                    <button
                      type="submit"
                      disabled={loading || (role === 'petani' && !ktpFile)}
                      className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0A4C3E] to-[#0C6A52] text-sm font-extrabold text-white shadow-[0_15px_35px_rgba(10,76,62,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(10,76,62,0.28)] active:translate-y-0 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400">
                      {loading ? 'Memproses...' : 'Daftar Sekarang'}
                    </button>
                  </div>
                </form>
              )}

              <p className="mt-7 text-center text-sm text-slate-500">
                Sudah punya akun?{' '}
                <Link href="/login" className="font-extrabold text-[#0A4C3E] transition hover:text-[#71BC68]">
                  Masuk di sini
                </Link>
              </p>
            </div>

            <div className="mt-8 hidden justify-center gap-8 text-xs font-bold text-[#0A4C3E] lg:flex">
              <span>Tentang Kami</span>
              <span>Kebijakan Privasi</span>
              <span>Syarat &amp; Ketentuan</span>
              <span>Bantuan</span>
            </div>
          </div>
        </section>

      </div>
    </main>
  )
}