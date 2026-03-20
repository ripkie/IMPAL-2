import { createClient } from '@/lib/supabase/server'
import ProdukClient from './ProdukClient'

export default async function ProdukPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; q?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')

  let query = supabase
    .from('products')
    .select(`*, categories(id, name, slug), profiles!products_farmer_id_fkey(id, full_name)`)
    .eq('is_active', true)
    .gt('stock', 0)
    .order('sold_count', { ascending: false })

  if (params.kategori) {
    const cat = categories?.find(c => c.slug === params.kategori)
    if (cat) query = query.eq('category_id', cat.id)
  }

  if (params.q) {
    query = query.ilike('name', `%${params.q}%`)
  }

  const { data: products } = await query.limit(40)

  return (
    <ProdukClient
      products={products ?? []}
      categories={categories ?? []}
      initialKategori={params.kategori ?? ''}
      initialSearch={params.q ?? ''}
    />
  )
}
