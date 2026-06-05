import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  paid: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
}

function generateTrackingNumber(orderNumber: string, courier?: string | null) {
  const courierCode = (courier || 'KTN')
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase()
    .slice(0, 3) || 'KTN'

  const orderCode = orderNumber
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase()
    .slice(-6)
    .padStart(6, '0')

  const dateCode = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  const randomCode = Math.floor(1000 + Math.random() * 9000)

  return `${courierCode}${dateCode}${orderCode}${randomCode}`
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'petani') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { orderId, status } = await req.json()

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId dan status wajib diisi' }, { status: 400 })
    }

    if (!['processing', 'shipped', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 })
    }

    const admin = createAdminClient()

    // SECURITY: pastikan order ini memang punya item milik petani yang sedang login.
    const { data: ownedItem, error: ownedItemError } = await admin
      .from('order_items')
      .select('id, order_id')
      .eq('order_id', orderId)
      .eq('farmer_id', user.id)
      .limit(1)
      .maybeSingle()

    if (ownedItemError || !ownedItem) {
      return NextResponse.json({ error: 'Order tidak ditemukan untuk petani ini' }, { status: 404 })
    }

    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('id, order_number, status, shipping_courier, tracking_number')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })
    }

    const allowedNextStatuses = ALLOWED_TRANSITIONS[order.status] ?? []
    if (!allowedNextStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status order tidak bisa diubah dari ${order.status} ke ${status}` },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const updateData: Record<string, string> = { status }

    if (status === 'shipped') {
      updateData.shipped_at = now
      updateData.tracking_number = order.tracking_number || generateTrackingNumber(order.order_number, order.shipping_courier)
    }

    const { data: updatedOrder, error: updateError } = await admin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select('id, status, tracking_number')
      .single()

    if (updateError) {
      console.error('[petani/update-status] Update error:', updateError.message)
      return NextResponse.json({ error: 'Gagal update order' }, { status: 500 })
    }

    return NextResponse.json({ order: updatedOrder })
  } catch (error: any) {
    console.error('[petani/update-status] Error:', error?.message ?? error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
