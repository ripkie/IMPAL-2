'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, Bell, ShoppingCart, Package, ChevronLeft,
  ChevronRight, Leaf, Truck, ShieldCheck, Star, Clock
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ProductCard from '@/components/ui/ProductCard'
import type { Product, Category, Notification, Profile } from '@/types'

interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  created_at: string
}

interface Props {
  profile: Profile
  rekomendasi: Product[]
  terbaru: Product[]
  categories: Category[]
  notifikasi: Notification[]
  pesananAktif: Order[]
}

// ── BANNER DATA ──────────────────────────────────────────────
const BANNERS = [
  {
    id: 'promo1',
    type: 'promo',
    bg: 'linear-gradient(135deg, #0A4C3E 0%, #0d6b55 100%)',
    badge: '🔥 Flash Sale',
    badgeBg: 'rgba(255,107,107,0.9)',
    title: 'Diskon 30%\nSayuran Hijau',
    subtitle: 'Promo hari ini s/d pukul 23.59. Stok terbatas!',
    cta: 'Belanja Sekarang',
    ctaAction: '/produk?kategori=sayuran-hijau',
    emoji: '🥬',
    accent: '#71BC68',
  },
  {
    id: 'promo2',
    type: 'promo',
    bg: 'linear-gradient(135deg, #1a6b3a 0%, #2d9e5a 100%)',
    badge: '🚚 Gratis Ongkir',
    badgeBg: 'rgba(45,158,90,0.9)',
    title: 'Gratis Ongkir\nMin. Rp 75.000',
    subtitle: 'Berlaku untuk semua wilayah Indonesia. Pesan sekarang!',
    cta: 'Order Sekarang',
    ctaAction: '/produk',
    emoji: '📦',
    accent: '#A8E6A3',
  },
  {
    id: 'resep1',
    type: 'resep',
    bg: 'linear-gradient(135deg, #2C5F2E 0%, #4a8c4c 100%)',
    badge: '👨‍🍳 Resep Hari Ini',
    badgeBg: 'rgba(255,193,7,0.9)',
    title: 'Sayur Lodeh\nSegar & Gurih',
    subtitle: 'Masak sendiri di rumah dengan bahan organik segar dari KiTani',
    cta: 'Lihat Bahan & Beli',
    ctaAction: null, // handled by modal
    emoji: '🍲',
    accent: '#FFD700',
    recipe: {
      name: 'Sayur Lodeh',
      desc: 'Masakan rumahan khas Jawa yang lezat dan menyehatkan',
      bahan: [
        { nama: 'Labu Siam', qty: '200g', kategori: 'sayuran-hijau' },
        { nama: 'Kacang Panjang', qty: '100g', kategori: 'kacang-kacangan' },
        { nama: 'Wortel', qty: '150g', kategori: 'umbi-umbian' },
        { nama: 'Tempe', qty: '200g', kategori: 'lainnya' },
        { nama: 'Daun Salam', qty: '3 lembar', kategori: 'herbal-rempah' },
        { nama: 'Lengkuas', qty: '2 cm', kategori: 'herbal-rempah' },
      ]
    }
  },
  {
    id: 'resep2',
    type: 'resep',
    bg: 'linear-gradient(135deg, #1B4332 0%, #40916C 100%)',
    badge: '🥗 Resep Sehat',
    badgeBg: 'rgba(64,145,108,0.9)',
    title: 'Tumis Kangkung\nBawang Putih',
    subtitle: 'Sehat, cepat, dan lezat. Cocok untuk makan siang!',
    cta: 'Lihat Bahan & Beli',
    ctaAction: null,
    emoji: '🥬',
    accent: '#74C69D',
    recipe: {
      name: 'Tumis Kangkung Bawang Putih',
      desc: 'Sayur tumis favorit yang kaya zat besi dan vitamin',
      bahan: [
        { nama: 'Kangkung', qty: '300g', kategori: 'sayuran-hijau' },
        { nama: 'Bawang Putih', qty: '5 siung', kategori: 'herbal-rempah' },
        { nama: 'Cabai Merah', qty: '3 buah', kategori: 'herbal-rempah' },
        { nama: 'Terasi', qty: '1 sdt', kategori: 'lainnya' },
      ]
    }
  },
]

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Menunggu Bayar', color: '#856404', bg: '#FFF3CD' },
  paid: { label: 'Dibayar', color: '#155724', bg: '#D4EDDA' },
  processing: { label: 'Diproses', color: '#004085', bg: '#CCE5FF' },
  shipped: { label: 'Dikirim', color: '#0A4C3E', bg: '#D4EDDA' },
}

