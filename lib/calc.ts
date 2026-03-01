export const BOSS_SPLIT = 0.30   // šéf platí účty, ty dostaneš 30% z payoutu
export const ARON_SPLIT = 0.50   // 50% z tvého podílu posíláš Aronovi

export interface Broker {
  id: string
  name: string
  payout: number
}

export interface Month {
  id: string
  label: string
  brokers: Broker[]
  expenses: number
  created_at?: string
}

export interface MonthCalc {
  totalPayout: number
  myShare: number        // 30% od šéfa
  afterExpenses: number  // po odečtení nákladů
  aronAmt: number        // 50% Aronovi
  myProfit: number       // tvůj čistý zisk
}

export function calcMonth(month: { brokers: Broker[], expenses: number }): MonthCalc {
  const totalPayout = month.brokers.reduce((s, b) => s + Number(b.payout), 0)
  const myShare = totalPayout * BOSS_SPLIT
  const afterExpenses = myShare - Number(month.expenses)
  const aronAmt = afterExpenses > 0 ? afterExpenses * ARON_SPLIT : 0
  const myProfit = afterExpenses - aronAmt
  return { totalPayout, myShare, afterExpenses, aronAmt, myProfit }
}

export function calcTotals(months: (Month & MonthCalc)[]) {
  return months.reduce((a, m) => ({
    payout: a.payout + m.totalPayout,
    myShare: a.myShare + m.myShare,
    expenses: a.expenses + m.expenses,
    aron: a.aron + m.aronAmt,
    mine: a.mine + m.myProfit,
  }), { payout: 0, myShare: 0, expenses: 0, aron: 0, mine: 0 })
}

export const fmt = (n: number) =>
  new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

export const fmtShort = (n: number) =>
  `$${Math.abs(Math.round(n)).toLocaleString('en-US')}`
