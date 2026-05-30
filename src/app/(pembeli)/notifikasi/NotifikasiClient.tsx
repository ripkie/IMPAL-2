'use client'

import { useState, useMemo } from 'react'
import { Bell, ShoppingBag, Truck, Tag, Info, CheckCircle, CheckCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Notification {
  id: string
  title: string
  body: string
  type: string
  is_read: boolean
  created_at: string
}

interface Props {
  notifications: Notification[]
  userId: string
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  order: { icon: ShoppingBag, color: '#004085', bg: '#CCE5FF' },
  payment: { icon: CheckCircle, color: '#155724', bg: '#D4EDDA' },
  shipping: { icon: Truck, color: '#0A4C3E', bg: '#C7EDD6' },
  promo: { icon: Tag, color: '#856404', bg: '#FFF3CD' },
  system: { icon: Info, color: '#6B7C6A', bg: '#f3f4f6' },
}

function getDateGroup(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart.getTime() - 86400000)
  const weekStart = new Date(todayStart.getTime() - 6 * 86400000)

  if (date >= todayStart) return 'Hari ini'
  if (date >= yesterdayStart) return 'Kemarin'
  if (date >= weekStart) return '7 Hari Terakhir'
  return 'Lebih Lama'
}

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

export default function NotifikasiClient({ notifications: initial, userId }: Props) {
  const [notifs, setNotifs] = useState(initial)
  const [loadingAll, setLoadingAll] = useState(false)

  const unreadCount = notifs.filter(n => !n.is_read).length

  // Kelompokkan per tanggal
  const grouped = useMemo(() => {
    const ORDER = ['Hari ini', 'Kemarin', '7 Hari Terakhir', 'Lebih Lama']
    const map: Record<string, Notification[]> = {}
    for (const n of notifs) {
      const g = getDateGroup(n.created_at)
      if (!map[g]) map[g] = []
      map[g].push(n)
    }
    return ORDER.filter(k => map[k]).map(k => ({ label: k, items: map[k] }))
  }, [notifs])

  async function markOneRead(id: string) {
    const target = notifs.find(n => n.id === id)
    if (!target || target.is_read) return

    // Optimistic update
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))

    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }

  async function markAllRead() {
    if (unreadCount === 0) return
    setLoadingAll(true)

    // Optimistic update
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))

    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    setLoadingAll(false)
  }

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto px-4 py-5 pb-28">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
              Notifikasi
            </h1>
            {unreadCount > 0 && (
              <span
                className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: '#0A4C3E', color: '#71BC68', minWidth: '22px' }}
              >
                {unreadCount}
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={loadingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 disabled:opacity-50"
              style={{ background: 'rgba(113,188,104,0.12)', color: '#0A4C3E', border: '1px solid rgba(113,188,104,0.25)' }}
            >
              <CheckCheck size={13} />
              Tandai semua dibaca
            </button>
          )}
        </div>

        {/* Empty state */}
        {notifs.length === 0 ? (
          <div
            className="text-center py-16 bg-white rounded-2xl"
            style={{ border: '1px solid rgba(113,188,104,0.15)' }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: '#F4FAF3' }}
            >
              <Bell size={28} color="#9CA3AF" />
            </div>
            <p className="font-bold text-sm" style={{ color: '#0A4C3E' }}>Belum ada notifikasi</p>
            <p className="text-xs mt-1" style={{ color: '#6B7C6A' }}>Notifikasi pesanan dan promo akan muncul di sini</p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(({ label, items }) => (
              <div key={label}>
                {/* Label tanggal */}
                <p
                  className="text-xs font-semibold mb-2 px-1"
                  style={{ color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  {label}
                </p>

                <div className="space-y-2">
                  {items.map(notif => {
                    const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system
                    const Icon = cfg.icon

                    return (
                      <div
                        key={notif.id}
                        onClick={() => markOneRead(notif.id)}
                        className="flex items-start gap-3 bg-white p-4 rounded-2xl transition-all cursor-pointer"
                        style={{
                          border: `1px solid ${notif.is_read ? 'rgba(113,188,104,0.1)' : 'rgba(113,188,104,0.35)'}`,
                          background: notif.is_read ? 'white' : '#FAFFF9',
                        }}
                      >
                        {/* Icon */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: cfg.bg }}
                        >
                          <Icon size={18} color={cfg.color} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className="text-sm leading-snug"
                              style={{
                                color: '#0A4C3E',
                                fontWeight: notif.is_read ? 500 : 700,
                              }}
                            >
                              {notif.title}
                            </p>
                            {/* Unread dot */}
                            {!notif.is_read && (
                              <div
                                className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                                style={{ background: '#71BC68' }}
                              />
                            )}
                          </div>
                          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#6B7C6A' }}>
                            {notif.body}
                          </p>
                          <p className="text-xs mt-1.5" style={{ color: '#B0BAB8' }}>
                            {timeAgo(notif.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}