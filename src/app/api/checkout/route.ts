import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import MidtransClient from 'midtrans-client'

const snap = new MidtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    const {
      userId, cartItemIds, shippingName, shippingPhone,
      shippingAddress, shippingCourier, shippingCost,
      subtotal, total, notes,
    } = body

    // Ambil cart items + validasi stok
    const { data: cartItems, error: cartError } = await supabase
      .from('carts')
      .select(`*, products(id, name, price, unit, stock, farmer_id, image_urls)`)
      .in('id', cartItemIds)
      .eq('user_id', userId)

    if (cartError || !cartItems?.length) {
      return NextResponse.json({ error: 'Cart tidak valid' }, { status: 400 })
    }

    // Cek stok
    for (const item of cartItems) {
      if (!item.products) continue
      if (item.quantity > item.products.stock) {
        return NextResponse.json({ error: `Stok ${item.products.name} tidak cukup` }, { status: 400 })
      }
    }

    // Generate order number
    const orderNumber = `KT${Date.now().toString().slice(-8)}`

    // Buat order di Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: userId,
        order_number: orderNumber,
        status: 'pending',
        shipping_name: shippingName,
        shipping_phone: shippingPhone,
        shipping_address: shippingAddress,
        shipping_courier: shippingCourier,
        shipping_cost: shippingCost,
        subtotal,
        discount: 0,
        total_amount: total,
        payment_status: 'unpaid',
        notes: notes || null,
      })
      .select()
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Gagal membuat order' }, { status: 500 })
    }

    // Insert order items
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      farmer_id: item.products?.farmer_id ?? null,
      product_name: item.products?.name ?? '',
      price: item.products?.price ?? 0,
      unit: item.products?.unit ?? '',
      quantity: item.quantity,
      subtotal: (item.products?.price ?? 0) * item.quantity,
    }))

    await supabase.from('order_items').insert(orderItems)

    // Hapus cart items yang sudah dicheckout
    await supabase.from('carts').delete().in('id', cartItemIds)

    // Buat Midtrans transaction
    const midtransOrderId = `${orderNumber}-${Date.now()}`

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', userId)
      .single()

    const snapToken = await snap.createTransactionToken({
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: total,
      },
      customer_details: {
        first_name: shippingName,
        phone: shippingPhone,
        shipping_address: {
          first_name: shippingName,
          phone: shippingPhone,
          address: shippingAddress,
        },
      },
      item_details: [
        ...cartItems.map(item => ({
          id: item.product_id,
          name: item.products?.name ?? 'Produk',
          price: item.products?.price ?? 0,
          quantity: item.quantity,
        })),
        {
          id: 'shipping',
          name: `Ongkir (${shippingCourier})`,
          price: shippingCost,
          quantity: 1,
        },
      ],
    })

    // Simpan midtrans token ke order
    await supabase.from('orders')
      .update({ midtrans_order_id: midtransOrderId, midtrans_token: snapToken })
      .eq('id', order.id)

    return NextResponse.json({ snapToken, orderId: order.id })
  } catch (err: any) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
