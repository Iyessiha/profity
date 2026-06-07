// ============================================================
// PROFITYX — Onboarding guidé (premier login)
// ============================================================
'use client'
import { useState } from 'react'
import { supabasePublic } from '@/lib/supabase'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

interface Props { userId: string; name?: string; credits?: number; onDone: () => void }

const STEPS = [
  {
    icon: '🎉',
    title: 'Bienvenue sur ProfityX !',
    color: '#00FFB2',
    content: (name: string, credits: number) => (
      <div>
        <p style={{ fontFamily:BODY, fontSize:16, color:'rgba(232,244,248,0.75)', lineHeight:1.7, marginBottom:16 }}>
          Bonjour <strong style={{ color:'#00FFB2' }}>{name}</strong> ! Votre compte est prêt.
          Vous avez <strong style={{ color:'#00FFB2' }}>{credits} crédits</strong> offerts pour commencer.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[
            { icon:'📊', label:'1 crédit', sub:'= 1 analyse chart' },
            { icon:'📰', label:'1 crédit', sub:'= 1 signal annonce' },
            { icon:'🎁', label:'+10 crédits', sub:'si quelqu\'un vous parraine' },
            { icon:'💰', label:'+20 crédits', sub:'par ami parrainé' },
          ].map(c => (
            <div key={c.label+c.sub} style={{ background:'rgba(0,255,178,0.05)', border:'1px solid rgba(0,255,178,0.1)', borderRadius:8, padding:'10px 12px' }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{c.icon}</div>
              <div style={{ fontFamily:HUD, fontSize:10, color:'#00FFB2', marginBottom:2 }}>{c.label}</div>
              <div style={{ fontFamily:BODY, fontSize:11, color:'rgba(232,244,248,0.45)' }}>{c.sub}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: '📊',
    title: 'Analysez votre chart en 3 sec',
    color: '#00D4FF',
    content: () => (
      <div>
        <p style={{ fontFamily:BODY, fontSize:15, color:'rgba(232,244,248,0.75)', lineHeight:1.7, marginBottom:16 }}>
          Uploadez n'importe quel screenshot de chart — l'IA détecte la paire, le timeframe et génère votre signal SMC.
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[
            { n:'1', t:'Prenez un screenshot de votre chart', icon:'📸' },
            { n:'2', t:'Uploadez-le sur la page Analyse IA',  icon:'⬆️' },
            { n:'3', t:'Recevez : Entrée · Stop · TP1/2/3',   icon:'🎯' },
          ].map(s => (
            <div key={s.n} style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(0,212,255,0.04)', border:'1px solid rgba(0,212,255,0.1)', borderRadius:8, padding:'10px 14px' }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(0,212,255,0.15)', border:'1px solid rgba(0,212,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:HUD, fontSize:11, color:'#00D4FF', flexShrink:0 }}>{s.n}</div>
              <span style={{ fontSize:18 }}>{s.icon}</span>
              <span style={{ fontFamily:BODY, fontSize:14, color:'rgba(232,244,248,0.7)' }}>{s.t}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop:12, background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:6, padding:'8px 12px', fontFamily:BODY, fontSize:12, color:'rgba(201,168,76,0.8)' }}>
          💡 Conseil : prenez le chart sur TradingView en thème sombre, timeframe H1 ou H4.
        </div>
      </div>
    ),
  },
  {
    icon: '📰',
    title: 'Suivez les annonces macro',
    color: '#C9A84C',
    content: () => (
      <div>
        <p style={{ fontFamily:BODY, fontSize:15, color:'rgba(232,244,248,0.75)', lineHeight:1.7, marginBottom:16 }}>
          NFP, CPI, FOMC — les grandes annonces font bouger les marchés de 100 à 300 pips en quelques minutes.
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
          {[
            { event:'NFP',  desc:'Créations d\'emplois USA',   impact:'🔴 Très fort', pair:'XAU/USD · EUR/USD' },
            { event:'CPI',  desc:'Inflation USA',              impact:'🔴 Très fort', pair:'EUR/USD · GBP/USD' },
            { event:'FOMC', desc:'Décision taux Fed',          impact:'🔴 Extrême',   pair:'Toutes devises USD' },
          ].map(e => (
            <div key={e.event} style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(201,168,76,0.05)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:7, padding:'9px 12px' }}>
              <span style={{ fontFamily:HUD, fontSize:11, color:'#C9A84C', minWidth:40 }}>{e.event}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:BODY, fontSize:12, color:'rgba(232,244,248,0.65)' }}>{e.desc} · {e.impact}</div>
                <div style={{ fontFamily:BODY, fontSize:11, color:'rgba(232,244,248,0.35)' }}>{e.pair}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background:'rgba(0,212,255,0.06)', border:'1px solid rgba(0,212,255,0.15)', borderRadius:6, padding:'8px 12px', fontFamily:BODY, fontSize:12, color:'rgba(0,212,255,0.8)' }}>
          📅 Les membres Pro reçoivent le signal <strong>30 min avant</strong> chaque annonce.
        </div>
      </div>
    ),
  },
  {
    icon: '🚀',
    title: 'Vous êtes prêt !',
    color: '#00FFB2',
    content: () => (
      <div>
        <p style={{ fontFamily:BODY, fontSize:15, color:'rgba(232,244,248,0.75)', lineHeight:1.7, marginBottom:20 }}>
          Tout est configuré. Voici votre plan d'action pour vos premières 24h :
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[
            { done:false, t:'Faire votre première analyse chart', link:'/analysis',  cta:'ANALYSER →',   color:'#00FFB2' },
            { done:false, t:'Voir les annonces macro à venir',    link:'/news',      cta:'VOIR →',       color:'#C9A84C' },
            { done:false, t:'Parrainer un ami (+20 crédits)',     link:'/referral',  cta:'PARRAINER →',  color:'#00D4FF' },
          ].map(a => (
            <div key={a.t} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, background:'rgba(0,0,0,0.2)', border:`1px solid ${a.color}20`, borderRadius:8, padding:'10px 14px' }}>
              <span style={{ fontFamily:BODY, fontSize:13, color:'rgba(232,244,248,0.65)', flex:1 }}>{a.t}</span>
              <a href={a.link} style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:a.color, background:`${a.color}15`, border:`1px solid ${a.color}30`, borderRadius:4, padding:'5px 10px', textDecoration:'none', whiteSpace:'nowrap', flexShrink:0 }}>
                {a.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    ),
  },
]

