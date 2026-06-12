// ============================================================
// PROFITYX — Onboarding actif v2
// Étape 1 : Profil trader (actif favori + broker)
// Étape 2 : Comment ça marche (démo visuelle animée)
// Étape 3 : Premier chart — CTA direct vers /analysis
// ============================================================
'use client'
import { useState } from 'react'
import { supabasePublic } from '@/lib/supabase'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

interface Props { userId: string; name?: string; credits?: number; onDone: () => void }

// ── Étape 1 : Profil ─────────────────────────────────────────
const ASSETS = [
  { id:'boom_1000',  label:'Boom 1000',   emoji:'📈', color:'#00FFB2' },
  { id:'crash_500',  label:'Crash 500',   emoji:'📉', color:'#FF3A5C' },
  { id:'gainx_600',  label:'GainX 600',   emoji:'⚡', color:'#C9A84C' },
  { id:'xauusd',     label:'Gold XAU/USD',emoji:'🥇', color:'#FFD700' },
  { id:'eurusd',     label:'EUR/USD',      emoji:'💶', color:'#00D4FF' },
  { id:'btcusd',     label:'BTC/USD',      emoji:'₿',  color:'#F7931A' },
]
const BROKERS = ['Deriv','TradingView','MetaTrader 4','MetaTrader 5','Autre']
const TIMEFRAMES = ['M1','M5','M15','H1','H4','D1']

