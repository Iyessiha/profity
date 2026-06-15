// ============================================================
// PROFITYX — /journal : Journal de trading complet
// ============================================================
'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'
import { supabasePublic } from '@/lib/supabase'
import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'
import { QuotaBar } from '@/components/dashboard/TopBar'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

const PAIRS    = ['XAU/USD','EUR/USD','GBP/USD','USD/JPY','BTC/USD','ETH/USD','GBP/JPY','NAS100','V75','V10','CRASH 500','BOOM 500']
const EMOTIONS = ['CONFIANT','DISCIPLINÉ','NEUTRE','ANXIEUX','FOMO']
const EMO_EMOJI: Record<string,string> = { CONFIANT:'😤', DISCIPLINÉ:'🧘', NEUTRE:'😐', ANXIEUX:'😰', FOMO:'😱' }
const EMO_COLOR: Record<string,string> = { CONFIANT:'#00FFB2', DISCIPLINÉ:'#00D4FF', NEUTRE:'#C9A84C', ANXIEUX:'#FF9500', FOMO:'#FF3A5C' }

interface Trade {
  id:string; pair:string; direction:'LONG'|'SHORT'; entry:number; exit?:number
  stop_loss?:number; tp?:number; lot_size?:number; result?:string
  pnl_pips?:number; pnl_amount?:number; currency?:string
  emotion?:string; notes?:string; trade_date:string
}
interface Stats { wins:number; losses:number; winrate:number; total_pnl:number }

function fmt(n:number|null|undefined, dec=2) {
  if (n==null||isNaN(n)) return '—'
  return n.toLocaleString('fr-FR',{maximumFractionDigits:dec})
}
function fmtDate(d:string) {
  return new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})
}

// ── Graphique P&L (SVG) ──────────────────────────────────────
function PnLChart({ trades }: { trades: Trade[] }) {
  const sorted = [...trades].filter(t => t.pnl_amount != null).sort((a,b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime())
  if (sorted.length < 2) return (
    <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:BODY, fontSize:13, color:'var(--tx3)' }}>
      Pas encore assez de trades pour afficher le graphique
    </div>
  )
  let cum = 0
  const pts = sorted.map(t => { cum += t.pnl_amount!; return cum })
  const min = Math.min(0, ...pts), max = Math.max(0, ...pts)
  const range = max - min || 1
  const W = 560, H = 120, PAD = 10
  const x = (i:number) => PAD + (i/(pts.length-1))*(W-PAD*2)
  const y = (v:number) => PAD + (1-(v-min)/range)*(H-PAD*2)
  const isPos = pts[pts.length-1] >= 0
  const col = isPos ? '#00FFB2' : '#FF3A5C'
  const path = pts.map((v,i) => `${i===0?'M':'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const fill = path + ` L${x(pts.length-1).toFixed(1)},${H} L${PAD},${H} Z`
  const zeroY = y(0)

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display:'block' }}>
      <defs>
        <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={col} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <line x1={PAD} y1={zeroY} x2={W-PAD} y2={zeroY} stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4,3"/>
      <path d={fill} fill="url(#pnlGrad)"/>
      <path d={path} stroke={col} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.length <= 20 && pts.map((v,i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={v>=0?'#00FFB2':'#FF3A5C'} opacity="0.9"/>
      ))}
    </svg>
  )
}

// ── Donut winrate ────────────────────────────────────────────
function WinrateDonut({ wins, losses }: { wins:number; losses:number }) {
  const total = wins + losses
  if (!total) return <div style={{ width:80, height:80, borderRadius:'50%', border:'3px solid var(--bd)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:HUD, fontSize:8, color:'var(--tx3)' }}>—</div>
  const pct = Math.round((wins/total)*100)
  const r=34, cx=40, cy=40, circ=2*Math.PI*r
  const dash = (pct/100)*circ
  return (
    <div style={{ position:'relative', width:80, height:80 }}>
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#00FFB2" strokeWidth="8"
          strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={circ/4}
          strokeLinecap="round" style={{ transition:'stroke-dasharray .8s ease' }}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontFamily:HUD, fontSize:14, fontWeight:900, color:'#00FFB2', lineHeight:1 }}>{pct}%</div>
        <div style={{ fontFamily:HUD, fontSize:6, color:'var(--tx3)', letterSpacing:1 }}>WIN</div>
      </div>
    </div>
  )
}

// ── Bar chart par paire ──────────────────────────────────────
function PairChart({ trades }: { trades: Trade[] }) {
  const data: Record<string,{win:number;loss:number;pnl:number}> = {}
  trades.forEach(t => {
    if (!data[t.pair]) data[t.pair] = { win:0, loss:0, pnl:0 }
    if (t.result === 'WIN')  data[t.pair].win++
    if (t.result === 'LOSS') data[t.pair].loss++
    data[t.pair].pnl += t.pnl_amount ?? 0
  })
  const pairs = Object.entries(data).sort((a,b) => (b[1].win+b[1].loss)-(a[1].win+a[1].loss)).slice(0,6)
  if (!pairs.length) return <div style={{ fontFamily:BODY, fontSize:13, color:'var(--tx3)', padding:'1rem' }}>Aucune donnée</div>
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {pairs.map(([pair, d]) => {
        const total = d.win + d.loss || 1
        const wr = Math.round((d.win/total)*100)
        return (
          <div key={pair}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontFamily:HUD, fontSize:9, color:'var(--tx1)' }}>{pair}</span>
              <div style={{ display:'flex', gap:12 }}>
                <span style={{ fontFamily:HUD, fontSize:8, color:'var(--tx3)' }}>{d.win+d.loss} trades</span>
                <span style={{ fontFamily:HUD, fontSize:8, color:wr>=50?'#00FFB2':'#FF3A5C' }}>{wr}% WIN</span>
                <span style={{ fontFamily:HUD, fontSize:8, color:d.pnl>=0?'#00FFB2':'#FF3A5C' }}>{d.pnl>=0?'+':''}{fmt(d.pnl,0)} F</span>
              </div>
            </div>
            <div style={{ height:5, background:'rgba(255,255,255,0.05)', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${wr}%`, background:`linear-gradient(90deg, #00FFB2, #00D4FF)`, borderRadius:3, transition:'width .6s ease' }}/>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Formulaire ajout/édition ─────────────────────────────────
