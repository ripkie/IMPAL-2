'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package, Clock, Truck, CheckCircle, XCircle,
  ChevronDown, ChevronUp, ShoppingBag, MapPin,
  Copy, Check, AlertCircle, Star, CreditCard,
  Loader, ArrowRight, ReceiptText
} from 'lucide-react'

interface OrderItem {
  id: string
  product_id?: string | null
  product_name: string
  price: number
  unit: string
  quantity: number
  subtotal: number
  products?: {
    id: string
    name: string
    image_urls: string[] | null
  } | null
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

const STATUS_CONFIG: Record<string, {
  label: string; sublabel: string
  color: string; bg: string; icon: any; step: number
}> = {
  pending: {
    label: 'Menunggu Pembayaran', sublabel: 'Segera selesaikan pembayaran',
    color: '#856404', bg: '#FFF3CD', icon: Clock, step: 0,
  },
  paid: {
    label: 'Menunggu Diproses', sublabel: 'Pembayaran berhasil · petani sedang memproses',
    color: '#0A4C3E', bg: '#D0ECD6', icon: Package, step: 1,
  },
  processing: {
    label: 'Sedang Diproses', sublabel: 'Petani sedang menyiapkan pesanan',
    color: '#004085', bg: '#CCE5FF', icon: Package, step: 2,
  },
  shipped: {
    label: 'Dalam Pengiriman', sublabel: 'Pesanan sedang dalam perjalanan',
    color: '#0A4C3E', bg: '#D0ECD6', icon: Truck, step: 3,
  },
  done: {
    label: 'Selesai', sublabel: 'Pesanan telah diterima',
    color: '#155724', bg: '#D4EDDA', icon: CheckCircle, step: 4,
  },
  cancelled: {
    label: 'Dibatalkan', sublabel: 'Pesanan dibatalkan',
    color: '#721c24', bg: '#F8D7DA', icon: XCircle, step: -1,
  },
}

const FILTER_TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Belum Bayar' },
  { key: 'paid', label: 'Menunggu' },
  { key: 'processing', label: 'Diproses' },
  { key: 'shipped', label: 'Dikirim' },
  { key: 'done', label: 'Selesai' },
  { key: 'cancelled', label: 'Dibatal' },
]

const STEPS = [
  { key: 'paid', label: 'Dibayar', icon: CreditCard, minStep: 1 },
  { key: 'processing', label: 'Diproses', icon: Package, minStep: 2 },
  { key: 'shipped', label: 'Dikirim', icon: Truck, minStep: 3 },
  { key: 'done', label: 'Diterima', icon: CheckCircle, minStep: 4 },
]

function useMidtransSnap() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if ((window as any).snap) { setReady(true); return }
    const script = document.createElement('script')
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? '')
    script.onload = () => setReady(true)
    document.head.appendChild(script)
    return () => { try { document.head.removeChild(script) } catch { } }
  }, [])
  return ready
}

