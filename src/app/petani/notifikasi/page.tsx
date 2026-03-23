import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PetaniNotifikasiClient from './PetaniNotifikasiClient'

export default async function PetaniNotifikasiPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Tandai semua sebagai sudah dibaca
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return <PetaniNotifikasiClient notifications={notifications ?? []} />
}
