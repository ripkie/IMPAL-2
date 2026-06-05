import { unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getFarmerOrders, getFarmerStats } from '@/lib/queries/farmer'
import PetaniHomeClient from './PetaniHomeClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PetaniDashboardPage() {
  noStore()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'petani') redirect('/home')

  const [orderItems, stats] = await Promise.all([
    getFarmerOrders(user.id),
    getFarmerStats(user.id),
  ])

  const normalizedItems = (orderItems ?? []).map((item: any) => ({
    id: item.id,
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: Number(item.quantity ?? 0),
    subtotal: Number(item.subtotal ?? 0),
    created_at: item.created_at,
    order_id: item.order_id,
    orders: item.orders,
  }))

  const orderMap = new Map<string, any>()

  for (const item of normalizedItems) {
    const order = item.orders
    const key = item.order_id || order?.id || item.id

    if (!orderMap.has(key)) {
      orderMap.set(key, {
        id: order?.id ?? key,
        order_number: order?.order_number ?? '-',
        status: order?.status ?? 'pending',
        payment_status: order?.payment_status ?? null,
        created_at: order?.created_at ?? item.created_at,
        tracking_number: order?.tracking_number ?? null,
        total: 0,
        total_items: 0,
        items: [],
      })
    }

    const current = orderMap.get(key)
    current.total += item.subtotal
    current.total_items += item.quantity
    current.items.push({
      id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      subtotal: item.subtotal,
    })
  }

  const orderSummary = Array.from(orderMap.values()).sort((a, b) => {
    return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  })

  const pesananTerbaru = orderSummary.slice(0, 6)
  const pesananPerluProses = orderSummary.filter(order => order.status === 'paid').length
  const pesananDiproses = orderSummary.filter(order => order.status === 'processing').length
  const pesananDikirim = orderSummary.filter(order => order.status === 'shipped').length
  const pesananSelesai = orderSummary.filter(order => order.status === 'done').length
  const pesananDibatalkan = orderSummary.filter(order => order.status === 'cancelled').length
  const pesananBelumBayar = orderSummary.filter(order => order.status === 'pending').length

  const revenuePaidOrDone = orderSummary
    .filter(order => ['paid', 'processing', 'shipped', 'done'].includes(order.status))
    .reduce((sum, order) => sum + Number(order.total ?? 0), 0)

  const totalProdukTerjual = normalizedItems
    .filter(item => item.orders?.status === 'done')
    .reduce((sum, item) => sum + Number(item.quantity ?? 0), 0)

  const productSalesMap = new Map<string, { name: string; sold: number; revenue: number }>()
  for (const item of normalizedItems) {
    if (item.orders?.status !== 'done') continue
    const key = item.product_id ?? item.product_name
    const current = productSalesMap.get(key) ?? { name: item.product_name, sold: 0, revenue: 0 }
    current.sold += Number(item.quantity ?? 0)
    current.revenue += Number(item.subtotal ?? 0)
    productSalesMap.set(key, current)
  }

  const produkTerlaris = Array.from(productSalesMap.values())
    .sort((a, b) => b.sold - a.sold || b.revenue - a.revenue)
    .slice(0, 5)

  const { data: notifikasi } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: stokMenipis } = await supabase
    .from('products')
    .select('id, name, stock, unit')
    .eq('farmer_id', user.id)
    .eq('is_active', true)
    .lte('stock', 5)
    .gt('stock', 0)
    .limit(8)

  return (
    <PetaniHomeClient
      profile={profile}
      totalProduk={stats.totalProduk}
      totalPendapatan={stats.totalPendapatan}
      revenuePaidOrDone={revenuePaidOrDone}
      totalProdukTerjual={totalProdukTerjual}
      totalPesanan={orderSummary.length}
      pesananTerbaru={pesananTerbaru}
      notifikasi={notifikasi ?? []}
      stokMenipis={stokMenipis ?? []}
      produkTerlaris={produkTerlaris}
      pesananPerluAksi={stats.pesananPerluAksi}
      pesananPerluProses={pesananPerluProses}
      pesananDiproses={pesananDiproses}
      pesananDikirim={pesananDikirim}
      pesananSelesai={pesananSelesai}
      pesananDibatalkan={pesananDibatalkan}
      pesananBelumBayar={pesananBelumBayar}
    />
  )
}
