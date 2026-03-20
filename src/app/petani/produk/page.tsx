import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PetaniProdukClient from './PetaniProdukClient'

export default async function PetaniProdukPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'petani') redirect('/home')

  const { data: products } = await supabase
    .from('products')
    .select(`*, categories(id, name, slug)`)
    .eq('farmer_id', user.id)
    .order('created_at', { ascending: false })

  const { data: categories } = await supabase
    .from('categories').select('*').order('sort_order')

  return (
    <PetaniProdukClient
      products={products ?? []}
      categories={categories ?? []}
      farmerId={user.id}
    />
  )
}
