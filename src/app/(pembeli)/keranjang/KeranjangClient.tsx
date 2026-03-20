'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Product {
  id: string; name: string; price: number; unit: string
  stock: number; image_urls: string[]; is_active: boolean
  profiles?: { id: string; full_name: string | null } | null
}

interface CartItem {
  id: string; quantity: number; updated_at: string
  products: Product | null
}

interface Props {
  cartItems: CartItem[]
  userId: string
}

export default function KeranjangClient({ cartItems: initialItems, userId }: Props) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [selected, setSelected] = useState<Set<string>>(new Set(initialItems.map(i => i.id)))
  const [loading, setLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function updateQty(itemId: string, newQty: number) {
    if (newQty < 1) return
    const supabase = createClient()
    await supabase.from('carts').update({ quantity: newQty, updated_at: new Date().toISOString() }).eq('id', itemId)
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: newQty } : i))
  }

  async function removeItem(itemId: string) {
    setLoading(itemId)
    const supabase = createClient()
    await supabase.from('carts').delete().eq('id', itemId)
    setItems(prev => prev.filter(i => i.id !== itemId))
    setSelected(prev => { const n = new Set(prev); n.delete(itemId); return n })
    setLoading(null)
    showToast('Produk dihapus dari keranjang')
  }

  function toggleSelect(itemId: string) {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(itemId) ? n.delete(itemId) : n.add(itemId)
      return n
    })
  }

  function toggleAll() {
    if (selected.size === items.length) setSelected(new Set())
    else setSelected(new Set(items.map(i => i.id)))
  }

  const selectedItems = items.filter(i => selected.has(i.id) && i.products)
  const subtotal = selectedItems.reduce((sum, i) => sum + (i.products!.price * i.quantity), 0)

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto px-4 py-5 pb-36">

        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
            Keranjang
          </h1>
          <p className="text-sm" style={{ color: '#6B7C6A' }}>{items.length} produk</p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl"
            style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
            <ShoppingCart size={40} color="#ccc" className="mx-auto mb-3" />
            <p className="font-bold" style={{ color: '#0A4C3E' }}>Keranjang kosong</p>
            <p className="text-sm mt-1 mb-4" style={{ color: '#6B7C6A' }}>Yuk belanja produk segar dari petani!</p>
            <button onClick={() => router.push('/produk')}
              className="px-6 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: '#0A4C3E', color: '#71BC68' }}>
              Belanja Sekarang
            </button>
          </div>
        ) : (
          <>
            {/* Pilih semua */}
            <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl mb-3"
              style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
              <input type="checkbox" checked={selected.size === items.length}
                onChange={toggleAll} className="w-4 h-4 accent-green-700" />
              <span className="text-sm font-medium" style={{ color: '#0A4C3E' }}>
                Pilih Semua ({items.length})
              </span>
            </div>

            {/* Cart items */}
            <div className="space-y-3">
              {items.map(item => {
                if (!item.products) return null
                const p = item.products
                return (
                  <div key={item.id} className="bg-white rounded-2xl p-4"
                    style={{ border: `1px solid ${selected.has(item.id) ? 'rgba(113,188,104,0.3)' : 'rgba(0,0,0,0.08)'}` }}>
                    <div className="flex items-start gap-3">
                      <input type="checkbox" checked={selected.has(item.id)}
                        onChange={() => toggleSelect(item.id)} className="w-4 h-4 mt-1 accent-green-700" />

                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                        style={{ background: '#F4FAF3' }}>
                        {p.image_urls?.[0] ? (
                          <img src={p.image_urls[0]} alt={p.name}
                            style={{ width: 64, height: 64, objectFit: 'cover' }} />
                        ) : <Package size={24} color="#9CA3AF" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: '#0A4C3E' }}>{p.name}</p>
                        <p className="text-xs" style={{ color: '#6B7C6A' }}>
                          {p.profiles?.full_name ?? 'Petani KiTani'}
                        </p>
                        <p className="text-sm font-bold mt-1" style={{ color: '#0A4C3E' }}>
                          Rp {(p.price * item.quantity).toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>
                          @Rp {p.price.toLocaleString('id-ID')}/{p.unit}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3"
                      style={{ borderTop: '1px solid #f3f4f6' }}>
                      <button onClick={() => removeItem(item.id)} disabled={loading === item.id}
                        className="flex items-center gap-1 text-xs font-medium"
                        style={{ color: '#dc3545' }}>
                        <Trash2 size={13} /> Hapus
                      </button>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: item.quantity <= 1 ? '#e5e7eb' : '#0A4C3E' }}>
                          <Minus size={12} color={item.quantity <= 1 ? '#9CA3AF' : '#71BC68'} />
                        </button>
                        <span className="text-sm font-bold w-6 text-center" style={{ color: '#0A4C3E' }}>
                          {item.quantity}
                        </span>
                        <button onClick={() => updateQty(item.id, item.quantity + 1)}
                          disabled={item.quantity >= p.stock}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: item.quantity >= p.stock ? '#e5e7eb' : '#0A4C3E' }}>
                          <Plus size={12} color={item.quantity >= p.stock ? '#9CA3AF' : '#71BC68'} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Bottom checkout bar */}
      {items.length > 0 && selected.size > 0 && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-3"
          style={{ background: 'white', borderTop: '1px solid rgba(113,188,104,0.15)', boxShadow: '0 -4px 20px rgba(10,76,62,0.08)' }}>
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-xs" style={{ color: '#6B7C6A' }}>
                {selected.size} produk dipilih
              </p>
              <p className="text-base font-bold" style={{ color: '#0A4C3E' }}>
                Rp {subtotal.toLocaleString('id-ID')}
              </p>
            </div>
            <button
              onClick={() => router.push(`/checkout?items=${Array.from(selected).join(',')}`)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm"
              style={{ background: '#0A4C3E', color: '#71BC68' }}>
              Checkout ({selected.size}) <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg"
          style={{ background: '#0A4C3E', color: 'white', minWidth: '200px', textAlign: 'center' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