// ── Étape 2 : Démo visuelle ───────────────────────────────────
function DemoStep() {
  const [active, setActive] = useState(0)
  const steps = [
    { n:'01', icon:'📸', title:'Capturez votre chart', desc:'Screenshot plein écran sur TradingView ou Deriv — thème sombre, timeframe H1 ou H4 pour de meilleurs résultats.', color:'#00FFB2' },
    { n:'02', icon:'⬆️', title:'Uploadez-le',          desc:'Glissez ou sélectionnez l\'image sur la page Analyse IA. L\'IA détecte automatiquement la paire et le timeframe.', color:'#00D4FF' },
    { n:'03', icon:'🎯', title:'Recevez votre signal', desc:'En 10 secondes : Entrée · Stop Loss · TP1 / TP2 / TP3 et un chart annoté avec les zones Order Block et FVG.', color:'#C9A84C' },
  ]
  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {steps.map((s,i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            flex:1, padding:'10px 6px', borderRadius:8, cursor:'pointer', transition:'all .2s',
            background: active===i ? `${s.color}15` : 'rgba(255,255,255,0.03)',
            border: `1px solid ${active===i ? s.color+'40' : 'rgba(255,255,255,0.06)'}`,
          }}>
            <div style={{ fontSize:18, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontFamily:HUD, fontSize:7, color: active===i ? s.color : 'rgba(232,244,248,0.35)', letterSpacing:1 }}>{s.n}</div>
          </button>
        ))}
      </div>
      <div style={{ background:`${steps[active].color}08`, border:`1px solid ${steps[active].color}20`, borderRadius:10, padding:'14px 16px', minHeight:90, transition:'all .25s' }}>
        <div style={{ fontFamily:HUD, fontSize:12, color:steps[active].color, marginBottom:6 }}>{steps[active].title}</div>
        <div style={{ fontFamily:BODY, fontSize:14, color:'rgba(232,244,248,0.7)', lineHeight:1.65 }}>{steps[active].desc}</div>
      </div>
      <div style={{ marginTop:12, display:'flex', gap:8 }}>
        {[
          { icon:'💡', text:'Capture plein écran = tracés plus précis', color:'#C9A84C' },
          { icon:'⚡', text:'Résultat en moins de 10 secondes', color:'#00FFB2' },
        ].map(t => (
          <div key={t.text} style={{ flex:1, background:`${t.color}08`, border:`1px solid ${t.color}18`, borderRadius:7, padding:'8px 10px', display:'flex', gap:6, alignItems:'flex-start' }}>
            <span style={{ fontSize:13 }}>{t.icon}</span>
            <span style={{ fontFamily:BODY, fontSize:11, color:`${t.color}CC`, lineHeight:1.5 }}>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Étape 3 : Premier chart ───────────────────────────────────
function FirstChartStep({ credits }: { credits: number }) {
  return (
    <div>
      <div style={{ background:'linear-gradient(135deg, rgba(0,255,178,0.08), rgba(0,212,255,0.05))', border:'1px solid rgba(0,255,178,0.15)', borderRadius:12, padding:'16px 18px', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <span style={{ fontSize:28 }}>🎯</span>
          <div>
            <div style={{ fontFamily:HUD, fontSize:11, color:'#00FFB2', marginBottom:2 }}>PRÊT À TRADER ?</div>
            <div style={{ fontFamily:BODY, fontSize:13, color:'rgba(232,244,248,0.6)' }}>Votre premier signal vous attend</div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[
            { icon:'🪙', label:`${credits} crédits`, sub:'disponibles maintenant' },
            { icon:'⏱️', label:'10 secondes', sub:'pour un signal complet' },
            { icon:'📊', label:'Chart annoté', sub:'Order Blocks + FVG' },
            { icon:'🎁', label:'+20 crédits', sub:'par ami parrainé' },
          ].map(c => (
            <div key={c.label} style={{ background:'rgba(0,255,178,0.04)', border:'1px solid rgba(0,255,178,0.08)', borderRadius:7, padding:'8px 10px' }}>
              <div style={{ fontSize:16, marginBottom:3 }}>{c.icon}</div>
              <div style={{ fontFamily:HUD, fontSize:9, color:'#00FFB2', marginBottom:1 }}>{c.label}</div>
              <div style={{ fontFamily:BODY, fontSize:10, color:'rgba(232,244,248,0.4)' }}>{c.sub}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontFamily:BODY, fontSize:13, color:'rgba(232,244,248,0.5)', lineHeight:1.6, textAlign:'center' }}>
        Cliquez sur <strong style={{ color:'#00FFB2' }}>C'EST PARTI !</strong> pour uploader votre premier chart et recevoir votre signal SMC.
      </div>
    </div>
  )
}

// ── Composant principal ────────────────────────────────────────
export default function Onboarding({ userId, name = 'Trader', credits = 10, onDone }: Props) {
  const [step,        setStep]        = useState(0)
  const [leaving,     setLeaving]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  // Étape 1 : sélections profil
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [broker,          setBroker]         = useState('')
  const [timeframe,       setTimeframe]       = useState('')

  const STEPS = [
    { icon:'⚙️', title:`Configurez votre profil, ${name}`, color:'#00FFB2' },
    { icon:'📊', title:'Comment ça marche',                 color:'#00D4FF' },
    { icon:'🚀', title:'Lancez votre première analyse',     color:'#C9A84C' },
  ]
  const current = STEPS[step]
  const isLast  = step === STEPS.length - 1

  const toggleAsset = (id: string) => {
    setSelectedAssets(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  const complete = async () => {
    setSaving(true)
    // Sauvegarder le profil trader
    const update: Record<string, unknown> = { onboarding_done: true }
    if (selectedAssets.length)   update.fav_assets        = selectedAssets
    if (broker)                  update.preferred_broker  = broker
    if (timeframe)               update.preferred_pairs   = [timeframe]
    await supabasePublic.from('profiles').update(update).eq('id', userId)
    setLeaving(true)
    setTimeout(() => {
      window.location.href = '/analysis'  // Rediriger directement vers l'analyse
    }, 350)
  }

  const next = () => {
    if (isLast) complete()
    else setStep(s => s + 1)
  }

  const skip = async () => {
    await supabasePublic.from('profiles').update({ onboarding_done: true }).eq('id', userId)
    setLeaving(true)
    setTimeout(onDone, 350)
  }

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(2,4,8,0.92)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'1rem',
      backdropFilter:'blur(8px)',
      opacity: leaving ? 0 : 1,
      transition:'opacity .35s ease',
    }}>
      <div style={{
        width:'100%', maxWidth:460,
        background:'linear-gradient(160deg,#0A1628,#060B14)',
        border:`1px solid ${current.color}25`,
        borderRadius:16,
        overflow:'hidden',
        boxShadow:`0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px ${current.color}08`,
        animation:'onboardIn .35s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Barre de progression */}
        <div style={{ height:3, background:'rgba(255,255,255,0.06)', position:'relative' }}>
          <div style={{ position:'absolute', left:0, top:0, height:'100%', background:`linear-gradient(90deg, ${current.color}, ${current.color}99)`, width:`${((step+1)/STEPS.length)*100}%`, transition:'width .4s ease' }} />
        </div>

        <div style={{ padding:'1.5rem' }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:'1.25rem' }}>
            <div style={{ width:52, height:52, borderRadius:14, background:`${current.color}12`, border:`1px solid ${current.color}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>
              {current.icon}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'rgba(232,244,248,0.3)', marginBottom:4 }}>
                ÉTAPE {step+1} / {STEPS.length}
              </div>
              <h2 style={{ fontFamily:HUD, fontSize:13, fontWeight:900, color:'#E8F4F8', lineHeight:1.25, margin:0 }}>
                {current.title}
              </h2>
            </div>
          </div>

          {/* Contenu */}
          <div style={{ minHeight:220 }}>

            {/* ÉTAPE 1 — Profil */}
            {step === 0 && (
              <div>
                <p style={{ fontFamily:BODY, fontSize:14, color:'rgba(232,244,248,0.6)', lineHeight:1.6, marginBottom:14, marginTop:0 }}>
                  Quels actifs tradez-vous ? <span style={{ color:'rgba(232,244,248,0.35)' }}>(sélectionnez tout ce qui vous concerne)</span>
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:7, marginBottom:16 }}>
                  {ASSETS.map(a => {
                    const sel = selectedAssets.includes(a.id)
                    return (
                      <button key={a.id} onClick={() => toggleAsset(a.id)} style={{
                        padding:'10px 6px', borderRadius:9, cursor:'pointer', transition:'all .18s',
                        background: sel ? `${a.color}18` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${sel ? a.color+'50' : 'rgba(255,255,255,0.07)'}`,
                        display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                      }}>
                        <span style={{ fontSize:20 }}>{a.emoji}</span>
                        <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:.5, color: sel ? a.color : 'rgba(232,244,248,0.4)' }}>{a.label}</span>
                        {sel && <span style={{ fontSize:8 }}>✓</span>}
                      </button>
                    )
                  })}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div>
                    <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'rgba(232,244,248,0.35)', marginBottom:6 }}>BROKER</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                      {BROKERS.map(b => (
                        <button key={b} onClick={() => setBroker(b)} style={{
                          padding:'5px 9px', borderRadius:5, cursor:'pointer', transition:'all .15s',
                          background: broker===b ? 'rgba(0,255,178,0.15)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${broker===b ? 'rgba(0,255,178,0.4)' : 'rgba(255,255,255,0.07)'}`,
                          fontFamily:BODY, fontSize:11, color: broker===b ? '#00FFB2' : 'rgba(232,244,248,0.45)',
                        }}>{b}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'rgba(232,244,248,0.35)', marginBottom:6 }}>TIMEFRAME PRÉFÉRÉ</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                      {TIMEFRAMES.map(tf => (
                        <button key={tf} onClick={() => setTimeframe(tf)} style={{
                          padding:'5px 9px', borderRadius:5, cursor:'pointer', transition:'all .15s',
                          background: timeframe===tf ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${timeframe===tf ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.07)'}`,
                          fontFamily:HUD, fontSize:8, color: timeframe===tf ? '#C9A84C' : 'rgba(232,244,248,0.45)',
                        }}>{tf}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 2 — Démo */}
            {step === 1 && <DemoStep />}

            {/* ÉTAPE 3 — Premier chart */}
            {step === 2 && <FirstChartStep credits={credits} />}

          </div>

          {/* Actions */}
          <div style={{ marginTop:'1.25rem', display:'flex', gap:10, alignItems:'center' }}>
            <button onClick={skip} style={{ background:'transparent', border:'none', color:'rgba(232,244,248,0.25)', fontFamily:HUD, fontSize:8, letterSpacing:1, cursor:'pointer', padding:'6px 0', flexShrink:0 }}>
              PASSER
            </button>
            <div style={{ flex:1, display:'flex', justifyContent:'center', gap:6 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{ width: i===step ? 18 : 6, height:6, borderRadius:3, background: i<=step ? current.color : 'rgba(255,255,255,0.1)', transition:'all .3s ease', opacity: i<step ? 0.5 : 1 }} />
              ))}
            </div>
            <button onClick={next} disabled={saving} style={{
              background:`linear-gradient(135deg, ${current.color}, ${current.color}CC)`,
              border:'none', borderRadius:7, padding:'11px 22px', color:'#020408',
              fontFamily:HUD, fontSize:10, letterSpacing:2, fontWeight:900, cursor: saving ? 'wait' : 'pointer',
              flexShrink:0, boxShadow:`0 4px 16px ${current.color}30`,
              opacity: saving ? 0.7 : 1, transition:'opacity .2s',
            }}>
              {saving ? '...' : isLast ? "C'EST PARTI !" : 'SUIVANT →'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes onboardIn {
          from { transform:scale(0.88) translateY(20px); opacity:0 }
          to   { transform:scale(1) translateY(0); opacity:1 }
        }
      `}</style>
    </div>
  )
}
