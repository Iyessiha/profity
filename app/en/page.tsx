// ============================================================
// PROFITYX — Landing Page EN — Nigeria / English market
// URL : profity-x.com/en
// ============================================================
'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

const PLANS = [
  {
    key: 'free', name: 'FREE', price: '0', sub: 'forever',
    color: '#888', credits: '10 credits', analyses: '3 analyses/day',
    features: ['Basic SMC signals', 'Forex + Synthetic Indices', 'Macro calendar'],
    cta: 'START FOR FREE', highlight: false,
  },
  {
    key: 'pro', name: 'PRO', price: '$28', sub: '/month',
    color: '#00FFB2',  credits: '150 credits', analyses: 'Unlimited analyses',
    features: ['Everything in Free', 'Order Block + FVG', 'BOS / CHoCH / Liquidity', 'Annotated chart', 'NFP/CPI anticipatory signals'],
    cta: 'GO PRO', highlight: true,
  },
  {
    key: 'elite', name: 'ELITE', price: '$56', sub: '/month',
    color: '#C9A84C', credits: '600 credits', analyses: 'Unlimited analyses',
    features: ['Everything in Pro', 'Scalping Mode', 'Live News Signals', 'Priority support', 'Early access to new features'],
    cta: 'GO ELITE', highlight: false,
  },
]

const STEPS = [
  { n: '01', icon: '📤', title: 'Upload your chart', desc: 'Take a screenshot of your chart on Synthetic Indices or TradingView and upload it.' },
  { n: '02', icon: '🤖', title: 'AI analyzes in 10s', desc: 'Our AI detects SMC structures: Order Blocks, FVG, BOS, CHoCH and Liquidity zones.' },
  { n: '03', icon: '🎯', title: 'Get your signal', desc: 'Precise entry, Stop Loss and 3 Take Profit levels calculated automatically.' },
]

const ASSETS = ['Boom 1000','Crash 500','GainX 600','Volatility 75','Step Index','EUR/USD','XAU/USD','GBP/USD']

const FAQ = [
  { q: 'Which assets does it work with?', a: 'ProfityX works with all Synthetic Indices assets (Boom 1000, Crash 500, GainX, Volatility 75, Step Index) and major Forex pairs (EUR/USD, GBP/USD, XAU/USD, USD/JPY...). Select your asset before uploading your chart.' },
  { q: 'What is Smart Money Concept (SMC)?', a: 'SMC is an institutional analysis method that follows "smart money" (big banks). ProfityX automatically detects Order Blocks, Fair Value Gaps, BOS and CHoCH on your chart.' },
  { q: 'How do I pay from Nigeria?', a: 'We accept Visa, Mastercard and MTN MoMo via GeniusPay. International cards from GTBank, Access Bank, UBA are all supported.' },
  { q: 'Can I cancel anytime?', a: 'Yes, no commitment. Cancel your subscription from your account page at any time, no fees.' },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid rgba(0,255,178,0.08)' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width:'100%', background:'none', border:'none', cursor:'pointer', padding:'1.25rem 0', display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, textAlign:'left' }}>
        <span style={{ fontFamily:BODY, fontSize:16, color:'#F0F8FF', fontWeight:600 }}>{q}</span>
        <span style={{ color:'#00FFB2', fontSize:20, flexShrink:0, transition:'transform .2s', transform:open?'rotate(45deg)':'none' }}>+</span>
      </button>
      {open && <p style={{ fontFamily:BODY, fontSize:15, color:'rgba(240,248,255,0.55)', lineHeight:1.7, paddingBottom:'1.25rem', margin:0 }}>{a}</p>}
    </div>
  )
}

