'use client'

import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react'

interface PetaniPending {
  id: string
  farm_name: string
  farm_location: string
  created_at: string
  verify_status: string
  profiles: { id: string; full_name: string; phone: string } | null
}

interface Props {
  totalPetani: number
  pendingVerifikasi: number
  approvedVerifikasi: number
  rejectedVerifikasi: number
  petaniPending: PetaniPending[]
}

function formatDate(value: string) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export default function AdminDashboardClient({
  totalPetani,
  pendingVerifikasi,
  approvedVerifikasi,
  rejectedVerifikasi,
  petaniPending,
}: Props) {
  const router = useRouter()

  const stats = [
    {
      icon: Users,
      label: 'Total Petani',
      value: totalPetani,
      tone: 'bg-blue-50 text-blue-700',
    },
    {
      icon: Clock,
      label: 'Menunggu Review',
      value: pendingVerifikasi,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      icon: UserCheck,
      label: 'Terverifikasi',
      value: approvedVerifikasi,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      icon: XCircle,
      label: 'Ditolak',
      value: rejectedVerifikasi,
      tone: 'bg-red-50 text-red-700',
    },
  ]

  return (
    <div className="min-h-screen bg-[#F5FAF4] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[30px] border border-[#0A4C3E]/10 bg-white p-5 shadow-[0_18px_60px_rgba(10,76,62,0.06)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-['Sora'] text-2xl font-extrabold tracking-[-0.5px] text-[#0A4C3E] sm:text-3xl">
                Dashboard Verifikasi Petani
              </h1>
            </div>

            <button
              onClick={() => router.push('/admin/verifikasi')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A4C3E] px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5"
            >
              Review Pengajuan
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {pendingVerifikasi > 0 && (
          <div className="mt-5 flex flex-col gap-3 rounded-[26px] border border-amber-200 bg-amber-50 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <AlertTriangle size={21} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-amber-800">
                  {pendingVerifikasi} petani menunggu verifikasi
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push('/admin/verifikasi')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-700 px-4 py-3 text-xs font-extrabold text-white transition hover:-translate-y-0.5"
            >
              Review Sekarang
              <ArrowRight size={15} />
            </button>
          </div>
        )}

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[26px] border border-[#0A4C3E]/10 bg-white p-5 shadow-[0_18px_60px_rgba(10,76,62,0.06)]"
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${stat.tone}`}>
                <stat.icon size={22} />
              </div>

              <p className="font-['Sora'] text-2xl font-extrabold text-[#0A4C3E] sm:text-3xl">
                {stat.value.toLocaleString('id-ID')}
              </p>

              <p className="mt-1 text-sm font-extrabold text-[#0A4C3E]">
                {stat.label}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-5 rounded-[30px] border border-[#0A4C3E]/10 bg-white p-5 shadow-[0_18px_60px_rgba(10,76,62,0.06)] sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-['Sora'] text-lg font-extrabold text-[#0A4C3E]">
              Antrian Verifikasi Petani
            </p>

            <button
              onClick={() => router.push('/admin/verifikasi')}
              className="inline-flex items-center justify-center gap-1 rounded-2xl bg-[#F0F8EE] px-4 py-3 text-xs font-extrabold text-[#0A4C3E] transition hover:-translate-y-0.5"
            >
              Lihat Semua
              <ArrowRight size={14} />
            </button>
          </div>

          {petaniPending.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[24px] bg-[#F8FCF7] text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <CheckCircle size={30} />
              </div>
              <p className="mt-4 text-sm font-extrabold text-[#0A4C3E]">
                Tidak ada antrian verifikasi
              </p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {petaniPending.map((petani) => (
                <button
                  key={petani.id}
                  onClick={() => router.push('/admin/verifikasi')}
                  className="flex w-full items-center gap-3 rounded-[22px] border border-[#0A4C3E]/8 bg-[#FBFEFA] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#71BC68]/40"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F0F8EE] text-sm font-extrabold text-[#0A4C3E]">
                    {petani.profiles?.full_name?.[0]?.toUpperCase() ?? 'P'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-[#0A4C3E]">
                      {petani.profiles?.full_name ?? 'Petani'}
                    </p>
                    <p className="mt-1 truncate text-xs font-medium text-[#6B7C6A]">
                      {petani.farm_name} · {petani.farm_location}
                    </p>
                    <p className="mt-1 text-[11px] font-bold text-[#8A9A89]">
                      {formatDate(petani.created_at)}
                    </p>
                  </div>

                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700 ring-1 ring-amber-200">
                    Pending
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}