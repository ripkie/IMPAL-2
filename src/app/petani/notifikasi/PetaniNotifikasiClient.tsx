'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, ShoppingBag, CreditCard, Truck, Bell, Info, CheckCircle } from 'lucide-react'

interface Notification {
  id: string
  title: string
  body: string
  type: string
  is_read: boolean
  reference_id: string | null
  created_at: string
}

interface Props {
  notifications: Notification[]
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  order:    { icon: ShoppingBag, color: '#004085', bg: '#CCE5FF' },
  payment:  { icon: CreditCard,  color: '#155724', bg: '#D4EDDA' },
  shipping: { icon: Truck,       color: '#0A4C3E', bg: '#D0ECD6' },
  promo:    { icon: Bell,        color: '#856404', bg: '#FFF3CD' },
  system:   { icon: Info,        color: '#6B7C6A', bg: '#f3f4f6' },
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
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

export default function PetaniNotifikasiClient({ notifications }: Props) {
  const router = useRouter()

  // Group by hari
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  const grouped: { label: string; items: Notification[] }[] = []
  const groups: Record<string, Notification[]> = {}

  for (const n of notifications) {
    const d = new Date(n.created_at).toDateString()
    const label = d === today ? 'Hari Ini' : d === yesterday ? 'Kemarin' : new Date(n.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!groups[label]) {
      groups[label] = []
      grouped.push({ label, items: groups[label] })
    }
    groups[label].push(n)
  }

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 16px 100px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button onClick={() => router.back()}
            style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: '1px solid rgba(113,188,104,0.2)', cursor: 'pointer' }}>
            <ArrowLeft size={16} color="#0A4C3E" />
          </button>
          <div>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '18px', fontWeight: 700, color: '#0A4C3E', margin: 0 }}>
              Notifikasi
            </h1>
            <p style={{ fontSize: '12px', color: '#6B7C6A', margin: '2px 0 0' }}>
              {notifications.length} notifikasi
            </p>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '20px', border: '1px solid rgba(113,188,104,0.15)' }}>
            <Bell size={40} color="#e5e7eb" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontWeight: 700, color: '#0A4C3E', fontSize: '14px' }}>Belum ada notifikasi</p>
            <p style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '4px' }}>
              Notifikasi pesanan masuk akan tampil di sini
            </p>
          </div>
        ) : (
          <div>
            {grouped.map(({ label, items }) => (
              <div key={label} style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '4px' }}>
                  {label}
                </p>
                <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(113,188,104,0.15)' }}>
                  {items.map((notif, idx) => {
                    const typeCfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system
                    const Icon = typeCfg.icon
                    return (
                      <div key={notif.id}
                        style={{
                          display: 'flex', gap: '12px', padding: '14px 16px',
                          borderBottom: idx < items.length - 1 ? '1px solid #f3f4f6' : 'none',
                          background: notif.is_read ? 'white' : '#FAFFF9',
                          cursor: notif.reference_id ? 'pointer' : 'default',
                        }}
                        onClick={() => notif.reference_id && router.push('/petani/pesanan')}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: typeCfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={16} color={typeCfg.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#0A4C3E', margin: 0, lineHeight: 1.4 }}>
                              {notif.title}
                            </p>
                            <span style={{ fontSize: '11px', color: '#9CA3AF', whiteSpace: 'nowrap', flexShrink: 0 }}>
                              {timeAgo(notif.created_at)}
                            </span>
                          </div>
                          <p style={{ fontSize: '12px', color: '#6B7C6A', margin: '4px 0 0', lineHeight: 1.5 }}>
                            {notif.body}
                          </p>
                          {!notif.is_read && (
                            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#71BC68', marginTop: '6px' }} />
                          )}
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
