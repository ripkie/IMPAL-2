import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import TransaksiClient from './TransaksiClient'

export default async function TransaksiPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: orders } = await admin
    .from('orders')
    .select(`
      *,
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
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  return <TransaksiClient orders={orders ?? []} />
}