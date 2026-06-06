'use client'
import { useState, useEffect } from 'react'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

interface Market { id:string; name:string; sub:string; tz:string; openUTC:[number,number]; closeUTC:[number,number]; days:number[]; pairs:string; is247?:boolean }

const MARKETS: Market[] = [
  { id:'forex',  name:'FOREX',     sub:'Lun–Ven 24h', tz:'UTC',               openUTC:[22,0], closeUTC:[22,0], days:[1,2,3,4,5], pairs:'EUR/USD · GBP/USD · XAU/USD', is247:false },
  { id:'ny',     name:'NEW YORK',  sub:'NYSE / NASDAQ',tz:'America/New_York',  openUTC:[14,30],closeUTC:[21,0], days:[1,2,3,4,5], pairs:'SP500 · NAS100 · USD' },
  { id:'london', name:'LONDON',    sub:'LSE',          tz:'Europe/London',      openUTC:[8,0],  closeUTC:[16,30],days:[1,2,3,4,5], pairs:'GBP · FTSE 100 · EUR/GBP' },
  { id:'tokyo',  name:'TOKYO',     sub:'TSE',          tz:'Asia/Tokyo',          openUTC:[0,0],  closeUTC:[6,0],  days:[1,2,3,4,5], pairs:'USD/JPY · Nikkei 225' },
  { id:'sydney', name:'SYDNEY',    sub:'ASX',          tz:'Australia/Sydney',   openUTC:[22,0], closeUTC:[5,0],  days:[0,1,2,3,4], pairs:'AUD/USD · ASX 200' },
  { id:'hk',     name:'HONG KONG', sub:'HKEX',         tz:'Asia/Hong_Kong',    openUTC:[1,30], closeUTC:[8,0],  days:[1,2,3,4,5], pairs:'USD/HKD · Hang Seng' },
  { id:'crypto', name:'CRYPTO',    sub:'24/7',          tz:'UTC',               openUTC:[0,0],  closeUTC:[0,0],  days:[0,1,2,3,4,5,6], pairs:'BTC · ETH · SOL · BNB', is247:true },
  { id:'deriv',  name:'DERIV',     sub:'Synthétiques 24/7', tz:'UTC',           openUTC:[0,0],  closeUTC:[0,0],  days:[0,1,2,3,4,5,6], pairs:'VOL 75 · VOL 99 · Crash · Boom', is247:true },
]

const FLAGS: Record<string,string> = { forex:'💱', ny:'🗽', london:'🇬🇧', tokyo:'🇯🇵', sydney:'🇦🇺', hk:'🇭🇰', crypto:'₿', deriv:'📈' }

function isOpen(m: Market, now: Date): boolean {
  if (m.is247) return true
  const day = now.getUTCDay()
  if (!m.days.includes(day)) return false
  if (m.id === 'forex') {
    if (day === 0) return now.getUTCHours() >= 22
    if (day === 6) return false
    return true
  }
  const cur = now.getUTCHours()*60 + now.getUTCMinutes()
  const op  = m.openUTC[0]*60  + m.openUTC[1]
  const cl  = m.closeUTC[0]*60 + m.closeUTC[1]
  return cl < op ? (cur >= op || cur < cl) : (cur >= op && cur < cl)
}

function localTime(tz: string): string {
  try { return new Date().toLocaleTimeString('fr-FR', { timeZone:tz, hour:'2-digit', minute:'2-digit', second:'2-digit' }) }
  catch { return '--:--:--' }
}

function timeUntil(m: Market, open: boolean, now: Date): string {
  if (m.is247 || m.id === 'forex') return ''
  const target = open ? m.closeUTC : m.openUTC
  const cur    = now.getUTCHours()*60 + now.getUTCMinutes()
  const tar    = target[0]*60 + target[1]
  let diff     = tar - cur; if (diff < 0) diff += 1440
  return `${open?'Ferme':'Ouvre'} dans ${Math.floor(diff/60)}h${String(diff%60).padStart(2,'0')}`
}

export default function MarketClocks({ locale='fr' }: { locale?:string }) {
  const [, setTick] = useState(0)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => { setNow(new Date()); setTick(t=>t+1) }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ marginBottom:'1.25rem' }}>
      <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'var(--tx3)', marginBottom:10 }}>
        {locale==='fr' ? '🌍 MARCHÉS MONDIAUX' : '🌍 GLOBAL MARKETS'}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(155px,1fr))', gap:8 }}>
        {MARKETS.map(m => {
          const open  = isOpen(m, now)
          const time  = localTime(m.tz)
          const until = timeUntil(m, open, now)
          const ac    = open ? 'var(--ac)' : 'var(--tx3)'
          const borderColor = open ? 'var(--bd1)' : 'var(--bd)'

          return (
            <div key={m.id} style={{ background:'var(--bg1)', border:`1px solid ${borderColor}`, borderRadius:8, padding:'0.75rem', position:'relative', overflow:'hidden', transition:'all .3s' }}>
              {/* Top accent */}
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:open?'linear-gradient(90deg, var(--ac), var(--ac2))':'transparent', transition:'background .4s' }} />

              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ fontSize:12, lineHeight:1 }}>{FLAGS[m.id]}</span>
                  <span style={{ fontFamily:HUD, fontSize:7.5, letterSpacing:0.8, color:'var(--tx1)' }}>{m.name}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:open?'var(--ok)':'var(--tx3)', display:'block', boxShadow:open?'0 0 7px var(--ok)':'none', animation:open&&!m.is247?'pulse 2.5s infinite':undefined }} />
                  <span style={{ fontFamily:HUD, fontSize:6, color:open?'var(--ok)':'var(--tx3)', letterSpacing:0.5 }}>
                    {m.is247?'24/7':open?'OUVERT':'FERMÉ'}
                  </span>
                </div>
              </div>

              {/* Horloge */}
              <div style={{ fontFamily:HUD, fontSize:16, fontWeight:900, color:ac, letterSpacing:1, lineHeight:1, marginBottom:4, transition:'color .3s' }}>
                {time}
              </div>

              {/* Sous-titre */}
              <div style={{ fontFamily:BODY, fontSize:10, color:'var(--tx3)', marginBottom: until?3:0 }}>{m.sub}</div>
              {until && <div style={{ fontFamily:BODY, fontSize:10, color:open?'var(--tx2)':'var(--ora)' }}>{until}</div>}

              {/* Paires */}
              <div style={{ marginTop:5, fontFamily:BODY, fontSize:10, color:'var(--tx3)', lineHeight:1.3 }}>{m.pairs}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
