'use client'

import { AlertTriangle, Bell, CheckCircle2, CreditCard, Info, PackageCheck, ShoppingBag, Truck } from 'lucide-react'
import { useRouter } from 'next/navigation'

export interface FarmerNotification {
  id: string
  title: string
  body: string
  type: string
  is_read: boolean
  reference_id: string | null
  href?: string
  created_at: string
}

interface Props { notifications: FarmerNotification[] }

type NotificationConfig = { icon: typeof Bell; color: string; bg: string; label: string }
const TYPE_CONFIG: Record<string, NotificationConfig> = {
  order: { icon: ShoppingBag, color: '#0B4A8B', bg: '#E7F0FF', label: 'Pesanan' },
  payment: { icon: CreditCard, color: '#166534', bg: '#E7F8EE', label: 'Selesai' },
  shipping: { icon: Truck, color: '#0A4C3E', bg: '#F0F8EE', label: 'Pengiriman' },
  stock: { icon: AlertTriangle, color: '#8A5B00', bg: '#FFF5D6', label: 'Stok' },
  danger: { icon: AlertTriangle, color: '#C92A2A', bg: '#FFF4F4', label: 'Stok Habis' },
  system: { icon: Info, color: '#49645B', bg: '#F1F5F9', label: 'Sistem' },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Baru saja'
  if (mins < 60) return `${mins} menit lalu`
  if (hours < 24) return `${hours} jam lalu`
  if (days < 7) return `${days} hari lalu`
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function groupNotifications(notifications: FarmerNotification[]) {
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  const grouped: { label: string; items: FarmerNotification[] }[] = []
  const groups: Record<string, FarmerNotification[]> = {}

  for (const item of notifications) {
    const day = new Date(item.created_at).toDateString()
    const label = day === today ? 'Hari Ini' : day === yesterday ? 'Kemarin' : new Date(item.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long' })
    if (!groups[label]) {
      groups[label] = []
      grouped.push({ label, items: groups[label] })
    }
    groups[label].push(item)
  }
  return grouped
}

export default function PetaniNotifikasiClient({ notifications }: Props) {
  const router = useRouter()
  const grouped = groupNotifications(notifications)
  const actionCount = notifications.filter(item => !item.is_read).length
  const orderCount = notifications.filter(item => item.type === 'order' || item.type === 'shipping').length
  const stockCount = notifications.filter(item => item.type === 'stock' || item.type === 'danger').length

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F4FAF3] px-3 pb-28 sm:px-4 md:px-6 md:pb-10" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="mx-auto w-full max-w-4xl">
        <section className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-[#71BC68]/15 sm:rounded-[32px] sm:p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#71BC68] sm:text-xs">Notification Center</p>
              <h1 className="mt-2 text-2xl font-black text-[#0A4C3E] md:text-3xl" style={{ fontFamily: 'Sora, sans-serif' }}>Notifikasi Toko</h1>
              <p className="mt-2 text-sm text-[#6B7C6A]">Notifikasi otomatis dari pesanan, pengiriman, dan stok produk.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:w-[360px] sm:gap-3">
              <div className="rounded-[20px] bg-[#F8FBF7] p-3 sm:rounded-[24px] sm:p-4"><p className="text-[10px] font-bold text-[#6B7C6A] sm:text-xs">Total</p><p className="mt-1 text-xl font-black text-[#0A4C3E] sm:text-2xl">{notifications.length}</p></div>
              <div className="rounded-[20px] bg-[#E7F0FF] p-3 sm:rounded-[24px] sm:p-4"><p className="text-[10px] font-bold text-[#0B4A8B] sm:text-xs">Perlu Aksi</p><p className="mt-1 text-xl font-black text-[#0B4A8B] sm:text-2xl">{actionCount}</p></div>
              <div className="rounded-[20px] bg-[#FFF5D6] p-3 sm:rounded-[24px] sm:p-4"><p className="text-[10px] font-bold text-[#8A5B00] sm:text-xs">Stok</p><p className="mt-1 text-xl font-black text-[#8A5B00] sm:text-2xl">{stockCount}</p></div>
            </div>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-[#71BC68]/15">
            <PackageCheck size={20} color="#0A4C3E" />
            <p className="mt-2 text-xs font-bold text-[#6B7C6A]">Update Pesanan</p>
            <p className="text-xl font-black text-[#0A4C3E]">{orderCount}</p>
          </div>
          <div className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-[#71BC68]/15">
            <AlertTriangle size={20} color="#8A5B00" />
            <p className="mt-2 text-xs font-bold text-[#6B7C6A]">Stok Menipis</p>
            <p className="text-xl font-black text-[#0A4C3E]">{stockCount}</p>
          </div>
          <div className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-[#71BC68]/15">
            <CheckCircle2 size={20} color="#166534" />
            <p className="mt-2 text-xs font-bold text-[#6B7C6A]">Selesai</p>
            <p className="text-xl font-black text-[#0A4C3E]">{notifications.filter(item => item.type === 'payment').length}</p>
          </div>
          <div className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-[#71BC68]/15">
            <Bell size={20} color="#0B4A8B" />
            <p className="mt-2 text-xs font-bold text-[#6B7C6A]">Perlu Dilihat</p>
            <p className="text-xl font-black text-[#0A4C3E]">{actionCount}</p>
          </div>
        </section>

        {notifications.length === 0 ? (
          <div className="mt-5 rounded-[26px] bg-white px-4 py-14 text-center shadow-sm ring-1 ring-[#71BC68]/15 sm:rounded-[32px] sm:py-20">
            <Bell className="mx-auto mb-3" size={44} color="#9CA3AF" />
            <p className="font-black text-[#0A4C3E]">Belum ada notifikasi</p>
            <p className="mt-1 text-sm text-[#6B7C6A]">Pesanan baru dan stok menipis akan tampil otomatis di sini.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {grouped.map(({ label, items }) => (
              <section key={label}>
                <p className="mb-2 px-1 text-xs font-black uppercase tracking-[0.18em] text-[#8AA08A]">{label}</p>
                <div className="overflow-hidden rounded-[26px] bg-white shadow-sm ring-1 ring-[#71BC68]/15 sm:rounded-[30px]">
                  {items.map((notif, index) => {
                    const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system
                    const Icon = cfg.icon
                    return (
                      <button key={notif.id} onClick={() => notif.href && router.push(notif.href)} className="flex w-full gap-3 p-4 text-left transition hover:bg-[#F8FBF7] md:p-5" style={{ borderBottom: index < items.length - 1 ? '1px solid rgba(113,188,104,0.10)' : 'none' }}>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl sm:h-12 sm:w-12" style={{ background: cfg.bg, color: cfg.color }}><Icon size={22} /></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                                {!notif.is_read && <span className="rounded-full bg-[#71BC68] px-2 py-0.5 text-[9px] font-black uppercase text-white">Aksi</span>}
                              </div>
                              <p className="mt-2 font-black text-[#0A4C3E]">{notif.title}</p>
                            </div>
                            <span className="text-xs font-bold text-[#9CA3AF]">{timeAgo(notif.created_at)}</span>
                          </div>
                          <p className="mt-1 text-sm leading-6 text-[#6B7C6A]">{notif.body}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
