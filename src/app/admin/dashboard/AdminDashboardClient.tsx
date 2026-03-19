'use client'

import { useRouter } from 'next/navigation'
import {
  Users, ShoppingBag, ClipboardList, CheckCircle,
  AlertTriangle, ArrowRight, Shield, TrendingUp,
  UserCheck, Package, LogOut
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PetaniPending {
  id: string
  farm_name: string
  farm_location: string
  created_at: string
  verify_status: string
  profiles: { id: string; full_name: string; phone: string } | null
}

interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  created_at: string
  payment_status: string
}

interface Props {
  totalPembeli: number
  totalPetani: number
  totalProduk: number
  totalOrder: number
  pendingVerifikasi: number
  petaniPending: PetaniPending[]
  orderTerbaru: Order[]
}

const ORDER_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#856404', bg: '#FFF3CD' },
  paid: { label: 'Dibayar', color: '#155724', bg: '#D4EDDA' },
  processing: { label: 'Diproses', color: '#004085', bg: '#CCE5FF' },
  shipped: { label: 'Dikirim', color: '#0A4C3E', bg: '#D4EDDA' },
  done: { label: 'Selesai', color: '#155724', bg: '#D4EDDA' },
  cancelled: { label: 'Dibatal', color: '#721c24', bg: '#F8D7DA' },
}

