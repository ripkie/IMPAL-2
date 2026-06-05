'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp, Clock, Download, MapPin, Package, Search, Truck, XCircle } from 'lucide-react'

interface Order {
  id: string
  order_number: string
  status: string
  payment_status: string
  shipping_name: string
  shipping_phone: string
  shipping_address: string
  shipping_courier: string | null
  tracking_number: string | null
  created_at: string
  buyer_id: string
}
interface OrderItem {
  id: string
  order_id: string
  product_name: string
  price: number
  unit: string
  quantity: number
  subtotal: number
  created_at: string
  orders: Order | null
}
interface Props { orderItems: OrderItem[]; farmerId: string }

type StatusConfig = { label: string; sublabel: string; bg: string; color: string; icon: typeof Clock }
const STATUS: Record<string, StatusConfig> = {
  pending: { label: 'Menunggu Bayar', sublabel: 'Pembeli belum menyelesaikan pembayaran', bg: '#FFF5D6', color: '#8A5B00', icon: Clock },
  paid: { label: 'Perlu Diproses', sublabel: 'Pembayaran berhasil, segera siapkan pesanan', bg: '#E7F0FF', color: '#0B4A8B', icon: Package },
  processing: { label: 'Sedang Diproses', sublabel: 'Pesanan sedang disiapkan untuk dikirim', bg: '#E7F8EE', color: '#0A4C3E', icon: Package },
  shipped: { label: 'Dikirim', sublabel: 'Pesanan sedang dalam perjalanan', bg: '#EEF2FF', color: '#3730A3', icon: Truck },
  done: { label: 'Selesai', sublabel: 'Pesanan diterima pembeli', bg: '#E7F8EE', color: '#166534', icon: CheckCircle2 },
  cancelled: { label: 'Dibatalkan', sublabel: 'Pesanan telah dibatalkan', bg: '#FFE8E8', color: '#B42318', icon: XCircle },
}
const TABS = [
  { key: 'all', label: 'Semua' }, { key: 'paid', label: 'Perlu Aksi' }, { key: 'processing', label: 'Diproses' }, { key: 'shipped', label: 'Dikirim' }, { key: 'done', label: 'Selesai' },
]

function formatRp(value: number) { return `Rp ${value.toLocaleString('id-ID')}` }
function formatDate(value: string) { return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }

function statusLabel(status: string) {
  return STATUS[status]?.label ?? status
}

function escapeExcelCell(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
}

