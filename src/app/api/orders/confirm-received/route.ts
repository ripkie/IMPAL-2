import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await req.json()
    if (!orderId) {
      return NextResponse.json({ error: 'orderId wajib diisi' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: order, error: orderError } = await admin
      .from('orders')
      .select(`
        id,
        buyer_id,
        status,
        done_at,
        order_items (
          id,
          product_id,
          quantity
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })
    }

    if (order.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Kalau sudah selesai, jangan tambah terjual lagi supaya tidak dobel.
    if (order.status === 'done') {
      return NextResponse.json({ order })
    }

    if (order.status !== 'shipped') {
      return NextResponse.json(
        { error: `Pesanan belum bisa dikonfirmasi dari status ${order.status}` },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    const { data: updatedOrder, error: updateOrderError } = await admin
      .from('orders')
      .update({ status: 'done', done_at: now })
      .eq('id', orderId)
      .select('id, status, done_at')
      .single()

    if (updateOrderError || !updatedOrder) {
      console.error('[confirm-received] Gagal update order:', updateOrderError?.message)
      return NextResponse.json({ error: 'Gagal mengkonfirmasi pesanan' }, { status: 500 })
    }

    const items = Array.isArray(order.order_items) ? order.order_items : []

    for (const item of items) {
      if (!item.product_id) continue

      const { data: product, error: productError } = await admin
        .from('products')
        .select('id, sold_count')
        .eq('id', item.product_id)
        .single()

      if (productError || !product) {
        console.error('[confirm-received] Produk tidak ditemukan:', item.product_id, productError?.message)
        continue
      }

      const nextSoldCount = Number(product.sold_count ?? 0) + Number(item.quantity ?? 0)

      const { error: soldError } = await admin
        .from('products')
        .update({
          sold_count: nextSoldCount,
          updated_at: now,
        })
        .eq('id', item.product_id)

      if (soldError) {
        console.error('[confirm-received] Gagal update sold_count:', soldError.message)
        return NextResponse.json({ error: 'Pesanan selesai, tapi gagal update produk terjual' }, { status: 500 })
      }
    }

    return NextResponse.json({ order: updatedOrder })
  } catch (error: any) {
    console.error('[confirm-received] Error:', error?.message ?? error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
