import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfilClient from './ProfilClient'

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Statistik pembeli
  const { count: totalOrder } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('buyer_id', user.id)

  const { count: totalDone } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('buyer_id', user.id)
    .eq('status', 'done')

  const { data: totalBelanjaData } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('buyer_id', user.id)
    .eq('status', 'done')

  const totalBelanja = (totalBelanjaData ?? []).reduce((sum, o) => sum + (o.total_amount ?? 0), 0)

  return (
    <ProfilClient
      profile={profile}
      email={user.email ?? ''}
      stats={{
        totalOrder: totalOrder ?? 0,
        totalDone: totalDone ?? 0,
        totalBelanja,
      }}
    />
  )
}
