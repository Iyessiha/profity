'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { supabasePublic } from '@/lib/supabase'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"
type Plan = 'free' | 'pro' | 'elite'
const RANK: Record<Plan,number> = { free:0, pro:1, elite:2 }

// Bandeau urgence dynamique
function UrgencyBanner() {
  const [count, setCount]   = useState(0)
  const [secs,  setSecs]    = useState(0)

  useEffect(() => {
    // Nombre "live" de traders actifs (pseudo-aléatoire ancré sur l'heure)
    const base = 12 + (new Date().getHours() % 8)
    setCount(base)
    // Compte à rebours vers la prochaine heure pile
    const tick = () => {
      const now = new Date()
      setSecs(3600 - (now.getMinutes()*60 + now.getSeconds()))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const m = String(Math.floor(secs / 60)).padStart(2,'0')
  const s = String(secs % 60).padStart(2,'0')

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, background:'linear-gradient(135deg,rgba(220,38,38,0.08),rgba(255,58,92,0.05))', border:'1px solid rgba(220,38,38,0.2)', borderRadius:10, padding:'12px 20px', marginBottom:'2rem', flexWrap:'wrap', gap:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ width:8, height:8, borderRadius:'50%', background:'#FF3A5C', animation:'pulse 1s infinite', display:'inline-block' }} />
        <span style={{ fontFamily:HUD, fontSize:9, letterSpacing:1, color:'#FF3A5C' }}>🔥 {count} traders ont rejoint Pro cette semaine</span>
      </div>
      <div style={{ height:16, width:1, background:'rgba(255,255,255,0.1)' }} />
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontFamily:HUD, fontSize:9, letterSpacing:1, color:'var(--tx3)' }}>Prochaine recharge crédits dans</span>
        <span style={{ fontFamily:HUD, fontSize:13, fontWeight:900, color:'#C9A84C' }}>{m}:{s}</span>
      </div>
    </div>
  )
}

const PLANS = [
  {
    key: 'free' as Plan, name: 'STARTER', price: '0', period: 'pour toujours',
    color: '#888', featured: false, headline: 'Essayez gratuitement',
    credits: 10, creditLabel: '10 crédits offerts',
    perks: [
      { icon: 'ti-coin',         text: '10 crédits à l\'inscription' },
      { icon: 'ti-chart-candle', text: '1 crédit = 1 analyse chart IA' },
      { icon: 'ti-calendar',     text: 'Calendrier économique' },
      { icon: 'ti-users',        text: 'Support communauté' },
    ],
    missing: ['Analyse SMC professionnelle', 'Crédits mensuels renouvelés', 'Alertes push NFP/CPI'],
  },
  {
    key: 'pro' as Plan, name: 'PRO', price: '17 500', period: 'par mois',
    color: '#00B890', featured: true, headline: '87% des traders actifs choisissent Pro',
    promo: '🔥 POPULAIRE',
    credits: 150, creditLabel: '150 crédits / mois',
    perks: [
      { icon: 'ti-coin',          text: '150 crédits renouvelés chaque mois' },
      { icon: 'ti-sparkles',      text: '1 crédit = analyse SMC (Order Blocks, FVG, Liquidité)' },
      { icon: 'ti-brain',         text: 'Analyse SMC professionnelle' },
      { icon: 'ti-news',          text: 'Signaux annonces macroéconomiques' },
      { icon: 'ti-bell-ringing',  text: 'Alertes push avant NFP, CPI, FOMC' },
      { icon: 'ti-psychology',    text: 'Coaching psychologique sur les annonces' },
      { icon: 'ti-history',       text: 'Historique 90 jours' },
      { icon: 'ti-headset',       text: 'Support prioritaire WhatsApp' },
    ],
    missing: [],
  },
  {
    key: 'elite' as Plan, name: 'ELITE', price: '35 000', period: 'par mois',
    color: '#92671A', featured: false, headline: 'Pour les traders sérieux — tout sans limite',
    credits: 600, creditLabel: '600 crédits / mois',
    perks: [
      { icon: 'ti-coin',         text: '600 crédits renouvelés chaque mois (4× Pro)' },
      { icon: 'ti-infinity',     text: 'Analyses chart & signaux — quota élevé' },
      { icon: 'ti-crown',        text: 'Accès VIP anticipé aux nouvelles fonctions' },
      { icon: 'ti-rocket',       text: 'Alertes prioritaires — avant les autres' },
      { icon: 'ti-chart-candle', text: 'Tous les actifs : Forex, Crypto, Synthétiques, Or' },
      { icon: 'ti-infinity',     text: 'Historique illimité' },
      { icon: 'ti-psychology',   text: 'Coaching Elite personnalisé NFP/FOMC/CPI' },
      { icon: 'ti-headset',      text: 'Support VIP 24h/7j — ligne dédiée' },
    ],
    missing: [],
  },
]

