import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  leden: 1, únor: 2, březen: 3, duben: 4, květen: 5, červen: 6,
  červenec: 7, srpen: 8, září: 9, říjen: 10, listopad: 11, prosinec: 12,
}

function parseMonthDate(label: string): number {
  const parts = label.toLowerCase().trim().split(/\s+/)
  const monthName = parts[0]
  const year = parseInt(parts[1]) || 2000
  const month = MONTHS[monthName] || 0
  return year * 100 + month
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: months } = await supabase
    .from('months')
    .select('*, brokers(*)')
    .eq('user_id', user.id)

  const sorted = (months || []).sort((a, b) => parseMonthDate(a.label) - parseMonthDate(b.label))

  return <DashboardClient initialMonths={sorted} userId={user.id} userEmail={user.email || ''} />
}
