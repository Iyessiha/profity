'use client'
import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

const ASSETS = ['Boom 1000', 'Crash 500', 'GainX 600', 'Step Index', 'EUR/USD', 'XAU/USD', 'GBP/USD', 'USD/JPY']

const PAYMENT_LOGOS = [
  { src: '/logos/wave.png', alt: 'Wave', bg: 'rgba(13,197,255,0.06)', bd: 'rgba(13,197,255,0.2)' },
  { src: '/logos/orange_money.png', alt: 'Orange Money', bg: '#1A0A00', bd: 'rgba(255,140,0,0.3)' },
  { src: '/logos/mtn.png', alt: 'MTN', bg: '#FFCC00', bd: 'rgba(255,180,0,0.5)' },
  { src: '/logos/moov.png', alt: 'Moov', bg: '#1A6DC8', bd: 'rgba(0,100,200,0.5)' },
  { src: '/logos/visa.png', alt: 'Visa', bg: 'rgba(255,255,255,0.95)', bd: 'rgba(0,0,0,0.1)' },
  { src: '/logos/mastercard.png', alt: 'Mastercard', bg: 'rgba(255,255,255,0.95)', bd: 'rgba(0,0,0,0.1)' },
  { src: '/logos/geniuspay.png', alt: 'GeniusPay', bg: '#FFFFFF', bd: 'rgba(0,0,0,0.1)' },
]

// ── Reusable components ─────────────────────────────────────────

function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.15 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

function AnimatedCounter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const duration = 1500
          const startTime = Date.now()
          const tick = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.round(eased * end))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.5 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [end])

  return <span ref={ref}>{count.toLocaleString('fr-FR')}{suffix}</span>
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid rgba(0,255,178,0.08)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '1.5rem 0', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', gap: 16, textAlign: 'left',
        }}
      >
        <span style={{ fontFamily: BODY, fontSize: 17, color: '#F0F8FF', fontWeight: 600 }}>{q}</span>
        <span style={{
          color: '#00FFB2', fontSize: 22, flexShrink: 0,
          transition: 'transform .3s cubic-bezier(0.4,0,0.2,1)',
          transform: open ? 'rotate(45deg)' : 'none',
          width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '50%', background: 'rgba(0,255,178,0.08)',
        }}>+</span>
      </button>
      <div style={{
        maxHeight: open ? 300 : 0, overflow: 'hidden',
        transition: 'max-height .4s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <p style={{ fontFamily: BODY, fontSize: 15, color: 'rgba(240,248,255,0.55)', lineHeight: 1.7, paddingBottom: '1.5rem', margin: 0 }}>{a}</p>
      </div>
    </div>
  )
}

// ── Main landing component ──────────────────────────────────────

