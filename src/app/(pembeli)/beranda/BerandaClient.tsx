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
    tagBg: 'rgba(113,188,104,0.25)',
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
    tagBg: 'rgba(59,130,246,0.25)',
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
    tagBg: 'rgba(245,158,11,0.25)',
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

  useEffect(() => { resetTimer(); return () => clearInterval(timer.current) }, [])

  function prev() { setIdx(p => (p - 1 + BANNERS.length) % BANNERS.length); resetTimer() }
  function next() { setIdx(p => (p + 1) % BANNERS.length); resetTimer() }

  const b = BANNERS[idx]

  return (
    <div
      className="relative overflow-hidden rounded-2xl select-none"
      style={{ height: 'clamp(200px, 45vw, 340px)' }}
      onTouchStart={e => { touchX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        const diff = touchX.current - e.changedTouches[0].clientX
        if (Math.abs(diff) > 40) diff > 0 ? next() : prev()
      }}
    >
      <Image src={b.image} alt={b.headline} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 75vw" />

      {/* gradient — lebih gelap di mobile supaya teks selalu terbaca */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to right, rgba(5,30,20,0.97) 0%, rgba(5,30,20,0.9) 45%, rgba(5,30,20,0.5) 72%, rgba(5,30,20,0.05) 100%)'
      }} />

      {/* content — pakai padding responsif, max-width biar tidak tabrakan foto */}
      <div className="absolute inset-0 flex flex-col justify-center px-5 sm:px-8 md:px-10" style={{ maxWidth: '65%' }}>
        <span
          className="inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-2 sm:mb-3 w-fit"
          style={{ background: b.tagBg, color: b.tagColor, fontSize: 'clamp(10px, 2.2vw, 13px)' }}
        >
          {b.tag}
        </span>

        <h2
          className="font-bold text-white leading-tight whitespace-pre-line mb-2 sm:mb-3"
          style={{
            fontFamily: 'Sora, sans-serif',
            fontSize: 'clamp(16px, 4vw, 32px)',
          }}
        >
          {b.headline}
        </h2>

        <p
          className="hidden sm:block mb-4"
          style={{ color: 'rgba(255,255,255,0.78)', lineHeight: 1.6, fontSize: 'clamp(11px, 1.8vw, 14px)' }}
        >
          {b.sub}
        </p>

        <button
          onClick={() => onCta(b.ctaHref)}
          className="flex items-center gap-1.5 rounded-full font-bold w-fit transition hover:opacity-90 active:scale-95"
          style={{
            background: '#71BC68',
            color: '#0A4C3E',
            padding: 'clamp(8px,1.8vw,12px) clamp(14px,3.5vw,24px)',
            fontSize: 'clamp(11px, 2vw, 14px)',
          }}
        >
          {b.cta} <ArrowRight size={14} />
        </button>
      </div>

      {/* prev/next — hidden on very small screens */}
      <button
        onClick={prev}
        className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.35)' }}
      >
        <ChevronLeft size={16} color="white" />
      </button>
      <button
        onClick={next}
        className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.35)' }}
      >
        <ChevronRight size={16} color="white" />
      </button>

      {/* dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => { setIdx(i); resetTimer() }}
            className="rounded-full transition-all duration-300"
            style={{ width: i === idx ? 20 : 5, height: 5, background: i === idx ? 'white' : 'rgba(255,255,255,0.4)' }}
          />
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
    setWishlist(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 pt-4 pb-5">

        {/* Banner + side cards */}
        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr' }}>
          {/* Banner (full width on mobile, 3/4 on desktop) */}
          <div className="md:hidden">
            <BannerSlider onCta={href => router.push(href)} />
          </div>

          {/* Desktop: banner + side cards side by side */}
          <div className="hidden md:grid gap-3" style={{ gridTemplateColumns: '1fr 220px' }}>
            <BannerSlider onCta={href => router.push(href)} />

            <div className="flex flex-col gap-3">
              {/* Flash sale mini card */}
              <div
                className="flex-1 rounded-2xl cursor-pointer hover:opacity-95 transition p-4 flex flex-col justify-between"
                onClick={() => router.push('/produk?sort=terlaris')}
                style={{ background: 'linear-gradient(135deg, #0A4C3E 0%, #1a6b55 100%)', minHeight: '130px' }}
              >
                <div className="flex items-center gap-1.5">
                  <Zap size={15} color="#FCD34D" fill="#FCD34D" />
                  <span className="text-xs font-bold" style={{ color: '#FCD34D' }}>Flash Sale</span>
                </div>
                <div>
                  <p className="font-bold text-white text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>Diskon s/d 40%</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Produk pilihan hari ini</p>
                  <div className="flex items-center gap-1 mt-2.5 text-xs font-semibold" style={{ color: '#71BC68' }}>
                    Lihat promo <ArrowRight size={11} />
                  </div>
                </div>
              </div>

              {/* Petani mini card */}
              <div
                className="flex-1 rounded-2xl cursor-pointer hover:opacity-95 transition p-4 flex flex-col justify-between"
                onClick={() => router.push('/register')}
                style={{ background: 'linear-gradient(135deg, #155724 0%, #2d9e5a 100%)', minHeight: '130px' }}
              >
                <div className="flex items-center gap-1.5">
                  <Sprout size={15} color="white" />
                  <span className="text-xs font-bold text-white">Untuk Petani</span>
                </div>
                <div>
                  <p className="font-bold text-white text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>Jual Hasil Panen</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Daftar gratis, tanpa biaya</p>
                  <div className="flex items-center gap-1 mt-2.5 text-xs font-semibold text-white">
                    Daftar sekarang <ArrowRight size={11} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats — 4 kolom di md+, 2x2 di sm, scrollable di xs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-3">
          {STATS.map(s => (
            <div
              key={s.label}
              className="flex items-center gap-2.5 bg-white px-3 py-2.5 rounded-xl"
              style={{ border: '1px solid rgba(113,188,104,0.15)' }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#F4FAF3' }}>
                <s.icon size={16} color="#0A4C3E" />
              </div>
              <div>
                <div className="font-bold text-sm leading-none" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>{s.value}</div>
                <div className="text-xs mt-0.5" style={{ color: '#6B7C6A' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── KEUNGGULAN — 1 kolom di xs, 3 kolom di sm+ ── */}
      <section className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            { icon: Leaf, title: 'Organik & Segar', desc: 'Dipanen langsung, tiba dalam 24 jam', color: '#D4EDDA', iconColor: '#155724' },
            { icon: Truck, title: 'Gratis Ongkir', desc: 'Min. pembelian Rp 75.000', color: '#DBEAFE', iconColor: '#1D4ED8' },
            { icon: ShieldCheck, title: 'Petani Terverifikasi', desc: 'Semua petani sudah melalui verifikasi', color: '#FEF9C3', iconColor: '#854D0E' },
          ].map(item => (
            <div
              key={item.title}
              className="flex items-center gap-3 p-3 sm:p-4 bg-white rounded-2xl"
              style={{ border: '1px solid rgba(113,188,104,0.12)' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: item.color }}>
                <item.icon size={18} color={item.iconColor} />
              </div>
              <div>
                <div className="font-semibold text-sm" style={{ color: '#0A4C3E' }}>{item.title}</div>
                <div className="text-xs mt-0.5" style={{ color: '#6B7C6A' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── KATEGORI ── */}
      <section className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 pb-7">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base sm:text-lg" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
            Kategori Produk
          </h2>
          <button
            onClick={() => router.push('/produk')}
            className="text-sm font-medium flex items-center gap-1"
            style={{ color: '#71BC68' }}
          >
            Semua <ArrowRight size={13} />
          </button>
        </div>
        {/* 3 kolom di mobile, 6 di md+ */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
          {categories.map(cat => {
            const cfg = CATEGORY_ICON[cat.slug] ?? CATEGORY_ICON['lainnya']
            const IconComp = cfg.icon
            return (
              <button
                key={cat.id}
                onClick={() => router.push(`/produk?kategori=${cat.slug}`)}
                className="flex flex-col items-center gap-1.5 p-2.5 sm:p-3 md:p-4 bg-white rounded-2xl transition active:scale-95 hover:-translate-y-0.5"
                style={{ border: '1.5px solid rgba(113,188,104,0.15)' }}
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center" style={{ background: cfg.bg }}>
                  <IconComp size={22} color={cfg.color} />
                </div>
                <span className="text-xs font-semibold text-center leading-tight" style={{ color: '#0A4C3E' }}>
                  {cat.name}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── FLASH SALE STRIP ── */}
      <section className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 pb-7">
        <div
          className="rounded-2xl px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3"
          style={{ background: 'linear-gradient(90deg, #0A4C3E 0%, #0d6b55 100%)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(252,211,77,0.15)' }}>
              <Zap size={18} color="#FCD34D" fill="#FCD34D" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate" style={{ fontFamily: 'Sora, sans-serif' }}>
                Flash Sale — Berakhir Malam Ini
              </p>
              <p className="text-xs hidden sm:block" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Diskon hingga 40% untuk produk pilihan
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/produk?sort=terlaris')}
            className="flex items-center gap-1.5 rounded-full font-bold transition hover:opacity-90 active:scale-95 shrink-0"
            style={{ background: '#71BC68', color: '#0A4C3E', padding: '8px 14px', fontSize: '13px' }}
          >
            <span className="hidden sm:inline">Lihat Promo</span>
            <span className="sm:hidden">Lihat</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </section>

      {/* ── PRODUK TERLARIS ── */}
      {terlaris.length > 0 && (
        <section className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 pb-7">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base sm:text-lg flex items-center gap-2" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
              <Star size={16} color="#71BC68" fill="#71BC68" /> Terlaris
            </h2>
            <button
              onClick={() => router.push('/produk?sort=terlaris')}
              className="text-sm font-medium flex items-center gap-1"
              style={{ color: '#71BC68' }}
            >
              Lihat semua <ArrowRight size={13} />
            </button>
          </div>
          {/* 2 kolom xs, 3 sm, 4 md, 6 lg */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {terlaris.map(product => (
              <div key={product.id} className="relative">
                {addedId === product.id && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
                    style={{ background: 'rgba(113,188,104,0.92)' }}>
                    <span className="text-white font-bold text-xs sm:text-sm flex items-center gap-1">
                      <Check size={14} strokeWidth={3} /> Ditambahkan
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
      <section className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 pb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base sm:text-lg" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
            Produk Terbaru
          </h2>
          <button
            onClick={() => router.push('/produk')}
            className="text-sm font-medium flex items-center gap-1"
            style={{ color: '#71BC68' }}
          >
            Lihat semua <ArrowRight size={13} />
          </button>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-2xl" style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#D4EDDA' }}>
              <Sprout size={28} color="#155724" />
            </div>
            <p className="font-semibold text-sm mb-1" style={{ color: '#0A4C3E' }}>Belum ada produk</p>
            <p className="text-xs" style={{ color: '#6B7C6A' }}>Petani sedang menyiapkan hasil panennya</p>
          </div>
        ) : (
          /* 2 kolom xs, 3 md, 4 lg */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
            {products.map(product => (
              <div key={product.id} className="relative">
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition"
                  style={{ background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}
                >
                  <Heart
                    size={13}
                    color={wishlist.has(product.id) ? '#ef4444' : '#9CA3AF'}
                    fill={wishlist.has(product.id) ? '#ef4444' : 'none'}
                  />
                </button>
                {addedId === product.id && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
                    style={{ background: 'rgba(113,188,104,0.92)' }}>
                    <span className="text-white font-bold text-xs sm:text-sm flex items-center gap-1">
                      <Check size={14} strokeWidth={3} /> Ditambahkan
                    </span>
                  </div>
                )}
                <ProductCard product={product} onAddToCart={handleAddToCart} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── BANNER PETANI ── */}
      <section className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 pb-20 md:pb-12">
        <div
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl"
          style={{ background: 'linear-gradient(120deg, #0A4C3E 0%, #0d6b55 100%)' }}
        >
          {/* Decorative blobs */}
          <div className="absolute" style={{ width: 220, height: 220, borderRadius: '50%', background: 'rgba(113,188,104,0.1)', top: -70, right: 80 }} />
          <div className="absolute" style={{ width: 130, height: 130, borderRadius: '50%', background: 'rgba(113,188,104,0.07)', bottom: -40, right: -20 }} />

          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6 px-5 sm:px-8 md:px-10 py-8 md:py-10">
            <div className="flex-1 min-w-0">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-3 text-xs font-bold"
                style={{ background: 'rgba(113,188,104,0.2)', color: '#71BC68' }}
              >
                <Sprout size={11} /> Untuk Para Petani
              </div>
              <h2
                className="font-bold text-white mb-2 leading-tight"
                style={{ fontFamily: 'Sora, sans-serif', fontSize: 'clamp(18px, 4vw, 28px)' }}
              >
                Jual Hasil Panen<br />
                <span style={{ color: '#71BC68' }}>Langsung ke Pembeli</span>
              </h2>
              <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.65 }}>
                Bergabung dengan ribuan petani lokal di KiTani. Tanpa perantara, harga lebih baik, pembayaran aman via Midtrans.
              </p>
              <div className="flex gap-2.5 flex-wrap">
                <button
                  onClick={() => router.push('/register')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition hover:opacity-90 active:scale-95"
                  style={{ background: '#71BC68', color: '#0A4C3E' }}
                >
                  Daftar Jadi Petani <ArrowRight size={15} />
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="px-5 py-2.5 rounded-full font-bold text-sm transition hover:bg-white/10"
                  style={{ border: '1.5px solid rgba(255,255,255,0.3)', color: 'white' }}
                >
                  Sudah Punya Akun
                </button>
              </div>
            </div>

            {/* Checklist — tampil di sm+ */}
            <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
              {[
                'Gratis daftar & berjualan',
                'Tentukan harga sendiri',
                'Pembayaran aman via Midtrans',
                'Dashboard mudah dipakai',
                'Dukungan tim KiTani',
              ].map(item => (
                <div
                  key={item}
                  className="flex items-center gap-2.5 text-sm px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}
                >
                  <Check size={13} color="#71BC68" strokeWidth={3} />
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