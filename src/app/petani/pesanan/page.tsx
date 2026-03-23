import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PetaniPesananClient from './PetaniPesananClient'

export default async function PetaniPesananPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'petani') redirect('/home')

  // Ambil order items dengan farmer_id yang match
  const { data: orderItemsByFarmer } = await supabase
    .from('order_items')
    .select(`
      *,
      orders(
        id, order_number, status, payment_status,
        shipping_name, shipping_phone, shipping_address,
        shipping_courier, tracking_number, created_at,
        buyer_id
      )
    `)
    .eq('farmer_id', user.id)
    .order('created_at', { ascending: false })

  // ── FALLBACK ──
  // Kalau hasilnya kosong, kemungkinan farmer_id di order_items null
  // Cari lewat products yang dimiliki petani ini
  let orderItems = orderItemsByFarmer ?? []

  if (orderItems.length === 0) {
    // Ambil semua product_id milik petani ini
    const { data: myProducts } = await supabase
      .from('products')
      .select('id')
      .eq('farmer_id', user.id)

    if (myProducts && myProducts.length > 0) {
      const productIds = myProducts.map(p => p.id)

      const { data: orderItemsByProduct } = await supabase
        .from('order_items')
        .select(`
          *,
          orders(
            id, order_number, status, payment_status,
            shipping_name, shipping_phone, shipping_address,
            shipping_courier, tracking_number, created_at,
            buyer_id
          )
        `)
        .in('product_id', productIds)
        .order('created_at', { ascending: false })

      orderItems = orderItemsByProduct ?? []

      // Sekaligus fix farmer_id yang null di DB
      if (orderItems.length > 0) {
        const itemsToFix = orderItems.filter(i => !i.farmer_id)
        for (const item of itemsToFix) {
          await supabase
            .from('order_items')
            .update({ farmer_id: user.id })
            .eq('id', item.id)
        }
        // Update local data juga
        orderItems = orderItems.map(i => ({ ...i, farmer_id: i.farmer_id ?? user.id }))
      }
    }
  }

  // Normalize: orders bisa berupa array atau object tergantung Supabase version
  const normalized = orderItems.map((item: any) => ({
    ...item,
    orders: Array.isArray(item.orders) ? (item.orders[0] ?? null) : item.orders,
  }))

  return <PetaniPesananClient orderItems={normalized} farmerId={user.id} />
}
