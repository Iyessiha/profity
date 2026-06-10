'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

interface SymbolPrice {
  symbol: string; name: string; category: string; flag: string
  price: number | null; prev: number | null
}

type Category = 'Boom/Crash' | 'Volatility' | 'Step/Jump' | 'Forex' | 'Commodités' | 'Crypto'

const CATEGORIES: { key: Category; label: string }[] = [
  { key:'Boom/Crash',  label:'B/C'   },
  { key:'Volatility',  label:'VOL'   },
  { key:'Step/Jump',   label:'STEP'  },
  { key:'Forex',       label:'FX'    },
  { key:'Commodités',  label:'COM'   },
  { key:'Crypto',      label:'CRYPTO'},
]

const ALL: Record<string, { name:string; category:Category; flag:string }> = {
  // Boom/Crash
  BOOM1000:  { name:'Boom 1000',    category:'Boom/Crash', flag:'📈' },
  BOOM500:   { name:'Boom 500',     category:'Boom/Crash', flag:'📈' },
  BOOM300N:  { name:'Boom 300',     category:'Boom/Crash', flag:'📈' },
  CRASH1000: { name:'Crash 1000',   category:'Boom/Crash', flag:'📉' },
  CRASH500:  { name:'Crash 500',    category:'Boom/Crash', flag:'📉' },
  CRASH300N: { name:'Crash 300',    category:'Boom/Crash', flag:'📉' },
  // Volatility
  R_10:      { name:'Volatility 10',  category:'Volatility', flag:'〰️' },
  R_25:      { name:'Volatility 25',  category:'Volatility', flag:'〰️' },
  R_50:      { name:'Volatility 50',  category:'Volatility', flag:'〰️' },
  R_75:      { name:'Volatility 75',  category:'Volatility', flag:'〰️' },
  R_100:     { name:'Volatility 100', category:'Volatility', flag:'〰️' },
  // Step / Jump
  STPRNG:    { name:'Step Index',  category:'Step/Jump', flag:'📊' },
  JD25:      { name:'Jump 25',     category:'Step/Jump', flag:'⚡' },
  JD50:      { name:'Jump 50',     category:'Step/Jump', flag:'⚡' },
  JD75:      { name:'Jump 75',     category:'Step/Jump', flag:'⚡' },
  JD100:     { name:'Jump 100',    category:'Step/Jump', flag:'⚡' },
  // Forex
  frxEURUSD: { name:'EUR/USD', category:'Forex', flag:'🇪🇺' },
  frxGBPUSD: { name:'GBP/USD', category:'Forex', flag:'🇬🇧' },
  frxUSDJPY: { name:'USD/JPY', category:'Forex', flag:'🇯🇵' },
  frxUSDCHF: { name:'USD/CHF', category:'Forex', flag:'🇨🇭' },
  frxAUDUSD: { name:'AUD/USD', category:'Forex', flag:'🇦🇺' },
  frxUSDCAD: { name:'USD/CAD', category:'Forex', flag:'🇨🇦' },
  frxEURGBP: { name:'EUR/GBP', category:'Forex', flag:'🇪🇺' },
  frxEURJPY: { name:'EUR/JPY', category:'Forex', flag:'🇯🇵' },
  frxGBPJPY: { name:'GBP/JPY', category:'Forex', flag:'🇬🇧' },
  frxXAUUSD: { name:'Or (XAU/USD)', category:'Forex', flag:'🥇' },
  // Commodités
  frxXAGUSD: { name:'Argent (XAG)', category:'Commodités', flag:'🥈' },
  frxBROUSD: { name:'Brent (OIL)',  category:'Commodités', flag:'🛢️' },
  // Crypto
  cryBTCUSD: { name:'Bitcoin',  category:'Crypto', flag:'₿'  },
  cryETHUSD: { name:'Ethereum', category:'Crypto', flag:'⟠'  },
  cryBNBUSD: { name:'BNB',      category:'Crypto', flag:'🔶' },
  cryXRPUSD: { name:'XRP',      category:'Crypto', flag:'✕'  },
  crySOLUSD: { name:'Solana',   category:'Crypto', flag:'◎'  },
  cryLTCUSD: { name:'Litecoin', category:'Crypto', flag:'Ł'  },
}

function fmt(p: number | null, sym: string) {
  if (p == null) return '—'
  // Crypto et synthétiques à grande valeur
  if (sym.startsWith('cry') || sym.startsWith('BOOM') || sym.startsWith('CRASH') || p > 1000)
    return p.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
  if (p >= 100) return p.toLocaleString('fr-FR', { maximumFractionDigits: 3 })
  return p.toLocaleString('fr-FR', { maximumFractionDigits: 5 })
}

function pct(curr: number | null, prev: number | null) {
  if (!curr || !prev || prev === 0) return null
  return ((curr - prev) / prev) * 100
}

