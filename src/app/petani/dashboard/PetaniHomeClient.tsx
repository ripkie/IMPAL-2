'use client'

import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Inbox,
  Package,
  Plus,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Truck,
  Wallet,
} from 'lucide-react'
import type { Notification, Profile } from '@/types'

interface OrderProduct {
  id: string
  product_id?: string | null
  product_name: string
  quantity: number
  subtotal: number
}

interface OrderSummary {
  id: string
  order_number: string
  status: string
  payment_status?: string | null
  created_at: string
  tracking_number?: string | null
  total: number
  total_items: number
  items: OrderProduct[]
}

interface StokItem {
  id: string
  name: string
  stock: number
  unit: string
}

interface ProdukTerlarisItem {
  name: string
  sold: number
  revenue: number
}

interface Props {
  profile: Profile
  totalProduk: number
  totalPendapatan: number
  revenuePaidOrDone: number
  totalProdukTerjual: number
  totalPesanan: number
  pesananTerbaru: OrderSummary[]
  notifikasi: Notification[]
  stokMenipis: StokItem[]
  produkTerlaris: ProdukTerlarisItem[]
  pesananPerluAksi: number
  pesananPerluProses: number
  pesananDiproses: number
  pesananDikirim: number
  pesananSelesai: number
  pesananDibatalkan: number
  pesananBelumBayar: number
}

const statusLabel: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: 'Belum Bayar', bg: '#FFF5D6', color: '#8A5B00' },
  paid: { label: 'Perlu Diproses', bg: '#E7F0FF', color: '#0B4A8B' },
  processing: { label: 'Diproses', bg: '#E7F8EE', color: '#0A4C3E' },
  shipped: { label: 'Dikirim', bg: '#E7F8EE', color: '#166534' },
  done: { label: 'Selesai', bg: '#E7F8EE', color: '#166534' },
  cancelled: { label: 'Dibatalkan', bg: '#FFE8E8', color: '#B42318' },
}

function formatRp(value: number) {
  return `Rp ${Number(value ?? 0).toLocaleString('id-ID')}`
}