export default function AdminDashboardClient({
  totalPembeli, totalPetani, totalProduk, totalOrder,
  pendingVerifikasi, petaniPending, orderTerbaru
}: Props) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const stats = [
    { icon: Users, label: 'Total Pembeli', value: totalPembeli, color: '#CCE5FF', iconColor: '#004085' },
    { icon: UserCheck, label: 'Total Petani', value: totalPetani, color: '#D4EDDA', iconColor: '#155724' },
    { icon: ShoppingBag, label: 'Produk Aktif', value: totalProduk, color: '#FFF3CD', iconColor: '#856404' },
    { icon: ClipboardList, label: 'Total Order', value: totalOrder, color: '#F8D7DA', iconColor: '#721c24' },
  ]

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>

      {/* ── HEADER ── */}
      <div style={{ background: 'linear-gradient(135deg, #0A4C3E 0%, #0d6b55 100%)' }}
        className="px-6 pt-6 pb-10 relative overflow-hidden">
        <div className="absolute" style={{ width: 250, height: 250, borderRadius: '50%', background: 'rgba(113,188,104,0.08)', top: -100, right: -50 }} />
        <div className="max-w-6xl mx-auto relative">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield size={16} color="#71BC68" />
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(113,188,104,0.2)', color: '#71BC68' }}>
                  Admin Panel
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                Dashboard Admin 🛡️
              </h1>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Kelola platform KiTani dari sini
              </p>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm transition hover:bg-white/20"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
              <LogOut size={15} /> Keluar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-6">

        {/* ── STATS GRID ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {stats.map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-4"
              style={{ border: '1px solid rgba(113,188,104,0.15)', boxShadow: '0 4px 16px rgba(10,76,62,0.08)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: stat.color }}>
                  <stat.icon size={18} color={stat.iconColor} />
                </div>
                <span className="text-xs font-medium" style={{ color: '#6B7C6A' }}>{stat.label}</span>
              </div>
              <p className="text-3xl font-bold" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
                {stat.value.toLocaleString('id-ID')}
              </p>
            </div>
          ))}
        </div>

        {/* ── ALERT PENDING ── */}
        {pendingVerifikasi > 0 && (
          <div className="mb-6 p-4 rounded-2xl flex items-center justify-between"
            style={{ background: '#FFF3CD', border: '1.5px solid #FFEAA7' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FFD700' }}>
                <AlertTriangle size={20} color="#856404" />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: '#856404' }}>
                  {pendingVerifikasi} Petani Menunggu Verifikasi
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#856404', opacity: 0.8 }}>
                  Segera review dan verifikasi akun petani yang mendaftar
                </p>
              </div>
            </div>
            <button onClick={() => router.push('/admin/verifikasi')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition hover:opacity-90 shrink-0"
              style={{ background: '#856404', color: 'white' }}>
              Review Sekarang <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* ── QUICK ACTIONS ── */}
        <div className="mb-6">
          <h2 className="font-bold text-base mb-3" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>Kelola Platform</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: UserCheck, label: 'Verifikasi Petani', desc: `${pendingVerifikasi} pending`, action: '/admin/verifikasi', bg: '#0A4C3E', iconColor: '#71BC68', badge: pendingVerifikasi },
              { icon: Users, label: 'Semua Pengguna', desc: `${totalPembeli + totalPetani} total`, action: '/admin/pengguna', bg: 'white', iconColor: '#0A4C3E' },
              { icon: ShoppingBag, label: 'Kelola Produk', desc: `${totalProduk} aktif`, action: '/admin/produk', bg: 'white', iconColor: '#0A4C3E' },
              { icon: ClipboardList, label: 'Semua Order', desc: `${totalOrder} order`, action: '/admin/orders', bg: 'white', iconColor: '#0A4C3E' },
            ].map(item => (
              <button key={item.label}
                onClick={() => router.push(item.action)}
                className="relative flex flex-col items-start gap-3 p-4 rounded-2xl transition hover:-translate-y-0.5 hover:shadow-md text-left"
                style={{ background: item.bg, border: '1px solid rgba(113,188,104,0.15)' }}>
                {item.badge && item.badge > 0 && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full text-white flex items-center justify-center"
                    style={{ background: '#dc3545', fontSize: '10px', fontWeight: 700 }}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: item.bg === '#0A4C3E' ? 'rgba(113,188,104,0.2)' : '#F4FAF3' }}>
                  <item.icon size={20} color={item.iconColor} />
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: item.bg === '#0A4C3E' ? 'white' : '#0A4C3E' }}>
                    {item.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: item.bg === '#0A4C3E' ? 'rgba(255,255,255,0.65)' : '#6B7C6A' }}>
                    {item.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── 2 COLUMN: Pending Verifikasi + Order Terbaru ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-16">

          {/* Petani Pending */}
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
                <UserCheck size={16} color="#71BC68" /> Antrian Verifikasi
              </h3>
              <button onClick={() => router.push('/admin/verifikasi')}
                className="text-xs font-medium flex items-center gap-1" style={{ color: '#71BC68' }}>
                Lihat semua <ArrowRight size={12} />
              </button>
            </div>

            {petaniPending.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle size={36} color="#71BC68" className="mx-auto mb-2" />
                <p className="text-sm font-semibold" style={{ color: '#0A4C3E' }}>Semua sudah diverifikasi!</p>
                <p className="text-xs mt-1" style={{ color: '#6B7C6A' }}>Tidak ada antrian verifikasi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {petaniPending.map(petani => (
                  <div key={petani.id}
                    onClick={() => router.push('/admin/verifikasi')}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition hover:bg-[#F4FAF3]"
                    style={{ border: '1px solid rgba(113,188,104,0.1)' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                      style={{ background: '#D4EDDA', color: '#155724' }}>
                      {petani.profiles?.full_name?.[0]?.toUpperCase() ?? 'P'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#0A4C3E' }}>
                        {petani.profiles?.full_name ?? 'Petani'}
                      </p>
                      <p className="text-xs truncate" style={{ color: '#6B7C6A' }}>
                        🌾 {petani.farm_name} · {petani.farm_location}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full shrink-0"
                      style={{ background: '#FFF3CD', color: '#856404' }}>
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Terbaru */}
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
                <Package size={16} color="#71BC68" /> Order Terbaru
              </h3>
              <button onClick={() => router.push('/admin/orders')}
                className="text-xs font-medium flex items-center gap-1" style={{ color: '#71BC68' }}>
                Lihat semua <ArrowRight size={12} />
              </button>
            </div>

            {orderTerbaru.length === 0 ? (
              <div className="text-center py-8">
                <Package size={36} color="#ccc" className="mx-auto mb-2" />
                <p className="text-sm font-semibold" style={{ color: '#0A4C3E' }}>Belum ada order</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orderTerbaru.map(order => (
                  <div key={order.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ border: '1px solid rgba(113,188,104,0.1)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: '#F4FAF3' }}>
                      <ClipboardList size={16} color="#71BC68" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: '#0A4C3E' }}>#{order.order_number}</p>
                      <p className="text-xs" style={{ color: '#6B7C6A' }}>
                        Rp {order.total_amount.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full shrink-0"
                      style={{
                        background: ORDER_STATUS[order.status]?.bg ?? '#f0f0f0',
                        color: ORDER_STATUS[order.status]?.color ?? '#666'
                      }}>
                      {ORDER_STATUS[order.status]?.label ?? order.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
