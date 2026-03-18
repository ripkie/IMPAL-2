import { createClient } from '@/lib/supabase/server'
import BerandaClient from './BerandaClient'

export default async function BerandaPage() {
  const supabase = await createClient()

  // Ambil produk terbaru (12 produk)
  const { data: products } = await supabase
    .from('products')
    .select(`
      *,
      profiles(id, full_name),
      categories(id, name, slug)
    `)
    .eq('is_active', true)
    .gt('stock', 0)
    .order('created_at', { ascending: false })
    .limit(12)

  // Ambil kategori
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')

  // Ambil produk terlaris
  const { data: terlaris } = await supabase
    .from('products')
    .select(`
      *,
      profiles(id, full_name),
      categories(id, name, slug)
    `)
    .eq('is_active', true)
    .gt('stock', 0)
    .order('sold_count', { ascending: false })
    .limit(6)

  return (
    <BerandaClient
      products={products ?? []}
      categories={categories ?? []}
      terlaris={terlaris ?? []}
    />
  )
}
