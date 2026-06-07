import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerAuthClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const MIDTRANS_STATUS_BASE_URL =
  process.env.MIDTRANS_IS_PRODUCTION === 'true'
    ? 'https://api.midtrans.com/v2'
    : 'https://api.sandbox.midtrans.com/v2'

function isPaidStatus(transactionStatus?: string, fraudStatus?: string) {
  if (transactionStatus === 'settlement') return true
  if (transactionStatus === 'capture') return !fraudStatus || fraudStatus === 'accept'
  return false
}

function isExpiredOrCancelledStatus(transactionStatus?: string) {
  return transactionStatus === 'expire' || transactionStatus === 'cancel' || transactionStatus === 'deny'
}

async function restoreStock(serviceSupabase: any, orderId: string) {
  const { data: items, error } = await serviceSupabase
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId)

  if (error) throw new Error(error.message)

  for (const item of items ?? []) {
    if (!item.product_id) continue

    const { data: product, error: productError } = await serviceSupabase
      .from('products')
      .select('id, stock')
      .eq('id', item.product_id)
      .single()

    if (productError || !product) continue

    await serviceSupabase
      .from('products')
      .update({
        stock: Number(product.stock ?? 0) + Number(item.quantity ?? 0),
      })
      .eq('id', item.product_id)
  }
}

async function cancelOrder(serviceSupabase: any, order: any, message: string) {
  if (order.status !== 'cancelled') {
    await restoreStock(serviceSupabase, order.id)
  }

  const { data: cancelledOrder, error } = await serviceSupabase
    .from('orders')
    .update({
      status: 'cancelled',
      payment_status: 'unpaid',
    })
    .eq('id', order.id)
    .select('id, status, payment_status')
    .single()

  if (error) throw new Error(error.message)

  return NextResponse.json({
    ok: true,
    order: cancelledOrder,
    message,
  })
}

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID wajib diisi' }, { status: 400 })
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serverKey || !supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Konfigurasi server belum lengkap' }, { status: 500 })
    }

    const authSupabase = await createServerAuthClient()
    const { data: { user } } = await authSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceSupabase = createServiceClient(supabaseUrl, serviceRoleKey)

    const { data: order, error: orderError } = await serviceSupabase
      .from('orders')
      .select('id, buyer_id, status, payment_status, midtrans_order_id')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })
    }

    if (order.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Kamu tidak punya akses ke order ini' }, { status: 403 })
    }

    if (order.payment_status === 'paid' && order.status === 'paid') {
      return NextResponse.json({ ok: true, order })
    }

    if (order.status === 'cancelled') {
      return NextResponse.json({ ok: true, order })
    }

    if (!order.midtrans_order_id) {
      return cancelOrder(serviceSupabase, order, 'Pesanan dibatalkan karena Midtrans order id tidak tersedia.')
    }

    const midtransRes = await fetch(
      `${MIDTRANS_STATUS_BASE_URL}/${encodeURIComponent(order.midtrans_order_id)}/status`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    )

    const midtransData = await midtransRes.json()

    const isNotFound =
      midtransData?.status_code === '404' ||
      String(midtransData?.status_message ?? '').toLowerCase().includes("transaction doesn't exist")

    if (isNotFound) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Transaksi belum ditemukan di Midtrans',
          transaction_status: 'not_found',
        },
        { status: 409 }
      )
    }

    if (!midtransRes.ok) {
      return NextResponse.json(
        { error: midtransData?.status_message ?? 'Gagal cek status pembayaran' },
        { status: 400 }
      )
    }

    const transactionStatus = midtransData.transaction_status
    const fraudStatus = midtransData.fraud_status

    if (isExpiredOrCancelledStatus(transactionStatus)) {
      return cancelOrder(serviceSupabase, order, 'Pesanan dibatalkan karena pembayaran expired.')
    }

    if (!isPaidStatus(transactionStatus, fraudStatus)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Pembayaran belum terkonfirmasi oleh Midtrans',
          transaction_status: transactionStatus,
        },
        { status: 409 }
      )
    }

    const { data: updatedOrder, error: updateError } = await serviceSupabase
      .from('orders')
      .update({
        status: 'paid',
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .select('id, status, payment_status, paid_at')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, order: updatedOrder })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Server error' },
      { status: 500 }
    )
  }
}