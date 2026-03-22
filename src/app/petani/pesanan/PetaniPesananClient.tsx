'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package, Clock, Truck, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Search, MapPin, Hash
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Order {
  id: string; order_number: string; status: string
  payment_status: string; shipping_name: string
  shipping_phone: string; shipping_address: string
  shipping_courier: string | null; tracking_number: string | null
  created_at: string; buyer_id: string
}

interface OrderItem {
  id: string; order_id: string; product_name: string
  price: number; unit: string; quantity: number; subtotal: number
  created_at: string; orders: Order | null
}

interface Props {
  orderItems: OrderItem[]
  farmerId: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending:    { label: 'Menunggu',   color: '#856404', bg: '#FFF3CD', icon: Clock },
  paid:       { label: 'Dibayar',    color: '#155724', bg: '#D4EDDA', icon: CheckCircle },
  processing: { label: 'Diproses',   color: '#004085', bg: '#CCE5FF', icon: Package },
  shipped:    { label: 'Dikirim',    color: '#0A4C3E', bg: '#D0ECD6', icon: Truck },
  done:       { label: 'Selesai',    color: '#155724', bg: '#D4EDDA', icon: CheckCircle },
  cancelled:  { label: 'Dibatalkan', color: '#721c24', bg: '#F8D7DA', icon: XCircle },
}

const FILTER_TABS = [
  { key: 'all',        label: 'Semua' },
  { key: 'paid',       label: 'Dibayar' },
  { key: 'processing', label: 'Diproses' },
  { key: 'shipped',    label: 'Dikirim' },
  { key: 'done',       label: 'Selesai' },
]

function groupByOrder(items: OrderItem[]) {
  const map = new Map<string, { order: Order; items: OrderItem[] }>()
  for (const item of items) {
    if (!item.orders) continue
    if (!map.has(item.order_id)) {
      map.set(item.order_id, { order: item.orders, items: [] })
    }
    map.get(item.order_id)!.items.push(item)
  }
  return Array.from(map.values())
}

