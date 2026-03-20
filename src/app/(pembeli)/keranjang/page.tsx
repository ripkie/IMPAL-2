import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import KeranjangClient from './KeranjangClient'

export default async function KeranjangPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cartRaw } = await supabase
    .from('carts')
    .select(`
      id, quantity, updated_at,
      products(
        id, name, price, unit, stock, image_urls, is_active,
        profiles!products_farmer_id_fkey(id, full_name)
      )
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  // Flatten products array (Supabase returns array for joins)
  const cartItems = (cartRaw ?? []).map((item: any) => ({
    ...item,
    products: Array.isArray(item.products) ? item.products[0] ?? null : item.products,
  }))

  return <KeranjangClient cartItems={cartItems} userId={user.id} />
}
