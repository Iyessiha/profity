'use client'
import { useEffect, useState } from 'react'
import { supabasePublic } from '@/lib/supabase'

interface Props { userId: string; locale?: string }
interface Gami { current_streak: number; longest_streak: number; total_xp: number; level: number; xp_in_level: number; badge: string }

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"
const BADGES: Record<string, { fr: string; en: string; color: string; icon: string }> = {
  rookie: { fr: 'Débutant', en: 'Rookie', color: '#888',    icon: 'ti-seedling' },
  bronze: { fr: 'Bronze',   en: 'Bronze', color: '#CD7F32', icon: 'ti-award' },
  silver: { fr: 'Argent',   en: 'Silver', color: '#C0C0C0', icon: 'ti-award' },
  gold:   { fr: 'Or',       en: 'Gold',   color: '#C9A84C', icon: 'ti-trophy' },
}

export default function GamificationBar({ userId, locale = 'fr' }: Props) {
  const [g, setG] = useState<Gami | null>(null)
  useEffect(() => {
    if (!userId) return
    let ok = true
    ;(async () => {
      const { data } = await supabasePublic.from('user_gamification').select('*').eq('user_id', userId).single()
      if (ok && data) setG(data as Gami)
    })()
    return () => { ok = false }
  }, [userId])
  if (!g) return null

  const badge = BADGES[g.badge] ?? BADGES.rookie
  const badgeName = locale === 'fr' ? badge.fr : badge.en
  const streakColor = g.current_streak > 0 ? '#FF8800' : 'rgba(232,244,248,0.3)'

  return (
    <div className="gami-bar" style={{
      background: 'linear-gradient(135deg, #0D1420, #06090F)',
      border: '1px solid rgba(0,255,178,0.1)', borderRadius: 10,
      padding: '1rem', marginBottom: '1rem',
      display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      width: '100%', boxSizing: 'border-box',
    }}>
      {/* Niveau + XP */}
      <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: 'linear-gradient(135deg,#00FFB2,#00D4FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HUD, fontSize: 12, fontWeight: 900, color: '#020408' }}>{g.level}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 1, color: '#00FFB2' }}>{locale === 'fr' ? `NIV. ${g.level}` : `LVL ${g.level}`}</div>
              <div style={{ fontFamily: BODY, fontSize: 11, color: 'var(--tx2)' }}>{g.total_xp} XP</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            {/* Streak */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-flame" style={{ fontSize: 18, color: streakColor }} aria-hidden="true" />
              <div>
                <div style={{ fontFamily: HUD, fontSize: 14, fontWeight: 900, color: streakColor, lineHeight: 1 }}>{g.current_streak}</div>
                <div style={{ fontFamily: BODY, fontSize: 10, color: 'var(--tx2)' }}>{locale === 'fr' ? 'jours' : 'days'}</div>
              </div>
            </div>
            {/* Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className={'ti ' + badge.icon} style={{ fontSize: 18, color: badge.color }} aria-hidden="true" />
              <div>
                <div style={{ fontFamily: HUD, fontSize: 11, fontWeight: 900, color: badge.color, lineHeight: 1 }}>{badgeName}</div>
                <div style={{ fontFamily: BODY, fontSize: 10, color: 'var(--tx2)' }}>{locale === 'fr' ? 'rang' : 'rank'}</div>
              </div>
            </div>
          </div>
        </div>
        {/* Barre XP */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 5, background: 'rgba(0,255,178,0.08)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${g.xp_in_level}%`, height: '100%', background: 'linear-gradient(90deg,#00FFB2,#00D4FF)', transition: 'width .5s' }} />
          </div>
          <span style={{ fontFamily: HUD, fontSize: 8, color: 'var(--tx2)', flexShrink: 0 }}>{g.xp_in_level}/100</span>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  )
}
