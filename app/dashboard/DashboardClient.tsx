'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { calcMonth, calcBroker, calcTotals, fmtShort, type Month, type Broker } from '@/lib/calc'

type MonthWithCalc = Month & ReturnType<typeof calcMonth>

export default function DashboardClient({
  initialMonths, userId, userEmail,
}: { initialMonths: any[], userId: string, userEmail: string }) {
  const supabase = createClient()
  const router = useRouter()

  const [months, setMonths] = useState<Month[]>(
    initialMonths.map(m => ({ ...m, brokers: (m.brokers || []).map((b: any) => ({ ...b, my_pct: Number(b.my_pct ?? 30), aron_pct: Number(b.aron_pct ?? 50) })), expenses: Number(m.expenses) }))
  )
  const [modal, setModal] = useState<null | 'add' | string>(null)
  const [form, setForm] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => { setTimeout(() => setVisible(true), 100) }, [])

  const allStats: MonthWithCalc[] = months.map(m => ({ ...m, ...calcMonth(m) }))
  const totals = calcTotals(allStats)
  const maxProfit = Math.max(...allStats.map(m => m.myProfit), 1)
  const avg = months.length > 0 ? totals.mine / months.length : 0

  const brokerMap: Record<string, number> = {}
  months.forEach(m => m.brokers.forEach(b => { brokerMap[b.name] = (brokerMap[b.name] || 0) + Number(b.payout) }))
  const brokerList = Object.entries(brokerMap).sort((a, b) => b[1] - a[1])

  function openAdd() {
    setForm({ label: '', brokers: [{ id: crypto.randomUUID(), name: '', payout: '', my_pct: 30, aron_pct: 50 }], expenses: '' })
    setModal('add')
  }
  function openEdit(m: Month) {
    setForm({ ...m, brokers: m.brokers.map(b => ({ ...b })) })
    setModal(m.id)
  }

  async function saveAdd() {
    setSaving(true)
    try {
      const { data: newMonth, error: mErr } = await supabase.from('months').insert({ label: form.label, expenses: Number(form.expenses), user_id: userId }).select().single()
      if (mErr) throw mErr
      const { data: newBrokers, error: bErr } = await supabase.from('brokers')
        .insert(form.brokers.map((b: any) => ({ name: b.name, payout: Number(b.payout), my_pct: Number(b.my_pct), aron_pct: Number(b.aron_pct), month_id: newMonth.id, user_id: userId }))).select()
      if (bErr) throw bErr
      setMonths(p => [...p, { ...newMonth, brokers: newBrokers.map((b: any) => ({ ...b, my_pct: Number(b.my_pct), aron_pct: Number(b.aron_pct) })), expenses: Number(newMonth.expenses) }])
      setModal(null)
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  async function saveEdit() {
    setSaving(true)
    try {
      await supabase.from('months').update({ label: form.label, expenses: Number(form.expenses) }).eq('id', modal)
      await supabase.from('brokers').delete().eq('month_id', modal)
      const { data: newBrokers } = await supabase.from('brokers')
        .insert(form.brokers.map((b: any) => ({ name: b.name, payout: Number(b.payout), my_pct: Number(b.my_pct), aron_pct: Number(b.aron_pct), month_id: modal, user_id: userId }))).select()
      setMonths(p => p.map(m => m.id === modal ? { ...form, brokers: newBrokers?.map((b: any) => ({ ...b, my_pct: Number(b.my_pct), aron_pct: Number(b.aron_pct) })) || [], expenses: Number(form.expenses) } : m))
      setModal(null)
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  async function deleteMonth() {
    setSaving(true)
    try {
      await supabase.from('brokers').delete().eq('month_id', modal)
      await supabase.from('months').delete().eq('id', modal)
      setMonths(p => p.filter(m => m.id !== modal))
      setModal(null)
    } finally { setSaving(false) }
  }

  async function logout() { await supabase.auth.signOut(); router.push('/login') }

  const preview = form ? calcMonth({
    brokers: form.brokers.map((b: any) => ({ ...b, payout: Number(b.payout) || 0, my_pct: Number(b.my_pct) || 30, aron_pct: Number(b.aron_pct) || 50 })),
    expenses: Number(form.expenses) || 0,
  }) : null

  const inp = { width: '100%', background: '#0d1a0d', border: '1px solid #0d2b0d', borderRadius: 8, color: '#e2e8f0', fontSize: 13, padding: '9px 12px', fontFamily: "'DM Sans', sans-serif" } as React.CSSProperties
  const pctInp = { ...inp, width: '100%', color: '#00ff88', fontWeight: 700, textAlign: 'center' as const }

  return (
    <div style={{ minHeight: '100vh', background: '#060808', color: '#e2e8f0', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: #060808; } ::-webkit-scrollbar-thumb { background: #0d2b0d; border-radius: 3px; }
        @keyframes up { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .mcard { transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s; cursor: pointer; }
        .mcard:hover { border-color: #00ff88 !important; transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,255,136,0.1); }
        .brow:hover { background: rgba(0,255,136,0.05) !important; }
        input:focus { outline: none; border-color: #00ff88 !important; box-shadow: 0 0 0 2px rgba(0,255,136,0.1); }
        input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
      `}</style>

      {/* TOPBAR */}
      <div style={{ background: '#080d08', borderBottom: '1px solid #0d2b0d', padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 10, height: 10, background: '#00ff88', borderRadius: '50%', boxShadow: '0 0 12px #00ff88, 0 0 24px #00ff8855', animation: 'pulse 2s infinite' }} />
          <span style={{ fontWeight: 800, fontSize: 16, color: '#fff', letterSpacing: -0.3 }}>TICKETS</span>
          <span style={{ fontSize: 11, color: '#1a4a1a', fontWeight: 500 }}>FINANCIAL DASHBOARD</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={openAdd} style={{ background: 'transparent', border: '1px solid #00ff88', color: '#00ff88', fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 12, padding: '8px 18px', cursor: 'pointer', borderRadius: 8, letterSpacing: 0.5 }}>+ PŘIDAT MĚSÍC</button>
          <button onClick={logout} style={{ background: 'transparent', border: '1px solid #0d2b0d', color: '#1a4a1a', fontFamily: "'DM Sans',sans-serif", fontSize: 12, padding: '7px 14px', cursor: 'pointer', borderRadius: 8 }}>Odhlásit</button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px' }}>

        {/* HERO */}
        <div style={{ marginBottom: 28, animation: visible ? 'up 0.5s ease both' : 'none' }}>
          <div style={{ fontSize: 10, color: '#1a4a1a', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>Tvůj čistý zisk celkem</div>
          <div style={{ fontSize: 72, fontWeight: 800, color: '#00ff88', letterSpacing: -3, lineHeight: 1, textShadow: '0 0 40px rgba(0,255,136,0.4), 0 0 80px rgba(0,255,136,0.15)' }}>{fmtShort(totals.mine)}</div>
          <div style={{ display: 'flex', gap: 28, marginTop: 14, flexWrap: 'wrap' }}>
            {[['Celkový payout', fmtShort(totals.payout), '#374151'], ['Tvůj podíl', fmtShort(totals.myShare), '#1a5a3a'], ['Expenses', fmtShort(totals.expenses), '#4a1a1a'], ['Aronovi', fmtShort(totals.aron), '#3a1a5a'], [`⌀ ${fmtShort(avg)}/měs`, '', '#1a4a1a']].map(([l, v, c]) => (
              <div key={l} style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                <span style={{ fontSize: 11, color: '#374151' }}>{l}</span>
                {v && <span style={{ fontSize: 14, fontWeight: 700, color: c }}>{v}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* STAT PILLS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Celkový payout', value: fmtShort(totals.payout), color: '#374151', border: '#1a2a1a' },
            { label: 'Tvůj podíl', value: fmtShort(totals.myShare), color: '#00cc6a', border: '#0d2b1a' },
            { label: 'Aronovi', value: fmtShort(totals.aron), color: '#a78bfa', border: '#1a0d2b' },
            { label: 'Expenses', value: fmtShort(totals.expenses), color: '#f87171', border: '#2b0d0d' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#080d08', border: `1px solid ${s.border}`, borderRadius: 10, padding: '14px 16px', animation: visible ? `up 0.4s ease ${i * 0.07}s both` : 'none' }}>
              <div style={{ fontSize: 10, color: '#1a4a1a', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* CHART + LEADERBOARD */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, marginBottom: 24 }}>
          <div style={{ background: '#080d08', border: '1px solid #0d2b0d', borderRadius: 14, padding: '22px', animation: visible ? 'up 0.4s ease 0.28s both' : 'none' }}>
            <div style={{ fontSize: 10, color: '#1a4a1a', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 }}>Čistý zisk po měsících</div>
            {allStats.length === 0 ? <div style={{ textAlign: 'center', color: '#1a4a1a', padding: '40px 0' }}>Přidej první měsíc</div> : (
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 120 }}>
                {allStats.map((m, i) => {
                  const h = Math.max(6, (m.myProfit / maxProfit) * 104)
                  const isMax = m.myProfit === maxProfit
                  return (
                    <div key={m.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => openEdit(m)}>
                      <div style={{ fontSize: 10, color: '#00ff88', fontWeight: 700, opacity: isMax ? 1 : 0.5 }}>{fmtShort(m.myProfit)}</div>
                      <div style={{ width: '100%', background: '#0d2b0d', borderRadius: '4px 4px 0 0', height: 104, display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{ width: '100%', background: isMax ? '#00ff88' : 'rgba(0,255,136,0.45)', borderRadius: '4px 4px 0 0', height: visible ? h : 0, transition: `height 1s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s`, boxShadow: isMax ? '0 0 20px rgba(0,255,136,0.5)' : 'none' }} />
                      </div>
                      <div style={{ fontSize: 9, color: '#1a4a1a', textAlign: 'center', lineHeight: 1.4 }}>{m.label.split(' ')[0]}<br />{m.label.split(' ')[1]}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <div style={{ background: '#080d08', border: '1px solid #0d2b0d', borderRadius: 14, padding: '22px', animation: visible ? 'up 0.4s ease 0.35s both' : 'none' }}>
            <div style={{ fontSize: 10, color: '#1a4a1a', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 }}>Top účty</div>
            {brokerList.length === 0 ? <div style={{ color: '#1a4a1a', fontSize: 12 }}>Zatím žádné účty</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {brokerList.slice(0, 5).map(([name, total], i) => (
                  <div key={name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: i === 0 ? '#00ff88' : '#4b5563' }}>{name}</span>
                      <span style={{ fontSize: 11, color: '#1a4a1a' }}>{fmtShort(total)}</span>
                    </div>
                    <div style={{ height: 3, background: '#0d2b0d', borderRadius: 2 }}>
                      <div style={{ height: '100%', background: i === 0 ? '#00ff88' : 'rgba(0,255,136,0.2)', borderRadius: 2, width: visible ? `${total / brokerList[0][1] * 100}%` : '0%', transition: `width 1s ease ${i * 0.08}s`, boxShadow: i === 0 ? '0 0 8px rgba(0,255,136,0.4)' : 'none' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MONTH CARDS */}
        <div style={{ fontSize: 10, color: '#1a4a1a', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Měsíce</div>
        {allStats.length === 0 ? (
          <div style={{ background: '#080d08', border: '1px dashed #0d2b0d', borderRadius: 14, padding: '48px', textAlign: 'center' }}>
            <div style={{ color: '#1a4a1a', marginBottom: 16, fontSize: 14 }}>Zatím žádné záznamy</div>
            <button onClick={openAdd} style={{ background: 'transparent', border: '1px solid #00ff88', color: '#00ff88', fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 12, padding: '10px 24px', cursor: 'pointer', borderRadius: 8 }}>+ Přidat první měsíc</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 14 }}>
            {allStats.map((m, i) => (
              <div key={m.id} className="mcard" onClick={() => openEdit(m)} style={{ background: '#080d08', border: '1px solid #0d2b0d', borderRadius: 14, padding: '20px', animation: visible ? `up 0.4s ease ${0.4 + i * 0.07}s both` : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#1a4a1a', marginBottom: 3 }}>{m.brokers.length} účt{m.brokers.length === 1 ? '' : m.brokers.length < 5 ? 'y' : 'ů'}</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#e2e8f0' }}>{m.label}</div>
                  </div>
                  <div style={{ width: 30, height: 30, border: '1px solid #0d2b0d', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 9.5L5 6.5L7.5 9L11 3" stroke="#00ff88" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>

                {/* Broker rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                  {m.brokers.map(b => {
                    const bc = calcBroker(b)
                    return (
                      <div key={b.id} className="brow" style={{ padding: '6px 8px', borderRadius: 6, background: '#0d1a0d' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 11, color: '#374151' }}>{b.name}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#4b5563' }}>{fmtShort(Number(b.payout))}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, fontSize: 10 }}>
                          <span style={{ color: '#1a4a1a' }}>Já {b.my_pct}% → <span style={{ color: '#00cc6a' }}>{fmtShort(bc.myShare)}</span></span>
                          <span style={{ color: '#1a4a1a' }}>·</span>
                          <span style={{ color: '#1a4a1a' }}>Aron {b.aron_pct}% → <span style={{ color: '#a78bfa' }}>{fmtShort(bc.aronAmt)}</span></span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div style={{ height: 1, background: '#0d2b0d', marginBottom: 14 }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                  <div><div style={{ fontSize: 9, color: '#1a4a1a', marginBottom: 2 }}>Tvůj podíl</div><div style={{ fontSize: 12, fontWeight: 700, color: '#00cc6a' }}>{fmtShort(m.myShare)}</div></div>
                  <div><div style={{ fontSize: 9, color: '#1a4a1a', marginBottom: 2 }}>Expenses</div><div style={{ fontSize: 12, fontWeight: 700, color: '#f87171' }}>−{fmtShort(m.expenses)}</div></div>
                  <div><div style={{ fontSize: 9, color: '#1a4a1a', marginBottom: 2 }}>Aron</div><div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa' }}>−{fmtShort(m.aronAmt)}</div></div>
                </div>
                <div style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: 10, padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#00ff88', fontWeight: 600, letterSpacing: 0.5 }}>ČISTÝ ZISK</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#00ff88', textShadow: '0 0 16px rgba(0,255,136,0.5)' }}>{fmtShort(m.myProfit)}</span>
                </div>
                <div style={{ marginTop: 10, height: 2, background: '#0d2b0d', borderRadius: 2 }}>
                  <div style={{ height: '100%', background: '#00ff88', borderRadius: 2, width: visible ? `${Math.max(0, m.myProfit / maxProfit * 100)}%` : '0%', transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)', boxShadow: '0 0 6px rgba(0,255,136,0.4)' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {modal && form && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn 0.2s ease' }} onClick={() => setModal(null)}>
          <div style={{ background: '#080d08', border: '1px solid #0d2b0d', borderRadius: 16, padding: '32px', width: '100%', maxWidth: 580, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 0 60px rgba(0,255,136,0.08)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 6, height: 6, background: '#00ff88', borderRadius: '50%', boxShadow: '0 0 8px #00ff88' }} />
              <div style={{ fontWeight: 800, fontSize: 19, color: '#fff' }}>{modal === 'add' ? 'Nový měsíc' : form.label}</div>
            </div>
            <div style={{ fontSize: 11, color: '#1a4a1a', marginBottom: 28 }}>Každý účet má vlastní % — payout → ×Já% → ×Aron% = zisk</div>

            {modal === 'add' && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 10, color: '#1a4a1a', letterSpacing: 2, textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Název měsíce</label>
                <input value={form.label} onChange={e => setForm((f: any) => ({ ...f, label: e.target.value }))} placeholder="Květen 2025" style={inp} />
              </div>
            )}

            <label style={{ fontSize: 10, color: '#1a4a1a', letterSpacing: 2, textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Brokeři / účty</label>

            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 60px 60px 34px', gap: 6, marginBottom: 6, padding: '0 2px' }}>
              {['Název účtu', 'Payout $', 'Já %', 'Aron %', ''].map(h => (
                <div key={h} style={{ fontSize: 9, color: '#1a4a1a', letterSpacing: 1, textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              {form.brokers.map((b: any, i: number) => (
                <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 60px 60px 34px', gap: 6 }}>
                  <input placeholder="Název účtu" value={b.name} onChange={e => setForm((f: any) => ({ ...f, brokers: f.brokers.map((x: any, j: number) => j === i ? { ...x, name: e.target.value } : x) }))} style={inp} />
                  <input type="number" placeholder="0" value={b.payout} onChange={e => setForm((f: any) => ({ ...f, brokers: f.brokers.map((x: any, j: number) => j === i ? { ...x, payout: e.target.value } : x) }))} style={{ ...pctInp, color: '#e2e8f0' }} />
                  <input type="number" placeholder="30" value={b.my_pct} onChange={e => setForm((f: any) => ({ ...f, brokers: f.brokers.map((x: any, j: number) => j === i ? { ...x, my_pct: e.target.value } : x) }))} style={pctInp} />
                  <input type="number" placeholder="50" value={b.aron_pct} onChange={e => setForm((f: any) => ({ ...f, brokers: f.brokers.map((x: any, j: number) => j === i ? { ...x, aron_pct: e.target.value } : x) }))} style={{ ...pctInp, color: '#a78bfa' }} />
                  <button onClick={() => setForm((f: any) => ({ ...f, brokers: f.brokers.filter((_: any, j: number) => j !== i) }))} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, color: '#f87171', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
              ))}
            </div>
            <button onClick={() => setForm((f: any) => ({ ...f, brokers: [...f.brokers, { id: crypto.randomUUID(), name: '', payout: '', my_pct: 30, aron_pct: 50 }] }))}
              style={{ background: 'transparent', border: '1px dashed #0d2b0d', color: '#1a4a1a', fontFamily: "'DM Sans',sans-serif", fontSize: 12, padding: '9px', width: '100%', cursor: 'pointer', borderRadius: 8, marginBottom: 20 }}>
              + Přidat účet
            </button>

            <label style={{ fontSize: 10, color: '#1a4a1a', letterSpacing: 2, textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Running Expenses</label>
            <input type="number" value={form.expenses} onChange={e => setForm((f: any) => ({ ...f, expenses: e.target.value }))} placeholder="$ náklady"
              style={{ ...inp, color: '#f87171', fontWeight: 600, marginBottom: 20 }} />

            {/* Preview */}
            {preview && (
              <div style={{ background: '#0a0f0a', border: '1px solid #0d2b0d', borderRadius: 10, padding: '16px 18px', marginBottom: 24 }}>
                <div style={{ fontSize: 9, color: '#1a4a1a', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Náhled výpočtu</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[
                    ['Celkový payout', fmtShort(preview.totalPayout), '#4b5563'],
                    ['Tvůj podíl', fmtShort(preview.myShare), '#00cc6a'],
                    ['− Expenses', `−${fmtShort(Number(form.expenses || 0))}`, '#f87171'],
                    ['− Aronovi', `−${fmtShort(preview.aronAmt)}`, '#a78bfa'],
                  ].map(([l, v, c]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#1a4a1a' }}>{l}</span>
                      <span style={{ color: c, fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: '#0d2b0d', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#00ff88', fontWeight: 700, fontSize: 13 }}>= Čistý zisk</span>
                    <span style={{ color: '#00ff88', fontWeight: 800, fontSize: 20, textShadow: '0 0 12px rgba(0,255,136,0.5)' }}>{fmtShort(preview.myProfit)}</span>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              {modal !== 'add' && (
                <button onClick={deleteMonth} disabled={saving} style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13, padding: '10px 18px', cursor: 'pointer', borderRadius: 10 }}>Smazat</button>
              )}
              <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
                <button onClick={() => setModal(null)} style={{ background: '#0d1a0d', border: '1px solid #0d2b0d', color: '#1a4a1a', fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13, padding: '10px 18px', cursor: 'pointer', borderRadius: 10 }}>Zrušit</button>
                <button onClick={modal === 'add' ? saveAdd : saveEdit} disabled={saving}
                  style={{ background: 'transparent', border: '1px solid #00ff88', color: '#00ff88', fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 13, padding: '10px 24px', cursor: saving ? 'not-allowed' : 'pointer', borderRadius: 10, boxShadow: '0 0 16px rgba(0,255,136,0.15)', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Ukládám...' : modal === 'add' ? 'ULOŽIT' : 'AKTUALIZOVAT'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
