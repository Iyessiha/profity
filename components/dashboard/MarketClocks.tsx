// ============================================================
// PROFITYX — MarketClocks : horloges des bourses mondiales
// ============================================================
'use client'
import { useState, useEffect } from 'react'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

interface Market {
  id:       string
  name:     string
  city:     string
  timezone: string   // IANA timezone
  open:     [number,number]  // [heure, minute] UTC
  close:    [number,number]  // [heure, minute] UTC
  days:     number[]  // 0=dim, 1=lun, ..., 6=sam
  color:    string
  icon:     string
  pairs:    string
}

const MARKETS: Market[] = [
  { id:'forex',  name:'FOREX',    city:'24/5',      timezone:'UTC',            open:[22,0],  close:[22,0],  days:[1,2,3,4,5], color:'#00FFB2', icon:'💱', pairs:'EUR/USD, GBP/USD...' },
  { id:'ny',     name:'NEW YORK', city:'NYSE/NASDAQ',timezone:'America/New_York', open:[14,30], close:[21,0],  days:[1,2,3,4,5], color:'#00D4FF', icon:'🗽', pairs:'SP500, NAS100, USD' },
  { id:'london', name:'LONDON',   city:'LSE',        timezone:'Europe/London',   open:[8,0],   close:[16,30], days:[1,2,3,4,5], color:'#C9A84C', icon:'🇬🇧', pairs:'GBP, EUR/GBP, FTSE' },
  { id:'tokyo',  name:'TOKYO',    city:'TSE',        timezone:'Asia/Tokyo',       open:[0,0],   close:[6,0],   days:[1,2,3,4,5], color:'#FF8800', icon:'🗼', pairs:'JPY, Nikkei 225' },
  { id:'sydney', name:'SYDNEY',   city:'ASX',        timezone:'Australia/Sydney', open:[22,0],  close:[5,0],   days:[0,1,2,3,4], color:'#FF3A5C', icon:'🦘', pairs:'AUD, ASX 200' },
  { id:'hk',     name:'HONG KONG',city:'HKEX',       timezone:'Asia/Hong_Kong',  open:[1,30],  close:[8,0],   days:[1,2,3,4,5], color:'#E040FB', icon:'🏙', pairs:'HKD, Hang Seng' },
  { id:'crypto', name:'CRYPTO',   city:'24/7',       timezone:'UTC',             open:[0,0],   close:[0,0],   days:[0,1,2,3,4,5,6], color:'#FFD700', icon:'₿', pairs:'BTC, ETH, SOL...' },
  { id:'deriv',  name:'DERIV',    city:'Synthétiques',timezone:'UTC',            open:[0,0],   close:[0,0],   days:[0,1,2,3,4,5,6], color:'#FF444F', icon:'📊', pairs:'VOL 75, VOL 99, Crash/Boom' },
]

function isMarketOpen(market: Market, now: Date): boolean {
  const day = now.getUTCDay()
  if (!market.days.includes(day)) return false

  // Crypto + Deriv + Forex sont spéciaux
  if (market.id === 'crypto' || market.id === 'deriv') return true
  if (market.id === 'forex') {
    // Forex ouvre dim 22h UTC, ferme ven 22h UTC
    if (day === 0) return now.getUTCHours() >= 22
    if (day === 6) return false
    return true
  }

  const h = now.getUTCHours() * 60 + now.getUTCMinutes()
  const open  = market.open[0]  * 60 + market.open[1]
  const close = market.close[0] * 60 + market.close[1]

  if (close < open) {
    // Marché qui passe minuit (Sydney, Tokyo)
    return h >= open || h < close
  }
  return h >= open && h < close
}

function getLocalTime(timezone: string): string {
  try {
    return new Date().toLocaleTimeString('fr-FR', { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return '--:--:--'
  }
}

function getTimeUntilEvent(market: Market, now: Date): string {
  if (market.id === 'crypto' || market.id === 'deriv' || market.id === 'forex') return ''
  const isOpen = isMarketOpen(market, now)
  const target = isOpen ? market.close : market.open
  const targetMinutes = target[0] * 60 + target[1]
  const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes()
  let diff = targetMinutes - currentMinutes
  if (diff < 0) diff += 24 * 60
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return `${isOpen ? 'Ferme dans' : 'Ouvre dans'} ${h}h${String(m).padStart(2,'0')}`
}

export default function MarketClocks({ locale = 'fr' }: { locale?: string }) {
  const [tick, setTick] = useState(0)
  const [now, setNow]   = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => { setNow(new Date()); setTick(t => t+1) }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ marginBottom:'1.25rem' }}>
      <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'var(--tx3)', marginBottom:10 }}>
        {locale === 'fr' ? 'MARCHÉS MONDIAUX' : 'GLOBAL MARKETS'}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:8 }}>
        {MARKETS.map(market => {
          const open = isMarketOpen(market, now)
          const time = getLocalTime(market.timezone)
          const until = getTimeUntilEvent(market, now)
          const is247 = market.id === 'crypto' || market.id === 'deriv' || market.id === 'forex'
          const c = market.color

          return (
            <div key={market.id} style={{ background:'var(--bg1)', border:`1px solid ${open ? c+'30' : 'var(--bd)'}`, borderRadius:8, padding:'0.75rem', position:'relative', overflow:'hidden', transition:'border-color .3s' }}>
              {/* Barre top colorée */}
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:open ? c : 'transparent', transition:'background .3s' }} />

              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ fontSize:13 }}>{market.icon}</span>
                  <span style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--tx0)' }}>{market.name}</span>
                </div>
                {/* Indicateur open/closed */}
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:open?c:'var(--tx3)', display:'inline-block', boxShadow:open?`0 0 6px ${c}`:'none', animation:open&&!is247?'pulse 2s infinite':undefined }} />
                  <span style={{ fontFamily:HUD, fontSize:6, letterSpacing:1, color:open?c:'var(--tx3)' }}>
                    {is247 ? '24/7' : open ? 'OUVERT' : 'FERMÉ'}
                  </span>
                </div>
              </div>

              {/* Horloge */}
              <div style={{ fontFamily:HUD, fontSize:17, fontWeight:900, color:open?c:'var(--tx2)', letterSpacing:1, lineHeight:1, marginBottom:4 }}>
                {time}
              </div>

              {/* Ville / sous-titre */}
              <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)', marginBottom: until ? 4 : 0 }}>{market.city}</div>

              {/* Temps avant ouverture/fermeture */}
              {until && (
                <div style={{ fontFamily:BODY, fontSize:10, color:open?'var(--tx2)':'var(--ora)', lineHeight:1.3 }}>{until}</div>
              )}

              {/* Paires actives */}
              <div style={{ marginTop:5, fontFamily:BODY, fontSize:10, color:'var(--tx3)', lineHeight:1.4 }}>{market.pairs}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