export default function Onboarding({ userId, name = 'Trader', credits = 10, onDone }: Props) {
  const [step, setStep]       = useState(0)
  const [leaving, setLeaving] = useState(false)

  const current = STEPS[step]
  const isLast  = step === STEPS.length - 1

  const complete = async () => {
    setLeaving(true)
    await supabasePublic.from('profiles').update({ onboarding_done: true }).eq('id', userId)
    setTimeout(onDone, 400)
  }

  const next = () => {
    if (isLast) complete()
    else setStep(s => s + 1)
  }

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(2,4,8,0.88)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'1rem',
      backdropFilter:'blur(6px)',
      opacity: leaving ? 0 : 1,
      transition:'opacity .4s ease',
    }}>
      <div style={{
        width:'100%', maxWidth:460,
        background:'linear-gradient(160deg,#0A1628,#060B14)',
        border:`1px solid ${current.color}30`,
        borderRadius:16,
        overflow:'hidden',
        boxShadow:`0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px ${current.color}10`,
        animation:'onboardIn .35s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Barre de progression */}
        <div style={{ height:3, background:'rgba(255,255,255,0.06)', position:'relative' }}>
          <div style={{ position:'absolute', left:0, top:0, height:'100%', background:`linear-gradient(90deg, ${current.color}, ${current.color}99)`, width:`${((step+1)/STEPS.length)*100}%`, transition:'width .4s ease' }} />
        </div>

        <div style={{ padding:'1.5rem' }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:'1.25rem' }}>
            <div style={{ width:52, height:52, borderRadius:14, background:`${current.color}15`, border:`1px solid ${current.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>
              {current.icon}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'rgba(232,244,248,0.3)', marginBottom:4 }}>
                ÉTAPE {step+1} / {STEPS.length}
              </div>
              <h2 style={{ fontFamily:HUD, fontSize:15, fontWeight:900, color:'#E8F4F8', lineHeight:1.2, margin:0 }}>
                {current.title}
              </h2>
            </div>
          </div>

          {/* Contenu de l'étape */}
          <div style={{ minHeight:200 }}>
            {current.content(name, credits)}
          </div>

          {/* Actions */}
          <div style={{ marginTop:'1.5rem', display:'flex', gap:10, alignItems:'center' }}>
            <button onClick={complete}
              style={{ background:'transparent', border:'none', color:'rgba(232,244,248,0.3)', fontFamily:HUD, fontSize:8, letterSpacing:1, cursor:'pointer', padding:'6px 0', flexShrink:0 }}>
              PASSER
            </button>

            {/* Dots */}
            <div style={{ flex:1, display:'flex', justifyContent:'center', gap:6 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{ width: i===step ? 18 : 6, height:6, borderRadius:3, background: i===step ? current.color : 'rgba(255,255,255,0.12)', transition:'all .3s ease', cursor:'pointer' }}
                  onClick={() => setStep(i)} />
              ))}
            </div>

            <button onClick={next}
              style={{ background:`linear-gradient(135deg, ${current.color}, ${current.color}CC)`, border:'none', borderRadius:7, padding:'11px 22px', color:'#020408', fontFamily:HUD, fontSize:10, letterSpacing:2, fontWeight:900, cursor:'pointer', flexShrink:0, boxShadow:`0 4px 16px ${current.color}30` }}>
              {isLast ? 'C\'EST PARTI !' : 'SUIVANT →'}
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
