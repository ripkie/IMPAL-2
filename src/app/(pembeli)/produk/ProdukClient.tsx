'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search, X, ShoppingCart, Leaf, Cherry,
  Sprout, Flower2, Bean, Package,
  Plus, Minus, Check, ChevronDown, ArrowUpDown,
  TrendingUp, Clock, ArrowUp, ArrowDown
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
  'sayuran-hijau': Leaf, 'buah-beri': Cherry, 'umbi-umbian': Sprout,
  'herbal-rempah': Flower2, 'kacang-kacangan': Bean, 'lainnya': Package,
}

const SORT_OPTIONS = [
  { key: 'terbaru', label: 'Terbaru', icon: Clock },
  { key: 'terlaris', label: 'Terlaris', icon: TrendingUp },
  { key: 'harga-terendah', label: 'Harga Terendah', icon: ArrowDown },
  { key: 'harga-tertinggi', label: 'Harga Tertinggi', icon: ArrowUp },
]

export default function ProdukClient({ products, categories, initialKategori, initialSearch }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(initialSearch)
  const [selectedKategori, setSelectedKategori] = useState(initialKategori)
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'terbaru')
  const [sortOpen, setSortOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [qty, setQty] = useState(1)
  const [addingCart, setAddingCart] = useState(false)
  const [cartSuccess, setCartSuccess] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  // Tutup dropdown sort kalau klik di luar
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Debounce search — auto-push URL setelah 400ms berhenti ketik
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setIsSearching(true)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams()
      if (search.trim()) params.set('q', search.trim())
      if (selectedKategori) params.set('kategori', selectedKategori)
      if (sort && sort !== 'terbaru') params.set('sort', sort)
      router.push(`/produk?${params.toString()}`)
      setIsSearching(false)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search, selectedKategori, sort])

  function handleKategori(slug: string) {
    setSelectedKategori(prev => prev === slug ? '' : slug)
  }

  function handleSort(key: string) {
    setSort(key)
    setSortOpen(false)
  }

  function clearSearch() {
    setSearch('')
  }

  // Sort produk di client (data sudah di-fetch, sort secara lokal supaya instant)
  const sorted = useMemo(() => {
    const arr = [...products]
    if (sort === 'harga-terendah') return arr.sort((a, b) => a.price - b.price)
    if (sort === 'harga-tertinggi') return arr.sort((a, b) => b.price - a.price)
    if (sort === 'terlaris') return arr.sort((a, b) => b.sold_count - a.sold_count)
    // terbaru — urutan default dari server sudah DESC created_at
    return arr
  }, [products, sort])

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleAddToCart() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    if (!selectedProduct) return
    setAddingCart(true)
    const { data: existing } = await supabase.from('carts').select('id, quantity')
      .eq('user_id', user.id).eq('product_id', selectedProduct.id).single()
    if (existing) {
      await supabase.from('carts').update({ quantity: existing.quantity + qty, updated_at: new Date().toISOString() }).eq('id', existing.id)
    } else {
      await supabase.from('carts').insert({ user_id: user.id, product_id: selectedProduct.id, quantity: qty })
    }
    setAddingCart(false)
    setCartSuccess(true)
    setTimeout(() => { setCartSuccess(false); setSelectedProduct(null); setQty(1) }, 1500)
    showToast(`${selectedProduct.name} ditambahkan ke keranjang!`)
  }

  const currentSort = SORT_OPTIONS.find(s => s.key === sort) ?? SORT_OPTIONS[0]

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>
      <div className="max-w-5xl mx-auto px-4 py-5 pb-28">

        {/* Search bar — tanpa tombol Cari, auto debounce */}
        <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl mb-4"
          style={{ border: '1.5px solid rgba(113,188,104,0.25)', boxShadow: '0 2px 8px rgba(10,76,62,0.05)' }}>
          {isSearching
            ? <div className="w-4 h-4 rounded-full border-2 animate-spin shrink-0"
              style={{ borderColor: '#71BC68', borderTopColor: 'transparent' }} />
            : <Search size={16} color="#9CA3AF" className="shrink-0" />
          }
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari sayuran, buah, rempah..."
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: '#0A4C3E' }}
          />
          {search && (
            <button type="button" onClick={clearSearch} className="shrink-0">
              <X size={14} color="#9CA3AF" />
            </button>
          )}
        </div>

        {/* Kategori + Sort dalam satu baris */}
        <div className="flex items-center gap-2 mb-5">
          {/* Kategori scroll */}
          <div className="flex gap-2 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
            <button onClick={() => handleKategori('')}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition"
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition"
                  style={{
                    background: active ? '#0A4C3E' : 'white',
                    color: active ? '#71BC68' : '#6B7C6A',
                    border: '1px solid rgba(113,188,104,0.2)'
                  }}>
                  <Icon size={11} /> {cat.name}
                </button>
              )
            })}
          </div>

          {/* Sort dropdown */}
          <div ref={sortRef} className="relative shrink-0">
            <button onClick={() => setSortOpen(p => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition"
              style={{
                background: sort !== 'terbaru' ? '#0A4C3E' : 'white',
                color: sort !== 'terbaru' ? '#71BC68' : '#6B7C6A',
                border: `1px solid ${sort !== 'terbaru' ? '#0A4C3E' : 'rgba(113,188,104,0.2)'}`,
              }}>
              <ArrowUpDown size={11} />
              {currentSort.label}
              <ChevronDown size={11} style={{ transform: sortOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </button>

            {sortOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 rounded-2xl overflow-hidden z-30"
                style={{ background: 'white', border: '1px solid rgba(113,188,104,0.2)', boxShadow: '0 8px 24px rgba(10,76,62,0.12)' }}>
                {SORT_OPTIONS.map(opt => {
                  const Icon = opt.icon
                  const active = sort === opt.key
                  return (
                    <button key={opt.key} onClick={() => handleSort(opt.key)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition text-left"
                      style={{
                        background: active ? '#F4FAF3' : 'white',
                        color: active ? '#0A4C3E' : '#6B7C6A',
                      }}>
                      <Icon size={13} color={active ? '#71BC68' : '#9CA3AF'} />
                      {opt.label}
                      {active && <Check size={11} color="#71BC68" className="ml-auto" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Info hasil */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: '#0A4C3E' }}>
            {sorted.length} produk
            {search && <span style={{ color: '#71BC68' }}> · "{search}"</span>}
            {selectedKategori && (
              <span style={{ color: '#71BC68' }}> · {categories.find(c => c.slug === selectedKategori)?.name}</span>
            )}
          </p>
          {(search || selectedKategori) && (
            <button onClick={() => { setSearch(''); setSelectedKategori('') }}
              className="text-xs font-semibold flex items-center gap-1"
              style={{ color: '#9CA3AF' }}>
              <X size={11} /> Reset
            </button>
          )}
        </div>

        {/* Product grid */}
        {sorted.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl"
            style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: '#F4FAF3' }}>
              <Package size={26} color="#9CA3AF" />
            </div>
            <p className="font-bold text-sm" style={{ color: '#0A4C3E' }}>Produk tidak ditemukan</p>
            <p className="text-xs mt-1 mb-4" style={{ color: '#6B7C6A' }}>Coba kata kunci atau kategori lain</p>
            <button onClick={() => { setSearch(''); setSelectedKategori('') }}
              className="text-xs font-semibold px-4 py-2 rounded-xl"
              style={{ background: '#F4FAF3', color: '#0A4C3E', border: '1px solid rgba(113,188,104,0.2)' }}>
              Tampilkan semua produk
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {sorted.map(product => (
              <button key={product.id}
                onClick={() => { setSelectedProduct(product); setQty(1) }}
                className="bg-white rounded-2xl overflow-hidden text-left transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
                style={{ border: '1px solid rgba(113,188,104,0.15)', boxShadow: '0 2px 8px rgba(10,76,62,0.04)' }}>
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
                  <p className="text-xs font-semibold line-clamp-2 mb-1 leading-snug" style={{ color: '#0A4C3E' }}>
                    {product.name}
                  </p>
                  <p className="text-xs mb-1.5 truncate" style={{ color: '#9CA3AF' }}>
                    {product.profiles?.full_name ?? 'Petani KiTani'}
                  </p>
                  <p className="text-sm font-bold" style={{ color: '#0A4C3E' }}>
                    Rp {product.price.toLocaleString('id-ID')}
                    <span className="text-xs font-normal" style={{ color: '#9CA3AF' }}>/{product.unit}</span>
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                    {product.sold_count > 0 ? `Terjual ${product.sold_count}` : 'Baru'}
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
              <div className="flex items-center gap-4 mb-4">
                <p className="text-xs" style={{ color: '#6B7C6A' }}>
                  Stok: <span className="font-bold" style={{ color: '#0A4C3E' }}>{selectedProduct.stock} {selectedProduct.unit}</span>
                </p>
                <p className="text-xs" style={{ color: '#6B7C6A' }}>
                  Terjual: <span className="font-bold" style={{ color: '#0A4C3E' }}>{selectedProduct.sold_count}</span>
                </p>
              </div>
              <div className="flex items-center justify-between mb-4 p-3 rounded-2xl"
                style={{ background: '#F4FAF3' }}>
                <p className="text-sm font-semibold" style={{ color: '#0A4C3E' }}>Jumlah</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
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
              <button onClick={handleAddToCart} disabled={addingCart || cartSuccess || selectedProduct.stock === 0}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition"
                style={{
                  background: cartSuccess ? '#71BC68' : selectedProduct.stock === 0 ? '#e5e7eb' : '#0A4C3E',
                  color: cartSuccess ? '#0A4C3E' : selectedProduct.stock === 0 ? '#9CA3AF' : '#71BC68',
                }}>
                {cartSuccess ? <><Check size={18} /> Ditambahkan!</>
                  : addingCart ? 'Menambahkan...'
                    : selectedProduct.stock === 0 ? 'Stok Habis'
                      : <><ShoppingCart size={18} /> Tambah ke Keranjang</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg whitespace-nowrap"
          style={{ background: toast.type === 'success' ? '#0A4C3E' : '#dc3545', color: 'white' }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}