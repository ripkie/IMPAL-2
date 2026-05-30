'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  ArrowRight, Leaf, Truck, ShieldCheck, Star,
  Sprout, Carrot, Flower2, Bean, Cherry, Check,
  ChevronLeft, ChevronRight, Zap, Users, Package,
  BadgeCheck, Clock, Heart
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ProductCard from '@/components/ui/ProductCard'
import type { Product, Category } from '@/types'

interface Props {
  products: Product[]
  categories: Category[]
  terlaris: Product[]
}

const CATEGORY_ICON: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  'sayuran-hijau': { icon: Leaf, color: '#155724', bg: '#D4EDDA' },
  'buah-beri': { icon: Cherry, color: '#842029', bg: '#F8D7DA' },
  'umbi-umbian': { icon: Carrot, color: '#7B3F00', bg: '#FFE8CC' },
  'herbal-rempah': { icon: Flower2, color: '#3D6B35', bg: '#D4EDDA' },
  'kacang-kacangan': { icon: Bean, color: '#5C4033', bg: '#EDD9C8' },
  'lainnya': { icon: Sprout, color: '#0A4C3E', bg: '#F4FAF3' },
}

const BANNERS = [
  {
    id: 'b1',
    tag: '🌿 Panen Hari Ini',
    tagBg: 'rgba(113,188,104,0.2)',
    tagColor: '#71BC68',
    headline: 'Sayuran Segar\nLangsung dari Kebun',
    sub: 'Hemat hingga 40% dibanding supermarket. Kualitas premium, dipanen pagi, tiba hari ini.',
    cta: 'Belanja Sekarang',
    ctaHref: '/produk',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=900&h=500&fit=crop&auto=format',
  },
  {
    id: 'b2',
    tag: '🚚 Gratis Ongkir',
    tagBg: 'rgba(59,130,246,0.2)',
    tagColor: '#93C5FD',
    headline: 'Gratis Ongkir\nMin. Rp 75.000',
    sub: 'Berlaku seluruh Indonesia. Pesan pagi, sayuran segar tiba di rumahmu sore ini.',
    cta: 'Pesan Sekarang',
    ctaHref: '/produk',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=900&h=500&fit=crop&auto=format',
  },
  {
    id: 'b3',
    tag: '⚡ Flash Sale',
    tagBg: 'rgba(245,158,11,0.2)',
    tagColor: '#FCD34D',
    headline: 'Diskon 30%\nSayuran Pilihan',
    sub: 'Promo terbatas hanya hari ini! Stok terbatas, buruan sebelum habis.',
    cta: 'Lihat Promo',
    ctaHref: '/produk?sort=terlaris',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&h=500&fit=crop&auto=format',
  },
]

const STATS = [
  { icon: Users, value: '200+', label: 'Petani Aktif' },
  { icon: Package, value: '1.500+', label: 'Produk' },
  { icon: BadgeCheck, value: '10rb+', label: 'Pembeli Puas' },
  { icon: Clock, value: '24 jam', label: 'Pengiriman' },
]

