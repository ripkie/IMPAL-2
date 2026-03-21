'use client'

import { useRouter } from 'next/navigation'
import {
  Package, TrendingUp, AlertTriangle,
  ArrowRight, Plus, ShoppingBag, ClipboardList, Bell, Inbox
} from 'lucide-react'
import type { Profile, Notification } from '@/types'

interface Order {
  id: string
  product_name: string
  quantity: number
  subtotal: number
  created_at: string
  orders: { id: string; order_number: string; status: string; buyer_id: string } | null
}

interface StokItem {
  id: string; name: string; stock: number; unit: string
}

interface Props {
  profile: Profile
  totalProduk: number
  totalPendapatan: number
  pesananMasuk: Order[]
  notifikasi: Notification[]
  stokMenipis: StokItem[]
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Menunggu Bayar', color: '#856404', bg: '#FFF3CD' },
  paid:       { label: 'Dibayar', color: '#155724', bg: '#D4EDDA' },
  processing: { label: 'Diproses', color: '#004085', bg: '#CCE5FF' },
  shipped:    { label: 'Dikirim', color: '#0A4C3E', bg: '#D4EDDA' },
  done:       { label: 'Selesai', color: '#155724', bg: '#D4EDDA' },
}

export default function PetaniHomeClient({
  profile, totalProduk, totalPendapatan, pesananMasuk, notifikasi, stokMenipis
}: Props) {
  const router = useRouter()
  const jam = new Date().getHours()
  const salam = jam < 11 ? 'Selamat Pagi' : jam < 15 ? 'Selamat Siang' : jam < 18 ? 'Selamat Sore' : 'Selamat Malam'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Petani'

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>

      {/* HEADER */}
      <section style={{ background: 'linear-gradient(135deg, #0A4C3E 0%, #0d6b55 100%)' }}
        className="px-5 pt-4 pb-6 md:pt-5 relative overflow-hidden">
        <div className="absolute" style={{ width: 180, height: 180, borderRadius: '50%', background: 'rgba(113,188,104,0.1)', top: -60, right: -30 }} />
        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{salam},</p>
              <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>{firstName}</h1>
            </div>
            <button onClick={() => router.push('/petani/notifikasi')}
              className="relative w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
              <Bell size={16} color="white" />
              {notifikasi.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-white flex items-center justify-center"
                  style={{ background: '#71BC68', fontSize: '9px', fontWeight: 700, border: '2px solid #0A4C3E' }}>
                  {notifikasi.length > 9 ? '9+' : notifikasi.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-5 pb-20">

        {/* STATS */}
        <div className="grid grid-cols-2 gap-3 mt-3 mb-4">
          <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid rgba(113,188,104,0.15)', boxShadow: '0 2px 8px rgba(10,76,62,0.06)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#D4EDDA' }}>
                <Package size={16} color="#155724" />
              </div>
              <span className="text-xs font-medium" style={{ color: '#6B7C6A' }}>Produk Aktif</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>{totalProduk}</p>
          </div>

          <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid rgba(113,188,104,0.15)', boxShadow: '0 2px 8px rgba(10,76,62,0.06)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#CCE5FF' }}>
                <TrendingUp size={16} color="#004085" />
              </div>
              <span className="text-xs font-medium" style={{ color: '#6B7C6A' }}>Total Pendapatan</span>
            </div>
            <p className="text-lg font-bold" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
              Rp {totalPendapatan.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="mb-5">
          <h2 className="font-bold text-sm mb-3" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>Aksi Cepat</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Plus, label: 'Tambah Produk', action: '/petani/produk', bg: '#0A4C3E', iconColor: '#71BC68' },
              { icon: ShoppingBag, label: 'Produk Saya', action: '/petani/produk', bg: 'white', iconColor: '#0A4C3E' },
              { icon: ClipboardList, label: 'Pesanan', action: '/petani/pesanan', bg: 'white', iconColor: '#0A4C3E' },
            ].map(item => (
              <button key={item.label} onClick={() => router.push(item.action)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl transition hover:-translate-y-0.5"
                style={{ background: item.bg, border: '1px solid rgba(113,188,104,0.15)' }}>
                <item.icon size={20} color={item.iconColor} />
                <span className="text-xs font-semibold text-center leading-tight"
                  style={{ color: item.bg === '#0A4C3E' ? '#71BC68' : '#0A4C3E' }}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* STOK MENIPIS */}
        {stokMenipis.length > 0 && (
          <div className="mb-5 p-4 rounded-2xl" style={{ background: '#FFF3CD', border: '1px solid #FFEAA7' }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={15} color="#856404" />
              <h3 className="font-bold text-sm" style={{ color: '#856404' }}>Stok Hampir Habis</h3>
            </div>
            <div className="space-y-2">
              {stokMenipis.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: '#0A4C3E' }}>{item.name}</span>
                  <span className="text-xs font-bold px-2 py-1 rounded-full"
                    style={{ background: 'rgba(133,100,4,0.15)', color: '#856404' }}>
                    Sisa {item.stock} {item.unit}
                  </span>
                </div>
              ))}
            </div>
            <button onClick={() => router.push('/petani/produk')}
              className="mt-2 text-xs font-semibold flex items-center gap-1" style={{ color: '#856404' }}>
              Update stok <ArrowRight size={12} />
            </button>
          </div>
        )}

        {/* PESANAN MASUK */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>Pesanan Masuk</h2>
            <button onClick={() => router.push('/petani/pesanan')}
              className="text-xs font-medium flex items-center gap-1" style={{ color: '#71BC68' }}>
              Lihat semua <ArrowRight size={12} />
            </button>
          </div>

          {pesananMasuk.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl" style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
              <Inbox size={28} color="#9CA3AF" className="mx-auto mb-2" />
              <p className="text-sm font-semibold" style={{ color: '#0A4C3E' }}>Belum ada pesanan</p>
              <p className="text-xs mt-1" style={{ color: '#6B7C6A' }}>Pesanan baru akan muncul di sini</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pesananMasuk.slice(0, 5).map(item => (
                <div key={item.id}
                  onClick={() => router.push('/petani/pesanan')}
                  className="flex items-center gap-3 p-4 bg-white rounded-2xl cursor-pointer hover:shadow-sm transition"
                  style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F4FAF3' }}>
                    <ShoppingBag size={16} color="#71BC68" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#0A4C3E' }}>{item.product_name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6B7C6A' }}>
                      {item.quantity}x · Rp {item.subtotal.toLocaleString('id-ID')}
                    </p>
                  </div>
                  {item.orders && (
                    <span className="text-xs font-bold px-2 py-1 rounded-full shrink-0"
                      style={{
                        background: STATUS_LABEL[item.orders.status]?.bg ?? '#f0f0f0',
                        color: STATUS_LABEL[item.orders.status]?.color ?? '#666'
                      }}>
                      {STATUS_LABEL[item.orders.status]?.label ?? item.orders.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
