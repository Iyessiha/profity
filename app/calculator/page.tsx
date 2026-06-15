'use client'
// ============================================================
// PROFITYX — /calculator : Calculateur de position Pro
// ============================================================
import { useState, useEffect, useCallback } from 'react'
import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'
import { supabasePublic } from '@/lib/supabase'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

// ─── PAIRES & PIP VALUES ─────────────────────────────────────
const PAIRS = [
  // Forex
  { label:'EUR/USD',  group:'Forex',    pipSize:0.0001, pipValuePerLot:10,    contractSize:100000 },
  { label:'GBP/USD',  group:'Forex',    pipSize:0.0001, pipValuePerLot:10,    contractSize:100000 },
  { label:'USD/JPY',  group:'Forex',    pipSize:0.01,   pipValuePerLot:9.1,   contractSize:100000 },
  { label:'EUR/JPY',  group:'Forex',    pipSize:0.01,   pipValuePerLot:9.1,   contractSize:100000 },
  { label:'GBP/JPY',  group:'Forex',    pipSize:0.01,   pipValuePerLot:9.1,   contractSize:100000 },
  { label:'AUD/USD',  group:'Forex',    pipSize:0.0001, pipValuePerLot:10,    contractSize:100000 },
  { label:'USD/CAD',  group:'Forex',    pipSize:0.0001, pipValuePerLot:7.5,   contractSize:100000 },
  { label:'USD/CHF',  group:'Forex',    pipSize:0.0001, pipValuePerLot:11,    contractSize:100000 },
  { label:'NZD/USD',  group:'Forex',    pipSize:0.0001, pipValuePerLot:10,    contractSize:100000 },
  // Matières premières
  { label:'XAU/USD',  group:'Matières',  pipSize:0.01,   pipValuePerLot:1,    contractSize:100   },
  { label:'XAG/USD',  group:'Matières',  pipSize:0.001,  pipValuePerLot:5,    contractSize:5000  },
  { label:'USOIL',    group:'Matières',  pipSize:0.01,   pipValuePerLot:10,   contractSize:1000  },
  // Indices Synthétiques
  { label:'Boom 1000',     group:'Indices Synthétiques', pipSize:0.001, pipValuePerLot:1,    contractSize:1     },
  { label:'Boom 500',      group:'Indices Synthétiques', pipSize:0.001, pipValuePerLot:1,    contractSize:1     },
  { label:'Crash 1000',    group:'Indices Synthétiques', pipSize:0.001, pipValuePerLot:1,    contractSize:1     },
  { label:'Crash 500',     group:'Indices Synthétiques', pipSize:0.001, pipValuePerLot:1,    contractSize:1     },
  { label:'Volatility 75', group:'Indices Synthétiques', pipSize:0.001, pipValuePerLot:1,    contractSize:1     },
  { label:'Volatility 25', group:'Indices Synthétiques', pipSize:0.001, pipValuePerLot:1,    contractSize:1     },
  { label:'Volatility 10', group:'Indices Synthétiques', pipSize:0.001, pipValuePerLot:1,    contractSize:1     },
  { label:'Step Index',    group:'Indices Synthétiques', pipSize:0.001, pipValuePerLot:1,    contractSize:1     },
  // Crypto
  { label:'BTC/USD',  group:'Crypto',   pipSize:1,      pipValuePerLot:1,    contractSize:1     },
  { label:'ETH/USD',  group:'Crypto',   pipSize:0.01,   pipValuePerLot:1,    contractSize:1     },
  // Weltrade SyntX — FX Vol. (réplique Forex, volatilité annuelle fixe)
  { label:'FX Vol. 20',   group:'Weltrade SyntX', pipSize:0.00001, pipValuePerLot:10, contractSize:100000 },
  { label:'FX Vol. 50',   group:'Weltrade SyntX', pipSize:0.00001, pipValuePerLot:10, contractSize:100000 },
  { label:'FX Vol. 75',   group:'Weltrade SyntX', pipSize:0.00001, pipValuePerLot:10, contractSize:100000 },
  { label:'FX Vol. 99',   group:'Weltrade SyntX', pipSize:0.00001, pipValuePerLot:10, contractSize:100000 },
  // Weltrade SyntX — SFX Vol. (FX Vol. + spikes toutes les 30 min)
  { label:'SFX Vol. 20',  group:'Weltrade SyntX', pipSize:0.00001, pipValuePerLot:10, contractSize:100000 },
  { label:'SFX Vol. 50',  group:'Weltrade SyntX', pipSize:0.00001, pipValuePerLot:10, contractSize:100000 },
  { label:'SFX Vol. 75',  group:'Weltrade SyntX', pipSize:0.00001, pipValuePerLot:10, contractSize:100000 },
  { label:'SFX Vol. 99',  group:'Weltrade SyntX', pipSize:0.00001, pipValuePerLot:10, contractSize:100000 },
  // Weltrade SyntX — PainX (prix monte en continu, chute périodique)
  { label:'PainX 400',    group:'Weltrade SyntX', pipSize:0.01, pipValuePerLot:1, contractSize:1 },
  { label:'PainX 800',    group:'Weltrade SyntX', pipSize:0.01, pipValuePerLot:1, contractSize:1 },
  { label:'PainX 999',    group:'Weltrade SyntX', pipSize:0.01, pipValuePerLot:1, contractSize:1 },
  { label:'PainX 1200',   group:'Weltrade SyntX', pipSize:0.01, pipValuePerLot:1, contractSize:1 },
  // Weltrade SyntX — GainX (prix descend en continu, saut périodique)
  { label:'GainX 400',    group:'Weltrade SyntX', pipSize:0.01, pipValuePerLot:1, contractSize:1 },
  { label:'GainX 800',    group:'Weltrade SyntX', pipSize:0.01, pipValuePerLot:1, contractSize:1 },
  { label:'GainX 999',    group:'Weltrade SyntX', pipSize:0.01, pipValuePerLot:1, contractSize:1 },
  { label:'GainX 1200',   group:'Weltrade SyntX', pipSize:0.01, pipValuePerLot:1, contractSize:1 },
  // Weltrade SyntX — FlipX (50/50 direction, pas fixe)
  { label:'FlipX',        group:'Weltrade SyntX', pipSize:0.01, pipValuePerLot:1, contractSize:1 },
  // Weltrade SyntX — SwitchX (alterne PainX ↔ GainX)
  { label:'SwitchX 600',  group:'Weltrade SyntX', pipSize:0.01, pipValuePerLot:1, contractSize:1 },
  { label:'SwitchX 1200', group:'Weltrade SyntX', pipSize:0.01, pipValuePerLot:1, contractSize:1 },
  { label:'SwitchX 1800', group:'Weltrade SyntX', pipSize:0.01, pipValuePerLot:1, contractSize:1 },
  // Weltrade SyntX — BreakX (GainX qui change de comportement sur gros saut)
  { label:'BreakX 600',   group:'Weltrade SyntX', pipSize:0.01, pipValuePerLot:1, contractSize:1 },
  { label:'BreakX 1200',  group:'Weltrade SyntX', pipSize:0.01, pipValuePerLot:1, contractSize:1 },
]

