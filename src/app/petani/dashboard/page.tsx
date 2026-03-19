import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PetaniHomeClient from './PetaniHomeClient'

export default async function PetaniDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Statistik produk
  const { count: totalProduk } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('farmer_id', user.id)
    .eq('is_active', true)

  // Pesanan masuk
  const { data: pesananMasukRaw } = await supabase
    .from('order_items')
    .select(`
      id, product_name, quantity, subtotal, created_at,
      orders(id, order_number, status, buyer_id)
    `)
    .eq('farmer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Flatten orders array → object (Supabase returns joined relation as array)
  const pesananMasuk = (pesananMasukRaw ?? []).map((item: any) => ({
    ...item,
    orders: Array.isArray(item.orders) ? (item.orders[0] ?? null) : item.orders
  }))

  // Total pendapatan (pesanan done)
  const { data: pendapatanData } = await supabase
    .from('order_items')
    .select('subtotal, orders(status)')
    .eq('farmer_id', user.id)

  const totalPendapatan = (pendapatanData ?? [])
    .filter((item: any) => {
      const o = Array.isArray(item.orders) ? item.orders[0] : item.orders
      return o?.status === 'done'
    })
    .reduce((sum: number, item: any) => sum + (item.subtotal ?? 0), 0)

  // Notifikasi
  const { data: notifikasi } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(5)

  // Produk stok menipis
  const { data: stokMenipis } = await supabase
    .from('products')
    .select('id, name, stock, unit')
    .eq('farmer_id', user.id)
    .eq('is_active', true)
    .lte('stock', 5)
    .gt('stock', 0)
    .limit(5)

  return (
    <PetaniHomeClient
      profile={profile}
      totalProduk={totalProduk ?? 0}
      totalPendapatan={totalPendapatan}
      pesananMasuk={pesananMasuk}
      notifikasi={notifikasi ?? []}
      stokMenipis={stokMenipis ?? []}
    />
  )
}
