'use client'
export const dynamic = 'force-dynamic'
// ============================================================
// PROFITYX — /propfirm : Outils Prop Firm
// Aide les traders à survivre et réussir les challenges prop
// ============================================================
import { useState, useEffect, useCallback } from 'react'
import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'
import { QuotaBar } from '@/components/dashboard/TopBar'
import { supabasePublic } from '@/lib/supabase'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

const FIRMS = [
  { id:'ftmo',   name:'FTMO',           profit:10, dd:10, daily:5,  phases:2 },
  { id:'mff',    name:'MyForexFunds',   profit:8,  dd:12, daily:5,  phases:2 },
  { id:'fte',    name:'FundedTraderElite', profit:8, dd:10, daily:4, phases:1 },
  { id:'e8',     name:'E8 Funding',     profit:8,  dd:8,  daily:5,  phases:1 },
  { id:'topstep',name:'TopStep',        profit:6,  dd:6,  daily:3,  phases:1 },
  { id:'custom', name:'Custom / Autre', profit:8,  dd:10, daily:5,  phases:1 },
]

interface Tool {
  id: string; firm_name: string; account_size: number
  profit_target: number; max_drawdown: number; daily_loss: number
  current_balance: number; current_drawdown: number; daily_loss_used: number
  phase: string; status: string; started_at: string; notes?: string
}

