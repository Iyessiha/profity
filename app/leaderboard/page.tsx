'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

interface Leader {
  rank:       number
  public_id:  string
  full_name:  string
  user_plan:  string
  total_wins: number
  total_rated:number
  win_rate:   number
}

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<Leader[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod]   = useState<'all'|'month'>('month')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/leaderboard?period=${period}`)
      .then(r => r.json()).then(d => { setLeaders(d.leaders ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  const MEDALS = ['🥇','🥈','🥉']
  const PLAN_COLOR: Record<string, string> = { elite:'#C9A84C', pro:'#00FFB2', free:'#888' }

  return (
    <div style={{ minHeight:'100vh', background:'#020408', color:'#F0F8FF', fontFamily:BODY }}>
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(2,4,8,0.95)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(0,255,178,0.07)', padding:'0 1.5rem', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Link href="/" style={{ textDecoration:'none' }}>
          <img src="/logos/profityx-logo.png" alt="ProfityX" style={{ height:32, objectFit:'contain' }} />
        </Link>
        <Link href="/auth/login" style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'#020408', background:'#00FFB2', padding:'8px 18px', borderRadius:4, textDecoration:'none', fontWeight:700 }}>
          JOINDRE
        </Link>
      </nav>

      <div style={{ maxWidth:720, margin:'0 auto', padding:'2.5rem 1.5rem' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:3, color:'rgba(0,255,178,0.6)', marginBottom:12 }}>CLASSEMENT</div>
          <h1 style={{ fontFamily:HUD, fontSize:'clamp(24px,4vw,40px)', fontWeight:900, marginBottom:8 }}>
            🏆 TOP TRADERS
          </h1>
          <p style={{ fontFamily:BODY, fontSize:15, color:'rgba(240,248,255,0.45)' }}>
            Les meilleurs traders ProfityX — classés par win rate
          </p>
        </div>

        {/* Toggle période */}
        <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:28 }}>
          {(['month','all'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              fontFamily:HUD, fontSize:8, letterSpacing:2, padding:'8px 18px', borderRadius:6,
              border:'none', cursor:'pointer',
              background: period === p ? '#00FFB2' : 'rgba(255,255,255,0.05)',
              color: period === p ? '#020408' : 'rgba(240,248,255,0.5)',
              fontWeight: period === p ? 700 : 400,
            }}>
              {p === 'month' ? 'CE MOIS' : 'TOUT TEMPS'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'3rem', fontFamily:HUD, fontSize:10, color:'rgba(0,255,178,0.5)', letterSpacing:3 }}>
            CHARGEMENT...
          </div>
        ) : leaders.length === 0 ? (
          <div style={{ textAlign:'center', padding:'3rem', fontFamily:BODY, fontSize:15, color:'rgba(240,248,255,0.3)' }}>
            Aucun trader classé pour cette période
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {leaders.map((l, i) => (
              <Link key={l.public_id} href={`/u/${l.public_id}`} style={{ textDecoration:'none' }}>
                <div style={{
                  background: i < 3 ? `rgba(${i===0?'201,168,76':i===1?'192,192,192':'205,127,50'},0.06)` : '#08111F',
                  border: `1px solid ${i < 3 ? `rgba(${i===0?'201,168,76':i===1?'192,192,192':'205,127,50'},0.25)` : 'rgba(255,255,255,0.05)'}`,
                  borderRadius:10, padding:'14px 18px',
                  display:'flex', alignItems:'center', gap:14, cursor:'pointer',
                  transition:'all .15s',
                }}>
                  {/* Rang */}
                  <div style={{ width:36, textAlign:'center', flexShrink:0 }}>
                    {i < 3
                      ? <span style={{ fontSize:24 }}>{MEDALS[i]}</span>
                      : <span style={{ fontFamily:HUD, fontSize:13, color:'rgba(240,248,255,0.3)' }}>#{l.rank}</span>
                    }
                  </div>

                  {/* Avatar */}
                  <div style={{ width:40, height:40, borderRadius:'50%', background:`linear-gradient(135deg,${PLAN_COLOR[l.user_plan] ?? '#888'},#00D4FF)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:HUD, fontSize:16, fontWeight:900, color:'#020408', flexShrink:0 }}>
                    {l.full_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Infos */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:HUD, fontSize:11, color:'#F0F8FF', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {l.full_name}
                    </div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color: PLAN_COLOR[l.user_plan] ?? '#888', background:`${PLAN_COLOR[l.user_plan] ?? '#888'}15`, padding:'2px 8px', borderRadius:100 }}>
                        {l.user_plan.toUpperCase()}
                      </span>
                      <span style={{ fontFamily:BODY, fontSize:12, color:'rgba(240,248,255,0.4)' }}>
                        {l.total_wins} WIN · {l.total_rated} notés
                      </span>
                    </div>
                  </div>

                  {/* Win rate */}
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontFamily:HUD, fontSize:20, fontWeight:900, color:'#00FFB2' }}>{l.win_rate}%</div>
                    <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'rgba(240,248,255,0.35)' }}>WIN RATE</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop:40, background:'rgba(0,255,178,0.04)', border:'1px solid rgba(0,255,178,0.15)', borderRadius:12, padding:'2rem', textAlign:'center' }}>
          <div style={{ fontFamily:HUD, fontSize:13, fontWeight:900, color:'#00FFB2', marginBottom:8 }}>
            Votre nom ici ?
          </div>
          <p style={{ fontFamily:BODY, fontSize:14, color:'rgba(240,248,255,0.5)', marginBottom:20 }}>
            Analysez vos charts avec l'IA SMC et bâtissez votre track record
          </p>
          <Link href="/auth/login" style={{ fontFamily:HUD, fontSize:10, letterSpacing:2, color:'#020408', background:'#00FFB2', padding:'13px 28px', borderRadius:4, textDecoration:'none', fontWeight:700 }}>
            COMMENCER GRATUITEMENT
          </Link>
        </div>
      </div>

      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.05)', padding:'1.5rem', textAlign:'center' }}>
        <div style={{ fontFamily:BODY, fontSize:12, color:'rgba(240,248,255,0.2)' }}>© 2026 MonWe Infinity LLC · profity-x.com</div>
      </footer>
    </div>
  )
}