export default function DerivWidget() {
  const [prices, setPrices]   = useState<Record<string, SymbolPrice>>(() => {
    const r: Record<string,SymbolPrice> = {}
    Object.entries(ALL).forEach(([s,m]) => { r[s]={ symbol:s, ...m, price:null, prev:null } })
    return r
  })
  const [cat, setCat]         = useState<Category>('Boom/Crash')
  const [loading, setLoading] = useState(true)
  const [flash, setFlash]     = useState<Record<string,'up'|'down'>>({})
  const [ts, setTs]           = useState<string>('')
  const prev = useRef<Record<string,number>>({})

  const refresh = useCallback(async () => {
    const syms = Object.keys(ALL).join(',')
    try {
      const j = await fetch(`/api/deriv/prices?symbols=${syms}`).then(r=>r.json())
      if (!j.success) return
      const nf: Record<string,'up'|'down'> = {}
      setPrices(p => {
        const n = {...p}
        Object.entries(j.prices as Record<string,number|null>).forEach(([s,price]) => {
          if (price == null) return
          const old = prev.current[s]
          if (old && price !== old) nf[s] = price > old ? 'up' : 'down'
          prev.current[s] = price
          n[s] = { ...n[s], price, prev: old ?? null }
        })
        return n
      })
      setFlash(nf)
      setTimeout(()=>setFlash({}), 900)
      setTs(new Date().toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit',second:'2-digit'}))
      setLoading(false)
    } catch {}
  }, [])

  useEffect(() => { refresh(); const iv = setInterval(refresh, 4000); return ()=>clearInterval(iv) }, [refresh])

  const shown = Object.values(prices).filter(p => p.category === cat)

  return (
    <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:12, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--bd)',
        display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background: loading ? '#C9A84C' : '#00FFB2',
            boxShadow: loading ? '0 0 5px #C9A84C' : '0 0 6px #00FFB2' }} />
          <span style={{ fontFamily:HUD, fontSize:10, letterSpacing:2, color:'var(--tx0)' }}>PRIX DERIV LIVE</span>
          {ts && <span style={{ fontFamily:BODY, fontSize:10, color:'var(--tx3)' }}>{ts}</span>}
        </div>
        {/* Tabs */}
        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
          {CATEGORIES.map(({key,label}) => (
            <button key={key} onClick={()=>setCat(key)}
              style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, padding:'4px 8px', borderRadius:4,
                cursor:'pointer', transition:'all .15s',
                background: cat===key ? 'rgba(0,255,178,0.1)' : 'transparent',
                border:`1px solid ${cat===key ? 'rgba(0,255,178,0.3)' : 'rgba(255,255,255,0.07)'}`,
                color: cat===key ? '#00FFB2' : 'var(--tx3)' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Lignes de prix */}
      <div>
        {loading ? (
          <div style={{ padding:'2rem', textAlign:'center', fontFamily:BODY, fontSize:13, color:'var(--tx3)' }}>
            Connexion Indices Synthétiques…
          </div>
        ) : shown.map(item => {
          const change  = pct(item.price, item.prev)
          const f       = flash[item.symbol]
          const isUp    = f === 'up'
          const isDown  = f === 'down'
          const priceColor = isUp ? '#00FFB2' : isDown ? '#FF3A5C' : 'var(--tx0)'
          return (
            <div key={item.symbol}
              style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'9px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)',
                background: isUp ? 'rgba(0,255,178,0.05)' : isDown ? 'rgba(255,58,92,0.05)' : 'transparent',
                transition:'background .4s' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:14, width:20, textAlign:'center' }}>{item.flag}</span>
                <div>
                  <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:1, color:'var(--tx0)' }}>
                    {item.name}
                  </div>
                  <div style={{ fontFamily:BODY, fontSize:9, color:'var(--tx3)', letterSpacing:0.5 }}>
                    {item.symbol}
                  </div>
                </div>
              </div>
              <div style={{ textAlign:'right', minWidth:100 }}>
                <div style={{ fontFamily:HUD, fontSize:13, fontWeight:900,
                  color: priceColor, transition:'color .4s' }}>
                  {fmt(item.price, item.symbol)}
                </div>
                {change != null && (
                  <div style={{ fontFamily:BODY, fontSize:10,
                    color: change > 0 ? '#00E676' : change < 0 ? '#FF3A5C' : 'var(--tx3)' }}>
                    {change > 0 ? '▲' : '▼'} {Math.abs(change).toFixed(4)}%
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ padding:'7px 16px', display:'flex', alignItems:'center',
        justifyContent:'space-between', borderTop:'1px solid var(--bd)' }}>
        <span style={{ fontFamily:BODY, fontSize:10, color:'var(--tx3)' }}>
          Toutes les 4s · {Object.values(prices).filter(p=>p.price!=null).length} actifs connectés
        </span>
        <a href="https://deriv.com" target="_blank" rel="noopener noreferrer"
          style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'rgba(0,212,255,0.5)', textDecoration:'none' }}>
          DERIV.COM ↗
        </a>
      </div>
    </div>
  )
}
