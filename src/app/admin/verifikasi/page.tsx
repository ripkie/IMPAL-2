import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VerifikasiClient from './VerifikasiClient'

export default async function VerifikasiPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/home')

  const { data: petaniRaw, error } = await supabase
    .from('farmer_profiles')
    .select(`
      id, farm_name, farm_location, farm_size,
      ktp_url, cert_url, verify_status, reject_reason,
      created_at, verified_at,
      profiles!farmer_profiles_user_id_fkey(id, full_name, phone)
    `)
    .order('created_at', { ascending: false })

  console.log('PETANI RAW:', JSON.stringify(petaniRaw))
  console.log('ERROR:', JSON.stringify(error))

  // Flatten profiles array
  const petani = (petaniRaw ?? []).map((p: any) => ({
    ...p,
    profiles: Array.isArray(p.profiles) ? p.profiles[0] ?? null : p.profiles
  }))

  return <VerifikasiClient petani={petani} adminId={user.id} />
}
