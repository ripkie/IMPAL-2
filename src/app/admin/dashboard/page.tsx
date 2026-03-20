import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminDashboardClient from './AdminDashboardClient'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/home')

  // Stats
  const { count: totalPembeli } = await supabase
    .from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'pembeli')
  const { count: totalPetani } = await supabase
    .from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'petani')
  const { count: totalProduk } = await supabase
    .from('products').select('*', { count: 'exact', head: true }).eq('is_active', true)
  const { count: pendingVerifikasi } = await supabase
    .from('farmer_profiles').select('*', { count: 'exact', head: true }).eq('verify_status', 'pending')
  const { count: totalOrder } = await supabase
    .from('orders').select('*', { count: 'exact', head: true })

  // Petani pending verifikasi
  const { data: petaniPendingRaw } = await supabase
    .from('farmer_profiles')
    .select(`id, farm_name, farm_location, created_at, verify_status, profiles(id, full_name, phone)`)
    .eq('verify_status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5)

  const petaniPending = (petaniPendingRaw ?? []).map((p: any) => ({
    ...p,
    profiles: Array.isArray(p.profiles) ? p.profiles[0] ?? null : p.profiles
  }))

  // Order terbaru
  const { data: orderTerbaru } = await supabase
    .from('orders')
    .select('id, order_number, status, total_amount, created_at, payment_status')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <AdminDashboardClient
      totalPembeli={totalPembeli ?? 0}
      totalPetani={totalPetani ?? 0}
      totalProduk={totalProduk ?? 0}
      totalOrder={totalOrder ?? 0}
      pendingVerifikasi={pendingVerifikasi ?? 0}
      petaniPending={petaniPending}
      orderTerbaru={orderTerbaru ?? []}
    />
  )
}
