// ============================================================
// PROFITYX — Landing Page v3 — Conversion-first
// ============================================================
'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useTheme }            from '@/lib/theme'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

const PLANS = [
  {
    key: 'free', name: 'FREE', price: '0', currency: 'FCFA/mois',
    color: '#888', bg: 'rgba(100,100,120,0.06)',
    credits: '10 crédits', analyses: '3 analyses/jour',
    features: ['Signaux SMC basiques', 'Forex + Deriv', 'Calendrier macro'],
    cta: 'COMMENCER GRATUITEMENT', href: '/auth/login',
    highlight: false,
  },
  {
    key: 'pro', name: 'PRO', price: '17 500', currency: 'FCFA/mois',
    color: '#00FFB2', bg: 'rgba(0,255,178,0.05)',
    credits: '150 crédits', analyses: 'Analyses illimitées',
    features: ['Tout Free +', 'Order Block + FVG', 'BOS / CHoCH / Liquidité', 'Chart annoté', 'Signaux anticipatoires NFP/CPI'],
    cta: 'PASSER PRO', href: '/auth/login',
    highlight: true,
  },
  {
    key: 'elite', name: 'ELITE', price: '35 000', currency: 'FCFA/mois',
    color: '#C9A84C', bg: 'rgba(201,168,76,0.05)',
    credits: '600 crédits', analyses: 'Analyses illimitées',
    features: ['Tout Pro +', 'Mode Scalping', 'Signaux News temps réel', 'Support prioritaire', 'Accès anticipé nouvelles features'],
    cta: 'PASSER ELITE', href: '/auth/login',
    highlight: false,
  },
]

const STEPS = [
  { n: '01', icon: '📤', title: 'Uploade ton chart', desc: 'Prends une capture d\'écran de ton chart TradingView ou Deriv et uploade-la.' },
  { n: '02', icon: '🤖', title: 'L\'IA analyse en 10s', desc: 'Notre IA détecte les structures SMC : Order Blocks, FVG, BOS, CHoCH et Liquidité.' },
  { n: '03', icon: '🎯', title: 'Reçois ton signal', desc: 'Entrée précise, Stop Loss et 3 niveaux de Take Profit calculés automatiquement.' },
]

const ASSETS = ['Boom 1000','Crash 500','GainX 600','Step Index','EUR/USD','XAU/USD','GBP/USD','USD/JPY']