export default function LandingEN() {
  const [analyses,  setAnalyses]  = useState(26)
  const [users,     setUsers]     = useState(11)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [toast,     setToast]     = useState<{msg:string;sub:string} | null>(null)
  const [online,    setOnline]    = useState(0)
  const [urgency,   setUrgency]   = useState('')
  const [spotted,   setSpotted]   = useState(false)

  useEffect(() => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('pxLang', 'en')
    fetch('/api/stats').then(r => r.json()).then(d => {
      if (d.analyses_24h) setAnalyses(d.analyses_24h)
      if (d.total_users)  setUsers(d.total_users)
    }).catch(() => {})
  }, [])

  // ── Compteur "X traders online" ─────────────────────────
  useEffect(() => {
    setOnline(Math.floor(Math.random() * 8) + 4)
    const t = setInterval(() => setOnline(n => n + (Math.random() > 0.5 ? 1 : -1) < 3 ? 3 : n + (Math.random() > 0.5 ? 1 : -1)), 8000)
    return () => clearInterval(t)
  }, [])

  // ── Live activity toasts (social proof) ─────────────────
  useEffect(() => {
    const TOASTS = [
      { msg: '✅ WIN signal — Boom 1000',     sub: 'Entry confirmed · R/R 1:2.1' },
      { msg: '🎯 Signal generated — GainX',   sub: 'Entry + SL + TP in 8 seconds' },
      { msg: '✅ WIN signal — Crash 500',      sub: 'SHORT confirmed · R/R 1:1.8' },
      { msg: '📊 New analysis — EUR/USD H4',  sub: 'Order Block detected' },
      { msg: '✅ WIN signal — Volatility 75', sub: 'BOS + FVG confirmed' },
      { msg: '🎯 Signal — XAU/USD',           sub: 'LONG · Entry 3 TP levels' },
      { msg: '⭐ New Pro member',             sub: '150 credits activated' },
      { msg: '✅ WIN — Step Index',            sub: 'CHoCH + OB signal' },
    ]
    let idx = 0
    const show = () => {
      setToast(TOASTS[idx % TOASTS.length])
      idx++
      setTimeout(() => setToast(null), 4200)
    }
    const t = setTimeout(() => {
      show()
      const interval = setInterval(show, 9000)
      return () => clearInterval(interval)
    }, 5000)
    return () => clearTimeout(t)
  }, [])

  // ── Urgency countdown ────────────────────────────────────
  useEffect(() => {
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    const tick = () => {
      const diff = end.getTime() - Date.now()
      if (diff <= 0) { setUrgency('00:00:00'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setUrgency(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  // ── Scroll reveal (IntersectionObserver) ────────────────
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { (e.target as HTMLElement).style.opacity = '1'; (e.target as HTMLElement).style.transform = 'translateY(0)' } })
    }, { threshold: 0.1 })
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <div style={{ minHeight:'100vh', background:'#020408', color:'#F0F8FF', fontFamily:BODY, overflowX:'hidden' }}>

      {/* ── FOND ANIMÉ ─────────────────────────────────────── */}
      <div aria-hidden="true" style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
        <div style={{ position:'absolute', width:'60vw', height:'60vw', maxWidth:700, borderRadius:'50%', left:'-15%', bottom:'-10%', background:'radial-gradient(circle, rgba(0,255,178,0.12) 0%, transparent 70%)', animation:'orbFloat1 18s ease-in-out infinite', filter:'blur(40px)' }} />
        <div style={{ position:'absolute', width:'50vw', height:'50vw', maxWidth:600, borderRadius:'50%', right:'-10%', top:'-5%', background:'radial-gradient(circle, rgba(0,212,255,0.1) 0%, transparent 70%)', animation:'orbFloat2 22s ease-in-out infinite', filter:'blur(50px)' }} />
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(0,255,178,0.03) 1px, transparent 1px),linear-gradient(90deg, rgba(0,255,178,0.03) 1px, transparent 1px)', backgroundSize:'60px 60px', animation:'gridPulse 8s ease-in-out infinite', maskImage:'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)', WebkitMaskImage:'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)' }} />
      </div>

      {/* ── NAVBAR ──────────────────────────────────────────── */}
      <nav style={{ position:'sticky', top:0, zIndex:100, borderBottom:'1px solid rgba(0,255,178,0.07)', background:'rgba(2,4,8,0.95)', backdropFilter:'blur(16px)', padding:'0 1.5rem', height:60, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <a href="/en" style={{ textDecoration:'none', flexShrink:0 }}>
          <img src="/logos/profityx-logo.jpg" alt="ProfityX" style={{ height:40, width:'auto', objectFit:'contain' }} />
        </a>
        <div style={{ display:'flex', alignItems:'center', gap:28 }} className="nav-desktop">
          {[['#how','How it works'],['#features','Features'],['#pricing','Pricing'],['/results','Results'],['/blog','Blog']].map(([href,label]) => (
            <a key={href} href={href} style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'rgba(240,248,255,0.45)', textDecoration:'none' }}>{label}</a>
          ))}
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexShrink:0 }}>
          <a href="/auth/login" className="nav-desktop" style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'rgba(240,248,255,0.5)', textDecoration:'none' }}>LOGIN</a>
          <a href="/auth/login" style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'#020408', background:'#00FFB2', padding:'9px 18px', borderRadius:4, textDecoration:'none', fontWeight:700, whiteSpace:'nowrap' }}>FREE TRIAL</a>
          <button onClick={() => setMenuOpen(o => !o)} className="nav-mobile-btn" aria-label="Menu" style={{ background:'transparent', border:'1px solid rgba(0,255,178,0.2)', borderRadius:6, color:'#00FFB2', padding:'7px 10px', cursor:'pointer', fontSize:18, lineHeight:1, display:'none' }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div style={{ position:'fixed', top:60, left:0, right:0, background:'rgba(2,4,8,0.98)', borderBottom:'1px solid rgba(0,255,178,0.12)', zIndex:99, padding:'1.5rem', display:'flex', flexDirection:'column', gap:4 }}>
          {[['#how','How it works'],['#features','Features'],['#pricing','Pricing'],['/results','Live Results'],['/blog','Blog'],['/auth/login','Login']].map(([href,label]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)} style={{ fontFamily:HUD, fontSize:10, letterSpacing:2, color:'rgba(240,248,255,0.6)', textDecoration:'none', padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>{label}</a>
          ))}
          <a href="/auth/login" style={{ fontFamily:HUD, fontSize:11, letterSpacing:2, color:'#020408', background:'#00FFB2', padding:'14px', borderRadius:6, textDecoration:'none', fontWeight:700, textAlign:'center', marginTop:12 }}>
            START FOR FREE →
          </a>
        </div>
      )}

      {/* ── HERO ────────────────────────────────────────────── */}
      <section style={{ position:'relative', zIndex:1, padding:'clamp(4rem,8vw,7rem) 2rem clamp(3rem,6vw,5rem)', maxWidth:900, margin:'0 auto', textAlign:'center' }}>
        {/* Pill LIVE + online count */}
        <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:8, marginBottom:'2rem' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(0,255,178,0.06)', border:'1px solid rgba(0,255,178,0.18)', borderRadius:100, padding:'6px 16px' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#00E676', animation:'pulse 1.5s infinite', display:'inline-block' }} />
            <span style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'#00FFB2' }}>{users} TRADERS · {analyses} ANALYSES TODAY</span>
          </div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,58,92,0.07)', border:'1px solid rgba(255,58,92,0.2)', borderRadius:100, padding:'6px 14px' }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'#FF3A5C', animation:'pulse 1s infinite', display:'inline-block' }} />
            <span style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'#FF6B6B' }}>{online} ONLINE NOW</span>
          </div>
        </div>

        <h1 style={{ fontFamily:HUD, fontSize:'clamp(32px,5.5vw,68px)', fontWeight:900, lineHeight:1.1, letterSpacing:1, marginBottom:'1.5rem' }}>
          TRADE SMARTER.<br />
          <span style={{ color:'#00FFB2' }}>NOT HARDER.</span>
        </h1>

        <p style={{ fontSize:'clamp(16px,1.8vw,20px)', color:'rgba(240,248,255,0.55)', lineHeight:1.7, maxWidth:580, margin:'0 auto 2.5rem', fontWeight:300 }}>
          Upload your Synthetic Indices or TradingView chart → get your <strong style={{ color:'#F0F8FF' }}>entry, Stop Loss and Take Profit</strong> in 10 seconds. AI-powered SMC analysis.
        </p>

        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginBottom:'3rem' }}>
          <a href="/auth/login" style={{ fontFamily:HUD, fontSize:11, letterSpacing:2, color:'#020408', background:'#00D4FF', padding:'16px 36px', borderRadius:4, textDecoration:'none', fontWeight:700, animation:'ctaPulse 2.5s ease-in-out infinite' }}>
            START FOR FREE →
          </a>
          <a href="/results" style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'rgba(240,248,255,0.5)', border:'1px solid rgba(255,255,255,0.1)', padding:'14px 24px', borderRadius:4, textDecoration:'none' }}>
            SEE LIVE RESULTS
          </a>
        </div>
        <p style={{ fontFamily:BODY, fontSize:13, color:'rgba(240,248,255,0.3)' }}>✓ No credit card &nbsp;·&nbsp; ✓ 10 free credits &nbsp;·&nbsp; ✓ Cancel anytime</p>

        {/* Urgency countdown */}
        {urgency && (
          <div style={{ marginTop:20, display:'inline-flex', alignItems:'center', gap:10, background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'8px 18px' }}>
            <span style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'rgba(201,168,76,0.7)' }}>FREE CREDITS OFFER EXPIRES IN</span>
            <span style={{ fontFamily:HUD, fontSize:13, fontWeight:900, color:'#C9A84C', letterSpacing:3, minWidth:80 }}>{urgency}</span>
          </div>
        )}
      </section>

      {/* ── BANDE FOMO ─────────────────────────────────────── */}
      <div style={{ background:'rgba(201,168,76,0.07)', borderTop:'1px solid rgba(201,168,76,0.15)', borderBottom:'1px solid rgba(201,168,76,0.15)', padding:'10px 1.5rem', textAlign:'center', position:'relative', zIndex:1 }}>
        <span style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'#C9A84C' }}>
          🔥 &nbsp;{users}+ traders already use AI to analyze their charts. Join them and get 10 free credits today.
        </span>
      </div>

      {/* ── TICKER ──────────────────────────────────────────── */}
      <div style={{ borderTop:'1px solid rgba(0,255,178,0.12)', borderBottom:'1px solid rgba(0,255,178,0.12)', padding:'0.9rem 0', overflow:'hidden', background:'rgba(0,255,178,0.03)', position:'relative', zIndex:1 }}>
        <div style={{ display:'flex', gap:0, alignItems:'center', animation:'scrollTicker 22s linear infinite', whiteSpace:'nowrap', width:'max-content' }}>
          {[...ASSETS, ...ASSETS].map((a, i) => (
            <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:0, flexShrink:0 }}>
              <span style={{ fontFamily:HUD, fontSize:10, letterSpacing:2, color:'#00FFB2', fontWeight:700, padding:'0 28px' }}>{a}</span>
              <span style={{ color:'rgba(0,255,178,0.25)', fontSize:14 }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section id="how" className="reveal" style={{ position:'relative', zIndex:1, padding:'clamp(4rem,7vw,6rem) 2rem', maxWidth:1000, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:'3.5rem' }}>
          <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:3, color:'rgba(0,255,178,0.6)', marginBottom:12 }}>HOW IT WORKS</div>
          <h2 style={{ fontFamily:HUD, fontSize:'clamp(24px,3.5vw,40px)', fontWeight:900 }}>3 steps, 10 seconds</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:20 }}>
          {STEPS.map(s => (
            <div key={s.n} style={{ background:'#08111F', border:'1px solid rgba(0,255,178,0.08)', borderRadius:12, padding:'2rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <span style={{ fontFamily:HUD, fontSize:11, color:'rgba(0,255,178,0.3)' }}>{s.n}</span>
                <span style={{ fontSize:28 }}>{s.icon}</span>
              </div>
              <div style={{ fontFamily:HUD, fontSize:12, letterSpacing:1, color:'#F0F8FF', marginBottom:10 }}>{s.title}</div>
              <p style={{ fontFamily:BODY, fontSize:14, color:'rgba(240,248,255,0.5)', lineHeight:1.6, margin:0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section id="features" className="reveal" style={{ position:'relative', zIndex:1, padding:'clamp(3rem,6vw,5rem) 2rem', background:'rgba(8,17,31,0.5)' }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'3.5rem' }}>
            <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:3, color:'rgba(0,255,178,0.6)', marginBottom:12 }}>FEATURES</div>
            <h2 style={{ fontFamily:HUD, fontSize:'clamp(24px,3.5vw,40px)', fontWeight:900 }}>Everything you need to trade smart</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16 }}>
            {[
              { icon:'🧠', title:'SMC Analysis', desc:'Order Block, Fair Value Gap, BOS, CHoCH, Liquidity — all detected automatically.' },
              { icon:'⚡', title:'10 Seconds', desc:'Full signal in under 10 seconds after uploading your chart.' },
              { icon:'📊', title:'Macro Calendar', desc:'NFP, CPI, FOMC — real-time alerts with anticipatory signals.' },
              { icon:'🌍', title:'Synthetic Indices + Forex', desc:'Boom, Crash, GainX, Volatility, EUR/USD, XAU/USD and more.' },
              { icon:'📱', title:'Mobile First', desc:'Optimized for mobile. Install the PWA app in 1 tap.' },
              { icon:'🔒', title:'Secure', desc:'SSL encrypted. Payments via certified GeniusPay gateway.' },
            ].map(f => (
              <div key={f.title} style={{ background:'#020408', border:'1px solid rgba(255,255,255,0.05)', borderRadius:10, padding:'1.5rem' }}>
                <div style={{ fontSize:28, marginBottom:12 }}>{f.icon}</div>
                <div style={{ fontFamily:HUD, fontSize:11, letterSpacing:1, color:'#F0F8FF', marginBottom:8 }}>{f.title}</div>
                <p style={{ fontFamily:BODY, fontSize:13, color:'rgba(240,248,255,0.45)', lineHeight:1.6, margin:0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRACK RECORD ────────────────────────────────────── */}
      <section style={{ position:'relative', zIndex:1, padding:'clamp(3rem,6vw,5rem) 2rem', maxWidth:800, margin:'0 auto', textAlign:'center' }}>
        <div style={{ display:'flex', justifyContent:'center', gap:10, marginBottom:16, flexWrap:'wrap' }}>
          <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:3, color:'rgba(0,255,178,0.6)' }}>FULL TRANSPARENCY</div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(0,255,178,0.08)', border:'1px solid rgba(0,255,178,0.25)', borderRadius:100, padding:'3px 10px' }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'#00E676', animation:'pulse 1s infinite', display:'inline-block' }} />
            <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'#00FFB2' }}>VERIFIED LIVE</span>
          </div>
        </div>
        <h2 style={{ fontFamily:HUD, fontSize:'clamp(22px,3vw,36px)', fontWeight:900, marginBottom:16 }}>Our live track record</h2>
        <p style={{ fontFamily:BODY, fontSize:15, color:'rgba(240,248,255,0.5)', marginBottom:32 }}>
          Every signal generated — WIN, LOSS and pending. No filter, no cherry-picking.
        </p>
        <a href="/results" style={{ fontFamily:HUD, fontSize:10, letterSpacing:2, color:'#020408', background:'#00FFB2', padding:'14px 32px', borderRadius:4, textDecoration:'none', fontWeight:700 }}>
          VIEW LIVE TRACK RECORD →
        </a>
      </section>

      {/* ── PRICING ─────────────────────────────────────────── */}
      <section id="pricing" className="reveal" style={{ position:'relative', zIndex:1, padding:'clamp(4rem,7vw,6rem) 2rem', background:'rgba(8,17,31,0.5)' }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'3.5rem' }}>
            <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:3, color:'rgba(0,255,178,0.6)', marginBottom:12 }}>PRICING</div>
            <h2 style={{ fontFamily:HUD, fontSize:'clamp(24px,3.5vw,40px)', fontWeight:900 }}>Choose your plan</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:20, alignItems:'start' }}>
            {PLANS.map(plan => (
              <div key={plan.key} style={{ background: plan.highlight ? 'rgba(0,255,178,0.04)' : '#08111F', border:`1px solid ${plan.highlight ? 'rgba(0,255,178,0.35)' : 'rgba(255,255,255,0.06)'}`, borderRadius:12, padding:'2rem', position:'relative' }}>
                {plan.highlight && (
                  <div style={{ position:'absolute', top:-13, left:'50%', transform:'translateX(-50%)', background:'#00FFB2', color:'#020408', fontFamily:HUD, fontSize:8, letterSpacing:2, padding:'4px 16px', borderRadius:100, fontWeight:900, whiteSpace:'nowrap' }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ fontFamily:HUD, fontSize:11, letterSpacing:2, color:plan.color, marginBottom:8 }}>{plan.name}</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:4 }}>
                  <span style={{ fontFamily:HUD, fontSize:30, fontWeight:900, color:'#F0F8FF' }}>{plan.price}</span>
                  <span style={{ fontFamily:BODY, fontSize:13, color:'rgba(240,248,255,0.4)' }}>{plan.sub}</span>
                </div>
                <div style={{ fontFamily:BODY, fontSize:13, color:plan.color, marginBottom:24 }}>{plan.credits} · {plan.analyses}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ color:plan.color, fontSize:12, flexShrink:0 }}>✓</span>
                      <span style={{ fontFamily:BODY, fontSize:14, color:'rgba(240,248,255,0.6)' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <a href="/auth/login" style={{ display:'block', textAlign:'center', fontFamily:HUD, fontSize:9, letterSpacing:2, textDecoration:'none', padding:'13px', borderRadius:6, fontWeight:700, background: plan.highlight ? '#00FFB2' : 'transparent', color: plan.highlight ? '#020408' : plan.color, border:`1px solid ${plan.color}40` }}>
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAYMENT ─────────────────────────────────────────── */}
      <section style={{ position:'relative', zIndex:1, padding:'3rem 2rem', maxWidth:800, margin:'0 auto', textAlign:'center' }}>
        <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:3, color:'rgba(240,248,255,0.3)', marginBottom:24 }}>PAY YOUR WAY</div>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          {[
            { src:'/logos/visa.png',       alt:'Visa',       bg:'rgba(255,255,255,0.95)', bd:'rgba(0,0,0,0.1)' },
            { src:'/logos/mastercard.png', alt:'Mastercard', bg:'rgba(255,255,255,0.95)', bd:'rgba(0,0,0,0.1)' },
            { src:'/logos/mtn.png',        alt:'MTN MoMo',   bg:'#FFCC00',               bd:'rgba(255,180,0,0.5)' },
            { src:'/logos/geniuspay.png',  alt:'GeniusPay',  bg:'#FFFFFF',               bd:'rgba(0,0,0,0.1)' },
          ].map(l => (
            <div key={l.alt} style={{ background:l.bg, border:`1px solid ${l.bd}`, borderRadius:8, padding:'8px 14px', display:'flex', alignItems:'center', justifyContent:'center', minWidth:100, height:50 }}>
              <img src={l.src} alt={l.alt} style={{ height:30, maxWidth:110, objectFit:'contain' }} />
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap', marginTop:20 }}>
          {['🔒 SSL 256-bit', '🏦 No data stored', '↩️ Cancel anytime', '✓ No hidden fees'].map(b => (
            <span key={b} style={{ fontFamily:BODY, fontSize:12, color:'rgba(240,248,255,0.35)' }}>{b}</span>
          ))}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section style={{ position:'relative', zIndex:1, padding:'clamp(3rem,6vw,5rem) 2rem', maxWidth:700, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:'3rem' }}>
          <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:3, color:'rgba(0,255,178,0.6)', marginBottom:12 }}>FAQ</div>
          <h2 style={{ fontFamily:HUD, fontSize:'clamp(22px,3vw,36px)', fontWeight:900 }}>Frequently asked questions</h2>
        </div>
        {FAQ.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────── */}
      <section style={{ position:'relative', zIndex:1, padding:'clamp(4rem,7vw,6rem) 2rem', textAlign:'center', maxWidth:700, margin:'0 auto' }}>
        <h2 style={{ fontFamily:HUD, fontSize:'clamp(26px,4vw,44px)', fontWeight:900, lineHeight:1.15, marginBottom:16 }}>
          YOUR NEXT TRADE<br />
          <span style={{ color:'#00FFB2' }}>STARTS HERE</span>
        </h2>
        <p style={{ fontFamily:BODY, fontSize:16, color:'rgba(240,248,255,0.45)', marginBottom:32 }}>
          Join {users}+ traders using AI to analyze their charts.
        </p>
        <a href="/auth/login" style={{ fontFamily:HUD, fontSize:12, letterSpacing:2, color:'#020408', background:'#00D4FF', padding:'18px 48px', borderRadius:4, textDecoration:'none', fontWeight:700, display:'inline-block', whiteSpace:'nowrap', animation:'ctaPulse 2.5s ease-in-out infinite' }}>
          CREATE FREE ACCOUNT →
        </a>
        <p style={{ fontFamily:BODY, fontSize:13, color:'rgba(240,248,255,0.25)', marginTop:14 }}>No credit card · 10 free credits</p>
      </section>

      {/* ── LIVE ACTIVITY TOAST ──────────────────────────────── */}
      {toast && (
        <div style={{
          position:'fixed', bottom:24, left:20, zIndex:9998,
          background:'linear-gradient(135deg,#0A1628,#060B14)',
          border:'1px solid rgba(0,212,255,0.3)',
          borderRadius:12, padding:'12px 16px',
          boxShadow:'0 8px 32px rgba(0,0,0,0.6)',
          animation:'toastIn 4.2s ease forwards',
          maxWidth:280, minWidth:220,
        }}>
          <div style={{ height:2, background:'linear-gradient(90deg,transparent,#00D4FF,transparent)', marginBottom:10, borderRadius:2 }} />
          <div style={{ fontFamily:HUD, fontSize:10, color:'#F0F8FF', fontWeight:900, marginBottom:3 }}>{toast.msg}</div>
          <div style={{ fontFamily:BODY, fontSize:12, color:'rgba(240,248,255,0.5)' }}>{toast.sub}</div>
        </div>
      )}

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ position:'relative', zIndex:1, borderTop:'1px solid rgba(255,255,255,0.05)', padding:'2.5rem 2rem', maxWidth:1100, margin:'0 auto', display:'flex', flexWrap:'wrap', gap:16, justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontFamily:HUD, fontSize:12, letterSpacing:2, color:'#00FFB2' }}>PROFIT<span style={{ color:'#00D4FF' }}>YX</span></div>
          <img src="/logos/profityx-logo.jpg" alt="ProfityX" style={{ height:32, width:'auto', objectFit:'contain' }} />
          <div style={{ fontFamily:BODY, fontSize:11, color:'rgba(240,248,255,0.25)' }}>By MonWe Infinity LLC</div>
        </div>
        <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
          {[['#pricing','Pricing'],['#how','How it works'],['#features','Features'],['/results','Results'],['/blog','Blog'],['/legal/cgu','Terms'],['/legal/confidentialite','Privacy']].map(([href,label]) => (
            <a key={href} href={href} style={{ fontFamily:BODY, fontSize:13, color:'rgba(240,248,255,0.3)', textDecoration:'none' }}>{label}</a>
          ))}
        </div>
        {/* Language switcher */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontFamily:BODY, fontSize:12, color:'rgba(240,248,255,0.3)' }}>🌐</span>
          <a href="/" style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, textDecoration:'none',
            color:'rgba(240,248,255,0.35)', border:'1px solid rgba(255,255,255,0.1)',
            padding:'5px 12px', borderRadius:4 }}>FR</a>
          <a href="/en" style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, textDecoration:'none',
            color:'#00D4FF', background:'rgba(0,212,255,0.1)', border:'1px solid rgba(0,212,255,0.3)',
            padding:'5px 12px', borderRadius:4 }}>EN</a>
        </div>
        <div style={{ fontFamily:BODY, fontSize:12, color:'rgba(240,248,255,0.2)' }}>© 2026 MonWe Infinity LLC</div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes toastIn { 0%{transform:translateX(-120%);opacity:0} 15%{transform:translateX(0);opacity:1} 85%{transform:translateX(0);opacity:1} 100%{transform:translateX(-120%);opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ctaPulse { 0%,100%{box-shadow:0 0 40px rgba(0,212,255,0.25)} 50%{box-shadow:0 0 60px rgba(0,212,255,0.55),0 0 100px rgba(0,212,255,0.2)} }
        .reveal { opacity:0; transform:translateY(32px); transition:opacity .7s ease, transform .7s ease; }
        @keyframes scrollTicker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes orbFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-40px) scale(1.1)} 66%{transform:translate(-20px,20px) scale(0.95)} }
        @keyframes orbFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-40px,30px) scale(1.08)} 70%{transform:translate(25px,-20px) scale(0.92)} }
        @keyframes gridPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        .nav-desktop { display: flex !important; }
        .nav-mobile-btn { display: none !important; }
        @media (max-width: 768px) { .nav-desktop { display: none !important; } .nav-mobile-btn { display: flex !important; } }
      `}</style>
    </div>
  )
}
