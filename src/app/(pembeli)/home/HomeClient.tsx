'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  ArrowRight, Bell, ShoppingCart, Package, ChevronLeft,
  ChevronRight, Leaf, Truck, ShieldCheck, Star, Clock,
  Sunrise, Sun, Sunset, Moon, UtensilsCrossed, Zap,
  Check, X, Cherry, Carrot, Flower2, Bean, Sprout
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

const BANNERS = [
  {
    id: 'promo1',
    type: 'promo',
    bg: 'linear-gradient(120deg, #0A4C3E 0%, #0d6b55 60%, #1a8a6a 100%)',
    badge: 'Flash Sale',
    badgeBg: 'rgba(220,53,69,0.95)',
    title: 'Diskon 30%\nSayuran Hijau',
    subtitle: 'Promo hari ini s/d pukul 23.59. Stok terbatas!',
    cta: 'Belanja Sekarang',
    ctaAction: '/produk?kategori=sayuran-hijau',
    accent: '#71BC68',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&h=400&fit=crop&auto=format',
  },
  {
    id: 'promo2',
    type: 'promo',
    bg: 'linear-gradient(120deg, #1a6b3a 0%, #2d9e5a 60%, #3dbf70 100%)',
    badge: 'Gratis Ongkir',
    badgeBg: 'rgba(45,158,90,0.95)',
    title: 'Gratis Ongkir\nMin. Rp 75.000',
    subtitle: 'Berlaku untuk semua wilayah Indonesia. Pesan sekarang!',
    cta: 'Order Sekarang',
    ctaAction: '/produk',
    accent: '#A8E6A3',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&h=400&fit=crop&auto=format',
  },
  {
    id: 'resep1',
    type: 'resep',
    bg: 'linear-gradient(120deg, #2C5F2E 0%, #4a8c4c 60%, #5fa860 100%)',
    badge: 'Resep Hari Ini',
    badgeBg: 'rgba(200,150,0,0.95)',
    title: 'Sayur Lodeh\nSegar & Gurih',
    subtitle: 'Masak sendiri di rumah dengan bahan organik segar dari KiTani',
    cta: 'Lihat Bahan & Beli',
    ctaAction: null,
    accent: '#FFD700',
    image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&h=400&fit=crop&auto=format',
    recipe: {
      name: 'Sayur Lodeh',
      desc: 'Masakan rumahan khas Jawa yang lezat dan menyehatkan',
      bahan: [
        { nama: 'Labu Siam', qty: '200g' },
        { nama: 'Kacang Panjang', qty: '100g' },
        { nama: 'Wortel', qty: '150g' },
        { nama: 'Tempe', qty: '200g' },
        { nama: 'Daun Salam', qty: '3 lembar' },
        { nama: 'Lengkuas', qty: '2 cm' },
      ]
    }
  },
  {
    id: 'resep2',
    type: 'resep',
    bg: 'linear-gradient(120deg, #1B4332 0%, #40916C 60%, #52b788 100%)',
    badge: 'Resep Sehat',
    badgeBg: 'rgba(64,145,108,0.95)',
    title: 'Tumis Kangkung\nBawang Putih',
    subtitle: 'Sehat, cepat, dan lezat. Cocok untuk makan siang!',
    cta: 'Lihat Bahan & Beli',
    ctaAction: null,
    accent: '#74C69D',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=400&fit=crop&auto=format',
    recipe: {
      name: 'Tumis Kangkung Bawang Putih',
      desc: 'Sayur tumis favorit yang kaya zat besi dan vitamin',
      bahan: [
        { nama: 'Kangkung', qty: '300g' },
        { nama: 'Bawang Putih', qty: '5 siung' },
        { nama: 'Cabai Merah', qty: '3 buah' },
        { nama: 'Terasi', qty: '1 sdt' },
      ]
    }
  },
]

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Menunggu Bayar', color: '#856404', bg: '#FFF3CD' },
  paid: { label: 'Dibayar', color: '#155724', bg: '#D4EDDA' },
  processing: { label: 'Diproses', color: '#004085', bg: '#CCE5FF' },
  shipped: { label: 'Dikirim 🚚', color: '#0A4C3E', bg: '#D4EDDA' },
}


const CATEGORY_ICON: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  'sayuran-hijau': { icon: Leaf, color: '#155724', bg: '#D4EDDA' },
  'buah-beri': { icon: Cherry, color: '#842029', bg: '#F8D7DA' },
  'umbi-umbian': { icon: Carrot, color: '#7B3F00', bg: '#FFE8CC' },
  'herbal-rempah': { icon: Flower2, color: '#3D6B35', bg: '#D4EDDA' },
  'kacang-kacangan': { icon: Bean, color: '#5C4033', bg: '#EDD9C8' },
  'lainnya': { icon: Sprout, color: '#0A4C3E', bg: '#F4FAF3' },
}

