'use client'

import { Bell, ShoppingBag, Truck, Tag, Info, CheckCircle } from 'lucide-react'

interface Notification {
  id: string; title: string; body: string
  type: string; is_read: boolean; created_at: string
}

interface Props { notifications: Notification[] }

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  order:    { icon: ShoppingBag, color: '#004085', bg: '#CCE5FF' },
  payment:  { icon: CheckCircle, color: '#155724', bg: '#D4EDDA' },
  shipping: { icon: Truck, color: '#0A4C3E', bg: '#D4EDDA' },
  promo:    { icon: Tag, color: '#856404', bg: '#FFF3CD' },
  system:   { icon: Info, color: '#6B7C6A', bg: '#f3f4f6' },
}

export default function NotifikasiClient({ notifications }: Props) {
  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days} hari lalu`
    if (hours > 0) return `${hours} jam lalu`
    if (mins > 0) return `${mins} menit lalu`
    return 'Baru saja'
  }

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto px-4 py-5 pb-24">

        <h1 className="text-xl font-bold mb-5" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
          Notifikasi
        </h1>

        {notifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl"
            style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
            <Bell size={40} color="#ccc" className="mx-auto mb-3" />
            <p className="font-bold" style={{ color: '#0A4C3E' }}>Belum ada notifikasi</p>
            <p className="text-sm mt-1" style={{ color: '#6B7C6A' }}>Notifikasi akan muncul di sini</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notif => {
              const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system
              const Icon = cfg.icon
              return (
                <div key={notif.id}
                  className="flex items-start gap-3 bg-white p-4 rounded-2xl transition"
                  style={{
                    border: `1px solid ${notif.is_read ? 'rgba(113,188,104,0.1)' : 'rgba(113,188,104,0.3)'}`,
                    opacity: notif.is_read ? 0.85 : 1
                  }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: cfg.bg }}>
                    <Icon size={18} color={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold" style={{ color: '#0A4C3E' }}>{notif.title}</p>
                      {!notif.is_read && (
                        <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: '#71BC68' }} />
                      )}
                    </div>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#6B7C6A' }}>{notif.body}</p>
                    <p className="text-xs mt-1.5" style={{ color: '#9CA3AF' }}>{timeAgo(notif.created_at)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
