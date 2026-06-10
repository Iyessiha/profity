// ============================================================
// PROFITYX — AlertsPanel : alertes de prix
// ============================================================
'use client'
import { useState, useEffect, useCallback } from 'react'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

// Paires disponibles avec prix de référence
const PAIRS = [
  { label:'XAU/USD', group:'Forex/Métal' },
  { label:'EUR/USD', group:'Forex' },
  { label:'GBP/USD', group:'Forex' },
  { label:'USD/JPY', group:'Forex' },
  { label:'BTC/USD', group:'Crypto' },
  { label:'ETH/USD', group:'Crypto' },
  { label:'V75',     group:'Indices Synthétiques' },
  { label:'V10',     group:'Indices Synthétiques' },
]

interface Alert { id:string; pair:string; target_price:number; condition:'above'|'below'; triggered:boolean; active:boolean; created_at:string }

function fmt(n: number) {
  return n >= 1000 ? n.toLocaleString('fr-FR', { maximumFractionDigits:2 }) : n.toFixed(5)
}

export default function AlertsPanel({ token, plan }: { token:string; plan:string }) {
  const [alerts, setAlerts]   = useState<Alert[]>([])
  const [limit,  setLimit]    = useState(2)
  const [pair,   setPair]     = useState('XAU/USD')
  const [price,  setPrice]    = useState('')
  const [cond,   setCond]     = useState<'above'|'below'>('above')
  const [saving, setSaving]   = useState(false)
  const [error,  setError]    = useState<string|null>(null)
  const [open,   setOpen]     = useState(false)

  const isPro    = plan === 'pro' || plan === 'elite'
  const active   = alerts.filter(a => a.active && !a.triggered)
  const triggered = alerts.filter(a => a.triggered)

  const load = useCallback(async () => {
    const r = await fetch('/api/alerts', { headers:{ Authorization:`Bearer ${token}` } })
    const j = await r.json()
    if (j.success) { setAlerts(j.alerts); setLimit(j.limit) }
  }, [token])

  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!price || isNaN(Number(price))) { setError('Prix invalide'); return }
    setSaving(true); setError(null)
    const r = await fetch('/api/alerts', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify({ pair, target_price:Number(price), condition:cond }),
    })
    const j = await r.json()
    if (j.success) { setPrice(''); load(); setOpen(false) }
    else setError(j.error)
    setSaving(false)
  }

  const remove = async (id: string) => {
    await fetch('/api/alerts', { method:'DELETE', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body:JSON.stringify({ id }) })
    load()
  }

  return (
    <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:12, overflow:'hidden', marginTop:'1.25rem' }}>
      <div style={{ height:2, background:'linear-gradient(90deg,transparent,var(--ac3),transparent)' }} />

      <div style={{ padding:'1rem 1.25rem' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:'color-mix(in srgb,var(--ac3) 12%,transparent)', border:'1px solid color-mix(in srgb,var(--ac3) 25%,transparent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <i className="ti ti-bell-ringing" style={{ fontSize:18, color:'var(--ac3)' }} />
            </div>
            <div>
              <div style={{ fontFamily:HUD, fontSize:11, color:'var(--tx0)', letterSpacing:1 }}>ALERTES DE PRIX</div>
              <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)' }}>
                {active.length}/{limit} alertes actives
                {!isPro && <span style={{ color:'var(--ac3)', marginLeft:6 }}>· Free : 2 max</span>}
              </div>
            </div>
          </div>
          <button onClick={() => setOpen(v => !v)}
            style={{ background:open?'color-mix(in srgb,var(--ac) 12%,transparent)':'var(--bg2)', border:'1px solid var(--bd)', borderRadius:6, padding:'7px 12px', cursor:'pointer', color:'var(--ac)', fontFamily:HUD, fontSize:8, letterSpacing:1 }}>
            {open ? '✕ FERMER' : '+ AJOUTER'}
          </button>
        </div>

        {/* Formulaire création */}
        {open && (
          <div style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:8, padding:'1rem', marginBottom:'1rem' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
              <div>
                <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)', marginBottom:5 }}>PAIRE</div>
                <select value={pair} onChange={e => setPair(e.target.value)}
                  style={{ width:'100%', background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:5, padding:'9px 10px', color:'var(--tx0)', fontFamily:HUD, fontSize:10 }}>
                  {PAIRS.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)', marginBottom:5 }}>CONDITION</div>
                <div style={{ display:'flex', gap:6 }}>
                  {(['above','below'] as const).map(c => (
                    <button key={c} onClick={() => setCond(c)}
                      style={{ flex:1, padding:'9px 6px', border:`1px solid ${cond===c?c==='above'?'rgba(0,255,178,0.4)':'rgba(255,58,92,0.4)':'var(--bd)'}`, borderRadius:5, background:cond===c?c==='above'?'rgba(0,255,178,0.08)':'rgba(255,58,92,0.08)':'transparent', color:cond===c?c==='above'?'#00FFB2':'#FF3A5C':'var(--tx3)', fontFamily:HUD, fontSize:8, cursor:'pointer' }}>
                      {c === 'above' ? '▲ AU-DESSUS' : '▼ EN-DESSOUS'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)', marginBottom:5 }}>PRIX CIBLE</div>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                placeholder={pair.includes('BTC') ? '90000' : pair === 'XAU/USD' ? '2400.00' : '1.1050'}
                style={{ width:'100%', background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:5, padding:'9px 12px', color:'var(--tx0)', fontFamily:HUD, fontSize:14, outline:'none', boxSizing:'border-box' }} />
            </div>
            {error && <div style={{ fontFamily:BODY, fontSize:13, color:'var(--red)', marginBottom:8 }}>{error}</div>}
            {!isPro && active.length >= limit ? (
              <a href="/pricing" style={{ display:'block', background:'var(--ac)', color:'#020408', textAlign:'center', textDecoration:'none', fontFamily:HUD, fontSize:9, letterSpacing:2, padding:'10px', borderRadius:5, fontWeight:700 }}>
                PASSER PRO POUR + D'ALERTES →
              </a>
            ) : (
              <button onClick={create} disabled={saving || !price}
                style={{ width:'100%', background:saving||!price?'var(--bd)':'var(--ac)', border:'none', borderRadius:5, padding:'10px', color:saving||!price?'var(--tx3)':'#020408', fontFamily:HUD, fontSize:9, letterSpacing:2, fontWeight:700, cursor:'pointer' }}>
                {saving ? '...' : `🔔 CRÉER L'ALERTE ${pair} ${cond==='above'?'▲':'▼'} ${price}`}
              </button>
            )}
          </div>
        )}

        {/* Liste alertes actives */}
        {active.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom: triggered.length > 0 ? '1rem' : 0 }}>
            {active.map(a => (
              <div key={a.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:8, padding:'10px 14px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--ok)', animation:'pulse 2s infinite', flexShrink:0 }} />
                  <div>
                    <div style={{ fontFamily:HUD, fontSize:11, color:'var(--tx0)' }}>{a.pair}</div>
                    <div style={{ fontFamily:BODY, fontSize:12, color:a.condition==='above'?'#00FFB2':'#FF3A5C' }}>
                      {a.condition === 'above' ? '▲ au-dessus de' : '▼ en-dessous de'} <strong>{fmt(a.target_price)}</strong>
                    </div>
                  </div>
                </div>
                <button onClick={() => remove(a.id)} style={{ background:'transparent', border:'none', color:'var(--tx3)', cursor:'pointer', fontSize:16, flexShrink:0 }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Alertes déclenchées */}
        {triggered.length > 0 && (
          <>
            <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'var(--tx3)', marginBottom:6 }}>DÉCLENCHÉES</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {triggered.slice(0,3).map(a => (
                <div key={a.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, background:'rgba(0,230,118,0.04)', border:'1px solid rgba(0,230,118,0.12)', borderRadius:7, padding:'8px 12px', opacity:0.6 }}>
                  <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx2)' }}>
                    ✓ {a.pair} {a.condition==='above'?'▲':'▼'} {fmt(a.target_price)}
                  </div>
                  <button onClick={() => remove(a.id)} style={{ background:'transparent', border:'none', color:'var(--tx3)', cursor:'pointer', fontSize:14 }}>✕</button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* État vide */}
        {alerts.length === 0 && !open && (
          <div style={{ textAlign:'center', padding:'1.5rem 0', color:'var(--tx3)' }}>
            <i className="ti ti-bell-off" style={{ fontSize:28, display:'block', marginBottom:8 }} />
            <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:1, marginBottom:4 }}>AUCUNE ALERTE</div>
            <div style={{ fontFamily:BODY, fontSize:12 }}>Cliquez sur "+ AJOUTER" pour être notifié quand un prix est atteint.</div>
          </div>
        )}
      </div>
    </div>
  )
}
