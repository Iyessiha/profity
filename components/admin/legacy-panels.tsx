'use client'

// Panneaux admin restaurés depuis l'ancien dashboard (app/admin/dashboard, commit 6bad556).
// Ils appellent les routes /api/admin/* avec le token Supabase de la session.
import { Fragment, useState, useEffect } from 'react'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

const PLAN_C: Record<string, string> = { free:'#888', pro:'#00FFB2', elite:'#C9A84C' }

type ToastFn = (msg: string, ok: boolean) => void

// ─── Messagerie : notifications in-app + emails ─────────
export function BroadcastPanel({ token, showToast }: { token: string; showToast: ToastFn }) {
  const [bcTitle,  setBcTitle]  = useState('')
  const [bcBody,   setBcBody]   = useState('')
  const [bcPlans,  setBcPlans]  = useState<string[]>(['pro','elite'])
  const [bcLoading,setBcLoading]= useState(false)

  const sendBroadcast = async () => {
    if (!bcTitle || !bcBody) { showToast('Titre et message requis', false); return }
    setBcLoading(true)
    const res  = await fetch('/api/admin/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: bcTitle, body: bcBody, target_plans: bcPlans }),
    })
    const json = await res.json()
    showToast(json.success ? `✓ Envoyé à ${json.sent} utilisateurs` : json.error, json.success)
    if (json.success) { setBcTitle(''); setBcBody('') }
    setBcLoading(false)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Section 1 — Notifications IN-APP */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:10, overflow:'hidden' }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--bd)', display:'flex', alignItems:'center', gap:8 }}>
          <i className="ti ti-bell" style={{ color:'var(--ac2)', fontSize:16 }} />
          <span style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'var(--ac2)' }}>NOTIFICATIONS IN-APP</span>
          <span style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)', marginLeft:4 }}>— S&apos;affichent dans le dashboard des traders (clochette 🔔)</span>
        </div>
        <div style={{ padding:'16px', display:'grid', gridTemplateColumns:'1fr auto', gap:16, alignItems:'start' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <input value={bcTitle} onChange={e => setBcTitle(e.target.value)}
              placeholder="Titre (ex: NFP demain — préparez-vous)"
              style={{ width:'100%', padding:'10px 12px', background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:6, color:'var(--tx0)', fontFamily:BODY, fontSize:14, outline:'none' }}
            />
            <textarea value={bcBody} onChange={e => setBcBody(e.target.value)}
              placeholder="Message court pour les traders..."
              rows={3}
              style={{ width:'100%', padding:'10px 12px', background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:6, color:'var(--tx0)', fontFamily:BODY, fontSize:14, outline:'none', resize:'vertical' }}
            />
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)' }}>PLANS :</span>
              {['free','pro','elite'].map(p => (
                <button key={p} onClick={() => setBcPlans(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                  style={{ padding:'5px 12px', borderRadius:4, cursor:'pointer', fontFamily:HUD, fontSize:8, letterSpacing:1,
                    background: bcPlans.includes(p) ? `rgba(${p==='pro'?'0,255,178':p==='elite'?'201,168,76':'100,100,120'}, 0.12)` : 'transparent',
                    border: `1px solid ${bcPlans.includes(p) ? (PLAN_C[p] ?? '#888') + '60' : 'rgba(232,244,248,0.1)'}`,
                    color: bcPlans.includes(p) ? (PLAN_C[p] ?? '#888') : 'var(--tx3)',
                  }}>{p.toUpperCase()}</button>
              ))}
            </div>
          </div>
          <button onClick={sendBroadcast} disabled={bcLoading || !bcTitle || !bcBody}
            style={{ padding:'11px 20px', background:'var(--ac2)', border:'none', borderRadius:6,
              color:'#fff', fontFamily:HUD, fontSize:9, letterSpacing:1, cursor:'pointer',
              opacity:(bcLoading || !bcTitle || !bcBody) ? 0.5 : 1, whiteSpace:'nowrap' }}>
            {bcLoading ? 'ENVOI...' : '📣 ENVOYER'}
          </button>
        </div>
      </div>

      {/* Section 2 — Emails Brevo */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:10, overflow:'hidden' }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--bd)', display:'flex', alignItems:'center', gap:8 }}>
          <i className="ti ti-mail" style={{ color:'var(--ac)', fontSize:16 }} />
          <span style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'var(--ac)' }}>EMAILS BREVO</span>
          <span style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)', marginLeft:4 }}>— Envoi via noreply@profity-x.com</span>
        </div>
        <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>
          {/* Emails manquants users payants */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px', background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8 }}>
            <div>
              <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:1, color:'var(--ac3)', marginBottom:3 }}>🧾 EMAILS MANQUANTS — USERS PAYANTS</div>
              <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)' }}>Envoie plan activé + facture + conseils aux abonnés Pro/Elite</div>
            </div>
            <PendingEmailsButton token={token} showToast={showToast} />
          </div>
          {/* Relance inactifs */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px', background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:8 }}>
            <div>
              <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:1, color:'var(--tx0)', marginBottom:3 }}>📨 RELANCER LES INACTIFS</div>
              <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)' }}>Users avec 0 analyse depuis +24h → email de réactivation</div>
            </div>
            <ReactivateButton token={token} showToast={showToast} />
          </div>
          {/* Test email */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px', background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:8 }}>
            <div>
              <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:1, color:'var(--tx0)', marginBottom:3 }}>🧪 TESTER L&apos;EMAIL</div>
              <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)' }}>Envoie un email test à ton adresse admin — vérifie Brevo</div>
            </div>
            <TestEmailButton token={token} />
          </div>
        </div>
      </div>

    </div>
  )
}

export function LogsPanel({ token }: { token: string }) {
  const [logs, setLogs] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    // Fetch depuis Supabase directement
    import('@/lib/supabase').then(({ supabasePublic }) => {
      supabasePublic
        .from('admin_logs')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(100)
        .then(({ data }) => { if (data) setLogs(data as Record<string, unknown>[]) })
    })
  }, [token])

  const ACTION_COLORS: Record<string, string> = {
    upgrade: '#00FFB2', downgrade: '#888', toggle_admin: '#FF3A5C',
    reset_quota: '#00D4FF', delete: '#FF3A5C', broadcast: '#C9A84C',
  }

  return (
    <div style={{ background: '#06090F', border: '1px solid rgba(0,255,178,0.08)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', background: '#0A0F1A', borderBottom: '1px solid rgba(0,255,178,0.06)', fontFamily: HUD, fontSize: 9, letterSpacing: 2, color: 'rgba(232,244,248,0.3)' }}>
        AUDIT TRAIL — 100 DERNIÈRES ACTIONS
      </div>
      {logs.map((log, i) => {
        const profile = log.profiles as Record<string, string> | null
        const action  = String(log.action)
        return (
          <div key={String(log.id)} style={{
            display: 'grid', gridTemplateColumns: '140px 120px 1fr 160px',
            padding: '10px 16px', borderBottom: '1px solid rgba(0,255,178,0.04)',
            background: i % 2 === 0 ? 'transparent' : 'rgba(0,255,178,0.01)',
            alignItems: 'center',
          }}>
            <span style={{ fontFamily: HUD, fontSize: 9, color: ACTION_COLORS[action] ?? '#888', letterSpacing: 1 }}>{action.toUpperCase()}</span>
            <span style={{ fontFamily: BODY, fontSize: 12, color: 'rgba(232,244,248,0.4)' }}>{profile?.email ?? '—'}</span>
            <span style={{ fontFamily: BODY, fontSize: 12, color: 'rgba(232,244,248,0.5)' }}>
              {log.target_type ? `${log.target_type}: ${log.target_id}` : '—'}
            </span>
            <span style={{ fontFamily: BODY, fontSize: 11, color: 'rgba(232,244,248,0.25)', textAlign: 'right' }}>
              {new Date(String(log.created_at)).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
            </span>
          </div>
        )
      })}
      {logs.length === 0 && (
        <div style={{ padding: '3rem', textAlign: 'center', fontFamily: HUD, fontSize: 10, color: 'rgba(232,244,248,0.2)', letterSpacing: 3 }}>
          AUCUNE ACTION ENREGISTRÉE
        </div>
      )}
    </div>
  )
}

