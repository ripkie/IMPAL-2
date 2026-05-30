'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Leaf, Cherry, Carrot, Flower2, Bean, Sprout } from 'lucide-react'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  onAddToCart?: (productId: string) => void
}

const CATEGORY_ICON: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  'sayuran-hijau': { icon: Leaf, color: '#155724', bg: '#D4EDDA' },
  'buah-beri': { icon: Cherry, color: '#842029', bg: '#F8D7DA' },
  'umbi-umbian': { icon: Carrot, color: '#7B3F00', bg: '#FFE8CC' },
  'herbal-rempah': { icon: Flower2, color: '#3D6B35', bg: '#D4EDDA' },
  'kacang-kacangan': { icon: Bean, color: '#5C4033', bg: '#EDD9C8' },
  'lainnya': { icon: Sprout, color: '#0A4C3E', bg: '#F4FAF3' },
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const cfg = CATEGORY_ICON[product.categories?.slug ?? 'lainnya'] ?? CATEGORY_ICON['lainnya']
  const IconComp = cfg.icon
  const isHabis = product.stock === 0

  return (
    <div
      className="group bg-white rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{ border: '1px solid rgba(113,188,104,0.15)', boxShadow: '0 2px 8px rgba(10,76,62,0.04)' }}
    >
      <Link href={`/produk/${product.id}`}>
        {/* Gambar — aspect-ratio supaya proporsional di semua ukuran */}
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: '1 / 1', background: '#F4FAF3' }}>
          {product.image_urls?.length > 0 ? (
            <Image
              src={product.image_urls[0]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: cfg.bg }}>
                <IconComp size={26} color={cfg.color} />
              </div>
            </div>
          )}

          {/* Badge stok sedikit */}
          {product.stock <= 5 && product.stock > 0 && (
            <span
              className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: '#FFF3CD', color: '#856404', fontSize: '11px' }}
            >
              Sisa {product.stock}
            </span>
          )}

          {/* Overlay stok habis */}
          {isHabis && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.42)' }}>
              <span className="text-white text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.5)' }}>
                Habis
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-2.5 sm:p-3">
        <Link href={`/produk/${product.id}`}>
          <h3
            className="font-semibold line-clamp-2 mb-0.5 hover:text-[#71BC68] transition-colors leading-snug"
            style={{ color: '#0A4C3E', fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(11px, 2.4vw, 13px)' }}
          >
            {product.name}
          </h3>
        </Link>

        <p className="mb-1.5 truncate" style={{ color: '#6B7C6A', fontSize: '11px' }}>
          {product.profiles?.full_name ?? 'Petani KiTani'}
        </p>

        <div className="mb-2">
          <span className="font-bold" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif', fontSize: 'clamp(12px, 2.6vw, 14px)' }}>
            Rp {product.price.toLocaleString('id-ID')}
          </span>
          <span style={{ color: '#9CA3AF', fontSize: '11px' }}>/{product.unit}</span>
        </div>

        <button
          onClick={() => onAddToCart?.(product.id)}
          disabled={isHabis}
          className="w-full flex items-center justify-center gap-1 rounded-xl font-bold transition-all duration-200 active:scale-95"
          style={{
            background: isHabis ? '#f0f0f0' : '#0A4C3E',
            color: isHabis ? '#9CA3AF' : '#71BC68',
            padding: '7px 6px',
            fontSize: 'clamp(10px, 2vw, 12px)',
          }}
        >
          {isHabis ? 'Stok Habis' : <><ShoppingCart size={11} /> Keranjang</>}
        </button>
      </div>
    </div>
  )
}