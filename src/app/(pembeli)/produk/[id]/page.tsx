import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProdukDetailClient from './ProdukDetailClient'

export default async function ProdukDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select(`*, profiles(id, full_name, avatar_url), categories(id, name, slug)`)
    .eq('id', id)
    .single()

  if (!product) notFound()

  const { data: produkLain } = await supabase
    .from('products')
    .select(`*, categories(id, name, slug), profiles(id, full_name)`)
    .eq('farmer_id', product.farmer_id)
    .eq('is_active', true)
    .neq('id', id)
    .limit(4)

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <ProdukDetailClient
      product={product}
      produkLain={produkLain ?? []}
      userId={user?.id ?? null}
    />
  )
}