import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import MidtransClient from 'midtrans-client'

const snap = new MidtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!,
})

// POST /api/repay — buat ulang snap token untuk order yang sudah ada
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: 'orderId wajib diisi' }, { status: 400 })
    }

    // Ambil order + items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .eq('status', 'pending')
      .eq('payment_status', 'unpaid')
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order tidak ditemukan atau sudah dibayar' }, { status: 404 })
    }

    // Kalau sudah ada midtrans_token, pakai yang lama dulu
    if (order.midtrans_token) {
      return NextResponse.json({ snapToken: order.midtrans_token, orderId: order.id })
    }

    // Buat token baru dari Midtrans
    const midtransOrderId = order.midtrans_order_id ?? `${order.order_number}-${Date.now()}`

    const itemDetails = [
      ...order.order_items.map((item: any) => ({
        id: item.product_id ?? 'prod',
        name: item.product_name ?? 'Produk',
        price: item.price,
        quantity: item.quantity,
      })),
      {
        id: 'shipping',
        name: `Ongkir (${order.shipping_courier ?? 'reguler'})`,
        price: order.shipping_cost,
        quantity: 1,
      },
    ]

    const { token: snapToken } = await (snap as any).createTransaction({
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: order.total_amount,
      },
      customer_details: {
        first_name: order.shipping_name,
        phone: order.shipping_phone,
        shipping_address: {
          first_name: order.shipping_name,
          phone: order.shipping_phone,
          address: order.shipping_address,
        },
      },
      item_details: itemDetails,
    })

    // Simpan token baru
    await supabase
      .from('orders')
      .update({ midtrans_token: snapToken, midtrans_order_id: midtransOrderId })
      .eq('id', order.id)

    return NextResponse.json({ snapToken, orderId: order.id })
  } catch (err: any) {
    console.error('Repay error:', err)
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
