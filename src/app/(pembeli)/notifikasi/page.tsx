import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NotifikasiClient from './NotifikasiClient'

export default async function NotifikasiPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifs } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Mark all as read
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return <NotifikasiClient notifications={notifs ?? []} />
}
