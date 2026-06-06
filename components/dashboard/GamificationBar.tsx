'use client'
import { useEffect, useState } from 'react'
import { supabasePublic } from '@/lib/supabase'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

interface Props { userId: string; locale?: string }
interface Gami  { current_streak:number; longest_streak:number; total_xp:number; level:number; xp_in_level:number; badge:string }

const BADGES: Record<string, { fr:string; en:string; color:string; icon:string }> = {
  rookie: { fr:'Débutant', en:'Rookie', color:'var(--tx2)',  icon:'ti-seedling' },
  bronze: { fr:'Bronze',   en:'Bronze', color:'#CD7F32',     icon:'ti-award'    },
  silver: { fr:'Argent',   en:'Silver', color:'#A0AEC0',     icon:'ti-award'    },
  gold:   { fr:'Or',       en:'Gold',   color:'var(--ac3)',  icon:'ti-trophy'   },
}

export default function GamificationBar({ userId, locale = 'fr' }: Props) {
  const [g, setG] = useState<Gami|null>(null)

  useEffect(() => {
    let ok = true
    ;(async () => {
      const { data } = await supabasePublic.from('user_gamification').select('*').eq('user_id', userId).single()
      if (ok && data) setG(data as Gami)
    })()
    return () => { ok = false }
  }, [userId])

  if (!g) return null

  const badge      = BADGES[g.badge] ?? BADGES.rookie
  const badgeName  = locale === 'fr' ? badge.fr : badge.en
  const streakOn   = g.current_streak > 0
  const streakColor = streakOn ? 'var(--ora)' : 'var(--tx3)'
  const pct        = Math.min(100, g.xp_in_level)

  return (
    <div style={{
      background: 'var(--bg1)',
      border: '1px solid var(--bd1)',
      borderRadius: 10,
      padding: '0.875rem 1rem',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Accent top */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg, var(--ac), var(--ac2), transparent)' }} />

      {/* Niveau + XP */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6, gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {/* Badge niveau */}
            <div style={{ width:34, height:34, borderRadius:8, flexShrink:0, background:'linear-gradient(135deg, var(--ac), var(--ac2))', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:HUD, fontSize:13, fontWeight:900, color:'#020408' }}>
              {g.level}
            </div>
            <div>
              <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:1, color:'var(--ac)' }}>
                {locale==='fr' ? `NIVEAU ${g.level}` : `LEVEL ${g.level}`}
              </div>
              <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx2)' }}>
                {g.total_xp} XP {locale==='fr' ? 'au total' : 'total'}
              </div>
            </div>
          </div>
          {/* Streak + Badge */}
          <div style={{ display:'flex', alignItems:'center', gap:14, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <i className="ti ti-flame" style={{ fontSize:18, color:streakColor }} />
              <div>
                <div style={{ fontFamily:HUD, fontSize:14, fontWeight:900, color:streakColor, lineHeight:1 }}>{g.current_streak}</div>
                <div style={{ fontFamily:BODY, fontSize:9, color:'var(--tx3)' }}>{locale==='fr'?'jours':'days'}</div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <i className={'ti ' + badge.icon} style={{ fontSize:16, color:badge.color }} />
              <div>
                <div style={{ fontFamily:HUD, fontSize:10, fontWeight:700, color:badge.color, lineHeight:1 }}>{badgeName}</div>
                <div style={{ fontFamily:BODY, fontSize:9, color:'var(--tx3)' }}>{locale==='fr'?'rang':'rank'}</div>
              </div>
            </div>
          </div>
        </div>
        {/* Barre XP */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ flex:1, height:5, background:'var(--bd)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ width:`${pct}%`, height:'100%', background:'linear-gradient(90deg, var(--ac), var(--ac2))', borderRadius:3, transition:'width .6s ease' }} />
          </div>
          <span style={{ fontFamily:HUD, fontSize:8, color:'var(--tx3)', flexShrink:0 }}>{pct}/100</span>
        </div>
      </div>
    </div>
  )
}