const FAQ = [
  { q: 'Ça marche avec quels actifs ?', a: 'ProfityX fonctionne avec tous les actifs Deriv (Boom, Crash, Volatility, GainX, Step Index) et les paires Forex majeures (EUR/USD, GBP/USD, XAU/USD, USD/JPY…). Tu sélectionnes l\'actif dans le menu avant d\'uploader ton chart.' },
  { q: 'C\'est quoi le Smart Money Concept (SMC) ?', a: 'Le SMC est une méthode d\'analyse institutionnelle qui suit les "smart money" (grandes banques). ProfityX détecte automatiquement les Order Blocks, Fair Value Gaps, BOS et CHoCH sur ton chart.' },
  { q: 'Comment payer depuis la Côte d\'Ivoire ?', a: 'On accepte Wave, Orange Money, MTN MoMo, Moov Money, Visa et Mastercard via GeniusPay. Aucun compte bancaire international nécessaire.' },
  { q: 'Puis-je annuler à tout moment ?', a: 'Oui, aucun engagement. Tu peux annuler ton abonnement depuis ton espace compte à tout moment, sans frais.' },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid rgba(0,255,178,0.08)' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '1.25rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, textAlign: 'left' }}>
        <span style={{ fontFamily: BODY, fontSize: 16, color: '#F0F8FF', fontWeight: 600 }}>{q}</span>
        <span style={{ color: '#00FFB2', fontSize: 20, flexShrink: 0, transition: 'transform .2s', transform: open ? 'rotate(45deg)' : 'none' }}>+</span>
      </button>
      {open && <p style={{ fontFamily: BODY, fontSize: 15, color: 'rgba(240,248,255,0.55)', lineHeight: 1.7, paddingBottom: '1.25rem', margin: 0 }}>{a}</p>}
    </div>
  )
}

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme()
  const [analyses, setAnalyses] = useState(26)
  const [users,    setUsers]    = useState(7)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => {
      if (d.analyses_24h) setAnalyses(d.analyses_24h)
      if (d.total_users)  setUsers(d.total_users)
    }).catch(() => {})
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#020408', color: '#F0F8FF', fontFamily: BODY, overflowX: 'hidden' }}>

      {/* ── NAVBAR ────────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(0,255,178,0.07)', background: 'rgba(2,4,8,0.95)', backdropFilter: 'blur(16px)', padding: '0 1.5rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Brand — texte seul, pas de logo */}
        <a href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontFamily: HUD, fontSize: 16, fontWeight: 900, letterSpacing: 2, color: '#00FFB2' }}>PROFIT<span style={{ color: '#00D4FF' }}>YX</span></span>
        </a>

        {/* Liens desktop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="nav-desktop">
          {[['#how','Comment'],['#features','Features'],['#pricing','Tarifs'],['/results','Résultats']].map(([href,label]) => (
            <a key={href} href={href} style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'rgba(240,248,255,0.45)', textDecoration:'none' }}>{label}</a>
          ))}
        </div>

        {/* CTA desktop + hamburger mobile */}
        <div style={{ display:'flex', gap:10, alignItems:'center', flexShrink:0 }}>
          <a href="/auth/login" className="nav-desktop" style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'rgba(240,248,255,0.5)', textDecoration:'none' }}>CONNEXION</a>
          <a href="/auth/login" style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'#020408', background:'#00FFB2', padding:'9px 18px', borderRadius:4, textDecoration:'none', fontWeight:700, whiteSpace:'nowrap' }}>ESSAI GRATUIT</a>

          {/* Hamburger — mobile seulement */}
          <button onClick={() => setMenuOpen(o => !o)} className="nav-mobile-btn" aria-label="Menu" style={{ background:'transparent', border:'1px solid rgba(0,255,178,0.2)', borderRadius:6, color:'#00FFB2', padding:'7px 10px', cursor:'pointer', fontSize:18, lineHeight:1, display:'none' }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Drawer menu mobile */}
      {menuOpen && (
        <div style={{ position:'fixed', top:60, left:0, right:0, background:'rgba(2,4,8,0.98)', borderBottom:'1px solid rgba(0,255,178,0.12)', zIndex:99, padding:'1.5rem', display:'flex', flexDirection:'column', gap:4 }}>
          {[['#how','Comment ça marche'],['#features','Fonctionnalités'],['#pricing','Tarifs'],['/results','Résultats live'],['/auth/login','Se connecter']].map(([href,label]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)} style={{ fontFamily:HUD, fontSize:10, letterSpacing:2, color:'rgba(240,248,255,0.6)', textDecoration:'none', padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              {label}
            </a>
          ))}
          <a href="/auth/login" style={{ fontFamily:HUD, fontSize:11, letterSpacing:2, color:'#020408', background:'#00FFB2', padding:'14px', borderRadius:6, textDecoration:'none', fontWeight:700, textAlign:'center', marginTop:12 }}>
            COMMENCER GRATUITEMENT →
          </a>
        </div>
      )}

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(4rem,8vw,7rem) 2rem clamp(3rem,6vw,5rem)', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>

        {/* Pill live */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,255,178,0.06)', border: '1px solid rgba(0,255,178,0.18)', borderRadius: 100, padding: '6px 16px', marginBottom: '2rem' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E676', animation: 'pulse 1.5s infinite', display: 'inline-block' }} />
          <span style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 2, color: '#00FFB2' }}>{users} TRADERS · {analyses} ANALYSES AUJOURD'HUI</span>
        </div>

        {/* Headline */}
        <h1 style={{ fontFamily: HUD, fontSize: 'clamp(32px,5.5vw,68px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: 1, marginBottom: '1.5rem' }}>
          TRADEZ PLUS<br />
          <span style={{ color: '#00FFB2' }}>INTELLIGENT.</span>
        </h1>

        <p style={{ fontSize: 'clamp(16px,1.8vw,20px)', color: 'rgba(240,248,255,0.55)', lineHeight: 1.7, maxWidth: 580, margin: '0 auto 2.5rem', fontWeight: 300 }}>
          Uploade ton chart → reçois ton <strong style={{ color: '#F0F8FF' }}>entrée, Stop Loss et Take Profit</strong> en 10 secondes. Analyse SMC propulsée par l'IA.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
          <a href="/auth/login" style={{ fontFamily: HUD, fontSize: 11, letterSpacing: 2, color: '#020408', background: '#00FFB2', padding: '16px 36px', borderRadius: 4, textDecoration: 'none', fontWeight: 700, boxShadow: '0 0 40px rgba(0,255,178,0.25)' }}>
            COMMENCER GRATUITEMENT →
          </a>
          <a href="/results" style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 2, color: 'rgba(240,248,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 24px', borderRadius: 4, textDecoration: 'none' }}>
            VOIR LES RÉSULTATS
          </a>
        </div>

        <p style={{ fontFamily: BODY, fontSize: 13, color: 'rgba(240,248,255,0.3)' }}>
          ✓ Sans carte bancaire &nbsp;·&nbsp; ✓ 10 crédits offerts &nbsp;·&nbsp; ✓ Annulable à tout moment
        </p>
      </section>

      {/* ── ACTIFS SUPPORTÉS ──────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '1.2rem 2rem', overflow: 'hidden', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center', animation: 'scrollTicker 18s linear infinite', whiteSpace: 'nowrap', width: 'max-content' }}>
          {[...ASSETS, ...ASSETS].map((a, i) => (
            <span key={i} style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 2, color: 'rgba(240,248,255,0.3)', flexShrink: 0 }}>{a}</span>
          ))}
        </div>
      </div>

      {/* ── COMMENT ÇA MARCHE ─────────────────────────────────── */}
      <section id="how" style={{ padding: 'clamp(4rem,7vw,6rem) 2rem', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 3, color: 'rgba(0,255,178,0.6)', marginBottom: 12 }}>COMMENT ÇA MARCHE</div>
          <h2 style={{ fontFamily: HUD, fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 900 }}>3 étapes, 10 secondes</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
          {STEPS.map(s => (
            <div key={s.n} style={{ background: '#08111F', border: '1px solid rgba(0,255,178,0.08)', borderRadius: 12, padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontFamily: HUD, fontSize: 11, color: 'rgba(0,255,178,0.3)' }}>{s.n}</span>
                <span style={{ fontSize: 28 }}>{s.icon}</span>
              </div>
              <div style={{ fontFamily: HUD, fontSize: 12, letterSpacing: 1, color: '#F0F8FF', marginBottom: 10 }}>{s.title}</div>
              <p style={{ fontFamily: BODY, fontSize: 14, color: 'rgba(240,248,255,0.5)', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section id="features" style={{ padding: 'clamp(3rem,6vw,5rem) 2rem', background: 'rgba(8,17,31,0.5)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 3, color: 'rgba(0,255,178,0.6)', marginBottom: 12 }}>FONCTIONNALITÉS</div>
            <h2 style={{ fontFamily: HUD, fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 900 }}>Tout pour trader intelligemment</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
            {[
              { icon: '🧠', title: 'Analyse SMC', desc: 'Order Block, Fair Value Gap, BOS, CHoCH, Liquidité détectés automatiquement.' },
              { icon: '⚡', title: '10 secondes', desc: 'Signal complet en moins de 10 secondes après upload du chart.' },
              { icon: '📊', title: 'Calendrier macro', desc: 'NFP, CPI, FOMC — alertes en temps réel avec signal anticipatoire.' },
              { icon: '🌍', title: 'Deriv + Forex', desc: 'Boom, Crash, GainX, Volatility, EUR/USD, XAU/USD et plus.' },
              { icon: '📱', title: 'Mobile first', desc: 'Interface optimisée pour mobile. Installe l\'app PWA en 1 clic.' },
              { icon: '🔒', title: 'Sécurisé', desc: 'Données chiffrées SSL. Paiements via GeniusPay certifié.' },
            ].map(f => (
              <div key={f.title} style={{ background: '#020408', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '1.5rem' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontFamily: HUD, fontSize: 11, letterSpacing: 1, color: '#F0F8FF', marginBottom: 8 }}>{f.title}</div>
                <p style={{ fontFamily: BODY, fontSize: 13, color: 'rgba(240,248,255,0.45)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRACK RECORD ──────────────────────────────────────── */}
      <section style={{ padding: 'clamp(3rem,6vw,5rem) 2rem', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 3, color: 'rgba(0,255,178,0.6)', marginBottom: 12 }}>TRANSPARENCE TOTALE</div>
        <h2 style={{ fontFamily: HUD, fontSize: 'clamp(22px,3vw,36px)', fontWeight: 900, marginBottom: 16 }}>Nos résultats en direct</h2>
        <p style={{ fontFamily: BODY, fontSize: 15, color: 'rgba(240,248,255,0.5)', marginBottom: 32 }}>
          Win rate, R/R moyen, tous les signaux WIN et LOSS affichés. Aucun filtre.
        </p>
        <a href="/results" style={{ fontFamily: HUD, fontSize: 10, letterSpacing: 2, color: '#020408', background: '#00FFB2', padding: '14px 32px', borderRadius: 4, textDecoration: 'none', fontWeight: 700 }}>
          VOIR LE TRACK RECORD LIVE →
        </a>
      </section>

      {/* ── PRICING ───────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: 'clamp(4rem,7vw,6rem) 2rem', background: 'rgba(8,17,31,0.5)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 3, color: 'rgba(0,255,178,0.6)', marginBottom: 12 }}>TARIFS</div>
            <h2 style={{ fontFamily: HUD, fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 900 }}>Choisissez votre plan</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20, alignItems: 'start' }}>
            {PLANS.map(plan => (
              <div key={plan.key} style={{
                background: plan.highlight ? 'rgba(0,255,178,0.04)' : '#08111F',
                border: `1px solid ${plan.highlight ? 'rgba(0,255,178,0.35)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 12, padding: '2rem', position: 'relative',
              }}>
                {plan.highlight && (
                  <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#00FFB2', color: '#020408', fontFamily: HUD, fontSize: 8, letterSpacing: 2, padding: '4px 16px', borderRadius: 100, fontWeight: 900, whiteSpace: 'nowrap' }}>
                    LE PLUS POPULAIRE
                  </div>
                )}
                <div style={{ fontFamily: HUD, fontSize: 11, letterSpacing: 2, color: plan.color, marginBottom: 8 }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontFamily: HUD, fontSize: 30, fontWeight: 900, color: '#F0F8FF' }}>{plan.price}</span>
                  <span style={{ fontFamily: BODY, fontSize: 13, color: 'rgba(240,248,255,0.4)' }}>{plan.currency}</span>
                </div>
                <div style={{ fontFamily: BODY, fontSize: 13, color: plan.color, marginBottom: 24 }}>{plan.credits} · {plan.analyses}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: plan.color, fontSize: 12, flexShrink: 0 }}>✓</span>
                      <span style={{ fontFamily: BODY, fontSize: 14, color: 'rgba(240,248,255,0.6)' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <a href={plan.href} style={{ display: 'block', textAlign: 'center', fontFamily: HUD, fontSize: 9, letterSpacing: 2, textDecoration: 'none', padding: '13px', borderRadius: 6, fontWeight: 700, background: plan.highlight ? '#00FFB2' : 'transparent', color: plan.highlight ? '#020408' : plan.color, border: `1px solid ${plan.color}40` }}>
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAIEMENT ──────────────────────────────────────────── */}
      <section style={{ padding: '3rem 2rem', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 3, color: 'rgba(240,248,255,0.3)', marginBottom: 24 }}>PAYEZ COMME VOUS VOULEZ</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { src: '/logos/wave.svg',         alt: 'Wave',         bg: 'rgba(13,197,255,0.06)',   bd: 'rgba(13,197,255,0.2)'  },
            { src: '/logos/orange_money.svg', alt: 'Orange Money', bg: 'rgba(255,102,0,0.06)',    bd: 'rgba(255,102,0,0.2)'   },
            { src: '/logos/mtn.svg',          alt: 'MTN',          bg: 'rgba(255,204,0,0.06)',    bd: 'rgba(255,204,0,0.2)'   },
            { src: '/logos/moov.svg',         alt: 'Moov',         bg: 'rgba(0,85,165,0.06)',     bd: 'rgba(0,85,165,0.2)'    },
            { src: '/logos/visa.svg',         alt: 'Visa',         bg: 'rgba(255,255,255,0.95)',  bd: 'rgba(0,0,0,0.1)'       },
            { src: '/logos/mastercard.svg',   alt: 'Mastercard',   bg: 'rgba(255,255,255,0.95)',  bd: 'rgba(0,0,0,0.1)'       },
            { src: '/logos/geniuspay.svg',    alt: 'GeniusPay',    bg: 'rgba(0,255,178,0.04)',    bd: 'rgba(0,255,178,0.2)'   },
          ].map(l => (
            <div key={l.alt} style={{ background: l.bg, border: `1px solid ${l.bd}`, borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 100, height: 50 }}>
              <img src={l.src} alt={l.alt} style={{ height: 30, maxWidth: 110, objectFit: 'contain' }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
          {['🔒 SSL 256 bits', '🏦 Données non stockées', '↩️ Annulable', '✓ Sans engagement'].map(b => (
            <span key={b} style={{ fontFamily: BODY, fontSize: 12, color: 'rgba(240,248,255,0.35)' }}>{b}</span>
          ))}
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(3rem,6vw,5rem) 2rem', maxWidth: 700, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 3, color: 'rgba(0,255,178,0.6)', marginBottom: 12 }}>FAQ</div>
          <h2 style={{ fontFamily: HUD, fontSize: 'clamp(22px,3vw,36px)', fontWeight: 900 }}>Questions fréquentes</h2>
        </div>
        {FAQ.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(4rem,7vw,6rem) 2rem', textAlign: 'center', maxWidth: 700, margin: '0 auto' }}>
        <h2 style={{ fontFamily: HUD, fontSize: 'clamp(26px,4vw,44px)', fontWeight: 900, lineHeight: 1.15, marginBottom: 16 }}>
          TON PROCHAIN TRADE<br />
          <span style={{ color: '#00FFB2' }}>COMMENCE MAINTENANT</span>
        </h2>
        <p style={{ fontFamily: BODY, fontSize: 16, color: 'rgba(240,248,255,0.45)', marginBottom: 32 }}>
          Rejoins {users}+ traders qui utilisent l'IA pour analyser leurs charts.
        </p>
        <a href="/auth/login" style={{ fontFamily: HUD, fontSize: 12, letterSpacing: 2, color: '#020408', background: '#00FFB2', padding: '18px 48px', borderRadius: 4, textDecoration: 'none', fontWeight: 700, display: 'inline-block', boxShadow: '0 0 50px rgba(0,255,178,0.2)' }}>
          CRÉER MON COMPTE GRATUIT →
        </a>
        <p style={{ fontFamily: BODY, fontSize: 13, color: 'rgba(240,248,255,0.25)', marginTop: 14 }}>Sans carte bancaire · 10 crédits offerts</p>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '2.5rem 2rem', maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="ProfityX" style={{ height: 28, objectFit: 'contain' }} />
          <div>
            <div style={{ fontFamily: HUD, fontSize: 12, letterSpacing: 2, color: '#00FFB2' }}>PROFIT<span style={{ color: '#00D4FF' }}>YX</span></div>
            <div style={{ fontFamily: BODY, fontSize: 11, color: 'rgba(240,248,255,0.25)' }}>By MonWe Infinity LLC</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[['#pricing','Tarifs'],['#how','Comment'],['#features','Features'],['/results','Résultats'],['/legal/cgu','CGU'],['/legal/confidentialite','Confidentialité']].map(([href,label]) => (
            <a key={href} href={href} style={{ fontFamily: BODY, fontSize: 13, color: 'rgba(240,248,255,0.3)', textDecoration: 'none' }}>{label}</a>
          ))}
        </div>
        <div style={{ fontFamily: BODY, fontSize: 12, color: 'rgba(240,248,255,0.2)' }}>© 2026 MonWe Infinity LLC</div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes scrollTicker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        .nav-desktop { display: flex !important; }
        .nav-mobile-btn { display: none !important; }
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
