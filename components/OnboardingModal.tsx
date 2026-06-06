// ============================================================
// PROFITYX — Onboarding Modal : préférences de trading
// ============================================================
'use client'
import { useState } from 'react'
import { supabasePublic } from '@/lib/supabase'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

interface Props { userId: string; locale?: string; onClose: () => void }

const TRADING_TYPES = [
  { v:'forex',     icon:'ti-currency-dollar', label:'Forex (EUR/USD, GBP/USD…)' },
  { v:'crypto',    icon:'ti-currency-bitcoin', label:'Crypto (BTC, ETH, BNB…)' },
  { v:'synthetic', icon:'ti-chart-line',       label:'Indices synthétiques (Deriv)' },
  { v:'commodities',icon:'ti-oil',             label:'Matières premières (Or, Pétrole)' },
  { v:'indices',   icon:'ti-chart-bar',        label:'Indices (NAS100, SP500…)' },
  { v:'stocks',    icon:'ti-building-store',   label:'Actions (AAPL, TSLA…)' },
]

const BROKERS = [
  { v:'deriv',    label:'Deriv (Synthétiques)',  logo:'DV' },
  { v:'weltrade', label:'WelTrade',              logo:'WT' },
  { v:'exness',   label:'Exness',                logo:'EX' },
  { v:'binance',  label:'Binance',               logo:'BNB' },
  { v:'hfm',      label:'HF Markets (HFM)',       logo:'HFM' },
  { v:'other',    label:'Autre broker',          logo:'??' },
]

const RISKS = [
  { v:'conservative', icon:'ti-shield-check', label:'Conservateur', desc:'Petites positions, peu de trades' },
  { v:'moderate',     icon:'ti-balance',       label:'Modéré',       desc:'Equilibre risque/rendement' },
  { v:'aggressive',   icon:'ti-flame',         label:'Agressif',     desc:'Gros rendements, gros risques' },
]