// RECIPE MODAL
function RecipeModal({ recipe, image, onClose, onCheckout }: {
  recipe: NonNullable<typeof BANNERS[2]['recipe']>
  image: string
  onClose: () => void
  onCheckout: (items: string[]) => void
}) {
  const [selected, setSelected] = useState<string[]>(recipe.bahan.map(b => b.nama))

  function toggle(nama: string) {
    setSelected(prev => prev.includes(nama) ? prev.filter(n => n !== nama) : [...prev, nama])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-4 pb-4"
      style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden" style={{ background: 'white' }}
        onClick={e => e.stopPropagation()}>
        <div className="relative h-44 overflow-hidden">
          <Image src={image} alt={recipe.name} fill className="object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,76,62,0.95) 40%, rgba(10,76,62,0.2) 100%)' }} />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(200,150,0,0.9)', color: 'white' }}>
                👨‍🍳 Resep Hari Ini
              </span>
              <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}><X size={14} /></button>
            </div>
            <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>{recipe.name}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>{recipe.desc}</p>
          </div>
        </div>
        <div className="p-5">
          <p className="text-sm font-bold mb-3" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
            Pilih bahan yang mau dibeli:
          </p>
          <div className="space-y-2 mb-5">
            {recipe.bahan.map(bahan => (
              <div key={bahan.nama} onClick={() => toggle(bahan.nama)}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition"
                style={{
                  border: `1.5px solid ${selected.includes(bahan.nama) ? '#71BC68' : '#e5e7eb'}`,
                  background: selected.includes(bahan.nama) ? '#F4FAF3' : 'white',
                }}>
                <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: selected.includes(bahan.nama) ? '#71BC68' : '#e5e7eb' }}>
                  {selected.includes(bahan.nama) && <Check size={12} color="white" strokeWidth={3} />}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold" style={{ color: '#0A4C3E' }}>{bahan.nama}</span>
                  <span className="text-xs ml-2" style={{ color: '#6B7C6A' }}>{bahan.qty}</span>
                </div>
                <UtensilsCrossed size={14} color="#71BC68" />
              </div>
            ))}
          </div>
          <button onClick={() => onCheckout(selected)} disabled={selected.length === 0}
            className="w-full py-3 rounded-xl font-bold text-sm transition"
            style={{ background: selected.length === 0 ? '#ccc' : '#0A4C3E', color: selected.length === 0 ? '#999' : '#71BC68' }}>
            🛒 Cari {selected.length} Bahan di KiTani
          </button>
        </div>
      </div>
    </div>
  )
}

