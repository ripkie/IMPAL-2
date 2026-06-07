import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

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

        if (productError || !product) {
            throw new Error(productError?.message ?? 'Produk tidak ditemukan')
        }

        const nextStock = Number(product.stock ?? 0) + Number(item.quantity ?? 0)

        const { error: stockError } = await serviceSupabase
            .from('products')
            .update({
                stock: nextStock,
                updated_at: new Date().toISOString(),
            })
            .eq('id', item.product_id)

        if (stockError) throw new Error(stockError.message)
    }
}

export async function POST(req: NextRequest) {
    let rollbackOrderId: string | null = null

    try {
        const { orderId } = await req.json()

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID wajib diisi' }, { status: 400 })
        }

        const supabase = await createClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json(
                { error: 'Konfigurasi server belum lengkap' },
                { status: 500 }
            )
        }

        const serviceSupabase = createServiceClient(supabaseUrl, serviceRoleKey)

        const { data: order, error: orderError } = await serviceSupabase
            .from('orders')
            .select('id, buyer_id, status, payment_status')
            .eq('id', orderId)
            .single()

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })
        }

        if (order.buyer_id !== user.id) {
            return NextResponse.json(
                { error: 'Kamu tidak punya akses ke order ini' },
                { status: 403 }
            )
        }

        if (order.status === 'cancelled') {
            return NextResponse.json({ ok: true, order })
        }

        if (order.status !== 'pending' || order.payment_status === 'paid') {
            return NextResponse.json(
                { error: 'Pesanan ini sudah tidak bisa dibatalkan' },
                { status: 400 }
            )
        }

        const { data: cancelledOrder, error: cancelError } = await serviceSupabase
            .from('orders')
            .update({
                status: 'cancelled',
                payment_status: 'unpaid',
            })
            .eq('id', order.id)
            .eq('buyer_id', user.id)
            .eq('status', 'pending')
            .neq('payment_status', 'paid')
            .select('id, status, payment_status')
            .maybeSingle()

        if (cancelError) {
            console.error('[cancel-order] cancelError:', cancelError)

            return NextResponse.json(
                {
                    error: cancelError.message ?? 'Pesanan gagal dibatalkan',
                    details: cancelError,
                },
                { status: 400 }
            )
        }

        if (!cancelledOrder) {
            return NextResponse.json(
                { error: 'Pesanan gagal dibatalkan atau sudah diproses' },
                { status: 409 }
            )
        }

        rollbackOrderId = order.id
        await restoreStock(serviceSupabase, order.id)
        rollbackOrderId = null

        return NextResponse.json({
            ok: true,
            order: cancelledOrder,
            message: 'Pesanan berhasil dibatalkan.',
        })
    } catch (error: any) {
        if (rollbackOrderId) {
            try {
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
                const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

                if (supabaseUrl && serviceRoleKey) {
                    const serviceSupabase = createServiceClient(supabaseUrl, serviceRoleKey)

                    await serviceSupabase
                        .from('orders')
                        .update({
                            status: 'cancelled',
                            payment_status: 'unpaid',
                        })
                        .eq('id', rollbackOrderId)
                }
            } catch (rollbackError) {
                console.error('[cancel-order] rollbackError:', rollbackError)
            }
        }

        console.error('[cancel-order] unexpected:', error)

        return NextResponse.json(
            { error: error?.message ?? 'Server error' },
            { status: 500 }
        )
    }
}
