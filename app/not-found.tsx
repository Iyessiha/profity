'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

export default function NotFound() {
  const router = useRouter()
  const [count, setCount] = useState(5)

  useEffect(() => {
    const id = setInterval(() => {
      setCount(c => {
        if (c <= 1) { clearInterval(id); router.push('/dashboard'); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [router])

  return (
    <div style={{ minHeight:'100vh', background:'#020408', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:24, padding:'2rem', fontFamily:BODY }}>
      {/* Grille */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(0,255,178,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,178,0.03) 1px, transparent 1px)', backgroundSize:'40px 40px', pointerEvents:'none' }} />

      <div style={{ textAlign:'center', position:'relative' }}>
        {/* 404 géant */}
        <div style={{ fontFamily:HUD, fontSize:'clamp(80px,20vw,160px)', fontWeight:900, lineHeight:1, background:'linear-gradient(135deg,#00FFB2,#00D4FF)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:8 }}>
          404
        </div>

        <div style={{ fontFamily:HUD, fontSize:14, letterSpacing:3, color:'rgba(232,244,248,0.5)', marginBottom:24 }}>
          PAGE INTROUVABLE
        </div>

        <p style={{ fontFamily:BODY, fontSize:16, color:'rgba(232,244,248,0.45)', marginBottom:32, maxWidth:340, margin:'0 auto 32px' }}>
          Cette page n'existe pas ou a été déplacée. Vous serez redirigé automatiquement.
        </p>

        {/* Compte à rebours */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginBottom:32 }}>
          <div style={{ width:48, height:48, borderRadius:'50%', border:'2px solid rgba(0,255,178,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:HUD, fontSize:20, fontWeight:900, color:'#00FFB2' }}>{count}</div>
          <span style={{ fontFamily:BODY, fontSize:14, color:'rgba(232,244,248,0.4)' }}>secondes avant la redirection</span>
        </div>

        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <a href="/dashboard" style={{ background:'#00FFB2', color:'#020408', fontFamily:HUD, fontSize:10, letterSpacing:2, fontWeight:700, padding:'12px 24px', borderRadius:6, textDecoration:'none' }}>
            ALLER AU DASHBOARD →
          </a>
          <a href="/" style={{ background:'transparent', color:'rgba(232,244,248,0.5)', fontFamily:HUD, fontSize:10, letterSpacing:2, padding:'12px 24px', borderRadius:6, border:'1px solid rgba(255,255,255,0.1)', textDecoration:'none' }}>
            ACCUEIL
          </a>
        </div>
      </div>
    </div>
  )
}