export default function OnboardingModal({ userId, locale = 'fr', onClose }: Props) {
  const [step, setStep]          = useState(0)
  const [tradingType, setType]   = useState<string[]>([])
  const [broker, setBroker]      = useState('')
  const [risk, setRisk]          = useState('moderate')
  const [saving, setSaving]      = useState(false)

  const toggleType = (v: string) =>
    setType(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])

  const save = async () => {
    setSaving(true)
    await supabasePublic.from('profiles').update({
      trading_type:    tradingType[0] ?? 'forex',
      preferred_broker: broker || 'exness',
      risk_level:      risk,
      onboarding_done: true,
      fav_assets:      suggestAssets(tradingType[0] ?? 'forex', broker),
    }).eq('id', userId)
    setSaving(false)
    onClose()
  }

  const steps = [
    { title:'Quel marché tradez-vous ?', subtitle:'Sélectionnez un ou plusieurs' },
    { title:'Votre broker principal', subtitle:'Pour personnaliser vos suggestions' },
    { title:'Votre profil de risque', subtitle:'Pour adapter les signaux' },
  ]

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div className="modal-card" style={{ background:'var(--bg2)', border:'1px solid var(--bd2)', borderRadius:16, padding:'2rem', width:440, maxWidth:'100%', position:'relative', overflow:'hidden' }}>
        {/* Barre accent top */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg, var(--ac), var(--ac2))' }} />

        {/* En-tête */}
        <div style={{ marginBottom:'1.5rem' }}>
          <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'var(--tx3)', marginBottom:8 }}>ÉTAPE {step+1}/3</div>
          <div style={{ height:4, background:'var(--bd)', borderRadius:2, marginBottom:'1rem', overflow:'hidden' }}>
            <div style={{ width:`${((step+1)/3)*100}%`, height:'100%', background:'var(--ac)', transition:'width .3s' }} />
          </div>
          <h2 style={{ fontFamily:HUD, fontSize:16, color:'var(--tx0)', marginBottom:4 }}>{steps[step].title}</h2>
          <p style={{ fontFamily:BODY, fontSize:13, color:'var(--tx2)' }}>{steps[step].subtitle}</p>
        </div>

        {/* Étape 1 — Type de marché */}
        {step === 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {TRADING_TYPES.map(t => (
              <button key={t.v} onClick={() => toggleType(t.v)}
                style={{ background: tradingType.includes(t.v) ? 'color-mix(in srgb, var(--ac) 12%, transparent)' : 'var(--bg1)', border:`1px solid ${tradingType.includes(t.v)?'var(--ac2)':'var(--bd)'}`, borderRadius:8, padding:'0.875rem', cursor:'pointer', textAlign:'left', transition:'all .2s' }}>
                <i className={'ti '+t.icon} style={{ fontSize:20, color: tradingType.includes(t.v)?'var(--ac)':'var(--tx3)', display:'block', marginBottom:6 }} />
                <span style={{ fontFamily:BODY, fontSize:13, color:tradingType.includes(t.v)?'var(--tx0)':'var(--tx2)' }}>{t.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Étape 2 — Broker */}
        {step === 1 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {BROKERS.map(b => (
              <button key={b.v} onClick={() => setBroker(b.v)}
                style={{ background: broker===b.v ? 'color-mix(in srgb, var(--ac) 12%, transparent)' : 'var(--bg1)', border:`1px solid ${broker===b.v?'var(--ac2)':'var(--bd)'}`, borderRadius:8, padding:'0.875rem', cursor:'pointer', display:'flex', alignItems:'center', gap:10, transition:'all .2s' }}>
                <div style={{ width:34, height:34, borderRadius:6, background:'color-mix(in srgb, var(--ac) 10%, transparent)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:HUD, fontSize:9, color:'var(--ac)', flexShrink:0 }}>{b.logo}</div>
                <span style={{ fontFamily:BODY, fontSize:13, color:'var(--tx1)', textAlign:'left' }}>{b.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Étape 3 — Risque */}
        {step === 2 && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {RISKS.map(r => (
              <button key={r.v} onClick={() => setRisk(r.v)}
                style={{ background: risk===r.v ? 'color-mix(in srgb, var(--ac) 10%, transparent)' : 'var(--bg1)', border:`1px solid ${risk===r.v?'var(--ac2)':'var(--bd)'}`, borderRadius:8, padding:'1rem', cursor:'pointer', display:'flex', alignItems:'center', gap:12, transition:'all .2s' }}>
                <i className={'ti '+r.icon} style={{ fontSize:24, color: risk===r.v?'var(--ac)':'var(--tx3)', flexShrink:0 }} />
                <div style={{ textAlign:'left' }}>
                  <div style={{ fontFamily:HUD, fontSize:11, color:'var(--tx0)', letterSpacing:1, marginBottom:2 }}>{r.label}</div>
                  <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx2)' }}>{r.desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display:'flex', gap:10, marginTop:'1.5rem' }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s-1)}
              style={{ flex:1, padding:'11px', background:'transparent', border:'1px solid var(--bd)', color:'var(--tx2)', fontFamily:HUD, fontSize:9, letterSpacing:1, borderRadius:4, cursor:'pointer' }}>
              ← RETOUR
            </button>
          )}
          {step < 2 ? (
            <button onClick={() => setStep(s => s+1)} disabled={step===0 && tradingType.length===0}
              style={{ flex:2, padding:'11px', background: step===0&&tradingType.length===0?'var(--bd)':'var(--ac)', border:'none', color:'#020408', fontFamily:HUD, fontSize:10, letterSpacing:2, fontWeight:700, borderRadius:4, cursor: step===0&&tradingType.length===0?'not-allowed':'pointer' }}>
              SUIVANT →
            </button>
          ) : (
            <button onClick={save} disabled={saving}
              style={{ flex:2, padding:'11px', background:'var(--ac)', border:'none', color:'#020408', fontFamily:HUD, fontSize:10, letterSpacing:2, fontWeight:700, borderRadius:4, cursor:'pointer' }}>
              {saving ? 'ENREGISTREMENT...' : '✓ TERMINER'}
            </button>
          )}
        </div>
        <button onClick={onClose} style={{ position:'absolute', top:14, right:14, background:'transparent', border:'none', color:'var(--tx3)', cursor:'pointer', fontSize:20 }}>
          <i className="ti ti-x" />
        </button>
      </div>
    </div>
  )
}

function suggestAssets(type: string, broker: string): string[] {
  const map: Record<string, string[]> = {
    forex:       ['EUR/USD','GBP/USD','USD/JPY','AUD/USD','USD/CAD'],
    crypto:      ['BTC/USD','ETH/USD','BNB/USD','SOL/USD','XRP/USD'],
    synthetic:   ['Volatility 75 (1s)','Volatility 25','Crash 500','Boom 1000','Step Index'],
    commodities: ['XAU/USD','XAG/USD','WTI/USD','BRENT/USD','NG/USD'],
    indices:     ['NAS100','SP500','DOW30','DAX40','FTSE100'],
    stocks:      ['AAPL','TSLA','NVDA','META','AMZN'],
  }
  // Broker Deriv → favoriser les synthétiques
  if (broker === 'deriv') return map.synthetic
  return map[type] ?? map.forex
}
