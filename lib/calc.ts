export interface Broker {
  id: string
  name: string
  payout: number
  my_pct: number
  aron_pct: number
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
  myShare: number
  afterExpenses: number
  aronAmt: number
  myProfit: number
}

export function calcBroker(b: Broker) {
  const myShare = Number(b.payout) * (Number(b.my_pct) / 100)
  const aronAmt = myShare * (Number(b.aron_pct) / 100)
  return { myShare, aronAmt, myProfit: myShare - aronAmt }
}

export function calcMonth(month: { brokers: Broker[], expenses: number }): MonthCalc {
  const totalPayout = month.brokers.reduce((s, b) => s + Number(b.payout), 0)
  const totalMyShare = month.brokers.reduce((s, b) => s + calcBroker(b).myShare, 0)
  const afterExpenses = totalMyShare - Number(month.expenses)
  const aronAmt = month.brokers.reduce((s, b) => {
    const myShare = Number(b.payout) * (Number(b.my_pct) / 100)
    const ratio = totalMyShare > 0 ? myShare / totalMyShare : 0
    const myAfterExp = afterExpenses * ratio
    return s + (myAfterExp > 0 ? myAfterExp * (Number(b.aron_pct) / 100) : 0)
  }, 0)
  const myProfit = afterExpenses - aronAmt
  return { totalPayout, myShare: totalMyShare, afterExpenses, aronAmt, myProfit }
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

export const fmtShort = (n: number) => {
  const abs = Math.abs(Math.round(n))
  return n < 0 ? `-$${abs.toLocaleString('en-US')}` : `$${abs.toLocaleString('en-US')}`
}
