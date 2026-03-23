'use client'

import { useRouter } from 'next/navigation'
import {
  Package, TrendingUp, AlertTriangle,
  ArrowRight, Plus, ShoppingBag, ClipboardList,
  Bell, Inbox, CheckCircle, Clock
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
  pesananPerluAksi: number
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Menunggu Bayar',  color: '#856404', bg: '#FFF3CD' },
  paid:       { label: 'Perlu Diproses',  color: '#004085', bg: '#CCE5FF' },
  processing: { label: 'Sedang Diproses', color: '#0A4C3E', bg: '#D0ECD6' },
  shipped:    { label: 'Dikirim',         color: '#155724', bg: '#D4EDDA' },
  done:       { label: 'Selesai',         color: '#155724', bg: '#D4EDDA' },
}

export default function PetaniHomeClient({
  profile, totalProduk, totalPendapatan,
  pesananMasuk, notifikasi, stokMenipis, pesananPerluAksi
}: Props) {
  const router = useRouter()
  const jam = new Date().getHours()
  const salam = jam < 11 ? 'Selamat Pagi' : jam < 15 ? 'Selamat Siang' : jam < 18 ? 'Selamat Sore' : 'Selamat Malam'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Petani'

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>

      {/* Header */}
      <section style={{ background: '#0A4C3E', position: 'relative', overflow: 'hidden' }}
        className="px-5 pt-4 pb-6">
        <div className="absolute" style={{ width: 200, height: 200, borderRadius: '50%', background: 'rgba(113,188,104,0.1)', top: -70, right: -40 }} />
        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{salam},</p>
              <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                {firstName}
              </h1>
            </div>
            <button onClick={() => router.push('/petani/notifikasi')}
              className="relative w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
              <Bell size={18} color="white" />
              {notifikasi.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: '#71BC68', fontSize: '9px', fontWeight: 700, color: '#0A4C3E', border: '2px solid #0A4C3E' }}>
                  {notifikasi.length > 9 ? '9+' : notifikasi.length}
                </span>
              )}
            </button>
          </div>

          {/* Banner pesanan perlu aksi */}
          {pesananPerluAksi > 0 && (
            <button
              onClick={() => router.push('/petani/pesanan')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition hover:opacity-90"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(113,188,104,0.3)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: '#71BC68' }}>
                <Clock size={15} color="#0A4C3E" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">
                  {pesananPerluAksi} pesanan butuh tindakan
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  Tap untuk proses sekarang
                </p>
              </div>
              <ArrowRight size={16} color="rgba(255,255,255,0.6)" />
            </button>
          )}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-5 pb-24">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mt-4 mb-4">
          <div className="bg-white rounded-2xl p-4"
            style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#D4EDDA' }}>
                <Package size={16} color="#155724" />
              </div>
              <span className="text-xs font-medium" style={{ color: '#6B7C6A' }}>Produk Aktif</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
              {totalProduk}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4"
            style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#CCE5FF' }}>
                <TrendingUp size={16} color="#004085" />
              </div>
              <span className="text-xs font-medium" style={{ color: '#6B7C6A' }}>Pendapatan</span>
            </div>
            <p className="text-base font-bold" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
              Rp {totalPendapatan.toLocaleString('id-ID')}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#6B7C6A' }}>Pesanan selesai</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-5">
          <h2 className="font-bold text-sm mb-3" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
            Aksi Cepat
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Plus,          label: 'Tambah Produk',  href: '/petani/produk',  dark: true },
              { icon: ShoppingBag,   label: 'Produk Saya',    href: '/petani/produk',  dark: false },
              { icon: ClipboardList, label: 'Pesanan',        href: '/petani/pesanan', dark: false, badge: pesananPerluAksi },
            ].map(item => (
              <button key={item.label} onClick={() => router.push(item.href)}
                className="relative flex flex-col items-center gap-2 p-4 rounded-2xl transition hover:-translate-y-0.5"
                style={{
                  background: item.dark ? '#0A4C3E' : 'white',
                  border: '1px solid rgba(113,188,104,0.15)',
                }}>
                <item.icon size={20} color={item.dark ? '#71BC68' : '#0A4C3E'} />
                <span className="text-xs font-semibold text-center leading-tight"
                  style={{ color: item.dark ? '#71BC68' : '#0A4C3E' }}>
                  {item.label}
                </span>
                {item.badge && item.badge > 0 ? (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white"
                    style={{ background: '#dc3545', fontSize: '10px', fontWeight: 700 }}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {/* Stok Menipis */}
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

        {/* Pesanan Terbaru */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
              Pesanan Terbaru
            </h2>
            <button onClick={() => router.push('/petani/pesanan')}
              className="text-xs font-medium flex items-center gap-1" style={{ color: '#71BC68' }}>
              Lihat semua <ArrowRight size={12} />
            </button>
          </div>

          {pesananMasuk.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl"
              style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
              <Inbox size={28} color="#9CA3AF" className="mx-auto mb-2" />
              <p className="text-sm font-semibold" style={{ color: '#0A4C3E' }}>Belum ada pesanan</p>
              <p className="text-xs mt-1" style={{ color: '#6B7C6A' }}>Pesanan baru akan muncul di sini</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pesananMasuk.slice(0, 5).map(item => {
                const statusCfg = STATUS_LABEL[item.orders?.status ?? 'pending']
                const needsAction = item.orders?.status === 'paid' || item.orders?.status === 'processing'
                return (
                  <div key={item.id}
                    onClick={() => router.push('/petani/pesanan')}
                    className="flex items-center gap-3 p-4 bg-white rounded-2xl cursor-pointer transition hover:shadow-sm"
                    style={{ border: `1px solid ${needsAction ? 'rgba(0,64,133,0.2)' : 'rgba(113,188,104,0.15)'}` }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: statusCfg?.bg ?? '#f0f0f0' }}>
                      <ShoppingBag size={16} color={statusCfg?.color ?? '#666'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#0A4C3E' }}>
                        {item.product_name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#6B7C6A' }}>
                        {item.quantity}× · Rp {item.subtotal.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full shrink-0"
                      style={{ background: statusCfg?.bg ?? '#f0f0f0', color: statusCfg?.color ?? '#666' }}>
                      {statusCfg?.label ?? item.orders?.status}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
