'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, Leaf, Truck, ShieldCheck, Star,
  Sprout, Carrot, Flower2, Bean, Cherry, Check
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ProductCard from '@/components/ui/ProductCard'
import type { Product, Category } from '@/types'

interface Props {
  products: Product[]
  categories: Category[]
  terlaris: Product[]
}

// Lucide icon map untuk kategori
const CATEGORY_ICON: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  'sayuran-hijau': { icon: Leaf, color: '#155724', bg: '#D4EDDA' },
  'buah-beri':     { icon: Cherry, color: '#842029', bg: '#F8D7DA' },
  'umbi-umbian':   { icon: Carrot, color: '#7B3F00', bg: '#FFE8CC' },
  'herbal-rempah': { icon: Flower2, color: '#3D6B35', bg: '#D4EDDA' },
  'kacang-kacangan':{ icon: Bean, color: '#5C4033', bg: '#EDD9C8' },
  'lainnya':       { icon: Sprout, color: '#0A4C3E', bg: '#F4FAF3' },
}

export default function BerandaClient({ products, categories, terlaris }: Props) {
  const router = useRouter()
  const [addedId, setAddedId] = useState<string | null>(null)

  async function handleAddToCart(productId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: existing } = await supabase
      .from('carts').select('id, quantity')
      .eq('user_id', user.id).eq('product_id', productId).single()

    if (existing) {
      await supabase.from('carts')
        .update({ quantity: existing.quantity + 1, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase.from('carts').insert({ user_id: user.id, product_id: productId, quantity: 1 })
    }

    setAddedId(productId)
    setTimeout(() => setAddedId(null), 1500)
  }

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>

      {/* HERO BANNER */}
      <section className="relative overflow-hidden" style={{ background: '#0A4C3E', minHeight: '320px' }}>
        <div className="absolute" style={{ width: 300, height: 300, borderRadius: '50%', background: 'rgba(113,188,104,0.12)', top: -80, right: -60 }} />
        <div className="absolute" style={{ width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,239,174,0.08)', bottom: -60, left: 40 }} />

        <div className="relative max-w-5xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-xs font-bold"
              style={{ background: 'rgba(113,188,104,0.2)', color: '#71BC68' }}>
              <Leaf size={12} />
              100% Organik dari Petani Lokal
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight"
              style={{ fontFamily: 'Sora, sans-serif' }}>
              Sayuran Segar<br />
              <span style={{ color: '#71BC68' }}>Langsung dari Kebun</span>
            </h1>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
              Hemat hingga 40% dibanding supermarket. Kualitas premium,<br className="hidden md:block" /> langsung dari tangan petani ke meja makanmu.
            </p>
            <div className="flex gap-3 flex-wrap">
              <button onClick={() => router.push('/produk')}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition hover:opacity-90"
                style={{ background: '#71BC68', color: '#0A4C3E' }}>
                Belanja Sekarang <ArrowRight size={16} />
              </button>
              <button onClick={() => router.push('/register')}
                className="px-6 py-3 rounded-full font-bold text-sm transition hover:bg-white/10"
                style={{ border: '1.5px solid rgba(255,255,255,0.3)', color: 'white' }}>
                Daftar sebagai Petani
              </button>
            </div>
          </div>

          <div className="flex md:flex-col gap-4">
            {[
              { num: '200+', label: 'Petani Aktif' },
              { num: '1.500+', label: 'Produk Tersedia' },
              { num: '10rb+', label: 'Pembeli Puas' },
            ].map(s => (
              <div key={s.num} className="text-center px-5 py-4 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(113,188,104,0.2)' }}>
                <div className="font-bold text-xl" style={{ color: '#71BC68', fontFamily: 'Sora, sans-serif' }}>{s.num}</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KEUNGGULAN */}
      <section className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Leaf, title: 'Organik & Segar', desc: 'Dipanen langsung dari kebun, sampai dalam 24 jam', color: '#D4EDDA', iconColor: '#155724' },
            { icon: Truck, title: 'Gratis Ongkir', desc: 'Gratis ongkos kirim untuk pembelian di atas Rp 75.000', color: '#CCE5FF', iconColor: '#004085' },
            { icon: ShieldCheck, title: 'Petani Terverifikasi', desc: 'Semua petani sudah melalui proses verifikasi admin', color: '#FFF3CD', iconColor: '#856404' },
          ].map(item => (
            <div key={item.title} className="flex items-start gap-4 p-4 bg-white rounded-2xl"
              style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: item.color }}>
                <item.icon size={18} color={item.iconColor} />
              </div>
              <div>
                <div className="font-semibold text-sm mb-1" style={{ color: '#0A4C3E' }}>{item.title}</div>
                <div className="text-xs leading-relaxed" style={{ color: '#6B7C6A' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* KATEGORI */}
      <section className="max-w-5xl mx-auto px-6 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
            Kategori Produk
          </h2>
          <button onClick={() => router.push('/produk')}
            className="text-sm font-medium flex items-center gap-1 transition hover:gap-2" style={{ color: '#71BC68' }}>
            Lihat semua <ArrowRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {categories.map(cat => {
            const cfg = CATEGORY_ICON[cat.slug] ?? CATEGORY_ICON['lainnya']
            const IconComp = cfg.icon
            return (
              <button key={cat.id}
                onClick={() => router.push(`/produk?kategori=${cat.slug}`)}
                className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl transition hover:-translate-y-1 hover:shadow-md"
                style={{ border: '1.5px solid rgba(113,188,104,0.15)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cfg.bg }}>
                  <IconComp size={20} color={cfg.color} />
                </div>
                <span className="text-xs font-semibold text-center leading-tight" style={{ color: '#0A4C3E' }}>
                  {cat.name}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* PRODUK TERLARIS */}
      {terlaris.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 pb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
              <Star size={18} color="#71BC68" fill="#71BC68" /> Terlaris
            </h2>
            <button onClick={() => router.push('/produk?sort=terlaris')}
              className="text-sm font-medium flex items-center gap-1 transition hover:gap-2" style={{ color: '#71BC68' }}>
              Lihat semua <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {terlaris.map(product => (
              <div key={product.id} className="relative">
                {addedId === product.id && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
                    style={{ background: 'rgba(113,188,104,0.9)' }}>
                    <Check size={20} color="white" strokeWidth={3} />
                  </div>
                )}
                <ProductCard product={product} onAddToCart={handleAddToCart} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PRODUK TERBARU */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
            Produk Terbaru
          </h2>
          <button onClick={() => router.push('/produk')}
            className="text-sm font-medium flex items-center gap-1 transition hover:gap-2" style={{ color: '#71BC68' }}>
            Lihat semua <ArrowRight size={14} />
          </button>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl" style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#D4EDDA' }}>
              <Sprout size={32} color="#155724" />
            </div>
            <p className="font-semibold text-sm mb-1" style={{ color: '#0A4C3E' }}>Belum ada produk</p>
            <p className="text-xs" style={{ color: '#6B7C6A' }}>Petani sedang menyiapkan hasil panennya</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(product => (
              <div key={product.id} className="relative">
                {addedId === product.id && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
                    style={{ background: 'rgba(113,188,104,0.9)' }}>
                    <Check size={20} color="white" strokeWidth={3} />
                  </div>
                )}
                <ProductCard product={product} onAddToCart={handleAddToCart} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* BANNER PETANI */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="relative overflow-hidden rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-6"
          style={{ background: 'linear-gradient(135deg, #0A4C3E 0%, #0d6b55 100%)' }}>
          <div className="absolute" style={{ width: 250, height: 250, borderRadius: '50%', background: 'rgba(113,188,104,0.1)', top: -80, right: -50 }} />
          <div className="flex-1 relative">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(113,188,104,0.2)' }}>
              <Sprout size={28} color="#71BC68" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
              Kamu seorang petani?
            </h2>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Bergabung dengan ribuan petani lokal di KiTani. Jual hasil panen langsung ke konsumen, tanpa perantara, harga lebih baik.
            </p>
            <button onClick={() => router.push('/register')}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition hover:opacity-90"
              style={{ background: '#71BC68', color: '#0A4C3E' }}>
              Daftar Jadi Petani <ArrowRight size={16} />
            </button>
          </div>
          <div className="hidden md:flex flex-col gap-3">
            {[
              'Gratis daftar & berjualan',
              'Harga kamu sendiri',
              'Pembayaran aman via Midtrans',
              'Dashboard mudah dipakai',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}>
                <Check size={14} color="#71BC68" strokeWidth={3} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
