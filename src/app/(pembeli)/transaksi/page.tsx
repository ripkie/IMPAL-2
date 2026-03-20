import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TransaksiClient from './TransaksiClient'

export default async function TransaksiPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orders } = await supabase
    .from('orders')
    .select(`*, order_items(*)`)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  return <TransaksiClient orders={orders ?? []} />
}
