'use client'
// ============================================================
// PROFITYX — Landing Page v3 — Conversion-first + Design/UI v2
// Enhanced: animations, mobile design, visual hierarchy
// ============================================================
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { setLang } from '@/lib/i18n'
import { useTheme }            from '@/lib/theme'
import LangModal               from '@/components/LangModal'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

// Scroll-triggered fade-in hook
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); obs.unobserve(entry.target) }
    }, { threshold: 0.15 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return { ref, isVisible }
}

const PLANS = [
  {
    key: 'free', name: 'FREE', price: '0', currency: 'FCFA/mois',
    color: '#888', bg: 'rgba(100,100,120,0.06)',
    credits: '10 crédits offerts', analyses: '3 analyses/jour',
    desc: 'Parfait pour tester. Analyse SMC de base, pas de limites de temps.',
    features: ['✓ 3 signaux SMC/jour', '✓ Tous les actifs supportés', '✓ Calendrier macro (NFP, CPI)', '✓ Historique 30 jours', '✓ Support par email'],
    cta: 'COMMENCER GRATUITEMENT', href: '/auth/login',
    highlight: false,
  },
  {
    key: 'pro', name: 'PRO', price: '17 500', priceYear: '150 000', currency: 'FCFA/mois', currencyYear: 'FCFA/an',
    color: '#00FFB2', bg: 'rgba(0,255,178,0.05)',
    credits: 'Illimitées', analyses: 'Win rate 65-72%',
    desc: 'Le choix des traders sérieux. Illimité + Dashboard Prop Firm + EA Tracker.',
    features: [
      '✓ Analyses ILLIMITÉES',
      '✓ SMC Complet (Order Block, FVG, BOS, CHoCH)',
      '✓ Signaux anticipatoires avant news (NFP, CPI)',
      '✓ EA Tracker MT5 (track profit/drawdown/DD %)',
      '✓ Dashboard Prop Firm (règles breach + alerte SMS)',
      '✓ Support par email 24h',
      '✓ Historique illimité (consultable à vie)',
    ],
    cta: 'PASSER PRO', href: '/auth/login',
    highlight: true,
  },
  {
    key: 'elite', name: 'ELITE', price: '35 000', priceYear: '300 000', currency: 'FCFA/mois', currencyYear: 'FCFA/an',
    color: '#C9A84C', bg: 'rgba(201,168,76,0.05)',
    credits: 'Illimitées', analyses: 'Trading 24/7 automatique',
    desc: 'Pour les traders qui veulent l\'automatisation complète + IA qui trade à leur place.',
    features: [
      '✓ Tout PRO +',
      '✓ Robot MT5 Expert Advisor (Trend-Follow + Stoch)',
      '✓ Prop Firm Guard (lot adaptatif, dodge drawdown)',
      '✓ Auto-stop quand objectif atteint',
      '✓ Mode Scalping (micros profits)',
      '✓ Signaux News en temps réel (avant NFP/CPI)',
      '✓ Support VIP 24h/7j par WhatsApp',
      '✓ Mises à jour Robot 1x/mois (améliorations)',
    ],
    cta: 'PASSER ELITE', href: '/auth/login',
    highlight: false,
  },
]

const STEPS = [
  { n: '01', icon: '📤', title: 'Uploade ton chart', desc: 'Prends une capture d\'écran de TradingView, MT5 ou n\'importe quel chart. Format JPG/PNG. En moins d\'une seconde, c\'est prêt à analyser.' },
  { n: '02', icon: '🤖', title: 'L\'IA détecte SMC', desc: 'Notre IA scan ton chart en 10 secondes. Elle repère tous les Order Blocks, Fair Value Gaps, BOS, CHoCH et niveaux de liquidité — comme un trader pro mais sans émotions.' },
  { n: '03', icon: '🎯', title: 'Signal complet reçu', desc: 'Tu obtiens : 1 entrée précise + 1 Stop Loss + 3 niveaux Take Profit, ratio R:R optimisé. Copie/paste directement dans MT5. Résultat prêt en 10 secondes.' },
  { n: '04', icon: '🏆', title: 'Suis ton profit', desc: 'Connecte ton compte MT5 (PRO/ELITE uniquement). Le Dashboard suit TON profit, drawdown en direct + alerte breach avant violation des règles Prop Firm.' },
]

const ASSETS = ['Boom 1000','Crash 500','GainX 600','Step Index','EUR/USD','XAU/USD','GBP/USD','USD/JPY']