export default function PropFirmPage() {
  const [token,   setToken]   = useState('')
  const [profile, setProfile] = useState<Record<string,unknown>|null>(null)
  const [plan,    setPlan]    = useState('free')
  const [locale,  setLocale]  = useState('fr')
  const [tools,   setTools]   = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [recentAnalyses, setRecentAnalyses] = useState<Array<{id:string;pair:string;direction:string;entry:number;stop_loss:number;rr_ratio:number;created_at:string}>>([])


  // Formulaire nouveau compte
  const [firmId,   setFirmId]   = useState('ftmo')
  const [size,     setSize]     = useState(10000)
  const [balance,  setBalance]  = useState(10000)
  const [customDD, setCustomDD] = useState(10)
  const [customPT, setCustomPT] = useState(8)
  const [customDL, setCustomDL] = useState(5)
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabasePublic.auth.getSession()
      if (!session) { window.location.href = '/auth/login'; return }
      setToken(session.access_token)
      const { data: p } = await supabasePublic.from('profiles').select('*').eq('id', session.user.id).single()
      if (p) { setProfile(p); setPlan(p.user_plan as string || 'free'); setLocale(p.locale as string || 'fr') }
      const [{ data: t }, { data: analyses }] = await Promise.all([
        supabasePublic.from('propfirm_tools').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
        supabasePublic.from('chart_analyses').select('id,pair,direction,entry,stop_loss,rr_ratio,created_at').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(10),
      ])
      if (t) setTools(t as Tool[])
      if (analyses) setRecentAnalyses(analyses as any)
      setLoading(false)
    })()
  }, [])

  const selectedFirm = FIRMS.find(f => f.id === firmId) ?? FIRMS[FIRMS.length - 1]
  const pt  = firmId === 'custom' ? customPT  : selectedFirm.profit_target
  const mdd = firmId === 'custom' ? customDD  : selectedFirm.max_drawdown
  const dl  = firmId === 'custom' ? customDL  : selectedFirm.daily_loss

  const addAccount = async () => {
    setSaving(true)
    const { data: { session } } = await supabasePublic.auth.getSession()
    if (!session) return
    await supabasePublic.from('propfirm_tools').insert({
      user_id: session.user.id,
      firm_name: selectedFirm.name,
      account_size: size,
      profit_target: pt,
      max_drawdown: mdd,
      daily_loss: dl,
      current_balance: balance,
      current_drawdown: 0,
      daily_loss_used: 0,
      phase: 'challenge',
      status: 'active',
    })
    const { data: t } = await supabasePublic.from('propfirm_tools').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
    if (t) setTools(t as Tool[])
    setShowNew(false)
    setSaving(false)
  }

  const updateBalance = async (id: string, newBal: number, newDD: number, newDL: number) => {
    await supabasePublic.from('propfirm_tools').update({
      current_balance: newBal,
      current_drawdown: newDD,
      daily_loss_used: newDL,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    setTools(prev => prev.map(t => t.id === id ? { ...t, current_balance: newBal, current_drawdown: newDD, daily_loss_used: newDL } : t))
  }

  const T = {
    title:   locale === 'en' ? 'PROP FIRM TOOLS'    : 'OUTILS PROP FIRM',
    sub:     locale === 'en' ? 'Track your challenge, manage your risk, stay in the game.' : 'Suivez votre challenge, gérez votre risque, restez dans le jeu.',
    add:     locale === 'en' ? 'ADD AN ACCOUNT'      : 'AJOUTER UN COMPTE',
    empty:   locale === 'en' ? 'No prop firm account tracked yet.' : 'Aucun compte prop firm suivi pour le moment.',
    profit:  locale === 'en' ? 'Profit target'       : 'Objectif profit',
    dd:      locale === 'en' ? 'Max drawdown'        : 'Drawdown max',
    daily:   locale === 'en' ? 'Daily loss limit'    : 'Perte journalière max',
    balance: locale === 'en' ? 'Current balance'     : 'Solde actuel',
    phase:   locale === 'en' ? 'Phase'               : 'Phase',
    status:  locale === 'en' ? 'Status'              : 'Statut',
    update:  locale === 'en' ? 'UPDATE'              : 'METTRE À JOUR',
    tips:    locale === 'en' ? 'SURVIVAL TIPS'       : 'CONSEILS DE SURVIE',
  }

  const TIPS = locale === 'en' ? [
    { icon:'🎯', title:'Risk max 0.5% per trade', desc:'With a $10K account, risk max $50 per trade. One bad series won\'t kill your account.' },
    { icon:'⏸️', title:'Stop after 2 consecutive losses', desc:'2 losses in a row = emotions take over. Take a 24h break. The market will still be there.' },
    { icon:'📅', title:'Avoid NFP/CPI first 15 minutes', desc:'High volatility events can trigger your daily limit in one candle. Wait for confirmation.' },
    { icon:'📊', title:'Track every trade in the journal', desc:'The journal identifies your weaknesses. Prop firms reward consistency, not luck.' },
    { icon:'🔢', title:'Never trade more than 2 pairs simultaneously', desc:'Overexposure is the #1 cause of prop firm failures. Stay focused.' },
    { icon:'🌙', title:'Close all positions before the weekend', desc:'Weekend gaps can exceed your daily limit. Protect your challenge.' },
  ] : [
    { icon:'🎯', title:'Risque max 0.5% par trade', desc:'Sur un compte 10K$, risquez max 50$. Une mauvaise série ne tue pas le compte.' },
    { icon:'⏸️', title:'Stoppez après 2 pertes consécutives', desc:'2 losses de suite = les émotions prennent le dessus. Pause 24h. Le marché sera toujours là.' },
    { icon:'📅', title:'Évitez les 15 premières min NFP/CPI', desc:'Une news forte peut déclencher votre limite journalière en une bougie. Attendez la confirmation.' },
    { icon:'📊', title:'Notez chaque trade dans le journal', desc:'Le journal identifie vos faiblesses. Les prop firms récompensent la constance, pas la chance.' },
    { icon:'🔢', title:'Ne tradez jamais plus de 2 paires simultanément', desc:'La surexposition est la cause #1 d\'échec en prop firm. Restez concentré.' },
    { icon:'🌙', title:'Fermez tout avant le week-end', desc:'Les gaps du week-end peuvent dépasser votre limite journalière. Protégez votre challenge.' },
  ]

  return (
    <div className="app-shell">
      <Sidebar tab={'chart' as any} setTab={() => {}} plan={plan} locale={locale} />
      <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'var(--bg0)', width:'100%', overflow:'hidden' }}>
        <TopBar locale={locale} profile={profile} />
        <QuotaBar token={token} locale={locale} plan={plan} />

        <div className="resp-pad" style={{ padding:'1.5rem', flex:1 }}>
          <div style={{ maxWidth:900, margin:'0 auto' }}>

            {/* Header */}
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1.5rem', flexWrap:'wrap', gap:12 }}>
              <div>
                <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:3, color:'var(--ac2)', marginBottom:4 }}>MODULE</div>
                <h1 style={{ fontFamily:HUD, fontSize:22, fontWeight:900, color:'var(--tx0)', margin:0 }}>
                  {T.title.split(' ').slice(0,2).join(' ')} <span style={{ color:'var(--ac)' }}>{T.title.split(' ').slice(2).join(' ')}</span>
                </h1>
                <p style={{ fontFamily:BODY, fontSize:13, color:'var(--tx3)', marginTop:4 }}>{T.sub}</p>
              </div>
              <button onClick={() => setShowNew(true)} style={{
                display:'flex', alignItems:'center', gap:6,
                background:'var(--ac)', color:'#020408',
                fontFamily:HUD, fontSize:9, letterSpacing:1, fontWeight:700,
                border:'none', borderRadius:7, padding:'10px 18px', cursor:'pointer',
              }}>
                + {T.add}
              </button>
            </div>

            {/* Formulaire nouveau compte */}
            {showNew && (
              <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.5rem', marginBottom:'1.5rem' }}>
                <div style={{ fontFamily:HUD, fontSize:10, color:'var(--tx0)', marginBottom:'1rem' }}>
                  {locale === 'en' ? 'NEW PROP FIRM ACCOUNT' : 'NOUVEAU COMPTE PROP FIRM'}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12, marginBottom:'1rem' }}>
                  <div>
                    <label style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)', display:'block', marginBottom:4 }}>FIRM</label>
                    <select value={firmId} onChange={e => setFirmId(e.target.value)} style={{ width:'100%', background:'var(--bg0)', border:'1px solid var(--bd)', color:'var(--tx0)', borderRadius:5, padding:'8px 10px', fontFamily:HUD, fontSize:9 }}>
                      {FIRMS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)', display:'block', marginBottom:4 }}>ACCOUNT SIZE ($)</label>
                    <input type="number" value={size} onChange={e => { setSize(+e.target.value); setBalance(+e.target.value) }} style={{ width:'100%', background:'var(--bg0)', border:'1px solid var(--bd)', color:'var(--tx0)', borderRadius:5, padding:'8px 10px', fontFamily:HUD, fontSize:12 }} />
                  </div>
                  {firmId === 'custom' && (<>
                    <div>
                      <label style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)', display:'block', marginBottom:4 }}>PROFIT TARGET (%)</label>
                      <input type="number" value={customPT} onChange={e => setCustomPT(+e.target.value)} style={{ width:'100%', background:'var(--bg0)', border:'1px solid var(--bd)', color:'var(--tx0)', borderRadius:5, padding:'8px 10px', fontFamily:HUD, fontSize:12 }} />
                    </div>
                    <div>
                      <label style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)', display:'block', marginBottom:4 }}>MAX DRAWDOWN (%)</label>
                      <input type="number" value={customDD} onChange={e => setCustomDD(+e.target.value)} style={{ width:'100%', background:'var(--bg0)', border:'1px solid var(--bd)', color:'var(--tx0)', borderRadius:5, padding:'8px 10px', fontFamily:HUD, fontSize:12 }} />
                    </div>
                    <div>
                      <label style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)', display:'block', marginBottom:4 }}>DAILY LOSS (%)</label>
                      <input type="number" value={customDL} onChange={e => setCustomDL(+e.target.value)} style={{ width:'100%', background:'var(--bg0)', border:'1px solid var(--bd)', color:'var(--tx0)', borderRadius:5, padding:'8px 10px', fontFamily:HUD, fontSize:12 }} />
                    </div>
                  </>)}
                </div>
                {/* Règles calculées */}
                <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:'1rem' }}>
                  {[
                    { label:T.profit, val:`+${pt}% = $${(size * pt / 100).toFixed(0)}`, color:'#00FFB2' },
                    { label:T.dd,     val:`-${mdd}% = $${(size * mdd / 100).toFixed(0)}`, color:'#FF3A5C' },
                    { label:T.daily,  val:`-${dl}% = $${(size * dl / 100).toFixed(0)}/j`, color:'#C9A84C' },
                  ].map(r => (
                    <div key={r.label} style={{ background:`${r.color}08`, border:`1px solid ${r.color}20`, borderRadius:6, padding:'8px 14px' }}>
                      <div style={{ fontFamily:HUD, fontSize:7, color:'var(--tx3)', marginBottom:2 }}>{r.label}</div>
                      <div style={{ fontFamily:HUD, fontSize:12, color:r.color }}>{r.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={addAccount} disabled={saving} style={{ background:'var(--ac)', color:'#020408', fontFamily:HUD, fontSize:9, letterSpacing:1, fontWeight:700, border:'none', borderRadius:6, padding:'10px 20px', cursor:'pointer' }}>
                    {saving ? '...' : (locale === 'en' ? 'ADD' : 'AJOUTER')}
                  </button>
                  <button onClick={() => setShowNew(false)} style={{ background:'transparent', color:'var(--tx3)', fontFamily:HUD, fontSize:9, letterSpacing:1, border:'1px solid var(--bd)', borderRadius:6, padding:'10px 16px', cursor:'pointer' }}>
                    {locale === 'en' ? 'CANCEL' : 'ANNULER'}
                  </button>
                </div>
              </div>
            )}

            {/* Comptes suivis */}
            {loading ? (
              <div style={{ textAlign:'center', padding:'3rem', fontFamily:HUD, fontSize:10, color:'var(--tx3)', letterSpacing:3 }}>CHARGEMENT...</div>
            ) : tools.length === 0 && !showNew ? (
              <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:10, padding:'3rem', textAlign:'center' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🏦</div>
                <div style={{ fontFamily:BODY, fontSize:14, color:'var(--tx3)', marginBottom:'1rem' }}>{T.empty}</div>
                <button onClick={() => setShowNew(true)} style={{ background:'var(--ac)', color:'#020408', fontFamily:HUD, fontSize:9, fontWeight:700, border:'none', borderRadius:6, padding:'10px 20px', cursor:'pointer' }}>
                  + {T.add}
                </button>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14, marginBottom:'2rem' }}>
                {tools.map(tool => {
                  const profitPct   = ((tool.current_balance - tool.account_size) / tool.account_size) * 100
                  const profitNeeded = tool.profit_target - profitPct
                  const ddPct       = tool.current_drawdown
                  const dlPct       = tool.daily_loss_used
                  const ddSafe      = tool.max_drawdown - ddPct
                  const dlSafe      = tool.daily_loss - dlPct
                  const riskScore   = Math.max(0, 100 - (ddPct / tool.max_drawdown * 60) - (dlPct / tool.daily_loss * 40))

                  return (
                    <AccountCard key={tool.id} tool={tool} profitPct={profitPct}
                      profitNeeded={profitNeeded} ddPct={ddPct} dlPct={dlPct}
                      ddSafe={ddSafe} dlSafe={dlSafe} riskScore={riskScore}
                      locale={locale} T={T} onUpdate={updateBalance} />
                  )
                })}
              </div>
            )}

            {/* Analyses récentes liées au compte actif */}
            {recentAnalyses.length > 0 && (
              <div style={{ marginTop:'2rem', marginBottom:'1.5rem' }}>
                <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:3, color:'var(--tx3)', marginBottom:'1rem' }}>
                  {locale === 'en' ? 'RECENT ANALYSES → RISK TRACKING' : 'ANALYSES RÉCENTES → SUIVI DU RISQUE'}
                </div>
                <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:10, overflow:'hidden' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', padding:'8px 14px', borderBottom:'1px solid var(--bd)', background:'rgba(255,255,255,0.02)' }}>
                    {['PAIRE','DIRECTION','ENTRÉE','RISQUE EST.','DATE'].map(h => (
                      <div key={h} style={{ fontFamily:HUD, fontSize:6, letterSpacing:1, color:'var(--tx3)' }}>{h}</div>
                    ))}
                  </div>
                  {recentAnalyses.map(a => {
                    const riskPct = a.entry && a.stop_loss
                      ? Math.abs((a.entry - a.stop_loss) / a.entry * 100).toFixed(2)
                      : '~1.00'
                    const dirColor = a.direction?.includes('LONG') || a.direction?.includes('BUY') ? '#00FFB2' : '#FF3A5C'
                    return (
                      <div key={a.id} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.03)', alignItems:'center' }}>
                        <div style={{ fontFamily:HUD, fontSize:9, color:'var(--tx0)' }}>{a.pair}</div>
                        <div style={{ fontFamily:HUD, fontSize:8, color:dirColor }}>{a.direction?.split(' ')[0]}</div>
                        <div style={{ fontFamily:HUD, fontSize:8, color:'var(--tx2)' }}>{a.entry}</div>
                        <div style={{ fontFamily:HUD, fontSize:8, color:'#C9A84C' }}>~{riskPct}%</div>
                        <div style={{ fontFamily:BODY, fontSize:10, color:'var(--tx3)' }}>
                          {new Date(a.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', { day:'2-digit', month:'short' })}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)', marginTop:6, padding:'0 2px' }}>
                  {locale === 'en'
                    ? '* Estimated risk based on entry/stop loss distance. Updated automatically with each new analysis.'
                    : '* Risque estimé basé sur la distance entrée/stop loss. Mis à jour automatiquement à chaque nouvelle analyse.'}
                </div>
              </div>
            )}

            {/* Conseils de survie */}
            <div style={{ marginTop:'2rem' }}>
              <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:3, color:'var(--tx3)', marginBottom:'1rem' }}>{T.tips}</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:10 }}>
                {TIPS.map(tip => (
                  <div key={tip.title} style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:9, padding:'14px 16px' }}>
                    <div style={{ fontSize:20, marginBottom:8 }}>{tip.icon}</div>
                    <div style={{ fontFamily:HUD, fontSize:9, color:'var(--tx0)', marginBottom:6, lineHeight:1.4 }}>{tip.title}</div>
                    <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)', lineHeight:1.6 }}>{tip.desc}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        <footer className="app-footer">
          <a href="/legal/cgu">CGU</a>
          <span style={{color:'var(--tx3)'}}>·</span>
          <a href="/support">{locale === 'en' ? 'Support' : 'Assistance'}</a>
        </footer>
      </div>
    </div>
  )
}