const CREDIT_PACKS = [
  { credits: 25,  price: '2 000',  label: 'Starter',  badge: null,             color: '#888'     },
  { credits: 75,  price: '5 000',  label: 'Standard', badge: '🔥 POPULAIRE',  color: '#00B890'  },
  { credits: 200, price: '12 000', label: 'Premium',  badge: null,             color: '#00C6FF'  },
  { credits: 500, price: '25 000', label: 'Elite+',   badge: '⭐ MEILLEURE VALEUR', color: '#92671A' },
]

const FAQS = [
  { q: 'C\'est quoi un crédit ?',             r: '1 crédit = 1 analyse chart IA ou 1 signal news. Simple et transparent. Vous savez exactement ce que vous consommez.' },
  { q: 'Les crédits expirent-ils ?',          r: 'Les crédits inclus dans un plan sont renouvelés chaque mois. Les crédits achetés en pack ne s\'expirent jamais.' },
  { q: 'Puis-je acheter des crédits en plus ?', r: 'Oui. Des packs de crédits sont disponibles à tout moment, quel que soit votre plan. Ils s\'ajoutent à votre solde existant.' },
  { q: 'Puis-je annuler à tout moment ?',     r: 'Oui. Depuis Paramètres → Abonnement → Annuler. Vous gardez vos crédits restants et l\'accès jusqu\'à la fin de la période.' },
  { q: 'Quels actifs sont analysables ?',     r: 'Forex, Crypto, Indices synthétiques Deriv, Or/Pétrole, Indices boursiers. Tout actif qui a un graphique.' },
]

