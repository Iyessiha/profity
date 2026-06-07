'use client'
import { useState, useEffect } from 'react'
const HUD = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

const PLAN_BADGE: Record<string,string> = { elite:'💎', pro:'⭐', free:'🌱' }
const RANK_COLOR = ['#FFD700','#C0C0C0','#CD7F32']

interface Leader { rank:number; public_id:string; display_name:string; user_plan:string; total_xp:number; current_streak:number; total_analyses:number; analyses_this_week:number }

export default function Leaderboard({ currentUserId }: { currentUserId?: string }) {
  const [leaders, setLeaders] = useState<Leader[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard').then(r=>r.json()).then(j => {
      if (j.success) setLeaders(j.leaders)
      setLoading(false)
    })
  }, [])

  return (
    <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:12, overflow:'hidden', marginTop:'1.25rem' }}>
      <div style={{ height:2, background:'linear-gradient(90deg,transparent,#FFD700,#C9A84C,transparent)' }} />
      <div style={{ padding:'1rem 1.25rem' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'1rem' }}>
          <div style={{ width:36, height:36, borderRadius:9, background:'rgba(255,215,0,0.1)', border:'1px solid rgba(255,215,0,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
            🏆
          </div>
          <div>
            <div style={{ fontFamily:HUD, fontSize:11, color:'var(--tx0)', letterSpacing:1 }}>CLASSEMENT</div>
            <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)' }}>Top traders de la semaine · XP total</div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'2rem', fontFamily:HUD, fontSize:8, color:'var(--tx3)' }}>CHARGEMENT...</div>
        ) : leaders.length === 0 ? (
          <div style={{ textAlign:'center', padding:'2rem', color:'var(--tx3)' }}>
            <div style={{ fontSize:28, marginBottom:8 }}>🏆</div>
            <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:1 }}>CLASSEMENT VIDE</div>
            <div style={{ fontFamily:BODY, fontSize:12, marginTop:4 }}>Faites des analyses pour apparaître ici !</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {leaders.slice(0,10).map((l, i) => {
              const isTop3  = l.rank <= 3
              const rankCol = RANK_COLOR[l.rank-1] ?? 'var(--tx3)'
              return (
                <div key={l.public_id} style={{ display:'flex', alignItems:'center', gap:12, background: isTop3 ? `rgba(255,215,0,${0.06-(i*0.015)})` : 'var(--bg2)', border:`1px solid ${isTop3?`rgba(255,215,0,${0.2-(i*0.05)})`:'var(--bd)'}`, borderRadius:8, padding:'10px 14px', position:'relative', overflow:'hidden' }}>
                  {/* Rang */}
                  <div style={{ fontFamily:HUD, fontSize:isTop3?16:12, fontWeight:900, color:rankCol, minWidth:28, textAlign:'center', flexShrink:0 }}>
                    {l.rank <= 3 ? ['🥇','🥈','🥉'][l.rank-1] : `#${l.rank}`}
                  </div>

                  {/* Avatar initiales */}
                  <div style={{ width:32, height:32, borderRadius:'50%', background:`color-mix(in srgb,${rankCol} 15%,var(--bg1))`, border:`1px solid ${rankCol}30`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:HUD, fontSize:11, color:rankCol, flexShrink:0 }}>
                    {l.display_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                      <span style={{ fontFamily:HUD, fontSize:10, color:'var(--tx0)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.display_name}</span>
                      <span style={{ fontSize:12 }}>{PLAN_BADGE[l.user_plan] ?? '🌱'}</span>
                      {l.current_streak >= 7 && <span style={{ fontSize:12 }}>🔥</span>}
                    </div>
                    <div style={{ display:'flex', gap:10 }}>
                      <span style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)' }}>{l.total_analyses} analyses</span>
                      {l.analyses_this_week > 0 && <span style={{ fontFamily:BODY, fontSize:11, color:'var(--ac)' }}>+{l.analyses_this_week} cette semaine</span>}
                    </div>
                  </div>

                  {/* XP */}
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontFamily:HUD, fontSize:13, fontWeight:900, color:rankCol }}>{l.total_xp.toLocaleString('fr-FR')}</div>
                    <div style={{ fontFamily:HUD, fontSize:6, letterSpacing:1, color:'var(--tx3)' }}>XP</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ marginTop:'0.875rem', fontFamily:BODY, fontSize:11, color:'var(--tx3)', textAlign:'center' }}>
          +10 XP par connexion · +15 XP par analyse · Streak 🔥 = bonus crédits
        </div>
      </div>
    </div>
  )
}
