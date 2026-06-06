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

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [time, setTime] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    const tick = () => setTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const t = setInterval(tick, 1000)
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
          <a href="/auth/login" className="nav-hide" style={{ fontFamily: HUD, fontSize: 10, letterSpacing: 2, color: '#020408', background: '#00FFB2', padding: '9px 20px', borderRadius: 4, textDecoration: 'none', fontWeight: 700 }}>SE CONNECTER</a>
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
            <a href="/auth/login" onClick={() => setMenuOpen(false)} style={{ fontFamily: HUD, fontSize: 11, letterSpacing: 2, color: '#020408', background: '#00FFB2', padding: '12px', borderRadius: 4, textDecoration: 'none', fontWeight: 700, textAlign: 'center', marginTop: 8 }}>SE CONNECTER</a>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="hero-section" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '6rem 2rem 4rem', maxWidth: 1200, margin: '0 auto' }}>
        
        {/* Colonne texte */}
        <div style={{ flex: '1 1 500px', maxWidth: 600 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,255,178,0.06)', border: '1px solid rgba(0,255,178,0.2)', borderRadius: 100, padding: '6px 16px', marginBottom: '2rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E676', animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 2, color: '#00FFB2' }}>+4 800 TRADERS · MARCHÉS EN DIRECT · {time}</span>
          </div>

          <h1 style={{ fontFamily: HUD, fontSize: 'clamp(36px, 5.5vw, 72px)', fontWeight: 900, lineHeight: 1.04, letterSpacing: 1, marginBottom: '1.5rem' }}>
            ARRÊTEZ DE TRADER<br /><span style={{ color: '#FF3A5C' }}>À L'AVEUGLE.</span><br />
            <span style={{ color: '#00FFB2', textShadow: '0 0 30px rgba(0,255,178,0.4)' }}>LAISSEZ L'IA</span> DÉCIDER.
          </h1>

          <p style={{ fontSize: 'clamp(15px,1.8vw,19px)', color: 'rgba(232,244,248,0.55)', lineHeight: 1.7, maxWidth: 520, marginBottom: '2.5rem', fontWeight: 300 }}>
            Uploadez un graphique, recevez en <strong style={{ color: '#00FFB2', fontWeight: 600 }}>quelques secondes</strong> votre point d'entrée, stop loss et take profit. Plus d'hésitation, plus d'émotion — juste des décisions claires.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <a href="/auth/login" style={{ fontFamily: HUD, fontSize: 11, letterSpacing: 2, color: '#020408', background: '#00FFB2', padding: '16px 32px', borderRadius: 4, textDecoration: 'none', fontWeight: 700, boxShadow: '0 0 40px rgba(0,255,178,0.35)', animation: 'glowPulse 2.5s ease-in-out infinite' }}>COMMENCER GRATUITEMENT →</a>
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
        <div className="hero-mockup" style={{ flex: '1 1 420px', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem 0 2rem 3rem' }}>
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

              {/* Barre de statut bas */}
              <div style={{ background: 'rgba(0,255,178,0.04)', borderTop: '1px solid rgba(0,255,178,0.08)', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: HUD, fontSize: 7, letterSpacing: 1, color: 'rgba(232,244,248,0.3)' }}>1 CRÉDIT UTILISÉ · SOLDE : 141</span>
                <span style={{ fontFamily: HUD, fontSize: 7, letterSpacing: 1, color: '#00FFB2' }}>✓ ANALYSE SMC COMPLÈTE</span>
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
      <section id="features" style={{ position: 'relative', zIndex: 1, padding: '5rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
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

          {/* Logos SVG moyens de paiement */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:14, justifyContent:'center', alignItems:'center', marginBottom:'2rem' }}>

            {/* Wave */}
            <div style={{ background:'rgba(13,20,32,0.8)', border:'1px solid rgba(0,199,255,0.2)', borderRadius:10, padding:'10px 18px', display:'flex', alignItems:'center', gap:8 }}>
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="20" fill="#0DC5FF"/>
                <path d="M8 22c2-6 5-9 8-9s5 6 8 6 5-6 8-3" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <path d="M8 27c2-4 5-6 8-6s5 4 8 4 5-4 8-2" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              </svg>
              <span style={{ fontFamily:"'Orbitron',monospace", fontSize:12, fontWeight:900, color:'#0DC5FF', letterSpacing:1 }}>WAVE</span>
            </div>

            {/* Orange Money */}
            <div style={{ background:'rgba(13,20,32,0.8)', border:'1px solid rgba(255,130,0,0.25)', borderRadius:10, padding:'10px 18px', display:'flex', alignItems:'center', gap:8 }}>
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="20" fill="#FF8200"/>
                <circle cx="20" cy="20" r="10" fill="none" stroke="#fff" strokeWidth="2.5"/>
                <circle cx="20" cy="20" r="4" fill="#fff"/>
              </svg>
              <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, color:'#FF8200', letterSpacing:0.5 }}>Orange Money</span>
            </div>

            {/* MTN Mobile Money */}
            <div style={{ background:'rgba(13,20,32,0.8)', border:'1px solid rgba(255,204,0,0.25)', borderRadius:10, padding:'10px 18px', display:'flex', alignItems:'center', gap:8 }}>
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="8" fill="#FFCC00"/>
                <text x="20" y="26" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="14" fill="#000">MTN</text>
              </svg>
              <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, color:'#FFCC00' }}>MTN MoMo</span>
            </div>

            {/* Moov Money */}
            <div style={{ background:'rgba(13,20,32,0.8)', border:'1px solid rgba(0,120,215,0.25)', borderRadius:10, padding:'10px 18px', display:'flex', alignItems:'center', gap:8 }}>
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="20" fill="#0078D7"/>
                <path d="M10 20l6-8 4 12 4-8 6 4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
              <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, color:'#0078D7' }}>Moov Money</span>
            </div>

            {/* Visa */}
            <div style={{ background:'rgba(13,20,32,0.8)', border:'1px solid rgba(26,115,232,0.25)', borderRadius:10, padding:'10px 18px', display:'flex', alignItems:'center', gap:6 }}>
              <svg width="48" height="28" viewBox="0 0 75 24" fill="none">
                <text x="0" y="20" fontFamily="Arial" fontWeight="900" fontSize="22" fill="#1A73E8" letterSpacing="-1">VISA</text>
              </svg>
            </div>

            {/* Mastercard */}
            <div style={{ background:'rgba(13,20,32,0.8)', border:'1px solid rgba(235,0,27,0.2)', borderRadius:10, padding:'10px 18px', display:'flex', alignItems:'center', gap:8 }}>
              <svg width="44" height="28" viewBox="0 0 44 28" fill="none">
                <circle cx="16" cy="14" r="13" fill="#EB001B"/>
                <circle cx="28" cy="14" r="13" fill="#F79E1B"/>
                <path d="M22 5.5a13 13 0 0 1 0 17A13 13 0 0 1 22 5.5z" fill="#FF5F00"/>
              </svg>
              <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700, color:'rgba(232,244,248,0.6)' }}>Mastercard</span>
            </div>

            {/* GeniusPay */}
            <div style={{ background:'rgba(13,20,32,0.8)', border:'1px solid rgba(0,255,178,0.2)', borderRadius:10, padding:'10px 18px', display:'flex', alignItems:'center', gap:8 }}>
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="8" fill="url(#gpGrad)"/>
                <defs><linearGradient id="gpGrad" x1="0" y1="0" x2="40" y2="40"><stop stopColor="#00FFB2"/><stop offset="1" stopColor="#00D4FF"/></linearGradient></defs>
                <path d="M12 20h8M20 12v16M28 16c0-4-4-6-8-4" stroke="#020408" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              <span style={{ fontFamily:"'Orbitron',monospace", fontSize:10, fontWeight:900, color:'#00FFB2', letterSpacing:0.5 }}>GeniusPay</span>
            </div>

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

      {/* ── FOOTER ── */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(0,255,178,0.06)', padding: '3rem 2rem 2rem', textAlign: 'center', background: 'rgba(2,4,8,0.95)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: '1.5rem' }}>
          {LOGO}
          <span style={{ fontFamily: HUD, fontSize: 18, letterSpacing: 3, color: '#00FFB2' }}>PROFIT<span style={{ color: '#00D4FF' }}>YX</span></span>
        </div>

        {/* Liens principaux */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {[['#features','FONCTIONS'],['#pricing','TARIFS'],['#avis','AVIS'],['#partenaires','PARTENAIRES']].map(([h,l]) => (
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
          .hero-mockup { display:none; }
          .hero-section { flex-direction:column; justify-content:center; }
        }
      `}</style>
    </div>
  )
}
