import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ProdukClient from './ProdukClient'

export default async function ProdukPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; q?: string }>
}) {
  const supabase = await createClient()
  const admin = createAdminClient()
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
    .order('created_at', { ascending: false })

  if (params.kategori) {
    const cat = categories?.find(c => c.slug === params.kategori)
    if (cat) query = query.eq('category_id', cat.id)
  }

  if (params.q) {
    query = query.ilike('name', `%${params.q}%`)
  }

  const { data: products } = await query.limit(80)
  const productIds = (products ?? []).map((product: any) => product.id)

  const reviewMap = new Map<string, {
    totalRating: number
    count: number
    reviews: any[]
  }>()

  if (productIds.length > 0) {
    const { data: reviews } = await admin
      .from('reviews')
      .select('product_id, rating, comment, created_at')
      .in('product_id', productIds)
      .order('created_at', { ascending: false })

    for (const review of reviews ?? []) {
      const productId = (review as any).product_id
      if (!productId) continue

      const current = reviewMap.get(productId) ?? {
        totalRating: 0,
        count: 0,
        reviews: [],
      }

      current.totalRating += Number((review as any).rating ?? 0)
      current.count += 1

      if (current.reviews.length < 3) {
        current.reviews.push(review)
      }

      reviewMap.set(productId, current)
    }
  }

  const productsWithReviews = (products ?? []).map((product: any) => {
    const review = reviewMap.get(product.id)
    const reviewCount = review?.count ?? 0
    const avgRating = reviewCount > 0 ? Number((review!.totalRating / reviewCount).toFixed(1)) : 0

    return {
      ...product,
      sold_count: Number(product.sold_count ?? 0),
      avg_rating: avgRating,
      review_count: reviewCount,
      reviews: review?.reviews ?? [],
    }
  })

  return (
    <ProdukClient
      products={productsWithReviews}
      categories={categories ?? []}
      initialKategori={params.kategori ?? ''}
      initialSearch={params.q ?? ''}
    />
  )
}