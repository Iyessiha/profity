'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { supabasePublic } from '@/lib/supabase'
import { useTheme } from '@/lib/theme'

type Plan = 'free' | 'pro' | 'elite'
const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

const PLANS = [
  {
    key: 'free' as Plan, name: 'STARTER', price: '0', period: 'pour toujours',
    color: '#888', featured: false,
    headline: 'Pour commencer',
    perks: [
      { icon: 'ti-chart-candle',  text: '3 analyses chart / mois' },
      { icon: 'ti-news',          text: '5 signaux annonces / mois' },
      { icon: 'ti-calendar',      text: 'Calendrier économique' },
      { icon: 'ti-users',         text: 'Support communauté' },
    ],
    missing: ['Analyse SMC professionnelle', 'Signaux news illimités', 'Coaching psychologique', 'Alertes push avant NFP/CPI'],
  },
  {
    key: 'pro' as Plan, name: 'PRO', price: '17 500', period: 'par mois',
    color: '#00B890', featured: true,
    headline: '87% des traders actifs choisissent Pro',
    promo: '🔥 POPULAIRE',
    perks: [
      { icon: 'ti-sparkles',      text: '100 analyses chart / mois' },
      { icon: 'ti-brain',         text: 'Analyse SMC — Order Blocks, FVG, Liquidité' },
      { icon: 'ti-infinity',      text: 'Signaux annonces ILLIMITÉS' },
      { icon: 'ti-bell-ringing',  text: 'Alertes push avant NFP, CPI, FOMC' },
      { icon: 'ti-psychology',    text: 'Coaching psychologique sur les annonces' },
      { icon: 'ti-history',       text: 'Historique 90 jours' },
      { icon: 'ti-chart-bar',     text: 'Indicateurs MACD, RSI, Bollinger' },
      { icon: 'ti-headset',       text: 'Support prioritaire WhatsApp' },
    ],
    missing: [],
  },
  {
    key: 'elite' as Plan, name: 'ELITE', price: '35 000', period: 'par mois',
    color: '#92671A', featured: false,
    headline: 'Pour les traders sérieux — tout sans limite',
    perks: [
      { icon: 'ti-infinity',      text: 'Analyses chart ILLIMITÉES' },
      { icon: 'ti-infinity',      text: 'Signaux annonces ILLIMITÉS' },
      { icon: 'ti-crown',         text: 'Accès VIP anticipé aux nouvelles fonctions' },
      { icon: 'ti-rocket',        text: 'Alertes prioritaires — avant les autres' },
      { icon: 'ti-chart-candle',  text: 'Tous les actifs : Forex, Crypto, Synthétiques, Or' },
      { icon: 'ti-infinity',      text: 'Historique illimité' },
      { icon: 'ti-psychology',    text: 'Coaching Elite personnalisé NFP/FOMC/CPI' },
      { icon: 'ti-headset',       text: 'Support VIP 24h/7j — ligne dédiée' },
    ],
    missing: [],
  },
]

// Comparatif de performances (psychologie de conversion)
const PROOF = [
  { label: 'Analyses générées', value: '4 800+' },
  { label: 'Signaux NFP/CPI', value: '1 200+' },
  { label: 'Traders satisfaits', value: '97%' },
  { label: 'Précision SMC', value: '78%' },
]

