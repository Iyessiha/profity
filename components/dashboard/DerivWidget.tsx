// ============================================================
// PROFITYX — DerivWidget : prix live des synthétiques
// ============================================================
'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

interface SymbolPrice {
  symbol:   string
  name:     string
  category: string
  flag:     string
  price:    number | null
  prev:     number | null
  change:   number | null   // % depuis dernier tick
}

const CATEGORIES = ['Boom/Crash', 'Volatility', 'Jump', 'Step']

const ALL_SYMBOLS: Record<string, { name:string; category:string; flag:string }> = {
  BOOM1000:  { name:'Boom 1000',    category:'Boom/Crash', flag:'📈' },
  BOOM500:   { name:'Boom 500',     category:'Boom/Crash', flag:'📈' },
  CRASH1000: { name:'Crash 1000',   category:'Boom/Crash', flag:'📉' },
  CRASH500:  { name:'Crash 500',    category:'Boom/Crash', flag:'📉' },
  R_50:      { name:'Volatility 50', category:'Volatility', flag:'〰️' },
  R_75:      { name:'Volatility 75', category:'Volatility', flag:'〰️' },
  R_100:     { name:'Volatility 100',category:'Volatility', flag:'〰️' },
  STPRNG:    { name:'Step Index',    category:'Step',       flag:'📊' },
  JD25:      { name:'Jump 25',       category:'Jump',       flag:'⚡' },
  JD50:      { name:'Jump 50',       category:'Jump',       flag:'⚡' },
  JD100:     { name:'Jump 100',      category:'Jump',       flag:'⚡' },
}

function fmtPrice(p: number | null) {
  if (p == null) return '—'
  if (p >= 10000) return p.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
  if (p >= 100)   return p.toLocaleString('fr-FR', { maximumFractionDigits: 3 })
  return p.toLocaleString('fr-FR', { maximumFractionDigits: 5 })
}

export default function DerivWidget() {
  const [prices, setPrices]     = useState<Record<string,SymbolPrice>>(() => {
    const init: Record<string,SymbolPrice> = {}
    Object.entries(ALL_SYMBOLS).forEach(([sym, meta]) => {
      init[sym] = { symbol:sym, ...meta, price:null, prev:null, change:null }
    })
    return init
  })
  const [loading, setLoading]   = useState(true)
  const [category, setCategory] = useState<string>('Boom/Crash')
  const [lastUpdate, setLastUpdate] = useState<Date|null>(null)
  const [flash, setFlash]       = useState<Record<string, 'up'|'down'|null>>({})
  const prevPrices = useRef<Record<string,number>>({})

  const fetchPrices = useCallback(async () => {
    const symbols = Object.keys(ALL_SYMBOLS).join(',')
    try {
      const res  = await fetch(`/api/deriv/prices?symbols=${symbols}`)
      const json = await res.json()
      if (!json.success) return

      const newFlash: Record<string,'up'|'down'|null> = {}
      setPrices(prev => {
        const next = { ...prev }
        Object.entries(json.prices as Record<string, number | null>).forEach(([sym, price]) => {
          if (price == null) return
          const prevPrice = prevPrices.current[sym]
          const change = prevPrice ? ((price - prevPrice) / prevPrice) * 100 : null
          next[sym] = { ...next[sym], price, prev: prevPrice ?? null, change }
          if (prevPrice && price !== prevPrice) {
            newFlash[sym] = price > prevPrice ? 'up' : 'down'
          }
          prevPrices.current[sym] = price
        })
        return next
      })

      // Flash effect
      setFlash(newFlash)
      setTimeout(() => setFlash({}), 800)
      setLastUpdate(new Date())
      setLoading(false)
    } catch {}
  }, [])

  useEffect(() => {
    fetchPrices()
    const iv = setInterval(fetchPrices, 4000)
    return () => clearInterval(iv)
  }, [fetchPrices])

  const displayed = Object.values(prices).filter(p => p.category === category)

  return (
    <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:12, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--bd)',
        display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#00FFB2',
            boxShadow:'0 0 6px #00FFB2', animation: loading?'none':'pulse 2s ease infinite' }} />
          <span style={{ fontFamily:HUD, fontSize:10, letterSpacing:2, color:'var(--tx0)' }}>PRIX DERIV LIVE</span>
          {!loading && lastUpdate && (
            <span style={{ fontFamily:BODY, fontSize:10, color:'var(--tx3)' }}>
              {lastUpdate.toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit',second:'2-digit'})}
            </span>
          )}
        </div>
        {/* Tabs catégories */}
        <div style={{ display:'flex', gap:4 }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, padding:'4px 10px', borderRadius:4,
                cursor:'pointer', transition:'all .15s',
                background: category===cat ? 'rgba(0,255,178,0.1)' : 'transparent',
                border: `1px solid ${category===cat ? 'rgba(0,255,178,0.3)' : 'rgba(255,255,255,0.07)'}`,
                color: category===cat ? '#00FFB2' : 'var(--tx3)' }}>
              {cat === 'Boom/Crash' ? 'B/C' : cat === 'Volatility' ? 'VOL' : cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des prix */}
      <div>
        {loading ? (
          <div style={{ padding:'2rem', textAlign:'center', fontFamily:BODY, fontSize:13, color:'var(--tx3)' }}>
            Connexion Deriv…
          </div>
        ) : displayed.map(item => {
          const isUp   = item.change != null && item.change > 0
          const isDown = item.change != null && item.change < 0
          const flashState = flash[item.symbol]
          return (
            <div key={item.symbol}
              style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)',
                transition:'background .3s',
                background: flashState==='up'   ? 'rgba(0,255,178,0.06)'
                          : flashState==='down' ? 'rgba(255,58,92,0.06)'
                          : 'transparent' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:14 }}>{item.flag}</span>
                <div>
                  <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:1, color:'var(--tx0)' }}>
                    {item.name}
                  </div>
                  <div style={{ fontFamily:BODY, fontSize:10, color:'var(--tx3)' }}>{item.symbol}</div>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:HUD, fontSize:13, fontWeight:900,
                  color: flashState==='up' ? '#00FFB2' : flashState==='down' ? '#FF3A5C' : 'var(--tx0)',
                  transition:'color .3s' }}>
                  {fmtPrice(item.price)}
                </div>
                {item.change != null && (
                  <div style={{ fontFamily:BODY, fontSize:10,
                    color: isUp ? '#00E676' : isDown ? '#FF3A5C' : 'var(--tx3)' }}>
                    {isUp ? '▲' : isDown ? '▼' : '—'} {Math.abs(item.change).toFixed(4)}%
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ padding:'7px 16px', display:'flex', alignItems:'center', justifyContent:'space-between',
        borderTop:'1px solid var(--bd)' }}>
        <span style={{ fontFamily:BODY, fontSize:10, color:'var(--tx3)' }}>
          Mise à jour toutes les 4s · Deriv API
        </span>
        <a href="https://deriv.com" target="_blank" rel="noopener noreferrer"
          style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'rgba(0,212,255,0.5)',
            textDecoration:'none' }}>DERIV.COM ↗</a>
      </div>
    </div>
  )
}