const CURRENCIES = [
  { code:'USD', symbol:'$',  rate:1       },
  { code:'XOF', symbol:'₣', rate:655.96  },
  { code:'XAF', symbol:'₣', rate:655.96  },
  { code:'EUR', symbol:'€',  rate:0.92   },
  { code:'GHS', symbol:'₵',  rate:15.2   },
  { code:'NGN', symbol:'₦',  rate:1600   },
]

function fmt(n:number, dec=2) {
  if (!isFinite(n) || isNaN(n)) return '—'
  return n.toLocaleString('fr-FR', { minimumFractionDigits:dec, maximumFractionDigits:dec })
}

export default function CalculatorPage() {
  const [balance,    setBalance]    = useState(500)
  const [currency,   setCurrency]   = useState('USD')
  const [riskPct,    setRiskPct]    = useState(1)
  const [pair,       setPair]       = useState(PAIRS[0])
  const [direction,  setDirection]  = useState<'LONG'|'SHORT'>('LONG')
  const [entry,      setEntry]      = useState('')
  const [sl,         setSl]         = useState('')
  const [tp,         setTp]         = useState('')
  const [copied,     setCopied]     = useState(false)

  // Profil pour TopBar (navigation mobile)
  const [profile, setProfile] = useState<Record<string,unknown>|null>(null)
  const [locale,  setLocale]  = useState('fr')


  useEffect(() => {
    supabasePublic.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return
      supabasePublic.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => { if (data) { setProfile(data); setLocale((data.locale as string) || 'fr') } })
    })
  }, [])

  // Résultats calculés
  const [result, setResult] = useState({
    riskAmount: 0, lotSize: 0, slPips: 0,
    tpPips: 0, potentialGain: 0, rr: 0, pipValue: 0,
  })

  const calculate = useCallback(() => {
    const cur    = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES[0]
    const balUSD = balance / cur.rate
    const riskUSD = balUSD * (riskPct / 100)
    const entryN  = parseFloat(entry)
    const slN     = parseFloat(sl)
    const tpN     = parseFloat(tp)

    if (!entryN || !slN || entryN === slN) {
      setResult(r => ({ ...r, riskAmount: riskUSD * cur.rate }))
      return
    }

    const slDiff  = Math.abs(entryN - slN)
    const slPips  = slDiff / pair.pipSize
    const pipVal  = pair.pipValuePerLot   // $ par pip par lot standard
    const lotSize = riskUSD / (slPips * pipVal)

    let tpPips = 0, potentialGain = 0, rr = 0
    if (tpN && tpN !== entryN) {
      const tpDiff = Math.abs(tpN - entryN)
      tpPips       = tpDiff / pair.pipSize
      potentialGain = lotSize * tpPips * pipVal * cur.rate
      rr            = tpPips / slPips
    }

    setResult({
      riskAmount:    riskUSD * cur.rate,
      lotSize:       Math.max(0, lotSize),
      slPips,
      tpPips,
      potentialGain,
      rr,
      pipValue:      lotSize * pipVal * cur.rate,
    })
  }, [balance, currency, riskPct, pair, entry, sl, tp])

  useEffect(() => { calculate() }, [calculate])

  const cur = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES[0]
  const isValid = result.lotSize > 0 && isFinite(result.lotSize)

  const groups = [...new Set(PAIRS.map(p => p.group))]


  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg0)', color:'var(--tx0)', fontFamily:BODY }}>
      <Sidebar active="calculator" />
      <main style={{ flex:1, padding:'1.5rem 1rem', maxWidth:640, margin:'0 auto', width:'100%' }}>
        <TopBar locale={locale} profile={profile} />

        {/* Header */}
        <div style={{ marginBottom:'1.5rem' }}>
          <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:3, color:'var(--ac2)', marginBottom:4 }}>MODULE</div>
          <h1 style={{ fontFamily:HUD, fontSize:'clamp(18px,4vw,26px)', fontWeight:900, color:'var(--tx0)', marginBottom:4 }}>
            CALC<span style={{ color:'var(--ac)' }}>ULATEUR</span>
          </h1>
          <div style={{ fontFamily:BODY, fontSize:13, color:'var(--tx3)' }}>Taille de position · Risk management · R/R</div>
        </div>

        {/* Bloc : Compte */}
        <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.25rem', marginBottom:'1rem' }}>
          <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'var(--ac2)', marginBottom:'1rem' }}>COMPTE</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10, marginBottom:'1rem' }}>
            <div>
              <label style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)', display:'block', marginBottom:5 }}>SOLDE</label>
              <input type="number" value={balance} onChange={e=>setBalance(parseFloat(e.target.value)||0)}
                style={{ width:'100%', background:'var(--bg0)', border:'1px solid var(--bd)', borderRadius:6, padding:'10px 12px', color:'var(--tx0)', fontFamily:HUD, fontSize:14, outline:'none' }} />
            </div>
            <div>
              <label style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)', display:'block', marginBottom:5 }}>DEVISE</label>
              <select value={currency} onChange={e=>setCurrency(e.target.value)}
                style={{ background:'var(--bg0)', border:'1px solid var(--bd)', borderRadius:6, padding:'10px 12px', color:'var(--tx0)', fontFamily:HUD, fontSize:12, outline:'none', height:42 }}>
                {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            </div>
          </div>

          {/* Slider risque */}
          <label style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)', display:'block', marginBottom:8 }}>
            RISQUE PAR TRADE
          </label>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <input type="range" min={0.25} max={5} step={0.25} value={riskPct}
              onChange={e=>setRiskPct(parseFloat(e.target.value))}
              style={{ flex:1, accentColor:'var(--ac)', height:4 }} />
            <div style={{ fontFamily:HUD, fontSize:18, fontWeight:900, color:riskPct>=3?'#FF3A5C':riskPct>=2?'#C9A84C':'var(--ac)', minWidth:50, textAlign:'right' }}>
              {riskPct}%
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
            {[0.5,1,2,3,5].map(v=>(
              <button key={v} onClick={()=>setRiskPct(v)}
                style={{ background:riskPct===v?'rgba(0,255,178,0.1)':'transparent', border:`1px solid ${riskPct===v?'var(--ac)':'var(--bd)'}`, borderRadius:4, padding:'3px 8px', color:riskPct===v?'var(--ac)':'var(--tx3)', fontFamily:HUD, fontSize:7, cursor:'pointer' }}>
                {v}%
              </button>
            ))}
          </div>
          <div style={{ marginTop:8, fontFamily:BODY, fontSize:12, color:'var(--tx3)', textAlign:'right' }}>
            Montant risqué : <strong style={{ color:riskPct>=3?'#FF3A5C':'var(--ac)' }}>{cur.symbol}{fmt(result.riskAmount)}</strong>
          </div>
        </div>

        {/* Bloc : Signal */}
        <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.25rem', marginBottom:'1rem' }}>
          <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'var(--ac2)', marginBottom:'1rem' }}>SIGNAL</div>

          {/* Paire + Direction */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10, marginBottom:'1rem' }}>
            <div>
              <label style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)', display:'block', marginBottom:5 }}>PAIRE</label>
              <select value={pair.label} onChange={e=>setPair(PAIRS.find(p=>p.label===e.target.value)??PAIRS[0])}
                style={{ width:'100%', background:'var(--bg0)', border:'1px solid var(--bd)', borderRadius:6, padding:'10px 12px', color:'var(--tx0)', fontFamily:HUD, fontSize:11, outline:'none' }}>
                {groups.map(g=>(
                  <optgroup key={g} label={g}>
                    {PAIRS.filter(p=>p.group===g).map(p=>(
                      <option key={p.label} value={p.label}>{p.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)', display:'block', marginBottom:5 }}>DIRECTION</label>
              <div style={{ display:'flex', height:42 }}>
                {(['LONG','SHORT'] as const).map(d=>(
                  <button key={d} onClick={()=>setDirection(d)}
                    style={{ flex:1, border:'1px solid '+(direction===d?(d==='LONG'?'rgba(0,255,178,0.5)':'rgba(255,58,92,0.5)'):'var(--bd)'), background:direction===d?(d==='LONG'?'rgba(0,255,178,0.1)':'rgba(255,58,92,0.1)'):'transparent', color:direction===d?(d==='LONG'?'#00FFB2':'#FF3A5C'):'var(--tx3)', fontFamily:HUD, fontSize:8, cursor:'pointer', borderRadius:d==='LONG'?'6px 0 0 6px':'0 6px 6px 0' }}>
                    {d==='LONG'?'▲ LONG':'▼ SHORT'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Prix */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            {[
              { label:'ENTRÉE',    val:entry, set:setEntry, color:'var(--tx0)' },
              { label:'STOP LOSS', val:sl,    set:setSl,    color:'#FF3A5C'    },
              { label:'TP1 (OPT)',  val:tp,    set:setTp,    color:'#00FFB2'    },
            ].map(f=>(
              <div key={f.label}>
                <label style={{ fontFamily:HUD, fontSize:6, letterSpacing:1, color:f.color, display:'block', marginBottom:5, opacity:.8 }}>{f.label}</label>
                <input type="number" value={f.val} onChange={e=>f.set(e.target.value)}
                  placeholder="0.00" step="any"
                  style={{ width:'100%', background:'var(--bg0)', border:`1px solid ${f.label==='STOP LOSS'?'rgba(255,58,92,0.2)':f.label.startsWith('TP')?'rgba(0,255,178,0.2)':'var(--bd)'}`, borderRadius:6, padding:'10px 8px', color:f.color, fontFamily:HUD, fontSize:12, outline:'none', textAlign:'center' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Résultats */}
        <div style={{ background: isValid ? 'linear-gradient(135deg,rgba(0,255,178,0.06),rgba(0,212,255,0.03))' : 'var(--bg1)', border:`1px solid ${isValid?'rgba(0,255,178,0.25)':'var(--bd)'}`, borderRadius:10, overflow:'hidden', marginBottom:'1rem' }}>
          <div style={{ height:2, background: isValid ? 'linear-gradient(90deg,transparent,var(--ac),transparent)' : 'transparent' }} />
          <div style={{ padding:'1.25rem' }}>
            <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color: isValid?'var(--ac)':'var(--tx3)', marginBottom:'1.25rem' }}>RÉSULTAT</div>

            {/* Lot Size — valeur principale */}
            <div style={{ textAlign:'center', marginBottom:'1.5rem', padding:'1rem', background:'var(--bg1)', borderRadius:8 }}>
              <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'var(--tx3)', marginBottom:6 }}>TAILLE DE POSITION</div>
              <div style={{ fontFamily:HUD, fontSize:52, fontWeight:900, color: isValid?'var(--ac)':'var(--tx3)', lineHeight:1, letterSpacing:-1 }}>
                {isValid ? result.lotSize.toFixed(result.lotSize < 0.01 ? 4 : 2) : '—'}
              </div>
              <div style={{ fontFamily:HUD, fontSize:10, color:'var(--tx3)', marginTop:4 }}>LOTS</div>
              {isValid && (
                <button onClick={()=>{
                  navigator.clipboard.writeText(result.lotSize.toFixed(result.lotSize < 0.01 ? 4 : 2))
                  setCopied(true); setTimeout(()=>setCopied(false),2000)
                }} style={{ marginTop:10, background:'rgba(0,255,178,0.08)', border:'1px solid rgba(0,255,178,0.2)', borderRadius:4, padding:'6px 16px', color:'var(--ac)', fontFamily:HUD, fontSize:7, letterSpacing:1, cursor:'pointer' }}>
                  {copied ? '✅ COPIÉ' : '📋 COPIER'}
                </button>
              )}
            </div>

            {/* Métriques secondaires */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[
                { label:'PIPS SL',         val: isValid ? fmt(result.slPips,0)+' pips' : '—',                     color:'#FF3A5C' },
                { label:'VALEUR DU PIP',   val: isValid ? cur.symbol+fmt(result.pipValue,0) : '—',                 color:'var(--tx2)' },
                { label:'MONTANT RISQUÉ',  val: isValid ? cur.symbol+fmt(result.riskAmount) : cur.symbol+fmt(result.riskAmount), color:'#FF8800' },
                { label:'PIPS TP1',        val: isValid && result.tpPips > 0 ? fmt(result.tpPips,0)+' pips' : '—', color:'#00FFB2' },
                { label:'GAIN POTENTIEL',  val: isValid && result.potentialGain > 0 ? cur.symbol+fmt(result.potentialGain) : '—', color:'#00FFB2' },
                { label:'RATIO R/R',       val: isValid && result.rr > 0 ? '1 : '+fmt(result.rr) : '—',            color: result.rr >= 2 ? '#00FFB2' : result.rr >= 1 ? '#C9A84C' : '#FF3A5C' },
              ].map(m=>(
                <div key={m.label} style={{ background:'var(--bg1)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:7, padding:'10px 12px' }}>
                  <div style={{ fontFamily:HUD, fontSize:6, letterSpacing:1, color:'var(--tx3)', marginBottom:4 }}>{m.label}</div>
                  <div style={{ fontFamily:HUD, fontSize:14, fontWeight:700, color:m.color }}>{m.val}</div>
                </div>
              ))}
            </div>

            {/* Avertissement R/R */}
            {isValid && result.rr > 0 && result.rr < 1 && (
              <div style={{ marginTop:10, background:'rgba(255,58,92,0.05)', border:'1px solid rgba(255,58,92,0.2)', borderRadius:6, padding:'8px 12px', fontFamily:BODY, fontSize:12, color:'#FF3A5C' }}>
                ⚠️ Ratio R/R insuffisant — vise minimum 1:1.5 pour être profitable long terme
              </div>
            )}
            {isValid && result.rr >= 2 && (
              <div style={{ marginTop:10, background:'rgba(0,255,178,0.05)', border:'1px solid rgba(0,255,178,0.15)', borderRadius:6, padding:'8px 12px', fontFamily:BODY, fontSize:12, color:'#00FFB2' }}>
                ✅ Excellent ratio R/R — signal validé par l'IA ProfityX
              </div>
            )}
          </div>
        </div>

        {/* Règles de risk management */}
        <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.25rem', marginBottom:'1.5rem' }}>
          <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'var(--ac2)', marginBottom:'1rem' }}>RÈGLES PRO</div>
          <div style={{ display:'grid', gap:8 }}>
            {[
              { icon:'🎯', rule:'Ne risquez jamais plus de 1-2% par trade',               ok: riskPct <= 2 },
              { icon:'⚖️', rule:'Visez un ratio R/R minimum de 1:1.5',                   ok: result.rr === 0 || result.rr >= 1.5 },
              { icon:'📊', rule:'Ne tradez pas plus de 3-5 positions simultanément',      ok: true },
              { icon:'🧠', rule:'Placez toujours votre SL avant d\'entrer en position',   ok: !!sl },
            ].map(r=>(
              <div key={r.rule} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                <span style={{ fontSize:14, flexShrink:0 }}>{r.icon}</span>
                <span style={{ fontFamily:BODY, fontSize:13, color: r.ok ? 'var(--tx2)' : 'rgba(255,58,92,0.7)', lineHeight:1.4 }}>{r.rule}</span>
                <span style={{ marginLeft:'auto', flexShrink:0 }}>{r.ok ? '✅' : '⚠️'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA vers analyse */}
        <a href="/analysis" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', background:'var(--bg1)', border:'1px solid var(--bd2)', borderRadius:8, padding:'14px', textDecoration:'none', color:'var(--ac2)', fontFamily:HUD, fontSize:9, letterSpacing:2 }}>
          <i className="ti ti-brain" style={{ fontSize:16 }} />
          ANALYSER UN CHART AVEC L'IA →
        </a>

        <div style={{ height:'2rem' }} />
      </main>
    </div>
  )
}