function BannerSlider({ onCta }: { onCta: (href: string) => void }) {
  const [idx, setIdx] = useState(0)
  const touchX = useRef(0)
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  function resetTimer() {
    clearInterval(timer.current)
    timer.current = setInterval(() => setIdx(p => (p + 1) % BANNERS.length), 5000)
  }

  useEffect(() => {
    resetTimer()
    return () => clearInterval(timer.current)
  }, [])

  function prev() { setIdx(p => (p - 1 + BANNERS.length) % BANNERS.length); resetTimer() }
  function next() { setIdx(p => (p + 1) % BANNERS.length); resetTimer() }

  const b = BANNERS[idx]

  return (
    <div className="relative overflow-hidden rounded-2xl md:rounded-3xl select-none"
      style={{ height: '320px' }}
      onTouchStart={e => { touchX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        const diff = touchX.current - e.changedTouches[0].clientX
        if (Math.abs(diff) > 50) diff > 0 ? next() : prev()
      }}>

      {/* Image */}
      <Image src={b.image} alt={b.headline} fill className="object-cover transition-opacity duration-700" priority />

      {/* Overlay */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(5,35,25,0.95) 0%, rgba(5,35,25,0.85) 40%, rgba(5,35,25,0.4) 70%, rgba(5,35,25,0.1) 100%)' }} />

      {/* Content */}
      <div className="absolute top-0 left-0 bottom-0 flex flex-col justify-center px-8 md:px-12" style={{ width: '60%' }}>
        <span className="inline-block text-xs font-bold px-3 py-1.5 rounded-full mb-4 w-fit"
          style={{ background: b.tagBg, color: b.tagColor }}>
          {b.tag}
        </span>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight whitespace-pre-line"
          style={{ fontFamily: 'Sora, sans-serif' }}>
          {b.headline}
        </h2>
        <p className="text-sm mb-6 hidden sm:block" style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.65 }}>
          {b.sub}
        </p>
        <button onClick={() => onCta(b.ctaHref)}
          className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm w-fit transition hover:opacity-90"
          style={{ background: '#71BC68', color: '#0A4C3E' }}>
          {b.cta} <ArrowRight size={15} />
        </button>
      </div>

      {/* Prev / Next */}
      <button onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.35)' }}>
        <ChevronLeft size={16} color="white" />
      </button>
      <button onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.35)' }}>
        <ChevronRight size={16} color="white" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
        {BANNERS.map((_, i) => (
          <button key={i} onClick={() => { setIdx(i); resetTimer() }}
            className="rounded-full transition-all duration-300"
            style={{ width: i === idx ? 24 : 6, height: 6, background: i === idx ? 'white' : 'rgba(255,255,255,0.4)' }} />
        ))}
      </div>
    </div>
  )
}

