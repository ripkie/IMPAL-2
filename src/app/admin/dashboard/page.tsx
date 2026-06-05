import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminDashboardClient from './AdminDashboardClient'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/home')

  const { count: totalPetani } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'petani')

  const { count: pendingVerifikasi } = await supabase
    .from('farmer_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('verify_status', 'pending')

  const { count: approvedVerifikasi } = await supabase
    .from('farmer_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('verify_status', 'approved')

  const { count: rejectedVerifikasi } = await supabase
    .from('farmer_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('verify_status', 'rejected')

  const { data: farmerProfiles } = await supabase
    .from('farmer_profiles')
    .select('id, user_id, farm_name, farm_location, created_at, verify_status')
    .eq('verify_status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5)

  const userIds = (farmerProfiles ?? [])
    .map((item) => item.user_id)
    .filter(Boolean)

  const { data: profiles } = userIds.length
    ? await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .in('id', userIds)
    : { data: [] }

  const profileMap = new Map(
    (profiles ?? []).map((item) => [item.id, item])
  )

  const petaniPending = (farmerProfiles ?? []).map((item) => ({
    id: item.id,
    farm_name: item.farm_name,
    farm_location: item.farm_location,
    created_at: item.created_at,
    verify_status: item.verify_status,
    profiles: profileMap.get(item.user_id) ?? null,
  }))

  return (
    <AdminDashboardClient
      totalPetani={totalPetani ?? 0}
      pendingVerifikasi={pendingVerifikasi ?? 0}
      approvedVerifikasi={approvedVerifikasi ?? 0}
      rejectedVerifikasi={rejectedVerifikasi ?? 0}
      petaniPending={petaniPending}
    />
  )
}