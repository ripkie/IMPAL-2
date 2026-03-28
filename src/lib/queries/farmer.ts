// SECURITY: server-only — pakai admin client dengan filter manual
import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Ambil semua order beserta item milik petani tertentu.
 * Pakai admin client karena butuh join orders + order_items
 * yang tidak bisa dilakukan dengan RLS biasa tanpa circular dependency.
 *
 * KEAMANAN: farmerId HARUS dari auth.getUser() di server, bukan dari client.
 */
export async function getFarmerOrders(farmerId: string) {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('order_items')
    .select(`
      id,
      order_id,
      product_id,
      product_name,
      price,
      unit,
      quantity,
      subtotal,
      farmer_id,
      created_at,
      orders (
        id,
        order_number,
        status,
        payment_status,
        shipping_name,
        shipping_phone,
        shipping_address,
        shipping_courier,
        tracking_number,
        created_at,
        buyer_id
      )
    `)
    // WAJIB filter by farmerId — jangan pernah query tanpa filter ini
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getFarmerOrders] Error:', error.message)
    return []
  }

  // Normalize: orders bisa array atau object tergantung Supabase version
  return (data ?? []).map((item: any) => ({
    ...item,
    orders: Array.isArray(item.orders)
      ? (item.orders[0] ?? null)
      : item.orders,
  }))
}

/**
 * Ambil statistik dashboard petani.
 * Pakai admin client karena aggregate lintas tabel.
 */
export async function getFarmerStats(farmerId: string) {
  const admin = createAdminClient()

  // Total produk aktif
  const { count: totalProduk } = await admin
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('farmer_id', farmerId)
    .eq('is_active', true)

  // Total pendapatan dari order selesai
  const { data: pendapatanData } = await admin
    .from('order_items')
    .select('subtotal, orders(status)')
    .eq('farmer_id', farmerId)

  const totalPendapatan = (pendapatanData ?? [])
    .filter((item: any) => {
      const o = Array.isArray(item.orders) ? item.orders[0] : item.orders
      return o?.status === 'done'
    })
    .reduce((sum: number, item: any) => sum + (item.subtotal ?? 0), 0)

  // Pesanan perlu aksi
  const { data: orderData } = await admin
    .from('order_items')
    .select('order_id, orders(id, status)')
    .eq('farmer_id', farmerId)

  const orderStatuses: Record<string, string> = {}
  for (const item of orderData ?? []) {
    const o = Array.isArray((item as any).orders)
      ? (item as any).orders[0]
      : (item as any).orders
    if (o?.id) orderStatuses[o.id] = o.status
  }

  const pesananPerluAksi = Object.values(orderStatuses).filter(
    s => s === 'paid' || s === 'processing'
  ).length

  return { totalProduk: totalProduk ?? 0, totalPendapatan, pesananPerluAksi }
}
