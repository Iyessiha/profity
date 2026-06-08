'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/theme'

// Bouton toggle thème pour la landing (composant local)
function ThemeToggleLanding() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button onClick={toggleTheme} title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
      style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid rgba(0,255,178,0.25)', background: 'rgba(0,255,178,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme === 'dark' ? '#C9A84C' : '#0EA5E9' }}>
      <i className={'ti ' + (theme === 'dark' ? 'ti-sun' : 'ti-moon')} style={{ fontSize: 16 }} aria-hidden="true" />
    </button>
  )
}

// ── Composant FAQ accordéon ──────────────────────────────────
function FaqItem({ q, a }: { q:string; a:string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom:'1px solid rgba(0,255,178,0.08)', padding:'1.125rem 0', cursor:'pointer' }} onClick={()=>setOpen(v=>!v)}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:16 }}>
        <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:16, fontWeight:600, color:'#E8F4F8', flex:1 }}>{q}</span>
        <span style={{ fontFamily:"'Orbitron',monospace", fontSize:14, color:'#00FFB2', flexShrink:0, transition:'transform .3s', display:'inline-block', transform:open?'rotate(45deg)':'rotate(0deg)' }}>+</span>
      </div>
      {open && <p style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:14, color:'rgba(232,244,248,0.55)', lineHeight:1.75, margin:'12px 0 0', paddingRight:32 }}>{a}</p>}
    </div>
  )
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [stats, setStats] = useState({ analyses: 1240, users: 380, signals: 95 })
  const [time, setTime] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [exitPopup, setExitPopup]   = useState(false)
  const [fomoVisible, setFomoVisible] = useState(false)
  const [liveStats, setLiveStats] = useState({ analyses_24h: 26, total_users: 4800 })

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => {
      if (d.analyses_24h != null) setLiveStats(d)
    }).catch(() => {})
  }, [])

  // Exit intent — souris sort par le haut
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem('px_exit_landing')) return
    const handler = (e: MouseEvent) => {
      if (e.clientY < 8 && !sessionStorage.getItem('px_exit_landing')) {
        sessionStorage.setItem('px_exit_landing', '1')
        setExitPopup(true)
      }
    }
    document.addEventListener('mouseleave', handler)
    return () => document.removeEventListener('mouseleave', handler)
  }, [])

  // Bandeau FOMO — après 8s de lecture
  useEffect(() => {
    const t = setTimeout(() => setFomoVisible(true), 8000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    const tick = () => setTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const t = setInterval(tick, 1000)
    // Stats dynamiques
    fetch('/api/stats').then(r => r.json()).then(d => {
      if (d.analyses) setStats(d)
    }).catch(() => {})
    return () => { window.removeEventListener('scroll', onScroll); clearInterval(t) }
  }, [])

  const HUD = "'Orbitron', monospace"
  const BODY = "'Rajdhani', sans-serif"

  const LOGO = (
    <svg width="34" height="34" viewBox="0 0 200 200" aria-hidden="true" style={{ flexShrink: 0 }}>
      <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00FFB2"/><stop offset="100%" stopColor="#00D4FF"/></linearGradient></defs>
      <rect x="8" y="8" width="184" height="184" rx="40" fill="#020408" stroke="url(#lg)" strokeWidth="3"/>
      <rect x="52" y="80" width="20" height="44" rx="3" fill="#00FFB2"/>
      <line x1="62" y1="58" x2="62" y2="142" stroke="#00FFB2" strokeWidth="3" strokeLinecap="round"/>
      <rect x="90" y="66" width="20" height="60" rx="3" fill="#00D4FF"/>
      <line x1="100" y1="44" x2="100" y2="156" stroke="#00D4FF" strokeWidth="3" strokeLinecap="round"/>
      <rect x="128" y="52" width="20" height="50" rx="3" fill="#00FFB2"/>
      <line x1="138" y1="34" x2="138" y2="120" stroke="#00FFB2" strokeWidth="3" strokeLinecap="round"/>
      <path d="M44 138 L100 96 L138 64" fill="none" stroke="url(#lg)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M126 60 L142 56 L140 74" fill="none" stroke="url(#lg)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )

  const PLANS = [
    { key: 'free',  name: 'STARTER', price: '0',      period: 'pour toujours', featured: false,
      features: ['3 analyses chart / mois', '5 signaux annonces / mois', 'Calendrier economique', 'Support communaute'] },
    { key: 'pro',   name: 'PRO',     price: '17 500', period: 'par mois', featured: true,
      features: ['100 analyses chart / mois', 'Signaux annonces ILLIMITES', 'Alertes push temps reel', 'Historique 90 jours', 'Support prioritaire'] },
    { key: 'elite', name: 'ELITE',   price: '35 000', period: 'par mois', featured: false,
      features: ['Tout ILLIMITE', 'Tous les actifs', 'Alertes prioritaires', 'Historique illimite', 'Support VIP 24/7'] },
  ]

  const FEATURES = [
    { icon: 'ti-chart-candle', title: 'Analyse de Charts IA', desc: 'Uploadez votre graphique, recevez Entree, Stop Loss et Take Profit en quelques secondes.' },
    { icon: 'ti-news',          title: 'Signaux sur Annonces', desc: 'Le calendrier economique analyse par IA. Chaque annonce devient un signal exploitable.' },
    { icon: 'ti-bell',          title: 'Alertes Temps Reel',   desc: 'Notifications push avant chaque annonce a fort impact. Ne ratez plus une opportunite.' },
    { icon: 'ti-world',         title: 'Multi-devises',         desc: 'FCFA, USD, EUR, GHS, NGN. Interface en francais, anglais, arabe et portugais.' },
  ]

  const STEPS = [
    { n: '01', icon: 'ti-upload',       title: 'Uploadez votre chart', desc: 'Prenez une capture de votre graphique et glissez-la dans ProfityX.' },
    { n: '02', icon: 'ti-cpu',          title: "L'IA analyse",         desc: 'Notre moteur IA detecte les niveaux cles, tendances et configurations.' },
    { n: '03', icon: 'ti-target-arrow', title: 'Recevez le signal',    desc: 'Entree, Stop Loss et 3 Take Profit avec ratio risque/recompense.' },
  ]

  const TESTIMONIALS = [
    { name: 'Kouadio A.', role: 'Trader Forex · Abidjan', initials: 'KA', color: '#00FFB2',
      text: "Depuis que j'utilise ProfityX, mes analyses sont 3x plus rapides. Les signaux sur les annonces m'ont evite plusieurs mauvais trades." },
    { name: 'Fatou D.', role: 'Crypto · Dakar', initials: 'FD', color: '#00D4FF',
      text: "Enfin un outil pense pour nous en Afrique, avec le FCFA et en francais. L'analyse de chart est bluffante de precision." },
    { name: 'Yao K.', role: 'Day Trader · Lome', initials: 'YK', color: '#C9A84C',
      text: "Le plan Elite vaut chaque franc. Alertes en temps reel + analyses illimitees, je ne trade plus jamais a l'aveugle." },
  ]

  const BROKERS = [
    { name: 'Binance',  short: 'BNB', desc: 'Crypto Exchange',  color: '#F0B90B', bg: 'rgba(240,185,11,0.1)',  url: 'https://www.binance.com/en/activity/referral-entry/CPA?ref=CPA_0080G3N0DZ' },
    { name: 'Exness',   short: 'EX',  desc: 'Forex & CFD',      color: '#F7D000', bg: 'rgba(247,208,0,0.1)',   url: 'https://one.exnessonelink.com/a/o13sztxg6a' },
    { name: 'HFM',      short: 'HFM', desc: 'HF Markets',       color: '#E30613', bg: 'rgba(227,6,19,0.1)',    url: 'https://www.hfm.com/sv/en/?refid=30490867' },
    { name: 'WelTrade', short: 'WT',  desc: 'Forex Broker',     color: '#0066B3', bg: 'rgba(0,102,179,0.12)',  url: 'https://gowt.net/ib66022' },
    { name: 'Deriv',    short: 'DV',  desc: 'Trading Platform', color: '#FF444F', bg: 'rgba(255,68,79,0.1)',   url: 'https://deriv.partners/rx?sidc=3FE806F1-F584-4A05-BC12-54EE5EE8709E&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU334535' },
  ]

  const TRUST = [
    { icon: 'ti-shield-check', label: 'Paiement securise' },
    { icon: 'ti-bolt',          label: 'Resultats en secondes' },
    { icon: 'ti-lock',          label: 'Donnees chiffrees' },
    { icon: 'ti-headset',       label: 'Support 24/7' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg0)', color: 'var(--tx0)', fontFamily: BODY, overflowX: 'hidden', position: 'relative' }}>

      {/* ── FOND ANIMÉ ── */}
      <div className="orb orb1" /><div className="orb orb2" /><div className="orb orb3" />
      <div className="grid-bg" />
      <div className="scanlines" />
      {/* Chandelles animées en fond */}
      <div className="candles" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="candle" style={{ left: `${i * 8.5}%`, animationDelay: `${i * 0.4}s`, height: `${30 + (i % 4) * 25}px` }} />
        ))}
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? 'rgba(6,9,15,0.92)' : 'transparent', backdropFilter: scrolled ? 'blur(12px)' : 'none', borderBottom: scrolled ? '1px solid rgba(0,255,178,0.08)' : '1px solid transparent', transition: 'all .3s', padding: '0 2rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {LOGO}
          <span style={{ fontFamily: HUD, fontSize: 20, letterSpacing: 4, color: '#00FFB2' }}>PROFIT<span style={{ color: '#00D4FF' }}>YX</span></span>
        </div>
        <div className="nav-links">
          <a href="#how" className="nav-link nav-hide">COMMENT ÇA MARCHE</a>
          <a href="#features" className="nav-link nav-hide">FONCTIONS</a>
          <a href="#pricing" className="nav-link nav-hide">TARIFS</a>
          <a href="#avis" className="nav-link nav-hide">AVIS</a>
          <a href="/auth/login" className="nav-hide" style={{ fontFamily: HUD, fontSize: 10, letterSpacing: 2, color: '#020408', background: '#00FFB2', padding: '9px 20px', borderRadius: 4, textDecoration: 'none', fontWeight: 700 }}>ESSAYER GRATUIT</a>
          <ThemeToggleLanding />
          {/* Hamburger mobile */}
          <button className="hamburger-btn" onClick={() => setMenuOpen(v => !v)} aria-label="Menu"
            style={{ position: 'static' }}>
            <i className={'ti ' + (menuOpen ? 'ti-x' : 'ti-menu-2')} style={{ fontSize: 20 }} aria-hidden="true" />
          </button>
        </div>

        {/* Menu déroulant mobile */}
        {menuOpen && (
          <div className="mobile-only" style={{
            position: 'fixed', top: 64, left: 0, right: 0, zIndex: 99,
            background: 'rgba(6,9,15,0.98)', backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(0,255,178,0.12)',
            flexDirection: 'column', padding: '1rem 1.5rem', gap: 4,
          }}>
            {[['#how','COMMENT ÇA MARCHE'],['#features','FONCTIONS'],['#pricing','TARIFS'],['#avis','AVIS']].map(([href,label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} style={{ fontFamily: HUD, fontSize: 11, letterSpacing: 2, color: 'rgba(232,244,248,0.7)', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid rgba(0,255,178,0.05)' }}>{label}</a>
            ))}
            <a href="/auth/login" onClick={() => setMenuOpen(false)} style={{ fontFamily: HUD, fontSize: 11, letterSpacing: 2, color: '#020408', background: '#00FFB2', padding: '12px', borderRadius: 4, textDecoration: 'none', fontWeight: 700, textAlign: 'center', marginTop: 8 }}>ESSAYER GRATUIT</a>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="hero-section" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '6rem 2rem 4rem', maxWidth: 1200, margin: '0 auto' }}>
        
        {/* Colonne texte */}
        <div className="hero-text-col" style={{ flex: '1 1 500px', maxWidth: 600 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,255,178,0.06)', border: '1px solid rgba(0,255,178,0.2)', borderRadius: 100, padding: '6px 16px', marginBottom: '2rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E676', animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 2, color: '#00FFB2' }}>{`+${liveStats.total_users.toLocaleString()} TRADERS · ${liveStats.analyses_24h} ANALYSES AUJOURD'HUI · ${time}`}</span>
          </div>

          <h1 style={{ fontFamily: HUD, fontSize: 'clamp(36px, 5.5vw, 72px)', fontWeight: 900, lineHeight: 1.04, letterSpacing: 1, marginBottom: '1.5rem' }}>
            TRADEZ PLUS<br /><span style={{ color: '#00FFB2', textShadow: '0 0 30px rgba(0,255,178,0.4)' }}>INTELLIGENT.</span><br />
            <span style={{ color: '#FF3A5C' }}>L'IA ANALYSE,</span> VOUS GAGNEZ.
          </h1>

          <p style={{ fontSize: 'clamp(15px,1.8vw,19px)', color: 'rgba(232,244,248,0.55)', lineHeight: 1.7, maxWidth: 520, marginBottom: '2.5rem', fontWeight: 300 }}>
            Uploadez un graphique, recevez en <strong style={{ color: '#00FFB2', fontWeight: 600 }}>quelques secondes</strong> votre point d'entrée, stop loss et take profit. Plus d'hésitation, plus d'émotion — juste des décisions claires.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <a href="/auth/login" style={{ fontFamily: HUD, fontSize: 11, letterSpacing: 2, color: '#020408', background: '#00FFB2', padding: '16px 32px', borderRadius: 4, textDecoration: 'none', fontWeight: 700, boxShadow: '0 0 40px rgba(0,255,178,0.35)', animation: 'glowPulse 2.5s ease-in-out infinite' }}>COMMENCER GRATUITEMENT →</a>
            <a href="/install" style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 2, color: '#00D4FF', border: '1px solid rgba(0,212,255,0.25)', padding: '12px 20px', borderRadius: 4, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              📲 INSTALLER L'APP
            </a>
            <a href="#how" style={{ fontFamily: HUD, fontSize: 11, letterSpacing: 2, color: 'var(--tx0)', background: 'transparent', border: '1px solid rgba(0,255,178,0.25)', padding: '16px 32px', borderRadius: 4, textDecoration: 'none' }}>VOIR COMMENT</a>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(232,244,248,0.35)', fontWeight: 300, marginBottom: '3rem' }}>✓ Sans carte bancaire &nbsp;·&nbsp; ✓ 10 crédits offerts &nbsp;·&nbsp; ✓ Annulable à tout moment</p>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {TRUST.map(t => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className={'ti ' + t.icon} style={{ fontSize: 18, color: '#00FFB2' }} aria-hidden="true" />
                <span style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 1, color: 'rgba(232,244,248,0.4)' }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne mockup interface */}
        <div className="hero-mockup" style={{ flex: '1 1 420px', justifyContent: 'center', alignItems: 'center', padding: '2rem 0 2rem 3rem' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
            {/* Lueur derrière le mockup */}
            <div style={{ position: 'absolute', inset: -30, background: 'radial-gradient(ellipse at center, rgba(0,255,178,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

            {/* Carte principale — interface ProfityX */}
            <div style={{ position: 'relative', zIndex: 1, background: 'linear-gradient(160deg, #0D1420 0%, #060810 100%)', border: '1px solid rgba(0,255,178,0.2)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,255,178,0.06)' }}>
              
              {/* Barre top simulée */}
              <div style={{ background: 'rgba(2,4,8,0.9)', borderBottom: '1px solid rgba(0,255,178,0.08)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontFamily: HUD, fontSize: 11, fontWeight: 900, color: '#00FFB2', letterSpacing: 1 }}>PROFIT<span style={{ color: '#00D4FF' }}>YX</span></div>
                  <div style={{ background: 'rgba(0,255,178,0.1)', border: '1px solid rgba(0,255,178,0.2)', borderRadius: 4, padding: '2px 8px', fontFamily: HUD, fontSize: 7, letterSpacing: 1, color: '#00FFB2' }}>PRO</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,255,178,0.08)', border: '1px solid rgba(0,255,178,0.15)', borderRadius: 5, padding: '3px 9px' }}>
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="#00FFB2"><circle cx="8" cy="8" r="7" fill="rgba(0,255,178,0.2)"/><path d="M5 8h3M8 5v6" stroke="#00FFB2" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    <span style={{ fontFamily: HUD, fontSize: 8, color: '#00FFB2', fontWeight: 700 }}>142</span>
                  </div>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #00FFB2, #00D4FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HUD, fontSize: 10, fontWeight: 900, color: '#020408' }}>K</div>
                </div>
              </div>

              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Mini chart simulé */}
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,255,178,0.07)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontFamily: HUD, fontSize: 9, color: '#00FFB2', letterSpacing: 1 }}>XAU/USD · H4</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E676', animation: 'pulse 1.5s infinite' }} />
                      <span style={{ fontFamily: HUD, fontSize: 7, color: 'rgba(232,244,248,0.4)' }}>LIVE</span>
                    </div>
                  </div>
                  {/* SVG chart simulé avec chandeliers */}
                  <svg width="100%" height="72" viewBox="0 0 380 72" preserveAspectRatio="none">
                    {/* Grille */}
                    {[18, 36, 54].map(y => <line key={y} x1="0" y1={y} x2="380" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>)}
                    {/* Zone verte sous la courbe */}
                    <defs>
                      <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00FFB2" stopOpacity="0.15"/>
                        <stop offset="100%" stopColor="#00FFB2" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <path d="M0,60 L30,52 L60,55 L90,42 L120,38 L150,44 L180,30 L210,26 L240,32 L270,18 L300,22 L330,14 L360,10 L380,8 L380,72 L0,72 Z" fill="url(#chartFill)"/>
                    {/* Ligne principale */}
                    <path d="M0,60 L30,52 L60,55 L90,42 L120,38 L150,44 L180,30 L210,26 L240,32 L270,18 L300,22 L330,14 L360,10 L380,8" stroke="#00FFB2" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                    {/* Chandeliers verts */}
                    {[[30,48,56],[90,38,46],[150,40,48],[210,22,30],[270,14,22],[330,10,18]].map(([x,y1,y2],i) => (
                      <g key={i}>
                        <line x1={x} y1={y1} x2={x} y2={y2} stroke="#00FFB2" strokeWidth="5" strokeLinecap="round" opacity="0.8"/>
                      </g>
                    ))}
                    {/* Chandeliers rouges */}
                    {[[60,51,58],[120,34,42],[240,28,36],[360,7,14]].map(([x,y1,y2],i) => (
                      <g key={i}>
                        <line x1={x} y1={y1} x2={x} y2={y2} stroke="#FF3A5C" strokeWidth="5" strokeLinecap="round" opacity="0.8"/>
                      </g>
                    ))}
                    {/* Niveau entrée */}
                    <line x1="200" y1="26" x2="380" y2="26" stroke="#00FFB2" strokeWidth="1" strokeDasharray="4,3"/>
                    {/* Niveau SL */}
                    <line x1="200" y1="46" x2="380" y2="46" stroke="#FF3A5C" strokeWidth="1" strokeDasharray="4,3"/>
                    {/* Niveau TP */}
                    <line x1="200" y1="8" x2="380" y2="8" stroke="#00D4FF" strokeWidth="1" strokeDasharray="4,3"/>
                    {/* Labels */}
                    <text x="305" y="23" fontFamily="monospace" fontSize="8" fill="#00FFB2">ENTRÉE</text>
                    <text x="320" y="43" fontFamily="monospace" fontSize="8" fill="#FF3A5C">SL</text>
                    <text x="325" y="6" fontFamily="monospace" fontSize="8" fill="#00D4FF">TP</text>
                  </svg>
                </div>

                {/* Signal card */}
                <div style={{ background: 'linear-gradient(135deg, rgba(0,255,178,0.06), rgba(0,212,255,0.04))', border: '1px solid rgba(0,255,178,0.18)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontFamily: HUD, fontSize: 16, fontWeight: 900, color: '#00FFB2' }}>LONG</span>
                        <span style={{ fontFamily: HUD, fontSize: 11, color: '#E8F4F8' }}>XAU/USD</span>
                        <span style={{ fontFamily: HUD, fontSize: 8, color: '#00D4FF', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 3, padding: '1px 6px' }}>H4</span>
                      </div>
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: 'rgba(232,244,248,0.45)' }}>Order Block + FVG confirmé</div>
                    </div>
                    <div style={{ background: 'rgba(0,255,178,0.1)', border: '1px solid rgba(0,255,178,0.2)', borderRadius: 6, padding: '4px 10px', textAlign: 'center' }}>
                      <div style={{ fontFamily: HUD, fontSize: 8, color: 'rgba(232,244,248,0.4)', marginBottom: 1 }}>R/R</div>
                      <div style={{ fontFamily: HUD, fontSize: 14, fontWeight: 900, color: '#00FFB2' }}>1:3.2</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                    {[
                      { l:'ENTRÉE', v:'2 318.50', c:'#00FFB2' },
                      { l:'STOP', v:'2 302.00', c:'#FF3A5C' },
                      { l:'TP1', v:'2 351.20', c:'#00D4FF' },
                    ].map(s => (
                      <div key={s.l} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 7, padding: '7px 8px', textAlign: 'center' }}>
                        <div style={{ fontFamily: HUD, fontSize: 7, letterSpacing: 1, color: 'rgba(232,244,248,0.35)', marginBottom: 3 }}>{s.l}</div>
                        <div style={{ fontFamily: HUD, fontSize: 10, fontWeight: 700, color: s.c }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Barre de confiance IA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontFamily: HUD, fontSize: 7, letterSpacing: 1, color: 'rgba(232,244,248,0.35)', whiteSpace: 'nowrap' }}>CONFIANCE IA</div>
                  <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: '87%', height: '100%', background: 'linear-gradient(90deg, #00FFB2, #00D4FF)', borderRadius: 3 }} />
                  </div>
                  <div style={{ fontFamily: HUD, fontSize: 9, fontWeight: 900, color: '#00FFB2' }}>87%</div>
                </div>

              </div>

              {/* Barre crédits — fidèle à la vraie interface */}
              <div style={{ background: 'rgba(0,255,178,0.03)', borderTop: '1px solid rgba(0,255,178,0.06)', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#00FFB2" strokeWidth="1.2"/><path d="M8 4v4l2 2" stroke="#00FFB2" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <span style={{ fontFamily: HUD, fontSize: 7, letterSpacing: 2, color: 'rgba(232,244,248,0.3)' }}>CRÉDITS</span>
                <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                  <div style={{ width: '68%', height: '100%', background: 'linear-gradient(90deg,#00FFB2,#00D4FF)', borderRadius: 2 }} />
                </div>
                <span style={{ fontFamily: HUD, fontSize: 9, fontWeight: 700, color: '#00FFB2' }}>142</span>
                <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: 'rgba(232,244,248,0.3)' }}>restants</span>
              </div>
            </div>

            {/* Badge flottant "Généré en 3 sec" */}
            <div style={{ position: 'absolute', top: -14, right: -10, background: 'linear-gradient(135deg, #00FFB2, #00D4FF)', borderRadius: 20, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 20px rgba(0,255,178,0.4)', zIndex: 2 }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 1l1.5 4.5H14l-3.5 2.5 1.5 4.5L8 10 4 12.5l1.5-4.5L2 5.5h4.5z" fill="#020408"/></svg>
              <span style={{ fontFamily: HUD, fontSize: 8, fontWeight: 900, color: '#020408', letterSpacing: 1 }}>GÉNÉRÉ EN 3 SEC</span>
            </div>

            {/* Badge flottant bas gauche "SMC" */}
            <div style={{ position: 'absolute', bottom: -12, left: -10, background: 'rgba(6,9,15,0.95)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: 20, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 20px rgba(0,0,0,0.5)', zIndex: 2 }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zm0 2l1.5 3H12l-2.5 1.8 1 3L8 10l-2.5 1.8 1-3L4 7h2.5z" fill="#C9A84C"/></svg>
              <span style={{ fontFamily: HUD, fontSize: 8, fontWeight: 900, color: '#C9A84C', letterSpacing: 1 }}>ANALYSE SMC PRO</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section id="how" style={{ position: 'relative', zIndex: 1, padding: '5rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontFamily: HUD, fontSize: 10, letterSpacing: 4, color: '#00D4FF', marginBottom: 12 }}>EN 3 ÉTAPES</div>
          <h2 style={{ fontFamily: HUD, fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, letterSpacing: 1 }}>SIMPLE COMME <span style={{ color: '#00FFB2' }}>1·2·3</span></h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {STEPS.map(s => (
            <div key={s.n} className="feat-card" style={{ background: 'var(--bg1)', border: '1px solid rgba(0,255,178,0.08)', borderRadius: 12, padding: '2rem', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 16, right: 20, fontFamily: HUD, fontSize: 40, fontWeight: 900, color: 'rgba(0,255,178,0.08)' }}>{s.n}</div>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(0,255,178,0.08)', border: '1px solid rgba(0,255,178,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <i className={'ti ' + s.icon} style={{ fontSize: 26, color: '#00FFB2' }} aria-hidden="true" />
              </div>
              <h3 style={{ fontFamily: HUD, fontSize: 15, letterSpacing: 1, marginBottom: 10 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(232,244,248,0.45)', lineHeight: 1.6, fontWeight: 300 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      {/* ── STATS RÉELLES ── */}
      <section style={{ position:'relative', zIndex:1, padding:'2rem', borderTop:'1px solid rgba(0,255,178,0.06)', borderBottom:'1px solid rgba(0,255,178,0.06)', background:'rgba(0,255,178,0.02)' }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:24, textAlign:'center' }}>
          {[
            { v: stats.analyses, label:'Analyses générées', suffix:'', color:'#00FFB2' },
            { v: stats.users,    label:'Traders inscrits',  suffix:'', color:'#00D4FF' },
            { v: stats.signals,  label:'Signaux macro',     suffix:'', color:'#C9A84C' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:'clamp(28px,5vw,42px)', fontWeight:900, color:s.color, lineHeight:1 }}>
                {s.v.toLocaleString('fr-FR')}{s.suffix}
              </div>
              <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:14, color:'rgba(232,244,248,0.4)', marginTop:6, letterSpacing:1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" style={{ position: 'relative', zIndex: 1, padding: '5rem 2rem', maxWidth: 1200, margin: '0 auto' }}>

      {/* ── SECTION MULTI-DEVICE ── */}
      <section style={{ position:'relative', zIndex:1, padding:'5rem 2rem', maxWidth:1200, margin:'0 auto', textAlign:'center' }}>
        <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:3, color:'rgba(0,255,178,0.6)', marginBottom:12 }}>
          PLATEFORME WEB PROGRESSIVE
        </div>
        <h2 style={{ fontFamily:HUD, fontSize:'clamp(24px,3.5vw,42px)', fontWeight:900, color:'#E8F4F8', marginBottom:12, lineHeight:1.1 }}>
          DISPONIBLE SUR TOUS<br/>
          <span style={{ color:'#00FFB2' }}>VOS APPAREILS</span>
        </h2>
        <p style={{ fontFamily:BODY, fontSize:'clamp(14px,1.5vw,17px)', color:'rgba(232,244,248,0.45)', maxWidth:520, margin:'0 auto 4rem' }}>
          Accédez à vos signaux IA depuis n'importe où — ordinateur, smartphone ou tablette. Aucun téléchargement requis.
        </p>

        {/* Grille des 3 devices */}
        <div style={{ display:'flex', gap:'2rem', alignItems:'flex-end', justifyContent:'center', flexWrap:'wrap' }}>

          {/* ── SMARTPHONE ── */}
          <div style={{ flex:'0 0 auto', display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
            {/* Frame iPhone */}
            <div style={{
              width:180, background:'#0A0F1A', borderRadius:30,
              border:'6px solid #1A2233', boxShadow:'0 0 0 1px rgba(0,255,178,0.1), 0 20px 60px rgba(0,0,0,0.6)',
              position:'relative', overflow:'hidden',
            }}>
              {/* Notch */}
              <div style={{ background:'#0A0F1A', height:20, display:'flex', alignItems:'center', justifyContent:'center', paddingTop:4 }}>
                <div style={{ width:60, height:10, background:'#060B14', borderRadius:10 }} />
              </div>
              {/* Écran */}
              <div style={{ background:'#020408', padding:'10px 8px 14px', minHeight:320 }}>
                {/* TopBar mini */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontFamily:HUD, fontSize:5, color:'#00FFB2', letterSpacing:1 }}>PROFITYX</span>
                  <span style={{ fontFamily:HUD, fontSize:5, color:'rgba(0,255,178,0.4)' }}>PRO</span>
                </div>
                {/* Signal Card mini */}
                <div style={{ background:'#0B1117', border:'1px solid rgba(0,255,178,0.15)', borderRadius:8, padding:'8px 8px', marginBottom:6 }}>
                  <div style={{ fontFamily:HUD, fontSize:9, color:'#00FFB2', fontWeight:900, letterSpacing:1 }}>BOOM 1000</div>
                  <div style={{ fontFamily:HUD, fontSize:6, color:'rgba(232,244,248,0.4)', marginBottom:6 }}>H1 · SELL LIMIT</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
                    <div style={{ background:'rgba(0,255,178,0.06)', border:'1px solid rgba(0,255,178,0.15)', borderRadius:4, padding:'4px 5px', textAlign:'center' }}>
                      <div style={{ fontFamily:HUD, fontSize:5, color:'rgba(0,255,178,0.5)', marginBottom:2 }}>ENTRÉE</div>
                      <div style={{ fontFamily:HUD, fontSize:9, color:'#00FFB2', fontWeight:700 }}>111 160</div>
                    </div>
                    <div style={{ background:'rgba(255,58,92,0.06)', border:'1px solid rgba(255,58,92,0.15)', borderRadius:4, padding:'4px 5px', textAlign:'center' }}>
                      <div style={{ fontFamily:HUD, fontSize:5, color:'rgba(255,58,92,0.5)', marginBottom:2 }}>STOP</div>
                      <div style={{ fontFamily:HUD, fontSize:9, color:'#FF3A5C', fontWeight:700 }}>111 560</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:3, marginTop:4 }}>
                    {['110 760','110 360','109 960'].map((tp,i) => (
                      <div key={tp} style={{ flex:1, background:'rgba(0,255,178,0.04)', border:'1px solid rgba(0,255,178,0.08)', borderRadius:3, padding:'3px 0', textAlign:'center' }}>
                        <div style={{ fontFamily:HUD, fontSize:4, color:'rgba(0,255,178,0.4)' }}>TP{i+1}</div>
                        <div style={{ fontFamily:HUD, fontSize:6, color:'rgba(0,255,178,0.7)' }}>{tp}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Confidence */}
                <div style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 6px', background:'rgba(0,255,178,0.04)', border:'1px solid rgba(0,255,178,0.1)', borderRadius:4 }}>
                  <span style={{ fontSize:8 }}>●●●</span>
                  <span style={{ fontFamily:HUD, fontSize:5, color:'#00FFB2', letterSpacing:1 }}>CONFIANCE ÉLEVÉE</span>
                </div>
                {/* Nav bar */}
                <div style={{ display:'flex', justifyContent:'space-around', marginTop:14, paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                  {['⊞','📊','📰','📋'].map((ic,i) => (
                    <div key={i} style={{ fontSize:12, opacity: i===1?1:0.3 }} />
                  ))}
                </div>
              </div>
              {/* Home indicator */}
              <div style={{ height:16, background:'#020408', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ width:50, height:3, background:'rgba(255,255,255,0.2)', borderRadius:3 }} />
              </div>
            </div>
            <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'rgba(232,244,248,0.4)' }}>SMARTPHONE</div>
          </div>

          {/* ── PC / LAPTOP ── */}
          <div style={{ flex:'0 0 auto', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
            {/* Écran */}
            <div style={{
              width:480, background:'#0A0F1A', borderRadius:'12px 12px 0 0',
              border:'6px solid #1A2233', borderBottom:'none',
              boxShadow:'0 0 0 1px rgba(0,255,178,0.12), 0 -4px 40px rgba(0,255,178,0.06)',
              overflow:'hidden',
            }}>
              {/* Barre chrome */}
              <div style={{ background:'#06090F', height:22, display:'flex', alignItems:'center', padding:'0 10px', gap:5 }}>
                {['#FF5F57','#FFBD2E','#28CA41'].map(c => (
                  <div key={c} style={{ width:7, height:7, borderRadius:'50%', background:c }} />
                ))}
                <div style={{ flex:1, background:'#0A0F1A', borderRadius:3, height:12, margin:'0 10px', display:'flex', alignItems:'center', paddingLeft:6 }}>
                  <span style={{ fontFamily:HUD, fontSize:5, color:'rgba(0,255,178,0.4)', letterSpacing:1 }}>profity-x.com/dashboard</span>
                </div>
              </div>
              {/* Interface dashboard */}
              <div style={{ display:'flex', minHeight:240 }}>
                {/* Sidebar mini */}
                <div style={{ width:80, background:'#06090F', borderRight:'1px solid rgba(255,255,255,0.05)', padding:'8px 0', flexShrink:0 }}>
                  <div style={{ fontFamily:HUD, fontSize:7, color:'#00FFB2', letterSpacing:1, padding:'6px 8px', fontWeight:900 }}>PX</div>
                  {[
                    { icon:'⊞', label:'BOARD', active:true },
                    { icon:'📊', label:'ANALYSE', active:false },
                    { icon:'📰', label:'MACRO', active:false },
                    { icon:'📋', label:'HISTORY', active:false },
                  ].map(item => (
                    <div key={item.label} style={{
                      padding:'6px 8px', marginBottom:2,
                      background: item.active ? 'rgba(0,255,178,0.08)' : 'transparent',
                      borderLeft: item.active ? '2px solid #00FFB2' : '2px solid transparent',
                    }}>
                      <div style={{ fontFamily:HUD, fontSize:5, color: item.active ? '#00FFB2' : 'rgba(232,244,248,0.25)', letterSpacing:1 }}>{item.label}</div>
                    </div>
                  ))}
                </div>
                {/* Contenu principal */}
                <div style={{ flex:1, padding:'8px', background:'#020408' }}>
                  {/* Stats row */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:4, marginBottom:6 }}>
                    {[
                      { l:'ANALYSES', v:'87', c:'var(--ac)' },
                      { l:'SIGNAUX', v:'∞', c:'#00D4FF' },
                      { l:'PLAN', v:'PRO', c:'#00FFB2' },
                      { l:'CRÉDITS', v:'593', c:'#C9A84C' },
                    ].map(s => (
                      <div key={s.l} style={{ background:'#0B1117', border:'1px solid rgba(255,255,255,0.06)', borderRadius:5, padding:'5px 6px' }}>
                        <div style={{ fontFamily:HUD, fontSize:4, color:'rgba(232,244,248,0.3)', letterSpacing:1 }}>{s.l}</div>
                        <div style={{ fontFamily:HUD, fontSize:11, fontWeight:900, color:s.c }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  {/* Accès rapide */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:4, marginBottom:6 }}>
                    {[
                      { title:'ANALYSE CHART', color:'#00FFB2' },
                      { title:'MACRO NEWS', color:'#00D4FF' },
                      { title:'HISTORIQUE', color:'#C9A84C' },
                    ].map(m => (
                      <div key={m.title} style={{ background:'#0B1117', border:`1px solid ${m.color}15`, borderRadius:5, padding:'6px' }}>
                        <div style={{ fontFamily:HUD, fontSize:5, color:m.color, letterSpacing:0.5, marginBottom:3 }}>{m.title}</div>
                        <div style={{ fontFamily:HUD, fontSize:7, color:m.color, letterSpacing:1 }}>ACCÉDER →</div>
                      </div>
                    ))}
                  </div>
                  {/* Chart area */}
                  <div style={{ background:'#06090F', border:'1px solid rgba(255,255,255,0.05)', borderRadius:5, height:60, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative' }}>
                    <svg viewBox="0 0 200 50" style={{ width:'100%', height:'100%', opacity:0.7 }}>
                      <polyline points="0,45 20,38 40,42 60,30 80,35 100,20 120,28 140,15 160,22 180,10 200,15" fill="none" stroke="#00FFB2" strokeWidth="1.5" />
                      <polyline points="0,45 20,38 40,42 60,30 80,35 100,20 120,28 140,15 160,22 180,10 200,15 200,50 0,50" fill="rgba(0,255,178,0.05)" />
                    </svg>
                    <div style={{ position:'absolute', right:6, top:4, fontFamily:HUD, fontSize:5, color:'#00FFB2', letterSpacing:1 }}>+12.4%</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Base laptop */}
            <div style={{ width:530, height:10, background:'linear-gradient(180deg,#1A2233,#0D1420)', borderRadius:'0 0 4px 4px', boxShadow:'0 4px 20px rgba(0,0,0,0.5)' }} />
            <div style={{ width:200, height:4, background:'#0D1420', borderRadius:'0 0 8px 8px' }} />
            <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'rgba(232,244,248,0.4)', marginTop:4 }}>ORDINATEUR</div>
          </div>

          {/* ── TABLETTE ── */}
          <div style={{ flex:'0 0 auto', display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
            <div style={{
              width:210, background:'#0A0F1A', borderRadius:16,
              border:'6px solid #1A2233',
              boxShadow:'0 0 0 1px rgba(0,212,255,0.1), 0 20px 60px rgba(0,0,0,0.6)',
              overflow:'hidden',
            }}>
              {/* Barre status */}
              <div style={{ background:'#06090F', height:14, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 10px' }}>
                <span style={{ fontFamily:HUD, fontSize:4, color:'rgba(232,244,248,0.3)' }}>09:35</span>
                <span style={{ fontFamily:HUD, fontSize:4, color:'rgba(232,244,248,0.3)' }}>●●●</span>
              </div>
              {/* Calendrier macro */}
              <div style={{ background:'#020408', padding:'8px' }}>
                <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'#00FFB2', marginBottom:8 }}>CALENDRIER ÉCONOMIQUE</div>
                {[
                  { time:'59h', event:'Core CPI m/m', country:'USD', impact:'HIGH', action:'ANTICIPER' },
                  { time:'48h', event:'BOC Rate', country:'CAD', impact:'HIGH', action:'ANTICIPER' },
                  { time:'70h', event:'Main Refin.', country:'EUR', impact:'HIGH', action:'ANTICIPER' },
                ].map((ev, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 6px', background:'#0B1117', border:'1px solid rgba(255,255,255,0.05)', borderRadius:5, marginBottom:4 }}>
                    <div style={{ width:5, height:5, borderRadius:'50%', background:'#FF3A5C', flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:HUD, fontSize:5, color:'#E8F4F8', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ev.event}</div>
                      <div style={{ fontFamily:HUD, fontSize:4, color:'#00D4FF' }}>{ev.country} · {ev.time}</div>
                    </div>
                    <div style={{ fontFamily:HUD, fontSize:5, color:'#C9A84C', background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.25)', borderRadius:3, padding:'2px 4px', flexShrink:0 }}>
                      {ev.action}
                    </div>
                  </div>
                ))}
                {/* Section à venir */}
                <div style={{ fontFamily:HUD, fontSize:5, color:'rgba(0,212,255,0.6)', letterSpacing:1, marginTop:8, marginBottom:4 }}>⏰ À VENIR · 3</div>
                <div style={{ background:'rgba(0,255,178,0.04)', border:'1px solid rgba(0,255,178,0.1)', borderRadius:5, padding:'6px', textAlign:'center' }}>
                  <div style={{ fontFamily:HUD, fontSize:6, color:'#00FFB2' }}>SIGNAL IA DISPONIBLE</div>
                  <div style={{ fontFamily:BODY, fontSize:9, color:'rgba(232,244,248,0.4)', marginTop:2 }}>Anticiper avant publication</div>
                </div>
              </div>
            </div>
            <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'rgba(232,244,248,0.4)' }}>TABLETTE</div>
          </div>

        </div>

        {/* Badges sous les devices */}
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginTop:'3rem' }}>
          {[
            '✓ Aucun téléchargement requis',
            '✓ Accès depuis le navigateur',
            '✓ Synchronisation temps réel',
            '✓ Installation PWA optionnelle',
          ].map(badge => (
            <span key={badge} style={{
              fontFamily:BODY, fontSize:13, color:'rgba(232,244,248,0.45)',
              background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:100, padding:'6px 16px',
            }}>{badge}</span>
          ))}
        </div>
      </section>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontFamily: HUD, fontSize: 10, letterSpacing: 4, color: '#00D4FF', marginBottom: 12 }}>FONCTIONNALITÉS</div>
          <h2 style={{ fontFamily: HUD, fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, letterSpacing: 1 }}>TOUT POUR <span style={{ color: '#00FFB2' }}>RÉUSSIR</span></h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {FEATURES.map(f => (
            <div key={f.title} className="feat-card" style={{ background: 'var(--bg1)', border: '1px solid rgba(0,255,178,0.08)', borderRadius: 8, padding: '2rem' }}>
              <div style={{ width: 52, height: 52, borderRadius: 10, background: 'rgba(0,255,178,0.08)', border: '1px solid rgba(0,255,178,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <i className={'ti ' + f.icon} style={{ fontSize: 24, color: '#00FFB2' }} aria-hidden="true" />
              </div>
              <h3 style={{ fontFamily: HUD, fontSize: 14, letterSpacing: 1, marginBottom: 10 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(232,244,248,0.45)', lineHeight: 1.6, fontWeight: 300 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── AVIS / TÉMOIGNAGES ── */}
      <section id="avis" style={{ position: 'relative', zIndex: 1, padding: '5rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontFamily: HUD, fontSize: 10, letterSpacing: 4, color: '#00D4FF', marginBottom: 12 }}>ILS NOUS FONT CONFIANCE</div>
          <h2 style={{ fontFamily: HUD, fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, letterSpacing: 1 }}>CE QU'ILS EN <span style={{ color: '#00FFB2' }}>DISENT</span></h2>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 14 }}>
            {Array.from({ length: 5 }).map((_, i) => <i key={i} className="ti ti-star-filled" style={{ color: '#C9A84C', fontSize: 18 }} aria-hidden="true" />)}
            <span style={{ fontFamily: HUD, fontSize: 11, color: 'rgba(232,244,248,0.5)', marginLeft: 8, letterSpacing: 1 }}>4.8/5 · 1 200+ AVIS</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 20 }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="feat-card" style={{ background: 'var(--bg1)', border: '1px solid rgba(0,255,178,0.1)', borderRadius: 12, padding: '2rem' }}>
              <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
                {Array.from({ length: 5 }).map((_, i) => <i key={i} className="ti ti-star-filled" style={{ color: '#C9A84C', fontSize: 13 }} aria-hidden="true" />)}
              </div>
              <p style={{ fontSize: 15, color: 'rgba(232,244,248,0.7)', lineHeight: 1.7, fontWeight: 300, marginBottom: '1.5rem', fontStyle: 'italic' }}>“{t.text}”</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: t.color + '20', border: '1px solid ' + t.color + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HUD, fontSize: 13, fontWeight: 700, color: t.color }}>{t.initials}</div>
                <div>
                  <div style={{ fontFamily: HUD, fontSize: 11, letterSpacing: 1, color: 'var(--tx0)' }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(232,244,248,0.4)' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ position: 'relative', zIndex: 1, padding: '5rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontFamily: HUD, fontSize: 10, letterSpacing: 4, color: '#00D4FF', marginBottom: 12 }}>TARIFS</div>
          <h2 style={{ fontFamily: HUD, fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, letterSpacing: 1 }}>INVESTISSEZ EN <span style={{ color: '#00FFB2' }}>VOUS</span></h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {PLANS.map(plan => (
            <div key={plan.key} style={{ background: plan.featured ? '#0D1420' : '#06090F', border: '1px solid ' + (plan.featured ? 'rgba(0,255,178,0.35)' : 'rgba(0,255,178,0.1)'), borderRadius: 8, padding: '2rem', position: 'relative', overflow: 'hidden', transform: plan.featured ? 'scale(1.03)' : 'none' }}>
              {plan.featured && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#00FFB2,#00D4FF,transparent)' }} />}
              {plan.featured && <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,255,178,0.1)', border: '1px solid rgba(0,255,178,0.25)', color: '#00FFB2', fontFamily: HUD, fontSize: 8, letterSpacing: 2, padding: '3px 10px', borderRadius: 2 }}>POPULAIRE</div>}
              <div style={{ fontFamily: HUD, fontSize: 11, letterSpacing: 4, color: 'rgba(232,244,248,0.4)', marginBottom: '1rem' }}>{plan.name}</div>
              <div style={{ fontFamily: HUD, fontSize: 44, fontWeight: 900, lineHeight: 1, color: 'var(--tx0)' }}>{plan.price}</div>
              <div style={{ fontSize: 13, color: 'rgba(232,244,248,0.4)', marginBottom: '1.5rem' }}>FCFA · {plan.period}</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '2rem', padding: 0 }}>
                {plan.features.map(feat => (
                  <li key={feat} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(232,244,248,0.6)', fontWeight: 300 }}>
                    <i className="ti ti-circle-check-filled" style={{ color: '#00E676', fontSize: 16 }} aria-hidden="true" /> {feat}
                  </li>
                ))}
              </ul>
              <a href="/auth/login" style={{ display: 'block', textAlign: 'center', padding: '13px', borderRadius: 4, fontFamily: HUD, fontSize: 10, letterSpacing: 2, textDecoration: 'none', fontWeight: 700, background: plan.featured ? '#00FFB2' : 'transparent', color: plan.featured ? '#020408' : '#E8F4F8', border: plan.featured ? 'none' : '1px solid rgba(0,255,178,0.2)' }}>
                {plan.key === 'free' ? 'COMMENCER GRATUITEMENT' : 'CHOISIR CE PLAN'}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── PARTENAIRES / BROKERS ── */}
      <section id="partenaires" style={{ position: 'relative', zIndex: 1, padding: '5rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontFamily: HUD, fontSize: 10, letterSpacing: 4, color: '#00D4FF', marginBottom: 12 }}>NOS PARTENAIRES</div>
          <h2 style={{ fontFamily: HUD, fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, letterSpacing: 1 }}>BROKERS <span style={{ color: '#00FFB2' }}>RECOMMANDÉS</span></h2>
          <p style={{ fontSize: 15, color: 'rgba(232,244,248,0.4)', marginTop: 12, fontWeight: 300 }}>Ouvrez un compte chez nos partenaires de confiance</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 32 }}>
          {BROKERS.map(b => (
            <a key={b.name} href={b.url} target="_blank" rel="noopener noreferrer" className="broker-card" style={{ background: 'linear-gradient(135deg, #0D1420, #06090F)', border: '1px solid rgba(0,255,178,0.12)', borderRadius: 12, padding: '1.75rem 1.25rem', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,' + b.color + ',transparent)' }} />
              <div style={{ width: 64, height: 64, borderRadius: 14, background: b.bg, border: '1px solid ' + b.color + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HUD, fontSize: 20, fontWeight: 900, color: b.color }}>{b.short}</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: HUD, fontSize: 13, letterSpacing: 1, color: 'var(--tx0)', marginBottom: 4 }}>{b.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(232,244,248,0.4)', fontWeight: 300 }}>{b.desc}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: b.color + '15', border: '1px solid ' + b.color + '30', borderRadius: 100, padding: '6px 14px', fontFamily: HUD, fontSize: 8, letterSpacing: 1, color: b.color }}>
                <i className="ti ti-external-link" style={{ fontSize: 12 }} aria-hidden="true" /> OUVRIR UN COMPTE
              </div>
            </a>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          <a href="https://linktr.ee/coachyessiha" target="_blank" rel="noopener noreferrer" className="partner-card" style={{ background: 'linear-gradient(135deg, #0D1420, #06090F)', border: '1px solid rgba(0,255,178,0.2)', borderRadius: 12, padding: '2rem', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#00FFB2,#00D4FF,transparent)' }} />
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #00FFB2, #00D4FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HUD, fontSize: 28, fontWeight: 900, color: '#020408' }}>CY</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: HUD, fontSize: 15, letterSpacing: 1, color: 'var(--tx0)', marginBottom: 6 }}>COACH YESSIHA</div>
              <div style={{ fontSize: 14, color: 'rgba(232,244,248,0.5)', fontWeight: 300 }}>Coaching & Formation Trading</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,255,178,0.1)', border: '1px solid rgba(0,255,178,0.25)', borderRadius: 100, padding: '8px 18px', fontFamily: HUD, fontSize: 9, letterSpacing: 2, color: '#00FFB2' }}>
              <i className="ti ti-link" style={{ fontSize: 14 }} aria-hidden="true" /> VOIR TOUS MES LIENS
            </div>
          </a>
          <div className="partner-card" style={{ background: 'linear-gradient(135deg, #0D1420, #06090F)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 12, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#00D4FF,#C9A84C,transparent)' }} />
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #00D4FF, #C9A84C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HUD, fontSize: 24, fontWeight: 900, color: '#020408' }}>MW</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: HUD, fontSize: 15, letterSpacing: 1, color: 'var(--tx0)', marginBottom: 6 }}>MONWE INFINITY</div>
              <div style={{ fontSize: 14, color: 'rgba(232,244,248,0.5)', fontWeight: 300 }}>Éditeur officiel de ProfityX</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 100, padding: '8px 18px', fontFamily: HUD, fontSize: 9, letterSpacing: 2, color: '#00D4FF' }}>
              <i className="ti ti-building" style={{ fontSize: 14 }} aria-hidden="true" /> USA · NEW MEXICO
            </div>
          </div>
        </div>
      </section>

      {/* ── PAIEMENT SÉCURISÉ ── */}
      <section style={{ position:'relative', zIndex:1, padding:'4rem 2rem', maxWidth:900, margin:'0 auto' }}>
        <div style={{ background:'linear-gradient(135deg, rgba(0,255,178,0.04), rgba(0,212,255,0.03))', border:'1px solid rgba(0,255,178,0.12)', borderRadius:16, padding:'2.5rem 2rem' }}>
          <div style={{ textAlign:'center', marginBottom:'2rem' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(0,255,178,0.08)', border:'1px solid rgba(0,255,178,0.2)', borderRadius:100, padding:'6px 18px', marginBottom:14 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" fill="#00FFB2"/></svg>
              <span style={{ fontFamily:"'Orbitron',monospace", fontSize:9, letterSpacing:2, color:'#00FFB2' }}>PAIEMENT 100% SÉCURISÉ</span>
            </div>
            <h2 style={{ fontFamily:"'Orbitron',monospace", fontSize:'clamp(18px,3vw,26px)', fontWeight:900, letterSpacing:1, color:'#E8F4F8', margin:'0 0 8px' }}>
              PAYEZ COMME VOUS VOULEZ
            </h2>
            <p style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:15, color:'rgba(232,244,248,0.45)', margin:0 }}>
              Mobile Money, Wave ou carte bancaire — choisissez votre méthode préférée
            </p>
          </div>

          {/* Logos — vrais logos officiels */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:14, justifyContent:'center', alignItems:'center', marginBottom:'2rem' }}>

            {[
              { src:'/logos/wave.svg',         alt:'Wave',         border:'rgba(13,197,255,0.3)',  bg:'rgba(13,197,255,0.05)'  },
              { src:'/logos/orange_money.svg', alt:'Orange Money', border:'rgba(255,102,0,0.3)',   bg:'rgba(255,102,0,0.05)'   },
              { src:'/logos/mtn.svg',          alt:'MTN MoMo',     border:'rgba(255,204,0,0.3)',   bg:'rgba(255,204,0,0.05)'   },
              { src:'/logos/moov.svg',         alt:'Moov Money',   border:'rgba(0,85,165,0.3)',    bg:'rgba(0,85,165,0.05)'    },
              { src:'/logos/visa.svg',         alt:'Visa',         border:'rgba(26,31,113,0.2)',   bg:'rgba(255,255,255,0.95)' },
              { src:'/logos/mastercard.svg',   alt:'Mastercard',   border:'rgba(235,0,27,0.2)',    bg:'rgba(255,255,255,0.95)' },
              { src:'/logos/geniuspay.svg',    alt:'GeniusPay',    border:'rgba(0,255,178,0.25)',  bg:'rgba(0,255,178,0.03)'   },
            ].map(({ src, alt, border, bg }) => (
              <div key={alt} style={{
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: 10,
                padding: '8px 14px',
                display:'flex', alignItems:'center', justifyContent:'center',
                minWidth: 110, minHeight: 52,
                transition: 'transform .2s, box-shadow .2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${border}` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
              >
                <img src={src} alt={alt} style={{ height:36, maxWidth:120, objectFit:'contain' }} />
              </div>
            ))}

          </div>

          {/* Badges de sécurité */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:12, justifyContent:'center' }}>
            {[
              { icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" fill="#00FFB2"/><path d="M9 12l2 2 4-4" stroke="#020408" strokeWidth="2" strokeLinecap="round"/></svg>, label:'Chiffrement SSL 256 bits', color:'#00FFB2' },
              { icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" fill="#00D4FF"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>, label:'Données bancaires jamais stockées', color:'#00D4FF' },
              { icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#C9A84C"/><path d="M12 7v5l3 3" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>, label:'Annulable à tout moment', color:'#C9A84C' },
              { icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" stroke="#00FFB2" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>, label:'Sans engagement', color:'#00FFB2' },
            ].map((b,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, padding:'7px 14px' }}>
                {b.icon}
                <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:12, color:'rgba(232,244,248,0.55)' }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '6rem 2rem', textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
        <h2 style={{ fontFamily: HUD, fontSize: 'clamp(28px,4vw,46px)', fontWeight: 900, letterSpacing: 1, marginBottom: '1rem' }}>VOTRE PROCHAIN TRADE<br /><span style={{ color: '#00FFB2' }}>COMMENCE MAINTENANT</span></h2>
        <p style={{ fontSize: 17, color: 'rgba(232,244,248,0.5)', marginBottom: '2.5rem', fontWeight: 300 }}>Rejoignez des milliers de traders qui ont arrêté de deviner.</p>
        <a href="/auth/login" style={{ fontFamily: HUD, fontSize: 13, letterSpacing: 2, color: '#020408', background: '#00FFB2', padding: '18px 44px', borderRadius: 4, textDecoration: 'none', fontWeight: 700, display: 'inline-block', boxShadow: '0 0 40px rgba(0,255,178,0.35)', animation: 'glowPulse 2.5s ease-in-out infinite' }}>CRÉER MON COMPTE GRATUIT →</a>
        <p style={{ fontSize: 13, color: 'rgba(232,244,248,0.3)', marginTop: 16 }}>Sans carte bancaire · 3 analyses offertes</p>
      </section>

      {/* ── TÉMOIGNAGES ── */}
      <section id="avis" style={{ position:'relative', zIndex:1, padding:'5rem 2rem', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:'3rem' }}>
          <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:4, color:'#00FFB2', marginBottom:12 }}>ILS UTILISENT PROFITYX</div>
          <h2 style={{ fontFamily:HUD, fontSize:28, color:'#E8F4F8', margin:0 }}>Ce que disent nos traders</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:20 }}>
          {[
            { name:'Konan A.', plan:'Pro', country:'🇨🇮', text:'J\'ai enfin un outil qui m\'explique pourquoi entrer un trade. L\'analyse SMC est bluffante, exactement ce qu\'un mentor m\'expliquerait.', rating:5 },
            { name:'Fatou D.', plan:'Elite', country:'🇸🇳', text:'Le signal avant le NFP m\'a sauvé plusieurs fois. Je reçois l\'alerte, j\'ouvre l\'app, le signal est là. Simple et efficace.', rating:5 },
            { name:'Ismaël B.', plan:'Pro', country:'🇧🇫', text:'Le journal de trading m\'a aidé à voir que je tradais toujours en mode FOMO le vendredi. Depuis que je le sais, mes résultats s\'améliorent.', rating:5 },
            { name:'Marie-Claire K.', plan:'Free', country:'🇨🇲', text:'Je commence avec le plan gratuit et l\'analyse SMC offerte chaque jour est déjà très utile. Je vais passer Pro ce mois-ci.', rating:5 },
            { name:'Moussa T.', plan:'Elite', country:'🇲🇱', text:'Outil professionnel, interface claire, signaux précis. Le meilleur investissement de mon parcours trader.', rating:5 },
            { name:'Yasmine N.', plan:'Pro', country:'🇹🇬', text:'En 2 semaines j\'ai retrouvé ma discipline grâce au journal. Les stats par émotion m\'ont ouvert les yeux sur mes patterns.', rating:5 },
          ].map((t,i) => (
            <div key={i} style={{ background:'rgba(0,255,178,0.03)', border:'1px solid rgba(0,255,178,0.1)', borderRadius:12, padding:'1.5rem', position:'relative' }}>
              <div style={{ fontSize:18, marginBottom:8 }}>{'⭐'.repeat(t.rating)}</div>
              <p style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:14, color:'rgba(232,244,248,0.7)', lineHeight:1.7, margin:'0 0 16px', fontStyle:'italic' }}>"{t.text}"</p>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontFamily:HUD, fontSize:10, color:'#E8F4F8' }}>{t.name} {t.country}</div>
                  <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'#00FFB2', marginTop:3 }}>Plan {t.plan}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ position:'relative', zIndex:1, padding:'4rem 2rem', maxWidth:760, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:4, color:'#00D4FF', marginBottom:12 }}>FAQ</div>
          <h2 style={{ fontFamily:HUD, fontSize:28, color:'#E8F4F8', margin:0 }}>Questions fréquentes</h2>
        </div>
        {[
          { q:'Comment fonctionne le système de crédits ?', a:'1 crédit = 1 analyse chart IA ou 1 signal annonce macro. Les crédits ne expirent pas. Vous recevez 10 crédits gratuits à l\'inscription, et les plans Pro/Elite reçoivent 150 ou 600 crédits chaque mois.' },
          { q:'Qu\'est-ce que l\'analyse SMC ?', a:'SMC (Smart Money Concepts) est une méthode de trading institutionnel : Order Blocks, Fair Value Gaps, prises de liquidité. ProfityX l\'applique automatiquement à votre chart. Les Free reçoivent 1 analyse SMC gratuite par jour.' },
          { q:'Comment payer ? Mobile Money disponible ?', a:'Oui ! Wave, Orange Money, MTN Mobile Money, Moov Money, Visa et Mastercard sont acceptés via GeniusPay. Le paiement est 100% sécurisé et instantané.' },
          { q:'Puis-je annuler mon abonnement ?', a:'Oui, à tout moment depuis vos Paramètres. Vous conservez vos crédits et l\'accès Pro jusqu\'à la fin de la période payée.' },
          { q:'ProfityX fonctionne sur quelles paires ?', a:'Forex (EUR/USD, GBP/USD, XAU/USD...), Crypto (BTC, ETH...), Indices synthétiques Deriv (V75, V10, Crash, Boom), Matières premières. L\'IA lit directement votre screenshot.' },
          { q:'Les signaux sont-ils garantis ?', a:'Non — le trading comporte des risques. ProfityX est un outil d\'aide à la décision basé sur l\'IA. Les signaux augmentent votre probabilité de succès mais ne garantissent pas les résultats. Tradez toujours avec un capital que vous pouvez vous permettre de perdre.' },
        ].map((faq,i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(0,255,178,0.06)', padding: '3rem 2rem 2rem', textAlign: 'center', background: 'rgba(2,4,8,0.95)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: '1.5rem' }}>
          {LOGO}
          <span style={{ fontFamily: HUD, fontSize: 18, letterSpacing: 3, color: '#00FFB2' }}>PROFIT<span style={{ color: '#00D4FF' }}>YX</span></span>
        </div>

        {/* Liens principaux */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {[['#features','FONCTIONS'],['#pricing','TARIFS'],['#avis','AVIS'],['#partenaires','PARTENAIRES'],
            ['/install','📲 INSTALLER L\'APP']].map(([h,l]) => (
            <a key={l} href={h} className="foot-link">{l}</a>
          ))}
        </div>

        {/* Séparateur */}
        <div style={{ height: 1, background: 'rgba(0,255,178,0.06)', margin: '1.25rem auto', maxWidth: 600 }} />

        {/* Liens légaux + support */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {[
            ['/legal/cgu','CONDITIONS D\'UTILISATION'],
            ['/legal/confidentialite','CONFIDENTIALITÉ'],
            ['/legal/mentions','MENTIONS LÉGALES'],
            ['/support','ASSISTANCE'],
          ].map(([h,l]) => (
            <a key={l} href={h} className="foot-link" style={{ color:'rgba(0,212,255,0.4)' }}>{l}</a>
          ))}
        </div>

        {/* WhatsApp support */}
        <div style={{ marginBottom: '1.5rem' }}>
          <a href="https://wa.me/+2250500446464" target="_blank" rel="noopener noreferrer"
            style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(37,211,102,0.08)', border:'1px solid rgba(37,211,102,0.25)', borderRadius:100, padding:'8px 18px', textDecoration:'none', color:'#25D366', fontFamily:HUD, fontSize:8, letterSpacing:1 }}>
            <i className="ti ti-brand-whatsapp" style={{ fontSize:14 }} />
            SUPPORT WHATSAPP : +225 0500 44 64 64
          </a>
        </div>

        <p style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 1, color: 'rgba(232,244,248,0.2)', lineHeight: 2 }}>
          © 2026 MonWe Infinity LLC · Albuquerque, NM, USA · EIN 38-4396094<br />
          Le trading comporte des risques de perte en capital. Les signaux ne constituent pas un conseil financier.<br />
          <a href="https://linktr.ee/coachyessiha" target="_blank" rel="noopener noreferrer" style={{ color:'rgba(0,255,178,0.3)', textDecoration:'none' }}>COACH YESSIHA</a>
        </p>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 40px rgba(0,255,178,0.35)} 50%{box-shadow:0 0 60px rgba(0,255,178,0.6)} }
        @keyframes gridMove { 0%{background-position:0 0} 100%{background-position:60px 60px} }
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(80px,-60px) scale(1.15)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-70px,50px) scale(1.1)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(50px,70px) scale(1.2)} }
        @keyframes scanMove { 0%{transform:translateY(0)} 100%{transform:translateY(100vh)} }
        @keyframes candleGrow { 0%,100%{transform:scaleY(0.5);opacity:0.15} 50%{transform:scaleY(1);opacity:0.4} }

        html { scroll-behavior: smooth; }
        a:hover { opacity: 0.88; }
        .nav-link { font-family:${HUD}; font-size:10px; letter-spacing:2px; color:rgba(232,244,248,0.5); text-decoration:none; }
        .nav-link:hover { color:#00FFB2; }
        .foot-link { font-family:${HUD}; font-size:8px; letter-spacing:1px; color:rgba(232,244,248,0.4); text-decoration:none; }
        .foot-link:hover { color:#00FFB2; }

        .grid-bg { position:fixed; inset:0; pointer-events:none; z-index:0; background-image:linear-gradient(rgba(0,255,178,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,178,0.03) 1px,transparent 1px); background-size:60px 60px; mask-image:radial-gradient(ellipse 120% 80% at 50% 0%,black 0%,transparent 75%); animation:gridMove 20s linear infinite; }
        .orb { position:fixed; border-radius:50%; filter:blur(80px); pointer-events:none; z-index:0; opacity:0.4; }
        .orb1 { width:400px; height:400px; background:radial-gradient(circle,rgba(0,255,178,0.3),transparent 70%); top:-100px; left:-100px; animation:float1 18s ease-in-out infinite; }
        .orb2 { width:350px; height:350px; background:radial-gradient(circle,rgba(0,212,255,0.25),transparent 70%); top:40%; right:-80px; animation:float2 22s ease-in-out infinite; }
        .orb3 { width:300px; height:300px; background:radial-gradient(circle,rgba(201,168,76,0.18),transparent 70%); bottom:10%; left:20%; animation:float3 25s ease-in-out infinite; }
        .scanlines { position:fixed; left:0; right:0; height:100px; z-index:0; pointer-events:none; background:linear-gradient(180deg,transparent,rgba(0,255,178,0.04),transparent); animation:scanMove 8s linear infinite; }
        .candles { position:fixed; bottom:0; left:0; right:0; height:200px; z-index:0; pointer-events:none; display:flex; align-items:flex-end; justify-content:space-around; opacity:0.5; }
        .candle { width:8px; background:linear-gradient(to top,#00FFB2,#00D4FF); border-radius:2px; transform-origin:bottom; animation:candleGrow 4s ease-in-out infinite; }

        .feat-card { transition:transform .3s, border-color .3s; }
        .feat-card:hover { transform:translateY(-6px); border-color:rgba(0,255,178,0.3); }
        .partner-card, .broker-card { transition:transform .3s, box-shadow .3s; }
        .partner-card:hover, .broker-card:hover { transform:translateY(-6px); box-shadow:0 10px 40px rgba(0,255,178,0.15); }

        /* Mockup hero responsive */
        .hero-mockup { display:flex; }
        @media (max-width: 860px) {
          .hero-mockup { display:none !important; }
          .hero-section { flex-direction:column !important; align-items:flex-start !important; padding-top:5rem !important; }
          .hero-text-col { max-width:100% !important; }
        }
      `}</style>

      {/* ── Exit Intent Popup landing ─────────────────────── */}
      {exitPopup && (
        <div onClick={() => setExitPopup(false)} style={{
          position:'fixed', inset:0, zIndex:9999,
          background:'rgba(2,4,8,0.88)', backdropFilter:'blur(8px)',
          display:'flex', alignItems:'center', justifyContent:'center',
          padding:'1rem', animation:'fadeIn .2s ease',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width:'100%', maxWidth:420,
            background:'#080F1A', border:'1px solid rgba(0,255,178,0.2)',
            borderRadius:16, overflow:'hidden',
            boxShadow:'0 0 60px rgba(0,255,178,0.12), 0 20px 40px rgba(0,0,0,0.6)',
            animation:'slideUp .25s ease',
          }}>
            <div style={{ height:3, background:'linear-gradient(90deg,transparent,#00FFB2,transparent)' }} />
            <div style={{ padding:'24px 24px 0', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'#00FFB2', marginBottom:6 }}>ATTENDS UNE SECONDE !</div>
                <div style={{ fontFamily:HUD, fontSize:22, fontWeight:900, color:'#E8F4F8', lineHeight:1.2 }}>Tu repars sans signal ?</div>
              </div>
              <button onClick={() => setExitPopup(false)} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, color:'rgba(232,244,248,0.35)', cursor:'pointer', width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕</button>
            </div>
            <div style={{ padding:'16px 24px' }}>
              <p style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:15, color:'rgba(232,244,248,0.55)', lineHeight:1.6, marginBottom:16 }}>
                Uploade ton chart → reçois l'entrée, le Stop Loss et les Take Profit en <strong style={{ color:'#00FFB2' }}>10 secondes</strong>. Boom 1000, GainX, Forex, Gold — tout.
              </p>
              <div style={{ background:'rgba(0,255,178,0.06)', border:'1px solid rgba(0,255,178,0.12)', borderRadius:8, padding:'10px 14px', marginBottom:16, display:'flex', gap:16, justifyContent:'space-around' }}>
                {[['🆓','Gratuit','pour commencer'],['⚡','10 sec','par analyse'],['📊','SMC','complet']].map(([i,n,l]) => (
                  <div key={n} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:18, marginBottom:4 }}>{i}</div>
                    <div style={{ fontFamily:HUD, fontSize:11, fontWeight:900, color:'#00FFB2' }}>{n}</div>
                    <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:10, color:'rgba(232,244,248,0.35)' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding:'0 24px 24px', display:'flex', flexDirection:'column', gap:8 }}>
              <a href="/auth/login" style={{ display:'block', textAlign:'center', padding:'14px', borderRadius:7, background:'#00FFB2', color:'#020408', fontFamily:HUD, fontSize:11, letterSpacing:2, fontWeight:700, textDecoration:'none' }}>
                🚀 COMMENCER GRATUITEMENT →
              </a>
              <button onClick={() => setExitPopup(false)} style={{ width:'100%', padding:'10px', borderRadius:7, cursor:'pointer', background:'transparent', border:'1px solid rgba(255,255,255,0.07)', color:'rgba(232,244,248,0.3)', fontFamily:HUD, fontSize:9, letterSpacing:1 }}>
                Non merci, je pars quand même
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bandeau FOMO flottant (mobile) ───────────────────── */}
      {fomoVisible && (
        <div style={{
          position:'fixed', bottom:80, left:'50%', transform:'translateX(-50%)',
          zIndex:500, background:'rgba(6,9,15,0.95)', backdropFilter:'blur(12px)',
          border:'1px solid rgba(0,255,178,0.2)', borderRadius:100,
          padding:'10px 20px', display:'flex', alignItems:'center', gap:10,
          whiteSpace:'nowrap', boxShadow:'0 4px 20px rgba(0,255,178,0.15)',
          animation:'slideUp .4s ease',
        }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:'#00E676', flexShrink:0, animation:'pulse 1.5s infinite' }} />
          <span style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'rgba(232,244,248,0.7)' }}>
            🔥 <strong style={{ color:'#00FFB2' }}>{liveStats.analyses_24h}</strong> analyses générées aujourd'hui
          </span>
          <button onClick={() => setFomoVisible(false)} style={{ background:'transparent', border:'none', color:'rgba(232,244,248,0.3)', cursor:'pointer', fontSize:12, padding:0, marginLeft:4 }}>✕</button>
        </div>
      )}
    </div>
  )
}
