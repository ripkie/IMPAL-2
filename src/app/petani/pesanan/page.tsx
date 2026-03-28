// Server Component — aman, tidak expose ke client
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getFarmerOrders } from '@/lib/queries/farmer'
import PetaniPesananClient from './PetaniPesananClient'

export default async function PetaniPesananPage() {
  const supabase = await createClient()

  // SECURITY: verifikasi user dari session server
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // SECURITY: verifikasi role dari DB, bukan dari client
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'petani') redirect('/home')

  // Pakai query helper — admin client dengan filter farmer_id wajib
  const orderItems = await getFarmerOrders(user.id)

  return (
    <PetaniPesananClient
      orderItems={orderItems}
      farmerId={user.id}
    />
  )
}
