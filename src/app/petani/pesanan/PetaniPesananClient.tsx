'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package, Clock, Truck, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Search, Filter
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
  pending:    { label: 'Menunggu', color: '#856404', bg: '#FFF3CD', icon: Clock },
  paid:       { label: 'Dibayar', color: '#155724', bg: '#D4EDDA', icon: CheckCircle },
  processing: { label: 'Diproses', color: '#004085', bg: '#CCE5FF', icon: Package },
  shipped:    { label: 'Dikirim', color: '#0A4C3E', bg: '#D4EDDA', icon: Truck },
  done:       { label: 'Selesai', color: '#155724', bg: '#D4EDDA', icon: CheckCircle },
  cancelled:  { label: 'Dibatal', color: '#721c24', bg: '#F8D7DA', icon: XCircle },
}

const FILTER_TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'paid', label: 'Dibayar' },
  { key: 'processing', label: 'Diproses' },
  { key: 'shipped', label: 'Dikirim' },
  { key: 'done', label: 'Selesai' },
]

// Group order items by order_id
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

  const grouped = groupByOrder(orderItems)

  const filtered = grouped.filter(({ order }) => {
    if (filter !== 'all' && order.status !== filter) return false
    if (search && !order.order_number.toLowerCase().includes(search.toLowerCase()) &&
        !order.shipping_name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  async function handleUpdateStatus(orderId: string, newStatus: string) {
    setUpdating(orderId)
    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
    if (error) showToast('Gagal update status', 'error')
    else {
      showToast(`Status diubah ke ${STATUS_CONFIG[newStatus]?.label}`)
      router.refresh()
    }
    setUpdating(null)
  }

  const totalPendapatan = orderItems
    .filter(i => i.orders?.status === 'done')
    .reduce((sum, i) => sum + i.subtotal, 0)

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Header */}
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
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
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

        {/* Order list */}
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

              return (
                <div key={order.id} className="bg-white rounded-2xl overflow-hidden"
                  style={{ border: '1px solid rgba(113,188,104,0.15)' }}>

                  {/* Order header */}
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

                      {/* Shipping info */}
                      <div className="mt-3 p-3 rounded-xl" style={{ background: '#F4FAF3' }}>
                        <p className="text-xs font-bold mb-1" style={{ color: '#0A4C3E' }}>Info Pengiriman</p>
                        <p className="text-xs" style={{ color: '#6B7C6A' }}>{order.shipping_name} · {order.shipping_phone}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#6B7C6A' }}>{order.shipping_address}</p>
                        {order.tracking_number && (
                          <p className="text-xs mt-0.5 font-medium" style={{ color: '#0A4C3E' }}>
                            Resi: {order.tracking_number}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-3">
                        {order.status === 'paid' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'processing')}
                            disabled={updating === order.id}
                            className="flex-1 py-2 rounded-xl text-xs font-bold transition hover:opacity-90"
                            style={{ background: '#0A4C3E', color: '#71BC68' }}>
                            {updating === order.id ? 'Memproses...' : 'Proses Pesanan'}
                          </button>
                        )}
                        {order.status === 'processing' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'shipped')}
                            disabled={updating === order.id}
                            className="flex-1 py-2 rounded-xl text-xs font-bold transition hover:opacity-90"
                            style={{ background: '#0A4C3E', color: '#71BC68' }}>
                            {updating === order.id ? 'Memproses...' : 'Tandai Dikirim'}
                          </button>
                        )}
                        {(order.status === 'pending' || order.status === 'paid') && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                            disabled={updating === order.id}
                            className="px-4 py-2 rounded-xl text-xs font-bold"
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg"
          style={{ background: toast.type === 'success' ? '#0A4C3E' : '#dc3545', color: 'white', minWidth: '200px', textAlign: 'center' }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
