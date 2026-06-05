import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ count: 0, actionOrders: 0, lowStock: 0 }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'petani') {
      return NextResponse.json({ count: 0, actionOrders: 0, lowStock: 0 }, { status: 403 })
    }

    const admin = createAdminClient()

    const { data: orderItems, error: orderError } = await admin
      .from('order_items')
      .select('order_id, orders(id, status)')
      .eq('farmer_id', user.id)

    if (orderError) {
      console.error('[notification-count] order error:', orderError.message)
    }

    const actionableOrderIds = new Set<string>()
    for (const item of orderItems ?? []) {
      const order = Array.isArray((item as any).orders)
        ? (item as any).orders[0]
        : (item as any).orders

      const status = String(order?.status ?? '').toLowerCase()
      if (order?.id && (status === 'paid' || status === 'processing')) {
        actionableOrderIds.add(order.id)
      }
    }

    const { count: lowStockCount, error: productError } = await admin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('farmer_id', user.id)
      .eq('is_active', true)
      .lte('stock', 5)

    if (productError) {
      console.error('[notification-count] product error:', productError.message)
    }

    const actionOrders = actionableOrderIds.size
    const lowStock = lowStockCount ?? 0

    return NextResponse.json({
      count: actionOrders + lowStock,
      actionOrders,
      lowStock,
    })
  } catch (error: any) {
    console.error('[notification-count] error:', error?.message ?? error)
    return NextResponse.json({ count: 0, actionOrders: 0, lowStock: 0 }, { status: 500 })
  }
}
