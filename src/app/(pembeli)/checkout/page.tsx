import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CheckoutClient from './CheckoutClient'

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ items?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const itemIds = params.items?.split(',').filter(Boolean) ?? []
  if (itemIds.length === 0) redirect('/keranjang')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: cartItems } = await supabase
    .from('carts')
    .select(`*, products(id, name, price, unit, stock, image_urls, farmer_id, profiles!products_farmer_id_fkey(id, full_name))`)
    .in('id', itemIds)
    .eq('user_id', user.id)

  if (!cartItems || cartItems.length === 0) redirect('/keranjang')

  return (
    <CheckoutClient
      profile={profile}
      cartItems={cartItems}
      userId={user.id}
    />
  )
}
