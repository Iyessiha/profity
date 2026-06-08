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
import MarketClocks from '@/components/dashboard/MarketClocks'
import ReferralCard from '@/components/dashboard/ReferralCard'
import AlertsPanel from '@/components/dashboard/AlertsPanel'
import TradingJournal from '@/components/dashboard/TradingJournal'
import PopupManager, { usePopups } from '@/components/PopupManager'
import lazyLoad from 'next/dynamic'
import Leaderboard from '@/components/dashboard/Leaderboard'
import { SkeletonDashboard } from '@/components/Skeleton'
import { useRealtimeSync } from '@/lib/useRealtime'
import Onboarding from '@/components/Onboarding'
import StreakToast from '@/components/StreakToast'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

export default function DashboardPage() {
  const [token,   setToken]   = useState('')
  const [user,    setUser]    = useState<{ id: string; email?: string } | null>(null)
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [plan,    setPlan]    = useState('free')
  const [loading, setLoading] = useState(true)
  const [locale,  setLocale]  = useState('fr')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [streakReward, setStreakReward] = useState<{ streak:number; reward:number; milestone:number } | null>(null)

  // Sync temps réel : crédits + profil
  useRealtimeSync({
    userId: user?.id ?? '',
    onProfileChange: (p) => setProfile(prev => prev ? { ...prev, ...p } : p),
    onActivityChange: () => {
      // Recharger le profil si analyses_used change
      if (user) supabasePublic.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => { if (data) setProfile(data) })
    },
  })

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabasePublic.auth.getSession()
      if (!session) { window.location.href = '/auth/login'; return }
      setUser(session.user as { id: string; email?: string })
      setToken(session.access_token)
      const { data: p } = await supabasePublic.from('profiles').select('*').eq('id', session.user.id).single()
      if (p) {
        setProfile(p)
        setPlan(p.user_plan as string || 'free')
        setLocale(p.locale as string || 'fr')
        if (!p.onboarding_done) setShowOnboarding(true)
      }
      setLoading(false)

      // Mettre à jour le streak + vérifier les récompenses
      try {
        const sr = await fetch('/api/streak', { method:'POST', headers:{ Authorization:`Bearer ${session.access_token}` } })
        const sj = await sr.json()
        if (sj.success && sj.updated && sj.milestone > 0 && sj.reward > 0) {
          setStreakReward({ streak: sj.streak, reward: sj.reward, milestone: sj.milestone })
        }
        // Toast de bienvenue si connexion du jour
        if (sj.success && sj.updated) {
          const firstName = p?.full_name ? (p.full_name as string).split(' ')[0] : 'Trader'
          const streak = sj.streak || 1
          setTimeout(() => {
            const div = document.createElement('div')
            div.style.cssText = `position:fixed;top:70px;left:50%;transform:translateX(-50%);z-index:9998;background:linear-gradient(135deg,#0A1628,#060B14);border:1px solid rgba(0,255,178,0.2);border-radius:10px;padding:12px 20px;font-family:'Orbitron',monospace;font-size:10px;color:#00FFB2;letter-spacing:1px;box-shadow:0 8px 32px rgba(0,0,0,0.5);white-space:nowrap;animation:slideDown .3s ease`
            div.innerHTML = `👋 Bonjour ${firstName} &nbsp;·&nbsp; 🔥 ${streak} jour${streak>1?'s':''} de streak`
            div.style.animation = 'none'
            document.body.appendChild(div)
            setTimeout(() => div.remove(), 3500)
          }, 800)
        }
      } catch {}
    })()
  }, [])

  const h = new Date().getHours()
  const greet = locale === 'fr' ? (h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir') : (h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening')
  const name  = (profile?.full_name as string ?? user?.email?.split('@')[0] ?? 'Trader').toUpperCase()
  const planColor: Record<string, string> = { free: '#888', pro: 'var(--ac)', elite: 'var(--ac3)' }
  const pc = planColor[plan] ?? '#888'

  const limits: Record<string, { a: number; n: number }> = { free: { a: 3, n: 5 }, pro: { a: 100, n: 999999 }, elite: { a: 999999, n: 999999 } }
  const lim = limits[plan] ?? limits.free
  const aUsed  = (profile?.analyses_used as number) ?? 0
  const nUsed  = (profile?.news_used as number) ?? 0
  const aLeft  = plan === 'elite' ? '∞' : Math.max(0, lim.a - aUsed).toString()
  const nLeft  = (plan === 'pro' || plan === 'elite') ? '∞' : Math.max(0, lim.n - nUsed).toString()

  // ── Popups stratégiques ────────────────────────────────────
  const { popup: activePopup, close: closePopup } = usePopups({
    plan, credits: balance, analysisCount: aUsed, locale,
  })

  const MODULES = [
    { href: '/analysis', icon: 'ti-chart-candle', color: 'var(--ac)', title: locale === 'fr' ? 'ANALYSE CHART' : 'CHART ANALYSIS', desc: locale === 'fr' ? 'TradingView + analyse IA · Signaux SMC pour Pro/Elite' : 'TradingView + AI analysis · SMC signals for Pro/Elite', badge: plan === 'pro' || plan === 'elite' ? 'SMC' : null },
    { href: '/news',     icon: 'ti-news',          color: 'var(--ac2)', title: locale === 'fr' ? 'ANNONCES MACRO' : 'MACRO NEWS',   desc: locale === 'fr' ? 'NFP, CPI, FOMC · Coaching psychologique pour Pro/Elite' : 'NFP, CPI, FOMC · Psychological coaching for Pro/Elite', badge: plan === 'pro' || plan === 'elite' ? 'COACH' : null },
    { href: '/history',  icon: 'ti-history',       color: 'var(--ac3)', title: locale === 'fr' ? 'HISTORIQUE' : 'HISTORY',          desc: locale === 'fr' ? 'Vos analyses passées et signaux générés' : 'Your past analyses and generated signals', badge: null },
  ]

  return (
    <div className="app-shell">
      {/* Onboarding au premier login */}
      {showOnboarding && user && (
        <Onboarding
          userId={user.id}
          name={(profile?.full_name as string)?.split(' ')[0] || 'Trader'}
          credits={10}
          onDone={() => setShowOnboarding(false)}
        />
      )}

      {/* Toast récompense streak */}
      {streakReward && (
        <StreakToast
          streak={streakReward.streak}
          reward={streakReward.reward}
          milestone={streakReward.milestone}
          onClose={() => setStreakReward(null)}
        />
      )}
      <Sidebar tab="chart" setTab={() => {}} plan={plan} locale={locale} />
      <div className="app-main" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg0)', width: '100%', overflow: 'hidden' }}>
        <TopBar locale={locale} profile={profile} />
        <QuotaBar token={token} locale={locale} plan={plan} />

        <div className="resp-pad" style={{ padding: '1.25rem 1.5rem', flex: 1, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>

          {loading ? <SkeletonDashboard /> : (<>
          {/* Bienvenue */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontFamily: BODY, fontSize: 14, color: 'var(--tx2)', letterSpacing: 1 }}>{greet}</div>
              <h1 style={{ fontFamily: HUD, fontSize: "clamp(18px,4vw,26px)", fontWeight: 900, color: "var(--tx0)", letterSpacing: 1 }}>{name}</h1>
            </div>
            {plan === 'free' && (
              <a href="/pricing" style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 2, color: '#020408', background: 'var(--ac)', padding: '10px 18px', borderRadius: 4, textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <i className="ti ti-rocket" style={{ fontSize: 14 }} aria-hidden="true" />
                {locale === 'fr' ? 'PASSER PRO' : 'GO PRO'}
              </a>
            )}
          </div>

          {/* Stats rapides */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: '1.25rem' }}>
            {[
              { icon: 'ti-chart-candle', label: locale === 'fr' ? 'ANALYSES' : 'ANALYSES', value: aLeft, color: 'var(--ac)',  sub: locale==='fr'?'restantes':'left' },
              { icon: 'ti-news',          label: 'SIGNAUX NEWS',                               value: nLeft,  color: 'var(--ac)', sub: locale==='fr'?'disponibles':'available' },
              { icon: 'ti-crown',         label: locale === 'fr' ? 'VOTRE PLAN' : 'YOUR PLAN', value: (plan ?? 'free').toUpperCase(), color: pc, sub: '' },
              { icon: 'ti-bell',          label: locale === 'fr' ? 'ALERTES' : 'ALERTS',        value: profile?.notifications_push ? 'ON' : 'OFF', color: profile?.notifications_push ? 'var(--ok)' : 'var(--tx3)', sub: '' },
            ].map(c => (
              <div key={c.label} style={{ background: 'var(--bg1)', border: '1px solid var(--bd)', borderRadius: 8, padding: '0.875rem 1rem', position: 'relative', overflow: 'hidden', boxSizing: 'border-box' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: c.color, opacity: 0.7 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <i className={'ti ' + c.icon} style={{ fontSize: 14, color: c.color }} />
                  <span style={{ fontFamily: HUD, fontSize: 7, letterSpacing: 1, color: 'var(--tx3)' }}>{c.label}</span>
                </div>
                <div style={{ fontFamily: HUD, fontSize: 22, fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.value}</div>
                {c.sub && <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: 'var(--tx3)', marginTop: 3 }}>{c.sub}</div>}
              </div>
            ))}
          </div>

          {/* Gamification */}
          {user && <GamificationBar userId={user.id} locale={locale} />}

          {/* Accès Rapide — en premier pour navigation immédiate */}
          <div style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 2, color: 'var(--tx2)', marginBottom: 10 }}>{locale === 'fr' ? 'ACCÈS RAPIDE' : 'QUICK ACCESS'}</div>
          <div className="dash-modules" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: '1.25rem' }}>
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

          {/* Horloges des marchés mondiaux */}
          <MarketClocks locale={locale} />

          {/* Parrainage + Alertes */}
          <div className="dash-two-col" style={{ display:'grid', gridTemplateColumns:'1fr', gap:0 }}>
            {token && <ReferralCard token={token} />}
            {token && <AlertsPanel token={token} plan={plan} />}
          </div>

          {/* Journal + Classement */}
          <div className="dash-two-col" style={{ display:'grid', gridTemplateColumns:'1fr', gap:0 }}>
            {token && <TradingJournal token={token} />}
            <Leaderboard currentUserId={user?.id} />
          </div>

          {/* Watchlist + Feed */}
          {user && <WatchlistFeed userId={user.id} locale={locale} />}
          </>)}

          </div>{/* fin maxWidth 1100 */}
        </div>{/* fin resp-pad */}

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
      </div>{/* fin app-main */}

      {/* Popups stratégiques */}
      <PopupManager popup={activePopup} onClose={closePopup} locale={locale} plan={plan} />
    </div>
  )
}
