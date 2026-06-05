import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PetaniProdukClient from './PetaniProdukClient'
import { createAdminClient } from '@/lib/supabase/admin'

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

  // Hitung produk terjual dari order yang benar-benar selesai.
  // Ini juga memperbaiki data lama yang sudah selesai sebelum sold_count otomatis dibuat.
  const admin = createAdminClient()
  const { data: soldItems } = await admin
    .from('order_items')
    .select('product_id, quantity, orders(status)')
    .eq('farmer_id', user.id)

  const soldMap = new Map<string, number>()
  for (const item of soldItems ?? []) {
    const order = Array.isArray((item as any).orders)
      ? (item as any).orders[0]
      : (item as any).orders

    if (order?.status !== 'done') continue

    const productId = (item as any).product_id
    if (!productId) continue

    soldMap.set(productId, (soldMap.get(productId) ?? 0) + Number((item as any).quantity ?? 0))
  }

  const productsWithComputedSold = (products ?? []).map((product: any) => ({
    ...product,
    sold_count: soldMap.get(product.id) ?? Number(product.sold_count ?? 0),
  }))

  return (
    <PetaniProdukClient
      products={productsWithComputedSold}
      categories={categories ?? []}
      farmerId={user.id}
    />
  )
}
