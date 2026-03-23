'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package, Clock, Truck, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Search, MapPin, Hash, Loader
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

const STATUS_CONFIG: Record<string, { label: string; sublabel: string; color: string; bg: string; icon: any }> = {
  pending:    { label: 'Menunggu Bayar',   sublabel: 'Belum dibayar pembeli',         color: '#856404', bg: '#FFF3CD', icon: Clock },
  paid:       { label: 'Perlu Diproses',   sublabel: 'Pembayaran masuk, segera proses', color: '#004085', bg: '#CCE5FF', icon: Package },
  processing: { label: 'Sedang Diproses',  sublabel: 'Siapkan pesanan untuk dikirim',  color: '#0A4C3E', bg: '#D0ECD6', icon: Package },
  shipped:    { label: 'Sudah Dikirim',    sublabel: 'Menunggu konfirmasi pembeli',    color: '#155724', bg: '#D4EDDA', icon: Truck },
  done:       { label: 'Selesai',          sublabel: 'Pesanan selesai',               color: '#155724', bg: '#D4EDDA', icon: CheckCircle },
  cancelled:  { label: 'Dibatalkan',       sublabel: 'Pesanan dibatalkan',            color: '#721c24', bg: '#F8D7DA', icon: XCircle },
}

const FILTER_TABS = [
  { key: 'all',        label: 'Semua' },
  { key: 'paid',       label: 'Perlu Aksi', urgent: true },
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
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null)

  // State resi
  const [resiInputOpen, setResiInputOpen] = useState<string | null>(null)
  const [resiValue, setResiValue] = useState('')
  const [savingResi, setSavingResi] = useState(false)
  const [trackingMap, setTrackingMap] = useState<Record<string, string>>({})

  // Local order status state (untuk update tanpa full refresh)
  const [statusMap, setStatusMap] = useState<Record<string, string>>({})

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

    if (error) {
      showToast('Gagal update status', 'error')
    } else {
      setStatusMap(prev => ({ ...prev, [orderId]: newStatus }))
      showToast(`Status diubah: ${STATUS_CONFIG[newStatus]?.label}`)
      setConfirmCancel(null)
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
    const currentStatus = statusMap[order.id] ?? order.status
    if (filter !== 'all' && currentStatus !== filter) return false
    if (search && !order.order_number.toLowerCase().includes(search.toLowerCase()) &&
      !order.shipping_name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const needActionCount = grouped.filter(({ order }) => {
    const s = statusMap[order.id] ?? order.status
    return s === 'paid' || s === 'processing'
  }).length

  const totalPendapatan = orderItems
    .filter(i => (statusMap[i.order_id] ?? i.orders?.status) === 'done')
    .reduce((sum, i) => sum + i.subtotal, 0)

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl font-bold" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
            Pesanan Masuk
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#6B7C6A' }}>
            {grouped.length} pesanan · Pendapatan: Rp {totalPendapatan.toLocaleString('id-ID')}
          </p>
        </div>

        {/* Alert perlu aksi */}
        {needActionCount > 0 && (
          <div className="mb-4 px-4 py-3 rounded-2xl flex items-center gap-3"
            style={{ background: '#CCE5FF', border: '1px solid rgba(0,64,133,0.2)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: '#004085' }}>
              <Package size={15} color="white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: '#004085' }}>
                {needActionCount} pesanan butuh tindakan
              </p>
              <p className="text-xs" style={{ color: '#0c5460' }}>
                Segera proses agar pembeli tidak menunggu lama
              </p>
            </div>
          </div>
        )}

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
          {FILTER_TABS.map(tab => {
            const isPaid = tab.key === 'paid'
            const count = isPaid ? needActionCount : 0
            return (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition shrink-0 relative"
                style={{
                  background: filter === tab.key ? '#0A4C3E' : 'white',
                  color: filter === tab.key ? '#71BC68' : '#6B7C6A',
                  border: `1px solid ${tab.urgent && count > 0 ? 'rgba(0,64,133,0.3)' : 'rgba(113,188,104,0.2)'}`,
                }}>
                {tab.label}
                {isPaid && count > 0 && (
                  <span className="ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: filter === tab.key ? '#71BC68' : '#CCE5FF', color: filter === tab.key ? '#0A4C3E' : '#004085' }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
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
              const currentStatus = statusMap[order.id] ?? order.status
              const cfg = STATUS_CONFIG[currentStatus] ?? STATUS_CONFIG.pending
              const StatusIcon = cfg.icon
              const isExpanded = expanded.has(order.id)
              const totalItem = items.reduce((s, i) => s + i.subtotal, 0)
              const currentTracking = trackingMap[order.id] ?? order.tracking_number
              const isResiOpen = resiInputOpen === order.id
              const isCancelConfirming = confirmCancel === order.id

              const isPaid = currentStatus === 'paid'
              const isProcessing = currentStatus === 'processing'
              const isShipped = currentStatus === 'shipped'
              const isDone = currentStatus === 'done'
              const needsAction = isPaid || isProcessing

              return (
                <div key={order.id} className="bg-white rounded-2xl overflow-hidden"
                  style={{
                    border: `1.5px solid ${needsAction ? 'rgba(0,64,133,0.25)' : 'rgba(113,188,104,0.15)'}`,
                  }}>

                  {/* Header */}
                  <div className="px-4 pt-3 pb-2">
                    <div className="flex items-center justify-between">
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
                            {order.shipping_name} · {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                          style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                        <button onClick={() => toggleExpand(order.id)}
                          className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ background: '#f3f4f6' }}>
                          {isExpanded ? <ChevronUp size={14} color="#6B7C6A" /> : <ChevronDown size={14} color="#6B7C6A" />}
                        </button>
                      </div>
                    </div>

                    {/* Sublabel + total */}
                    <p className="text-xs mt-1 ml-12" style={{ color: cfg.color, fontWeight: 500 }}>
                      {cfg.sublabel}
                    </p>
                    <div className="flex justify-between items-center mt-2 pt-2"
                      style={{ borderTop: '1px solid #f3f4f6' }}>
                      <p className="text-xs" style={{ color: '#6B7C6A' }}>
                        {items.length} produk · {order.shipping_courier ?? 'Kurir'}
                      </p>
                      <p className="text-sm font-bold" style={{ color: '#0A4C3E' }}>
                        Rp {totalItem.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  {/* ── TOMBOL AKSI LANGSUNG KELIHATAN ── */}

                  {/* PAID → Proses Pesanan */}
                  {isPaid && !isCancelConfirming && (
                    <div className="px-4 pb-3 flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'processing')}
                        disabled={updating === order.id}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold transition hover:opacity-90 flex items-center justify-center gap-2"
                        style={{ background: '#0A4C3E', color: '#71BC68' }}>
                        {updating === order.id
                          ? <><Loader size={14} className="animate-spin" /> Memproses...</>
                          : '✓ Proses Pesanan Ini'}
                      </button>
                      <button
                        onClick={() => setConfirmCancel(order.id)}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold"
                        style={{ background: '#FEE2E2', color: '#dc3545' }}>
                        Tolak
                      </button>
                    </div>
                  )}

                  {/* PROCESSING → Tandai Dikirim */}
                  {isProcessing && !isResiOpen && (
                    <div className="px-4 pb-3">
                      <button
                        onClick={() => {
                          handleUpdateStatus(order.id, 'shipped')
                          // Langsung buka input resi setelah tandai dikirim
                          setTimeout(() => setResiInputOpen(order.id), 300)
                        }}
                        disabled={updating === order.id}
                        className="w-full py-2.5 rounded-xl text-sm font-bold transition hover:opacity-90 flex items-center justify-center gap-2"
                        style={{ background: '#0A4C3E', color: '#71BC68' }}>
                        {updating === order.id
                          ? <><Loader size={14} className="animate-spin" /> Memproses...</>
                          : <><Truck size={15} /> Tandai Sudah Dikirim</>}
                      </button>
                    </div>
                  )}

                  {/* SHIPPED → Input / tampil resi */}
                  {isShipped && (
                    <div className="px-4 pb-3">
                      {currentTracking && !isResiOpen ? (
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                          style={{ background: '#F4FAF3', border: '1px solid rgba(113,188,104,0.3)' }}>
                          <div className="flex-1">
                            <p className="text-xs font-bold" style={{ color: '#0A4C3E' }}>No. Resi Pengiriman</p>
                            <p className="text-sm font-bold tracking-widest" style={{ color: '#0A4C3E' }}>
                              {currentTracking}
                            </p>
                          </div>
                          <button
                            onClick={() => { setResiInputOpen(order.id); setResiValue(currentTracking) }}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                            style={{ background: 'white', color: '#0A4C3E', border: '1px solid rgba(113,188,104,0.3)' }}>
                            Edit
                          </button>
                        </div>
                      ) : !isResiOpen ? (
                        <button
                          onClick={() => { setResiInputOpen(order.id); setResiValue('') }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
                          style={{ background: '#FFF3CD', color: '#856404', border: '1.5px dashed rgba(133,100,4,0.3)' }}>
                          <Hash size={14} />
                          + Input Nomor Resi Pengiriman
                        </button>
                      ) : null}

                      {/* Form input resi */}
                      {isResiOpen && (
                        <div className="rounded-xl overflow-hidden"
                          style={{ border: '1.5px solid #71BC68' }}>
                          <div className="px-4 py-3" style={{ background: '#F4FAF3' }}>
                            <p className="text-xs font-bold mb-2" style={{ color: '#0A4C3E' }}>
                              Input Nomor Resi Pengiriman
                            </p>
                            <input
                              type="text"
                              value={resiValue}
                              onChange={e => setResiValue(e.target.value.toUpperCase())}
                              placeholder="Contoh: JNE123456789ID"
                              autoFocus
                              onKeyDown={e => e.key === 'Enter' && handleSimpanResi(order.id)}
                              style={{
                                width: '100%', padding: '10px 12px', borderRadius: '10px',
                                border: '1.5px solid rgba(113,188,104,0.3)', background: 'white',
                                fontSize: '14px', fontWeight: 700, color: '#0A4C3E',
                                fontFamily: 'monospace', letterSpacing: '0.05em',
                                outline: 'none', boxSizing: 'border-box',
                              }}
                            />
                            <p className="text-xs mt-1.5" style={{ color: '#6B7C6A' }}>
                              Nomor resi akan ditampilkan ke pembeli
                            </p>
                          </div>
                          <div className="flex gap-2 p-3" style={{ background: 'white' }}>
                            <button
                              onClick={() => { setResiInputOpen(null); setResiValue('') }}
                              className="flex-1 py-2 rounded-lg text-xs font-bold"
                              style={{ background: '#f3f4f6', color: '#6B7C6A' }}>
                              Batal
                            </button>
                            <button
                              onClick={() => handleSimpanResi(order.id)}
                              disabled={savingResi || !resiValue.trim()}
                              className="flex-1 py-2 rounded-lg text-xs font-bold"
                              style={{
                                background: resiValue.trim() ? '#0A4C3E' : '#ccc',
                                color: resiValue.trim() ? '#71BC68' : 'white',
                              }}>
                              {savingResi ? 'Menyimpan...' : 'Simpan Resi'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* DONE → info selesai */}
                  {isDone && (
                    <div className="px-4 pb-3">
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                        style={{ background: '#D4EDDA', border: '1px solid rgba(21,87,36,0.15)' }}>
                        <CheckCircle size={14} color="#155724" />
                        <p className="text-xs font-medium" style={{ color: '#155724' }}>
                          Pesanan telah diterima pembeli · Pendapatan masuk
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Dialog konfirmasi tolak */}
                  {isCancelConfirming && (
                    <div className="mx-4 mb-3 rounded-xl overflow-hidden"
                      style={{ border: '1.5px solid #dc3545' }}>
                      <div className="px-4 py-3" style={{ background: '#FFF5F5' }}>
                        <p className="text-sm font-bold" style={{ color: '#dc3545' }}>Tolak pesanan ini?</p>
                        <p className="text-xs mt-1" style={{ color: '#6B7C6A', lineHeight: 1.5 }}>
                          Pesanan akan dibatalkan dan pembeli akan mendapat notifikasi. Tindakan ini tidak dapat dibatalkan.
                        </p>
                      </div>
                      <div className="flex gap-2 p-3" style={{ background: 'white' }}>
                        <button onClick={() => setConfirmCancel(null)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                          style={{ background: '#f3f4f6', color: '#6B7C6A' }}>
                          Kembali
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                          disabled={updating === order.id}
                          className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                          style={{ background: '#dc3545', color: 'white' }}>
                          {updating === order.id ? 'Memproses...' : 'Ya, Tolak Pesanan'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── DETAIL EXPAND ── */}
                  {isExpanded && (
                    <div className="px-4 pb-4" style={{ borderTop: '1px solid #f3f4f6' }}>

                      {/* Items */}
                      <div className="space-y-2 mt-3">
                        {items.map(item => (
                          <div key={item.id} className="flex justify-between py-2"
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
                          <p className="text-xs font-bold" style={{ color: '#0A4C3E' }}>Alamat Pengiriman</p>
                        </div>
                        <p className="text-xs font-semibold" style={{ color: '#0A4C3E' }}>
                          {order.shipping_name}
                        </p>
                        <p className="text-xs" style={{ color: '#6B7C6A' }}>{order.shipping_phone}</p>
                        <p className="text-xs mt-1" style={{ color: '#6B7C6A' }}>{order.shipping_address}</p>
                        {order.shipping_courier && (
                          <p className="text-xs mt-1" style={{ color: '#6B7C6A' }}>
                            Kurir: <span className="font-semibold" style={{ color: '#0A4C3E' }}>{order.shipping_courier}</span>
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold"
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
