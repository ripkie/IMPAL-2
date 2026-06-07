import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import ReviewClient from './ReviewClient'

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: order } = await admin
    .from('orders')
    .select(`
      id,
      order_number,
      created_at,
      buyer_id,
      status,
      order_items(
        id,
        product_id,
        product_name,
        price,
        unit,
        quantity,
        subtotal,
        products(
          id,
          name,
          image_urls
        )
      )
    `)
    .eq('id', orderId)
    .eq('buyer_id', user.id)
    .eq('status', 'done')
    .single()

  if (!order) notFound()

  const orderItems = Array.isArray(order.order_items) ? order.order_items : []
  const itemIds = orderItems.map((item: any) => item.id).filter(Boolean)

  let existingReviews: any[] = []

  if (itemIds.length > 0) {
    const { data } = await admin
      .from('reviews')
      .select('order_item_id, rating, comment')
      .eq('buyer_id', user.id)
      .in('order_item_id', itemIds)

    existingReviews = data ?? []
  }

  const normalizedOrderItems = orderItems.map((item: any) => ({
    ...item,
    products: Array.isArray(item.products)
      ? item.products[0] ?? null
      : item.products,
  }))

  return (
    <ReviewClient
      order={{
        ...order,
        order_items: normalizedOrderItems,
      }}
      userId={user.id}
      existingReviews={existingReviews}
    />
  )
}