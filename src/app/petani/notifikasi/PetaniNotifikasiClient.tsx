'use client'

import { Bell, CreditCard, Info, ShoppingBag, Truck } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  title: string
  body: string
  type: string
  is_read: boolean
  reference_id: string | null
  created_at: string
}
interface Props { notifications: Notification[] }

type NotificationConfig = { icon: typeof Bell; color: string; bg: string; label: string }
const TYPE_CONFIG: Record<string, NotificationConfig> = {
  order: { icon: ShoppingBag, color: '#0B4A8B', bg: '#E7F0FF', label: 'Pesanan' },
  payment: { icon: CreditCard, color: '#166534', bg: '#E7F8EE', label: 'Pembayaran' },
  shipping: { icon: Truck, color: '#0A4C3E', bg: '#F0F8EE', label: 'Pengiriman' },
  promo: { icon: Bell, color: '#8A5B00', bg: '#FFF5D6', label: 'Promo' },
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

function groupNotifications(notifications: Notification[]) {
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  const grouped: { label: string; items: Notification[] }[] = []
  const groups: Record<string, Notification[]> = {}

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
  const unreadCount = notifications.filter(item => !item.is_read).length

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F4FAF3] px-3 pb-28 sm:px-4 md:px-6 md:pb-10" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="mx-auto w-full max-w-4xl">
        <section className="rounded-[26px] bg-white p-4 shadow-sm ring-1 ring-[#71BC68]/15 sm:rounded-[32px] sm:p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#71BC68]">Notification Center</p>
              <h1 className="mt-2 text-2xl font-black text-[#0A4C3E] md:text-3xl" style={{ fontFamily: 'Sora, sans-serif' }}>Notifikasi Toko</h1>
              <p className="mt-2 text-sm text-[#6B7C6A]">Pantau update pesanan, pembayaran, dan pengiriman dari pembeli.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:w-72">
              <div className="rounded-[24px] bg-[#F8FBF7] p-4"><p className="text-xs font-bold text-[#6B7C6A]">Total</p><p className="mt-2 text-2xl font-black text-[#0A4C3E]">{notifications.length}</p></div>
              <div className="rounded-[24px] bg-[#E7F0FF] p-4"><p className="text-xs font-bold text-[#0B4A8B]">Belum Dibaca</p><p className="mt-2 text-2xl font-black text-[#0B4A8B]">{unreadCount}</p></div>
            </div>
          </div>
        </section>

        {notifications.length === 0 ? (
          <div className="mt-5 rounded-[26px] bg-white px-4 py-14 text-center shadow-sm ring-1 ring-[#71BC68]/15 sm:rounded-[32px] sm:py-20">
            <Bell className="mx-auto mb-3" size={44} color="#9CA3AF" />
            <p className="font-black text-[#0A4C3E]">Belum ada notifikasi</p>
            <p className="mt-1 text-sm text-[#6B7C6A]">Notifikasi pesanan baru akan tampil di sini.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {grouped.map(({ label, items }) => (
              <section key={label}>
                <p className="mb-2 px-1 text-xs font-black uppercase tracking-[0.18em] text-[#8AA08A]">{label}</p>
                <div className="overflow-hidden rounded-[30px] bg-white shadow-sm ring-1 ring-[#71BC68]/15">
                  {items.map((notif, index) => {
                    const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system
                    const Icon = cfg.icon
                    return (
                      <button key={notif.id} onClick={() => notif.reference_id && router.push('/petani/pesanan')} className="flex w-full gap-3 p-4 sm:gap-4 text-left transition hover:bg-[#F8FBF7] md:p-5" style={{ borderBottom: index < items.length - 1 ? '1px solid rgba(113,188,104,0.10)' : 'none' }}>
                        <div className="flex h-10 w-10 shrink-0 sm:h-12 sm:w-12 items-center justify-center rounded-2xl" style={{ background: cfg.bg, color: cfg.color }}><Icon size={22} /></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                                {!notif.is_read && <span className="h-2 w-2 rounded-full bg-[#71BC68]" />}
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
