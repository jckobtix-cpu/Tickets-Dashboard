import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: months } = await supabase
    .from('months')
    .select('*, brokers(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return <DashboardClient initialMonths={months || []} userId={user.id} userEmail={user.email || ''} />
}
