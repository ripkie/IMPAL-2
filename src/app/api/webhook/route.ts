import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        console.log('Webhook masuk:', body)

        const {
            order_id,
            status_code,
            gross_amount,
            signature_key,
            transaction_status,
            fraud_status,
        } = body

        if (!order_id || !status_code || !gross_amount || !signature_key || !transaction_status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const serverKey = process.env.MIDTRANS_SERVER_KEY
        if (!serverKey) {
            console.error('MIDTRANS_SERVER_KEY belum diset')
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
        }

        const expectedSignature = crypto
            .createHash('sha512')
            .update(`${String(order_id)}${String(status_code)}${String(gross_amount)}${String(serverKey)}`)
            .digest('hex')

        if (expectedSignature.trim().toLowerCase() !== String(signature_key).trim().toLowerCase()) {
            console.error('Invalid signature', {
                order_id,
                status_code,
                gross_amount,
                incoming: signature_key,
                expected: expectedSignature,
            })
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id, buyer_id, status')
            .eq('midtrans_order_id', order_id)
            .single()

        if (orderError || !order) {
            console.error('Order not found:', order_id, orderError)
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        if (transaction_status === 'capture' || transaction_status === 'settlement') {
            if (fraud_status === 'accept' || !fraud_status) {
                const { error: updateError } = await supabase
                    .from('orders')
                    .update({
                        status: 'paid',
                        payment_status: 'paid',
                        paid_at: new Date().toISOString(),
                    })
                    .eq('id', order.id)

                if (updateError) {
                    console.error('Gagal update order paid:', updateError)
                    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
                }

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