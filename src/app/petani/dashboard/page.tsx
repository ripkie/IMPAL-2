import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PetaniHomeClient from './PetaniHomeClient'

export default async function PetaniDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  if (profile?.role !== 'petani') redirect('/home')

  // Total produk aktif
  const { count: totalProduk } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('farmer_id', user.id)
    .eq('is_active', true)

  // Pesanan terbaru
  const { data: pesananMasukRaw } = await supabase
    .from('order_items')
    .select(`id, product_name, quantity, subtotal, created_at, order_id, orders(id, order_number, status, buyer_id)`)
    .eq('farmer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const pesananMasuk = (pesananMasukRaw ?? []).map((item: any) => ({
    ...item,
    orders: Array.isArray(item.orders) ? (item.orders[0] ?? null) : item.orders
  }))

  // Hitung pesanan yang perlu aksi (paid = perlu diproses, processing = perlu dikirim)
  const { data: allOrders } = await supabase
    .from('order_items')
    .select('order_id, orders(id, status)')
    .eq('farmer_id', user.id)

  // Ambil unique order ids yang perlu aksi
  const orderIds = new Set<string>()
  const orderStatuses: Record<string, string> = {}

  for (const item of allOrders ?? []) {
    const order = Array.isArray((item as any).orders) ? (item as any).orders[0] : (item as any).orders
    if (order?.id && order?.status) {
      orderIds.add(order.id)
      orderStatuses[order.id] = order.status
    }
  }

  const pesananPerluAksi = Array.from(orderIds).filter(
    id => orderStatuses[id] === 'paid' || orderStatuses[id] === 'processing'
  ).length

  // Total pendapatan dari pesanan done
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

  // Notifikasi belum dibaca
  const { data: notifikasi } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(10)

  // Stok menipis
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
      pesananPerluAksi={pesananPerluAksi}
    />
  )
}
