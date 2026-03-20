import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PetaniPesananClient from './PetaniPesananClient'

export default async function PetaniPesananPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'petani') redirect('/home')

  // Ambil order items milik petani ini
  const { data: orderItems } = await supabase
    .from('order_items')
    .select(`
      *,
      orders(
        id, order_number, status, payment_status,
        shipping_name, shipping_phone, shipping_address,
        shipping_courier, tracking_number, created_at,
        buyer_id
      )
    `)
    .eq('farmer_id', user.id)
    .order('created_at', { ascending: false })

  return <PetaniPesananClient orderItems={orderItems ?? []} farmerId={user.id} />
}