export default function PetaniPesananClient({ orderItems, farmerId }: Props) {
  const router = useRouter()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [updating, setUpdating] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // State untuk input resi
  const [resiInputOpen, setResiInputOpen] = useState<string | null>(null)
  const [resiValue, setResiValue] = useState('')
  const [savingResi, setSavingResi] = useState(false)

  // Local state untuk update tracking_number tanpa full refresh
  const [trackingMap, setTrackingMap] = useState<Record<string, string>>({})

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function toggleExpand(orderId: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(orderId) ? next.delete(orderId) : next.add(orderId)
      return next
    })
  }

  async function handleUpdateStatus(orderId: string, newStatus: string) {
    setUpdating(orderId)
    const supabase = createClient()

    const updateData: Record<string, any> = { status: newStatus }
    if (newStatus === 'shipped') updateData.shipped_at = new Date().toISOString()

    const { error } = await supabase.from('orders').update(updateData).eq('id', orderId)
    if (error) showToast('Gagal update status', 'error')
    else {
      showToast(`Status diubah ke: ${STATUS_CONFIG[newStatus]?.label}`)
      router.refresh()
    }
    setUpdating(null)
  }

  async function handleSimpanResi(orderId: string) {
    if (!resiValue.trim()) return
    setSavingResi(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({ tracking_number: resiValue.trim() })
      .eq('id', orderId)

    if (error) {
      showToast('Gagal menyimpan resi', 'error')
    } else {
      setTrackingMap(prev => ({ ...prev, [orderId]: resiValue.trim() }))
      showToast('Nomor resi berhasil disimpan!')
      setResiInputOpen(null)
      setResiValue('')
    }
    setSavingResi(false)
  }

  const grouped = groupByOrder(orderItems)
  const filtered = grouped.filter(({ order }) => {
    if (filter !== 'all' && order.status !== filter) return false
    if (search && !order.order_number.toLowerCase().includes(search.toLowerCase()) &&
      !order.shipping_name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalPendapatan = orderItems
    .filter(i => i.orders?.status === 'done')
    .reduce((sum, i) => sum + i.subtotal, 0)

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto px-4 py-6">

        <div className="mb-5">
          <h1 className="text-xl font-bold" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
            Pesanan Masuk
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#6B7C6A' }}>
            {grouped.length} pesanan · Pendapatan selesai: Rp {totalPendapatan.toLocaleString('id-ID')}
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white rounded-xl mb-4"
          style={{ border: '1px solid rgba(113,188,104,0.2)' }}>
          <Search size={16} color="#9CA3AF" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari nomor order atau nama pembeli..."
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: '#0A4C3E' }} />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: 'none' }}>
          {FILTER_TABS.map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition"
              style={{
                background: filter === tab.key ? '#0A4C3E' : 'white',
                color: filter === tab.key ? '#71BC68' : '#6B7C6A',
                border: '1px solid rgba(113,188,104,0.2)'
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl"
            style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
            <Package size={36} color="#ccc" className="mx-auto mb-3" />
            <p className="font-bold" style={{ color: '#0A4C3E' }}>Belum ada pesanan</p>
            <p className="text-sm mt-1" style={{ color: '#6B7C6A' }}>
              {filter !== 'all' ? 'Coba filter lain' : 'Pesanan akan muncul di sini'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(({ order, items }) => {
              const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
              const StatusIcon = cfg.icon
              const isExpanded = expanded.has(order.id)
              const totalItem = items.reduce((s, i) => s + i.subtotal, 0)
              const currentTracking = trackingMap[order.id] ?? order.tracking_number
              const isResiOpen = resiInputOpen === order.id

              return (
                <div key={order.id} className="bg-white rounded-2xl overflow-hidden"
                  style={{ border: '1px solid rgba(113,188,104,0.15)' }}>

                  {/* Header */}
                  <div className="px-4 py-3 flex items-center justify-between"
                    style={{ borderBottom: isExpanded ? '1px solid #f3f4f6' : 'none' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: cfg.bg }}>
                        <StatusIcon size={16} color={cfg.color} />
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: '#0A4C3E' }}>
                          #{order.order_number}
                        </p>
                        <p className="text-xs" style={{ color: '#6B7C6A' }}>
                          {order.shipping_name} · {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-1 rounded-full"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                      <button onClick={() => toggleExpand(order.id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4">

                      {/* Items */}
                      <div className="space-y-2 mt-3">
                        {items.map(item => (
                          <div key={item.id} className="flex items-center justify-between py-2"
                            style={{ borderBottom: '1px solid #f9f9f9' }}>
                            <div>
                              <p className="text-sm font-medium" style={{ color: '#0A4C3E' }}>{item.product_name}</p>
                              <p className="text-xs" style={{ color: '#6B7C6A' }}>
                                {item.quantity} {item.unit} × Rp {item.price.toLocaleString('id-ID')}
                              </p>
                            </div>
                            <p className="text-sm font-bold" style={{ color: '#0A4C3E' }}>
                              Rp {item.subtotal.toLocaleString('id-ID')}
                            </p>
                          </div>
                        ))}
                        <div className="flex justify-between pt-1">
                          <p className="text-sm font-bold" style={{ color: '#0A4C3E' }}>Total</p>
                          <p className="text-sm font-bold" style={{ color: '#71BC68' }}>
                            Rp {totalItem.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      {/* Info pengiriman */}
                      <div className="mt-3 p-3 rounded-xl" style={{ background: '#F4FAF3' }}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <MapPin size={13} color="#71BC68" />
                          <p className="text-xs font-bold" style={{ color: '#0A4C3E' }}>Info Pengiriman</p>
                        </div>
                        <p className="text-xs font-medium" style={{ color: '#0A4C3E' }}>
                          {order.shipping_name} · {order.shipping_phone}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#6B7C6A' }}>{order.shipping_address}</p>
                        {order.shipping_courier && (
                          <p className="text-xs mt-1" style={{ color: '#6B7C6A' }}>
                            Kurir: <span className="font-semibold" style={{ color: '#0A4C3E' }}>{order.shipping_courier}</span>
                          </p>
                        )}

                        {/* Nomor Resi Section */}
                        {(order.status === 'shipped' || order.status === 'done') && (
                          <div className="mt-2">
                            {currentTracking && !isResiOpen ? (
                              <div className="flex items-center justify-between px-3 py-2 rounded-xl"
                                style={{ background: 'white', border: '1px solid rgba(113,188,104,0.3)' }}>
                                <div>
                                  <p className="text-xs font-bold" style={{ color: '#0A4C3E' }}>No. Resi</p>
                                  <p className="text-sm font-bold tracking-wider" style={{ color: '#0A4C3E' }}>
                                    {currentTracking}
                                  </p>
                                </div>
                                {order.status === 'shipped' && (
                                  <button
                                    onClick={() => { setResiInputOpen(order.id); setResiValue(currentTracking) }}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition hover:opacity-80"
                                    style={{ background: '#F4FAF3', color: '#0A4C3E' }}>
                                    Edit
                                  </button>
                                )}
                              </div>
                            ) : order.status === 'shipped' ? (
                              !isResiOpen ? (
                                <button
                                  onClick={() => { setResiInputOpen(order.id); setResiValue('') }}
                                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition hover:opacity-80"
                                  style={{ background: 'white', color: '#0A4C3E', border: '1.5px dashed rgba(113,188,104,0.4)' }}>
                                  <Hash size={13} />
                                  + Tambah Nomor Resi
                                </button>
                              ) : null
                            ) : null}

                            {/* Input Resi Form */}
                            {isResiOpen && (
                              <div className="rounded-xl overflow-hidden"
                                style={{ border: '1.5px solid #71BC68' }}>
                                <div className="px-3 py-2.5" style={{ background: '#F4FAF3' }}>
                                  <p className="text-xs font-bold mb-2" style={{ color: '#0A4C3E' }}>
                                    Masukkan Nomor Resi
                                  </p>
                                  <input
                                    type="text"
                                    value={resiValue}
                                    onChange={e => setResiValue(e.target.value.toUpperCase())}
                                    placeholder="Contoh: JNE123456789"
                                    autoFocus
                                    className="w-full px-3 py-2 rounded-lg text-sm font-mono font-bold outline-none"
                                    style={{
                                      border: '1px solid rgba(113,188,104,0.3)',
                                      background: 'white',
                                      color: '#0A4C3E',
                                      letterSpacing: '0.05em'
                                    }}
                                    onKeyDown={e => e.key === 'Enter' && handleSimpanResi(order.id)}
                                  />
                                  <p className="text-xs mt-1.5" style={{ color: '#6B7C6A' }}>
                                    Nomor resi akan tampil di halaman transaksi pembeli
                                  </p>
                                </div>
                                <div className="flex gap-2 p-2.5" style={{ background: 'white' }}>
                                  <button
                                    onClick={() => { setResiInputOpen(null); setResiValue('') }}
                                    className="flex-1 py-2 rounded-lg text-xs font-bold"
                                    style={{ background: '#f3f4f6', color: '#6B7C6A' }}>
                                    Batal
                                  </button>
                                  <button
                                    onClick={() => handleSimpanResi(order.id)}
                                    disabled={savingResi || !resiValue.trim()}
                                    className="flex-1 py-2 rounded-lg text-xs font-bold transition hover:opacity-90"
                                    style={{
                                      background: resiValue.trim() ? '#0A4C3E' : '#ccc',
                                      color: resiValue.trim() ? '#71BC68' : 'white'
                                    }}>
                                    {savingResi ? 'Menyimpan...' : 'Simpan Resi'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-3">
                        {order.status === 'paid' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'processing')}
                            disabled={updating === order.id}
                            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition hover:opacity-90"
                            style={{ background: '#0A4C3E', color: '#71BC68' }}>
                            {updating === order.id ? 'Memproses...' : '✓ Proses Pesanan'}
                          </button>
                        )}

                        {order.status === 'processing' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'shipped')}
                            disabled={updating === order.id}
                            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition hover:opacity-90 flex items-center justify-center gap-1.5"
                            style={{ background: '#0A4C3E', color: '#71BC68' }}>
                            <Truck size={13} />
                            {updating === order.id ? 'Memproses...' : 'Tandai Sudah Dikirim'}
                          </button>
                        )}

                        {(order.status === 'pending' || order.status === 'paid') && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                            disabled={updating === order.id}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold"
                            style={{ background: '#FEE2E2', color: '#dc3545' }}>
                            Tolak
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold"
          style={{
            background: toast.type === 'success' ? '#0A4C3E' : '#dc3545',
            color: 'white', minWidth: '220px', textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