// ─── Diagnostic GeniusPay ─────────────────────────────────
function GeniusPayDiag({ token }: { token: string }) {
  const HUD  = "'Orbitron', monospace"
  const BODY = "'Rajdhani', sans-serif"
  const [result, setResult] = useState<Record<string,unknown>|null>(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/payment-test', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      setResult(json)
    } catch(e) {
      setResult({ status: '❌ Erreur réseau', error: String(e) })
    }
    setLoading(false)
  }

  const s = result?.geniuspay_test as Record<string,unknown>|undefined
  const httpOk = s?.http_ok === true
  const env = result?.env as Record<string,string>|undefined

  return (
    <div style={{ marginTop:'2rem', background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.25rem' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', flexWrap:'wrap', gap:10 }}>
        <div style={{ fontFamily:HUD, fontSize:11, color:'var(--ac)', letterSpacing:1 }}>⚡ DIAGNOSTIC GENIUSPAY</div>
        <button onClick={run} disabled={loading}
          style={{ fontFamily:HUD, fontSize:9, letterSpacing:1, background:loading?'var(--bd)':'var(--ac)', color:'#020408', border:'none', borderRadius:4, padding:'8px 18px', cursor:loading?'wait':'pointer', fontWeight:700 }}>
          {loading ? 'TEST EN COURS...' : '▶ TESTER LA CONNEXION'}
        </button>
      </div>

      {result && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {/* Statut global */}
          <div style={{ fontFamily:BODY, fontSize:15, color: httpOk?'var(--ok)':'var(--red)', fontWeight:700 }}>
            {String(result.status ?? '')}
          </div>

          {/* Variables d'environnement */}
          {!!env && (
            <div style={{ background:'var(--bg1)', borderRadius:6, padding:'0.875rem', display:'grid', gridTemplateColumns:'auto 1fr', gap:'6px 16px', alignItems:'center' }}>
              <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--tx3)', gridColumn:'1/-1', marginBottom:4 }}>VARIABLES D&apos;ENVIRONNEMENT</div>
              {Object.entries(env).map(([k,v]) => (
                <Fragment key={k}>
                  <span style={{ fontFamily:HUD, fontSize:8, color:'var(--tx3)' }}>{k}</span>
                  <span style={{ fontFamily:BODY, fontSize:13, color: v.startsWith('✅')?'var(--ok)':'var(--red)' }}>{v}</span>
                </Fragment>
              ))}
            </div>
          )}

          {/* Réponse GeniusPay */}
          {!!s && (
            <div style={{ background:'var(--bg1)', borderRadius:6, padding:'0.875rem' }}>
              <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--tx3)', marginBottom:8 }}>RÉPONSE GENIUSPAY</div>
              <div style={{ display:'flex', gap:10, marginBottom:8, flexWrap:'wrap' }}>
                <span style={{ fontFamily:HUD, fontSize:12, fontWeight:900, color: httpOk?'var(--ok)':'var(--red)' }}>HTTP {String(s.http_status)}</span>
                <span style={{ fontFamily:BODY, fontSize:12, color: httpOk?'var(--ok)':'var(--red)' }}>{httpOk?'✓ Succès':'✗ Échec'}</span>
              </div>
              <pre style={{ fontFamily:'monospace', fontSize:11, color:'var(--tx1)', background:'var(--bg2)', padding:'0.75rem', borderRadius:4, overflowX:'auto', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                {JSON.stringify(s.response, null, 2)}
              </pre>
            </div>
          )}

          {/* Instruction fix */}
          {!!result.fix && (
            <div style={{ background:'rgba(255,153,0,0.08)', border:'1px solid rgba(255,153,0,0.25)', borderRadius:6, padding:'0.875rem', fontFamily:BODY, fontSize:14, color:'var(--ora)', lineHeight:1.6 }}>
              💡 {String(result.fix)}
            </div>
          )}

          {/* URL checkout si OK */}
          {!!result.checkout_url && (
            <div style={{ background:'rgba(0,230,118,0.08)', border:'1px solid rgba(0,230,118,0.2)', borderRadius:6, padding:'0.875rem' }}>
              <div style={{ fontFamily:HUD, fontSize:8, color:'var(--ok)', marginBottom:4 }}>✅ CHECKOUT URL GÉNÉRÉE</div>
              <a href={String(result.checkout_url)} target="_blank" style={{ fontFamily:BODY, fontSize:12, color:'var(--ok)', wordBreak:'break-all' }}>{String(result.checkout_url)}</a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Trésorerie complète avec coûts Anthropic ──────────────
// ─────────────────────────────────────────────────────────
// TEST EMAIL BUTTON
// ─────────────────────────────────────────────────────────
function PendingEmailsButton({ token, showToast }: { token:string; showToast:(msg:string,ok:boolean)=>void }) {
  const [state, setState] = useState<'idle'|'loading'|'ok'|'err'>('idle')
  const HUD = "'Orbitron',monospace"
  const run = async () => {
    setState('loading')
    try {
      const res  = await fetch('/api/admin/send-pending-emails', { method:'POST', headers:{ Authorization:`Bearer ${token}` } })
      const data = await res.json()
      if (data.success) {
        setState('ok')
        const detail = data.results?.map((r: {email:string;emails_sent:string[]}) => `${r.email}: ${r.emails_sent.join(', ')}`).join(' | ')
        showToast(`✅ ${data.processed} user(s) — ${detail}`, true)
      } else { setState('err'); showToast(`❌ ${data.error}`, false) }
    } catch { setState('err'); showToast('❌ Erreur réseau', false) }
    setTimeout(() => setState('idle'), 8000)
  }
  return (
    <button onClick={run} disabled={state==='loading'} style={{
      fontFamily:HUD, fontSize:9, letterSpacing:1, cursor:'pointer', whiteSpace:'nowrap',
      background: state==='ok'?'rgba(0,255,178,0.12)':state==='err'?'rgba(255,58,92,0.12)':'rgba(201,168,76,0.15)',
      color: state==='ok'?'var(--ac)':state==='err'?'#FF3A5C':'var(--ac3)',
      border:`1px solid ${state==='ok'?'rgba(0,255,178,0.3)':state==='err'?'rgba(255,58,92,0.3)':'rgba(201,168,76,0.3)'}`,
      borderRadius:6, padding:'9px 18px',
    }}>
      {state==='loading'?'ENVOI...':state==='ok'?'✅ ENVOYÉ':state==='err'?'❌ ERR':'📧 ENVOYER'}
    </button>
  )
}

function ReactivateButton({ token, showToast }: { token:string; showToast:(msg:string,ok:boolean)=>void }) {
  const [state, setState] = useState<'idle'|'loading'|'ok'|'err'>('idle')
  const HUD = "'Orbitron',monospace"
  const run = async () => {
    setState('loading')
    try {
      const res  = await fetch('/api/admin/reactivate', { method:'POST', headers:{ Authorization:`Bearer ${token}` } })
      const data = await res.json()
      if (data.sent > 0) { setState('ok'); showToast(`✅ ${data.sent} email(s) envoyé(s)`, true) }
      else               { setState('ok'); showToast(`ℹ️ ${data.message ?? 'Aucun inactif'}`, true) }
    } catch { setState('err'); showToast('❌ Erreur réseau', false) }
    setTimeout(() => setState('idle'), 5000)
  }
  return (
    <button onClick={run} disabled={state==='loading'} style={{
      fontFamily:HUD, fontSize:9, letterSpacing:1, cursor:'pointer', whiteSpace:'nowrap',
      background: state==='ok'?'rgba(0,255,178,0.12)':state==='err'?'rgba(255,58,92,0.12)':'var(--ac3)',
      color: state==='ok'?'var(--ac)':state==='err'?'#FF3A5C':'#020408',
      border: state!=='idle'?`1px solid ${state==='ok'?'rgba(0,255,178,0.3)':'rgba(255,58,92,0.3)'}` :'none',
      borderRadius:6, padding:'9px 18px',
    }}>
      {state==='loading'?'ENVOI...':state==='ok'?'✅ FAIT':state==='err'?'❌ ERR':'📨 RELANCER'}
    </button>
  )
}

function TestEmailButton({ token }: { token: string }) {
  const [state, setState] = useState<'idle'|'loading'|'ok'|'err'>('idle')
  const [msg,   setMsg]   = useState('')
  const HUD = "'Orbitron',monospace"
  const test = async () => {
    setState('loading')
    try {
      const res  = await fetch('/api/admin/test-email', { method:'POST', headers:{ Authorization:`Bearer ${token}` } })
      const data = await res.json()
      if (data.success) { setState('ok');  setMsg(`✅ Email envoyé à ${data.sent_to}`) }
      else              { setState('err'); setMsg(`❌ ${data.error ?? 'Erreur'}`) }
    } catch { setState('err'); setMsg('❌ Erreur réseau') }
    setTimeout(() => setState('idle'), 6000)
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
      <button onClick={test} disabled={state === 'loading'} style={{
        fontFamily:HUD, fontSize:9, letterSpacing:1, cursor:'pointer',
        background: state === 'ok' ? 'rgba(0,255,178,0.15)' : state === 'err' ? 'rgba(255,58,92,0.15)' : 'var(--ac)',
        color: state === 'ok' ? 'var(--ac)' : state === 'err' ? '#FF3A5C' : '#020408',
        border: state !== 'idle' ? `1px solid ${state==='ok'?'rgba(0,255,178,0.3)':'rgba(255,58,92,0.3)'}` : 'none',
        borderRadius:6, padding:'10px 20px',
      }}>
        {state === 'loading' ? 'ENVOI...' : state === 'ok' ? '✅ ENVOYÉ' : state === 'err' ? '❌ ERREUR' : '📧 TESTER'}
      </button>
      {msg && <span style={{ fontFamily:HUD, fontSize:8, color: state === 'ok' ? 'var(--ac)' : '#FF3A5C' }}>{msg}</span>}
    </div>
  )
}

export function TreasuryPanel({ token }: { token: string }) {
  const HUD  = "'Orbitron', monospace"
  const BODY = "'Rajdhani', sans-serif"

  type TData = {
    users: { total:number; free:number; pro:number; elite:number; new_7d:number }
    revenue: { mrr_xof:number; arr_xof:number; active_subs:number; pack_sales:number }
    anthropic: {
      budget_usd:number; spent_usd:number; budget_pct:number; budget_status:string; budget_remaining:number;
      month_cost_usd:number; month_cost_xof:number; total_cost_usd:number; total_cost_xof:number;
      calls_month:number; calls_7d:number; total_calls:number; refunds:number;
      avg_cost_per_call:number; total_input_tokens:number; total_output_tokens:number;
      cost_by_plan:Record<string,{calls:number;cost_usd:number;cost_xof:number}>;
      daily_costs:Record<string,number>; data_source:string;
    }
    credits: { total_issued:number; total_consumed:number; outstanding:number }
    margin: { net_profit_xof:number; percent:number }
    per_plan: Record<string, { price:number; api_cost_xof:number; margin_xof:number; margin_pct:number }>
    constants: { xof_per_usd:number; anthropic_budget:number }
  }

  const [data, setData]       = useState<TData|null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const load = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/treasury', { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (!json.error) { setData(json); setLastRefresh(new Date()) }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const card = (label: string, value: string, sub: string, color: string, icon: string) => (
    <div key={label} style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.1rem', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, bottom:0, width:3, background:color }} />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)' }}>{label}</span>
        <i className={'ti '+icon} style={{ fontSize:15, color }} />
      </div>
      <div style={{ fontFamily:HUD, fontSize:18, fontWeight:900, color, lineHeight:1, marginBottom:4 }}>{value}</div>
      <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)' }}>{sub}</div>
    </div>
  )

  const fmt = (n: number) => n.toLocaleString('fr-FR')

  if (loading) return (
    <div style={{ textAlign:'center', padding:'4rem', fontFamily:HUD, fontSize:9, color:'var(--tx3)', letterSpacing:2 }}>
      CHARGEMENT TRÉSORERIE...
    </div>
  )

  if (!data) return <div style={{ color:'var(--red)', fontFamily:HUD, fontSize:10, padding:'2rem' }}>Erreur de chargement</div>

  const { users, revenue, anthropic, credits, margin, per_plan, constants } = data

  const payingUsers   = users.pro + users.elite
  const convRate      = users.total > 0 ? Math.round((payingUsers / users.total) * 100) : 0
  const arpu          = revenue.active_subs > 0 ? Math.round(revenue.mrr_xof / revenue.active_subs) : 0

  // Projections (estimations avec 50 Pro + 10 Elite)
  const proj50pro10elite = {
    mrr: 50 * 17500 + 10 * 35000,
    apiCost: Math.round((50 * 150 + 10 * 600) * 6.2),
    net: 50 * 17500 + 10 * 35000 - Math.round((50 * 150 + 10 * 600) * 6.2),
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
      {/* En-tête */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div style={{ fontFamily:HUD, fontSize:13, color:'var(--ac3)', letterSpacing:2 }}>💰 TRÉSORERIE & COÛTS ANTHROPIC</div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)' }}>
            {anthropic.data_source === 'real_tokens'
              ? '✅ Données réelles (token tracking)'
              : '⚠️ Estimation console ($0.80 saisi manuellement)'}
          </span>
          <button onClick={load} disabled={loading}
            style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, background:'var(--bg2)', border:'1px solid var(--bd)', color:'var(--ac)', borderRadius:4, padding:'6px 14px', cursor:'pointer' }}>
            ↻ ACTUALISER
          </button>
        </div>
      </div>

      {/* ── GAUGE BUDGET ANTHROPIC ───────────────────────────── */}
      <div style={{ background:'var(--bg2)', border:`1px solid ${anthropic.budget_status==='ok'?'var(--bd2)':anthropic.budget_status==='warning'?'rgba(255,153,0,0.35)':'rgba(220,38,38,0.4)'}`, borderRadius:12, padding:'1.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div>
            <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'var(--tx3)', marginBottom:6 }}>⚡ BUDGET ANTHROPIC API</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:12 }}>
              <span style={{ fontFamily:HUD, fontSize:32, fontWeight:900, lineHeight:1,
                color: anthropic.budget_status==='ok' ? 'var(--ok)' : anthropic.budget_status==='warning' ? 'var(--ora)' : 'var(--red)' }}>
                ${anthropic.spent_usd.toFixed(2)}
              </span>
              <span style={{ fontFamily:HUD, fontSize:14, color:'var(--tx3)' }}>/ ${anthropic.budget_usd} $</span>
            </div>
            <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)', marginTop:4 }}>
              {fmt(Math.round(anthropic.spent_usd * (constants?.xof_per_usd ?? 620)))} FCFA dépensés ce mois
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:HUD, fontSize:22, fontWeight:900,
              color: anthropic.budget_status==='ok' ? 'var(--ok)' : anthropic.budget_status==='warning' ? 'var(--ora)' : 'var(--red)' }}>
              {anthropic.budget_pct.toFixed(1)}%
            </div>
            <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)' }}>utilisé</div>
            <div style={{ fontFamily:HUD, fontSize:10, color:'var(--ok)', marginTop:4 }}>
              ${anthropic.budget_remaining} restants
            </div>
          </div>
        </div>
        {/* Barre budget */}
        <div style={{ height:10, background:'var(--bd)', borderRadius:5, overflow:'hidden' }}>
          <div style={{
            height:'100%',
            width:`${anthropic.budget_pct}%`,
            background: anthropic.budget_status==='ok'
              ? 'linear-gradient(90deg,#00FFB2,#00D4FF)'
              : anthropic.budget_status==='warning'
              ? 'linear-gradient(90deg,#FF9900,#FFB74D)'
              : 'linear-gradient(90deg,#FF4466,#FF6B6B)',
            borderRadius:5, transition:'width 1s ease',
          }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
          <span style={{ fontFamily:HUD, fontSize:7, color:'var(--tx3)' }}>$0</span>
          <span style={{ fontFamily:HUD, fontSize:7, color: anthropic.budget_status==='warning'?'var(--ora)':'var(--tx3)' }}>⚠️ $250</span>
          <span style={{ fontFamily:HUD, fontSize:7, color:'var(--red)' }}>🚨 $400</span>
          <span style={{ fontFamily:HUD, fontSize:7, color:'var(--tx3)' }}>${anthropic.budget_usd}</span>
        </div>
        {/* Métriques détaillées tokens */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginTop:14 }}>
          {[
            { l:'COÛT/APPEL',   v:`$${(anthropic.avg_cost_per_call??0).toFixed(4)}`, s:'Coût réel moyen/analyse' },
            { l:'APPELS/MOIS',  v:fmt(anthropic.calls_month),                         s:`${fmt(anthropic.calls_7d)} cette semaine` },
            { l:'TOKENS INPUT', v:fmt(anthropic.total_input_tokens??0),               s:'Total cumulé' },
            { l:'TOKENS OUTPUT',v:fmt(anthropic.total_output_tokens??0),              s:'Total cumulé' },
          ].map(m => (
            <div key={m.l} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--bd)', borderRadius:7, padding:'8px 10px', textAlign:'center' }}>
              <div style={{ fontFamily:HUD, fontSize:6, letterSpacing:1, color:'var(--tx3)', marginBottom:4 }}>{m.l}</div>
              <div style={{ fontFamily:HUD, fontSize:13, fontWeight:900, color:'var(--ora)' }}>{m.v}</div>
              <div style={{ fontFamily:BODY, fontSize:9, color:'var(--tx3)', marginTop:2 }}>{m.s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs revenus */}
      <div>
        <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'var(--tx3)', marginBottom:10 }}>📈 REVENUS</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10 }}>
          {card('MRR', `${fmt(revenue.mrr_xof)} FCFA`, 'Revenu mensuel récurrent', 'var(--ac)', 'ti-trending-up')}
          {card('ARR ESTIMÉ', `${fmt(revenue.arr_xof)} FCFA`, 'Revenu annuel projeté', 'var(--ac2)', 'ti-calendar-stats')}
          {card('ABONNEMENTS', String(revenue.active_subs), 'Comptes payants actifs', 'var(--ac3)', 'ti-crown')}
          {card('ARPU', arpu > 0 ? `${fmt(arpu)} FCFA` : '—', 'Revenu moyen/utilisateur', '#888', 'ti-user-dollar')}
        </div>
      </div>

      {/* Marge nette */}
      <div style={{ background:'var(--bg2)', border:`1px solid ${margin.percent >= 80?'var(--bd2)':margin.percent >= 50?'rgba(255,153,0,0.3)':'rgba(220,38,38,0.3)'}`, borderRadius:10, padding:'1.25rem' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'var(--tx3)', marginBottom:8 }}>📊 MARGE NETTE CE MOIS</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:12, flexWrap:'wrap' }}>
              <span style={{ fontFamily:HUD, fontSize:28, fontWeight:900, color: margin.net_profit_xof >= 0 ? 'var(--ok)' : 'var(--red)', lineHeight:1 }}>
                {margin.net_profit_xof >= 0 ? '+' : ''}{fmt(margin.net_profit_xof)} FCFA
              </span>
              <span style={{ fontFamily:HUD, fontSize:16, color: margin.percent >= 80 ? 'var(--ok)' : margin.percent >= 50 ? 'var(--ora)' : 'var(--red)' }}>
                {margin.percent}%
              </span>
            </div>
            <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)', marginTop:6 }}>
              {fmt(revenue.mrr_xof)} FCFA revenus — {fmt(anthropic.month_cost_xof)} FCFA coûts API
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--tx3)', marginBottom:4 }}>COÛT TOTAL PAR USER</div>
            <div style={{ fontFamily:HUD, fontSize:18, color:'var(--ora)' }}>
              {users.total > 0 ? `${(anthropic.month_cost_xof / users.total).toFixed(0)} FCFA` : '—'}
            </div>
            <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)' }}>par utilisateur ce mois</div>
          </div>
        </div>

        {/* Barre marge */}
        <div style={{ marginTop:14, height:8, background:'var(--bd)', borderRadius:4, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${Math.max(0, Math.min(100, margin.percent))}%`, background: margin.percent >= 80 ? 'var(--ok)' : margin.percent >= 50 ? 'var(--ora)' : 'var(--red)', borderRadius:4, transition:'width 1s' }} />
        </div>
      </div>

      {/* Économie par plan */}
      <div>
        <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'var(--tx3)', marginBottom:10 }}>💎 ÉCONOMIE PAR PLAN (coût API max si tous crédits utilisés)</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:10 }}>
          {[
            { key:'free',  label:'FREE',  color:'#888',        users:users.free },
            { key:'pro',   label:'PRO',   color:'var(--ac)',   users:users.pro  },
            { key:'elite', label:'ELITE', color:'var(--ac3)',  users:users.elite },
          ].map(({ key, label, color, users: count }) => {
            const p = per_plan[key]
            if (!p) return null
            return (
              <div key={key} style={{ background:'var(--bg2)', border:`1px solid color-mix(in srgb, ${color} 20%, var(--bd))`, borderRadius:10, padding:'1.1rem' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <span style={{ fontFamily:HUD, fontSize:10, letterSpacing:1, color, fontWeight:900 }}>{label}</span>
                  <span style={{ fontFamily:HUD, fontSize:8, color:'var(--tx3)' }}>{count} users</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)' }}>Prix</span>
                    <span style={{ fontFamily:HUD, fontSize:10, color:'var(--tx0)' }}>{p.price > 0 ? `${fmt(p.price)} FCFA` : 'Gratuit'}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)' }}>Coût API max</span>
                    <span style={{ fontFamily:HUD, fontSize:10, color:'var(--red)' }}>−{fmt(p.api_cost_xof)} FCFA</span>
                  </div>
                  <div style={{ height:1, background:'var(--bd)', margin:'2px 0' }} />
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)' }}>Marge nette</span>
                    <span style={{ fontFamily:HUD, fontSize:11, fontWeight:900, color: p.margin_xof >= 0 ? 'var(--ok)' : 'var(--red)' }}>
                      {p.margin_xof >= 0 ? '+' : ''}{fmt(p.margin_xof)} FCFA
                    </span>
                  </div>
                  <div style={{ height:5, background:'var(--bd)', borderRadius:3, overflow:'hidden', marginTop:4 }}>
                    <div style={{ height:'100%', width:`${Math.max(0,p.margin_pct)}%`, background: p.margin_pct >= 80 ? 'var(--ok)' : 'var(--ora)', borderRadius:3 }} />
                  </div>
                  <div style={{ textAlign:'right', fontFamily:HUD, fontSize:9, color: p.margin_pct >= 80 ? 'var(--ok)' : 'var(--ora)' }}>
                    {p.margin_pct > 0 ? `${p.margin_pct}% de marge` : 'Coût acquisition'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Crédits & utilisateurs */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {/* Crédits */}
        <div style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.1rem' }}>
          <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'var(--tx3)', marginBottom:12 }}>🪙 CRÉDITS</div>
          {[
            { l:'Émis au total',   v: fmt(credits.total_issued),   c:'var(--ac)' },
            { l:'Consommés',       v: fmt(credits.total_consumed), c:'var(--ora)' },
            { l:'Soldes restants', v: fmt(credits.outstanding),    c:'var(--ac2)' },
            { l:'Packs vendus',    v: String(revenue.pack_sales),  c:'var(--ac3)' },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)' }}>{l}</span>
              <span style={{ fontFamily:HUD, fontSize:10, color:c }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Utilisateurs */}
        <div style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.1rem' }}>
          <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'var(--tx3)', marginBottom:12 }}>👥 UTILISATEURS</div>
          {[
            { l:'Free',           v: `${users.free}`,        c:'#888' },
            { l:'Pro',            v: `${users.pro}`,         c:'var(--ac)' },
            { l:'Elite',          v: `${users.elite}`,       c:'var(--ac3)' },
            { l:'Taux conversion',v: `${convRate}%`,         c:'var(--ac2)' },
            { l:'Nouveaux 7j',    v: `+${users.new_7d}`,     c:'var(--ok)' },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)' }}>{l}</span>
              <span style={{ fontFamily:HUD, fontSize:10, color:c }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Projection */}
      <div style={{ background:'color-mix(in srgb, var(--ac) 4%, transparent)', border:'1px solid color-mix(in srgb, var(--ac) 20%, transparent)', borderRadius:10, padding:'1.25rem' }}>
        <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'var(--ac)', marginBottom:12 }}>🚀 PROJECTION — 50 PRO + 10 ELITE</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10 }}>
          {[
            { l:'MRR projeté',   v:`${fmt(proj50pro10elite.mrr)} FCFA`,     c:'var(--ac)' },
            { l:'Coût API/mois', v:`${fmt(proj50pro10elite.apiCost)} FCFA`, c:'var(--ora)' },
            { l:'Profit net',    v:`${fmt(proj50pro10elite.net)} FCFA`,     c:'var(--ok)' },
            { l:'Marge nette',   v:`${Math.round((1 - proj50pro10elite.apiCost/proj50pro10elite.mrr)*100)}%`, c:'var(--ok)' },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ background:'var(--bg1)', borderRadius:8, padding:'0.875rem' }}>
              <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:1, color:'var(--tx3)', marginBottom:4 }}>{l}</div>
              <div style={{ fontFamily:HUD, fontSize:15, fontWeight:900, color:c }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)', marginTop:10 }}>
          * Coût Anthropic 0,01 $/appel (6,2 FCFA). Pro = 150 crédits max/mois. Elite = 600 crédits max/mois.
        </div>
      </div>

      {/* Diagnostic GeniusPay */}
      <GeniusPayDiag token={token} />
    </div>
  )
}

// ─── Panneau Export ────────────────────────────────────────
export function ExportPanel({ token }: { token: string }) {
  const HUD  = "'Orbitron', monospace"
  const BODY = "'Rajdhani', sans-serif"

  const [loading, setLoading] = useState<string | null>(null)
  const [lastExport, setLastExport] = useState<Record<string, string>>({})

  const download = async (type: string, format: 'csv' | 'json') => {
    const key = `${type}_${format}`
    setLoading(key)
    try {
      const res = await fetch(`/api/admin/export?type=${type}&format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) { alert('Erreur export'); setLoading(null); return }

      const blob     = await res.blob()
      const ext      = format === 'json' ? 'json' : 'csv'
      const filename = `profityx_${type}_${new Date().toISOString().slice(0,10)}.${ext}`
      const url      = URL.createObjectURL(blob)
      const a        = document.createElement('a')
      a.href = url; a.download = filename; a.click()
      URL.revokeObjectURL(url)
      setLastExport(prev => ({ ...prev, [key]: new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }) }))
    } catch { alert('Erreur réseau') }
    setLoading(null)
  }

  const EXPORTS = [
    {
      type: 'users',
      label: 'Utilisateurs',
      icon: 'ti-users',
      color: 'var(--ac)',
      desc: 'Profils complets : email, plan, streak, analyses, pays, broker, préférences',
      fields: ['public_id', 'email', 'plan', 'analyses_used', 'streak', 'xp', 'pays', 'inscription'],
    },
    {
      type: 'subscriptions',
      label: 'Abonnements',
      icon: 'ti-credit-card',
      color: 'var(--ac2)',
      desc: 'Tous les abonnements avec statut, montant, dates de période et référence paiement',
      fields: ['email', 'plan', 'statut', 'montant_fcfa', 'ref_paiement', 'debut', 'fin'],
    },
    {
      type: 'credits',
      label: 'Transactions crédits',
      icon: 'ti-coin',
      color: 'var(--ac3)',
      desc: 'Historique complet des mouvements de crédits avec coût Anthropic calculé',
      fields: ['email', 'montant', 'type', 'description', 'cout_usd', 'cout_fcfa', 'date'],
    },
    {
      type: 'analyses',
      label: 'Analyses charts',
      icon: 'ti-chart-candle',
      color: 'var(--ok)',
      desc: 'Toutes les analyses IA : paire, timeframe, direction, entrée, SL, TP, R/R',
      fields: ['email', 'paire', 'timeframe', 'direction', 'entree', 'sl', 'tp1', 'tp2', 'tp3'],
    },
    {
      type: 'treasury',
      label: 'Rapport trésorerie',
      icon: 'ti-report-money',
      color: 'var(--ora)',
      desc: 'Snapshot financier : MRR, ARR, coûts Anthropic réels, marge nette, crédits',
      fields: ['mrr_fcfa', 'arr_fcfa', 'coût_anthropic_usd', 'marge_nette_fcfa', 'appels_api'],
    },
  ]

  return (
    <div>
      <div style={{ fontFamily:HUD, fontSize:13, color:'var(--ac)', letterSpacing:2, marginBottom:'0.5rem' }}>
        📥 EXPORT DES DONNÉES
      </div>
      <div style={{ fontFamily:BODY, fontSize:13, color:'var(--tx3)', marginBottom:'1.5rem' }}>
        Téléchargez les données en CSV (Excel) ou JSON. Fichiers horodatés, encodés UTF-8.
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {EXPORTS.map(exp => (
          <div key={exp.type} style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.1rem', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            {/* Icône */}
            <div style={{ width:44, height:44, borderRadius:9, background:`color-mix(in srgb, ${exp.color} 10%, transparent)`, border:`1px solid color-mix(in srgb, ${exp.color} 20%, transparent)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <i className={'ti '+exp.icon} style={{ fontSize:20, color:exp.color }} />
            </div>

            {/* Info */}
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ fontFamily:HUD, fontSize:10, color:'var(--tx0)', letterSpacing:0.5, marginBottom:3 }}>{exp.label}</div>
              <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)', lineHeight:1.4, marginBottom:5 }}>{exp.desc}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {exp.fields.map(f => (
                  <span key={f} style={{ fontFamily:HUD, fontSize:7, letterSpacing:0.5, color:'var(--tx3)', background:'var(--bg3)', border:'1px solid var(--bd)', borderRadius:3, padding:'2px 6px' }}>{f}</span>
                ))}
              </div>
            </div>

            {/* Boutons */}
            <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end', flexShrink:0 }}>
              <div style={{ display:'flex', gap:8 }}>
                <button
                  onClick={() => download(exp.type, 'csv')}
                  disabled={loading === `${exp.type}_csv`}
                  style={{ display:'flex', alignItems:'center', gap:6, background:'var(--ac)', color:'#020408', border:'none', borderRadius:5, padding:'8px 14px', fontFamily:HUD, fontSize:8, letterSpacing:1, fontWeight:700, cursor:'pointer', opacity: loading === `${exp.type}_csv` ? 0.6 : 1 }}>
                  <i className="ti ti-file-spreadsheet" style={{ fontSize:13 }} />
                  {loading === `${exp.type}_csv` ? 'Export...' : 'CSV'}
                </button>
                <button
                  onClick={() => download(exp.type, 'json')}
                  disabled={loading === `${exp.type}_json`}
                  style={{ display:'flex', alignItems:'center', gap:6, background:'transparent', color:'var(--ac2)', border:'1px solid var(--bd2)', borderRadius:5, padding:'8px 14px', fontFamily:HUD, fontSize:8, letterSpacing:1, cursor:'pointer', opacity: loading === `${exp.type}_json` ? 0.6 : 1 }}>
                  <i className="ti ti-code" style={{ fontSize:13 }} />
                  {loading === `${exp.type}_json` ? 'Export...' : 'JSON'}
                </button>
              </div>
              {(lastExport[`${exp.type}_csv`] || lastExport[`${exp.type}_json`]) && (
                <div style={{ fontFamily:BODY, fontSize:10, color:'var(--ok)' }}>
                  ✓ Exporté à {lastExport[`${exp.type}_csv`] || lastExport[`${exp.type}_json`]}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <div style={{ marginTop:'1.25rem', background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:8, padding:'0.875rem', display:'flex', gap:10, alignItems:'flex-start' }}>
        <i className="ti ti-shield-lock" style={{ fontSize:16, color:'var(--ac)', flexShrink:0, marginTop:2 }} />
        <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)', lineHeight:1.6 }}>
          Les exports sont réservés aux administrateurs. Les données sensibles (mots de passe, tokens) ne sont jamais incluses. Fichiers conformes RGPD — traitez-les avec précaution.
        </div>
      </div>
    </div>
  )
}

// ─── Test Email Panel ──────────────────────────────────────

export function SignalsPanel({ token, showToast }: { token:string; showToast:(m:string,ok:boolean)=>void }) {
  const HUD='\'Orbitron\',monospace', BODY='\'Rajdhani\',sans-serif'
  const [signals, setSignals] = useState<Array<{id:string;pair:string;direction:string;entry:number;rr_ratio:number;trade_result:string|null;confidence:string;created_at:string;user_email:string}>>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<'pending'|'all'>('pending')
  const [rating,  setRating]  = useState<Record<string,string>>({})

  const load = async () => {
    setLoading(true)
    const res  = await fetch(`/api/admin/signals?filter=${filter}`, { headers:{ Authorization:`Bearer ${token}` } })
    const data = await res.json()
    setSignals(data.signals ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [filter])

  const rate = async (id: string, result: string) => {
    setRating(r => ({ ...r, [id]: 'loading' }))
    const res = await fetch('/api/admin/signals/rate', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify({ signal_id: id, result }),
    })
    const data = await res.json()
    if (data.success) {
      showToast(`✅ Signal noté ${result}`, true)
      setSignals(s => s.filter(x => x.id !== id))
    } else {
      showToast(`❌ ${data.error}`, false)
    }
    setRating(r => { const n={...r}; delete n[id]; return n })
  }

  const dirColor = (d:string) => d?.includes('LONG') || d?.includes('BUY') ? '#00FFB2' : '#FF3A5C'

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div style={{ fontFamily:HUD, fontSize:11, letterSpacing:2, color:'var(--ac)' }}>📊 NOTATION DES SIGNAUX</div>
        <div style={{ display:'flex', gap:8 }}>
          {(['pending','all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              fontFamily:HUD, fontSize:8, letterSpacing:1, cursor:'pointer',
              background: filter===f ? 'rgba(0,255,178,0.1)' : 'transparent',
              border:`1px solid ${filter===f?'rgba(0,255,178,0.3)':'var(--bd)'}`,
              color: filter===f ? 'var(--ac)' : 'var(--tx3)',
              borderRadius:4, padding:'7px 14px',
            }}>
              {f === 'pending' ? '⏳ EN ATTENTE' : '📋 TOUS'}
            </button>
          ))}
          <button onClick={load} style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, background:'var(--bg2)', border:'1px solid var(--bd)', color:'var(--ac)', borderRadius:4, padding:'7px 14px', cursor:'pointer' }}>↻</button>
        </div>
      </div>

      {loading && <div style={{ textAlign:'center', padding:'2rem', fontFamily:HUD, fontSize:8, color:'var(--tx3)', letterSpacing:2 }}>CHARGEMENT...</div>}
      {!loading && signals.length === 0 && (
        <div style={{ textAlign:'center', padding:'3rem', background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:10 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>✅</div>
          <div style={{ fontFamily:HUD, fontSize:9, color:'var(--tx3)', letterSpacing:2 }}>
            {filter === 'pending' ? 'TOUS LES SIGNAUX SONT NOTÉS' : 'AUCUN SIGNAL'}
          </div>
        </div>
      )}

      {!loading && signals.map(s => (
        <div key={s.id} style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:10, padding:'1rem' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
              <div>
                <div style={{ fontFamily:HUD, fontSize:12, color:'var(--tx0)' }}>{s.pair}</div>
                <div style={{ fontFamily:HUD, fontSize:9, color:dirColor(s.direction), marginTop:2 }}>{s.direction}</div>
              </div>
              <div>
                <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:12, color:'var(--tx2)' }}>Entrée : <strong style={{color:'var(--tx0)'}}>{s.entry}</strong></div>
                <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:11, color:'var(--tx3)' }}>R/R 1:{s.rr_ratio} · {s.confidence}</div>
              </div>
              <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:11, color:'var(--tx3)' }}>
                {new Date(s.created_at).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
                {s.user_email && <div style={{color:'var(--tx3)',fontSize:10}}>{s.user_email}</div>}
              </div>
              {s.trade_result && (
                <span style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, padding:'3px 10px', borderRadius:20,
                  background: s.trade_result==='WIN'?'rgba(0,255,178,0.1)':'rgba(255,58,92,0.1)',
                  color: s.trade_result==='WIN'?'var(--ac)':'#FF3A5C',
                  border:`1px solid ${s.trade_result==='WIN'?'rgba(0,255,178,0.3)':'rgba(255,58,92,0.3)'}`,
                }}>{s.trade_result}</span>
              )}
            </div>
            {!s.trade_result && (
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => rate(s.id, 'WIN')} disabled={!!rating[s.id]} style={{
                  fontFamily:HUD, fontSize:9, letterSpacing:1, cursor:'pointer', padding:'8px 18px', borderRadius:6,
                  background:'rgba(0,255,178,0.1)', border:'1px solid rgba(0,255,178,0.3)', color:'var(--ac)',
                }}>✅ WIN</button>
                <button onClick={() => rate(s.id, 'LOSS')} disabled={!!rating[s.id]} style={{
                  fontFamily:HUD, fontSize:9, letterSpacing:1, cursor:'pointer', padding:'8px 18px', borderRadius:6,
                  background:'rgba(255,58,92,0.08)', border:'1px solid rgba(255,58,92,0.25)', color:'#FF3A5C',
                }}>📉 LOSS</button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// PANEL : FACTURES ADMIN
// ─────────────────────────────────────────────────────────
export function InvoicesAdminPanel({ token, showToast }: { token:string; showToast:(m:string,ok:boolean)=>void }) {
  const HUD='\'Orbitron\',monospace', BODY='\'Rajdhani\',sans-serif'
  const [invoices, setInvoices] = useState<Array<{id:string;invoice_number:string;client_name:string;client_email:string;plan:string;amount_xof:number;amount_usd:number;payment_method:string;status:string;token:string;created_at:string}>>([])
  const [loading, setLoading] = useState(true)
  const [resending, setResending] = useState<string>('')

  useEffect(() => {
    fetch('/api/admin/invoices', { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json()).then(d => { setInvoices(d.invoices ?? []); setLoading(false) })
  }, [])

  const resend = async (inv: typeof invoices[0]) => {
    setResending(inv.id)
    const res = await fetch('/api/admin/invoices/resend', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify({ invoice_id: inv.id }),
    })
    const data = await res.json()
    showToast(data.success ? `✅ Facture renvoyée à ${inv.client_email}` : `❌ ${data.error}`, data.success)
    setResending('')
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontFamily:HUD, fontSize:11, letterSpacing:2, color:'var(--ac)' }}>🧾 TOUTES LES FACTURES</div>
        <div style={{ fontFamily:BODY, fontSize:13, color:'var(--tx3)' }}>{invoices.length} facture(s)</div>
      </div>

      {loading && <div style={{ textAlign:'center', padding:'2rem', fontFamily:HUD, fontSize:8, color:'var(--tx3)', letterSpacing:2 }}>CHARGEMENT...</div>}

      {!loading && invoices.length === 0 && (
        <div style={{ textAlign:'center', padding:'3rem', background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:10 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🧾</div>
          <div style={{ fontFamily:HUD, fontSize:9, color:'var(--tx3)', letterSpacing:2 }}>AUCUNE FACTURE</div>
        </div>
      )}

      {!loading && invoices.map(inv => (
        <div key={inv.id} style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:10, padding:'1rem' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap', alignItems:'center' }}>
              <div>
                <div style={{ fontFamily:HUD, fontSize:10, color:'var(--ac)', letterSpacing:1 }}>{inv.invoice_number}</div>
                <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx2)', marginTop:2 }}>{inv.client_name}</div>
                <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)' }}>{inv.client_email}</div>
              </div>
              <div>
                <div style={{ fontFamily:HUD, fontSize:14, fontWeight:900, color:'var(--ac)' }}>{inv.amount_xof.toLocaleString('fr-FR')} FCFA</div>
                <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)' }}>${inv.amount_usd} · {inv.payment_method}</div>
              </div>
              <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)' }}>
                {new Date(inv.created_at).toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'})}
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <a href={`/invoice/${inv.token}`} target="_blank" rel="noopener" style={{
                fontFamily:HUD, fontSize:8, letterSpacing:1, padding:'8px 14px', borderRadius:6,
                background:'rgba(0,255,178,0.08)', border:'1px solid rgba(0,255,178,0.2)', color:'var(--ac)',
                textDecoration:'none',
              }}>⬇ PDF</a>
              <button onClick={() => resend(inv)} disabled={resending===inv.id} style={{
                fontFamily:HUD, fontSize:8, letterSpacing:1, cursor:'pointer', padding:'8px 14px', borderRadius:6,
                background:'rgba(0,212,255,0.08)', border:'1px solid rgba(0,212,255,0.2)', color:'var(--ac2)',
              }}>{resending===inv.id ? 'ENVOI...' : '📧 RENVOYER'}</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// PANEL : CRÉDITS MANUELS
// ─────────────────────────────────────────────────────────
export function CreditsAdminPanel({ token, showToast }: { token:string; showToast:(m:string,ok:boolean)=>void }) {
  const HUD='\'Orbitron\',monospace', BODY='\'Rajdhani\',sans-serif'
  const [email,  setEmail]  = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [type,   setType]   = useState<'add'|'remove'>('add')
  const [loading,setLoading]= useState(false)
  const [history,setHistory]= useState<Array<{user_email:string;amount:number;type:string;description:string;created_at:string}>>([])

  useEffect(() => {
    fetch('/api/admin/credits/history', { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json()).then(d => setHistory(d.history ?? []))
  }, [])

  const submit = async () => {
    if (!email || !amount || !reason) { showToast('Tous les champs sont requis', false); return }
    setLoading(true)
    const res = await fetch('/api/admin/credits/adjust', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify({ email, amount: type === 'add' ? Number(amount) : -Number(amount), reason }),
    })
    const data = await res.json()
    if (data.success) {
      showToast(`✅ ${type === 'add' ? '+' : '-'}${amount} crédits → ${email}`, true)
      setEmail(''); setAmount(''); setReason('')
      setHistory(h => [{ user_email:email, amount:type==='add'?Number(amount):-Number(amount), type:'admin_adjust', description:reason, created_at:new Date().toISOString() }, ...h])
    } else { showToast(`❌ ${data.error}`, false) }
    setLoading(false)
  }

  const inp = { background:'var(--bg1)', border:'1px solid var(--bd)', color:'var(--tx0)', fontFamily:BODY, fontSize:14, padding:'10px 12px', borderRadius:6, outline:'none', width:'100%' }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.5rem' }}>
        <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:2, color:'var(--ac)', marginBottom:20 }}>🪙 AJUSTER LES CRÉDITS</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
          <div>
            <label style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'var(--tx3)', display:'block', marginBottom:6 }}>EMAIL UTILISATEUR</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="trader@gmail.com" style={inp} />
          </div>
          <div>
            <label style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'var(--tx3)', display:'block', marginBottom:6 }}>MONTANT</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="50" style={inp} />
          </div>
        </div>
        <div style={{ marginBottom:12 }}>
          <label style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'var(--tx3)', display:'block', marginBottom:6 }}>RAISON</label>
          <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Compensation, bonus, erreur..." style={inp} />
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {(['add','remove'] as const).map(t => (
            <button key={t} onClick={() => setType(t)} style={{
              fontFamily:HUD, fontSize:9, letterSpacing:1, cursor:'pointer', padding:'8px 20px', borderRadius:6,
              background: type===t ? (t==='add'?'rgba(0,255,178,0.15)':'rgba(255,58,92,0.12)') : 'transparent',
              border:`1px solid ${type===t?(t==='add'?'rgba(0,255,178,0.4)':'rgba(255,58,92,0.35)'):'var(--bd)'}`,
              color: type===t ? (t==='add'?'var(--ac)':'#FF3A5C') : 'var(--tx3)',
            }}>
              {t === 'add' ? '➕ AJOUTER' : '➖ RETIRER'}
            </button>
          ))}
        </div>
        <button onClick={submit} disabled={loading} style={{
          fontFamily:HUD, fontSize:10, letterSpacing:2, cursor:'pointer', padding:'12px 28px', borderRadius:6,
          background: type==='add'?'var(--ac)':'rgba(255,58,92,0.8)',
          border:'none', color:'#020408', fontWeight:700,
          opacity: loading ? 0.6 : 1,
        }}>{loading ? 'ENVOI...' : `APPLIQUER ${type==='add'?'+':'−'}${amount||'?'} CRÉDITS`}</button>
      </div>

      {/* Historique des ajustements admin */}
      {history.length > 0 && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:10, padding:'1rem' }}>
          <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'var(--tx3)', marginBottom:12 }}>HISTORIQUE RÉCENT</div>
          {history.slice(0,10).map((h,i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--bd)', fontSize:13, fontFamily:BODY, color:'var(--tx2)' }}>
              <span>{h.user_email}</span>
              <span style={{ color: h.amount > 0 ? 'var(--ac)' : '#FF3A5C', fontFamily:HUD, fontSize:11 }}>
                {h.amount > 0 ? '+' : ''}{h.amount}
              </span>
              <span style={{ color:'var(--tx3)', fontSize:11 }}>{h.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// PANEL : PARAMÈTRES SYSTÈME
// ─────────────────────────────────────────────────────────
export function SettingsAdminPanel({ token, showToast }: { token:string; showToast:(m:string,ok:boolean)=>void }) {
  const HUD='\'Orbitron\',monospace', BODY='\'Rajdhani\',sans-serif'
  const [budget, setBudget]   = useState('500')
  const [spent,  setSpent]    = useState('0.80')
  const [rate,   setRate]     = useState('620')
  const [saving, setSaving]   = useState(false)

  const save = async () => {
    setSaving(true)
    // Mettre à jour les constantes dans la treasury route via API
    const res = await fetch('/api/admin/system-settings', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify({ anthropic_budget: Number(budget), anthropic_spent: Number(spent), xof_per_usd: Number(rate) }),
    })
    const data = await res.json()
    showToast(data.success ? '✅ Paramètres sauvegardés' : `❌ ${data.error}`, data.success)
    setSaving(false)
  }

  const inp = { background:'var(--bg1)', border:'1px solid var(--bd)', color:'var(--tx0)', fontFamily:BODY, fontSize:15, padding:'10px 12px', borderRadius:6, outline:'none', width:'100%' }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.5rem' }}>
        <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:2, color:'var(--ac)', marginBottom:20 }}>⚙️ PARAMÈTRES SYSTÈME</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:20 }}>
          <div>
            <label style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'var(--tx3)', display:'block', marginBottom:6 }}>BUDGET ANTHROPIC ($)</label>
            <input type="number" value={budget} onChange={e => setBudget(e.target.value)} style={inp} />
            <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)', marginTop:4 }}>Limite mensuelle API Claude</div>
          </div>
          <div>
            <label style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'var(--tx3)', display:'block', marginBottom:6 }}>DÉPENSÉ CE MOIS ($)</label>
            <input type="number" step="0.01" value={spent} onChange={e => setSpent(e.target.value)} style={inp} />
            <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)', marginTop:4 }}>Depuis console.anthropic.com</div>
          </div>
          <div>
            <label style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'var(--tx3)', display:'block', marginBottom:6 }}>TAUX XOF/USD</label>
            <input type="number" value={rate} onChange={e => setRate(e.target.value)} style={inp} />
            <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)', marginTop:4 }}>1 USD = {rate} FCFA</div>
          </div>
        </div>
        <button onClick={save} disabled={saving} style={{
          fontFamily:HUD, fontSize:10, letterSpacing:2, cursor:'pointer', padding:'12px 28px', borderRadius:6,
          background:'var(--ac)', border:'none', color:'#020408', fontWeight:700, opacity: saving ? 0.6 : 1,
        }}>{saving ? 'SAUVEGARDE...' : '💾 SAUVEGARDER'}</button>
      </div>

      {/* Infos système */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {[
          { l:'URL WEBHOOK', v:'profity-x.com/api/payment/webhook', c:'var(--ac)' },
          { l:'EDGE FUNCTION', v:'send-email v7 — ACTIVE', c:'var(--ok)' },
          { l:'DB SUPABASE', v:'crlfkiniwalhzvpxrqav — HEALTHY', c:'var(--ok)' },
          { l:'CRON EMAIL', v:'0 8 * * * (8h UTC)', c:'var(--ac2)' },
        ].map(item => (
          <div key={item.l} style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:8, padding:'12px 14px' }}>
            <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'var(--tx3)', marginBottom:5 }}>{item.l}</div>
            <div style={{ fontFamily:BODY, fontSize:13, color:item.c }}>{item.v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
