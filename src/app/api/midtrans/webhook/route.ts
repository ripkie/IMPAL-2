import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = await createClient()

    const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = body

    // Verifikasi signature dari Midtrans
    const serverKey = process.env.MIDTRANS_SERVER_KEY!
    const hash = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest('hex')

    if (hash !== signature_key) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Cari order berdasarkan midtrans_order_id
    const { data: order } = await supabase
      .from('orders')
      .select('id, buyer_id, status')
      .eq('midtrans_order_id', order_id)
      .single()

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Update status berdasarkan notif Midtrans
    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      if (fraud_status === 'accept' || !fraud_status) {
        await supabase.from('orders').update({
          status: 'paid',
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
        }).eq('id', order.id)

        // Notifikasi ke pembeli
        await supabase.from('notifications').insert({
          user_id: order.buyer_id,
          title: '✅ Pembayaran Berhasil!',
          body: `Pembayaran untuk order #${order_id} berhasil. Pesanan sedang diproses oleh petani.`,
          type: 'payment',
          reference_id: order.id,
        })
      }
    } else if (transaction_status === 'pending') {
      await supabase.from('orders').update({
        payment_status: 'unpaid',
      }).eq('id', order.id)
    } else if (['deny', 'expire', 'cancel'].includes(transaction_status)) {
      await supabase.from('orders').update({
        status: 'cancelled',
        payment_status: 'failed',
      }).eq('id', order.id)
    } else if (transaction_status === 'refund') {
      await supabase.from('orders').update({
        payment_status: 'refunded',
      }).eq('id', order.id)
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