// MAIN COMPONENT
export default function HomeClient({ profile, rekomendasi, terbaru, categories, notifikasi, pesananAktif }: Props) {
  const router = useRouter()
  const [addedId, setAddedId] = useState<string | null>(null)
  const [bannerIdx, setBannerIdx] = useState(0)
  const [recipeModal, setRecipeModal] = useState<{ recipe: NonNullable<typeof BANNERS[2]['recipe']>; image: string } | null>(null)
  const touchStartX = useRef<number>(0)
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setBannerIdx(prev => (prev + 1) % BANNERS.length)
    }, 4500)
    return () => clearInterval(autoPlayRef.current!)
  }, [])

  function resetAutoPlay() {
    clearInterval(autoPlayRef.current!)
    autoPlayRef.current = setInterval(() => {
      setBannerIdx(prev => (prev + 1) % BANNERS.length)
    }, 4500)
  }

  function prevBanner() { setBannerIdx(prev => (prev - 1 + BANNERS.length) % BANNERS.length); resetAutoPlay() }
  function nextBanner() { setBannerIdx(prev => (prev + 1) % BANNERS.length); resetAutoPlay() }

  function handleBannerCta(banner: typeof BANNERS[0]) {
    if (banner.type === 'resep' && 'recipe' in banner && banner.recipe) {
      setRecipeModal({ recipe: banner.recipe, image: banner.image })
    } else if (banner.ctaAction) {
      router.push(banner.ctaAction)
    }
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
  const jam = new Date().getHours()
  const salamData = jam < 5
    ? { text: 'Selamat Malam', Icon: Moon, iconColor: '#A8D8EA' }
    : jam < 11
      ? { text: 'Selamat Pagi', Icon: Sunrise, iconColor: '#FFD166' }
      : jam < 15
        ? { text: 'Selamat Siang', Icon: Sun, iconColor: '#FFB347' }
        : jam < 18
          ? { text: 'Selamat Sore', Icon: Sunset, iconColor: '#FF8C69' }
          : { text: 'Selamat Malam', Icon: Moon, iconColor: '#A8D8EA' }

  const currentBanner = BANNERS[bannerIdx]

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>

      {/* Extra spacer mobile agar tidak tertutup navbar */}
      <div className="block md:hidden" style={{ height: '8px' }} />

      {/* SAPAAN + PESANAN AKTIF BAR */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-4 md:pt-5 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <salamData.Icon size={13} color={salamData.iconColor} />
              <p className="text-xs font-medium" style={{ color: '#6B7C6A' }}>{salamData.text}, {firstName}!</p>
            </div>
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
              Mau beli apa hari ini?
            </h1>
          </div>

          {/* Pesanan aktif pill — desktop only */}
          {pesananAktif.length > 0 && (
            <button onClick={() => router.push('/transaksi')}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full transition hover:opacity-90"
              style={{ background: '#0A4C3E' }}>
              <Package size={14} color="#71BC68" />
              <span className="text-xs font-semibold text-white">{pesananAktif.length} pesanan aktif</span>
              <ArrowRight size={12} color="#71BC68" />
            </button>
          )}
        </div>
      </div>

      {/* Banner Full Width */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 mb-6">
        <div className="relative overflow-hidden rounded-3xl select-none cursor-pointer"
          onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
          onTouchEnd={e => {
            const diff = touchStartX.current - e.changedTouches[0].clientX
            if (Math.abs(diff) > 50) diff > 0 ? nextBanner() : prevBanner()
          }}>

          <div className="relative overflow-hidden rounded-3xl" style={{ height: '260px' }}>
            {/* Bg */}
            <div className="absolute inset-0 transition-all duration-700" style={{ background: currentBanner.bg }} />

            {/* Gambar — full cover dengan opacity */}
            <div className="absolute inset-0">
              <Image src={currentBanner.image} alt={currentBanner.title} fill
                className="object-cover" style={{ opacity: 0.45 }} priority />
            </div>

            {/* Gradient overlay dari kiri — teks kiri selalu terbaca */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(10,60,40,0.97) 0%, rgba(10,60,40,0.92) 35%, rgba(10,60,40,0.55) 60%, rgba(10,60,40,0.1) 100%)' }} />

            {/* Content — z-10, pakai padding kiri saja, biarkan kanan untuk foto */}
            <div className="absolute top-0 left-0 bottom-0 flex flex-col justify-center px-8 md:px-14 z-10" style={{ width: '60%' }}>
              <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 w-fit"
                style={{ background: currentBanner.badgeBg, color: 'white' }}>
                {currentBanner.badge}
              </span>
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 leading-tight whitespace-pre-line"
                style={{ fontFamily: 'Sora, sans-serif' }}>
                {currentBanner.title}
              </h2>
              <p className="text-xs md:text-sm mb-4" style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
                {currentBanner.subtitle}
              </p>
              <button onClick={() => handleBannerCta(currentBanner)}
                className="flex items-center gap-2 px-5 md:px-7 py-2.5 md:py-3 rounded-full text-sm font-bold transition hover:opacity-90"
                style={{ background: currentBanner.accent, color: '#0A4C3E', width: 'fit-content' }}>
                {currentBanner.cta} <ArrowRight size={14} />
              </button>
            </div>

            {/* Nav buttons */}
            <button onClick={prevBanner}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center z-10"
              style={{ background: 'rgba(0,0,0,0.3)' }}>
              <ChevronLeft size={18} color="white" />
            </button>
            <button onClick={nextBanner}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center z-10"
              style={{ background: 'rgba(0,0,0,0.3)' }}>
              <ChevronRight size={18} color="white" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {BANNERS.map((_, i) => (
                <button key={i} onClick={() => { setBannerIdx(i); resetAutoPlay() }}
                  className="rounded-full transition-all duration-300"
                  style={{ width: i === bannerIdx ? 24 : 6, height: 6, background: i === bannerIdx ? 'white' : 'rgba(255,255,255,0.45)' }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Keunggulan */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Leaf, title: 'Organik & Segar', desc: 'Dipanen langsung, tiba 24 jam', color: '#D4EDDA', iconColor: '#155724' },
            { icon: Truck, title: 'Gratis Ongkir', desc: 'Min. pembelian Rp 75.000', color: '#CCE5FF', iconColor: '#004085' },
            { icon: ShieldCheck, title: 'Petani Terverifikasi', desc: 'Semua petani sudah diverifikasi', color: '#FFF3CD', iconColor: '#856404' },
          ].map(item => (
            <div key={item.title} className="flex items-center gap-3 p-3 md:p-4 bg-white rounded-2xl"
              style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
              <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: item.color }}>
                <item.icon size={18} color={item.iconColor} />
              </div>
              <div className="hidden sm:block">
                <div className="font-semibold text-sm" style={{ color: '#0A4C3E' }}>{item.title}</div>
                <div className="text-xs mt-0.5" style={{ color: '#6B7C6A' }}>{item.desc}</div>
              </div>
              <div className="sm:hidden">
                <div className="font-semibold text-xs" style={{ color: '#0A4C3E' }}>{item.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PESANAN AKTIF (mobile) */}
      {pesananAktif.length > 0 && (
        <div className="md:hidden max-w-6xl mx-auto px-4 mb-5">
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
                className="flex items-center justify-between p-4 bg-white rounded-2xl cursor-pointer"
                style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#0A4C3E' }}>#{order.order_number}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6B7C6A' }}>Rp {order.total_amount.toLocaleString('id-ID')}</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: STATUS_LABEL[order.status]?.bg ?? '#f0f0f0', color: STATUS_LABEL[order.status]?.color ?? '#666' }}>
                  {STATUS_LABEL[order.status]?.label ?? order.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kategori */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>Kategori</h2>
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
                className="flex flex-col items-center gap-2 p-3 md:p-5 bg-white rounded-2xl transition hover:-translate-y-1 hover:shadow-md"
                style={{ border: '1.5px solid rgba(113,188,104,0.15)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cfg.bg }}>
                  <IconComp size={22} color={cfg.color} />
                </div>
                <span className="text-xs font-semibold text-center leading-tight" style={{ color: '#0A4C3E' }}>{cat.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* FLASH SALE BANNER (desktop strip) */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 mb-6">
        <div className="rounded-2xl px-6 py-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(90deg, #0A4C3E, #0d6b55)' }}>
          <div className="flex items-center gap-3">
            <Zap size={20} color="#FFD700" fill="#FFD700" />
            <div>
              <p className="text-sm font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>Flash Sale Hari Ini</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Diskon hingga 40% untuk produk pilihan</p>
            </div>
          </div>
          <button onClick={() => router.push('/produk?sort=terlaris')}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition hover:opacity-90"
            style={{ background: '#71BC68', color: '#0A4C3E' }}>
            Lihat Promo <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* REKOMENDASI — desktop: 5 col, mobile: 2 col */}
      {rekomendasi.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 md:px-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
              <Star size={18} color="#71BC68" fill="#71BC68" /> Rekomendasi Untukmu
            </h2>
            <button onClick={() => router.push('/produk?sort=terlaris')}
              className="text-sm font-medium flex items-center gap-1 transition hover:gap-2" style={{ color: '#71BC68' }}>
              Lihat semua <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {rekomendasi.slice(0, 10).map(product => (
              <div key={product.id} className="relative">
                {addedId === product.id && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
                    style={{ background: 'rgba(113,188,104,0.9)' }}>
                    <span className="text-white font-bold text-sm flex items-center gap-1"><Check size={16} strokeWidth={3} /> Ditambahkan!</span>
                  </div>
                )}
                <ProductCard product={product} onAddToCart={handleAddToCart} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NOTIFIKASI (mobile) */}
      {notifikasi.length > 0 && (
        <div className="md:hidden max-w-6xl mx-auto px-4 mb-5">
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
              <div key={notif.id} className="flex items-start gap-3 p-4 bg-white rounded-2xl"
                style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: '#F4FAF3' }}>
                  <Bell size={14} color="#71BC68" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#0A4C3E' }}>{notif.title}</p>
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#6B7C6A' }}>{notif.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRODUK TERBARU — desktop: 5 col, mobile: 2 col */}
      {terbaru.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 md:px-6 pb-16">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
              <Clock size={18} color="#71BC68" /> Produk Terbaru
            </h2>
            <button onClick={() => router.push('/produk')}
              className="text-sm font-medium flex items-center gap-1 transition hover:gap-2" style={{ color: '#71BC68' }}>
              Lihat semua <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {terbaru.slice(0, 10).map(product => (
              <div key={product.id} className="relative">
                {addedId === product.id && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
                    style={{ background: 'rgba(113,188,104,0.9)' }}>
                    <span className="text-white font-bold text-sm flex items-center gap-1"><Check size={16} strokeWidth={3} /> Ditambahkan!</span>
                  </div>
                )}
                <ProductCard product={product} onAddToCart={handleAddToCart} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recipe Modal */}
      {recipeModal && (
        <RecipeModal
          recipe={recipeModal.recipe}
          image={recipeModal.image}
          onClose={() => setRecipeModal(null)}
          onCheckout={(items) => {
            router.push(`/produk?q=${encodeURIComponent(items[0])}`)
            setRecipeModal(null)
          }}
        />
      )}
    </div>
  )
}