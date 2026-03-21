import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PetaniProfilClient from './PetaniProfilClient'

export default async function PetaniProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  const { data: farmerProfile } = await supabase
    .from('farmer_profiles').select('*').eq('user_id', user.id).single()

  return (
    <PetaniProfilClient
      profile={profile}
      farmerProfile={farmerProfile}
      email={user.email ?? ''}
    />
  )
}