export default function LandingClient() {
  const t = useTranslations('landing')
  const tn = useTranslations('nav')
  const locale = useLocale()
  const otherLocale = locale === 'fr' ? 'en' : 'fr'

  const [analyses, setAnalyses] = useState(26)
  const [users, setUsers] = useState(7)
  const [menuOpen, setMenuOpen] = useState(false)
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [scrolled, setScrolled] = useState(false)

  const year = new Date().getFullYear()

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => {
      if (d.analyses_24h) setAnalyses(d.analyses_24h)
      if (d.total_users) setUsers(d.total_users)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const STEPS = [
    { n: '01', icon: '📤', title: t('step1Title'), desc: t('step1Desc') },
    { n: '02', icon: '🤖', title: t('step2Title'), desc: t('step2Desc') },
    { n: '03', icon: '🎯', title: t('step3Title'), desc: t('step3Desc') },
    { n: '04', icon: '🏆', title: t('step4Title'), desc: t('step4Desc') },
  ]

  const FEATURES = [
    { icon: '🧠', title: t('featureSMC'), desc: t('featureSMCDesc') },
    { icon: '⚡', title: t('feature10s'), desc: t('feature10sDesc') },
    { icon: '📊', title: t('featureCalendar'), desc: t('featureCalendarDesc') },
    { icon: '🌍', title: t('featureMarkets'), desc: t('featureMarketsDesc') },
    { icon: '📱', title: t('featureMobile'), desc: t('featureMobileDesc') },
    { icon: '🔒', title: t('featureSecure'), desc: t('featureSecureDesc') },
  ]

  const TESTIMONIALS = [
    { name: t('testimonial1Name'), loc: t('testimonial1Loc'), text: t('testimonial1Text'), avatar: t('testimonial1Name')[0] },
    { name: t('testimonial2Name'), loc: t('testimonial2Loc'), text: t('testimonial2Text'), avatar: t('testimonial2Name')[0] },
    { name: t('testimonial3Name'), loc: t('testimonial3Loc'), text: t('testimonial3Text'), avatar: t('testimonial3Name')[0] },
  ]

  const FAQS = [
    { q: t('faq1Q'), a: t('faq1A') },
    { q: t('faq2Q'), a: t('faq2A') },
    { q: t('faq3Q'), a: t('faq3A') },
    { q: t('faq4Q'), a: t('faq4A') },
    { q: t('faq5Q'), a: t('faq5A') },
    { q: t('faq6Q'), a: t('faq6A') },
  ]

  const PLANS = [
    {
      key: 'free', name: t('planFree'), color: '#8b9aac', highlight: false,
      price: t('planFreePrice'), currency: t('planFreeCurrency'),
      credits: t('planFreeCredits'), analyses: t('planFreeAnalyses'),
      features: [t('planFreeFeature1'), t('planFreeFeature2'), t('planFreeFeature3')],
      cta: t('planFreeCta'),
    },
    {
      key: 'pro', name: t('planPro'), color: '#00FFB2', highlight: true,
      price: billing === 'annual' ? t('planProPriceYear') : t('planProPrice'),
      currency: billing === 'annual' ? t('planProCurrencyYear') : t('planProCurrency'),
      credits: t('planProCredits'), analyses: t('planProAnalyses'),
      features: [t('planProFeature1'), t('planProFeature2'), t('planProFeature3'), t('planProFeature4'), t('planProFeature5'), t('planProFeature6')],
      cta: t('planProCta'),
    },
    {
      key: 'elite', name: t('planElite'), color: '#C9A84C', highlight: false,
      price: billing === 'annual' ? t('planElitePriceYear') : t('planElitePrice'),
      currency: billing === 'annual' ? t('planEliteCurrencyYear') : t('planEliteCurrency'),
      credits: t('planEliteCredits'), analyses: t('planEliteAnalyses'),
      features: [t('planEliteFeature1'), t('planEliteFeature2'), t('planEliteFeature3'), t('planEliteFeature4'), t('planEliteFeature5'), t('planEliteFeature6')],
      cta: t('planEliteCta'),
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#020408', color: '#F0F8FF', fontFamily: BODY, overflowX: 'hidden' }}>

      {/* ── NAVBAR ──────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        borderBottom: scrolled ? '1px solid rgba(0,255,178,0.1)' : '1px solid transparent',
        background: scrolled ? 'rgba(2,4,8,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        padding: '0 clamp(1rem,3vw,2rem)', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'all .3s ease',
      }}>
        <a href={`/${locale}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
          <img src="/logos/profityx-logo.png" alt="ProfityX" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="nav-desktop">
          {[['#how', tn('howItWorks')], ['#features', tn('features')], ['#pricing', tn('pricing')], ['/results', tn('results')], ['/blog', tn('blog')]].map(([href, label]) => (
            <a key={href} href={href} className="nav-link" style={{
              fontFamily: BODY, fontSize: 14, fontWeight: 500, letterSpacing: 0.5,
              color: 'rgba(240,248,255,0.5)', textDecoration: 'none', transition: 'color .2s',
            }}>{label}</a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
          <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <a href={`/fr`} style={{
              fontFamily: HUD, fontSize: 10, letterSpacing: 1, padding: '6px 12px', borderRadius: 6,
              textDecoration: 'none',
              border: locale === 'fr' ? '1px solid rgba(0,255,178,0.35)' : '1px solid rgba(255,255,255,0.08)',
              background: locale === 'fr' ? 'rgba(0,255,178,0.1)' : 'transparent',
              color: locale === 'fr' ? '#00FFB2' : 'rgba(240,248,255,0.35)',
              fontWeight: locale === 'fr' ? 700 : 400,
            }}>FR</a>
            <a href={`/en`} style={{
              fontFamily: HUD, fontSize: 10, letterSpacing: 1, padding: '6px 12px', borderRadius: 6,
              textDecoration: 'none',
              border: locale === 'en' ? '1px solid rgba(0,212,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
              background: locale === 'en' ? 'rgba(0,212,255,0.1)' : 'transparent',
              color: locale === 'en' ? '#00D4FF' : 'rgba(240,248,255,0.35)',
              fontWeight: locale === 'en' ? 700 : 400,
            }}>EN</a>
          </div>

          <a href="/auth/login" className="nav-desktop" style={{
            fontFamily: BODY, fontSize: 14, fontWeight: 500, color: 'rgba(240,248,255,0.5)',
            textDecoration: 'none', transition: 'color .2s',
          }}>{tn('connection')}</a>
          <a href="/auth/login" className="cta-btn" style={{
            fontFamily: HUD, fontSize: 11, letterSpacing: 1.5, color: '#020408',
            background: '#00FFB2', padding: '10px 22px', borderRadius: 8,
            textDecoration: 'none', fontWeight: 700, whiteSpace: 'nowrap',
            transition: 'transform .2s, box-shadow .2s',
          }}>{tn('freeTrial')}</a>

          <button onClick={() => setMenuOpen(o => !o)} className="nav-mobile-btn" aria-label="Menu" style={{
            background: 'transparent', border: '1px solid rgba(0,255,178,0.2)',
            borderRadius: 8, color: '#00FFB2', padding: '8px 11px',
            cursor: 'pointer', fontSize: 18, lineHeight: 1, display: 'none',
          }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* ── Mobile drawer ──────────────────────────────────── */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, bottom: 0,
          background: 'rgba(2,4,8,0.98)', zIndex: 99,
          padding: '2rem', display: 'flex', flexDirection: 'column', gap: 4,
          animation: 'slideDown .3s ease',
        }}>
          {[['#how', tn('howItWorks')], ['#features', tn('features')], ['#pricing', tn('pricing')], ['/results', tn('results')], ['/blog', tn('blog')], ['/auth/login', tn('login')]].map(([href, label]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)} style={{
              fontFamily: BODY, fontSize: 16, fontWeight: 500, letterSpacing: 0.5,
              color: 'rgba(240,248,255,0.6)', textDecoration: 'none',
              padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>{label}</a>
          ))}
          <a href="/auth/login" style={{
            fontFamily: HUD, fontSize: 12, letterSpacing: 2, color: '#020408',
            background: '#00FFB2', padding: '16px', borderRadius: 8,
            textDecoration: 'none', fontWeight: 700, textAlign: 'center', marginTop: 16,
          }}>{t('cta')}</a>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <a href="/fr" style={{ flex: 1, fontFamily: HUD, fontSize: 10, letterSpacing: 2, textAlign: 'center', padding: '12px', borderRadius: 6, textDecoration: 'none', border: '1px solid rgba(0,255,178,0.35)', background: locale === 'fr' ? 'rgba(0,255,178,0.1)' : 'transparent', color: locale === 'fr' ? '#00FFB2' : 'rgba(240,248,255,0.5)', fontWeight: locale === 'fr' ? 700 : 400 }}>🇫🇷 FR</a>
            <a href="/en" style={{ flex: 1, fontFamily: HUD, fontSize: 10, letterSpacing: 2, textAlign: 'center', padding: '12px', borderRadius: 6, textDecoration: 'none', border: '1px solid rgba(0,212,255,0.2)', background: locale === 'en' ? 'rgba(0,212,255,0.08)' : 'transparent', color: locale === 'en' ? '#00D4FF' : 'rgba(240,248,255,0.5)', fontWeight: locale === 'en' ? 700 : 400 }}>🇬🇧 EN</a>
          </div>
        </div>
      )}

      {/* ── ANIMATED BACKGROUND ────────────────────────────── */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: '60vw', height: '60vw', maxWidth: 700, maxHeight: 700, borderRadius: '50%', left: '-15%', bottom: '-10%', background: 'radial-gradient(circle, rgba(0,255,178,0.10) 0%, transparent 70%)', animation: 'orbFloat1 18s ease-in-out infinite', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', width: '50vw', height: '50vw', maxWidth: 600, maxHeight: 600, borderRadius: '50%', right: '-10%', top: '-5%', background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)', animation: 'orbFloat2 22s ease-in-out infinite', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', width: '35vw', height: '35vw', maxWidth: 400, maxHeight: 400, borderRadius: '50%', left: '35%', top: '15%', background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)', animation: 'orbFloat3 28s ease-in-out infinite', filter: 'blur(70px)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,255,178,0.025) 1px, transparent 1px),linear-gradient(90deg, rgba(0,255,178,0.025) 1px, transparent 1px)', backgroundSize: '80px 80px', maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 100%)' }} />
      </div>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: 'clamp(5rem,10vw,8rem) 2rem clamp(4rem,8vw,6rem)', maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
        <Reveal>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(0,255,178,0.06)', border: '1px solid rgba(0,255,178,0.18)', borderRadius: 100, padding: '8px 20px', marginBottom: '2.5rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00E676', animation: 'pulse 1.5s infinite', display: 'inline-block' }} />
            <span style={{ fontFamily: HUD, fontSize: 10, letterSpacing: 2, color: '#00FFB2' }}>
              {t('badge', { users, analyses })}
            </span>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <h1 style={{ fontFamily: HUD, fontSize: 'clamp(36px,6vw,76px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: 1, marginBottom: '2rem' }}>
            {t('headline')}<br />
            <span className="gradient-text">{t('headlineAccent')}</span>
          </h1>
        </Reveal>

        <Reveal delay={200}>
          <p style={{ fontSize: 'clamp(17px,2vw,21px)', color: 'rgba(240,248,255,0.55)', lineHeight: 1.75, maxWidth: 600, margin: '0 auto 3rem', fontWeight: 300 }}
             dangerouslySetInnerHTML={{ __html: t.raw('subheadline') }} />
        </Reveal>

        <Reveal delay={300}>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
            <a href="/auth/login" className="cta-primary" style={{ fontFamily: HUD, fontSize: 12, letterSpacing: 2, color: '#020408', background: '#00FFB2', padding: '18px 40px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, boxShadow: '0 0 50px rgba(0,255,178,0.25), 0 4px 20px rgba(0,255,178,0.15)', transition: 'transform .2s, box-shadow .2s' }}>
              {t('cta')}
            </a>
            <a href="/results" className="cta-secondary" style={{ fontFamily: HUD, fontSize: 11, letterSpacing: 2, color: 'rgba(240,248,255,0.6)', border: '1px solid rgba(255,255,255,0.12)', padding: '18px 28px', borderRadius: 10, textDecoration: 'none', transition: 'all .2s', background: 'rgba(255,255,255,0.03)' }}>
              {t('ctaSecondary')}
            </a>
          </div>
        </Reveal>

        <Reveal delay={400}>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[t('noCreditCard'), t('freeCredits'), t('cancelAnytime')].map(txt => (
              <span key={txt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: BODY, fontSize: 14, color: 'rgba(240,248,255,0.35)' }}>
                <span style={{ color: '#00FFB2', fontSize: 14 }}>✓</span> {txt}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={500}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, marginTop: '4rem', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,255,178,0.08)' }}>
            {[
              { value: analyses, suffix: '+', label: t('statAnalyses') },
              { value: 93, suffix: '%', label: t('statDetection') },
              { value: 10, suffix: 's', label: t('statTime') },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(8,17,31,0.6)', padding: 'clamp(1.25rem,2.5vw,2rem)', textAlign: 'center' }}>
                <div style={{ fontFamily: HUD, fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 900, color: '#00FFB2' }}>
                  <AnimatedCounter end={s.value} suffix={s.suffix} />
                </div>
                <div style={{ fontFamily: BODY, fontSize: 13, color: 'rgba(240,248,255,0.4)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── TICKER ────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(0,255,178,0.1)', borderBottom: '1px solid rgba(0,255,178,0.1)', padding: '0.9rem 0', overflow: 'hidden', background: 'rgba(0,255,178,0.02)', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 0, alignItems: 'center', animation: 'scrollTicker 22s linear infinite', whiteSpace: 'nowrap', width: 'max-content' }}>
          {[...ASSETS, ...ASSETS, ...ASSETS].map((a, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
              <span style={{ fontFamily: HUD, fontSize: 11, letterSpacing: 2, color: '#00FFB2', fontWeight: 700, padding: '0 32px' }}>{a}</span>
              <span style={{ color: 'rgba(0,255,178,0.2)', fontSize: 8 }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section id="how" style={{ position: 'relative', zIndex: 1, padding: 'clamp(5rem,8vw,7rem) 2rem', maxWidth: 1000, margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ fontFamily: HUD, fontSize: 10, letterSpacing: 4, color: 'rgba(0,255,178,0.5)', marginBottom: 14 }}>{t('howTitle')}</div>
            <h2 style={{ fontFamily: HUD, fontSize: 'clamp(26px,4vw,44px)', fontWeight: 900 }}>{t('howHeadline')}</h2>
          </div>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20 }}>
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="step-card" style={{ background: 'linear-gradient(160deg, rgba(8,17,31,0.9), rgba(2,4,8,0.9))', border: '1px solid rgba(0,255,178,0.08)', borderRadius: 16, padding: '2rem', transition: 'border-color .3s, box-shadow .3s', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0,255,178,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{s.icon}</div>
                  <span style={{ fontFamily: HUD, fontSize: 10, color: 'rgba(0,255,178,0.25)', fontWeight: 700 }}>{t('stepLabel')} {s.n}</span>
                </div>
                <div style={{ fontFamily: HUD, fontSize: 14, letterSpacing: 0.5, color: '#F0F8FF', marginBottom: 10 }}>{s.title}</div>
                <p style={{ fontFamily: BODY, fontSize: 15, color: 'rgba(240,248,255,0.5)', lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────── */}
      <section id="features" style={{ position: 'relative', zIndex: 1, padding: 'clamp(4rem,7vw,6rem) 2rem', background: 'rgba(8,17,31,0.4)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <div style={{ fontFamily: HUD, fontSize: 10, letterSpacing: 4, color: 'rgba(0,255,178,0.5)', marginBottom: 14 }}>{t('featuresTitle')}</div>
              <h2 style={{ fontFamily: HUD, fontSize: 'clamp(26px,4vw,44px)', fontWeight: 900 }}>{t('featuresHeadline')}</h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <div className="feature-card" style={{ background: 'rgba(2,4,8,0.8)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '1.75rem', transition: 'border-color .3s, transform .3s, box-shadow .3s', height: '100%' }}>
                  <div style={{ fontSize: 32, marginBottom: 14, width: 52, height: 52, borderRadius: 12, background: 'rgba(0,255,178,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{f.icon}</div>
                  <div style={{ fontFamily: HUD, fontSize: 13, letterSpacing: 0.5, color: '#F0F8FF', marginBottom: 8 }}>{f.title}</div>
                  <p style={{ fontFamily: BODY, fontSize: 14, color: 'rgba(240,248,255,0.45)', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: 'clamp(4rem,7vw,6rem) 2rem', maxWidth: 1000, margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ fontFamily: HUD, fontSize: 10, letterSpacing: 4, color: 'rgba(0,255,178,0.5)', marginBottom: 14 }}>{t('testimonialsTitle')}</div>
            <h2 style={{ fontFamily: HUD, fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 900 }}>{t('testimonialsHeadline')}</h2>
          </div>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
          {TESTIMONIALS.map((tm, i) => (
            <Reveal key={tm.name} delay={i * 120}>
              <div className="testimonial-card" style={{ background: 'linear-gradient(160deg, rgba(8,17,31,0.8), rgba(2,4,8,0.8))', border: '1px solid rgba(0,255,178,0.08)', borderRadius: 16, padding: '2rem', transition: 'border-color .3s', height: '100%' }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ color: '#C9A84C', fontSize: 16 }}>★</span>)}
                </div>
                <p style={{ fontFamily: BODY, fontSize: 15, color: 'rgba(240,248,255,0.6)', lineHeight: 1.7, margin: '0 0 1.5rem', fontStyle: 'italic' }}>&ldquo;{tm.text}&rdquo;</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #00FFB2, #00D4FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HUD, fontSize: 14, fontWeight: 700, color: '#020408' }}>{tm.avatar}</div>
                  <div>
                    <div style={{ fontFamily: HUD, fontSize: 12, color: '#F0F8FF', letterSpacing: 0.5 }}>{tm.name}</div>
                    <div style={{ fontFamily: BODY, fontSize: 13, color: 'rgba(240,248,255,0.35)' }}>{tm.loc}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── TRACK RECORD ──────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: 'clamp(4rem,7vw,6rem) 2rem', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <Reveal>
          <div style={{ fontFamily: HUD, fontSize: 10, letterSpacing: 4, color: 'rgba(0,255,178,0.5)', marginBottom: 14 }}>{t('trackRecordTitle')}</div>
          <h2 style={{ fontFamily: HUD, fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 900, marginBottom: 16 }}>{t('trackRecordHeadline')}</h2>
          <p style={{ fontFamily: BODY, fontSize: 16, color: 'rgba(240,248,255,0.5)', marginBottom: 36 }}>{t('trackRecordDesc')}</p>
          <a href="/results" className="cta-primary" style={{ fontFamily: HUD, fontSize: 11, letterSpacing: 2, color: '#020408', background: '#00FFB2', padding: '16px 36px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, display: 'inline-block', boxShadow: '0 0 40px rgba(0,255,178,0.2)', transition: 'transform .2s, box-shadow .2s' }}>
            {t('trackRecordCta')}
          </a>
        </Reveal>
      </section>

      {/* ── PRICING ───────────────────────────────────────── */}
      <section id="pricing" style={{ position: 'relative', zIndex: 1, padding: 'clamp(5rem,8vw,7rem) 2rem', background: 'rgba(8,17,31,0.4)' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{ fontFamily: HUD, fontSize: 10, letterSpacing: 4, color: 'rgba(0,255,178,0.5)', marginBottom: 14 }}>{t('pricingTitle')}</div>
              <h2 style={{ fontFamily: HUD, fontSize: 'clamp(26px,4vw,44px)', fontWeight: 900 }}>{t('pricingHeadline')}</h2>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
              <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 4, gap: 4 }}>
                {(['monthly', 'annual'] as const).map(b => (
                  <button key={b} onClick={() => setBilling(b)} style={{
                    fontFamily: HUD, fontSize: 10, letterSpacing: 2, padding: '10px 20px', borderRadius: 8,
                    border: 'none', cursor: 'pointer', transition: 'all .2s',
                    background: billing === b ? '#00FFB2' : 'transparent',
                    color: billing === b ? '#020408' : 'rgba(240,248,255,0.5)',
                    fontWeight: billing === b ? 700 : 400,
                  }}>
                    {b === 'monthly' ? t('billingMonthly') : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {t('billingAnnual')}
                        <span style={{ fontSize: 8, background: billing === 'annual' ? 'rgba(2,4,8,0.2)' : 'rgba(0,255,178,0.15)', color: billing === 'annual' ? '#020408' : '#00FFB2', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>{t('billingSave')}</span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20, alignItems: 'start' }}>
            {PLANS.map((plan, i) => (
              <Reveal key={plan.key} delay={i * 120}>
                <div className="pricing-card" style={{
                  background: plan.highlight ? 'rgba(0,255,178,0.04)' : 'linear-gradient(160deg, rgba(8,17,31,0.9), rgba(2,4,8,0.9))',
                  border: `${plan.highlight ? '2px' : '1px'} solid ${plan.highlight ? 'rgba(0,255,178,0.35)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 18, padding: '2.25rem', position: 'relative', transition: 'transform .3s, box-shadow .3s',
                }}>
                  {plan.highlight && (
                    <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#00FFB2', color: '#020408', fontFamily: HUD, fontSize: 9, letterSpacing: 2, padding: '6px 20px', borderRadius: 100, fontWeight: 900, whiteSpace: 'nowrap' }}>
                      {t('planPopular')}
                    </div>
                  )}
                  <div style={{ fontFamily: HUD, fontSize: 12, letterSpacing: 2, color: plan.color, marginBottom: 10 }}>{plan.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontFamily: HUD, fontSize: 34, fontWeight: 900, color: '#F0F8FF' }}>{plan.price}</span>
                    <span style={{ fontFamily: BODY, fontSize: 14, color: 'rgba(240,248,255,0.4)' }}>{plan.currency}</span>
                  </div>
                  <div style={{ fontFamily: BODY, fontSize: 14, color: plan.color, marginBottom: 28, opacity: 0.8 }}>{plan.credits} · {plan.analyses}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <span style={{ color: plan.color, fontSize: 13, flexShrink: 0, marginTop: 2 }}>✓</span>
                        <span style={{ fontFamily: BODY, fontSize: 15, color: 'rgba(240,248,255,0.6)', lineHeight: 1.4 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <a href="/auth/login" className={plan.highlight ? 'cta-primary' : ''} style={{
                    display: 'block', textAlign: 'center', fontFamily: HUD, fontSize: 10, letterSpacing: 2,
                    textDecoration: 'none', padding: '14px', borderRadius: 10, fontWeight: 700,
                    background: plan.highlight ? '#00FFB2' : 'transparent',
                    color: plan.highlight ? '#020408' : plan.color,
                    border: plan.highlight ? 'none' : `1px solid ${plan.color}30`,
                    transition: 'transform .2s, box-shadow .2s, background .2s',
                  }}>{plan.cta}</a>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAYMENT METHODS ───────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '3.5rem 2rem', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <Reveal>
          <div style={{ fontFamily: HUD, fontSize: 10, letterSpacing: 4, color: 'rgba(240,248,255,0.25)', marginBottom: 28 }}>{t('paymentTitle')}</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {PAYMENT_LOGOS.map(l => (
              <div key={l.alt} style={{ background: l.bg, border: `1px solid ${l.bd}`, borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 100, height: 52 }}>
                <img src={l.src} alt={l.alt} style={{ height: 28, maxWidth: 110, objectFit: 'contain' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24 }}>
            {[`🔒 ${t('paymentSSL')}`, `🏦 ${t('paymentNoData')}`, `↩️ ${t('paymentCancel')}`, `✓ ${t('paymentNoCommit')}`].map(b => (
              <span key={b} style={{ fontFamily: BODY, fontSize: 13, color: 'rgba(240,248,255,0.3)' }}>{b}</span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: 'clamp(4rem,7vw,6rem) 2rem', maxWidth: 720, margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ fontFamily: HUD, fontSize: 10, letterSpacing: 4, color: 'rgba(0,255,178,0.5)', marginBottom: 14 }}>{t('faqTitle')}</div>
            <h2 style={{ fontFamily: HUD, fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 900 }}>{t('faqHeadline')}</h2>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div style={{ background: 'linear-gradient(160deg, rgba(8,17,31,0.6), rgba(2,4,8,0.6))', border: '1px solid rgba(0,255,178,0.06)', borderRadius: 18, padding: 'clamp(1.5rem,3vw,2.5rem)' }}>
            {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </Reveal>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: 'clamp(5rem,9vw,8rem) 2rem', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
        <Reveal>
          <div style={{ position: 'absolute', inset: 0, zIndex: -1, background: 'radial-gradient(ellipse 60% 50% at 50% 60%, rgba(0,255,178,0.06) 0%, transparent 70%)' }} />
          <h2 style={{ fontFamily: HUD, fontSize: 'clamp(28px,5vw,52px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>
            {t('ctaFinalHeadline')}<br />
            <span className="gradient-text">{t('ctaFinalAccent')}</span>
          </h2>
          <p style={{ fontFamily: BODY, fontSize: 17, color: 'rgba(240,248,255,0.45)', marginBottom: 36 }}
             dangerouslySetInnerHTML={{ __html: (t.raw('ctaFinalDesc') as string).replace('{users}', String(users)) }} />
          <a href="/auth/login" className="cta-primary cta-glow" style={{ fontFamily: HUD, fontSize: 13, letterSpacing: 2, color: '#020408', background: '#00FFB2', padding: '20px 52px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, display: 'inline-block', boxShadow: '0 0 60px rgba(0,255,178,0.25), 0 0 120px rgba(0,255,178,0.1)', transition: 'transform .2s, box-shadow .2s' }}>
            {t('ctaFinalButton')}
          </a>
          <p style={{ fontFamily: BODY, fontSize: 14, color: 'rgba(240,248,255,0.25)', marginTop: 18 }}>{t('ctaFinalSub')}</p>
        </Reveal>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '3rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href={`/${locale}`} style={{ textDecoration: 'none' }}>
              <img src="/logos/profityx-logo.png" alt="ProfityX" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
            </a>
            <div style={{ fontFamily: BODY, fontSize: 12, color: 'rgba(240,248,255,0.2)' }}>{t('footerBy')}</div>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[['#pricing', tn('pricing')], ['#how', tn('howItWorks')], ['#features', tn('features')], ['/results', tn('results')], ['/blog', tn('blog')], ['/legal/cgu', t('footerTerms')], ['/legal/confidentialite', t('footerPrivacy')]].map(([href, label]) => (
              <a key={href} href={href} className="footer-link" style={{ fontFamily: BODY, fontSize: 14, color: 'rgba(240,248,255,0.3)', textDecoration: 'none', transition: 'color .2s' }}>{label}</a>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: BODY, fontSize: 13, color: 'rgba(240,248,255,0.25)' }}>🌐</span>
            <a href="/fr" style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 2, textDecoration: 'none', color: locale === 'fr' ? '#00FFB2' : 'rgba(240,248,255,0.35)', background: locale === 'fr' ? 'rgba(0,255,178,0.1)' : 'transparent', border: locale === 'fr' ? '1px solid rgba(0,255,178,0.3)' : '1px solid rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: 6 }}>FR</a>
            <a href="/en" style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 2, textDecoration: 'none', color: locale === 'en' ? '#00D4FF' : 'rgba(240,248,255,0.35)', background: locale === 'en' ? 'rgba(0,212,255,0.1)' : 'transparent', border: locale === 'en' ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: 6 }}>EN</a>
          </div>
        </div>
        <div style={{ fontFamily: BODY, fontSize: 13, color: 'rgba(240,248,255,0.15)', marginTop: 24, textAlign: 'center' }}>
          {t('footerCopy', { year })}
        </div>
      </footer>

      {/* ── STYLES ────────────────────────────────────────── */}
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes orbFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-40px) scale(1.1)} 66%{transform:translate(-20px,20px) scale(0.95)} }
        @keyframes orbFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-40px,30px) scale(1.08)} 70%{transform:translate(25px,-20px) scale(0.92)} }
        @keyframes orbFloat3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-30px,40px) scale(1.15)} }
        @keyframes scrollTicker { 0%{transform:translateX(0)} 100%{transform:translateX(-33.33%)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ctaGlow { 0%,100%{box-shadow:0 0 40px rgba(0,255,178,0.2),0 0 80px rgba(0,255,178,0.08)} 50%{box-shadow:0 0 60px rgba(0,255,178,0.3),0 0 120px rgba(0,255,178,0.12)} }
        * { box-sizing:border-box }
        html { scroll-behavior:smooth }
        .gradient-text { background:linear-gradient(135deg,#00FFB2 0%,#00D4FF 50%,#00FFB2 100%); background-size:200% 100%; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:gradientShift 4s ease-in-out infinite }
        @keyframes gradientShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        .cta-primary:hover { transform:translateY(-2px) !important; box-shadow:0 0 60px rgba(0,255,178,0.35),0 8px 30px rgba(0,255,178,0.2) !important }
        .cta-secondary:hover { background:rgba(255,255,255,0.06) !important; border-color:rgba(255,255,255,0.2) !important }
        .cta-btn:hover { transform:translateY(-1px); box-shadow:0 0 20px rgba(0,255,178,0.2) }
        .cta-glow { animation:ctaGlow 3s ease-in-out infinite }
        .nav-link:hover { color:rgba(240,248,255,0.85) !important }
        .footer-link:hover { color:rgba(240,248,255,0.55) !important }
        .step-card:hover { border-color:rgba(0,255,178,0.2) !important; box-shadow:0 0 30px rgba(0,255,178,0.06) !important }
        .feature-card:hover { border-color:rgba(0,255,178,0.15) !important; transform:translateY(-4px); box-shadow:0 8px 30px rgba(0,0,0,0.3) !important }
        .testimonial-card:hover { border-color:rgba(0,255,178,0.15) !important }
        .pricing-card:hover { transform:translateY(-4px); box-shadow:0 12px 40px rgba(0,0,0,0.3) !important }
        .nav-desktop { display:flex !important }
        .nav-mobile-btn { display:none !important }
        @media (max-width:768px) { .nav-desktop{display:none !important} .nav-mobile-btn{display:flex !important} }
        @media (prefers-reduced-motion:reduce) { .gradient-text{animation:none} .cta-glow{animation:none} }
      `}</style>
    </div>
  )
}