function TradeForm({ token, editing, onSave, onCancel }: { token:string; editing:Trade|null; onSave:()=>void; onCancel:()=>void }) {
  const [form, setForm] = useState({
    pair: editing?.pair || 'XAU/USD',
    direction: editing?.direction || 'LONG',
    entry: editing?.entry?.toString() || '',
    exit: editing?.exit?.toString() || '',
    stop_loss: editing?.stop_loss?.toString() || '',
    tp: editing?.tp?.toString() || '',
    lot_size: editing?.lot_size?.toString() || '0.01',
    result: editing?.result || '',
    pnl_pips: editing?.pnl_pips?.toString() || '',
    pnl_amount: editing?.pnl_amount?.toString() || '',
    emotion: editing?.emotion || 'NEUTRE',
    notes: editing?.notes || '',
    trade_date: editing?.trade_date ? new Date(editing.trade_date).toISOString().slice(0,16) : new Date().toISOString().slice(0,16),
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    const payload = { ...form, entry:Number(form.entry)||undefined, exit:Number(form.exit)||undefined, stop_loss:Number(form.stop_loss)||undefined, tp:Number(form.tp)||undefined, lot_size:Number(form.lot_size)||0.01, pnl_pips:Number(form.pnl_pips)||undefined, pnl_amount:Number(form.pnl_amount)||undefined, result:form.result||undefined, emotion:form.emotion||undefined }
    const method = editing ? 'PATCH' : 'POST'
    const body   = editing ? { id:editing.id, ...payload } : payload
    await fetch('/api/journal', { method, headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body:JSON.stringify(body) })
    setSaving(false); onSave()
  }

  const inp = { background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:5, padding:'9px 12px', color:'var(--tx0)', fontFamily:BODY, fontSize:13, width:'100%', boxSizing:'border-box' as const, outline:'none' }
  const lbl = { fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)', marginBottom:5, display:'block' as const }

  return (
    <div style={{ background:'var(--bg2)', border:'1px solid var(--bd2)', borderRadius:10, padding:'1.5rem', marginBottom:'1.5rem' }}>
      <div style={{ fontFamily:HUD, fontSize:10, color:'var(--ac)', letterSpacing:1, marginBottom:'1.25rem' }}>
        {editing ? '✏️ MODIFIER LE TRADE' : '+ NOUVEAU TRADE'}
      </div>

      {/* Ligne 1 : Paire + Direction + Date */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
        <div>
          <span style={lbl}>PAIRE</span>
          <select value={form.pair} onChange={e=>setForm(f=>({...f,pair:e.target.value}))} style={inp}>
            {PAIRS.map(p=><option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <span style={lbl}>DIRECTION</span>
          <div style={{ display:'flex', gap:6, height:38 }}>
            {(['LONG','SHORT'] as const).map(d=>(
              <button key={d} onClick={()=>setForm(f=>({...f,direction:d}))}
                style={{ flex:1, border:`1px solid ${form.direction===d?d==='LONG'?'rgba(0,255,178,0.4)':'rgba(255,58,92,0.4)':'var(--bd)'}`, borderRadius:5, background:form.direction===d?d==='LONG'?'rgba(0,255,178,0.1)':'rgba(255,58,92,0.1)':'transparent', color:form.direction===d?d==='LONG'?'#00FFB2':'#FF3A5C':'var(--tx3)', fontFamily:HUD, fontSize:9, cursor:'pointer' }}>
                {d==='LONG'?'▲ LONG':'▼ SHORT'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span style={lbl}>DATE & HEURE</span>
          <input type="datetime-local" value={form.trade_date} onChange={e=>setForm(f=>({...f,trade_date:e.target.value}))} style={inp} />
        </div>
      </div>

      {/* Ligne 2 : Prix */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:12 }}>
        <div><span style={lbl}>ENTRÉE</span><input type="number" value={form.entry} onChange={e=>setForm(f=>({...f,entry:e.target.value}))} placeholder="2318.50" style={inp}/></div>
        <div><span style={lbl}>SORTIE</span><input type="number" value={form.exit}  onChange={e=>setForm(f=>({...f,exit:e.target.value}))}  placeholder="2351.20" style={inp}/></div>
        <div><span style={lbl}>STOP LOSS</span><input type="number" value={form.stop_loss} onChange={e=>setForm(f=>({...f,stop_loss:e.target.value}))} placeholder="2302.00" style={inp}/></div>
        <div><span style={lbl}>LOT SIZE</span><input type="number" value={form.lot_size} onChange={e=>setForm(f=>({...f,lot_size:e.target.value}))} placeholder="0.01" style={inp}/></div>
      </div>

      {/* Ligne 3 : Résultat + P&L */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
        <div>
          <span style={lbl}>RÉSULTAT</span>
          <div style={{ display:'flex', gap:6 }}>
            {[{v:'WIN',c:'#00FFB2',e:'✅'},{v:'LOSS',c:'#FF3A5C',e:'❌'},{v:'BREAKEVEN',c:'#C9A84C',e:'⚖️'}].map(r=>(
              <button key={r.v} onClick={()=>setForm(f=>({...f,result:f.result===r.v?'':r.v}))}
                style={{ flex:1, padding:'8px 4px', border:`1px solid ${form.result===r.v?r.c+'60':'var(--bd)'}`, borderRadius:5, background:form.result===r.v?r.c+'12':'transparent', color:form.result===r.v?r.c:'var(--tx3)', fontFamily:HUD, fontSize:7, cursor:'pointer' }}>
                {r.e} {r.v}
              </button>
            ))}
          </div>
        </div>
        <div><span style={lbl}>PIPS</span><input type="number" value={form.pnl_pips} onChange={e=>setForm(f=>({...f,pnl_pips:e.target.value}))} placeholder="+32.5" style={inp}/></div>
        <div><span style={lbl}>P&L (FCFA)</span><input type="number" value={form.pnl_amount} onChange={e=>setForm(f=>({...f,pnl_amount:e.target.value}))} placeholder="+15000" style={inp}/></div>
      </div>

      {/* Ligne 4 : Émotion */}
      <div style={{ marginBottom:12 }}>
        <span style={lbl}>ÉTAT ÉMOTIONNEL</span>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {EMOTIONS.map(em=>(
            <button key={em} onClick={()=>setForm(f=>({...f,emotion:em}))}
              style={{ padding:'7px 14px', border:`1px solid ${form.emotion===em?EMO_COLOR[em]+'50':'var(--bd)'}`, borderRadius:20, background:form.emotion===em?EMO_COLOR[em]+'12':'transparent', color:form.emotion===em?EMO_COLOR[em]:'var(--tx3)', fontFamily:BODY, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:6, transition:'all .15s' }}>
              <span>{EMO_EMOJI[em]}</span> {em}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginBottom:'1.25rem' }}>
        <span style={lbl}>NOTES & LEÇONS</span>
        <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={3}
          placeholder="Pourquoi ce trade ? Qu'est-ce que j'aurais dû faire différemment ? Leçon apprise..."
          style={{ ...inp, resize:'vertical', lineHeight:1.6, fontFamily:BODY, fontSize:13 }}/>
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={save} disabled={saving||!form.entry}
          style={{ flex:1, background:saving||!form.entry?'var(--bd)':'var(--ac)', border:'none', borderRadius:7, padding:'12px', color:saving||!form.entry?'var(--tx3)':'#020408', fontFamily:HUD, fontSize:10, letterSpacing:2, fontWeight:700, cursor:saving?'wait':'pointer', transition:'all .2s' }}>
          {saving ? '⏳ ENREGISTREMENT...' : editing ? '✏️ MODIFIER' : '💾 ENREGISTRER LE TRADE'}
        </button>
        <button onClick={onCancel} style={{ background:'transparent', border:'1px solid var(--bd)', borderRadius:7, padding:'12px 20px', color:'var(--tx3)', fontFamily:HUD, fontSize:9, cursor:'pointer' }}>
          ANNULER
        </button>
      </div>
    </div>
  )
}

// ── Page principale ──────────────────────────────────────────
export default function JournalPage() {
  const [token,   setToken]   = useState('')
  const [user,    setUser]    = useState<{id:string;email?:string}|null>(null)
  const [profile, setProfile] = useState<Record<string,unknown>|null>(null)
  const [plan,    setPlan]    = useState('free')
  const [locale,  setLocale]  = useState('fr')

  // Dictionnaire i18n
  const T = {
    title:      locale === 'en' ? 'TRADING JOURNAL'     : T.title,
    trades:     locale === 'en' ? 'trades recorded'     : '{T.trades}',
    add:        locale === 'en' ? 'ADD A TRADE'         : T.add,
    export:     locale === 'en' ? 'EXPORT CSV'          : T.export,
    list:       locale === 'en' ? 'LIST'                : 'LISTE',
    stats:      locale === 'en' ? 'STATS'               : 'STATS',
    analysis:   locale === 'en' ? 'ANALYSIS'            : 'ANALYSE',
    wins:       locale === 'en' ? 'WINS'                : T.wins,
    losses:     locale === 'en' ? 'LOSSES'              : T.losses,
    winrate:    locale === 'en' ? T.winrate            : 'WIN RATE',
    streak:     locale === 'en' ? 'STREAK'              : T.streak,
    pnl:        locale === 'en' ? 'TOTAL P&L'           : 'P&L TOTAL',
    empty:      locale === 'en' ? 'No trades recorded. Rate your trades to earn credits!' : 'Aucun trade enregistré. Notez vos trades pour gagner des crédits !',
    allPairs:   locale === 'en' ? 'ALL PAIRS'           : 'TOUTES PAIRES',
    allResults: locale === 'en' ? 'ALL RESULTS'         : 'TOUS RÉSULTATS',
    date:       locale === 'en' ? 'DATE'                : 'DATE',
    pair:       locale === 'en' ? 'ASSET'               : 'PAIRE',
    direction:  locale === 'en' ? 'DIRECTION'           : 'DIRECTION',
    result:     locale === 'en' ? 'RESULT'              : 'RÉSULTAT',
    emotion:    locale === 'en' ? 'EMOTION'             : 'ÉMOTION',
    notes:      locale === 'en' ? 'NOTES'               : 'NOTES',
    edit:       locale === 'en' ? 'EDIT'                : 'MODIFIER',
    delete:     locale === 'en' ? 'DELETE'              : 'SUPPRIMER',
  }
  const [trades,  setTrades]  = useState<Trade[]>([])
  const [stats,   setStats]   = useState<Stats>({wins:0,losses:0,winrate:0,total_pnl:0})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState<Trade|null>(null)
  const [filter,   setFilter]   = useState({ pair:'', result:'', emotion:'', dir:'' })
  const [sortBy,   setSortBy]   = useState<'date'|'pnl'|'pair'>('date')
  const [tab,      setTab]      = useState<'list'|'stats'|'analyse'>('list')

  useEffect(() => {
    ;(async () => {
      const { data:{ session } } = await supabasePublic.auth.getSession()
      if (!session) { window.location.href='/auth/login'; return }
      setUser(session.user as {id:string;email?:string})
      setToken(session.access_token)
      const { data:p } = await supabasePublic.from('profiles').select('*').eq('id', session.user.id).single()
      if (p) { setProfile(p); setPlan(p.user_plan as string||'free'); setLocale(p.locale as string||'fr') }
    })()
  }, [])

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    const r = await fetch('/api/journal', { headers:{ Authorization:`Bearer ${token}` } })
    const j = await r.json()
    if (j.success) { setTrades(j.trades); setStats(j.stats) }
    setLoading(false)
  }, [token])

  useEffect(() => { load() }, [load])

  // Filtres + tri
  const filtered = trades.filter(t => {
    if (filter.pair && t.pair !== filter.pair) return false
    if (filter.result && t.result !== filter.result) return false
    if (filter.emotion && t.emotion !== filter.emotion) return false
    if (filter.dir && t.direction !== filter.dir) return false
    return true
  }).sort((a,b) => {
    if (sortBy === 'date') return new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime()
    if (sortBy === 'pnl')  return (b.pnl_amount??0) - (a.pnl_amount??0)
    if (sortBy === 'pair') return a.pair.localeCompare(b.pair)
    return 0
  })

  const exportCSV = () => {
    const headers = ['Date','Paire','Direction','Entrée','Sortie','Stop','Résultat','Pips','P&L','Émotion','Notes']
    const rows = trades.map(t => [fmtDate(t.trade_date), t.pair, t.direction, t.entry, t.exit??'', t.stop_loss??'', t.result??'', t.pnl_pips??'', t.pnl_amount??'', t.emotion??'', `"${(t.notes??'').replace(/"/g,"'")}"`])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = `journal-trading-${new Date().toISOString().slice(0,10)}.csv`; a.click()
  }

  const avgPnl = trades.filter(t=>t.pnl_amount).length ? Math.round(stats.total_pnl / trades.filter(t=>t.pnl_amount).length) : 0
  const bestTrade = trades.reduce((best, t) => (t.pnl_amount??-Infinity) > (best.pnl_amount??-Infinity) ? t : best, trades[0])
  const worstTrade = trades.reduce((worst, t) => (t.pnl_amount??Infinity) < (worst.pnl_amount??Infinity) ? t : worst, trades[0])
  const emotionStats = EMOTIONS.map(e => ({ e, count:trades.filter(t=>t.emotion===e).length, wins:trades.filter(t=>t.emotion===e&&t.result==='WIN').length })).filter(x=>x.count>0).sort((a,b)=>b.count-a.count)

  return (
    <div className="app-shell">
      <Sidebar tab="journal" setTab={()=>{}} plan={plan} locale={locale} />
      <div className="app-main" style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'var(--bg0)' }}>
        <TopBar locale={locale} profile={profile} />
        <QuotaBar token={token} locale={locale} plan={plan} />

        <div className="resp-pad" style={{ padding:'1.5rem', flex:1 }}>
          <div style={{ maxWidth:1100, margin:'0 auto' }}>

            {/* En-tête */}
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1.5rem', flexWrap:'wrap', gap:12 }}>
              <div>
                <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:3, color:'var(--ac2)', marginBottom:4 }}>MODULE</div>
                <h1 style={{ fontFamily:HUD, fontSize:22, fontWeight:900, color:'var(--tx0)', margin:0 }}>
                  {T.title.split(' ')[0]} <span style={{ color:'var(--ac2)' }}>{T.title.split(' ').slice(1).join(' ')}</span>
                </h1>
                <div style={{ fontFamily:BODY, fontSize:13, color:'var(--tx3)', marginTop:4 }}>{trades.length} trades enregistrés</div>
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <button onClick={exportCSV} style={{ display:'flex', alignItems:'center', gap:6, background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:6, padding:'8px 14px', cursor:'pointer', color:'var(--tx2)', fontFamily:HUD, fontSize:8, letterSpacing:1 }}>
                  <i className="ti ti-download" style={{ fontSize:13 }} /> {T.export}
                </button>
                <button onClick={()=>{ setEditing(null); setShowForm(v=>!v) }}
                  style={{ display:'flex', alignItems:'center', gap:6, background:showForm&&!editing?'var(--ac2)':'var(--bg1)', border:`1px solid ${showForm&&!editing?'var(--ac2)':'var(--bd)'}`, borderRadius:6, padding:'8px 14px', cursor:'pointer', color:showForm&&!editing?'#020408':'var(--ac2)', fontFamily:HUD, fontSize:9, letterSpacing:1, fontWeight:700 }}>
                  <i className="ti ti-plus" style={{ fontSize:13 }} /> NOUVEAU TRADE
                </button>
              </div>
            </div>

            {/* Formulaire */}
            {(showForm || editing) && (
              <TradeForm token={token} editing={editing} onSave={()=>{ setShowForm(false); setEditing(null); load() }} onCancel={()=>{ setShowForm(false); setEditing(null) }} />
            )}

            {/* KPI Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px,1fr))', gap:10, marginBottom:'1.5rem' }}>
              {[
                { l:'TRADES', v:String(trades.length), c:'var(--ac2)', icon:'ti-list' },
                { l:'WINRATE', v:`${stats.winrate}%`, c:stats.winrate>=50?'var(--ok)':'var(--red)', icon:'ti-target' },
                { l:'WINS', v:String(stats.wins), c:'var(--ok)', icon:'ti-trending-up' },
                { l:'LOSSES', v:String(stats.losses), c:'var(--red)', icon:'ti-trending-down' },
                { l:'P&L TOTAL', v:`${stats.total_pnl>=0?'+':''}${fmt(stats.total_pnl,0)} F`, c:stats.total_pnl>=0?'var(--ok)':'var(--red)', icon:'ti-coin' },
                { l:'P&L MOY.', v:`${avgPnl>=0?'+':''}${fmt(avgPnl,0)} F`, c:avgPnl>=0?'var(--ok)':'var(--red)', icon:'ti-chart-bar' },
              ].map(k => (
                <div key={k.l} style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:10, padding:'0.875rem 1rem', position:'relative', overflow:'hidden', textAlign:'center' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${k.c}, transparent)` }} />
                  <i className={`ti ${k.icon}`} style={{ fontSize:18, color:k.c, display:'block', marginBottom:6, opacity:0.8 }} />
                  <div style={{ fontFamily:HUD, fontSize:16, fontWeight:900, color:k.c, lineHeight:1, marginBottom:4 }}>{k.v}</div>
                  <div style={{ fontFamily:HUD, fontSize:6, letterSpacing:1, color:'var(--tx3)' }}>{k.l}</div>
                </div>
              ))}
            </div>

            {/* Onglets */}
            <div style={{ display:'flex', borderBottom:'1px solid var(--bd)', marginBottom:'1.5rem', gap:0 }}>
              {([['list','📋 TRADES'],['stats','📊 GRAPHIQUES'],['analyse','🔬 ANALYSE']] as const).map(([t,l])=>(
                <button key={t} onClick={()=>setTab(t)}
                  style={{ padding:'10px 20px', border:'none', borderBottom:`2px solid ${tab===t?'var(--ac2)':'transparent'}`, background:'transparent', color:tab===t?'var(--ac2)':'var(--tx3)', fontFamily:HUD, fontSize:9, letterSpacing:1, cursor:'pointer', transition:'all .2s' }}>
                  {l}
                </button>
              ))}
            </div>

            {/* ── TAB : LISTE ── */}
            {tab === 'list' && (
              <div>
                {/* Filtres */}
                <div style={{ display:'flex', gap:8, marginBottom:'1rem', flexWrap:'wrap' }}>
                  <select value={filter.pair} onChange={e=>setFilter(f=>({...f,pair:e.target.value}))}
                    style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:5, padding:'7px 10px', color:'var(--tx0)', fontFamily:HUD, fontSize:8, cursor:'pointer' }}>
                    <option value="">Toutes les paires</option>
                    {PAIRS.map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                  <select value={filter.result} onChange={e=>setFilter(f=>({...f,result:e.target.value}))}
                    style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:5, padding:'7px 10px', color:'var(--tx0)', fontFamily:HUD, fontSize:8, cursor:'pointer' }}>
                    <option value="">Tous résultats</option>
                    <option value="WIN">✅ WIN</option>
                    <option value="LOSS">❌ LOSS</option>
                    <option value="BREAKEVEN">⚖️ BREAKEVEN</option>
                  </select>
                  <select value={filter.dir} onChange={e=>setFilter(f=>({...f,dir:e.target.value}))}
                    style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:5, padding:'7px 10px', color:'var(--tx0)', fontFamily:HUD, fontSize:8, cursor:'pointer' }}>
                    <option value="">Direction</option>
                    <option value="LONG">▲ LONG</option>
                    <option value="SHORT">▼ SHORT</option>
                  </select>
                  <select value={sortBy} onChange={e=>setSortBy(e.target.value as 'date'|'pnl'|'pair')}
                    style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:5, padding:'7px 10px', color:'var(--tx0)', fontFamily:HUD, fontSize:8, cursor:'pointer', marginLeft:'auto' }}>
                    <option value="date">Tri : Date</option>
                    <option value="pnl">Tri : P&L</option>
                    <option value="pair">Tri : Paire</option>
                  </select>
                </div>

                {loading ? (
                  <div style={{ textAlign:'center', padding:'3rem', fontFamily:HUD, fontSize:9, color:'var(--tx3)', letterSpacing:2 }}>CHARGEMENT...</div>
                ) : filtered.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'4rem', background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:12 }}>
                    <i className="ti ti-notebook-off" style={{ fontSize:40, color:'var(--tx3)', display:'block', marginBottom:12 }} />
                    <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:1, color:'var(--tx3)', marginBottom:8 }}>AUCUN TRADE</div>
                    <div style={{ fontFamily:BODY, fontSize:13, color:'var(--tx3)' }}>Enregistrez votre premier trade pour commencer à tracker vos performances.</div>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {/* Header */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 80px 100px 90px 90px 80px 40px', gap:8, padding:'8px 14px', background:'var(--bg2)', borderRadius:8 }}>
                      {['PAIRE & DATE','DIR.','RÉS.','ENTRÉE','PIPS','P&L','ÉMOTION',''].map(h=>(
                        <span key={h} style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)' }}>{h}</span>
                      ))}
                    </div>
                    {filtered.map(t => (
                      <div key={t.id} style={{ display:'grid', gridTemplateColumns:'1fr 80px 80px 100px 90px 90px 80px 40px', gap:8, padding:'12px 14px', background:'var(--bg1)', border:`1px solid ${t.result==='WIN'?'rgba(0,230,118,0.15)':t.result==='LOSS'?'rgba(220,38,38,0.15)':'var(--bd)'}`, borderRadius:8, alignItems:'center', cursor:'pointer', transition:'transform .15s' }}
                        onClick={()=>{ setEditing(t); setShowForm(false); window.scrollTo({top:0,behavior:'smooth'}) }}
                        onMouseEnter={e=>(e.currentTarget as HTMLElement).style.transform='translateX(2px)'}
                        onMouseLeave={e=>(e.currentTarget as HTMLElement).style.transform='translateX(0)'}>
                        <div>
                          <div style={{ fontFamily:HUD, fontSize:10, color:'var(--tx0)', marginBottom:2 }}>{t.pair}</div>
                          <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)' }}>{fmtDate(t.trade_date)}</div>
                          {t.notes && <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.notes.slice(0,40)}{t.notes.length>40?'…':''}</div>}
                        </div>
                        <div style={{ fontFamily:HUD, fontSize:10, fontWeight:700, color:t.direction==='LONG'?'#00FFB2':'#FF3A5C' }}>{t.direction==='LONG'?'▲':'▼'} {t.direction}</div>
                        <div>
                          {t.result ? (
                            <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, padding:'3px 7px', borderRadius:3,
                              background:t.result==='WIN'?'rgba(0,230,118,0.1)':t.result==='LOSS'?'rgba(220,38,38,0.1)':'rgba(201,168,76,0.1)',
                              color:t.result==='WIN'?'#00E676':t.result==='LOSS'?'#FF3A5C':'#C9A84C' }}>
                              {t.result==='WIN'?'✅':t.result==='LOSS'?'❌':'⚖️'} {t.result}
                            </span>
                          ) : <span style={{ fontFamily:HUD, fontSize:7, color:'var(--tx3)' }}>EN COURS</span>}
                        </div>
                        <div style={{ fontFamily:HUD, fontSize:11, color:'var(--tx1)' }}>{fmt(t.entry,4)}</div>
                        <div style={{ fontFamily:HUD, fontSize:11, fontWeight:700, color:t.pnl_pips!=null?t.pnl_pips>=0?'#00FFB2':'#FF3A5C':'var(--tx3)' }}>
                          {t.pnl_pips!=null?`${t.pnl_pips>=0?'+':''}${fmt(t.pnl_pips,1)} pips`:'—'}
                        </div>
                        <div style={{ fontFamily:HUD, fontSize:11, fontWeight:700, color:t.pnl_amount!=null?t.pnl_amount>=0?'#00FFB2':'#FF3A5C':'var(--tx3)' }}>
                          {t.pnl_amount!=null?`${t.pnl_amount>=0?'+':''}${fmt(t.pnl_amount,0)} F`:'—'}
                        </div>
                        <div style={{ fontSize:18 }}>{t.emotion?EMO_EMOJI[t.emotion]??'':'—'}</div>
                        <button onClick={e=>{ e.stopPropagation(); fetch('/api/journal',{method:'DELETE',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({id:t.id})}).then(()=>load()) }}
                          style={{ background:'transparent', border:'none', color:'var(--tx3)', cursor:'pointer', fontSize:14, padding:0 }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB : GRAPHIQUES ── */}
            {tab === 'stats' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
                {/* Courbe P&L */}
                <div style={{ gridColumn:'1 / -1', background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.25rem' }}>
                  <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'var(--tx3)', marginBottom:'1rem' }}>COURBE P&L CUMULÉ (FCFA)</div>
                  <PnLChart trades={trades} />
                </div>

                {/* Winrate donut */}
                <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.25rem' }}>
                  <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'var(--tx3)', marginBottom:'1rem' }}>TAUX DE RÉUSSITE</div>
                  <div style={{ display:'flex', alignItems:'center', gap:24 }}>
                    <WinrateDonut wins={stats.wins} losses={stats.losses} />
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:'#00FFB2' }} />
                        <span style={{ fontFamily:BODY, fontSize:13, color:'var(--tx1)' }}>Wins : <strong style={{ color:'#00FFB2' }}>{stats.wins}</strong></span>
                      </div>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:'#FF3A5C' }} />
                        <span style={{ fontFamily:BODY, fontSize:13, color:'var(--tx1)' }}>Losses : <strong style={{ color:'#FF3A5C' }}>{stats.losses}</strong></span>
                      </div>
                      {bestTrade && bestTrade.pnl_amount && (
                        <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)' }}>
                          Meilleur : <strong style={{ color:'#00FFB2' }}>+{fmt(bestTrade.pnl_amount,0)} F</strong><br/>
                          <span style={{ fontSize:11 }}>{bestTrade.pair}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* P&L par paire */}
                <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.25rem' }}>
                  <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'var(--tx3)', marginBottom:'1rem' }}>PERFORMANCE PAR PAIRE</div>
                  <PairChart trades={trades} />
                </div>
              </div>
            )}

            {/* ── TAB : ANALYSE ── */}
            {tab === 'analyse' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>

                {/* Analyse émotionnelle */}
                <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.25rem' }}>
                  <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'var(--tx3)', marginBottom:'1rem' }}>PERFORMANCE PAR ÉTAT ÉMOTIONNEL</div>
                  {emotionStats.length === 0 ? (
                    <div style={{ fontFamily:BODY, fontSize:13, color:'var(--tx3)', padding:'1rem 0' }}>Renseignez vos émotions pour voir l'analyse.</div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      {emotionStats.map(({ e, count, wins }) => {
                        const wr = count ? Math.round((wins/count)*100) : 0
                        return (
                          <div key={e}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                              <span style={{ fontFamily:BODY, fontSize:13, color:'var(--tx1)' }}>{EMO_EMOJI[e]} {e}</span>
                              <div style={{ display:'flex', gap:12 }}>
                                <span style={{ fontFamily:HUD, fontSize:8, color:'var(--tx3)' }}>{count} trades</span>
                                <span style={{ fontFamily:HUD, fontSize:8, color:wr>=50?'#00FFB2':'#FF3A5C' }}>{wr}% WIN</span>
                              </div>
                            </div>
                            <div style={{ height:5, background:'rgba(255,255,255,0.05)', borderRadius:3 }}>
                              <div style={{ height:'100%', width:`${wr}%`, background:EMO_COLOR[e], borderRadius:3, opacity:0.8 }}/>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Trade le plus récent / meilleur / pire */}
                <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.25rem' }}>
                  <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'var(--tx3)', marginBottom:'1rem' }}>RECORDS</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {[
                      { l:'🏆 Meilleur trade',  t:bestTrade,  pos:true },
                      { l:'💀 Pire trade',       t:worstTrade, pos:false },
                    ].map(({ l, t, pos }) => t && t.pnl_amount != null && (
                      <div key={l} style={{ background:'var(--bg2)', border:`1px solid ${pos?'rgba(0,255,178,0.12)':'rgba(255,58,92,0.12)'}`, borderRadius:8, padding:'10px 14px' }}>
                        <div style={{ fontFamily:HUD, fontSize:8, color:'var(--tx3)', marginBottom:6 }}>{l}</div>
                        <div style={{ display:'flex', justifyContent:'space-between' }}>
                          <span style={{ fontFamily:HUD, fontSize:11, color:'var(--tx0)' }}>{t.pair} · {t.direction}</span>
                          <span style={{ fontFamily:HUD, fontSize:13, fontWeight:700, color:pos?'#00FFB2':'#FF3A5C' }}>
                            {t.pnl_amount>=0?'+':''}{fmt(t.pnl_amount,0)} F
                          </span>
                        </div>
                        <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)', marginTop:3 }}>{fmtDate(t.trade_date)}</div>
                      </div>
                    ))}

                    {/* Conseils IA basés sur les données */}
                    {trades.length >= 3 && (
                      <div style={{ background:'rgba(0,212,255,0.04)', border:'1px solid rgba(0,212,255,0.12)', borderRadius:8, padding:'10px 14px' }}>
                        <div style={{ fontFamily:HUD, fontSize:8, color:'#00D4FF', marginBottom:6 }}>💡 INSIGHT</div>
                        <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx2)', lineHeight:1.6 }}>
                          {stats.winrate >= 60
                            ? `Excellente performance ! Votre winrate de ${stats.winrate}% est au-dessus de la moyenne. Continuez à respecter votre plan de trading.`
                            : stats.winrate >= 45
                            ? `Winrate de ${stats.winrate}% — dans la norme. Vérifiez votre rapport R/R pour améliorer la rentabilité même avec moins de wins.`
                            : `Votre winrate de ${stats.winrate}% mérite attention. Révisez vos critères d'entrée et respectez strictement vos stops.`
                          }
                          {emotionStats.length > 0 && (() => {
                            const best = emotionStats.sort((a,b)=>(b.wins/b.count)-(a.wins/a.count))[0]
                            return ` Vous performez mieux en état ${EMO_EMOJI[best.e]} ${best.e}.`
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        <footer className="app-footer">
          <a href="/legal/cgu">CGU</a>
          <span style={{color:'var(--tx3)'}}>·</span>
          <a href="/support">Assistance</a>
        </footer>
      </div>
    </div>
  )
}
