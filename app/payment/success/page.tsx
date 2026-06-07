'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabasePublic } from '@/lib/supabase'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

export default function PaymentSuccess() {
  const [plan,    setPlan]    = useState('')
  const [credits, setCredits] = useState(0)
  const [name,    setName]    = useState('Trader')
  const [confetti, setConfetti] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    ;(async () => {
      const { data:{ session } } = await supabasePublic.auth.getSession()
      if (!session) return
      const { data:p } = await supabasePublic.from('profiles').select('user_plan,full_name').eq('id', session.user.id).single()
      if (p) { setPlan(p.user_plan as string); setName((p.full_name as string)?.split(' ')[0] || 'Trader') }
      const { data:c } = await supabasePublic.from('credits').select('balance').eq('user_id', session.user.id).single()
      if (c) setCredits((c as { balance:number }).balance)
    })()
    setTimeout(() => setConfetti(false), 4000)
  }, [])

  const PLAN_CONFIG: Record<string,{label:string;color:string;icon:string;credits:number}> = {
    pro:   { label:'PRO',   color:'#00FFB2', icon:'⭐', credits:150 },
    elite: { label:'ELITE', color:'#C9A84C', icon:'💎', credits:600 },
  }
  const cfg = PLAN_CONFIG[plan] ?? PLAN_CONFIG.pro

  return (
    <div style={{ minHeight:'100vh', background:'#020408', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem', fontFamily:BODY, position:'relative', overflow:'hidden' }}>

      {/* Confettis CSS */}
      {confetti && (
        <style>{`
          @keyframes fall { to { transform:translateY(110vh) rotate(720deg); opacity:0 } }
          .confetti { position:fixed; top:-10px; width:10px; height:10px; border-radius:2px; animation:fall linear forwards; pointer-events:none; }
        `}</style>
      )}
      {confetti && Array.from({length:40}).map((_,i) => (
        <div key={i} className="confetti" style={{ left:`${Math.random()*100}vw`, background:['#00FFB2','#00D4FF','#C9A84C','#FF3A5C'][i%4], animationDuration:`${1.5+Math.random()*2}s`, animationDelay:`${Math.random()*1.5}s`, width:6+Math.random()*8, height:6+Math.random()*8 }} />
      ))}

      <div style={{ maxWidth:480, width:'100%', textAlign:'center' }}>
        {/* Icône succès */}
        <div style={{ width:90, height:90, borderRadius:'50%', background:`${cfg.color}15`, border:`2px solid ${cfg.color}40`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', fontSize:40 }}>
          {cfg.icon}
        </div>

        <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:3, color:cfg.color, marginBottom:12 }}>
          PAIEMENT CONFIRMÉ
        </div>

        <h1 style={{ fontFamily:HUD, fontSize:28, fontWeight:900, color:'#E8F4F8', margin:'0 0 8px' }}>
          Félicitations, {name} !
        </h1>

        <p style={{ fontFamily:BODY, fontSize:16, color:'rgba(232,244,248,0.55)', marginBottom:32 }}>
          Votre plan <strong style={{ color:cfg.color }}>{cfg.label}</strong> est maintenant actif.
        </p>

        {/* Récap */}
        <div style={{ background:'rgba(0,0,0,0.4)', border:`1px solid ${cfg.color}25`, borderRadius:12, padding:'1.5rem', marginBottom:32 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {[
              { l:'PLAN ACTIF', v:cfg.label, c:cfg.color },
              { l:'CRÉDITS', v:`${credits || cfg.credits}`, c:'#00FFB2' },
              { l:'ANALYSES', v:'Illimitées', c:'var(--ac2)' },
              { l:'SMC', v:'Activé ✓', c:'#00FFB2' },
            ].map(s => (
              <div key={s.l} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:HUD, fontSize:18, fontWeight:900, color:s.c, marginBottom:4 }}>{s.v}</div>
                <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'rgba(232,244,248,0.3)' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <a href="/analysis" style={{ flex:1, minWidth:160, background:cfg.color, color:'#020408', fontFamily:HUD, fontSize:10, letterSpacing:2, fontWeight:900, padding:'14px', borderRadius:7, textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            📊 ANALYSER UN CHART
          </a>
          <a href="/dashboard" style={{ flex:1, minWidth:160, background:'transparent', color:'rgba(232,244,248,0.5)', fontFamily:HUD, fontSize:10, letterSpacing:2, padding:'14px', borderRadius:7, border:'1px solid rgba(255,255,255,0.1)', textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center' }}>
            DASHBOARD →
          </a>
        </div>
      </div>
    </div>
  )
}