export default function BerandaClient({ products, categories, terlaris }: Props) {
  const router = useRouter()
  const [addedId, setAddedId] = useState<string | null>(null)
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())

  async function handleAddToCart(productId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: existing } = await supabase.from('carts').select('id, quantity')
      .eq('user_id', user.id).eq('product_id', productId).single()
    if (existing) {
      await supabase.from('carts').update({ quantity: existing.quantity + 1, updated_at: new Date().toISOString() }).eq('id', existing.id)
    } else {
      await supabase.from('carts').insert({ user_id: user.id, product_id: productId, quantity: 1 })
    }
    setAddedId(productId)
    setTimeout(() => setAddedId(null), 1500)
  }

  function toggleWishlist(id: string) {
    setWishlist(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-5 pb-8">
        <div className="grid md:grid-cols-[1fr_260px] gap-4">

          {/* Banner slider */}
          <BannerSlider onCta={(href) => router.push(href)} />

          {/* Side cards — desktop only */}
          <div className="hidden md:flex flex-col gap-3">
            {/* Flash Sale card */}
            <div className="flex-1 rounded-2xl overflow-hidden relative cursor-pointer hover:opacity-95 transition"
              onClick={() => router.push('/produk?sort=terlaris')}
              style={{ background: 'linear-gradient(135deg, #0A4C3E 0%, #1a6b55 100%)', minHeight: '140px' }}>
              <div className="p-4 h-full flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={16} color="#FCD34D" fill="#FCD34D" />
                  <span className="text-xs font-bold" style={{ color: '#FCD34D' }}>Flash Sale</span>
                </div>
                <div>
                  <p className="font-bold text-white text-base" style={{ fontFamily: 'Sora, sans-serif' }}>Diskon s/d 40%</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>Produk pilihan hari ini</p>
                  <div className="flex items-center gap-1 mt-3 text-xs font-semibold" style={{ color: '#71BC68' }}>
                    Lihat promo <ArrowRight size={12} />
                  </div>
                </div>
              </div>
            </div>

            {/* Daftar jadi petani card */}
            <div className="flex-1 rounded-2xl overflow-hidden relative cursor-pointer hover:opacity-95 transition"
              onClick={() => router.push('/register')}
              style={{ background: 'linear-gradient(135deg, #1a6b3a 0%, #2d9e5a 100%)', minHeight: '140px' }}>
              <div className="p-4 h-full flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <Sprout size={16} color="white" />
                  <span className="text-xs font-bold text-white">Untuk Petani</span>
                </div>
                <div>
                  <p className="font-bold text-white text-base" style={{ fontFamily: 'Sora, sans-serif' }}>Jual Hasil Panen</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>Bergabung gratis, tanpa biaya awal</p>
                  <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-white">
                    Daftar sekarang <ArrowRight size={12} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {STATS.map(s => (
            <div key={s.label} className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl"
              style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: '#F4FAF3' }}>
                <s.icon size={18} color="#0A4C3E" />
              </div>
              <div>
                <div className="font-bold text-sm" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>{s.value}</div>
                <div className="text-xs" style={{ color: '#6B7C6A' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── KEUNGGULAN ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-8">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Leaf, title: 'Organik & Segar', desc: 'Dipanen langsung, tiba 24 jam', color: '#D4EDDA', iconColor: '#155724' },
            { icon: Truck, title: 'Gratis Ongkir', desc: 'Min. pembelian Rp 75.000', color: '#DBEAFE', iconColor: '#1D4ED8' },
            { icon: ShieldCheck, title: 'Petani Terverifikasi', desc: 'Semua petani sudah diverifikasi', color: '#FEF9C3', iconColor: '#854D0E' },
          ].map(item => (
            <div key={item.title} className="flex flex-col sm:flex-row items-center sm:items-start gap-3 p-3 md:p-4 bg-white rounded-2xl"
              style={{ border: '1px solid rgba(113,188,104,0.12)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: item.color }}>
                <item.icon size={18} color={item.iconColor} />
              </div>
              <div className="text-center sm:text-left">
                <div className="font-semibold text-sm" style={{ color: '#0A4C3E' }}>{item.title}</div>
                <div className="text-xs mt-0.5 hidden sm:block" style={{ color: '#6B7C6A' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── KATEGORI ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
            Kategori Produk
          </h2>
          <button onClick={() => router.push('/produk')}
            className="text-sm font-medium flex items-center gap-1 transition hover:gap-2"
            style={{ color: '#71BC68' }}>
            Semua <ArrowRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {categories.map(cat => {
            const cfg = CATEGORY_ICON[cat.slug] ?? CATEGORY_ICON['lainnya']
            const IconComp = cfg.icon
            return (
              <button key={cat.id}
                onClick={() => router.push(`/produk?kategori=${cat.slug}`)}
                className="flex flex-col items-center gap-2 p-3 md:p-4 bg-white rounded-2xl transition hover:-translate-y-1 hover:shadow-md group"
                style={{ border: '1.5px solid rgba(113,188,104,0.15)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center transition group-hover:scale-110" style={{ background: cfg.bg }}>
                  <IconComp size={24} color={cfg.color} />
                </div>
                <span className="text-xs font-semibold text-center leading-tight" style={{ color: '#0A4C3E' }}>{cat.name}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── FLASH SALE BANNER STRIP ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-10">
        <div className="rounded-2xl px-5 py-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(90deg, #0A4C3E 0%, #0d6b55 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(252,211,77,0.15)' }}>
              <Zap size={20} color="#FCD34D" fill="#FCD34D" />
            </div>
            <div>
              <p className="text-sm font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                Flash Sale — Berakhir Malam Ini
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Diskon hingga 40% untuk produk pilihan
              </p>
            </div>
          </div>
          <button onClick={() => router.push('/produk?sort=terlaris')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition hover:opacity-90 shrink-0"
            style={{ background: '#71BC68', color: '#0A4C3E' }}>
            Lihat Promo <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* ── PRODUK TERLARIS ── */}
      {terlaris.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 md:px-6 pb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
              <Star size={18} color="#71BC68" fill="#71BC68" /> Terlaris
            </h2>
            <button onClick={() => router.push('/produk?sort=terlaris')}
              className="text-sm font-medium flex items-center gap-1 transition hover:gap-2"
              style={{ color: '#71BC68' }}>
              Lihat semua <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {terlaris.map(product => (
              <div key={product.id} className="relative">
                {addedId === product.id && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
                    style={{ background: 'rgba(113,188,104,0.92)' }}>
                    <span className="text-white font-bold text-sm flex items-center gap-1">
                      <Check size={16} strokeWidth={3} /> Ditambahkan
                    </span>
                  </div>
                )}
                <ProductCard product={product} onAddToCart={handleAddToCart} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── PRODUK TERBARU ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
            Produk Terbaru
          </h2>
          <button onClick={() => router.push('/produk')}
            className="text-sm font-medium flex items-center gap-1 transition hover:gap-2"
            style={{ color: '#71BC68' }}>
            Lihat semua <ArrowRight size={14} />
          </button>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl"
            style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: '#D4EDDA' }}>
              <Sprout size={32} color="#155724" />
            </div>
            <p className="font-semibold text-sm mb-1" style={{ color: '#0A4C3E' }}>Belum ada produk</p>
            <p className="text-xs" style={{ color: '#6B7C6A' }}>Petani sedang menyiapkan hasil panennya</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {products.map(product => (
              <div key={product.id} className="relative">
                {/* Wishlist button */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition"
                  style={{ background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
                  <Heart size={14}
                    color={wishlist.has(product.id) ? '#ef4444' : '#9CA3AF'}
                    fill={wishlist.has(product.id) ? '#ef4444' : 'none'}
                  />
                </button>
                {addedId === product.id && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
                    style={{ background: 'rgba(113,188,104,0.92)' }}>
                    <span className="text-white font-bold text-sm flex items-center gap-1">
                      <Check size={16} strokeWidth={3} /> Ditambahkan
                    </span>
                  </div>
                )}
                <ProductCard product={product} onAddToCart={handleAddToCart} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── BANNER DAFTAR PETANI ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-16">
        <div className="relative overflow-hidden rounded-3xl"
          style={{ background: 'linear-gradient(120deg, #0A4C3E 0%, #0d6b55 100%)' }}>

          {/* Decorative circles */}
          <div className="absolute" style={{ width: 280, height: 280, borderRadius: '50%', background: 'rgba(113,188,104,0.1)', top: -80, right: 100 }} />
          <div className="absolute" style={{ width: 160, height: 160, borderRadius: '50%', background: 'rgba(113,188,104,0.07)', bottom: -50, right: -30 }} />

          <div className="relative flex flex-col md:flex-row items-center gap-8 px-8 md:px-12 py-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-xs font-bold"
                style={{ background: 'rgba(113,188,104,0.2)', color: '#71BC68' }}>
                <Sprout size={12} /> Untuk Para Petani
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight"
                style={{ fontFamily: 'Sora, sans-serif' }}>
                Jual Hasil Panen<br />
                <span style={{ color: '#71BC68' }}>Langsung ke Pembeli</span>
              </h2>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
                Bergabung dengan ribuan petani lokal di KiTani. Tanpa perantara,<br className="hidden md:block" />
                harga lebih baik, pembayaran aman via Midtrans.
              </p>
              <div className="flex gap-3 flex-wrap">
                <button onClick={() => router.push('/register')}
                  className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition hover:opacity-90"
                  style={{ background: '#71BC68', color: '#0A4C3E' }}>
                  Daftar Jadi Petani <ArrowRight size={16} />
                </button>
                <button onClick={() => router.push('/login')}
                  className="px-6 py-3 rounded-full font-bold text-sm transition hover:bg-white/10"
                  style={{ border: '1.5px solid rgba(255,255,255,0.3)', color: 'white' }}>
                  Sudah Punya Akun
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 shrink-0">
              {[
                'Gratis daftar & berjualan',
                'Tentukan harga sendiri',
                'Pembayaran aman via Midtrans',
                'Dashboard mudah dipakai',
                'Dukungan tim KiTani',
              ].map(item => (
                <div key={item} className="flex items-center gap-2.5 text-sm px-4 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}>
                  <Check size={14} color="#71BC68" strokeWidth={3} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}