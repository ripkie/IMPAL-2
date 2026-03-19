'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Leaf, Cherry, Carrot, Flower2, Bean, Sprout, Check } from 'lucide-react'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  onAddToCart?: (productId: string) => void
}

const CATEGORY_ICON: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  'sayuran-hijau':  { icon: Leaf,    color: '#155724', bg: '#D4EDDA' },
  'buah-beri':      { icon: Cherry,  color: '#842029', bg: '#F8D7DA' },
  'umbi-umbian':    { icon: Carrot,  color: '#7B3F00', bg: '#FFE8CC' },
  'herbal-rempah':  { icon: Flower2, color: '#3D6B35', bg: '#D4EDDA' },
  'kacang-kacangan':{ icon: Bean,    color: '#5C4033', bg: '#EDD9C8' },
  'lainnya':        { icon: Sprout,  color: '#0A4C3E', bg: '#F4FAF3' },
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const cfg = CATEGORY_ICON[product.categories?.slug ?? 'lainnya'] ?? CATEGORY_ICON['lainnya']
  const IconComp = cfg.icon

  return (
    <div className="group bg-white rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1"
      style={{ border: '1px solid rgba(113,188,104,0.15)', boxShadow: '0 2px 8px rgba(10,76,62,0.04)' }}>
      <Link href={`/produk/${product.id}`}>
        <div className="relative overflow-hidden" style={{ height: '140px', background: '#F4FAF3' }}>
          {product.image_urls?.length > 0 ? (
            <Image
              src={product.image_urls[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: cfg.bg }}>
                <IconComp size={32} color={cfg.color} />
              </div>
            </div>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <span className="absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-full"
              style={{ background: '#FFF3CD', color: '#856404' }}>
              Sisa {product.stock}
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-sm font-bold px-3 py-1 rounded-full bg-black/50">Habis</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-3">
        <Link href={`/produk/${product.id}`}>
          <h3 className="font-semibold text-sm mb-0.5 line-clamp-1 hover:text-[#71BC68] transition-colors"
            style={{ color: '#0A4C3E', fontFamily: 'DM Sans, sans-serif' }}>
            {product.name}
          </h3>
        </Link>
        <p className="text-xs mb-2" style={{ color: '#6B7C6A' }}>
          {product.profiles?.full_name ?? 'Petani KiTani'}
        </p>

        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="font-bold text-sm" style={{ color: '#71BC68', fontFamily: 'Sora, sans-serif' }}>
              Rp {product.price.toLocaleString('id-ID')}
            </span>
            <span className="text-xs ml-1" style={{ color: '#6B7C6A' }}>/{product.unit}</span>
          </div>
        </div>

        <button
          onClick={() => onAddToCart?.(product.id)}
          disabled={product.stock === 0}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all duration-200"
          style={{
            background: product.stock === 0 ? '#f0f0f0' : '#0A4C3E',
            color: product.stock === 0 ? '#999' : '#71BC68',
          }}>
          {product.stock === 0 ? 'Stok Habis' : <><ShoppingCart size={12} /> Keranjang</>}
        </button>
      </div>
    </div>
  )
}