export default function TransaksiClient({ orders: initialOrders }: Props) {
  const router = useRouter()
  const snapReady = useMidtransSnap()
  const [orders, setOrders] = useState(initialOrders)
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [confirming, setConfirming] = useState<string | null>(null)
  const [loadingConfirm, setLoadingConfirm] = useState<string | null>(null)
  const [loadingPay, setLoadingPay] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  function toggleExpand(id: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function copyResi(resi: string, orderId: string) {
    navigator.clipboard.writeText(resi)
    setCopied(orderId)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleBayar(orderId: string) {
    if (!snapReady) { showToast('Sistem pembayaran belum siap, coba lagi', 'error'); return }
    setLoadingPay(orderId)
    try {
      const res = await fetch('/api/repay', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal memuat pembayaran')
        ; (window as any).snap.pay(data.snapToken, {
          onSuccess: async () => {
            try {
              const syncRes = await fetch('/api/payment/sync-paid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId }),
              })
              const syncData = await syncRes.json()
              if (!syncRes.ok) throw new Error(syncData.error ?? 'Gagal sinkron pembayaran')

              showToast('Pembayaran berhasil! 🎉')
              setOrders(prev => prev.map(o =>
                o.id === orderId
                  ? { ...o, status: 'paid', payment_status: 'paid', paid_at: syncData.order?.paid_at ?? new Date().toISOString() }
                  : o
              ))
            } catch (error: any) {
              showToast(error.message ?? 'Pembayaran berhasil, tapi status belum tersinkron', 'error')
            }
          },
          onPending: () => showToast('Pembayaran sedang diverifikasi...'),
          onError: () => showToast('Pembayaran gagal, silakan coba lagi', 'error'),
          onClose: () => showToast('Pembayaran dibatalkan', 'error'),
        })
    } catch (err: any) {
      showToast(err.message ?? 'Terjadi kesalahan', 'error')
    } finally {
      setLoadingPay(null)
    }
  }

  async function handleKonfirmasiDiterima(orderId: string) {
    setLoadingConfirm(orderId)
    try {
      const res = await fetch('/api/orders/confirm-received', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Gagal mengkonfirmasi pesanan')
      }

      setOrders(prev => prev.map(o =>
        o.id === orderId
          ? { ...o, status: 'done', done_at: data.order?.done_at ?? new Date().toISOString() }
          : o
      ))
      showToast('Pesanan dikonfirmasi! Produk terjual sudah diperbarui 🎉')
    } catch (error: any) {
      showToast(error.message ?? 'Gagal mengkonfirmasi pesanan', 'error')
    } finally {
      setConfirming(null)
      setLoadingConfirm(null)
    }
  }

  const filtered = orders.filter(o => filter === 'all' || o.status === filter)

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto px-4 py-5 pb-28">
        <div className="flex items-center gap-2.5 mb-5">
          <ReceiptText size={20} color="#0A4C3E" />
          <h1 className="text-xl font-bold" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
            Transaksi Saya
          </h1>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-5" style={{ scrollbarWidth: 'none' }}>
          {FILTER_TABS.map(tab => {
            const count = tab.key === 'all' ? orders.length : orders.filter(o => o.status === tab.key).length
            return (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5"
                style={{
                  background: filter === tab.key ? '#0A4C3E' : 'white',
                  color: filter === tab.key ? '#71BC68' : '#6B7C6A',
                  border: `1.5px solid ${filter === tab.key ? '#0A4C3E' : 'rgba(113,188,104,0.2)'}`,
                }}>
                {tab.label}
                {count > 0 && (
                  <span className="rounded-full px-1.5 text-xs font-bold" style={{
                    background: filter === tab.key ? 'rgba(113,188,104,0.25)' : '#f3f4f6',
                    color: filter === tab.key ? '#71BC68' : '#9CA3AF',
                    fontSize: '10px',
                  }}>{count}</span>
                )}
              </button>
            )
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl"
            style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: '#F4FAF3' }}>
              <ShoppingBag size={28} color="#9CA3AF" />
            </div>
            <p className="font-bold text-sm" style={{ color: '#0A4C3E' }}>Belum ada transaksi</p>
            <p className="text-xs mt-1 mb-4" style={{ color: '#6B7C6A' }}>
              {filter !== 'all' ? 'Tidak ada transaksi dengan status ini' : 'Mulai belanja sekarang!'}
            </p>
            {filter === 'all' && (
              <button onClick={() => router.push('/produk')}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#0A4C3E', color: '#71BC68' }}>
                Belanja Sekarang <ArrowRight size={14} />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => {
              const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
              const StatusIcon = cfg.icon
              const isExp = expanded.has(order.id)
              const isPending = order.status === 'pending'
              const isPaid = order.status === 'paid'
              const isShipped = order.status === 'shipped'
              const isDone = order.status === 'done'
              const isCancelled = order.status === 'cancelled'
              const isConfirmingThis = confirming === order.id
              const currentStep = cfg.step
              const showStepper = !isPending && !isCancelled

              const date = new Date(order.created_at).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'short', year: 'numeric'
              })

              return (
                <div key={order.id} className="bg-white rounded-2xl overflow-hidden"
                  style={{
                    border: `1.5px solid ${isPending ? 'rgba(133,100,4,0.3)' : isShipped ? 'rgba(10,76,62,0.3)' : 'rgba(113,188,104,0.15)'}`,
                    boxShadow: isPending || isShipped ? '0 2px 12px rgba(10,76,62,0.06)' : 'none',
                  }}>
                  <div className="px-4 pt-4 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: cfg.bg }}>
                          <StatusIcon size={18} color={cfg.color} />
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: '#0A4C3E' }}>
                            #{order.order_number}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{date}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>

                    <p className="text-xs mt-2 ml-13 pl-1" style={{ color: cfg.color, fontWeight: 500 }}>
                      {cfg.sublabel}
                    </p>

                    <div className="flex items-center justify-between mt-3 pt-2.5"
                      style={{ borderTop: '1px solid #f3f4f6' }}>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>
                        {order.order_items.length} item
                        {order.shipping_courier ? ` · ${order.shipping_courier.toUpperCase()}` : ''}
                      </p>
                      <p className="text-sm font-bold" style={{ color: '#0A4C3E' }}>
                        Rp {order.total_amount.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  {showStepper && (
                    <div className="px-4 pb-4 pt-1">
                      <div className="flex items-start">
                        {STEPS.map((step, idx) => {
                          const StepIcon = step.icon
                          const isDoneStep = currentStep >= step.minStep
                          const isActiveStep = currentStep === step.minStep
                          return (
                            <div key={step.key} className="flex items-center"
                              style={{ flex: idx < STEPS.length - 1 ? 1 : 'none' }}>
                              <div className="flex flex-col items-center gap-1">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                                  style={{
                                    background: isDoneStep ? '#0A4C3E' : '#f3f4f6',
                                    color: isDoneStep ? '#71BC68' : '#D1D5DB',
                                    boxShadow: isActiveStep ? '0 0 0 3px rgba(113,188,104,0.3)' : 'none',
                                  }}>
                                  {isDoneStep
                                    ? <Check size={14} strokeWidth={3} />
                                    : <StepIcon size={13} />
                                  }
                                </div>
                                <span className="text-center" style={{
                                  fontSize: '10px',
                                  color: isDoneStep ? '#0A4C3E' : '#C4C9C8',
                                  fontWeight: isActiveStep ? 700 : isDoneStep ? 600 : 400,
                                  whiteSpace: 'nowrap',
                                }}>
                                  {step.label}
                                </span>
                              </div>
                              {idx < STEPS.length - 1 && (
                                <div className="flex-1 h-0.5 mx-1 mb-5 rounded-full transition-all"
                                  style={{ background: currentStep > step.minStep ? '#0A4C3E' : '#E5E7EB' }} />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {isShipped && order.tracking_number && (
                    <div className="mx-4 mb-3 flex items-center gap-3 px-3 py-2.5 rounded-xl"
                      style={{ background: '#F4FAF3', border: '1px solid rgba(113,188,104,0.3)' }}>
                      <Truck size={14} color="#71BC68" className="shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold" style={{ color: '#6B7C6A' }}>No. Resi</p>
                        <p className="text-sm font-bold tracking-wide truncate" style={{ color: '#0A4C3E' }}>
                          {order.tracking_number}
                        </p>
                      </div>
                      <button onClick={() => copyResi(order.tracking_number!, order.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition"
                        style={{ background: copied === order.id ? '#D4EDDA' : 'white', border: '1px solid rgba(113,188,104,0.2)' }}>
                        {copied === order.id
                          ? <Check size={13} color="#155724" />
                          : <Copy size={13} color="#6B7C6A" />}
                      </button>
                    </div>
                  )}

                  {isShipped && !order.tracking_number && (
                    <div className="mx-4 mb-3 flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ background: '#FFF3CD', border: '1px solid #FFEEBA' }}>
                      <Clock size={12} color="#856404" />
                      <p className="text-xs" style={{ color: '#856404' }}>
                        Nomor resi sedang disiapkan petani
                      </p>
                    </div>
                  )}

                  {isPending && (
                    <div className="px-4 pb-4 space-y-2">
                      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
                        style={{ background: '#FFF8DC', border: '1px solid #FFEEBA' }}>
                        <Clock size={13} color="#856404" className="shrink-0 mt-0.5" />
                        <p className="text-xs leading-relaxed" style={{ color: '#856404' }}>
                          Selesaikan pembayaran sebelum pesanan kedaluwarsa
                        </p>
                      </div>
                      <button onClick={() => handleBayar(order.id)}
                        disabled={loadingPay === order.id || !snapReady}
                        className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition hover:opacity-90 active:scale-[0.98]"
                        style={{ background: '#0A4C3E', color: '#71BC68' }}>
                        {loadingPay === order.id
                          ? <><Loader size={15} className="animate-spin" /> Memuat...</>
                          : <><CreditCard size={15} /> Bayar Sekarang</>}
                      </button>
                    </div>
                  )}

                  {isPaid && (
                    <div className="px-4 pb-4">
                      <div className="flex items-center gap-3 px-3 py-3 rounded-xl"
                        style={{ background: '#D0ECD6', border: '1px solid rgba(10,76,62,0.15)' }}>
                        <CheckCircle size={16} color="#0A4C3E" className="shrink-0" />
                        <div>
                          <p className="text-xs font-bold" style={{ color: '#0A4C3E' }}>
                            Pembayaran berhasil diterima!
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: '#3B6D11' }}>
                            Petani akan segera memproses pesananmu
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isShipped && !isConfirmingThis && (
                    <div className="px-4 pb-4">
                      <button onClick={() => setConfirming(order.id)}
                        className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition hover:opacity-90 active:scale-[0.98]"
                        style={{ background: '#0A4C3E', color: '#71BC68' }}>
                        <CheckCircle size={15} /> Konfirmasi Pesanan Diterima
                      </button>
                    </div>
                  )}

                  {isShipped && isConfirmingThis && (
                    <div className="mx-4 mb-4 rounded-xl overflow-hidden"
                      style={{ border: '1.5px solid rgba(113,188,104,0.4)' }}>
                      <div className="px-4 py-3 flex items-start gap-2.5" style={{ background: '#F4FAF3' }}>
                        <AlertCircle size={14} color="#856404" className="shrink-0 mt-0.5" />
                        <p className="text-xs leading-relaxed" style={{ color: '#6B7C6A' }}>
                          Pastikan semua barang sudah kamu terima dalam kondisi baik.{' '}
                          <strong style={{ color: '#0A4C3E' }}>Tindakan ini tidak dapat dibatalkan.</strong>
                        </p>
                      </div>
                      <div className="flex gap-2 p-3" style={{ background: 'white' }}>
                        <button onClick={() => setConfirming(null)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-bold transition"
                          style={{ background: '#f3f4f6', color: '#6B7C6A' }}>
                          Batal
                        </button>
                        <button onClick={() => handleKonfirmasiDiterima(order.id)}
                          disabled={loadingConfirm === order.id}
                          className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition"
                          style={{ background: '#0A4C3E', color: '#71BC68' }}>
                          {loadingConfirm === order.id
                            ? <><Loader size={13} className="animate-spin" /> Mengkonfirmasi...</>
                            : <><Check size={13} strokeWidth={3} /> Ya, Sudah Diterima</>}
                        </button>
                      </div>
                    </div>
                  )}

                  {isDone && (
                    <div className="px-4 pb-4 flex gap-2">
                      <button onClick={() => router.push('/produk')}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold transition"
                        style={{ background: '#F4FAF3', color: '#0A4C3E', border: '1px solid rgba(113,188,104,0.3)' }}>
                        Beli Lagi
                      </button>
                      <button onClick={() => router.push(`/transaksi/${order.id}/review`)}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                        style={{ background: '#0A4C3E', color: '#71BC68' }}>
                        <Star size={12} fill="#71BC68" /> Beri Ulasan
                      </button>
                    </div>
                  )}

                  <button onClick={() => toggleExpand(order.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 transition"
                    style={{ borderTop: '1px solid #f3f4f6', color: '#9CA3AF', fontSize: '12px' }}>
                    {isExp ? <><ChevronUp size={13} /> Sembunyikan detail</> : <><ChevronDown size={13} /> Lihat detail pesanan</>}
                  </button>

                  {isExp && (
                    <div className="px-4 pb-4" style={{ borderTop: '1px solid #f3f4f6' }}>
                      <div className="space-y-3 mt-3">
                        {order.order_items.length === 0 ? (
                          <div
                            className="rounded-xl px-4 py-3 text-xs font-semibold"
                            style={{
                              background: '#FFF8DC',
                              color: '#856404',
                              border: '1px solid #FFEEBA',
                            }}
                          >
                            Detail produk tidak ditemukan.
                          </div>
                        ) : (
                          order.order_items.map(item => {
                            const imageUrl = item.products?.image_urls?.[0]

                            return (
                              <div
                                key={item.id}
                                className="flex items-center gap-3 rounded-2xl p-3"
                                style={{
                                  background: '#FAFAFA',
                                  border: '1px solid #F1F5F9',
                                }}
                              >
                                <div
                                  className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                                  style={{ background: '#F4FAF3' }}
                                >
                                  {imageUrl ? (
                                    <img
                                      src={imageUrl}
                                      alt={item.product_name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <Package size={24} color="#71BC68" />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-bold" style={{ color: '#0A4C3E' }}>
                                    {item.product_name || item.products?.name || 'Produk KiTani'}
                                  </p>
                                  <p className="mt-1 text-xs" style={{ color: '#9CA3AF' }}>
                                    {item.quantity} {item.unit} × Rp {Number(item.price ?? 0).toLocaleString('id-ID')}
                                  </p>
                                  <p className="mt-1 text-[11px] font-semibold" style={{ color: '#6B7C6A' }}>
                                    Subtotal
                                  </p>
                                </div>

                                <div className="shrink-0 text-right">
                                  <p className="text-sm font-black" style={{ color: '#0A4C3E' }}>
                                    Rp {Number(item.subtotal ?? 0).toLocaleString('id-ID')}
                                  </p>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>

                      <div className="mt-3 space-y-1.5 pb-3" style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <div className="flex justify-between">
                          <p className="text-xs" style={{ color: '#9CA3AF' }}>Subtotal</p>
                          <p className="text-xs font-medium" style={{ color: '#0A4C3E' }}>
                            Rp {order.subtotal.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="flex justify-between">
                          <p className="text-xs" style={{ color: '#9CA3AF' }}>Ongkos kirim</p>
                          <p className="text-xs font-medium" style={{ color: '#0A4C3E' }}>
                            Rp {order.shipping_cost.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="flex justify-between pt-1.5" style={{ borderTop: '1px solid #f3f4f6' }}>
                          <p className="text-sm font-bold" style={{ color: '#0A4C3E' }}>Total</p>
                          <p className="text-sm font-bold" style={{ color: '#71BC68' }}>
                            Rp {order.total_amount.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 p-3 rounded-xl" style={{ background: '#F4FAF3' }}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <MapPin size={13} color="#71BC68" />
                          <p className="text-xs font-bold" style={{ color: '#0A4C3E' }}>Alamat Pengiriman</p>
                        </div>
                        <p className="text-xs font-semibold" style={{ color: '#0A4C3E' }}>{order.shipping_name}</p>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#6B7C6A' }}>{order.shipping_address}</p>
                        {order.shipping_courier && (
                          <p className="text-xs mt-1.5" style={{ color: '#6B7C6A' }}>
                            Kurir: <span className="font-semibold" style={{ color: '#0A4C3E' }}>
                              {order.shipping_courier.toUpperCase()}
                            </span>
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

      {toast && (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap"
          style={{
            background: toast.type === 'success' ? '#0A4C3E' : '#dc3545',
            color: 'white',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}