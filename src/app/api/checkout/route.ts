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

    // Ambil cart items + data produk lengkap termasuk farmer_id
    const { data: cartItems, error: cartError } = await supabase
      .from('carts')
      .select(`
        *,
        products(id, name, price, unit, stock, farmer_id, image_urls)
      `)
      .in('id', cartItemIds)
      .eq('user_id', userId)

    if (cartError || !cartItems?.length) {
      return NextResponse.json({ error: 'Cart tidak valid' }, { status: 400 })
    }

    // Validasi stok
    for (const item of cartItems) {
      if (!item.products) continue
      if (item.quantity > item.products.stock) {
        return NextResponse.json({ error: `Stok ${item.products.name} tidak cukup` }, { status: 400 })
      }
    }

    // Debug: log farmer_id untuk cek
    console.log('Cart items farmer_ids:', cartItems.map(i => ({
      product: i.products?.name,
      farmer_id: i.products?.farmer_id,
    })))

    const orderNumber = `KT${Date.now().toString().slice(-8)}`
    const midtransOrderId = `${orderNumber}-${Date.now()}`

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: userId,
        order_number: orderNumber,
        midtrans_order_id: midtransOrderId,
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
      console.error('Gagal membuat order:', orderError)
      return NextResponse.json({ error: 'Gagal membuat order' }, { status: 500 })
    }

    // Pastikan farmer_id tersimpan — ambil langsung dari products.farmer_id
    const orderItems = cartItems.map(item => {
      const farmerId = item.products?.farmer_id ?? null
      console.log(`Item ${item.products?.name}: farmer_id = ${farmerId}`)
      return {
        order_id: order.id,
        product_id: item.products?.id ?? null,
        farmer_id: farmerId,   // ← ini kunci utama
        product_name: item.products?.name ?? '',
        price: item.products?.price ?? 0,
        unit: item.products?.unit ?? '',
        quantity: item.quantity,
        subtotal: (item.products?.price ?? 0) * item.quantity,
      }
    })

    const { error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (orderItemsError) {
      console.error('Gagal insert order items:', orderItemsError)
      return NextResponse.json({ error: 'Gagal menyimpan item order' }, { status: 500 })
    }

    // Buat Midtrans Snap token
    const { token: snapToken } = await (snap as any).createTransaction({
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
          id: item.products?.id ?? 'prod',
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

    await supabase
      .from('orders')
      .update({ midtrans_token: snapToken })
      .eq('id', order.id)

    // Kurangi stok produk
    for (const item of cartItems) {
      if (!item.products?.id) continue
      await supabase
        .from('products')
        .update({ stock: item.products.stock - item.quantity })
        .eq('id', item.products.id)
    }

    // Hapus dari keranjang
    await supabase.from('carts').delete().in('id', cartItemIds)

    return NextResponse.json({ snapToken, orderId: order.id })
  } catch (err: any) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
