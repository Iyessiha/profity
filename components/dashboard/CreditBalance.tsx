// ============================================================
// PROFITYX — CreditBalance v2 : synchro temps réel
// ============================================================
'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

interface Pack { id:string; name:string; credits:number; price_xof:number; badge:string|null }
interface CreditData { balance:number; earned:number; spent:number; packs:Pack[] }

export default function CreditBalance({ token, locale='fr' }: { token:string; locale?:string }) {
  const [data,      setData]    = useState<CreditData|null>(null)
  const [open,      setOpen]    = useState(false)
  const [loading,   setLoading] = useState<string|null>(null)
  const [toast,     setToast]   = useState<string|null>(null)
  const [refreshing,setRefresh] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const loadCredits = useCallback(async (quiet=false) => {
    if (!token) return
    if (!quiet) setRefresh(true)
    try {
      const r = await window.fetch('/api/credits', { headers:{ Authorization:`Bearer ${token}` } })
      const j = await r.json()
      if (j.success) setData(j)
    } finally {
      setRefresh(false)
    }
  }, [token])

  // Chargement initial
  useEffect(() => { loadCredits() }, [loadCredits])

  // Polling toutes les 30 secondes
  useEffect(() => {
    const id = setInterval(() => loadCredits(true), 30_000)
    return () => clearInterval(id)
  }, [loadCredits])

  // Écouter l'événement custom émis après une analyse
  useEffect(() => {
    const handler = () => loadCredits(true)
    window.addEventListener('creditUpdate', handler)
    return () => window.removeEventListener('creditUpdate', handler)
  }, [loadCredits])

  // Fermer en cliquant dehors
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const buy = async (pack: Pack) => {
    if (!token) return
    setLoading(pack.id)
    const r    = await window.fetch('/api/credits', { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body:JSON.stringify({ pack_id:pack.id }) })
    const json = await r.json()
    if (json.success && json.redirectUrl) {
      if (json.fallback) {
        setToast('💬 Ouverture WhatsApp...')
        setTimeout(() => window.open(json.redirectUrl,'_blank'), 800)
      } else {
        window.location.href = json.redirectUrl
      }
    } else {
      setToast(json.error ?? 'Erreur')
    }
    setLoading(null)
  }

  if (!data) return null

  const bal     = data.balance
  const isLow   = bal <= 5
  const isEmpty = bal <= 0
  const color   = isEmpty ? 'var(--red)' : isLow ? 'var(--ora)' : 'var(--ac)'

  return (
    <div ref={panelRef} style={{ position:'relative' }}>
      {toast && (
        <div style={{ position:'fixed', top:70, right:16, zIndex:600, background:'var(--bg2)', border:'1px solid var(--bd2)', borderRadius:8, padding:'10px 16px', fontFamily:HUD, fontSize:9, letterSpacing:1, color:'var(--ac)', boxShadow:'0 8px 24px var(--sh)' }}
          onClick={()=>setToast(null)}>{toast}</div>
      )}

      {/* Bouton solde */}
      <button onClick={()=>setOpen(v=>!v)} style={{ display:'flex', alignItems:'center', gap:6, background:`color-mix(in srgb, ${color} 10%, transparent)`, border:`1px solid color-mix(in srgb, ${color} 25%, transparent)`, borderRadius:7, padding:'5px 10px', cursor:'pointer', flexShrink:0 }}>
        <i className="ti ti-coin" style={{ fontSize:14, color }} />
        <span style={{ fontFamily:HUD, fontSize:10, fontWeight:700, color }}>
          {refreshing ? '…' : bal}
        </span>
        <span style={{ fontFamily:BODY, fontSize:10, color:'var(--tx3)' }}>{locale==='fr'?'crédits':'credits'}</span>
        {isLow && <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--red)', animation:'pulse 1.5s infinite' }} />}
      </button>

      {/* Panel — position fixe sur mobile pour éviter le débordement */}
      {open && (
        <div style={{
          position:'fixed',
          top:64,
          right:8,
          left:8,
          maxWidth:360,
          margin:'0 auto',
          background:'var(--bg1)',
          border:'1px solid var(--bd1)',
          borderRadius:12,
          boxShadow:'0 12px 40px var(--sh)',
          zIndex:300,
          overflow:'hidden',
        }}>
          <div style={{ height:2, background:'linear-gradient(90deg, var(--ac), var(--ac2))' }} />

          {/* En-tête solde + refresh */}
          <div style={{ padding:'1rem', borderBottom:'1px solid var(--bd)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'var(--tx3)', marginBottom:4 }}>SOLDE DE CRÉDITS</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                <span style={{ fontFamily:HUD, fontSize:32, fontWeight:900, color, lineHeight:1 }}>{bal}</span>
                <span style={{ fontFamily:BODY, fontSize:13, color:'var(--tx2)' }}>crédits</span>
              </div>
              <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)', marginTop:3 }}>
                {data.spent > 0 ? `${data.spent} utilisé${data.spent>1?'s':''} · ` : ''}{data.earned} gagnés au total
              </div>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {/* Bouton refresh */}
              <button onClick={()=>loadCredits()} title="Actualiser" style={{ background:'transparent', border:'1px solid var(--bd)', borderRadius:6, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--tx3)', fontSize:14 }}>
                <i className={`ti ti-refresh${refreshing?' spin':''}`} />
              </button>
              <button onClick={()=>setOpen(false)} style={{ background:'transparent', border:'none', color:'var(--tx3)', cursor:'pointer', fontSize:18, width:30, height:30 }}>✕</button>
            </div>
          </div>

          {isEmpty && (
            <div style={{ padding:'0.75rem 1rem', background:'rgba(220,38,38,0.08)', borderBottom:'1px solid var(--bd)' }}>
              <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:1, color:'var(--red)', marginBottom:2 }}>🚨 CRÉDITS ÉPUISÉS</div>
              <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx2)' }}>Achetez un pack pour continuer à analyser.</div>
            </div>
          )}

          {/* Packs */}
          <div style={{ padding:'0.875rem', maxHeight:'60vh', overflowY:'auto' }}>
            <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'var(--tx3)', marginBottom:10 }}>ACHETER DES CRÉDITS</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {data.packs.map(pack => (
                <div key={pack.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--bg2)', border:`1px solid ${pack.badge?'var(--bd2)':'var(--bd)'}`, borderRadius:8, padding:'0.75rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:7, background:'color-mix(in srgb, var(--ac) 10%, transparent)', border:'1px solid var(--bd1)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:HUD, fontSize:11, fontWeight:900, color:'var(--ac)', flexShrink:0 }}>{pack.credits}</div>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                        <span style={{ fontFamily:HUD, fontSize:10, color:'var(--tx0)', letterSpacing:0.5 }}>{pack.name}</span>
                        {pack.badge && <span style={{ fontFamily:HUD, fontSize:6, letterSpacing:1, color:'var(--ac)', background:'color-mix(in srgb, var(--ac) 12%, transparent)', border:'1px solid color-mix(in srgb, var(--ac) 25%, transparent)', borderRadius:2, padding:'2px 6px' }}>{pack.badge}</span>}
                      </div>
                      <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)' }}>{pack.credits} crédits · {(pack.price_xof / pack.credits).toFixed(0)} FCFA/crédit</div>
                    </div>
                  </div>
                  <button onClick={()=>buy(pack)} disabled={loading===pack.id}
                    style={{ background: pack.badge?'var(--ac)':'color-mix(in srgb, var(--ac) 10%, transparent)', border:`1px solid ${pack.badge?'transparent':'var(--bd2)'}`, color: pack.badge?'#020408':'var(--ac)', fontFamily:HUD, fontSize:8, letterSpacing:1, fontWeight:700, padding:'7px 12px', borderRadius:4, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
                    {loading===pack.id ? '...' : `${pack.price_xof.toLocaleString('fr-FR')} F`}
                  </button>
                </div>
              ))}
            </div>
            <div style={{ marginTop:10, fontFamily:BODY, fontSize:11, color:'var(--tx3)', textAlign:'center' }}>
              1 crédit = 1 analyse chart ou 1 signal news
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        .spin { animation: spin 0.6s linear infinite; display:inline-block; }
      `}</style>
    </div>
  )
}