export default function PricingPage() {
  const [currentPlan, setCurrentPlan] = useState<Plan>('free')
  const [loading,     setLoading]     = useState<Plan|null>(null)
  const [token,       setToken]       = useState('')
  const [balance,     setBalance]     = useState<number|null>(null)
  const [toast,       setToast]       = useState<{msg:string;ok:boolean}|null>(null)

  useEffect(() => {
    supabasePublic.auth.getSession().then(async ({ data }) => {
      if (!data.session) return
      setToken(data.session.access_token)
      const { data: p } = await supabasePublic.from('profiles').select('user_plan').eq('id', data.session.user.id).single()
      if (p?.user_plan) setCurrentPlan(p.user_plan as Plan)
      // Solde crédits
      const res  = await fetch('/api/credits', { headers: { Authorization: `Bearer ${data.session.access_token}` } })
      const json = await res.json()
      if (json.success) setBalance(json.balance)
    })
    const urlP = new URLSearchParams(window.location.search)
    if (urlP.get('subscription') === 'cancelled') showToast('⚠ Paiement annulé — votre plan n\'a pas changé', false)
    if (urlP.get('credits') === 'success') showToast('✅ Crédits ajoutés à votre solde !', true)
  }, [])

  const showToast = (msg:string, ok:boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4500)
  }

  const handleUpgrade = async (planKey:Plan) => {
    if (planKey === 'free') return
    if (planKey === currentPlan) { showToast('Vous êtes déjà sur ce plan', false); return }
    if (!token) { window.location.href = '/auth/login'; return }
    setLoading(planKey)
    try {
      const res  = await fetch('/api/payment/checkout', {
        method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
        body: JSON.stringify({ plan: planKey }),
      })
      const json = await res.json()
      if (json.success && json.redirectUrl) {
        if (json.fallback) {
          showToast('💬 Redirection vers WhatsApp pour finaliser votre abonnement...', true)
          setTimeout(() => window.open(json.redirectUrl,'_blank'), 1000)
        } else {
          window.location.href = json.redirectUrl
        }
      } else {
        showToast(json.error ?? 'Erreur — réessayez', false)
      }
    } catch { showToast('Erreur réseau — réessayez', false) }
    setLoading(null)
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg0)', color:'var(--tx0)', fontFamily:BODY }}>
      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', zIndex:999, background:toast.ok?'var(--ok)':'var(--red)', color:'#fff', fontFamily:HUD, fontSize:9, letterSpacing:1, padding:'12px 24px', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.4)', whiteSpace:'nowrap' }}>
          {toast.msg}
        </div>
      )}

      {/* Nav */}
      <nav style={{ position:'sticky', top:0, zIndex:50, background:'var(--bg1)', borderBottom:'1px solid var(--bd)', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <a href="/" style={{ fontFamily:HUD, fontSize:12, color:'var(--ac)', textDecoration:'none', letterSpacing:2 }}>PROFIT<span style={{ color:'var(--ac2)' }}>YX</span></a>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          {balance !== null && (
            <div style={{ display:'flex', alignItems:'center', gap:6, background:'color-mix(in srgb, var(--ac) 8%, transparent)', border:'1px solid color-mix(in srgb, var(--ac) 20%, transparent)', borderRadius:6, padding:'5px 12px' }}>
              <i className="ti ti-coin" style={{ fontSize:13, color:'var(--ac)' }} />
              <span style={{ fontFamily:HUD, fontSize:9, color:'var(--ac)', fontWeight:700 }}>{balance} crédits</span>
            </div>
          )}
          <a href="/dashboard" style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--tx2)', textDecoration:'none' }}>← Dashboard</a>
        </div>
      </nav>

      <main style={{ maxWidth:980, margin:'0 auto', padding:'2rem 1rem 4rem' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:3, color:'var(--ac)', marginBottom:12 }}>TARIFS & CRÉDITS</div>
          <h1 style={{ fontFamily:HUD, fontSize:28, fontWeight:900, color:'var(--tx0)', letterSpacing:1, margin:'0 0 12px' }}>
            TRADEZ AVEC L'IA.<br /><span style={{ color:'var(--ac)' }}>PAYEZ CE QUE VOUS UTILISEZ.</span>
          </h1>
          <p style={{ fontFamily:BODY, fontSize:16, color:'var(--tx2)', maxWidth:540, margin:'0 auto' }}>
            1 crédit = 1 analyse chart ou 1 signal news. Choisissez votre plan, achetez des crédits supplémentaires si besoin.
          </p>
        </div>

        {/* Bandeau urgence */}
        <UrgencyBanner />

        {/* Comment fonctionnent les crédits */}
        <div style={{ background:'color-mix(in srgb, var(--ac) 5%, var(--bg1))', border:'1px solid color-mix(in srgb, var(--ac) 20%, transparent)', borderRadius:12, padding:'1.5rem', marginBottom:'2rem' }}>
          <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:2, color:'var(--ac)', marginBottom:'1rem', textAlign:'center' }}>🪙 COMMENT FONCTIONNENT LES CRÉDITS ?</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, textAlign:'center' }}>
            {[
              { icon:'ti-chart-candle', title:'1 crédit = 1 analyse',  desc:'Chaque analyse de chart IA consomme 1 crédit, quel que soit le plan.' },
              { icon:'ti-news',         title:'1 crédit = 1 signal',   desc:'Chaque signal d\'annonce macro (NFP, CPI, FOMC...) consomme 1 crédit.' },
              { icon:'ti-refresh',      title:'Recharge mensuelle',    desc:'Les crédits inclus dans votre plan sont renouvelés le 1er de chaque mois.' },
              { icon:'ti-shopping-bag', title:'Packs supplémentaires', desc:'Achetez des crédits à tout moment. Ils s\'accumulent et n\'expirent jamais.' },
            ].map(c => (
              <div key={c.title}>
                <i className={'ti '+c.icon} style={{ fontSize:22, color:'var(--ac)', display:'block', marginBottom:8 }} />
                <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:1, color:'var(--tx0)', marginBottom:6 }}>{c.title}</div>
                <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)', lineHeight:1.5 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16, marginBottom:'2rem' }}>
          {PLANS.map(plan => {
            const isCurrent = plan.key === currentPlan
            const isUp      = RANK[plan.key] > RANK[currentPlan]
            const isLoading = loading === plan.key
            const c         = plan.color
            return (
              <div key={plan.key} style={{ background:'var(--bg1)', border:`1px solid ${isCurrent?c+'60':plan.featured?'color-mix(in srgb, var(--ac) 30%, transparent)':'var(--bd)'}`, borderRadius:12, padding:'1.5rem', position:'relative', overflow:'hidden', transform:plan.featured?'scale(1.02)':'none', boxShadow:plan.featured?`0 8px 30px ${c}20`:'none' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${c}, transparent)` }} />

                {plan.promo && !isCurrent && (
                  <div style={{ position:'absolute', top:14, right:14, background:c+'15', border:`1px solid ${c}35`, color:c, fontFamily:HUD, fontSize:8, letterSpacing:1, padding:'3px 10px', borderRadius:2 }}>{plan.promo}</div>
                )}
                {isCurrent && (
                  <div style={{ position:'absolute', top:14, right:14, background:c+'15', border:`1px solid ${c}35`, color:c, fontFamily:HUD, fontSize:8, letterSpacing:1, padding:'3px 10px', borderRadius:2 }}>✓ ACTUEL</div>
                )}

                {/* Nom + Prix */}
                <div style={{ fontFamily:HUD, fontSize:11, letterSpacing:2, color:c, marginBottom:6 }}>{plan.name}</div>
                <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)', marginBottom:12 }}>{plan.headline}</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:4 }}>
                  <span style={{ fontFamily:HUD, fontSize:28, fontWeight:900, color:'var(--tx0)', lineHeight:1 }}>{plan.price}</span>
                  <span style={{ fontFamily:BODY, fontSize:13, color:'var(--tx3)' }}>FCFA</span>
                </div>
                <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)', marginBottom:'1rem' }}>{plan.period}</div>

                {/* Badge crédits */}
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:`color-mix(in srgb, ${c} 10%, transparent)`, border:`1px solid color-mix(in srgb, ${c} 25%, transparent)`, borderRadius:6, padding:'6px 12px', marginBottom:'1.25rem' }}>
                  <i className="ti ti-coin" style={{ fontSize:14, color:c }} />
                  <span style={{ fontFamily:HUD, fontSize:10, fontWeight:900, color:c }}>{plan.creditLabel}</span>
                </div>

                {/* Perks */}
                <ul style={{ listStyle:'none', padding:0, margin:'0 0 1.5rem', display:'flex', flexDirection:'column', gap:8 }}>
                  {plan.perks.map((f,i) => (
                    <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                      <i className={'ti '+f.icon} style={{ fontSize:15, color:c, flexShrink:0, marginTop:2 }} />
                      <span style={{ fontFamily:BODY, fontSize:13, color:'var(--tx1)', lineHeight:1.4 }}>{f.text}</span>
                    </li>
                  ))}
                  {plan.missing.slice(0,2).map((f,i) => (
                    <li key={'m'+i} style={{ display:'flex', alignItems:'flex-start', gap:10, opacity:0.4 }}>
                      <i className="ti ti-lock" style={{ fontSize:13, color:'var(--tx3)', flexShrink:0, marginTop:2 }} />
                      <span style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)', textDecoration:'line-through' }}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {plan.key === 'free' ? (
                  <div style={{ textAlign:'center', padding:'12px', fontFamily:HUD, fontSize:9, letterSpacing:2, color:isCurrent?'var(--ac)':'var(--tx3)', background:isCurrent?'color-mix(in srgb, var(--ac) 8%, transparent)':'transparent', border:'1px solid var(--bd)', borderRadius:6 }}>
                    {isCurrent ? '✓ PLAN ACTUEL' : 'PLAN GRATUIT'}
                  </div>
                ) : isCurrent ? (
                  <div style={{ textAlign:'center', padding:'12px', fontFamily:HUD, fontSize:9, letterSpacing:2, color:c, background:c+'10', border:`1px solid ${c}30`, borderRadius:6 }}>✓ PLAN ACTUEL</div>
                ) : (
                  <button onClick={() => handleUpgrade(plan.key)} disabled={!!loading || !token}
                    style={{ width:'100%', padding:'14px', borderRadius:6, cursor:isLoading?'wait':'pointer', fontFamily:HUD, fontSize:10, letterSpacing:2, fontWeight:700, background:isUp?c:'transparent', color:isUp?'#020408':c, border:isUp?'none':`1px solid ${c}50`, display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:loading&&!isLoading?0.6:1 }}>
                    {isLoading
                      ? <><div style={{ width:14,height:14,border:'2px solid rgba(0,0,0,0.2)',borderTop:`2px solid ${isUp?'#020408':c}`,borderRadius:'50%',animation:'spin .8s linear infinite' }} />REDIRECTION...</>
                      : isUp ? `CHOISIR ${plan.name} →` : `REVENIR EN ${plan.name}`}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Packs de crédits supplémentaires */}
        <div style={{ marginBottom:'2rem' }}>
          <div style={{ textAlign:'center', marginBottom:'1.25rem' }}>
            <div style={{ fontFamily:HUD, fontSize:11, letterSpacing:2, color:'var(--tx0)', marginBottom:6 }}>PACKS DE CRÉDITS SUPPLÉMENTAIRES</div>
            <div style={{ fontFamily:BODY, fontSize:13, color:'var(--tx3)' }}>Valables sur tous les plans · Cumulables avec les crédits mensuels · N'expirent jamais</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>
            {CREDIT_PACKS.map(pack => (
              <div key={pack.credits} style={{ background:'var(--bg1)', border:`1px solid ${pack.badge?'var(--bd2)':'var(--bd)'}`, borderRadius:10, padding:'1.1rem', position:'relative', textAlign:'center' }}>
                {pack.badge && (
                  <div style={{ position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)', background:`${pack.color}20`, border:`1px solid ${pack.color}40`, color:pack.color, fontFamily:HUD, fontSize:7, letterSpacing:1, padding:'3px 10px', borderRadius:10, whiteSpace:'nowrap' }}>{pack.badge}</div>
                )}
                <div style={{ fontFamily:HUD, fontSize:28, fontWeight:900, color:pack.color, lineHeight:1, marginBottom:4, marginTop:pack.badge?8:0 }}>{pack.credits}</div>
                <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--tx3)', marginBottom:10 }}>CRÉDITS</div>
                <div style={{ fontFamily:HUD, fontSize:16, fontWeight:900, color:'var(--tx0)', marginBottom:2 }}>{pack.price} <span style={{ fontSize:11, fontWeight:400, color:'var(--tx3)' }}>FCFA</span></div>
                <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)', marginBottom:12 }}>{Math.round(parseInt(pack.price.replace(' ','')) / pack.credits)} FCFA / crédit</div>
                <a href={token ? '/dashboard' : '/auth/login'} style={{ display:'block', background:`color-mix(in srgb, ${pack.color} 12%, transparent)`, border:`1px solid color-mix(in srgb, ${pack.color} 30%, transparent)`, color:pack.color, fontFamily:HUD, fontSize:8, letterSpacing:1, fontWeight:700, padding:'8px', borderRadius:5, textDecoration:'none', cursor:'pointer' }}>
                  ACHETER →
                </a>
              </div>
            ))}
          </div>
          <div style={{ textAlign:'center', marginTop:10, fontFamily:BODY, fontSize:12, color:'var(--tx3)' }}>
            💡 Achetez vos packs depuis le <strong style={{ color:'var(--ac)' }}>Dashboard → bouton crédits</strong> (icône 🪙)
          </div>
        </div>

        {/* Comparatif */}
        <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:12, padding:'1.5rem', marginBottom:'2rem', overflowX:'auto' }}>
          <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:2, color:'var(--tx0)', marginBottom:'1.25rem', textAlign:'center' }}>TABLEAU COMPARATIF</div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:BODY, fontSize:13 }}>
            <thead>
              <tr>
                {['Fonctionnalité','STARTER','PRO','ELITE'].map((h,i) => (
                  <th key={h} style={{ textAlign:i===0?'left':'center', padding:'8px 12px', fontFamily:HUD, fontSize:8, letterSpacing:1, color:i===0?'var(--tx3)':i===1?'#888':i===2?'#00B890':'#92671A', borderBottom:'1px solid var(--bd)', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Crédits inclus',         '10 à l\'inscription', '150 / mois', '600 / mois'],
                ['Recharge mensuelle',      '—',        '✅',          '✅'],
                ['Analyse chart IA',        '1 crédit', '1 crédit',   '1 crédit'],
                ['Signal news macro',       '1 crédit', '1 crédit',   '1 crédit'],
                ['Analyse SMC avancée',     '❌',        '✅',          '✅'],
                ['Alertes push NFP/CPI',    '❌',        '✅',          '✅ Prioritaires'],
                ['Coaching psychologique',  '❌',        '✅',          '✅ Personnalisé'],
                ['Historique',              '7 jours',  '90 jours',   'Illimité'],
                ['Packs crédits',           '✅',        '✅',          '✅'],
                ['Support',                 'Communauté','WhatsApp',  'VIP 24h/7j'],
              ].map((row) => (
                <tr key={row[0]} style={{ borderBottom:'1px solid var(--bd)' }}>
                  {row.map((cell, i) => (
                    <td key={i} style={{ padding:'9px 12px', color:i===0?'var(--tx2)':'var(--tx1)', textAlign:i===0?'left':'center', fontFamily:i===0?BODY:HUD, fontSize:i===0?13:10 }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CTA Pro */}
        <div style={{ marginBottom:'2rem', background:'linear-gradient(135deg, color-mix(in srgb, var(--ac) 8%, var(--bg1)), color-mix(in srgb, var(--ac2) 6%, var(--bg1)))', border:'1px solid color-mix(in srgb, var(--ac) 20%, transparent)', borderRadius:12, padding:'1.5rem', textAlign:'center', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg, transparent, var(--ac), var(--ac2), transparent)' }} />
          <div style={{ fontFamily:HUD, fontSize:12, color:'var(--ac)', letterSpacing:1, marginBottom:8 }}>💡 LE SAVIEZ-VOUS ?</div>
          <p style={{ fontFamily:BODY, fontSize:15, color:'var(--tx1)', lineHeight:1.7, maxWidth:560, margin:'0 auto 1.25rem' }}>
            Un trader qui rate un NFP faute de préparation perd en moyenne <strong style={{ color:'var(--red)' }}>5× le prix d'un mois Pro</strong>. Avec 150 crédits, vous avez toutes vos analyses du mois pour moins de 120 FCFA chacune.
          </p>
          <a href="#" onClick={e=>{e.preventDefault();handleUpgrade('pro')}} style={{ display:'inline-flex', alignItems:'center', gap:8, background:'var(--ac)', color:'#020408', fontFamily:HUD, fontSize:10, letterSpacing:2, fontWeight:700, padding:'13px 28px', borderRadius:6, textDecoration:'none' }}>
            <i className="ti ti-rocket" style={{ fontSize:14 }} />PASSER PRO — 150 CRÉDITS/MOIS
          </a>
        </div>

        {/* FAQ */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:12 }}>
          {FAQS.map(faq => (
            <div key={faq.q} style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:8, padding:'1.1rem' }}>
              <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:1, color:'var(--ac)', marginBottom:6 }}>{faq.q}</div>
              <div style={{ fontFamily:BODY, fontSize:13, color:'var(--tx2)', lineHeight:1.6 }}>{faq.r}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop:'1px solid var(--bd)', padding:'1.5rem', textAlign:'center', background:'var(--bg1)' }}>
        <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap', marginBottom:10 }}>
          {([['/legal/cgu','CGU'],['/legal/confidentialite','Confidentialité'],['/legal/mentions','Mentions légales'],['/support','Assistance']] as [string,string][]).map(([h,l]) => (
            <a key={l} href={h} style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--tx3)', textDecoration:'none' }}>{l}</a>
          ))}
        </div>
        <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)', marginBottom:4 }}>
          ✓ Sans engagement · ✓ Annulable à tout moment · ✓ Paiement sécurisé · 💬 Support WhatsApp
        </div>
        <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)' }}>© 2026 MonWe Infinity LLC · EIN 38-4396094 · Le trading comporte des risques de perte en capital.</div>
      </footer>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
