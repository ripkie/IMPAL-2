import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HomeClient from './HomeClient'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Produk rekomendasi (terlaris)
  const { data: rekomendasi } = await supabase
    .from('products')
    .select(`*, profiles(id, full_name), categories(id, name, slug)`)
    .eq('is_active', true)
    .gt('stock', 0)
    .order('sold_count', { ascending: false })
    .limit(8)

  // Produk terbaru
  const { data: terbaru } = await supabase
    .from('products')
    .select(`*, profiles(id, full_name), categories(id, name, slug)`)
    .eq('is_active', true)
    .gt('stock', 0)
    .order('created_at', { ascending: false })
    .limit(8)

  // Kategori
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')

  // Notifikasi belum dibaca
  const { data: notifikasi } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(5)

  // Pesanan aktif
  const { data: pesananAktif } = await supabase
    .from('orders')
    .select('id, order_number, status, total_amount, created_at')
    .eq('buyer_id', user.id)
    .in('status', ['pending', 'paid', 'processing', 'shipped'])
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <HomeClient
      profile={profile}
      rekomendasi={rekomendasi ?? []}
      terbaru={terbaru ?? []}
      categories={categories ?? []}
      notifikasi={notifikasi ?? []}
      pesananAktif={pesananAktif ?? []}
    />
  )
}