// ── RECIPE MODAL ─────────────────────────────────────────────
function RecipeModal({ recipe, onClose, onCheckout }: {
  recipe: typeof BANNERS[2]['recipe']
  onClose: () => void
  onCheckout: (items: string[]) => void
}) {
  const [selected, setSelected] = useState<string[]>(recipe!.bahan.map(b => b.nama))

  function toggle(nama: string) {
    setSelected(prev => prev.includes(nama) ? prev.filter(n => n !== nama) : [...prev, nama])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-4 pb-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{ background: 'white' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="p-5 pb-4" style={{ background: 'linear-gradient(135deg, #0A4C3E, #0d6b55)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(255,193,7,0.9)', color: '#000' }}>
              👨‍🍳 Resep Hari Ini
            </span>
            <button onClick={onClose} className="text-white/70 hover:text-white text-xl">✕</button>
          </div>
          <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>{recipe!.name}</h3>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{recipe!.desc}</p>
        </div>

        {/* Bahan */}
        <div className="p-5">
          <p className="text-sm font-bold mb-3" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
            Pilih bahan yang mau dibeli:
          </p>
          <div className="space-y-2 mb-5">
            {recipe!.bahan.map(bahan => (
              <div key={bahan.nama}
                onClick={() => toggle(bahan.nama)}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition"
                style={{
                  border: `1.5px solid ${selected.includes(bahan.nama) ? '#71BC68' : '#e5e7eb'}`,
                  background: selected.includes(bahan.nama) ? '#F4FAF3' : 'white',
                }}>
                <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: selected.includes(bahan.nama) ? '#71BC68' : '#e5e7eb' }}>
                  {selected.includes(bahan.nama) && <span className="text-white text-xs">✓</span>}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold" style={{ color: '#0A4C3E' }}>{bahan.nama}</span>
                  <span className="text-xs ml-2" style={{ color: '#6B7C6A' }}>{bahan.qty}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onCheckout(selected)}
            disabled={selected.length === 0}
            className="w-full py-3 rounded-xl font-bold text-sm transition"
            style={{
              background: selected.length === 0 ? '#ccc' : '#0A4C3E',
              color: selected.length === 0 ? '#999' : '#71BC68',
              fontFamily: 'DM Sans, sans-serif'
            }}>
            🛒 Cari {selected.length} Bahan di KiTani
          </button>
        </div>
      </div>
    </div>
  )
}

// ── MAIN COMPONENT ───────────────────────────────────────────
export default function HomeClient({ profile, rekomendasi, terbaru, categories, notifikasi, pesananAktif }: Props) {
  const router = useRouter()
  const [addedId, setAddedId] = useState<string | null>(null)
  const [bannerIdx, setBannerIdx] = useState(0)
  const [recipeModal, setRecipeModal] = useState<typeof BANNERS[2]['recipe'] | null>(null)
  const bannerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number>(0)
  const autoPlayRef = useRef<NodeJS.Timeout>()

  // Auto-play banner
  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setBannerIdx(prev => (prev + 1) % BANNERS.length)
    }, 4000)
    return () => clearInterval(autoPlayRef.current)
  }, [])

  function resetAutoPlay() {
    clearInterval(autoPlayRef.current)
    autoPlayRef.current = setInterval(() => {
      setBannerIdx(prev => (prev + 1) % BANNERS.length)
    }, 4000)
  }

  function prevBanner() {
    setBannerIdx(prev => (prev - 1 + BANNERS.length) % BANNERS.length)
    resetAutoPlay()
  }

  function nextBanner() {
    setBannerIdx(prev => (prev + 1) % BANNERS.length)
    resetAutoPlay()
  }

  function handleBannerCta(banner: typeof BANNERS[0]) {
    if (banner.type === 'resep' && banner.recipe) {
      setRecipeModal(banner.recipe)
    } else if (banner.ctaAction) {
      router.push(banner.ctaAction)
    }
  }

  function handleRecipeCheckout(items: string[]) {
    const q = items.join(',')
    router.push(`/produk?q=${encodeURIComponent(items[0])}`)
    setRecipeModal(null)
  }

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

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Kamu'
  const currentBanner = BANNERS[bannerIdx]
  const jam = new Date().getHours()
  const salam = jam < 11 ? 'Selamat Pagi' : jam < 15 ? 'Selamat Siang' : jam < 18 ? 'Selamat Sore' : 'Selamat Malam'

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>

      {/* ── HEADER SAPAAN ── */}
      <section className="px-5 pt-5 pb-3 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium mb-0.5" style={{ color: '#6B7C6A' }}>{salam},</p>
            <h1 className="text-xl font-bold" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
              {firstName} 👋
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Notif */}
            <button onClick={() => router.push('/notifikasi')}
              className="relative w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'white', border: '1px solid rgba(113,188,104,0.2)' }}>
              <Bell size={18} color="#0A4C3E" />
              {notifikasi.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full text-white flex items-center justify-center"
                  style={{ background: '#71BC68', fontSize: '9px', fontWeight: 700, border: '2px solid #F4FAF3' }}>
                  {notifikasi.length > 9 ? '9+' : notifikasi.length}
                </span>
              )}
            </button>
            {/* Keranjang */}
            <button onClick={() => router.push('/keranjang')}
              className="relative w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: '#0A4C3E' }}>
              <ShoppingCart size={18} color="#71BC68" />
            </button>
          </div>
        </div>
      </section>

      {/* ── SWIPEABLE BANNER ── */}
      <section className="px-5 mb-5 max-w-5xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl select-none"
          ref={bannerRef}
          onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
          onTouchEnd={e => {
            const diff = touchStartX.current - e.changedTouches[0].clientX
            if (Math.abs(diff) > 50) diff > 0 ? nextBanner() : prevBanner()
          }}
          style={{ minHeight: '200px', background: currentBanner.bg, transition: 'background 0.5s ease' }}>

          {/* Decorative circles */}
          <div className="absolute" style={{ width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -80, right: -60 }} />
          <div className="absolute" style={{ width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', bottom: -50, left: 30 }} />

          <div className="relative p-6 flex items-center gap-4">
            <div className="flex-1">
              <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3"
                style={{ background: currentBanner.badgeBg, color: 'white' }}>
                {currentBanner.badge}
              </span>
              <h2 className="text-2xl font-bold text-white mb-2 leading-tight whitespace-pre-line"
                style={{ fontFamily: 'Sora, sans-serif' }}>
                {currentBanner.title}
              </h2>
              <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                {currentBanner.subtitle}
              </p>
              <button
                onClick={() => handleBannerCta(currentBanner)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition hover:opacity-90"
                style={{ background: currentBanner.accent, color: '#0A4C3E' }}>
                {currentBanner.cta} <ArrowRight size={14} />
              </button>
            </div>
            <div className="text-7xl shrink-0 hidden sm:block">{currentBanner.emoji}</div>
          </div>

          {/* Prev/Next Buttons */}
          <button onClick={prevBanner}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            <ChevronLeft size={16} color="white" />
          </button>
          <button onClick={nextBanner}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            <ChevronRight size={16} color="white" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {BANNERS.map((_, i) => (
              <button key={i} onClick={() => { setBannerIdx(i); resetAutoPlay() }}
                className="rounded-full transition-all"
                style={{
                  width: i === bannerIdx ? 20 : 6,
                  height: 6,
                  background: i === bannerIdx ? 'white' : 'rgba(255,255,255,0.4)'
                }} />
            ))}
          </div>
        </div>
      </section>

      {/* ── PESANAN AKTIF ── */}
      {pesananAktif.length > 0 && (
        <section className="px-5 mb-5 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base flex items-center gap-2" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
              <Package size={16} color="#71BC68" /> Pesanan Aktif
            </h2>
            <button onClick={() => router.push('/transaksi')}
              className="text-xs font-medium flex items-center gap-1" style={{ color: '#71BC68' }}>
              Lihat semua <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {pesananAktif.map(order => (
              <div key={order.id}
                onClick={() => router.push(`/transaksi/${order.id}`)}
                className="flex items-center justify-between p-4 bg-white rounded-2xl cursor-pointer hover:shadow-sm transition"
                style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#0A4C3E' }}>#{order.order_number}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6B7C6A' }}>
                    Rp {order.total_amount.toLocaleString('id-ID')}
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{
                    background: STATUS_LABEL[order.status]?.bg ?? '#f0f0f0',
                    color: STATUS_LABEL[order.status]?.color ?? '#666'
                  }}>
                  {STATUS_LABEL[order.status]?.label ?? order.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── NOTIFIKASI TERBARU ── */}
      {notifikasi.length > 0 && (
        <section className="px-5 mb-5 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base flex items-center gap-2" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
              <Bell size={16} color="#71BC68" /> Notifikasi
            </h2>
            <button onClick={() => router.push('/notifikasi')}
              className="text-xs font-medium flex items-center gap-1" style={{ color: '#71BC68' }}>
              Lihat semua <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {notifikasi.slice(0, 3).map(notif => (
              <div key={notif.id}
                className="flex items-start gap-3 p-4 bg-white rounded-2xl"
                style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: '#F4FAF3' }}>
                  <Bell size={14} color="#71BC68" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#0A4C3E' }}>{notif.title}</p>
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#6B7C6A' }}>{notif.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── KATEGORI ── */}
      <section className="px-5 mb-5 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>Kategori</h2>
          <button onClick={() => router.push('/produk')}
            className="text-xs font-medium flex items-center gap-1" style={{ color: '#71BC68' }}>
            Lihat semua <ArrowRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
          {categories.map(cat => {
            const EMOJI: Record<string, string> = {
              'sayuran-hijau': '🥬', 'buah-beri': '🍅', 'umbi-umbian': '🥕',
              'herbal-rempah': '🌿', 'kacang-kacangan': '🫘', 'lainnya': '🥦',
            }
            return (
              <button key={cat.id}
                onClick={() => router.push(`/produk?kategori=${cat.slug}`)}
                className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-2xl transition hover:-translate-y-0.5 hover:shadow-sm"
                style={{ border: '1.5px solid rgba(113,188,104,0.15)' }}>
                <span className="text-2xl">{EMOJI[cat.slug] ?? '🥦'}</span>
                <span className="text-xs font-semibold text-center leading-tight" style={{ color: '#0A4C3E' }}>
                  {cat.name}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── KEUNGGULAN ── */}
      <section className="px-5 mb-5 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: Leaf, title: 'Organik & Segar', desc: 'Dipanen langsung, sampai 24 jam', color: '#D4EDDA', iconColor: '#155724' },
            { icon: Truck, title: 'Gratis Ongkir', desc: 'Min. pembelian Rp 75.000', color: '#CCE5FF', iconColor: '#004085' },
            { icon: ShieldCheck, title: 'Terverifikasi', desc: 'Semua petani sudah diverifikasi', color: '#FFF3CD', iconColor: '#856404' },
          ].map(item => (
            <div key={item.title} className="flex items-center gap-3 p-4 bg-white rounded-2xl"
              style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: item.color }}>
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

      {/* ── REKOMENDASI ── */}
      {rekomendasi.length > 0 && (
        <section className="px-5 mb-5 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base flex items-center gap-2" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
              <Star size={16} color="#71BC68" fill="#71BC68" /> Rekomendasi Untukmu
            </h2>
            <button onClick={() => router.push('/produk?sort=terlaris')}
              className="text-xs font-medium flex items-center gap-1" style={{ color: '#71BC68' }}>
              Lihat semua <ArrowRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {rekomendasi.map(product => (
              <div key={product.id} className="relative">
                {addedId === product.id && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
                    style={{ background: 'rgba(113,188,104,0.9)' }}>
                    <span className="text-white font-bold text-sm">✓ Ditambahkan!</span>
                  </div>
                )}
                <ProductCard product={product} onAddToCart={handleAddToCart} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── PRODUK TERBARU ── */}
      {terbaru.length > 0 && (
        <section className="px-5 pb-16 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base flex items-center gap-2" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
              <Clock size={16} color="#71BC68" /> Produk Terbaru
            </h2>
            <button onClick={() => router.push('/produk')}
              className="text-xs font-medium flex items-center gap-1" style={{ color: '#71BC68' }}>
              Lihat semua <ArrowRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {terbaru.map(product => (
              <div key={product.id} className="relative">
                {addedId === product.id && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
                    style={{ background: 'rgba(113,188,104,0.9)' }}>
                    <span className="text-white font-bold text-sm">✓ Ditambahkan!</span>
                  </div>
                )}
                <ProductCard product={product} onAddToCart={handleAddToCart} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── RECIPE MODAL ── */}
      {recipeModal && (
        <RecipeModal
          recipe={recipeModal}
          onClose={() => setRecipeModal(null)}
          onCheckout={handleRecipeCheckout}
        />
      )}
    </div>
  )
}
