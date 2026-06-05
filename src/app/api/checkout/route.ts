import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import MidtransClient from 'midtrans-client'

const snap = new MidtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // SECURITY: user ID SELALU dari session server, TIDAK dari request body
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      cartItemIds,
      shippingName,
      shippingPhone,
      shippingAddress,
      shippingCourier,
      shippingCost,
      notes,
    } = body

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Konfigurasi Supabase server belum lengkap' }, { status: 500 })
    }

    // Service role hanya dipakai di server untuk update stok produk,
    // karena pembeli biasanya tidak punya izin update tabel products lewat RLS.
    const serviceSupabase = createServiceClient(supabaseUrl, serviceRoleKey)

    // Validasi input dasar
    if (!cartItemIds?.length || !shippingName || !shippingAddress) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    // Ambil cart items milik user yang login (RLS otomatis filter by user_id)
    const { data: cartItems, error: cartError } = await supabase
      .from('carts')
      .select(`
        id,
        quantity,
        product_id,
        products (
          id,
          name,
          price,
          unit,
          stock,
          farmer_id
        )
      `)
      .in('id', cartItemIds)
      // SECURITY: pastikan cart milik user yang login
      .eq('user_id', user.id)

    if (cartError || !cartItems?.length) {
      return NextResponse.json({ error: 'Cart tidak valid' }, { status: 400 })
    }

    // Validasi stok semua item sebelum proses
    for (const item of cartItems) {
      const product = item.products as any
      if (!product) {
        return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 400 })
      }
      if (item.quantity > product.stock) {
        return NextResponse.json(
          { error: `Stok ${product.name} tidak cukup (sisa: ${product.stock})` },
          { status: 400 }
        )
      }
    }

    // SECURITY: hitung subtotal & total dari DB — tidak percaya angka dari client
    const computedSubtotal = cartItems.reduce((sum, item) => {
      const product = item.products as any
      return sum + (product.price * item.quantity)
    }, 0)
    const computedTotal = computedSubtotal + (shippingCost ?? 0)

    // Generate order number unik
    const timestamp = Date.now()
    const orderNumber = `KT${timestamp.toString().slice(-8)}`
    const midtransOrderId = `${orderNumber}-${timestamp}`

    // INSERT order — RLS akan validasi buyer_id = auth.uid() otomatis
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,        // SECURITY: dari server, bukan dari body
        order_number: orderNumber,
        midtrans_order_id: midtransOrderId,
        status: 'pending',
        payment_status: 'unpaid',
        shipping_name: shippingName,
        shipping_phone: shippingPhone,
        shipping_address: shippingAddress,
        shipping_courier: shippingCourier,
        shipping_cost: shippingCost,
        subtotal: computedSubtotal,
        discount: 0,
        total_amount: computedTotal,
        notes: notes?.trim() || null,
      })
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('[checkout] Gagal insert order:', orderError?.message)
      return NextResponse.json({ error: 'Gagal membuat order' }, { status: 500 })
    }

    // Siapkan order items dengan farmer_id dari data produk (server-side)
    const orderItemsPayload = cartItems.map(item => {
      const product = item.products as any
      return {
        order_id: order.id,
        product_id: product.id,
        farmer_id: product.farmer_id,   // dari DB, bukan dari client
        product_name: product.name,
        price: product.price,
        unit: product.unit,
        quantity: item.quantity,
        subtotal: product.price * item.quantity,
      }
    })

    // INSERT order items
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsPayload)

    if (itemsError) {
      console.error('[checkout] Gagal insert order items:', itemsError?.message)
      // Rollback: hapus order yang sudah dibuat
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Gagal menyimpan item order' }, { status: 500 })
    }

    // Buat Midtrans Snap token
    let snapToken: string
    try {
      const midtransRes = await (snap as any).createTransaction({
        transaction_details: {
          order_id: midtransOrderId,
          gross_amount: computedTotal,
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
        callbacks: {
          finish: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/transaksi`,
          error: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/transaksi`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/transaksi`,
        },
        item_details: [
          ...cartItems.map(item => {
            const p = item.products as any
            return {
              id: p.id,
              name: p.name,
              price: p.price,
              quantity: item.quantity,
            }
          }),
          {
            id: 'shipping',
            name: `Ongkir (${shippingCourier})`,
            price: shippingCost,
            quantity: 1,
          },
        ],
      })
      snapToken = midtransRes.token
    } catch (midtransErr: any) {
      console.error('[checkout] Midtrans error:', midtransErr?.message)
      // Rollback order dan items
      await supabase.from('order_items').delete().eq('order_id', order.id)
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Gagal membuat token pembayaran' }, { status: 500 })
    }

    // Simpan snap token ke order
    await supabase
      .from('orders')
      .update({ midtrans_token: snapToken })
      .eq('id', order.id)

    // Kurangi stok produk.
    // Pakai service role supaya update benar-benar masuk ke DB dan tidak mental karena RLS buyer.
    for (const item of cartItems) {
      const product = item.products as any
      const nextStock = Math.max(0, Number(product.stock) - Number(item.quantity))

      const { error: stockError } = await serviceSupabase
        .from('products')
        .update({
          stock: nextStock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id)
        .eq('farmer_id', product.farmer_id) // extra safety check

      if (stockError) {
        console.error('[checkout] Gagal update stok produk:', stockError.message)
        return NextResponse.json({ error: `Gagal mengurangi stok ${product.name}` }, { status: 500 })
      }
    }

    // Hapus dari keranjang
    await supabase.from('carts').delete().in('id', cartItemIds)

    return NextResponse.json({ snapToken, orderId: order.id })

  } catch (err: any) {
    console.error('[checkout] Unexpected error:', err?.message)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}