'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, ShoppingCart, Plus, Minus, Check,
  Leaf, Star, Package, Store, ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Category { id: string; name: string; slug: string }
interface Profile { id: string; full_name: string | null; avatar_url: string | null }
interface Product {
  id: string; name: string; description: string | null
  price: number; unit: string; stock: number
  image_urls: string[]; sold_count: number; is_active: boolean
  farmer_id: string; category_id: string | null
  categories?: Category | null
  profiles?: Profile | null
  created_at: string
}

interface Props {
  product: Product
  produkLain: Product[]
  userId: string | null
}

export default function ProdukDetailClient({ product, produkLain, userId }: Props) {
  const router = useRouter()
  const [qty, setQty] = useState(1)
  const [activeImg, setActiveImg] = useState(0)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function handleAddToCart() {
    if (!userId) { router.push('/login'); return }
    setAdding(true)
    const supabase = createClient()

    const { data: existing } = await supabase
      .from('carts')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', product.id)
      .single()

    if (existing) {
      await supabase.from('carts')
        .update({ quantity: existing.quantity + qty, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase.from('carts').insert({
        user_id: userId,
        product_id: product.id,
        quantity: qty,
      })
    }

    setAdding(false)
    setAdded(true)
    showToast(`${product.name} ditambahkan ke keranjang!`)
    setTimeout(() => setAdded(false), 2000)
  }

  async function handleBuyNow() {
    if (!userId) { router.push('/login'); return }
    await handleAddToCart()
    router.push('/keranjang')
  }

  const images = product.image_urls?.length > 0 ? product.image_urls : []
  const farmerName = product.profiles?.full_name ?? 'Petani KiTani'
  const isHabis = product.stock === 0

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto pb-32">

        {/* Back button */}
        <div className="px-4 pt-4 mb-2">
          <button onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: '#0A4C3E' }}>
            <ArrowLeft size={16} /> Kembali
          </button>
        </div>

        {/* Gambar produk */}
        <div className="px-4 mb-4">
          <div className="relative w-full rounded-3xl overflow-hidden"
            style={{ height: 300, background: '#e8f5e9' }}>
            {images.length > 0 ? (
              <Image
                src={images[activeImg]}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Leaf size={64} color="#71BC68" />
              </div>
            )}
            {product.categories && (
              <span className="absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: '#D4EDDA', color: '#155724' }}>
                {product.categories.name}
              </span>
            )}
            {isHabis && (
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.45)' }}>
                <span className="text-white font-bold text-lg px-5 py-2 rounded-2xl"
                  style={{ background: 'rgba(0,0,0,0.5)' }}>Stok Habis</span>
              </div>
            )}
          </div>

          {/* Thumbnail gambar */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-3">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className="w-16 h-16 rounded-xl overflow-hidden shrink-0"
                  style={{ border: `2px solid ${activeImg === i ? '#71BC68' : 'transparent'}` }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info produk */}
        <div className="px-4">
          <div className="bg-white rounded-3xl p-5 mb-4"
            style={{ border: '1px solid rgba(113,188,104,0.15)' }}>

            <h1 className="text-xl font-bold mb-1"
              style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-1">
                <Star size={13} color="#FFB347" fill="#FFB347" />
                <span className="text-xs font-medium" style={{ color: '#6B7C6A' }}>
                  Terjual {product.sold_count}
                </span>
              </div>
              <span className="text-xs" style={{ color: '#6B7C6A' }}>
                Stok: <span className="font-bold" style={{ color: product.stock <= 5 ? '#856404' : '#0A4C3E' }}>
                  {product.stock} {product.unit}
                </span>
              </span>
            </div>

            <p className="text-2xl font-bold mb-1"
              style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
              Rp {product.price.toLocaleString('id-ID')}
              <span className="text-sm font-normal ml-1" style={{ color: '#6B7C6A' }}>
                / {product.unit}
              </span>
            </p>

            {product.description && (
              <p className="text-sm mt-3 leading-relaxed" style={{ color: '#6B7C6A' }}>
                {product.description}
              </p>
            )}
          </div>

          {/* Info petani */}
          <div className="bg-white rounded-2xl p-4 mb-4 flex items-center gap-3"
            style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: '#D4EDDA' }}>
              <Store size={18} color="#155724" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs" style={{ color: '#6B7C6A' }}>Dijual oleh</p>
              <p className="text-sm font-bold truncate" style={{ color: '#0A4C3E' }}>{farmerName}</p>
            </div>
            <ChevronRight size={16} color="#9CA3AF" />
          </div>

          {/* Produk lain dari petani */}
          {produkLain.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-bold mb-3" style={{ color: '#0A4C3E' }}>
                Produk lain dari {farmerName}
              </p>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {produkLain.map(p => (
                  <Link key={p.id} href={`/produk/${p.id}`}
                    className="shrink-0 bg-white rounded-2xl overflow-hidden"
                    style={{ width: 130, border: '1px solid rgba(113,188,104,0.15)' }}>
                    <div className="w-full flex items-center justify-center"
                      style={{ height: 90, background: '#F4FAF3' }}>
                      {p.image_urls?.[0] ? (
                        <img src={p.image_urls[0]} alt={p.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Package size={24} color="#71BC68" />
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold line-clamp-1" style={{ color: '#0A4C3E' }}>{p.name}</p>
                      <p className="text-xs font-bold mt-0.5" style={{ color: '#71BC68' }}>
                        Rp {p.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar - qty + add to cart */}
      {!isHabis && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 px-4 py-3"
          style={{ background: 'white', borderTop: '1px solid rgba(113,188,104,0.15)', boxShadow: '0 -4px 20px rgba(10,76,62,0.08)' }}>
          <div className="max-w-3xl mx-auto flex items-center gap-3">

            {/* Qty selector */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
              style={{ background: '#F4FAF3', border: '1px solid rgba(113,188,104,0.2)' }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: qty <= 1 ? '#e5e7eb' : '#0A4C3E' }}>
                <Minus size={13} color={qty <= 1 ? '#9CA3AF' : '#71BC68'} />
              </button>
              <span className="text-sm font-bold w-6 text-center" style={{ color: '#0A4C3E' }}>{qty}</span>
              <button onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: qty >= product.stock ? '#e5e7eb' : '#0A4C3E' }}>
                <Plus size={13} color={qty >= product.stock ? '#9CA3AF' : '#71BC68'} />
              </button>
            </div>

            {/* Total */}
            <div className="flex-1">
              <p className="text-xs" style={{ color: '#6B7C6A' }}>Total</p>
              <p className="text-base font-bold" style={{ color: '#0A4C3E' }}>
                Rp {(product.price * qty).toLocaleString('id-ID')}
              </p>
            </div>

            {/* Buttons */}
            <button onClick={handleAddToCart} disabled={adding || added}
              className="px-4 py-2.5 rounded-2xl font-bold text-sm transition"
              style={{ background: added ? '#D4EDDA' : '#F4FAF3', color: added ? '#155724' : '#0A4C3E', border: '1.5px solid rgba(10,76,62,0.15)' }}>
              {added ? <Check size={18} /> : <ShoppingCart size={18} />}
            </button>

            <button onClick={handleBuyNow} disabled={adding}
              className="px-5 py-2.5 rounded-2xl font-bold text-sm transition hover:opacity-90"
              style={{ background: '#0A4C3E', color: '#71BC68' }}>
              Beli Sekarang
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg"
          style={{ background: '#0A4C3E', color: 'white', minWidth: '220px', textAlign: 'center' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
