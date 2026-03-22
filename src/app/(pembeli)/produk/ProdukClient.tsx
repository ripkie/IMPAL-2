'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, X, ShoppingCart, Star, Leaf, Cherry,
  Sprout, Flower2, Bean, Package, ChevronRight,
  ArrowLeft, Plus, Minus, Check
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Category { id: string; name: string; slug: string }
interface Product {
  id: string; name: string; description: string | null
  price: number; unit: string; stock: number
  image_urls: string[]; sold_count: number
  category_id: string | null
  categories?: Category | null
  profiles?: { id: string; full_name: string | null } | null
}

interface Props {
  products: Product[]
  categories: Category[]
  initialKategori: string
  initialSearch: string
}

const CATEGORY_ICONS: Record<string, any> = {
  'sayuran-hijau': Leaf,
  'buah-beri': Cherry,
  'umbi-umbian': Sprout,
  'herbal-rempah': Flower2,
  'kacang-kacangan': Bean,
  'lainnya': Package,
}

export default function ProdukClient({ products, categories, initialKategori, initialSearch }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const [selectedKategori, setSelectedKategori] = useState(initialKategori)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [qty, setQty] = useState(1)
  const [addingCart, setAddingCart] = useState(false)
  const [cartSuccess, setCartSuccess] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (selectedKategori) params.set('kategori', selectedKategori)
    router.push(`/produk?${params.toString()}`)
  }

  function handleKategori(slug: string) {
    const newKat = selectedKategori === slug ? '' : slug
    setSelectedKategori(newKat)
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (newKat) params.set('kategori', newKat)
    router.push(`/produk?${params.toString()}`)
  }

  async function handleAddToCart() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    if (!selectedProduct) return

    setAddingCart(true)
    const { data: existing } = await supabase
      .from('carts')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', selectedProduct.id)
      .single()

    if (existing) {
      await supabase.from('carts')
        .update({ quantity: existing.quantity + qty, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase.from('carts').insert({
        user_id: user.id,
        product_id: selectedProduct.id,
        quantity: qty,
      })
    }

    setAddingCart(false)
    setCartSuccess(true)
    setTimeout(() => {
      setCartSuccess(false)
      setSelectedProduct(null)
      setQty(1)
    }, 1500)
    showToast(`${selectedProduct.name} ditambahkan ke keranjang!`)
  }

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>
      <div className="max-w-5xl mx-auto px-4 py-5 pb-24">

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-5">
          <div className="flex-1 flex items-center gap-2 bg-white px-3 py-2.5 rounded-2xl"
            style={{ border: '1px solid rgba(113,188,104,0.2)', boxShadow: '0 2px 8px rgba(10,76,62,0.05)' }}>
            <Search size={16} color="#9CA3AF" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari sayuran, buah, rempah..."
              className="flex-1 text-sm bg-transparent outline-none"
              style={{ color: '#0A4C3E' }}
            />
            {search && (
              <button type="button" onClick={() => { setSearch(''); router.push('/produk') }}>
                <X size={14} color="#9CA3AF" />
              </button>
            )}
          </div>
          <button type="submit"
            className="px-4 py-2.5 rounded-2xl text-sm font-bold"
            style={{ background: '#0A4C3E', color: '#71BC68' }}>
            Cari
          </button>
        </form>

        {/* Kategori filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
          <button
            onClick={() => handleKategori('')}
            className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition"
            style={{
              background: !selectedKategori ? '#0A4C3E' : 'white',
              color: !selectedKategori ? '#71BC68' : '#6B7C6A',
              border: '1px solid rgba(113,188,104,0.2)'
            }}>
            Semua
          </button>
          {categories.map(cat => {
            const Icon = CATEGORY_ICONS[cat.slug] ?? Package
            const active = selectedKategori === cat.slug
            return (
              <button key={cat.id} onClick={() => handleKategori(cat.slug)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition"
                style={{
                  background: active ? '#0A4C3E' : 'white',
                  color: active ? '#71BC68' : '#6B7C6A',
                  border: '1px solid rgba(113,188,104,0.2)'
                }}>
                <Icon size={12} />
                {cat.name}
              </button>
            )
          })}
        </div>

        {/* Hasil */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: '#0A4C3E' }}>
            {products.length} produk ditemukan
          </p>
        </div>

        {/* Product grid */}
        {products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl"
            style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
            <Package size={40} color="#ccc" className="mx-auto mb-3" />
            <p className="font-bold" style={{ color: '#0A4C3E' }}>Produk tidak ditemukan</p>
            <p className="text-sm mt-1" style={{ color: '#6B7C6A' }}>Coba kata kunci atau kategori lain</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map(product => (
              <button key={product.id}
                onClick={() => { setSelectedProduct(product); setQty(1) }}
                className="bg-white rounded-2xl overflow-hidden text-left transition hover:-translate-y-0.5 hover:shadow-md"
                style={{ border: '1px solid rgba(113,188,104,0.15)', boxShadow: '0 2px 8px rgba(10,76,62,0.06)' }}>
                {/* Gambar */}
                <div className="w-full aspect-square overflow-hidden flex items-center justify-center"
                  style={{ background: '#F4FAF3' }}>
                  {product.image_urls?.[0] ? (
                    <img src={product.image_urls[0]} alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Leaf size={32} color="#71BC68" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold line-clamp-2 mb-1" style={{ color: '#0A4C3E' }}>
                    {product.name}
                  </p>
                  <p className="text-xs mb-1" style={{ color: '#6B7C6A' }}>
                    {product.profiles?.full_name ?? 'Petani KiTani'}
                  </p>
                  <p className="text-sm font-bold" style={{ color: '#0A4C3E' }}>
                    Rp {product.price.toLocaleString('id-ID')}
                    <span className="text-xs font-normal text-gray-400">/{product.unit}</span>
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                    Terjual {product.sold_count}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => { setSelectedProduct(null); setQty(1) }}>
          <div className="w-full max-w-lg bg-white rounded-t-3xl md:rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            {/* Gambar produk */}
            <div className="relative w-full aspect-video flex items-center justify-center"
              style={{ background: '#F4FAF3' }}>
              {selectedProduct.image_urls?.[0] ? (
                <img src={selectedProduct.image_urls[0]} alt={selectedProduct.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Leaf size={64} color="#71BC68" />
              )}
              <button onClick={() => { setSelectedProduct(null); setQty(1) }}
                className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.4)' }}>
                <X size={16} color="white" />
              </button>
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h2 className="text-lg font-bold" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
                  {selectedProduct.name}
                </h2>
                {selectedProduct.categories && (
                  <span className="text-xs px-2 py-1 rounded-full shrink-0"
                    style={{ background: '#D4EDDA', color: '#155724' }}>
                    {selectedProduct.categories.name}
                  </span>
                )}
              </div>

              <p className="text-sm mb-1" style={{ color: '#6B7C6A' }}>
                oleh {selectedProduct.profiles?.full_name ?? 'Petani KiTani'}
              </p>

              <p className="text-xl font-bold mb-3" style={{ color: '#0A4C3E' }}>
                Rp {selectedProduct.price.toLocaleString('id-ID')}
                <span className="text-sm font-normal text-gray-400"> / {selectedProduct.unit}</span>
              </p>

              {selectedProduct.description && (
                <p className="text-sm mb-4 leading-relaxed" style={{ color: '#6B7C6A' }}>
                  {selectedProduct.description}
                </p>
              )}

              <div className="flex items-center gap-3 mb-2">
                <p className="text-xs" style={{ color: '#6B7C6A' }}>
                  Stok: <span className="font-bold" style={{ color: '#0A4C3E' }}>{selectedProduct.stock} {selectedProduct.unit}</span>
                </p>
                <p className="text-xs" style={{ color: '#6B7C6A' }}>
                  Terjual: <span className="font-bold" style={{ color: '#0A4C3E' }}>{selectedProduct.sold_count}</span>
                </p>
              </div>

              {/* Quantity selector */}
              <div className="flex items-center justify-between mb-4 p-3 rounded-2xl"
                style={{ background: '#F4FAF3' }}>
                <p className="text-sm font-semibold" style={{ color: '#0A4C3E' }}>Jumlah</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition"
                    style={{ background: qty <= 1 ? '#e5e7eb' : '#0A4C3E' }}>
                    <Minus size={14} color={qty <= 1 ? '#9CA3AF' : '#71BC68'} />
                  </button>
                  <span className="text-base font-bold w-8 text-center" style={{ color: '#0A4C3E' }}>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(selectedProduct.stock, q + 1))}
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: '#0A4C3E' }}>
                    <Plus size={14} color="#71BC68" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <p className="text-sm" style={{ color: '#6B7C6A' }}>Total</p>
                <p className="text-lg font-bold" style={{ color: '#0A4C3E' }}>
                  Rp {(selectedProduct.price * qty).toLocaleString('id-ID')}
                </p>
              </div>

              <button onClick={handleAddToCart} disabled={addingCart || cartSuccess}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition"
                style={{
                  background: cartSuccess ? '#71BC68' : addingCart ? '#ccc' : '#0A4C3E',
                  color: cartSuccess ? '#0A4C3E' : '#71BC68'
                }}>
                {cartSuccess ? (
                  <><Check size={18} /> Ditambahkan!</>
                ) : addingCart ? (
                  'Menambahkan...'
                ) : (
                  <><ShoppingCart size={18} /> Tambah ke Keranjang</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg"
          style={{ background: toast.type === 'success' ? '#0A4C3E' : '#dc3545', color: 'white', minWidth: '220px', textAlign: 'center' }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