// ── Carte d'un compte prop firm ───────────────────────────────
function AccountCard({ tool, profitPct, profitNeeded, ddPct, dlPct, ddSafe, dlSafe, riskScore, locale, T, onUpdate }: {
  tool: Tool; profitPct: number; profitNeeded: number; ddPct: number; dlPct: number
  ddSafe: number; dlSafe: number; riskScore: number; locale: string
  T: Record<string,string>; onUpdate: (id: string, bal: number, dd: number, dl: number) => void
}) {
  const HUD  = "'Orbitron', monospace"
  const BODY = "'Rajdhani', sans-serif"
  const [editing, setEditing] = useState(false)
  const [newBal,  setNewBal]  = useState(tool.current_balance)
  const [newDD,   setNewDD]   = useState(tool.current_drawdown)
  const [newDL,   setNewDL]   = useState(tool.daily_loss_used)

  const riskColor = riskScore > 70 ? '#00FFB2' : riskScore > 40 ? '#C9A84C' : '#FF3A5C'

  const Bar = ({ pct, max, color }: { pct: number; max: number; color: string }) => (
    <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden', marginTop:4 }}>
      <div style={{ height:'100%', width:`${Math.min(100,(pct/max)*100)}%`, background:color, borderRadius:2, transition:'width .4s' }} />
    </div>
  )

  return (
    <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.25rem', position:'relative' }}>
      {/* Score de sécurité */}
      <div style={{ position:'absolute', top:12, right:12, fontFamily:HUD, fontSize:16, color:riskColor, fontWeight:900 }}>
        {Math.round(riskScore)}
        <span style={{ fontSize:8, opacity:.6 }}>/100</span>
      </div>

      <div style={{ fontFamily:HUD, fontSize:11, color:'var(--tx0)', marginBottom:2 }}>{tool.firm_name}</div>
      <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)', marginBottom:'1rem' }}>
        ${tool.account_size.toLocaleString()} · {tool.phase.toUpperCase()}
      </div>

      {/* Profit */}
      <div style={{ marginBottom:10 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
          <span style={{ fontFamily:HUD, fontSize:7, color:'var(--tx3)', letterSpacing:1 }}>{T.profit}</span>
          <span style={{ fontFamily:HUD, fontSize:9, color: profitPct >= 0 ? '#00FFB2' : '#FF3A5C' }}>
            {profitPct >= 0 ? '+' : ''}{profitPct.toFixed(2)}% {profitNeeded > 0 ? `(encore +${profitNeeded.toFixed(2)}%)` : '✓'}
          </span>
        </div>
        <Bar pct={profitPct} max={tool.profit_target} color="#00FFB2" />
      </div>

      {/* Drawdown */}
      <div style={{ marginBottom:10 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
          <span style={{ fontFamily:HUD, fontSize:7, color:'var(--tx3)', letterSpacing:1 }}>{T.dd}</span>
          <span style={{ fontFamily:HUD, fontSize:9, color: ddPct < tool.max_drawdown * 0.7 ? '#00FFB2' : '#FF3A5C' }}>
            -{ddPct.toFixed(2)}% ({locale==='en'?`${ddSafe.toFixed(2)}% safe`:`${ddSafe.toFixed(2)}% restant`})
          </span>
        </div>
        <Bar pct={ddPct} max={tool.max_drawdown} color={ddPct > tool.max_drawdown * 0.7 ? '#FF3A5C' : '#C9A84C'} />
      </div>

      {/* Daily loss */}
      <div style={{ marginBottom:'1rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
          <span style={{ fontFamily:HUD, fontSize:7, color:'var(--tx3)', letterSpacing:1 }}>{T.daily}</span>
          <span style={{ fontFamily:HUD, fontSize:9, color: dlPct < tool.daily_loss * 0.7 ? '#00FFB2' : '#FF3A5C' }}>
            -{dlPct.toFixed(2)}% ({locale==='en'?`${dlSafe.toFixed(2)}% left`:`${dlSafe.toFixed(2)}% restant`})
          </span>
        </div>
        <Bar pct={dlPct} max={tool.daily_loss} color={dlPct > tool.daily_loss * 0.7 ? '#FF3A5C' : '#C9A84C'} />
      </div>

      {/* Formulaire mise à jour */}
      {editing ? (
        <div style={{ borderTop:'1px solid var(--bd)', paddingTop:'1rem', display:'flex', flexDirection:'column', gap:8 }}>
          {[
            { label:`${locale==='en'?'Balance':'Solde'} ($)`, val:newBal, set:setNewBal },
            { label:'Drawdown (%)', val:newDD, set:setNewDD },
            { label:`${locale==='en'?'Daily loss':'Perte jour'} (%)`, val:newDL, set:setNewDL },
          ].map(f => (
            <div key={f.label} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontFamily:HUD, fontSize:7, color:'var(--tx3)', minWidth:90 }}>{f.label}</span>
              <input type="number" step="0.01" value={f.val} onChange={e => f.set(+e.target.value)}
                style={{ flex:1, background:'var(--bg0)', border:'1px solid var(--bd)', color:'var(--tx0)', borderRadius:5, padding:'6px 8px', fontFamily:HUD, fontSize:10 }} />
            </div>
          ))}
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={() => { onUpdate(tool.id, newBal, newDD, newDL); setEditing(false) }}
              style={{ flex:1, background:'var(--ac)', color:'#020408', fontFamily:HUD, fontSize:8, fontWeight:700, border:'none', borderRadius:5, padding:'8px', cursor:'pointer' }}>
              {T.update}
            </button>
            <button onClick={() => setEditing(false)}
              style={{ background:'transparent', color:'var(--tx3)', fontFamily:HUD, fontSize:8, border:'1px solid var(--bd)', borderRadius:5, padding:'8px 12px', cursor:'pointer' }}>
              ✕
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} style={{ width:'100%', background:'transparent', border:'1px solid var(--bd)', color:'var(--tx2)', fontFamily:HUD, fontSize:8, letterSpacing:1, borderRadius:6, padding:'8px', cursor:'pointer' }}>
          {T.update} →
        </button>
      )}
    </div>
  )
}
