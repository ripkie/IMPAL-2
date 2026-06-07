'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Package, MapPin, Truck, CreditCard,
  ChevronDown, ChevronUp, Loader, Check, X, AlertCircle
} from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  unit: string
  stock: number
  image_urls: string[]
  farmer_id: string
  profiles?: { id: string; full_name: string | null } | null
}

interface CartItem {
  id: string
  quantity: number
  products: Product | null
}

interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  address: string | null
}

interface Props {
  profile: Profile
  cartItems: CartItem[]
  userId: string
}

const SHIPPING_OPTIONS = [
  { id: 'reguler', label: 'Reguler', desc: '2-3 hari', cost: 15000 },
  { id: 'express', label: 'Express', desc: '1 hari', cost: 25000 },
  { id: 'same_day', label: 'Same Day', desc: 'Hari ini', cost: 35000 },
]

export default function CheckoutClient({ profile, cartItems, userId }: Props) {
  const router = useRouter()

  const [name, setName] = useState(profile.full_name ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [address, setAddress] = useState(profile.address ?? '')
  const [courier, setCourier] = useState('reguler')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showOrderSummary, setShowOrderSummary] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const selectedShipping = SHIPPING_OPTIONS.find(s => s.id === courier)!
  const validCartItems = cartItems.filter(item => item.products)
  const subtotal = validCartItems.reduce((sum, item) => {
    return sum + (item.products?.price ?? 0) * item.quantity
  }, 0)
  const shippingCost = selectedShipping.cost
  const total = subtotal + shippingCost

  function validateCheckout() {
    if (!name.trim()) {
      showToast('Nama penerima wajib diisi', 'error')
      return false
    }

    if (!phone.trim()) {
      showToast('Nomor HP wajib diisi', 'error')
      return false
    }

    if (!address.trim()) {
      showToast('Alamat pengiriman wajib diisi', 'error')
      return false
    }

    if (validCartItems.length === 0) {
      showToast('Produk checkout tidak ditemukan', 'error')
      return false
    }

    const outOfStock = validCartItems.find(item => item.products && item.quantity > item.products.stock)
    if (outOfStock?.products) {
      showToast(`Stok ${outOfStock.products.name} tidak mencukupi`, 'error')
      return false
    }

    return true
  }

  function handleOpenConfirmation() {
    if (!validateCheckout()) return
    setShowConfirmation(true)
  }

  async function handleCheckout() {
    if (!validateCheckout()) return

    setLoading(true)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          cartItemIds: validCartItems.map(i => i.id),
          shippingName: name.trim(),
          shippingPhone: phone.trim(),
          shippingAddress: address.trim(),
          shippingCourier: courier,
          shippingCost,
          subtotal,
          total,
          notes: notes.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Gagal membuat order')
      }

      if (data.snapToken) {
        // @ts-ignore
        window.snap.pay(data.snapToken, {
          onSuccess: () => {
            showToast('Pembayaran berhasil!')
            router.push('/transaksi')
          },
          onPending: () => {
            showToast('Menunggu pembayaran...')
            router.push('/transaksi')
          },
          onError: () => {
            showToast('Pembayaran gagal, coba lagi', 'error')
          },
          onClose: () => {
            showToast('Pembayaran dibatalkan', 'error')
            router.push('/transaksi')
          },
        })
      } else {
        router.push('/transaksi')
      }
    } catch (err: any) {
      showToast(err.message ?? 'Terjadi kesalahan', 'error')
    } finally {
      setLoading(false)
      setShowConfirmation(false)
    }
  }

  return (
    <>
      <script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        async
      />

      <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>
        <div className="max-w-2xl mx-auto px-4 py-5 pb-36">
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'white', border: '1px solid rgba(113,188,104,0.2)' }}
            >
              <ArrowLeft size={16} color="#0A4C3E" />
            </button>

            <h1 className="text-xl font-bold" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
              Checkout
            </h1>
          </div>

          <div
            className="rounded-2xl mb-4 p-3 flex items-start gap-3"
            style={{ background: '#FFF8DC', border: '1px solid #FFEEBA' }}
          >
            <AlertCircle size={17} color="#856404" className="mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold" style={{ color: '#856404' }}>
                Cek ulang pesanan sebelum bayar
              </p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: '#856404' }}>
                Pastikan produk, jumlah, alamat, kurir, dan total pembayaran sudah benar.
              </p>
            </div>
          </div>

          <div
            className="bg-white rounded-2xl mb-4"
            style={{ border: '1px solid rgba(113,188,104,0.15)' }}
          >
            <button
              onClick={() => setShowOrderSummary(p => !p)}
              className="w-full flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <Package size={16} color="#71BC68" />
                <span className="text-sm font-bold" style={{ color: '#0A4C3E' }}>
                  {validCartItems.length} produk dipesan
                </span>
              </div>

              {showOrderSummary ? (
                <ChevronUp size={16} color="#6B7C6A" />
              ) : (
                <ChevronDown size={16} color="#6B7C6A" />
              )}
            </button>

            {showOrderSummary && (
              <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid #f3f4f6' }}>
                {validCartItems.map(item => {
                  const p = item.products!
                  return (
                    <div key={item.id} className="flex items-center gap-3 pt-3">
                      <div
                        className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                        style={{ background: '#F4FAF3' }}
                      >
                        {p.image_urls?.[0] ? (
                          <img
                            src={p.image_urls[0]}
                            alt={p.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <Package size={20} color="#9CA3AF" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#0A4C3E' }}>
                          {p.name}
                        </p>
                        <p className="text-xs" style={{ color: '#6B7C6A' }}>
                          {item.quantity} {p.unit} × Rp {p.price.toLocaleString('id-ID')}
                        </p>
                      </div>

                      <p className="text-sm font-bold shrink-0" style={{ color: '#0A4C3E' }}>
                        Rp {(p.price * item.quantity).toLocaleString('id-ID')}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div
            className="bg-white rounded-2xl p-4 mb-4"
            style={{ border: '1px solid rgba(113,188,104,0.15)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={16} color="#71BC68" />
              <h2 className="text-sm font-bold" style={{ color: '#0A4C3E' }}>
                Informasi Pengiriman
              </h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#6B7C6A' }}>
                  Nama Penerima
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nama lengkap penerima"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: '1.5px solid #e5e7eb', color: '#0A4C3E' }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#6B7C6A' }}>
                  Nomor HP
                </label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  type="tel"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: '1.5px solid #e5e7eb', color: '#0A4C3E' }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#6B7C6A' }}>
                  Alamat Lengkap
                </label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Jalan, nomor rumah, kelurahan, kecamatan, kota..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ border: '1.5px solid #e5e7eb', color: '#0A4C3E' }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#6B7C6A' }}>
                  Catatan (opsional)
                </label>
                <input
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Contoh: Titip ke satpam"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: '1.5px solid #e5e7eb', color: '#0A4C3E' }}
                />
              </div>
            </div>
          </div>

          <div
            className="bg-white rounded-2xl p-4 mb-4"
            style={{ border: '1px solid rgba(113,188,104,0.15)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Truck size={16} color="#71BC68" />
              <h2 className="text-sm font-bold" style={{ color: '#0A4C3E' }}>
                Pilih Pengiriman
              </h2>
            </div>

            <div className="space-y-2">
              {SHIPPING_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setCourier(opt.id)}
                  className="w-full flex items-center justify-between p-3 rounded-xl transition"
                  style={{
                    border: `1.5px solid ${courier === opt.id ? '#71BC68' : '#e5e7eb'}`,
                    background: courier === opt.id ? '#F4FAF3' : 'white',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        border: `2px solid ${courier === opt.id ? '#71BC68' : '#e5e7eb'}`,
                        background: courier === opt.id ? '#71BC68' : 'white',
                      }}
                    >
                      {courier === opt.id && <Check size={11} color="white" strokeWidth={3} />}
                    </div>

                    <div className="text-left">
                      <p className="text-sm font-semibold" style={{ color: '#0A4C3E' }}>
                        {opt.label}
                      </p>
                      <p className="text-xs" style={{ color: '#6B7C6A' }}>
                        {opt.desc}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm font-bold" style={{ color: '#0A4C3E' }}>
                    Rp {opt.cost.toLocaleString('id-ID')}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div
            className="bg-white rounded-2xl p-4"
            style={{ border: '1px solid rgba(113,188,104,0.15)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={16} color="#71BC68" />
              <h2 className="text-sm font-bold" style={{ color: '#0A4C3E' }}>
                Ringkasan Pembayaran
              </h2>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <p className="text-sm" style={{ color: '#6B7C6A' }}>
                  Subtotal produk
                </p>
                <p className="text-sm font-medium" style={{ color: '#0A4C3E' }}>
                  Rp {subtotal.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="flex justify-between">
                <p className="text-sm" style={{ color: '#6B7C6A' }}>
                  Ongkos kirim ({selectedShipping.label})
                </p>
                <p className="text-sm font-medium" style={{ color: '#0A4C3E' }}>
                  Rp {shippingCost.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="flex justify-between pt-2" style={{ borderTop: '1px solid #f3f4f6' }}>
                <p className="text-base font-bold" style={{ color: '#0A4C3E' }}>
                  Total
                </p>
                <p className="text-base font-bold" style={{ color: '#71BC68' }}>
                  Rp {total.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 px-4 py-3"
          style={{
            background: 'white',
            borderTop: '1px solid rgba(113,188,104,0.15)',
            boxShadow: '0 -4px 20px rgba(10,76,62,0.08)',
          }}
        >
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-xs" style={{ color: '#6B7C6A' }}>
                Total Pembayaran
              </p>
              <p className="text-lg font-bold" style={{ color: '#0A4C3E' }}>
                Rp {total.toLocaleString('id-ID')}
              </p>
            </div>

            <button
              onClick={handleOpenConfirmation}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition hover:opacity-90"
              style={{ background: loading ? '#ccc' : '#0A4C3E', color: '#71BC68' }}
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Memproses...
                </>
              ) : (
                'Bayar Sekarang'
              )}
            </button>
          </div>
        </div>

        {showConfirmation && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-5"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={() => !loading && setShowConfirmation(false)}
          >
            <div
              className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
                    Cek Ulang Pesanan
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: '#6B7C6A' }}>
                    Pastikan produk, alamat, kurir, dan total pembayaran sudah benar sebelum lanjut bayar.
                  </p>
                </div>

                <button
                  onClick={() => !loading && setShowConfirmation(false)}
                  disabled={loading}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ background: '#F4FAF3', color: '#0A4C3E' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-[55vh] overflow-y-auto pr-1">
                <div className="rounded-2xl p-3 mb-3" style={{ background: '#F4FAF3' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: '#0A4C3E' }}>
                    Alamat Pengiriman
                  </p>
                  <p className="text-sm font-semibold" style={{ color: '#0A4C3E' }}>
                    {name}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#6B7C6A' }}>
                    {phone}
                  </p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: '#6B7C6A' }}>
                    {address}
                  </p>
                  {notes.trim() && (
                    <p className="text-xs mt-2 leading-relaxed" style={{ color: '#856404' }}>
                      Catatan: {notes.trim()}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl p-3 mb-3" style={{ background: '#F8FCF7', border: '1px solid rgba(113,188,104,0.18)' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: '#0A4C3E' }}>
                    Produk Dipesan
                  </p>

                  <div className="space-y-3">
                    {validCartItems.map(item => {
                      const p = item.products!
                      return (
                        <div key={item.id} className="flex items-center gap-3">
                          <div
                            className="h-11 w-11 shrink-0 overflow-hidden rounded-xl flex items-center justify-center"
                            style={{ background: '#F4FAF3' }}
                          >
                            {p.image_urls?.[0] ? (
                              <img
                                src={p.image_urls[0]}
                                alt={p.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <Package size={18} color="#9CA3AF" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold" style={{ color: '#0A4C3E' }}>
                              {p.name}
                            </p>
                            <p className="text-xs" style={{ color: '#6B7C6A' }}>
                              {item.quantity} {p.unit} × Rp {p.price.toLocaleString('id-ID')}
                            </p>
                          </div>

                          <p className="shrink-0 text-sm font-bold" style={{ color: '#0A4C3E' }}>
                            Rp {(p.price * item.quantity).toLocaleString('id-ID')}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="rounded-2xl p-3 mb-3" style={{ background: '#F4FAF3' }}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: '#6B7C6A' }}>Pengiriman</span>
                    <span className="font-semibold" style={{ color: '#0A4C3E' }}>
                      {selectedShipping.label} · Rp {shippingCost.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: '#6B7C6A' }}>Subtotal</span>
                    <span style={{ color: '#0A4C3E' }}>
                      Rp {subtotal.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex justify-between pt-2 mt-2" style={{ borderTop: '1px solid rgba(10,76,62,0.10)' }}>
                    <span className="font-bold" style={{ color: '#0A4C3E' }}>
                      Total
                    </span>
                    <span className="font-bold" style={{ color: '#71BC68' }}>
                      Rp {total.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  disabled={loading}
                  className="rounded-2xl py-3 text-sm font-bold"
                  style={{
                    background: '#F4FAF3',
                    color: '#0A4C3E',
                  }}
                >
                  Periksa Lagi
                </button>

                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold"
                  style={{
                    background: loading ? '#ccc' : '#0A4C3E',
                    color: loading ? '#666' : '#71BC68',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader size={15} className="animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    'Lanjut Bayar'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[90] px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg"
            style={{
              background: toast.type === 'success' ? '#0A4C3E' : '#dc3545',
              color: 'white',
              minWidth: '220px',
              textAlign: 'center',
            }}
          >
            {toast.msg}
          </div>
        )}
      </div>
    </>
  )
}