function formatDate(value?: string) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PetaniHomeClient({
  profile,
  totalProduk,
  totalPendapatan,
  revenuePaidOrDone,
  totalProdukTerjual,
  totalPesanan,
  pesananTerbaru,
  notifikasi,
  stokMenipis,
  produkTerlaris,
  pesananPerluAksi,
  pesananPerluProses,
  pesananDiproses,
  pesananDikirim,
  pesananSelesai,
  pesananDibatalkan,
  pesananBelumBayar,
}: Props) {
  const router = useRouter()
  const hour = new Date().getHours()
  const salam = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Petani'

  const activeRevenue = revenuePaidOrDone || totalPendapatan
  const avgOrder = totalPesanan > 0 ? Math.round(activeRevenue / totalPesanan) : 0

  const overviewCards = [
    {
      title: 'Omzet Terkonfirmasi',
      value: formatRp(activeRevenue),
      note: 'Dari order sudah bayar sampai selesai',
      icon: Wallet,
    },
    {
      title: 'Pendapatan Selesai',
      value: formatRp(totalPendapatan),
      note: 'Order yang sudah diterima pembeli',
      icon: TrendingUp,
    },
    {
      title: 'Produk Terjual',
      value: `${totalProdukTerjual}`,
      note: 'Total item dari transaksi selesai',
      icon: ShoppingBag,
    },
    {
      title: 'Rata-rata Order',
      value: formatRp(avgOrder),
      note: 'Estimasi nilai per transaksi',
      icon: ClipboardList,
    },
  ]

  const statusCards = [
    { title: 'Belum Bayar', value: pesananBelumBayar, icon: Clock3, hint: 'Menunggu pembayaran' },
    { title: 'Perlu Diproses', value: pesananPerluProses, icon: Package, hint: 'Segera siapkan pesanan' },
    { title: 'Diproses', value: pesananDiproses, icon: ClipboardList, hint: 'Sedang dikemas' },
    { title: 'Dikirim', value: pesananDikirim, icon: Truck, hint: 'Dalam perjalanan' },
    { title: 'Selesai', value: pesananSelesai, icon: CheckCircle2, hint: 'Diterima pembeli' },
    { title: 'Dibatalkan', value: pesananDibatalkan, icon: AlertTriangle, hint: 'Order batal' },
  ]

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F4FAF3] px-3 pb-28 sm:px-4 md:px-6 md:pb-10" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="mx-auto w-full max-w-6xl">
        <section className="relative overflow-hidden rounded-[24px] bg-[#0A4C3E] p-3 shadow-[0_24px_70px_rgba(10,76,62,0.22)] sm:rounded-[28px] sm:p-5 md:p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#71BC68]/15" />
          <div className="absolute bottom-0 right-12 h-24 w-24 rounded-full bg-white/5" />

          <div className="relative grid gap-3 sm:gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-[#B9E8B4] ring-1 ring-white/10">
                <Sparkles size={14} /> Seller Performance Center
              </div>
              <p className="text-xs font-medium text-white/65 sm:text-sm">{salam}, {firstName}</p>
              <h1 className="mt-1 max-w-2xl text-xl font-extrabold leading-tight text-white sm:text-3xl md:text-4xl" style={{ fontFamily: 'Sora, sans-serif' }}>
                Pantau penjualan toko tani kamu dalam satu layar.
              </h1>
              <p className="mt-2 hidden max-w-xl text-sm leading-6 text-white/65 sm:block md:text-base">
                Lihat omzet, pesanan yang perlu diproses, stok menipis, dan produk terlaris tanpa pindah-pindah halaman.
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:flex sm:flex-wrap sm:gap-3">
                <button onClick={() => router.push('/petani/pesanan')} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#71BC68] sm:w-auto px-3 py-2.5 text-xs sm:px-5 sm:py-3 sm:text-sm font-extrabold text-[#0A4C3E] transition hover:-translate-y-0.5">
                  Kelola Pesanan <ArrowRight size={17} />
                </button>
                <button onClick={() => router.push('/petani/produk')} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 sm:w-auto px-3 py-2.5 text-xs sm:px-5 sm:py-3 sm:text-sm font-extrabold text-white ring-1 ring-white/15 transition hover:-translate-y-0.5">
                  <Plus size={17} /> Tambah Produk
                </button>
              </div>
            </div>

            <div className="rounded-[22px] bg-white/10 p-3 ring-1 ring-white/15 sm:rounded-[28px] sm:p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">Ringkasan Penjualan</p>
                <button onClick={() => router.push('/petani/notifikasi')} className="relative rounded-2xl bg-white/10 p-2 text-white">
                  <Bell size={18} />
                  {notifikasi.length > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-[#71BC68] px-1.5 py-0.5 text-[10px] font-black text-[#0A4C3E]">{notifikasi.length > 9 ? '9+' : notifikasi.length}</span>}
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
                <div className="rounded-2xl bg-white p-3 sm:rounded-3xl sm:p-4">
                  <p className="text-xs font-bold text-[#6B7C6A]">Total Pesanan</p>
                  <p className="mt-1 text-xl font-black sm:mt-2 sm:text-2xl text-[#0A4C3E]" style={{ fontFamily: 'Sora, sans-serif' }}>{totalPesanan}</p>
                </div>
                <div className="rounded-2xl bg-white p-3 sm:rounded-3xl sm:p-4">
                  <p className="text-xs font-bold text-[#6B7C6A]">Perlu Aksi</p>
                  <p className="mt-1 text-xl font-black sm:mt-2 sm:text-2xl text-[#0B4A8B]" style={{ fontFamily: 'Sora, sans-serif' }}>{pesananPerluAksi}</p>
                </div>
              </div>

              <div className="mt-2 rounded-2xl bg-white p-3 sm:mt-3 sm:rounded-3xl sm:p-4">
                <p className="text-xs font-bold text-[#6B7C6A]">Omzet Terkonfirmasi</p>
                <p className="mt-1 text-xl font-black text-[#0A4C3E] sm:mt-2 sm:text-2xl" style={{ fontFamily: 'Sora, sans-serif' }}>{formatRp(activeRevenue)}</p>
                <p className="mt-1 hidden text-xs font-semibold text-[#8AA08A] sm:block">Termasuk order dibayar, diproses, dikirim, dan selesai</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3 xl:grid-cols-4">
          {overviewCards.map(item => (
            <div key={item.title} className="rounded-[20px] border border-[#71BC68]/15 bg-white p-3 sm:rounded-[28px] sm:p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#6B7C6A]">{item.title}</p>
                  <p className="mt-2 text-2xl font-black text-[#0A4C3E]" style={{ fontFamily: 'Sora, sans-serif' }}>{item.value}</p>
                  <p className="mt-1 hidden text-xs font-medium text-[#8AA08A] sm:block">{item.note}</p>
                </div>
                <div className="hidden h-12 w-12 sm:flex shrink-0 items-center justify-center rounded-2xl bg-[#F0F8EE] text-[#0A4C3E]">
                  <item.icon size={22} />
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-3 rounded-[24px] sm:mt-5 sm:rounded-[30px] border border-[#71BC68]/15 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-[#0A4C3E]" style={{ fontFamily: 'Sora, sans-serif' }}>Monitoring Status Pesanan</h2>
              <p className="text-sm text-[#6B7C6A]">Supaya jelas mana yang harus diproses, dikirim, atau sudah selesai.</p>
            </div>
            <button onClick={() => router.push('/petani/pesanan')} className="inline-flex items-center gap-1 rounded-2xl bg-[#F0F8EE] px-4 py-2 text-sm font-bold text-[#0A4C3E]">Buka pesanan <ArrowRight size={15} /></button>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-6">
            {statusCards.map(item => (
              <button key={item.title} onClick={() => router.push('/petani/pesanan')} className="rounded-[18px] bg-[#F8FBF7] p-2 text-left sm:rounded-[22px] sm:p-4 transition hover:-translate-y-0.5 hover:bg-[#F0F8EE]">
                <div className="mb-2 hidden h-10 w-10 sm:flex items-center justify-center rounded-2xl bg-white text-[#0A4C3E]">
                  <item.icon size={18} />
                </div>
                <p className="text-2xl font-black text-[#0A4C3E]" style={{ fontFamily: 'Sora, sans-serif' }}>{item.value}</p>
                <p className="mt-1 text-[11px] font-extrabold sm:text-sm text-[#0A4C3E]">{item.title}</p>
                <p className="mt-0.5 hidden text-xs text-[#8AA08A] sm:block">{item.hint}</p>
              </button>
            ))}
          </div>
        </section>

        {pesananPerluAksi > 0 && (
          <button onClick={() => router.push('/petani/pesanan')} className="mt-5 flex w-full items-center gap-4 rounded-[28px] border border-[#0B4A8B]/10 bg-[#E7F0FF] p-4 text-left transition hover:-translate-y-0.5">
            <div className="hidden h-12 w-12 sm:flex shrink-0 items-center justify-center rounded-2xl bg-[#0B4A8B] text-white"><Package size={21} /></div>
            <div className="flex-1">
              <p className="font-extrabold text-[#0B4A8B]">{pesananPerluAksi} pesanan butuh tindakan</p>
              <p className="mt-1 text-sm text-[#49645B]">Prioritaskan order paid/diproses supaya pembeli cepat menerima pesanan.</p>
            </div>
            <ArrowRight size={18} color="#0B4A8B" />
          </button>
        )}

        <section className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
          <div className="rounded-[30px] border border-[#71BC68]/15 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-black text-[#0A4C3E]" style={{ fontFamily: 'Sora, sans-serif' }}>Pesanan Terbaru</h2>
                <p className="text-sm text-[#6B7C6A]">Order terbaru, nominal, item, dan statusnya.</p>
              </div>
              <button onClick={() => router.push('/petani/pesanan')} className="hidden items-center gap-1 rounded-2xl bg-[#F0F8EE] px-4 py-2 text-sm font-bold text-[#0A4C3E] md:flex">Lihat semua <ArrowRight size={15} /></button>
            </div>

            {pesananTerbaru.length === 0 ? (
              <div className="rounded-[24px] bg-[#F8FBF7] py-14 text-center">
                <Inbox className="mx-auto mb-3" size={34} color="#9CA3AF" />
                <p className="font-extrabold text-[#0A4C3E]">Belum ada pesanan</p>
                <p className="mt-1 text-sm text-[#6B7C6A]">Pesanan baru akan muncul di sini.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pesananTerbaru.map(order => {
                  const cfg = statusLabel[order.status] ?? statusLabel.pending
                  const itemNames = order.items.map(item => `${item.quantity}× ${item.product_name}`).join(', ')

                  return (
                    <button key={order.id} onClick={() => router.push('/petani/pesanan')} className="grid w-full gap-3 rounded-[24px] border border-[#71BC68]/15 bg-[#F8FBF7] p-4 text-left transition hover:bg-white hover:shadow-md sm:grid-cols-[1fr_auto] sm:items-center">
                      <div className="flex min-w-0 gap-4">
                        <div className="hidden h-12 w-12 sm:flex shrink-0 items-center justify-center rounded-2xl bg-white text-[#0A4C3E]"><ShoppingBag size={21} /></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-extrabold text-[#0A4C3E]">{order.order_number}</p>
                            <span className="rounded-full px-3 py-1 text-xs font-black" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                          </div>
                          <p className="mt-1 truncate text-sm font-semibold text-[#6B7C6A]">{itemNames || `${order.total_items} item`}</p>
                          <p className="mt-1 text-xs text-[#8AA08A]">{formatDate(order.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs font-bold text-[#8AA08A]">Total</p>
                        <p className="text-lg font-black text-[#0A4C3E]" style={{ fontFamily: 'Sora, sans-serif' }}>{formatRp(order.total)}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <div className="rounded-[30px] border border-[#71BC68]/15 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-[#0A4C3E]" style={{ fontFamily: 'Sora, sans-serif' }}>Produk Terlaris</h2>
              <p className="mt-1 text-sm text-[#6B7C6A]">Produk yang paling banyak terjual dari order selesai.</p>

              {produkTerlaris.length === 0 ? (
                <div className="mt-4 rounded-[22px] bg-[#F8FBF7] p-4 text-sm font-bold text-[#6B7C6A]">Belum ada produk terjual.</div>
              ) : (
                <div className="mt-4 space-y-3">
                  {produkTerlaris.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="rounded-[22px] bg-[#F8FBF7] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-[#0A4C3E]">{index + 1}. {item.name}</p>
                          <p className="mt-1 text-xs font-semibold text-[#8AA08A]">{item.sold} terjual</p>
                        </div>
                        <p className="shrink-0 text-sm font-black text-[#0A4C3E]">{formatRp(item.revenue)}</p>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                        <div className="h-full rounded-full bg-[#71BC68]" style={{ width: `${Math.max(10, Math.min(100, item.sold * 8))}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[30px] border border-[#71BC68]/15 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle size={18} color="#B7791F" />
                <h2 className="text-lg font-black text-[#0A4C3E]" style={{ fontFamily: 'Sora, sans-serif' }}>Stok Menipis</h2>
              </div>
              {stokMenipis.length === 0 ? (
                <div className="rounded-[22px] bg-[#F8FBF7] p-4 text-sm font-bold text-[#6B7C6A]">Semua stok masih aman.</div>
              ) : (
                <div className="space-y-2">
                  {stokMenipis.map(item => (
                    <button key={item.id} onClick={() => router.push('/petani/produk')} className="flex w-full items-center justify-between gap-3 rounded-[20px] bg-[#FFF8E8] p-3 text-left transition hover:-translate-y-0.5">
                      <p className="text-sm font-extrabold text-[#0A4C3E]">{item.name}</p>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#8A5B00]">{item.stock} {item.unit}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[30px] border border-[#71BC68]/15 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-[#0A4C3E]" style={{ fontFamily: 'Sora, sans-serif' }}>Aksi Cepat</h2>
              <div className="mt-4 grid gap-3">
                {[
                  { label: 'Tambah produk baru', desc: 'Upload foto, harga, dan stok.', icon: Plus, href: '/petani/produk' },
                  { label: 'Kelola pesanan', desc: 'Proses dan kirim pesanan.', icon: ClipboardList, href: '/petani/pesanan' },
                  { label: 'Edit profil toko', desc: 'Rapikan identitas toko tani.', icon: CheckCircle2, href: '/petani/profil' },
                ].map(action => (
                  <button key={action.label} onClick={() => router.push(action.href)} className="flex items-center gap-3 rounded-[22px] bg-[#F8FBF7] p-4 text-left transition hover:-translate-y-0.5 hover:bg-[#F0F8EE]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0A4C3E]"><action.icon size={18} /></div>
                    <div className="flex-1">
                      <p className="text-sm font-extrabold text-[#0A4C3E]">{action.label}</p>
                      <p className="mt-0.5 text-xs text-[#6B7C6A]">{action.desc}</p>
                    </div>
                    <ArrowRight size={16} color="#8AA08A" />
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}