export default function PricingPage() {
  const [currentPlan, setCurrentPlan] = useState<Plan>('free')
  const [loading, setLoading] = useState<Plan|null>(null)
  const [token, setToken]     = useState('')
  const [toast, setToast]     = useState<{msg:string;ok:boolean}|null>(null)
  const [cancelled, setCancelled] = useState(false)
  const { toggleTheme, theme } = useTheme()

  const showToast = (msg:string, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),4500) }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search)
      if (p.get('subscription')==='cancelled') setCancelled(true)
    }
    ;(async () => {
      const { data: { session } } = await supabasePublic.auth.getSession()
      if (!session) { window.location.href = '/auth/login'; return }
      setToken(session.access_token)
      const { data: p } = await supabasePublic.from('profiles').select('user_plan').eq('id', session.user.id).single()
      if (p?.user_plan) setCurrentPlan(p.user_plan as Plan)
    })()
  }, [])

  const handleUpgrade = async (planKey:Plan) => {
    if (planKey === 'free') return
    if (planKey === currentPlan) { showToast('Vous êtes déjà sur ce plan', false); return }
    if (!token) { window.location.href = '/auth/login'; return }
    setLoading(planKey)
    try {
      const res = await fetch('/api/payment/checkout', {
        method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
        body: JSON.stringify({ plan: planKey }),
      })
      const json = await res.json()
      if (json.success && json.redirectUrl) {
        if (json.fallback) {
          // Fallback WhatsApp : paiement manuel
          showToast('💬 Redirection vers WhatsApp pour finaliser votre abonnement...', true)
          setTimeout(() => window.open(json.redirectUrl, '_blank'), 1200)
        } else {
          window.location.href = json.redirectUrl
        }
      } else {
        showToast((json.error ?? 'Erreur de paiement'), false)
      }
    } catch { showToast('Erreur réseau — réessayez', false) }
    setLoading(null)
  }

  const RANK: Record<Plan,number> = { free:0, pro:1, elite:2 }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg0)', color:'var(--tx0)', fontFamily:BODY }}>
      {/* Fond subtil */}
      <div style={{ position:'fixed', inset:0, backgroundImage:'linear-gradient(var(--bd) 1px,transparent 1px),linear-gradient(90deg,var(--bd) 1px,transparent 1px)', backgroundSize:'50px 50px', opacity:0.5, pointerEvents:'none', zIndex:0 }} />

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:1000, background:toast.ok?'color-mix(in srgb, var(--ac) 12%, var(--bg2))':'color-mix(in srgb, var(--red) 12%, var(--bg2))', border:`1px solid ${toast.ok?'var(--bd2)':'color-mix(in srgb, var(--red) 30%, transparent)'}`, borderRadius:8, padding:'12px 18px', fontFamily:HUD, fontSize:9, letterSpacing:1, color:toast.ok?'var(--ac)':'var(--red)', maxWidth:340 }}>
          {toast.msg}
        </div>
      )}

      {/* Nav */}
      <nav style={{ position:'relative', zIndex:10, background:'var(--bg1)', borderBottom:'1px solid var(--bd)', padding:'0 1.5rem', height:58, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <a href="/dashboard" style={{ fontFamily:HUD, fontSize:18, letterSpacing:4, color:'var(--ac)', textDecoration:'none' }}>
          PROFIT<span style={{ color:'var(--ac2)' }}>YX</span>
        </a>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={toggleTheme} style={{ width:34,height:34,borderRadius:7,border:'1px solid var(--bd1)',background:'var(--bg2)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:theme==='dark'?'#C9A84C':'#0EA5E9' }}>
            <i className={'ti '+(theme==='dark'?'ti-sun':'ti-moon')} style={{ fontSize:15 }} />
          </button>
          <a href="/dashboard" style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'var(--tx2)', padding:'0 12px', display:'flex', alignItems:'center', textDecoration:'none', border:'1px solid var(--bd)', borderRadius:4 }}>← RETOUR</a>
        </div>
      </nav>

      <main style={{ position:'relative', zIndex:1, maxWidth:1080, margin:'0 auto', padding:'2.5rem 1.25rem 5rem' }}>

        {/* En-tête */}
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          {cancelled && (
            <div style={{ background:'color-mix(in srgb, var(--ora) 10%, transparent)', border:'1px solid color-mix(in srgb, var(--ora) 25%, transparent)', borderRadius:8, padding:'10px 20px', display:'inline-block', marginBottom:'1rem', fontFamily:HUD, fontSize:9, letterSpacing:1, color:'var(--ora)' }}>
              ⚠ Paiement annulé — votre plan n'a pas changé
            </div>
          )}
          <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:4, color:'var(--ac2)', marginBottom:10 }}>TARIFS</div>
          <h1 style={{ fontFamily:HUD, fontSize:'clamp(26px,5vw,44px)', fontWeight:900, marginBottom:12, color:'var(--tx0)' }}>
            INVESTISSEZ EN <span style={{ color:'var(--ac)' }}>VOUS</span>
          </h1>
          <p style={{ fontFamily:BODY, fontSize:16, color:'var(--tx2)', maxWidth:520, margin:'0 auto 1.5rem' }}>
            Chaque trade mal préparé coûte plus cher que notre abonnement mensuel.
          </p>
          {/* Badges preuve */}
          <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
            {['✓ Sans engagement','✓ Annulable à tout moment','✓ Paiement sécurisé','💬 Support WhatsApp'].map(b => (
              <span key={b} style={{ background:'color-mix(in srgb, var(--ac) 8%, transparent)', border:'1px solid var(--bd2)', borderRadius:100, padding:'4px 14px', fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--ac)' }}>{b}</span>
            ))}
          </div>
        </div>

        {/* Stats de confiance */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:10, marginBottom:'2rem' }}>
          {PROOF.map(p => (
            <div key={p.label} style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:8, padding:'0.875rem', textAlign:'center' }}>
              <div style={{ fontFamily:HUD, fontSize:22, fontWeight:900, color:'var(--ac)', marginBottom:4 }}>{p.value}</div>
              <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)' }}>{p.label}</div>
            </div>
          ))}
        </div>

        {/* Cartes plans */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))', gap:16, alignItems:'start' }}>
          {PLANS.map(plan => {
            const isCurrent = plan.key === currentPlan
            const isUp = RANK[plan.key] > RANK[currentPlan]
            const isLoading = loading === plan.key
            const c = plan.color

            return (
              <div key={plan.key} style={{
                background:'var(--bg1)', border:`1px solid ${isCurrent?c+'50':plan.featured?'color-mix(in srgb, var(--ac) 30%, transparent)':'var(--bd)'}`,
                borderRadius:12, padding:'1.5rem', position:'relative', overflow:'hidden',
                transform: plan.featured ? 'scale(1.02)' : 'none',
                boxShadow: plan.featured ? `0 8px 30px ${c}20` : 'none',
              }}>
                {/* Barre top */}
                <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg, ${c}, transparent)` }} />

                {/* Promo badge */}
                {plan.promo && !isCurrent && (
                  <div style={{ position:'absolute', top:14, right:14, background:c+'15', border:`1px solid ${c}35`, color:c, fontFamily:HUD, fontSize:8, letterSpacing:1, padding:'3px 10px', borderRadius:2 }}>{plan.promo}</div>
                )}
                {isCurrent && (
                  <div style={{ position:'absolute', top:14, right:14, background:c+'15', border:`1px solid ${c}35`, color:c, fontFamily:HUD, fontSize:8, letterSpacing:1, padding:'3px 10px', borderRadius:2 }}>✓ VOTRE PLAN</div>
                )}

                {/* Plan name */}
                <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:4, color:'var(--tx3)', marginBottom:6 }}>{plan.name}</div>

                {/* Headline */}
                <div style={{ fontFamily:BODY, fontSize:13, color:c, marginBottom:'1rem', lineHeight:1.4 }}>{plan.headline}</div>

                {/* Prix */}
                <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:4 }}>
                  <span style={{ fontFamily:HUD, fontSize:36, fontWeight:900, color:'var(--tx0)', lineHeight:1 }}>{plan.price}</span>
                  <span style={{ fontFamily:BODY, fontSize:13, color:'var(--tx3)' }}>FCFA</span>
                </div>
                <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)', marginBottom:'1.5rem' }}>{plan.period}</div>

                {/* Features */}
                <ul style={{ listStyle:'none', padding:0, margin:'0 0 1.5rem', display:'flex', flexDirection:'column', gap:9 }}>
                  {plan.perks.map((f,i) => (
                    <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                      <i className={'ti ' + f.icon} style={{ fontSize:16, color:c, flexShrink:0, marginTop:1 }} />
                      <span style={{ fontFamily:BODY, fontSize:14, color:'var(--tx1)' }}>{f.text}</span>
                    </li>
                  ))}
                  {plan.missing.slice(0,2).map((f,i) => (
                    <li key={'m'+i} style={{ display:'flex', alignItems:'flex-start', gap:10, opacity:0.4 }}>
                      <i className="ti ti-lock" style={{ fontSize:14, color:'var(--tx3)', flexShrink:0, marginTop:1 }} />
                      <span style={{ fontFamily:BODY, fontSize:13, color:'var(--tx3)', textDecoration:'line-through' }}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {plan.key === 'free' ? (
                  <div style={{ textAlign:'center', padding:'12px', fontFamily:HUD, fontSize:9, letterSpacing:2, color:isCurrent?'var(--ac)':'var(--tx3)', background:isCurrent?'color-mix(in srgb, var(--ac) 8%, transparent)':'transparent', border:'1px solid var(--bd)', borderRadius:6 }}>
                    {isCurrent ? '✓ PLAN ACTUEL' : 'PLAN GRATUIT'}
                  </div>
                ) : isCurrent ? (
                  <div style={{ textAlign:'center', padding:'12px', fontFamily:HUD, fontSize:9, letterSpacing:2, color:c, background:c+'10', border:`1px solid ${c}30`, borderRadius:6 }}>
                    ✓ PLAN ACTUEL
                  </div>
                ) : (
                  <button onClick={() => handleUpgrade(plan.key)} disabled={!!loading || !token}
                    style={{ width:'100%', padding:'14px', borderRadius:6, cursor:isLoading?'wait':'pointer', fontFamily:HUD, fontSize:10, letterSpacing:2, fontWeight:700, background: isUp ? c : 'transparent', color: isUp ? '#020408' : c, border: isUp ? 'none' : `1px solid ${c}50`, display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity: loading && !isLoading ? 0.6 : 1 }}>
                    {isLoading ? <><div style={{ width:14,height:14,border:'2px solid rgba(0,0,0,0.2)',borderTop:`2px solid ${isUp?'#020408':c}`,borderRadius:'50%',animation:'spin .8s linear infinite' }} />REDIRECTION...</> : isUp ? `CHOISIR ${plan.name} →` : `REVENIR EN ${plan.name}`}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Section urgence / promotion */}
        <div style={{ marginTop:'2rem', background:'linear-gradient(135deg, color-mix(in srgb, var(--ac) 8%, var(--bg1)), color-mix(in srgb, var(--ac2) 6%, var(--bg1)))', border:'1px solid color-mix(in srgb, var(--ac) 20%, transparent)', borderRadius:12, padding:'1.5rem', textAlign:'center', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg, transparent, var(--ac), var(--ac2), transparent)' }} />
          <div style={{ fontFamily:HUD, fontSize:12, color:'var(--ac)', letterSpacing:1, marginBottom:8 }}>💡 LE SAVIEZ-VOUS ?</div>
          <p style={{ fontFamily:BODY, fontSize:15, color:'var(--tx1)', lineHeight:1.7, maxWidth:560, margin:'0 auto 1.25rem' }}>
            Un trader qui rate une annonce NFP à cause d'une mauvaise préparation perd en moyenne <strong style={{ color:'var(--red)' }}>5x le prix d'un mois Pro</strong>. Avec ProfityX Pro, vous avez la stratégie avant même la publication.
          </p>
          <a href="#" onClick={e=>{e.preventDefault();handleUpgrade('pro')}} style={{ display:'inline-flex', alignItems:'center', gap:8, background:'var(--ac)', color:'#020408', fontFamily:HUD, fontSize:10, letterSpacing:2, fontWeight:700, padding:'13px 28px', borderRadius:6, textDecoration:'none' }}>
            <i className="ti ti-rocket" style={{ fontSize:14 }} />PASSER PRO MAINTENANT
          </a>
        </div>

        {/* FAQ */}
        <div style={{ marginTop:'2rem', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:12 }}>
          {[
            { q:'Puis-je annuler à tout moment ?', r:'Oui. Depuis Paramètres → Abonnement → Annuler. Vous gardez l\'accès jusqu\'à la fin de la période.' },
            { q:'Les quotas se renouvellent quand ?', r:'Le 1er de chaque mois. Aucun report possible vers le mois suivant.' },
            { q:'Quels actifs sont analysables ?', r:'Forex, Crypto, Indices synthétiques Deriv, Or/Pétrole, Indices boursiers. Tout actif qui a un chart.' },
          ].map(faq => (
            <div key={faq.q} style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:8, padding:'1.1rem' }}>
              <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:1, color:'var(--ac)', marginBottom:6 }}>{faq.q}</div>
              <div style={{ fontFamily:BODY, fontSize:13, color:'var(--tx2)', lineHeight:1.6 }}>{faq.r}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer légal */}
      <footer style={{ position:'relative', zIndex:1, borderTop:'1px solid var(--bd)', padding:'1.5rem', textAlign:'center', background:'var(--bg1)' }}>
        <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap', marginBottom:10 }}>
          {([['/legal/cgu','CGU'],['/legal/confidentialite','Confidentialité'],['/legal/mentions','Mentions légales'],['/support','Assistance']] as [string,string][]).map(([h,l]) => (
            <a key={l} href={h} style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--tx3)', textDecoration:'none' }}>{l}</a>
          ))}
        </div>
        <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)' }}>© 2026 MonWe Infinity LLC · EIN 38-4396094 · Le trading comporte des risques de perte en capital.</div>
      </footer>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
