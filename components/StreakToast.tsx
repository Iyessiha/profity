// ============================================================
// PROFITYX — StreakToast : célébration des paliers de streak
// ============================================================
'use client'
import { useEffect, useState } from 'react'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

interface Props { streak: number; reward: number; milestone: number; onClose: () => void }

export default function StreakToast({ streak, reward, milestone, onClose }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 400) }, 5000)
    return () => clearTimeout(t)
  }, [onClose])

  const emoji = milestone >= 100 ? '🏆' : milestone >= 30 ? '💎' : milestone >= 14 ? '🔥' : '⚡'

  return (
    <div style={{
      position:'fixed', bottom:24, left:'50%',
      transform:`translateX(-50%) translateY(${visible ? 0 : 100}px)`,
      opacity: visible ? 1 : 0,
      transition:'all .4s cubic-bezier(0.34,1.56,0.64,1)',
      zIndex:9999,
      width:'calc(100vw - 2rem)',
      maxWidth:380,
    }}>
      <div style={{
        background:'linear-gradient(135deg,#0A1628,#060B14)',
        border:'1px solid rgba(255,178,0,0.4)',
        borderRadius:14,
        overflow:'hidden',
        boxShadow:'0 12px 40px rgba(0,0,0,0.7), 0 0 40px rgba(255,178,0,0.15)',
      }}>
        {/* Barre top dorée */}
        <div style={{ height:3, background:'linear-gradient(90deg,transparent,#FFB200,#FFD700,transparent)' }} />

        <div style={{ padding:'1rem 1.1rem', display:'flex', alignItems:'center', gap:14 }}>
          {/* Icône animée */}
          <div style={{ fontSize:36, animation:'streakBounce .6s ease infinite alternate', flexShrink:0 }}>
            {emoji}
          </div>

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:HUD, fontSize:11, fontWeight:900, color:'#FFD700', letterSpacing:0.5, marginBottom:3 }}>
              {milestone} JOURS CONSÉCUTIFS !
            </div>
            <div style={{ fontFamily:BODY, fontSize:13, color:'rgba(232,244,248,0.7)', lineHeight:1.4 }}>
              Incroyable discipline ! <strong style={{ color:'#00FFB2' }}>+{reward} crédits</strong> ajoutés à votre solde.
            </div>
            {/* Barre streak */}
            <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'rgba(232,244,248,0.3)' }}>STREAK</span>
              <div style={{ flex:1, height:4, background:'rgba(255,255,255,0.06)', borderRadius:2 }}>
                <div style={{ height:'100%', borderRadius:2, background:'linear-gradient(90deg,#FFB200,#FFD700)', width:`${Math.min((streak/100)*100,100)}%`, transition:'width 1s ease' }} />
              </div>
              <span style={{ fontFamily:HUD, fontSize:9, color:'#FFD700', fontWeight:700 }}>{streak}🔥</span>
            </div>
          </div>

          <button onClick={() => { setVisible(false); setTimeout(onClose, 400) }}
            style={{ background:'transparent', border:'none', color:'rgba(232,244,248,0.3)', cursor:'pointer', fontSize:18, flexShrink:0, padding:0 }}>✕</button>
        </div>
      </div>

      <style>{`
        @keyframes streakBounce {
          from { transform: scale(1) rotate(-5deg); }
          to   { transform: scale(1.1) rotate(5deg); }
        }
      `}</style>
    </div>
  )
}
