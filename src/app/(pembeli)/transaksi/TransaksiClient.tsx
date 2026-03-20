'use client'

import { useState } from 'react'
import {
  Package, Clock, Truck, CheckCircle, XCircle,
  ChevronDown, ChevronUp, ShoppingBag
} from 'lucide-react'

interface OrderItem {
  id: string; product_name: string; price: number
  unit: string; quantity: number; subtotal: number
}

interface Order {
  id: string; order_number: string; status: string
  payment_status: string; shipping_name: string
  shipping_address: string; shipping_courier: string | null
  tracking_number: string | null; subtotal: number
  shipping_cost: number; total_amount: number
  created_at: string; paid_at: string | null
  done_at: string | null; order_items: OrderItem[]
}

interface Props { orders: Order[] }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending:    { label: 'Menunggu Pembayaran', color: '#856404', bg: '#FFF3CD', icon: Clock },
  paid:       { label: 'Sudah Dibayar', color: '#155724', bg: '#D4EDDA', icon: CheckCircle },
  processing: { label: 'Sedang Diproses', color: '#004085', bg: '#CCE5FF', icon: Package },
  shipped:    { label: 'Dalam Pengiriman', color: '#0A4C3E', bg: '#D4EDDA', icon: Truck },
  done:       { label: 'Selesai', color: '#155724', bg: '#D4EDDA', icon: CheckCircle },
  cancelled:  { label: 'Dibatalkan', color: '#721c24', bg: '#F8D7DA', icon: XCircle },
}

const FILTER_TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Menunggu' },
  { key: 'processing', label: 'Diproses' },
  { key: 'shipped', label: 'Dikirim' },
  { key: 'done', label: 'Selesai' },
  { key: 'cancelled', label: 'Dibatal' },
]

export default function TransaksiClient({ orders }: Props) {
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const filtered = orders.filter(o => filter === 'all' || o.status === filter)

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto px-4 py-5 pb-24">

        <h1 className="text-xl font-bold mb-5" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
          Transaksi Saya
        </h1>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
          {FILTER_TABS.map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition shrink-0"
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
            <ShoppingBag size={40} color="#ccc" className="mx-auto mb-3" />
            <p className="font-bold" style={{ color: '#0A4C3E' }}>Belum ada transaksi</p>
            <p className="text-sm mt-1" style={{ color: '#6B7C6A' }}>
              {filter !== 'all' ? 'Tidak ada transaksi dengan status ini' : 'Mulai belanja sekarang!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => {
              const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
              const StatusIcon = cfg.icon
              const isExp = expanded.has(order.id)
              const date = new Date(order.created_at).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'short', year: 'numeric'
              })

              return (
                <div key={order.id} className="bg-white rounded-2xl overflow-hidden"
                  style={{ border: '1px solid rgba(113,188,104,0.15)' }}>

                  {/* Header */}
                  <div className="px-4 py-3 flex items-center justify-between"
                    style={{ borderBottom: isExp ? '1px solid #f3f4f6' : 'none' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: cfg.bg }}>
                        <StatusIcon size={16} color={cfg.color} />
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: '#0A4C3E' }}>
                          #{order.order_number}
                        </p>
                        <p className="text-xs" style={{ color: '#6B7C6A' }}>{date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-1 rounded-full"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                      <button onClick={() => toggleExpand(order.id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100">
                        {isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Detail */}
                  {isExp && (
                    <div className="px-4 pb-4">
                      {/* Items */}
                      <div className="space-y-2 mt-3">
                        {order.order_items.map(item => (
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
                      </div>

                      {/* Ringkasan biaya */}
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between">
                          <p className="text-xs" style={{ color: '#6B7C6A' }}>Subtotal</p>
                          <p className="text-xs" style={{ color: '#0A4C3E' }}>Rp {order.subtotal.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="flex justify-between">
                          <p className="text-xs" style={{ color: '#6B7C6A' }}>Ongkir</p>
                          <p className="text-xs" style={{ color: '#0A4C3E' }}>Rp {order.shipping_cost.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="flex justify-between pt-1" style={{ borderTop: '1px solid #f3f4f6' }}>
                          <p className="text-sm font-bold" style={{ color: '#0A4C3E' }}>Total</p>
                          <p className="text-sm font-bold" style={{ color: '#71BC68' }}>
                            Rp {order.total_amount.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      {/* Info pengiriman */}
                      <div className="mt-3 p-3 rounded-xl" style={{ background: '#F4FAF3' }}>
                        <p className="text-xs font-bold mb-1" style={{ color: '#0A4C3E' }}>Pengiriman</p>
                        <p className="text-xs" style={{ color: '#6B7C6A' }}>{order.shipping_name}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#6B7C6A' }}>{order.shipping_address}</p>
                        {order.tracking_number && (
                          <p className="text-xs mt-1 font-medium" style={{ color: '#0A4C3E' }}>
                            No. Resi: {order.tracking_number}
                          </p>
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
    </div>
  )
}