function buildExcelTable(rows: Array<Record<string, unknown>>) {
  const headers = [
    'Nomor Transaksi',
    'Tanggal',
    'Nama Pembeli',
    'No HP',
    'Produk',
    'Jumlah',
    'Satuan',
    'Harga Satuan',
    'Subtotal',
    'Status Pesanan',
    'Status Pembayaran',
    'Nomor Resi',
    'Kurir',
    'Alamat Pengiriman',
  ]

  const body = rows.map(row => `
    <tr>
      ${headers.map(header => `<td>${escapeExcelCell(row[header])}</td>`).join('')}
    </tr>
  `).join('')

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Laporan Penjualan</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body>
        <table border="1">
          <thead>
            <tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </body>
    </html>
  `
}
function generateTrackingNumber(order: Order) {
  const courier = (order.shipping_courier || 'KTN')
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase()
    .slice(0, 3) || 'KTN'
  const orderCode = order.order_number
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase()
    .slice(-6)
    .padStart(6, '0')
  const dateCode = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  const randomCode = Math.floor(1000 + Math.random() * 9000)
  return `${courier}${dateCode}${orderCode}${randomCode}`
}

function groupByOrder(items: OrderItem[]) {
  const map = new Map<string, { order: Order; items: OrderItem[] }>()
  for (const item of items) {
    if (!item.orders) continue
    if (!map.has(item.order_id)) map.set(item.order_id, { order: item.orders, items: [] })
    map.get(item.order_id)!.items.push(item)
  }
  return Array.from(map.values())
}

export default function PetaniPesananClient({ orderItems }: Props) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [updating, setUpdating] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null)
  const [trackingMap, setTrackingMap] = useState<Record<string, string>>({})
  const [statusMap, setStatusMap] = useState<Record<string, string>>({})

  const grouped = useMemo(() => groupByOrder(orderItems), [orderItems])
  const needActionCount = grouped.filter(({ order }) => ['paid', 'processing'].includes(statusMap[order.id] ?? order.status)).length
  const revenue = orderItems.filter(i => (statusMap[i.order_id] ?? i.orders?.status) === 'done').reduce((sum, i) => sum + i.subtotal, 0)
  const filtered = grouped.filter(({ order }) => {
    const currentStatus = statusMap[order.id] ?? order.status
    const q = search.toLowerCase()
    const matchesSearch = !q || order.order_number.toLowerCase().includes(q) || order.shipping_name.toLowerCase().includes(q)
    const matchesFilter = filter === 'all' || currentStatus === filter
    return matchesSearch && matchesFilter
  })

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


  function handleDownloadExcel() {
    const source = filtered.length > 0 ? filtered : grouped
    const rows = source.flatMap(({ order, items }) => {
      const currentStatus = statusMap[order.id] ?? order.status
      const tracking = trackingMap[order.id] ?? order.tracking_number ?? ''
      return items.map(item => ({
        'Nomor Transaksi': order.order_number,
        'Tanggal': formatDate(order.created_at),
        'Nama Pembeli': order.shipping_name,
        'No HP': order.shipping_phone,
        'Produk': item.product_name,
        'Jumlah': item.quantity,
        'Satuan': item.unit,
        'Harga Satuan': item.price,
        'Subtotal': item.subtotal,
        'Status Pesanan': statusLabel(currentStatus),
        'Status Pembayaran': order.payment_status,
        'Nomor Resi': tracking,
        'Kurir': order.shipping_courier ?? '',
        'Alamat Pengiriman': order.shipping_address,
      }))
    })

    if (rows.length === 0) {
      showToast('Tidak ada data untuk diunduh', 'error')
      return
    }

    const html = buildExcelTable(rows)
    const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `laporan-penjualan-kitani-${date}.xls`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('Laporan Excel berhasil diunduh')
  }

  async function handleUpdateStatus(order: Order, newStatus: string) {
    setUpdating(order.id)

    try {
      const res = await fetch('/api/petani/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, status: newStatus }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal update status')

      const updatedStatus = data.order?.status ?? newStatus
      const updatedTrackingNumber = data.order?.tracking_number ?? null

      setStatusMap(prev => ({ ...prev, [order.id]: updatedStatus }))
      if (updatedTrackingNumber) {
        setTrackingMap(prev => ({ ...prev, [order.id]: updatedTrackingNumber }))
      }
      setConfirmCancel(null)
      showToast(
        updatedStatus === 'shipped'
          ? `Pesanan dikirim. Resi otomatis: ${updatedTrackingNumber}`
          : `Status diubah: ${STATUS[updatedStatus]?.label ?? updatedStatus}`
      )
    } catch (error: any) {
      showToast(error.message ?? 'Gagal update status', 'error')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F4FAF3] px-3 pb-28 sm:px-4 md:px-6 md:pb-10" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="mx-auto w-full max-w-6xl">
        <section className="rounded-[24px] bg-white p-3 sm:rounded-[26px] sm:p-4 shadow-sm ring-1 ring-[#71BC68]/15 sm:rounded-[32px] sm:p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#71BC68]">Order Management</p>
              <h1 className="mt-1 text-xl sm:mt-2 sm:text-2xl font-black text-[#0A4C3E] md:text-3xl" style={{ fontFamily: 'Sora, sans-serif' }}>Pesanan Masuk</h1>
              <p className="mt-1 text-xs text-[#6B7C6A] sm:mt-2 sm:text-sm">Proses, kirim, pantau status pesanan, dan unduh laporan penjualan.</p>
              <button
                type="button"
                onClick={handleDownloadExcel}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0A4C3E] px-4 py-3 text-xs font-black text-[#71BC68] transition hover:bg-[#083C32] sm:w-auto"
              >
                <Download size={16} />
                Download Excel
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:w-[360px]">
              <div className="rounded-[18px] bg-[#F8FBF7] p-3 sm:rounded-[24px] sm:p-4"><p className="text-xs font-bold text-[#6B7C6A]">Total Pesanan</p><p className="mt-2 text-2xl font-black text-[#0A4C3E]">{grouped.length}</p></div>
              <div className="rounded-[18px] bg-[#E7F0FF] p-3 sm:rounded-[24px] sm:p-4"><p className="text-xs font-bold text-[#0B4A8B]">Perlu Aksi</p><p className="mt-2 text-2xl font-black text-[#0B4A8B]">{needActionCount}</p></div>
            </div>
          </div>
          <div className="mt-3 rounded-[20px] bg-[#0A4C3E] p-3 sm:mt-5 sm:rounded-[24px] sm:p-4 text-white">
            <p className="text-xs font-bold text-white/60">Pendapatan Pesanan Selesai</p>
            <p className="mt-1 text-2xl font-black text-[#71BC68]" style={{ fontFamily: 'Sora, sans-serif' }}>{formatRp(revenue)}</p>
          </div>
        </section>

        {needActionCount > 0 && <div className="mt-5 flex items-center gap-4 rounded-[28px] border border-[#0B4A8B]/10 bg-[#E7F0FF] p-4"><div className="hidden h-12 w-12 sm:flex items-center justify-center rounded-2xl bg-[#0B4A8B] text-white"><Package size={20} /></div><div><p className="font-black text-[#0B4A8B]">{needActionCount} pesanan butuh tindakan</p><p className="text-sm text-[#49645B]">Segera proses pesanan agar pengalaman pembeli tetap baik.</p></div></div>}

        <div className="sticky top-2 z-10 mt-4 flex flex-col gap-2 rounded-[22px] sm:static sm:mt-5 sm:gap-3 sm:rounded-[28px] bg-white p-3 shadow-sm ring-1 ring-[#71BC68]/15 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-2xl bg-[#F8FBF7] px-4 py-3"><Search size={18} color="#8AA08A" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nomor order atau nama pembeli..." className="w-full bg-transparent text-sm font-medium text-[#0A4C3E] outline-none placeholder:text-[#9CA3AF]" /></div>
          <div className="flex gap-2 overflow-x-auto pb-1">{TABS.map(tab => <button key={tab.key} onClick={() => setFilter(tab.key)} className="shrink-0 rounded-2xl px-4 py-2 text-xs font-black" style={{ background: filter === tab.key ? '#0A4C3E' : '#F8FBF7', color: filter === tab.key ? '#71BC68' : '#6B7C6A' }}>{tab.label}{tab.key === 'paid' && needActionCount > 0 ? ` (${needActionCount})` : ''}</button>)}</div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-5 rounded-[26px] bg-white px-4 py-14 text-center shadow-sm ring-1 ring-[#71BC68]/15 sm:rounded-[32px] sm:py-20"><Package className="mx-auto mb-3" size={42} color="#9CA3AF" /><p className="font-black text-[#0A4C3E]">Belum ada pesanan</p><p className="mt-1 text-sm text-[#6B7C6A]">Pesanan akan muncul sesuai filter yang dipilih.</p></div>
        ) : (
          <div className="mt-5 space-y-4">
            {filtered.map(({ order, items }) => {
              const currentStatus = statusMap[order.id] ?? order.status
              const cfg = STATUS[currentStatus] ?? STATUS.pending
              const Icon = cfg.icon
              const total = items.reduce((sum, item) => sum + item.subtotal, 0)
              const isOpen = expanded.has(order.id)
              const tracking = trackingMap[order.id] ?? order.tracking_number ?? ''
              return (
                <article key={order.id} className="overflow-hidden rounded-[22px] bg-white shadow-sm ring-1 ring-[#71BC68]/15 sm:rounded-[30px]">
                  <div className="p-3 sm:p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex min-w-0 gap-3 sm:gap-4">
                        <div className="hidden h-12 w-12 sm:flex shrink-0 items-center justify-center rounded-2xl" style={{ background: cfg.bg, color: cfg.color }}><Icon size={22} /></div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-black sm:text-base text-[#0A4C3E]" style={{ fontFamily: 'Sora, sans-serif' }}>{order.order_number}</h2><span className="rounded-full px-3 py-1 text-xs font-black" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span></div>
                          <p className="mt-1 text-xs text-[#6B7C6A] sm:text-sm">{cfg.sublabel}</p>
                          <p className="mt-1 text-xs font-bold text-[#8AA08A]">{formatDate(order.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-left md:text-right"><p className="text-xs font-bold text-[#6B7C6A]">Total Item</p><p className="font-black text-[#0A4C3E]">{formatRp(total)}</p></div>
                    </div>

                    <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto] md:items-center sm:mt-5 sm:gap-3">
                      <div className="rounded-[18px] bg-[#F8FBF7] p-3 sm:rounded-[22px] sm:p-4"><p className="text-[11px] font-black text-[#6B7C6A]">Pembeli</p><p className="mt-0.5 font-black text-[#0A4C3E]">{order.shipping_name}</p><p className="text-sm text-[#6B7C6A]">{order.shipping_phone}</p></div>
                      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                        {currentStatus === 'paid' && <><button onClick={() => handleUpdateStatus(order, 'processing')} disabled={updating === order.id} className="rounded-2xl bg-[#0A4C3E] px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm font-black text-[#71BC68] disabled:opacity-60">{updating === order.id ? 'Memproses...' : 'Proses'}</button><button onClick={() => setConfirmCancel(order.id)} className="rounded-2xl bg-[#FFF4F4] px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm font-black text-[#C92A2A]">Tolak</button></>}
                        {currentStatus === 'processing' && <button onClick={() => handleUpdateStatus(order, 'shipped')} disabled={updating === order.id} className="rounded-2xl bg-[#0A4C3E] px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm font-black text-[#71BC68] disabled:opacity-60">{updating === order.id ? 'Mengirim...' : 'Tandai Dikirim'}</button>}
                        <button onClick={() => toggleExpand(order.id)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F0F8EE] px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm font-black text-[#0A4C3E]">Detail {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                      </div>
                    </div>
                  </div>

                  {currentStatus === 'shipped' && <div className="px-5 pb-5"><div className="flex flex-col items-start justify-between gap-3 rounded-[22px] sm:flex-row sm:items-center bg-[#F8FBF7] p-4"><div><p className="text-xs font-black text-[#6B7C6A]">Nomor Resi Otomatis</p><p className="break-all font-mono text-xs font-black tracking-wider sm:text-sm text-[#0A4C3E]">{tracking || 'Sedang dibuat otomatis...'}</p></div><span className="rounded-2xl bg-white px-4 py-2 text-xs font-black text-[#0A4C3E] ring-1 ring-[#71BC68]/20">Auto</span></div></div>}

                  {confirmCancel === order.id && <div className="mx-5 mb-5 rounded-[22px] border border-[#C92A2A]/20 bg-[#FFF4F4] p-4"><p className="font-black text-[#C92A2A]">Tolak pesanan ini?</p><p className="mt-1 text-sm text-[#6B7C6A]">Pesanan akan dibatalkan dan pembeli mendapat notifikasi.</p><div className="mt-3 flex gap-2"><button onClick={() => setConfirmCancel(null)} className="flex-1 rounded-2xl bg-white py-2.5 text-sm font-black text-[#6B7C6A]">Batal</button><button onClick={() => handleUpdateStatus(order, 'cancelled')} disabled={updating === order.id} className="flex-1 rounded-2xl bg-[#C92A2A] py-2.5 text-sm font-black text-white">Ya, Tolak</button></div></div>}

                  {isOpen && (
                    <div className="border-t border-[#71BC68]/10 p-2.5 sm:p-5">
                      <div className="grid gap-2 sm:gap-4 lg:grid-cols-[1fr_0.85fr]">
                        <div className="rounded-[18px] bg-[#F8FBF7] p-3 sm:bg-transparent sm:p-0">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0A4C3E] sm:text-sm sm:normal-case sm:tracking-normal">Produk</p>
                            <p className="text-[11px] font-black text-[#6B7C6A]">{items.length} item</p>
                          </div>
                          <div className="space-y-1.5 sm:space-y-2">
                            {items.map(item => (
                              <div key={item.id} className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-2xl bg-white px-3 py-2 ring-1 ring-[#71BC68]/10 sm:bg-[#F8FBF7] sm:py-3 sm:ring-0">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-black text-[#0A4C3E] sm:text-base">{item.product_name}</p>
                                  <p className="text-[11px] font-bold text-[#6B7C6A] sm:text-xs">{item.quantity} {item.unit} × {formatRp(item.price)}</p>
                                </div>
                                <p className="text-sm font-black text-[#0A4C3E] sm:text-base">{formatRp(item.subtotal)}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-[18px] bg-[#F8FBF7] p-3 sm:rounded-[24px] sm:p-4">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <MapPin size={14} color="#0A4C3E" />
                              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0A4C3E] sm:text-sm sm:normal-case sm:tracking-normal">Alamat</p>
                            </div>
                            {order.shipping_courier && <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase text-[#0A4C3E] ring-1 ring-[#71BC68]/10">{order.shipping_courier}</span>}
                          </div>
                          <div className="grid grid-cols-[1fr_auto] gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-[#0A4C3E]">{order.shipping_name}</p>
                              <p className="line-clamp-2 text-xs leading-relaxed text-[#6B7C6A] sm:text-sm">{order.shipping_address}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
      {toast && <div className="fixed bottom-24 left-1/2 z-50 min-w-[220px] -translate-x-1/2 rounded-2xl px-5 py-3 text-center text-sm font-black text-white shadow-xl md:bottom-8" style={{ background: toast.type === 'success' ? '#0A4C3E' : '#C92A2A' }}>{toast.msg}</div>}
    </main>
  )
}
