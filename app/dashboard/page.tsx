// ============================================================
// PROFITYX — /dashboard (Vue d'ensemble)
// ============================================================
'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { supabasePublic } from '@/lib/supabase'
import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'
import QuotaBar from '@/components/dashboard/QuotaBar'
import GamificationBar from '@/components/dashboard/GamificationBar'
import WatchlistFeed from '@/components/dashboard/WatchlistFeed'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

export default function DashboardPage() {
  const [user,    setUser]    = useState<{ id: string; email?: string } | null>(null)
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [plan,    setPlan]    = useState('free')
  const [locale,  setLocale]  = useState('fr')

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabasePublic.auth.getSession()
      if (!session) { window.location.href = '/auth/login'; return }
      setUser(session.user as { id: string; email?: string })
      const { data: p } = await supabasePublic.from('profiles').select('*').eq('id', session.user.id).single()
      if (p) { setProfile(p); setPlan(p.user_plan as string || 'free'); setLocale(p.locale as string || 'fr') }
    })()
  }, [])

  const h = new Date().getHours()
  const greet = locale === 'fr' ? (h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir') : (h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening')
  const name  = (profile?.full_name as string ?? user?.email?.split('@')[0] ?? 'Trader').toUpperCase()
  const planColor: Record<string, string> = { free: '#888', pro: '#00FFB2', elite: '#C9A84C' }
  const pc = planColor[plan] ?? '#888'

  const limits: Record<string, { a: number; n: number }> = { free: { a: 3, n: 5 }, pro: { a: 100, n: 999999 }, elite: { a: 999999, n: 999999 } }
  const lim = limits[plan] ?? limits.free
  const aUsed  = (profile?.analyses_used as number) ?? 0
  const nUsed  = (profile?.news_used as number) ?? 0
  const aLeft  = plan === 'elite' ? '∞' : Math.max(0, lim.a - aUsed).toString()
  const nLeft  = (plan === 'pro' || plan === 'elite') ? '∞' : Math.max(0, lim.n - nUsed).toString()

  const MODULES = [
    { href: '/analysis', icon: 'ti-chart-candle', color: 'var(--ac)', title: locale === 'fr' ? 'ANALYSE CHART' : 'CHART ANALYSIS', desc: locale === 'fr' ? 'TradingView + analyse IA · Signaux SMC pour Pro/Elite' : 'TradingView + AI analysis · SMC signals for Pro/Elite', badge: plan === 'pro' || plan === 'elite' ? 'SMC' : null },
    { href: '/news',     icon: 'ti-news',          color: 'var(--ac2)', title: locale === 'fr' ? 'ANNONCES MACRO' : 'MACRO NEWS',   desc: locale === 'fr' ? 'NFP, CPI, FOMC · Coaching psychologique pour Pro/Elite' : 'NFP, CPI, FOMC · Psychological coaching for Pro/Elite', badge: plan === 'pro' || plan === 'elite' ? 'COACH' : null },
    { href: '/history',  icon: 'ti-history',       color: '#C9A84C', title: locale === 'fr' ? 'HISTORIQUE' : 'HISTORY',          desc: locale === 'fr' ? 'Vos analyses passées et signaux générés' : 'Your past analyses and generated signals', badge: null },
  ]

  return (
    <div className="app-shell">
      <Sidebar tab="chart" setTab={() => {}} plan={plan} locale={locale} />
      <div className="app-main" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg0)', width: '100%', overflow: 'hidden' }}>
        <TopBar locale={locale} profile={profile} />
        <QuotaBar profile={profile} locale={locale} plan={plan} />

        <div className="resp-pad" style={{ padding: '1.25rem 1.5rem', flex: 1, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>

          {/* Bienvenue */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontFamily: BODY, fontSize: 14, color: 'var(--tx2)', letterSpacing: 1 }}>{greet}</div>
              <h1 style={{ fontFamily: HUD, fontSize: "clamp(18px,4vw,26px)", fontWeight: 900, color: "var(--tx0)", letterSpacing: 1 }}>{name}</h1>
            </div>
            {plan === 'free' && (
              <a href="/pricing" style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 2, color: '#020408', background: '#00FFB2', padding: '10px 18px', borderRadius: 4, textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <i className="ti ti-rocket" style={{ fontSize: 14 }} aria-hidden="true" />
                {locale === 'fr' ? 'PASSER PRO' : 'GO PRO'}
              </a>
            )}
          </div>

          {/* Stats rapides */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: '1.25rem' }}>
            {[
              { icon: 'ti-chart-candle', label: locale === 'fr' ? 'Analyses restantes' : 'Analyses left', value: aLeft, color: 'var(--ac)' },
              { icon: 'ti-news',          label: locale === 'fr' ? 'Signaux news' : 'News signals', value: nLeft,  color: 'var(--ac2)' },
              { icon: 'ti-crown',         label: locale === 'fr' ? 'Votre plan' : 'Your plan',    value: plan.toUpperCase(), color: pc },
              { icon: 'ti-bell',          label: locale === 'fr' ? 'Notifications' : 'Alerts',      value: profile?.notifications_push ? (locale === 'fr' ? 'ON' : 'ON') : 'OFF', color: '#FF8800' },
            ].map(c => (
              <div key={c.label} style={{ background: 'var(--bg1)', border: '1px solid var(--bd)', borderRadius: 8, padding: '0.875rem 1rem', position: 'relative', overflow: 'hidden', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 2, background: c.color }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                  <i className={'ti ' + c.icon} style={{ fontSize: 15, color: c.color, flexShrink: 0 }} aria-hidden="true" />
                  <span style={{ fontFamily: HUD, fontSize: 7, letterSpacing: 1, color: 'var(--tx2)', lineHeight: 1.3 }}>{c.label.toUpperCase()}</span>
                </div>
                <div style={{ fontFamily: HUD, fontSize: 20, fontWeight: 900, color: c.color }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Gamification */}
          {user && <GamificationBar userId={user.id} locale={locale} />}

          {/* Modules */}
          <div style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 2, color: 'var(--tx2)', marginBottom: 10 }}>{locale === 'fr' ? 'ACCÈS RAPIDE' : 'QUICK ACCESS'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: '1.25rem' }}>
            {MODULES.map(m => (
              <a key={m.href} href={m.href} style={{ background: 'var(--bg1)', border: `1px solid ${m.color}18`, borderRadius: 10, padding: '1.25rem', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', overflow: 'hidden', transition: 'transform .2s, box-shadow .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${m.color}20` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${m.color}, transparent)` }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: m.color + '12', border: `1px solid ${m.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={'ti ' + m.icon} style={{ fontSize: 22, color: m.color }} aria-hidden="true" />
                  </div>
                  {m.badge && (
                    <span style={{ fontFamily: HUD, fontSize: 7, letterSpacing: 1, color: m.color, background: m.color + '15', border: `1px solid ${m.color}30`, borderRadius: 2, padding: '3px 8px' }}>{m.badge}</span>
                  )}
                </div>
                <div>
                  <div style={{ fontFamily: HUD, fontSize: 12, color: 'var(--tx0)', letterSpacing: 1, marginBottom: 5 }}>{m.title}</div>
                  <div style={{ fontFamily: BODY, fontSize: 13, color: 'var(--tx2)', lineHeight: 1.5 }}>{m.desc}</div>
                </div>
                <div style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 2, color: m.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {locale === 'fr' ? 'ACCÉDER' : 'GO'} <i className="ti ti-arrow-right" style={{ fontSize: 13 }} aria-hidden="true" />
                </div>
              </a>
            ))}
          </div>

          {/* Watchlist + Feed */}
          {user && <WatchlistFeed userId={user.id} locale={locale} />}
        </div>

      {/* Footer légal */}
      <footer className="app-footer">
        <a href="/legal/cgu">CGU</a>
        <span style={{color:"var(--tx3)"}}>·</span>
        <a href="/legal/confidentialite">Confidentialité</a>
        <span style={{color:"var(--tx3)"}}>·</span>
        <a href="/legal/mentions">Mentions légales</a>
        <span style={{color:"var(--tx3)"}}>·</span>
        <a href="/support">Assistance</a>
      </footer>
          </div>
    </div>
  )
}