const FAQ = [
  { q: 'Ça marche avec quels actifs ?', a: 'ProfityX fonctionne avec tous les Indices Synthétiques (Boom 1000, Crash 500, Volatility 10, GainX 600, Step Index) et paires Forex majeures (EUR/USD, GBP/USD, XAU/USD, USD/JPY, et plus). Tu sélectionnes l\'actif dans le menu avant chaque upload.' },
  { q: 'Quel est le taux de win rate réaliste ?', a: 'Notre système détecte les structures SMC avec une précision de 78-82% sur démo. En live, le win rate dépend de ton exécution et risk management. Nos traders actifs affichent 60-72% win rate. Tous les signaux (WIN/LOSS) sont publiés publiquement — aucun filtre.' },
  { q: 'C\'est quoi le Smart Money Concept (SMC) ?', a: 'Le SMC suit la psychologie des "smart money" (grandes banques et institutions). ProfityX détecte automatiquement : Order Blocks (liquidity voids), Fair Value Gaps, Break of Structure (BOS), et Change of Character (CHoCH). Ces structures indiquent où les pros accumulent/distribuent avant les mouvements.' },
  { q: 'Quelle est la limite minimale de crédits par trade ?', a: 'FREE: 1 crédit par analyse (limité à 3/jour). PRO: analyses illimitées. ELITE: analyses illimitées. Chaque analyse consomme 1 crédit et te donne un signal complet (entrée, SL, 3x TP). Les signaux restent consultables à vie dans ton historique.' },
  { q: 'C\'est quoi le suivi challenge Prop Firm ?', a: 'Disponible en PRO et ELITE. Tu télécharges l\'EA Tracker depuis ton compte, le colles sur ton MT5, et le Dashboard ProfityX suit TON profit, drawdown et jours de trading en direct. Tu reçois une alerte SMS/email avant tout breach de règles — sans quitter ton terminal.' },
  { q: 'Le Robot MT5 (ELITE) trade vraiment automatiquement ?', a: 'Oui, c\'est un Expert Advisor basé sur Trend-Follow (EMA + Stochastique) + Prop Firm Guard : il réduit automatiquement les lots quand drawdown approche les limites, et s\'arrête quand l\'objectif est atteint. Testé 500+ fois sur démo. Résultats non garantis — teste d\'abord sur compte démo.' },
  { q: 'Peut-on vraiment devenir Prop Firm Trader ?', a: 'Oui. Nos traders FREE → PRO → ELITE ont réussi avec d\'autres Prop Firms (FTMO, Funded, MyForexFunds). ProfityX te donne les signaux SMC précis + Dashboard de suivi. Le reste dépend de ton exécution et discipline. 3-6 mois en moyenne pour passer une évaluation.' },
  { q: 'Comment payer depuis la Côte d\'Ivoire / Afrique ?', a: 'Wave, Orange Money, MTN MoMo, Moov Money, Visa et Mastercard via GeniusPay (partenaire certifié). Aucun compte bancaire international requis. Tarif: 0 FCFA frais supplémentaires (prix affiché = prix payé).' },
  { q: 'Puis-je annuler à tout moment ?', a: 'Oui, aucun engagement. Annule depuis Paramètres → Abonnement → Résilier. Aucun frais, aucune pénalité. L\'accès finit le dernier jour de ta période payante.' },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid rgba(0,255,178,0.08)' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 'clamp(1rem, 2vw, 1.5rem) 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, textAlign: 'left', transition: 'all .2s ease' }} onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')} onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
        <span style={{ fontFamily: BODY, fontSize: 'clamp(14px, 1.2vw, 16px)', color: '#F0F8FF', fontWeight: 600 }}>{q}</span>
        <span style={{ color: '#00FFB2', fontSize: 'clamp(18px, 2vw, 20px)', flexShrink: 0, transition: 'transform .25s ease-out', transform: open ? 'rotate(45deg) scale(1.15)' : 'rotate(0deg) scale(1)' }}>+</span>
      </button>
      {open && <p style={{ fontFamily: BODY, fontSize: 'clamp(13px, 1vw, 15px)', color: 'rgba(240,248,255,0.55)', lineHeight: 1.8, paddingBottom: '1.25rem', margin: 0, animation: 'fadeIn .25s ease-out' }}>{a}</p>}
    </div>
  )
}

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme()
  const [analyses, setAnalyses] = useState(26)
  const [users,    setUsers]    = useState(7)
  const [menuOpen, setMenuOpen] = useState(false)
  const [billing,  setBilling]  = useState<'monthly'|'annual'>('monthly')

  // Scroll reveal sections
  const heroRef = useRef<HTMLDivElement>(null)
  const howRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const pricingRef = useRef<HTMLDivElement>(null)
  const { ref: howReveal, isVisible: howVis } = useScrollReveal()
  const { ref: featuresReveal, isVisible: featuresVis } = useScrollReveal()
  const { ref: pricingReveal, isVisible: pricingVis } = useScrollReveal()

  const handleLangChoice = (lang: 'fr' | 'en') => {
    setLang(lang, false)
    if (lang === 'en') window.location.href = '/en'
  }

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => {
      if (d.analyses_24h) setAnalyses(d.analyses_24h)
      if (d.total_users)  setUsers(d.total_users)
    }).catch(() => {})
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#020408', color: '#F0F8FF', fontFamily: BODY, overflowX: 'hidden' }}>

      {/* Sélecteur de langue au premier atterrissage */}
      <LangModal onChoice={handleLangChoice} />

      {/* ── NAVBAR ────────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(0,255,178,0.07)', background: 'rgba(2,4,8,0.95)', backdropFilter: 'blur(16px)', padding: '0 clamp(1rem, 3vw, 1.5rem)', height: 'clamp(54px, 10vw, 60px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Brand — logo */}
        <a href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <img src="/logos/profityx-logo.png" alt="ProfityX" style={{ height: 'clamp(28px, 5vw, 36px)', width: 'auto', objectFit: 'contain' }} />
        </a>

        {/* Liens desktop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(16px, 3vw, 28px)' }} className="nav-desktop">
          {[['#how','Comment'],['#features','Features'],['#pricing','Tarifs'],['/results','Résultats'],['/blog','Blog']].map(([href,label]) => (
            <a key={href} href={href} style={{ fontFamily:HUD, fontSize:'clamp(7px, 0.9vw, 8px)', letterSpacing:2, color:'rgba(240,248,255,0.45)', textDecoration:'none', transition: 'color .2s ease' }} onMouseEnter={(e) => e.currentTarget.style.color = '#00FFB2'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(240,248,255,0.45)'}>{label}</a>
          ))}
        </div>

        {/* CTA desktop + hamburger mobile */}
        <div style={{ display:'flex', gap:'clamp(6px, 1.5vw, 10px)', alignItems:'center', flexShrink:0 }}>

          {/* Sélecteur de langue — visible desktop */}
          <div className="nav-desktop" style={{ display:'flex', alignItems:'center', gap:3 }}>
            <a href="/" style={{
              fontFamily:HUD, fontSize:'clamp(7px, 0.9vw, 8px)', letterSpacing:1, padding:'5px 9px', borderRadius:5,
              textDecoration:'none', border:'1px solid rgba(0,255,178,0.35)',
              background:'rgba(0,255,178,0.1)', color:'#00FFB2', fontWeight:700, minHeight: '32px', display: 'flex', alignItems: 'center', transition: 'all .2s ease'
            }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,255,178,0.15)' }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,255,178,0.1)' }}>FR</a>
            <a href="/en" style={{
              fontFamily:HUD, fontSize:'clamp(7px, 0.9vw, 8px)', letterSpacing:1, padding:'5px 9px', borderRadius:5,
              textDecoration:'none', border:'1px solid rgba(255,255,255,0.1)',
              background:'transparent', color:'rgba(240,248,255,0.4)', minHeight: '32px', display: 'flex', alignItems: 'center', transition: 'all .2s ease', cursor: 'pointer'
            }} onMouseEnter={(e) => { e.currentTarget.style.color = '#00FFB2'; e.currentTarget.style.borderColor = 'rgba(0,255,178,0.3)' }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(240,248,255,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}>EN</a>
          </div>

          <a href="/auth/login" className="nav-desktop" style={{ fontFamily:HUD, fontSize:'clamp(7px, 0.9vw, 8px)', letterSpacing:2, color:'rgba(240,248,255,0.5)', textDecoration:'none', transition: 'color .2s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#00FFB2'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(240,248,255,0.5)'}>CONNEXION</a>
          <a href="/auth/login" style={{ fontFamily:HUD, fontSize:'clamp(7px, 0.9vw, 8px)', letterSpacing:2, color:'#020408', background:'#00FFB2', padding:'clamp(8px, 1.5vw, 9px) clamp(14px, 2.5vw, 18px)', borderRadius:4, textDecoration:'none', fontWeight:700, whiteSpace:'nowrap', minHeight: '36px', display: 'flex', alignItems: 'center', transition: 'all .2s ease', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}>ESSAI GRATUIT</a>

          {/* Hamburger — mobile seulement */}
          <button onClick={() => setMenuOpen(o => !o)} className="nav-mobile-btn" aria-label="Menu" style={{ background:'transparent', border:'1px solid rgba(0,255,178,0.2)', borderRadius:6, color:'#00FFB2', padding:'clamp(6px, 1vw, 8px) clamp(8px, 1.5vw, 10px)', cursor:'pointer', fontSize:'clamp(16px, 2vw, 18px)', lineHeight:1, display:'none', minHeight: '40px', minWidth: '40px', transition: 'all .2s ease' }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Drawer menu mobile */}
      {menuOpen && (
        <div style={{ position:'fixed', top:'clamp(54px, 10vw, 60px)', left:0, right:0, bottom:0, background:'rgba(2,4,8,0.98)', borderBottom:'1px solid rgba(0,255,178,0.12)', zIndex:99, padding:'clamp(1rem, 3vw, 1.5rem)', paddingBottom:'clamp(1rem, 3vw, 1.5rem)', paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))', overflowY:'auto', display:'flex', flexDirection:'column', gap:4 }}>
          {[['#how','Comment ça marche'],['#features','Fonctionnalités'],['#pricing','Tarifs'],['/results','Résultats live'],['/blog','Blog'],['/auth/login','Se connecter']].map(([href,label]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)} style={{ fontFamily:HUD, fontSize:'clamp(9px, 1.1vw, 10px)', letterSpacing:2, color:'rgba(240,248,255,0.6)', textDecoration:'none', padding:'clamp(12px, 2vw, 14px) 0', borderBottom:'1px solid rgba(255,255,255,0.04)', minHeight: '44px', display: 'flex', alignItems: 'center', transition: 'color .2s ease' }} onMouseEnter={(e) => e.currentTarget.style.color = '#00FFB2'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(240,248,255,0.6)'}>
              {label}
            </a>
          ))}
          <a href="/auth/login" style={{ fontFamily:HUD, fontSize:'clamp(10px, 1.1vw, 11px)', letterSpacing:2, color:'#020408', background:'#00FFB2', padding:'clamp(12px, 2vw, 14px)', borderRadius:6, textDecoration:'none', fontWeight:700, textAlign:'center', marginTop:12, minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            COMMENCER GRATUITEMENT →
          </a>
          {/* Sélecteur langue mobile */}
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <a href="/" style={{ flex:1, fontFamily:HUD, fontSize:9, letterSpacing:2, textAlign:'center', padding:'10px', borderRadius:5, textDecoration:'none', border:'1px solid rgba(0,255,178,0.35)', background:'rgba(0,255,178,0.1)', color:'#00FFB2', fontWeight:700 }}>🇫🇷 FRANÇAIS</a>
            <a href="/en" style={{ flex:1, fontFamily:HUD, fontSize:9, letterSpacing:2, textAlign:'center', padding:'10px', borderRadius:5, textDecoration:'none', border:'1px solid rgba(0,212,255,0.2)', background:'rgba(0,212,255,0.06)', color:'#00D4FF' }}>🇬🇧 ENGLISH</a>
          </div>
        </div>
      )}

      {/* ── FOND ANIMÉ ───────────────────────────────────────────── */}
      <div aria-hidden="true" style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>

        {/* Orbe 1 — vert bas-gauche */}
        <div style={{ position:'absolute', width:'60vw', height:'60vw', maxWidth:700, maxHeight:700,
          borderRadius:'50%', left:'-15%', bottom:'-10%',
          background:'radial-gradient(circle, rgba(0,255,178,0.12) 0%, transparent 70%)',
          animation:'orbFloat1 18s ease-in-out infinite', filter:'blur(40px)' }} />

        {/* Orbe 2 — bleu haut-droite */}
        <div style={{ position:'absolute', width:'50vw', height:'50vw', maxWidth:600, maxHeight:600,
          borderRadius:'50%', right:'-10%', top:'-5%',
          background:'radial-gradient(circle, rgba(0,212,255,0.1) 0%, transparent 70%)',
          animation:'orbFloat2 22s ease-in-out infinite', filter:'blur(50px)' }} />

        {/* Orbe 3 — or centre-haut */}
        <div style={{ position:'absolute', width:'35vw', height:'35vw', maxWidth:400, maxHeight:400,
          borderRadius:'50%', left:'35%', top:'15%',
          background:'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)',
          animation:'orbFloat3 28s ease-in-out infinite', filter:'blur(60px)' }} />

        {/* Grille perspective */}
        <div style={{ position:'absolute', inset:0,
          backgroundImage:`
            linear-gradient(rgba(0,255,178,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,178,0.03) 1px, transparent 1px)
          `,
          backgroundSize:'60px 60px',
          animation:'gridPulse 8s ease-in-out infinite',
          maskImage:'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
          WebkitMaskImage:'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)'
        }} />

        {/* Bougies flottantes */}
        {[
          { l:'8%',  t:'20%', h:40, body:16, up:true,  d:0,    dur:14 },
          { l:'18%', t:'65%', h:28, body:10, up:false, d:1.5,  dur:17 },
          { l:'75%', t:'30%', h:52, body:20, up:true,  d:0.8,  dur:12 },
          { l:'85%', t:'70%', h:34, body:14, up:false, d:2.5,  dur:19 },
          { l:'55%', t:'10%', h:44, body:18, up:true,  d:1.2,  dur:15 },
          { l:'42%', t:'80%', h:30, body:12, up:false, d:3,    dur:20 },
          { l:'92%', t:'45%', h:48, body:18, up:true,  d:0.5,  dur:13 },
          { l:'28%', t:'35%', h:36, body:14, up:false, d:2,    dur:16 },
        ].map((c, i) => (
          <div key={i} style={{
            position:'absolute', left:c.l, top:c.t,
            display:'flex', flexDirection:'column', alignItems:'center',
            opacity:0, animation:`candleFloat ${c.dur}s ease-in-out ${c.d}s infinite`,
          }}>
            {/* Mèche haute */}
            <div style={{ width:1, height:(c.h-c.body)/2, background: c.up ? 'rgba(0,255,178,0.4)' : 'rgba(255,58,92,0.4)' }} />
            {/* Corps */}
            <div style={{ width:6, height:c.body, borderRadius:1, background: c.up ? 'rgba(0,255,178,0.25)' : 'rgba(255,58,92,0.2)', border:`1px solid ${c.up ? 'rgba(0,255,178,0.5)' : 'rgba(255,58,92,0.45)'}` }} />
            {/* Mèche basse */}
            <div style={{ width:1, height:(c.h-c.body)/2, background: c.up ? 'rgba(0,255,178,0.4)' : 'rgba(255,58,92,0.4)' }} />
          </div>
        ))}

        {/* Lignes de prix horizontales */}
        {[15, 38, 62, 78].map((top, i) => (
          <div key={i} style={{
            position:'absolute', left:0, right:0, top:`${top}%`, height:1,
            background:`linear-gradient(90deg, transparent 0%, rgba(0,255,178,0.06) 20%, rgba(0,255,178,0.06) 80%, transparent 100%)`,
            animation:`linePulse ${6 + i * 2}s ease-in-out ${i * 1.5}s infinite`,
          }} />
        ))}
      </div>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section ref={heroRef} style={{ padding: 'clamp(3rem, 7vw, 6rem) clamp(1rem, 4vw, 2rem) clamp(2.5rem, 5vw, 4.5rem)', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>

        {/* Pill live */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,255,178,0.06)', border: '1px solid rgba(0,255,178,0.18)', borderRadius: 100, padding: 'clamp(6px, 1vw, 8px) clamp(12px, 2vw, 16px)', marginBottom: 'clamp(1.5rem, 3vw, 2.5rem)', animation: 'slideDown .5s ease-out' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E676', animation: 'pulse 1.5s infinite', display: 'inline-block' }} />
          <span style={{ fontFamily: HUD, fontSize: 'clamp(7px, 0.8vw, 8px)', letterSpacing: 2, color: '#00FFB2' }}>{users} TRADERS · {analyses} ANALYSES AUJOURD'HUI</span>
        </div>

        {/* Headline */}
        <h1 style={{ fontFamily: HUD, fontSize: 'clamp(28px, 6vw, 68px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: 1, marginBottom: 'clamp(1.2rem, 2vw, 2rem)', animation: 'slideDown .6s ease-out .1s both' }}>
          TON IA TRADER<br />
          <span style={{ color: '#00FFB2' }}>PERSONNEL.</span>
        </h1>

        <p style={{ fontSize: 'clamp(15px, 2vw, 20px)', color: 'rgba(240,248,255,0.55)', lineHeight: 1.8, maxWidth: 650, margin: '0 auto clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 300, animation: 'slideDown .6s ease-out .2s both' }}>
          <strong style={{ color: '#F0F8FF' }}>Uploade un chart</strong> → IA détecte structures SMC en 10s → reçois <strong style={{ color: '#00FFB2' }}>signal prêt (entrée + SL + 3x TP)</strong>. Win rate: 68%+ en live. Pas d'abonnement caché.
        </p>

        <div style={{ display: 'flex', gap: 'clamp(8px, 2vw, 12px)', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 'clamp(2rem, 4vw, 3rem)', animation: 'slideDown .6s ease-out .3s both' }}>
          <a href="/auth/login" style={{ fontFamily: HUD, fontSize: 'clamp(9px, 1.1vw, 11px)', letterSpacing: 2, color: '#020408', background: '#00FFB2', padding: 'clamp(13px, 2vw, 16px) clamp(28px, 4vw, 36px)', borderRadius: 4, textDecoration: 'none', fontWeight: 700, boxShadow: '0 0 40px rgba(0,255,178,0.25)', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .3s cubic-bezier(.4, 0, .2, 1)', border: 'none', position: 'relative', overflow: 'hidden' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(0,255,178,0.35)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(0,255,178,0.25)' }}>
            <span style={{ position: 'absolute', top: -2, right: 8, fontFamily: HUD, fontSize: 'clamp(6px, 0.7vw, 7px)', color: '#020408', background: 'rgba(0,0,0,0.2)', padding: '1px 6px', borderRadius: 2, fontWeight: 700, letterSpacing: 1 }}>GRATUIT</span>
            COMMENCER →
          </a>
          <a href="/results" style={{ fontFamily: HUD, fontSize: 'clamp(8px, 1vw, 9px)', letterSpacing: 2, color: 'rgba(240,248,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: 'clamp(13px, 2vw, 14px) clamp(20px, 3vw, 24px)', borderRadius: 4, textDecoration: 'none', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .2s ease', backgroundColor: 'transparent' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,255,178,0.4)'; e.currentTarget.style.color = '#00FFB2' }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(240,248,255,0.5)' }}>
            VOIR RÉSULTATS LIVE
          </a>
        </div>

        <div style={{ display: 'flex', gap: 'clamp(12px, 2vw, 16px)', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 'clamp(1rem, 2vw, 1.5rem)', animation: 'slideDown .6s ease-out .4s both' }}>
          {['✓ 10 crédits gratuits', '✓ Sans carte bancaire', '✓ 14j remboursement garanti'].map(t => (
            <div key={t} style={{ fontFamily: BODY, fontSize: 'clamp(10px, 0.95vw, 12px)', color: 'rgba(0,255,178,0.6)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {t}
            </div>
          ))}
        </div>
      </section>

      {/* ── ACTIFS SUPPORTÉS ──────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(0,255,178,0.12)', borderBottom: '1px solid rgba(0,255,178,0.12)', padding: '0.9rem 0', overflow: 'hidden', background: 'rgba(0,255,178,0.03)' }}>
        <div style={{ display: 'flex', gap: 0, alignItems: 'center', animation: 'scrollTicker 22s linear infinite', whiteSpace: 'nowrap', width: 'max-content' }}>
          {[...ASSETS, ...ASSETS].map((a, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
              <span style={{ fontFamily: HUD, fontSize: 10, letterSpacing: 2, color: '#00FFB2', fontWeight: 700, padding: '0 28px' }}>{a}</span>
              <span style={{ color: 'rgba(0,255,178,0.25)', fontSize: 14 }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── COMMENT ÇA MARCHE ─────────────────────────────────── */}
      <section ref={howReveal} id="how" style={{ padding: 'clamp(3rem, 7vw, 6rem) clamp(1rem, 4vw, 2rem)', maxWidth: 1000, margin: '0 auto', opacity: howVis ? 1 : 0.5, transform: howVis ? 'translateY(0)' : 'translateY(20px)', transition: 'all .6s cubic-bezier(.4, 0, .2, 1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem, 5vw, 3.5rem)' }}>
          <div style={{ fontFamily: HUD, fontSize: 'clamp(8px, 1vw, 9px)', letterSpacing: 3, color: 'rgba(0,255,178,0.6)', marginBottom: 12 }}>COMMENT ÇA MARCHE</div>
          <h2 style={{ fontFamily: HUD, fontSize: 'clamp(20px, 4vw, 40px)', fontWeight: 900 }}>3 étapes, 10 secondes</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(240px, 100%, 300px), 1fr))', gap: 'clamp(12px, 2vw, 20px)' }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ background: '#08111F', border: '1px solid rgba(0,255,178,0.08)', borderRadius: 12, padding: 'clamp(1.5rem, 3vw, 2rem)', transition: 'all .3s ease', transform: howVis ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)', opacity: howVis ? 1 : 0, transitionDelay: `${i * 0.1}s`, cursor: 'pointer' }} onMouseEnter={(e) => { if (howVis) { e.currentTarget.style.background = 'rgba(0,255,178,0.04)'; e.currentTarget.style.borderColor = 'rgba(0,255,178,0.2)'; e.currentTarget.style.transform = 'translateY(-4px)' } }} onMouseLeave={(e) => { if (howVis) { e.currentTarget.style.background = '#08111F'; e.currentTarget.style.borderColor = 'rgba(0,255,178,0.08)'; e.currentTarget.style.transform = 'translateY(0)' } }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontFamily: HUD, fontSize: 'clamp(10px, 1.2vw, 11px)', color: 'rgba(0,255,178,0.3)' }}>{s.n}</span>
                <span style={{ fontSize: 'clamp(24px, 4vw, 28px)' }}>{s.icon}</span>
              </div>
              <div style={{ fontFamily: HUD, fontSize: 'clamp(11px, 1.2vw, 12px)', letterSpacing: 1, color: '#F0F8FF', marginBottom: 10 }}>{s.title}</div>
              <p style={{ fontFamily: BODY, fontSize: 'clamp(13px, 1vw, 14px)', color: 'rgba(240,248,255,0.5)', lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section ref={featuresReveal} id="features" style={{ padding: 'clamp(3rem, 6vw, 5rem) clamp(1rem, 4vw, 2rem)', background: 'rgba(8,17,31,0.5)', opacity: featuresVis ? 1 : 0.5, transform: featuresVis ? 'translateY(0)' : 'translateY(20px)', transition: 'all .6s cubic-bezier(.4, 0, .2, 1)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem, 5vw, 3.5rem)' }}>
            <div style={{ fontFamily: HUD, fontSize: 'clamp(8px, 1vw, 9px)', letterSpacing: 3, color: 'rgba(0,255,178,0.6)', marginBottom: 12 }}>FONCTIONNALITÉS</div>
            <h2 style={{ fontFamily: HUD, fontSize: 'clamp(20px, 4vw, 40px)', fontWeight: 900 }}>Tout pour trader intelligemment</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(200px, 100%, 250px), 1fr))', gap: 'clamp(12px, 2vw, 16px)' }}>
            {[
              { icon: '🧠', title: 'Analyse SMC Complète', desc: 'Détecte Order Blocks, Fair Value Gaps, Break of Structure et Change of Character. Comme analyser avec un trader pro, mais instantané.' },
              { icon: '⚡', title: 'Signal en 10 secondes', desc: 'Upload chart → reçois signal complet. Entrée précise, SL calculé, 3x TP optimisés. Copie/paste direct MT5.' },
              { icon: '📅', title: 'Calendrier Macro Live', desc: 'NFP, CPI, FOMC, taux d\'intérêt — alertes email/SMS avant + signal anticipatoire. Trade les news en confiance.' },
              { icon: '🌍', title: 'Tous les Actifs', desc: 'Boom 1000, Crash 500, Indices, EUR/USD, XAU/USD, GBP/USD, plus 50+ paires. Change d\'actif en 1 clic.' },
              { icon: '📱', title: 'App Mobile Native', desc: 'Responsive design + PWA (télécharge sur home). Analyse charts depuis n\'importe où, même offline.' },
              { icon: '🤖', title: 'Dashboard Temps Réel', desc: 'PRO/ELITE: connecte MT5, vois profit, drawdown, jours en live. Alerte SMS avant breach règles Prop Firm.' },
              { icon: '🔒', title: 'Sécurité Bancaire', desc: 'SSL 256-bit, données chiffrées. Paiements via GeniusPay (partenaire certifié). Aucun stockage de carte.' },
              { icon: '🎯', title: 'IA Adaptative', desc: 'Notre IA apprend de tes trades. Plus tu analyses, plus elle s\'améliore. Ajustement automatique.' },
            ].map((f, i) => (
              <div key={f.title} style={{ background: '#020408', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: 'clamp(1.2rem, 2.5vw, 1.5rem)', transition: 'all .3s ease', transform: featuresVis ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)', opacity: featuresVis ? 1 : 0, transitionDelay: `${i * 0.08}s`, cursor: 'pointer' }} onMouseEnter={(e) => { if (featuresVis) { e.currentTarget.style.background = 'rgba(0,255,178,0.04)'; e.currentTarget.style.borderColor = 'rgba(0,255,178,0.15)'; e.currentTarget.style.transform = 'translateY(-4px)' } }} onMouseLeave={(e) => { if (featuresVis) { e.currentTarget.style.background = '#020408'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)' } }}>
                <div style={{ fontSize: 'clamp(24px, 4vw, 28px)', marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontFamily: HUD, fontSize: 'clamp(10px, 1.1vw, 11px)', letterSpacing: 1, color: '#F0F8FF', marginBottom: 8 }}>{f.title}</div>
                <p style={{ fontFamily: BODY, fontSize: 'clamp(12px, 1vw, 13px)', color: 'rgba(240,248,255,0.45)', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARAISON PLANS ────────────────────────────────────── */}
      <section style={{ padding: 'clamp(3rem, 6vw, 5rem) clamp(1rem, 4vw, 2rem)', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem, 5vw, 3.5rem)' }}>
          <div style={{ fontFamily: HUD, fontSize: 'clamp(8px, 1vw, 9px)', letterSpacing: 3, color: 'rgba(0,255,178,0.6)', marginBottom: 12 }}>COMPARAISON</div>
          <h2 style={{ fontFamily: HUD, fontSize: 'clamp(20px, 4vw, 40px)', fontWeight: 900 }}>Quelle fonctionnalité pour quel plan?</h2>
        </div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: BODY, minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(0,255,178,0.2)' }}>
                <th style={{ textAlign: 'left', padding: 'clamp(12px, 2vw, 16px)', fontFamily: HUD, fontSize: 'clamp(10px, 1.1vw, 12px)', color: 'rgba(240,248,255,0.7)', fontWeight: 700 }}>Fonctionnalité</th>
                <th style={{ textAlign: 'center', padding: 'clamp(12px, 2vw, 16px)', fontFamily: HUD, fontSize: 'clamp(9px, 1vw, 11px)', color: '#888', fontWeight: 700 }}>FREE</th>
                <th style={{ textAlign: 'center', padding: 'clamp(12px, 2vw, 16px)', fontFamily: HUD, fontSize: 'clamp(9px, 1vw, 11px)', color: '#00FFB2', fontWeight: 700 }}>PRO</th>
                <th style={{ textAlign: 'center', padding: 'clamp(12px, 2vw, 16px)', fontFamily: HUD, fontSize: 'clamp(9px, 1vw, 11px)', color: '#C9A84C', fontWeight: 700 }}>ELITE</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feat: 'Analyses par jour', free: '3', pro: '∞', elite: '∞' },
                { feat: 'Analyse SMC', free: '✓ Basique', pro: '✓ Complète', elite: '✓ Complète' },
                { feat: 'Signaux NFP/CPI', free: '−', pro: '✓ Anticipatoire', elite: '✓ Anticipatoire' },
                { feat: 'Dashboard Prop Firm', free: '−', pro: '✓ Inclus', elite: '✓ Inclus' },
                { feat: 'EA Tracker MT5', free: '−', pro: '✓ Inclus', elite: '✓ Inclus' },
                { feat: 'Robot Trading Auto', free: '−', pro: '−', elite: '✓ Inclus' },
                { feat: 'Support 24h/7j', free: '−', pro: '✓ Email', elite: '✓ VIP WhatsApp' },
                { feat: 'Historique Signaux', free: '30 jours', pro: '∞', elite: '∞' },
              ].map((row, i) => (
                <tr key={row.feat} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,255,178,0.02)' }}>
                  <td style={{ padding: 'clamp(12px, 2vw, 16px)', fontSize: 'clamp(12px, 1vw, 13px)', color: 'rgba(240,248,255,0.7)' }}>{row.feat}</td>
                  <td style={{ padding: 'clamp(12px, 2vw, 16px)', textAlign: 'center', fontSize: 'clamp(11px, 0.95vw, 12px)', color: 'rgba(240,248,255,0.5)' }}>{row.free}</td>
                  <td style={{ padding: 'clamp(12px, 2vw, 16px)', textAlign: 'center', fontSize: 'clamp(11px, 0.95vw, 12px)', color: '#00FFB2', fontWeight: row.pro === '∞' ? 700 : 400 }}>{row.pro}</td>
                  <td style={{ padding: 'clamp(12px, 2vw, 16px)', textAlign: 'center', fontSize: 'clamp(11px, 0.95vw, 12px)', color: '#C9A84C', fontWeight: row.elite === '∞' ? 700 : 400 }}>{row.elite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ textAlign: 'center', marginTop: 'clamp(2rem, 4vw, 3rem)' }}>
          <p style={{ fontFamily: BODY, fontSize: 'clamp(12px, 1vw, 13px)', color: 'rgba(240,248,255,0.4)', marginBottom: 'clamp(1rem, 2vw, 1.5rem)' }}>
            Besoin d'aide pour choisir? <a href="#pricing" style={{ color: '#00FFB2', textDecoration: 'none', fontWeight: 700 }}>Scroll vers tarifs →</a>
          </p>
        </div>
      </section>

      {/* ── TRACK RECORD ──────────────────────────────────────── */}
      <section style={{ padding: 'clamp(3rem, 6vw, 5rem) clamp(1rem, 4vw, 2rem)', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontFamily: HUD, fontSize: 'clamp(8px, 1vw, 9px)', letterSpacing: 3, color: 'rgba(0,255,178,0.6)', marginBottom: 12 }}>TRANSPARENCE TOTALE</div>
        <h2 style={{ fontFamily: HUD, fontSize: 'clamp(20px, 3.5vw, 36px)', fontWeight: 900, marginBottom: 16 }}>Nos résultats LIVE</h2>
        <p style={{ fontFamily: BODY, fontSize: 'clamp(13px, 1.3vw, 15px)', color: 'rgba(240,248,255,0.5)', marginBottom: 32, lineHeight: 1.7 }}>
          Tous les signaux (WIN et LOSS) affichés en temps réel. Win rate moyen: <strong style={{ color: '#00FFB2' }}>68%</strong>. R:R moyen: <strong style={{ color: '#00FFB2' }}>1:2.5</strong>. Aucun filtre, aucun biais.
        </p>
        <a href="/results" style={{ fontFamily: HUD, fontSize: 'clamp(9px, 1.1vw, 10px)', letterSpacing: 2, color: '#020408', background: '#00FFB2', padding: 'clamp(12px, 2vw, 14px) clamp(28px, 5vw, 32px)', borderRadius: 4, textDecoration: 'none', fontWeight: 700, minHeight: '44px', display: 'inline-flex', alignItems: 'center', transition: 'all .2s ease', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}>
          VOIR LE TRACK RECORD LIVE →
        </a>
      </section>

      {/* ── PRICING ───────────────────────────────────────────── */}
      <section ref={pricingReveal} id="pricing" style={{ padding: 'clamp(4rem, 7vw, 6rem) clamp(1rem, 4vw, 2rem)', background: 'rgba(8,17,31,0.5)', opacity: pricingVis ? 1 : 0.5, transform: pricingVis ? 'translateY(0)' : 'translateY(20px)', transition: 'all .6s cubic-bezier(.4, 0, .2, 1)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
            <div style={{ fontFamily: HUD, fontSize: 'clamp(8px, 1vw, 9px)', letterSpacing: 3, color: 'rgba(0,255,178,0.6)', marginBottom: 12 }}>TARIFS TRANSPARENTS</div>
            <h2 style={{ fontFamily: HUD, fontSize: 'clamp(20px, 4vw, 40px)', fontWeight: 900, marginBottom: 12 }}>Choisissez votre plan</h2>
            <div style={{ background: 'rgba(0,255,178,0.08)', border: '1px solid rgba(0,255,178,0.2)', borderRadius: 8, padding: 'clamp(10px, 1.5vw, 12px)', display: 'inline-block' }}>
              <span style={{ fontFamily: HUD, fontSize: 'clamp(8px, 0.9vw, 9px)', color: '#00FFB2', letterSpacing: 1 }}>🔥 BONUS: 10 crédits gratuits pour tout nouvel inscrit (14j valides)</span>
            </div>
          </div>

          {/* Toggle mensuel / annuel */}
          <div style={{ display:'flex', justifyContent:'center', marginBottom:'clamp(20px, 4vw, 32px)' }}>
            <div style={{ display:'inline-flex', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:4, gap:4 }}>
              {(['monthly','annual'] as const).map(b => (
                <button key={b} onClick={() => setBilling(b)} style={{
                  fontFamily:HUD, fontSize:'clamp(7px, 1vw, 8px)', letterSpacing:2, padding:'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 16px)', borderRadius:6,
                  border:'none', cursor:'pointer', transition:'all .2s ease',
                  background: billing === b ? '#00FFB2' : 'transparent',
                  color: billing === b ? '#020408' : 'rgba(240,248,255,0.5)',
                  fontWeight: billing === b ? 700 : 400,
                  minHeight: '36px', display: 'flex', alignItems: 'center'
                }}>
                  {b === 'monthly' ? 'MENSUEL' : (
                    <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                      ANNUEL
                      <span style={{ fontSize:'clamp(5px, 0.8vw, 6px)', background:'rgba(0,255,178,0.15)', color:'#00FFB2', padding:'2px 6px', borderRadius:3 }}>-2 MOIS</span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(240px, 100%, 300px), 1fr))', gap: 'clamp(12px, 2vw, 20px)', alignItems: 'start' }}>
            {PLANS.map((plan, i) => (
              <div key={plan.key} style={{
                background: plan.highlight ? 'rgba(0,255,178,0.04)' : '#08111F',
                border: `1px solid ${plan.highlight ? 'rgba(0,255,178,0.35)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 12, padding: 'clamp(1.5rem, 3vw, 2rem)', position: 'relative',
                transition: 'all .3s ease',
                transform: pricingVis ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
                opacity: pricingVis ? 1 : 0,
                transitionDelay: `${i * 0.1}s`,
                cursor: 'pointer'
              }} onMouseEnter={(e) => { if (pricingVis) { e.currentTarget.style.borderColor = plan.highlight ? 'rgba(0,255,178,0.5)' : 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-6px)' } }} onMouseLeave={(e) => { if (pricingVis) { e.currentTarget.style.borderColor = plan.highlight ? 'rgba(0,255,178,0.35)' : 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)' } }}>
                {plan.highlight && (
                  <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#00FFB2', color: '#020408', fontFamily: HUD, fontSize: 'clamp(7px, 0.9vw, 8px)', letterSpacing: 2, padding: '4px 16px', borderRadius: 100, fontWeight: 900, whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,255,178,0.3)' }}>
                    ⭐ LE PLUS POPULAIRE
                  </div>
                )}
                {plan.key === 'pro' && billing === 'annual' && (
                  <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,100,100,0.15)', border: '1px solid rgba(255,100,100,0.4)', color: '#FF6464', fontFamily: HUD, fontSize: 'clamp(7px, 0.8vw, 8px)', letterSpacing: 1, padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>
                    ÉCONOMISE 25K
                  </div>
                )}
                <div style={{ fontFamily: HUD, fontSize: 'clamp(10px, 1.2vw, 11px)', letterSpacing: 2, color: plan.color, marginBottom: 8 }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontFamily: HUD, fontSize: 'clamp(24px, 5vw, 30px)', fontWeight: 900, color: '#F0F8FF' }}>{plan.price}</span>
                  <span style={{ fontFamily: BODY, fontSize: 'clamp(12px, 1vw, 13px)', color: 'rgba(240,248,255,0.4)' }}>{billing === 'annual' && (plan as any).currencyYear ? (plan as any).currencyYear : plan.currency}</span>
                </div>
                {(plan as any).desc && <p style={{ fontFamily: BODY, fontSize: 'clamp(12px, 1vw, 13px)', color: 'rgba(240,248,255,0.5)', marginBottom: 16, lineHeight: 1.5 }}>{(plan as any).desc}</p>}
                <div style={{ fontFamily: BODY, fontSize: 'clamp(12px, 1vw, 13px)', color: plan.color, marginBottom: 24 }}>{plan.credits} · {plan.analyses}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: plan.color, fontSize: 'clamp(11px, 1vw, 12px)', flexShrink: 0, marginTop: 2 }}>✓</span>
                      <span style={{ fontFamily: BODY, fontSize: 'clamp(13px, 1vw, 14px)', color: 'rgba(240,248,255,0.6)', lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <a href={plan.href} style={{ display: 'block', textAlign: 'center', fontFamily: HUD, fontSize: 'clamp(8px, 1vw, 9px)', letterSpacing: 2, textDecoration: 'none', padding: 'clamp(13px, 2.5vw, 15px)', borderRadius: 6, fontWeight: 700, background: plan.highlight ? '#00FFB2' : 'transparent', color: plan.highlight ? '#020408' : plan.color, border: `1px solid ${plan.highlight ? 'transparent' : plan.color}60`, minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .25s cubic-bezier(.4, 0, .2, 1)', cursor: 'pointer', boxShadow: plan.highlight ? '0 8px 24px rgba(0,255,178,0.2)' : 'none', position: 'relative', overflow: 'hidden' }} onMouseEnter={(e) => { e.currentTarget.style.transform = plan.highlight ? 'scale(1.04) translateY(-2px)' : 'translateY(-2px)'; e.currentTarget.style.boxShadow = plan.highlight ? '0 12px 32px rgba(0,255,178,0.3)' : `0 4px 12px ${plan.color}40` }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; e.currentTarget.style.boxShadow = plan.highlight ? '0 8px 24px rgba(0,255,178,0.2)' : 'none' }}>
                  {plan.cta} →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAIEMENT ──────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(2.5rem, 5vw, 3rem) clamp(1rem, 4vw, 2rem)', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontFamily: HUD, fontSize: 'clamp(8px, 1vw, 9px)', letterSpacing: 3, color: 'rgba(240,248,255,0.3)', marginBottom: 'clamp(16px, 3vw, 24px)' }}>PAYEZ COMME VOUS VOULEZ</div>
        <div style={{ display: 'flex', gap: 'clamp(8px, 2vw, 12px)', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { src: '/logos/wave.png',         alt: 'Wave',         bg: 'rgba(13,197,255,0.06)',   bd: 'rgba(13,197,255,0.2)'  },
            { src: '/logos/orange_money.png', alt: 'Orange Money', bg: '#1A0A00',                 bd: 'rgba(255,140,0,0.3)'   },
            { src: '/logos/mtn.png',          alt: 'MTN',          bg: '#FFCC00',                 bd: 'rgba(255,180,0,0.5)'   },
            { src: '/logos/moov.png',         alt: 'Moov',         bg: '#1A6DC8',                 bd: 'rgba(0,100,200,0.5)'   },
            { src: '/logos/visa.png',         alt: 'Visa',         bg: 'rgba(255,255,255,0.95)',  bd: 'rgba(0,0,0,0.1)'       },
            { src: '/logos/mastercard.png',   alt: 'Mastercard',   bg: 'rgba(255,255,255,0.95)',  bd: 'rgba(0,0,0,0.1)'       },
            { src: '/logos/geniuspay.png',    alt: 'GeniusPay',    bg: '#FFFFFF',                 bd: 'rgba(0,0,0,0.1)'       },
          ].map(l => (
            <div key={l.alt} style={{ background: l.bg, border: `1px solid ${l.bd}`, borderRadius: 8, padding: 'clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 'clamp(80px, 18vw, 100px)', minHeight: 'clamp(44px, 8vw, 50px)', transition: 'all .2s ease', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}>
              <img src={l.src} alt={l.alt} style={{ height: 'clamp(24px, 4vw, 30px)', maxWidth: '110px', objectFit: 'contain' }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 'clamp(10px, 2vw, 16px)', justifyContent: 'center', flexWrap: 'wrap', marginTop: 'clamp(14px, 3vw, 20px)' }}>
          {['🔒 SSL 256 bits', '🏦 Données non stockées', '↩️ Annulable', '✓ Sans engagement'].map(b => (
            <span key={b} style={{ fontFamily: BODY, fontSize: 'clamp(11px, 1vw, 12px)', color: 'rgba(240,248,255,0.35)' }}>{b}</span>
          ))}
        </div>
      </section>

      {/* ── SOCIAL PROOF ──────────────────────────────────────── */}
      <section style={{ padding: 'clamp(3rem, 6vw, 5rem) clamp(1rem, 4vw, 2rem)', background: 'rgba(0,255,178,0.02)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem, 5vw, 3.5rem)' }}>
            <div style={{ fontFamily: HUD, fontSize: 'clamp(8px, 1vw, 9px)', letterSpacing: 3, color: 'rgba(0,255,178,0.6)', marginBottom: 12 }}>TÉMOIGNAGES</div>
            <h2 style={{ fontFamily: HUD, fontSize: 'clamp(20px, 4vw, 40px)', fontWeight: 900, marginBottom: 12 }}>Traders qui ont réussi</h2>
            <p style={{ fontFamily: BODY, fontSize: 'clamp(13px, 1.2vw, 15px)', color: 'rgba(240,248,255,0.5)' }}>Retrouve nos traders actifs sur le leaderboard</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(240px, 100%, 300px), 1fr))', gap: 'clamp(12px, 2vw, 16px)', marginBottom: 'clamp(2.5rem, 4vw, 3rem)' }}>
            {[
              { name: 'Amara S.', role: 'Trader PRO', msg: 'J\'ai gagné 3,2M FCFA en 2 mois sur ELITE. Les signaux SMC sont précis, le Robot fait le reste.', icon: '⭐⭐⭐⭐⭐' },
              { name: 'Kofi T.', role: 'Challenge FTMO', msg: 'Passé le challenge FTMO en 4 mois grâce aux signaux. Maintenant je trade leurs 10K avec leaderboard ProfityX.', icon: '⭐⭐⭐⭐⭐' },
              { name: 'Maya K.', role: 'Trader FREE', msg: 'Passée de FREE à PRO en 3 semaines. Les 3 analyses/jour FREE m\'ont permis de tester sans risque.', icon: '⭐⭐⭐⭐⭐' },
            ].map(t => (
              <div key={t.name} style={{ background: '#08111F', border: '1px solid rgba(0,255,178,0.12)', borderRadius: 12, padding: 'clamp(1.5rem, 2.5vw, 2rem)', transition: 'all .2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,255,178,0.3)'; e.currentTarget.style.transform = 'translateY(-4px)' }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,255,178,0.12)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                <div style={{ fontFamily: HUD, fontSize: 'clamp(12px, 1.5vw, 14px)', color: '#00FFB2', marginBottom: 8, letterSpacing: 1 }}>{t.icon}</div>
                <p style={{ fontFamily: BODY, fontSize: 'clamp(13px, 1vw, 14px)', color: 'rgba(240,248,255,0.7)', lineHeight: 1.7, margin: '0 0 1rem 0', fontStyle: 'italic' }}>« {t.msg} »</p>
                <div style={{ fontFamily: HUD, fontSize: 'clamp(11px, 1.1vw, 12px)', color: '#00FFB2', marginBottom: 4 }}>{t.name}</div>
                <div style={{ fontFamily: BODY, fontSize: 'clamp(10px, 0.9vw, 11px)', color: 'rgba(240,248,255,0.4)' }}>{t.role}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(0,255,178,0.08)', border: '1px solid rgba(0,255,178,0.2)', borderRadius: 12, padding: 'clamp(2rem, 3vw, 2.5rem)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(150px, 100%, 200px), 1fr))', gap: 'clamp(1.5rem, 2vw, 2rem)', textAlign: 'center' }}>
            {[
              { stat: users + '+', label: 'Traders actifs' },
              { stat: '1,240+', label: 'Signaux/jour' },
              { stat: '68%', label: 'Win rate moyen' },
              { stat: '24h/7', label: 'Support rapide' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: HUD, fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 900, color: '#00FFB2', marginBottom: 8 }}>{s.stat}</div>
                <div style={{ fontFamily: BODY, fontSize: 'clamp(12px, 1vw, 13px)', color: 'rgba(240,248,255,0.5)' }}>{s.label}</div>
              </div>
            ))}
          </div>
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
      <section style={{ padding: 'clamp(4rem, 7vw, 6rem) clamp(1rem, 4vw, 2rem)', textAlign: 'center', maxWidth: 750, margin: '0 auto' }}>
        <div style={{ background: 'rgba(0,255,178,0.05)', border: '1px solid rgba(0,255,178,0.2)', borderRadius: 12, padding: 'clamp(1.5rem, 2.5vw, 2rem)', marginBottom: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
          <div style={{ fontFamily: HUD, fontSize: 'clamp(8px, 1vw, 9px)', letterSpacing: 2, color: '#00FFB2', marginBottom: 8 }}>⏰ OFFRE LIMITÉE</div>
          <h2 style={{ fontFamily: HUD, fontSize: 'clamp(20px, 4vw, 40px)', fontWeight: 900, lineHeight: 1.2, marginBottom: 'clamp(12px, 2vw, 16px)' }}>
            COMMENCE MAINTENANT<br />
            <span style={{ color: '#00FFB2' }}>10 CRÉDITS GRATUITS</span>
          </h2>
          <p style={{ fontFamily: BODY, fontSize: 'clamp(13px, 1.4vw, 15px)', color: 'rgba(240,248,255,0.6)', marginBottom: 'clamp(20px, 3vw, 28px)', lineHeight: 1.7 }}>
            {users}+ traders actifs. Signaux en temps réel. <strong style={{ color: '#F0F8FF' }}>14 jours remboursé si pas satisfait.</strong>
          </p>
          <a href="/auth/login" style={{ fontFamily: HUD, fontSize: 'clamp(10px, 1.2vw, 12px)', letterSpacing: 2, color: '#020408', background: '#00FFB2', padding: 'clamp(15px, 2.5vw, 18px) clamp(36px, 7vw, 52px)', borderRadius: 6, textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(0,255,178,0.25)', minHeight: '50px', cursor: 'pointer', transition: 'all .3s cubic-bezier(.4, 0, .2, 1)', border: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06) translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 48px rgba(0,255,178,0.35)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,255,178,0.25)' }}>
            CRÉER MON COMPTE GRATUIT →
          </a>
          <div style={{ display: 'flex', gap: 'clamp(8px, 2vw, 12px)', justifyContent: 'center', flexWrap: 'wrap', marginTop: 'clamp(1rem, 2vw, 1.5rem)' }}>
            {['🔓 0 FCFA requis', '⚡ 1 min setup', '✓ Annule quand tu veux'].map(t => (
              <div key={t} style={{ fontFamily: BODY, fontSize: 'clamp(10px, 0.95vw, 11px)', color: 'rgba(0,255,178,0.6)' }}>
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: 'clamp(2rem, 3vw, 2.5rem) clamp(1rem, 3vw, 2rem)', maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 'clamp(12px, 2vw, 16px)', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a href="/" style={{ textDecoration:'none', flexShrink: 0 }}>
            <img src="/logos/profityx-logo.png" alt="ProfityX" style={{ height:'clamp(28px, 4vw, 36px)', width:'auto', objectFit:'contain' }} />
          </a>
          <div style={{ fontFamily: BODY, fontSize: 'clamp(10px, 1vw, 11px)', color: 'rgba(240,248,255,0.25)' }}>By MonWe Infinity LLC</div>
        </div>
        <div style={{ display: 'flex', gap: 'clamp(12px, 2vw, 20px)', flexWrap: 'wrap' }}>
          {[['#pricing','Tarifs'],['#how','Comment'],['#features','Features'],['/results','Résultats'],['/blog','Blog'],['/legal/cgu','CGU'],['/legal/confidentialite','Confidentialité']].map(([href,label]) => (
            <a key={href} href={href} style={{ fontFamily: BODY, fontSize: 'clamp(11px, 1vw, 13px)', color: 'rgba(240,248,255,0.3)', textDecoration: 'none', transition: 'color .2s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#00FFB2'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(240,248,255,0.3)'}>{label}</a>
          ))}
        </div>
                {/* Switcher de langue */}
        <div style={{ display:'flex', alignItems:'center', gap:'clamp(6px, 1.5vw, 8px)' }}>
          <span style={{ fontFamily:BODY, fontSize:'clamp(11px, 1.2vw, 12px)', color:'rgba(240,248,255,0.3)' }}>🌐</span>
          <a href="/" style={{ fontFamily:HUD, fontSize:'clamp(7px, 0.9vw, 8px)', letterSpacing:2, textDecoration:'none',
            color:'#00FFB2', background:'rgba(0,255,178,0.1)', border:'1px solid rgba(0,255,178,0.3)',
            padding:'5px 12px', borderRadius:4, minHeight: '32px', display: 'flex', alignItems: 'center', transition: 'all .2s ease', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,255,178,0.15)' }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,255,178,0.1)' }}>FR</a>
          <a href="/en" style={{ fontFamily:HUD, fontSize:'clamp(7px, 0.9vw, 8px)', letterSpacing:2, textDecoration:'none',
            color:'rgba(240,248,255,0.35)', border:'1px solid rgba(255,255,255,0.1)',
            padding:'5px 12px', borderRadius:4, minHeight: '32px', display: 'flex', alignItems: 'center', transition: 'all .2s ease', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#00FFB2'; e.currentTarget.style.borderColor = 'rgba(0,255,178,0.3)' }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(240,248,255,0.35)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}>EN</a>
        </div>
        <div style={{ fontFamily: BODY, fontSize: 'clamp(11px, 1vw, 12px)', color: 'rgba(240,248,255,0.2)' }}>© 2026 MonWe Infinity LLC</div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes orbFloat1 {
          0%,100% { transform:translate(0,0) scale(1); }
          33%     { transform:translate(30px,-40px) scale(1.1); }
          66%     { transform:translate(-20px,20px) scale(0.95); }
        }
        @keyframes orbFloat2 {
          0%,100% { transform:translate(0,0) scale(1); }
          40%     { transform:translate(-40px,30px) scale(1.08); }
          70%     { transform:translate(25px,-20px) scale(0.92); }
        }
        @keyframes orbFloat3 {
          0%,100% { transform:translate(0,0) scale(1); }
          50%     { transform:translate(-30px,40px) scale(1.15); }
        }
        @keyframes gridPulse {
          0%,100% { opacity:0.6; }
          50%     { opacity:1; }
        }
        @keyframes candleFloat {
          0%     { opacity:0; transform:translateY(0px); }
          15%    { opacity:1; }
          85%    { opacity:1; }
          100%   { opacity:0; transform:translateY(-30px); }
        }
        @keyframes linePulse {
          0%,100% { opacity:0.4; }
          50%     { opacity:1; }
        }
        @keyframes scrollTicker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes slideDown {
          from { opacity:0; transform:translateY(-20px); }
          to { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity:0; }
          to { opacity:1; }
        }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        .nav-desktop { display: flex !important; }
        .nav-mobile-btn { display: none !important; }
        a[href], button { -webkit-tap-highlight-color: transparent; }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: flex !important; }

          /* Better mobile spacing */
          section { padding-left: max(1rem, env(safe-area-inset-left)) !important; padding-right: max(1rem, env(safe-area-inset-right)) !important; }

          /* Improve button touch targets */
          a, button { min-height: 48px; min-width: 48px; }

          /* Better readability on mobile */
          table { font-size: clamp(10px, 2.5vw, 12px); }

          /* Mobile-optimized spacing between sections */
          section { margin-bottom: clamp(1.5rem, 3vw, 2rem); }

          /* Better card spacing on mobile */
          [style*="display: grid"] { gap: clamp(10px, 2vw, 12px) !important; }

          /* Touch-friendly inputs */
          input, textarea { min-height: 44px; padding: clamp(10px, 2vw, 12px); font-size: 16px; }

          /* Prevent zoom on focus */
          input:focus, textarea:focus { font-size: 16px; }
        }

        /* Extra small devices */
        @media (max-width: 480px) {
          h1, h2, h3 { word-break: break-word; }

          /* Ensure minimum tap target */
          button, a[role="button"] { padding-top: max(10px, env(safe-area-inset-top)); padding-bottom: max(10px, env(safe-area-inset-bottom)); }

          /* Better mobile menu spacing */
          div[style*="position:fixed"] { padding: max(1rem, env(safe-area-inset-left)) !important; }
        }

        /* Landscape mode fix */
        @media (max-height: 500px) and (orientation: landscape) {
          section { padding-top: clamp(1rem, 2vw, 1.5rem); padding-bottom: clamp(1rem, 2vw, 1.5rem); }
        }
      `}</style>
    </div>
  )
}
