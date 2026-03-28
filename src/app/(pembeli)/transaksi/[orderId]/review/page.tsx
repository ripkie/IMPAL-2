import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ReviewClient from './ReviewClient'

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Ambil order + items, pastikan milik user dan sudah done
  const { data: order } = await supabase
    .from('orders')
    .select(`*, order_items(*)`)
    .eq('id', orderId)
    .eq('buyer_id', user.id)
    .eq('status', 'done')
    .single()

  if (!order) notFound()

  // Cek review yang sudah ada untuk order ini
  const { data: existingReviews } = await supabase
    .from('reviews')
    .select('order_item_id, rating, comment')
    .eq('buyer_id', user.id)
    .in('order_item_id', order.order_items.map((i: any) => i.id))

  return (
    <ReviewClient
      order={order}
      userId={user.id}
      existingReviews={existingReviews ?? []}
    />
  )
}
