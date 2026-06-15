// ============================================================
// PROFITYX — Sidebar (drawer mobile via MenuContext)
// ============================================================
'use client'
import { useState, useEffect } from 'react'
import { supabasePublic } from '@/lib/supabase'
import { useTheme } from '@/lib/theme'
import { useMenu } from '@/lib/menu-context'

type Tab = 'chart' | 'calendar' | 'history'
interface Props { tab: Tab; setTab: (t: Tab) => void; plan: string; locale: string }

// ── 3 groupes logiques ───────────────────────────────────────
// Clé localStorage — changer la valeur force le badge à réapparaître pour tous les users
const ANALYSIS_BADGE_KEY = 'px_seen_chart_v2'

const NAV_GROUPS: {
  labelFr: string; labelEn: string
  items: { key: string; icon: string; fr: string; en: string; href: string; badge: string | null }[]
}[] = [
  {
    labelFr: 'TRADING',
    labelEn: 'TRADING',
    items: [
      { key: 'dashboard', icon: 'ti-layout-dashboard', fr: 'TABLEAU DE BORD', en: 'DASHBOARD',    href: '/dashboard', badge: null  },
      { key: 'chart',     icon: 'ti-chart-candle',     fr: 'ANALYSE IA',     en: 'AI ANALYSIS',  href: '/analysis',  badge: 'NEW' },
      { key: 'calendar',  icon: 'ti-news',             fr: 'ANNONCES MACRO', en: 'MACRO NEWS',   href: '/news',      badge: 'LIVE' },
      { key: 'history',   icon: 'ti-history',          fr: 'HISTORIQUE',     en: 'HISTORY',      href: '/history',   badge: null  },
    ],
  },
  {
    labelFr: 'OUTILS',
    labelEn: 'TOOLS',
    items: [
      { key: 'journal',    icon: 'ti-notebook',    fr: 'JOURNAL',     en: 'JOURNAL',     href: '/journal',     badge: 'NEW' },
      { key: 'calculator', icon: 'ti-calculator',  fr: 'CALCULATEUR', en: 'CALCULATOR',  href: '/calculator',  badge: 'PRO'  },
    ],
  },
  {
    labelFr: 'COMPTE',
    labelEn: 'ACCOUNT',
    items: [
      { key: 'referral',   icon: 'ti-users-plus',  fr: 'PARRAINAGE',   en: 'REFERRAL',     href: '/referral',  badge: '+20 CR' },
      { key: 'pricing',    icon: 'ti-credit-card', fr: 'ABONNEMENT',   en: 'SUBSCRIPTION', href: '/pricing',   badge: null },
      { key: 'settings',   icon: 'ti-settings',    fr: 'PARAMÈTRES',   en: 'SETTINGS',     href: '/settings',  badge: null },
      { key: 'support',    icon: 'ti-headset',     fr: 'ASSISTANCE',   en: 'SUPPORT',      href: '/support',   badge: null },
    ],
  },
] 

const PLAN_COLORS: Record<string, string> = { free: '#888', pro: '#00B890', elite: '#92671A' }
const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

export default function Sidebar({ plan, locale }: Props) {
  const { open, close } = useMenu()
  const { isDark } = useTheme()

  // Badge NEW sur ANALYSE IA — disparaît après la première visite
  const [chartBadge, setChartBadge] = useState(false)
  useEffect(() => {
    try {
      if (!localStorage.getItem(ANALYSIS_BADGE_KEY)) setChartBadge(true)
    } catch {}
    // Si on est déjà sur /analysis, marquer comme vu
    if (typeof window !== 'undefined' && window.location.pathname === '/analysis') {
      try { localStorage.setItem(ANALYSIS_BADGE_KEY, '1') } catch {}
      setChartBadge(false)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await supabasePublic.auth.signOut()
    } catch (_) {
      // Ignorer les erreurs — on force la déconnexion quoi qu'il arrive
    }
    // Nettoyer le storage manuellement (garantit la déco même si signOut échoue)
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.includes('supabase') || k.includes('sb-') || k.includes('pxTheme') === false && k.includes('auth')) {
          if (k.includes('supabase') || k.includes('sb-')) localStorage.removeItem(k)
        }
      })
    } catch (_) {}
    // Redirection forcée — replace empêche le retour arrière
    window.location.replace('/auth/login')
  }

  const planColor     = PLAN_COLORS[plan] ?? '#888'
  const currentPath   = typeof window !== 'undefined' ? window.location.pathname : ''
  const inactiveColor = isDark ? 'rgba(232,244,248,0.4)' : 'rgba(15,23,42,0.5)'
  const subColor      = isDark ? 'rgba(232,244,248,0.25)' : 'rgba(15,23,42,0.35)'

  return (
    <>
      {/* Overlay sombre (mobile) */}
      <div
        className={`drawer-overlay${open ? ' show' : ''}`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Panneau drawer */}
      <aside
        className={`app-sidebar${open ? ' drawer-open' : ''}`}
        style={{
          background: 'var(--bg1)',
          borderRight: '1px solid var(--bd)',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          minHeight: '100%',
          alignSelf: 'stretch',
          overflowY: 'auto',
          overflowX: 'hidden',
          transition: 'background .3s, border-color .3s, transform .28s cubic-bezier(.4,0,.2,1)',
        }}
      >
        {/* Header du drawer : logo + bouton fermer */}
        <div className="sidebar-logo" style={{ padding: '1.1rem 1rem', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/dashboard" onClick={close} style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: HUD, fontSize: 16, letterSpacing: 3, color: 'var(--ac)', lineHeight: 1 }}>
              <img src="/logos/profityx-logo.png" alt="ProfityX" style={{ height:32, width:'auto', objectFit:'contain' }} />
            </div>
            <div style={{ fontFamily: BODY, fontSize: 9, color: 'var(--tx3)', letterSpacing: 2, marginTop: 2 }}>AI TRADING</div>
          </a>
          {/* Fermer — visible seulement quand le drawer est ouvert (mobile) */}
          <button
            className="mobile-only"
            onClick={close}
            aria-label="Fermer le menu"
            style={{ background: 'transparent', border: 'none', color: 'var(--tx2)', cursor: 'pointer', fontSize: 20, padding: 0, lineHeight: 1 }}
          >
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        {/* Plan badge */}
        <div style={{ padding: '0.75rem 1rem' }}>
          <div style={{ background: planColor + '15', border: `1px solid ${planColor}30`, borderRadius: 6, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: planColor }} />
            <span style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 2, color: planColor }}>{(plan ?? 'free').toUpperCase()}</span>
          </div>
        </div>

        {/* Navigation groupée */}
        <nav style={{ padding: '0 0.625rem', flex: 1, paddingBottom: '0.5rem' }}>
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.labelFr} style={{ marginBottom: gi < NAV_GROUPS.length - 1 ? 4 : 0 }}>
              {/* Label de groupe */}
              <div style={{
                fontFamily: HUD, fontSize: 7, letterSpacing: 2,
                color: 'var(--tx3)', padding: '10px 8px 4px',
              }}>
                {locale === 'fr' ? group.labelFr : group.labelEn}
              </div>

              {/* Items du groupe */}
              {group.items.map(item => {
                const isActive = currentPath === item.href
                const label    = locale === 'fr' ? item.fr : item.en
                return (
                  <a key={item.key} href={item.href} onClick={() => {
                    close()
                    // Marquer ANALYSE IA comme vu au premier clic
                    if (item.key === 'chart') {
                      try { localStorage.setItem(ANALYSIS_BADGE_KEY, '1') } catch {}
                      setChartBadge(false)
                    }
                  }} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px',
                    background: isActive ? 'color-mix(in srgb, var(--ac) 10%, transparent)' : 'transparent',
                    border: `1px solid ${isActive ? 'color-mix(in srgb, var(--ac) 22%, transparent)' : 'transparent'}`,
                    borderRadius: 6, textDecoration: 'none', marginBottom: 2,
                    position: 'relative', transition: 'background .15s',
                  }}>
                    {isActive && (
                      <div style={{ position: 'absolute', left: 0, top: '20%', height: '60%', width: 2, background: 'var(--ac)', borderRadius: '0 2px 2px 0' }} />
                    )}
                    <i className={`ti ${item.icon}`} style={{ fontSize: 16, color: isActive ? 'var(--ac)' : inactiveColor, flexShrink: 0 }} aria-hidden="true" />
                    <span className="sidebar-label" style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 1.5, color: isActive ? 'var(--ac)' : inactiveColor, fontWeight: isActive ? 700 : 400, flex: 1 }}>
                      {label}
                    </span>
                    {(item.key === 'chart' ? chartBadge : item.badge) && (() => {
                      const txt = item.key === 'chart' ? 'NEW' : item.badge as string
                      const styles: Record<string, React.CSSProperties> = {
                        NEW:    { background: '#00FFB2', color: '#020408', animation: 'px-pulse 2s ease-in-out infinite' },
                        LIVE:   { background: '#FF6B35', color: '#fff' },
                        PRO:    { background: 'rgba(201,168,76,0.18)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.4)' },
                        '+20 CR': { background: 'rgba(0,212,255,0.12)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.35)' },
                      }
                      const s = styles[txt] ?? { background: 'var(--ac2)', color: '#020408' }
                      return (
                        <span className="sidebar-label" style={{
                          fontFamily: HUD, fontSize: 6, letterSpacing: 1,
                          borderRadius: 3, padding: '2px 5px', fontWeight: 700, flexShrink: 0,
                          ...s,
                        }}>
                          {txt}
                        </span>
                      )
                    })()}
                  </a>
                )
              })}

              {/* Séparateur entre groupes */}
              {gi < NAV_GROUPS.length - 1 && (
                <div style={{ height: 1, background: 'var(--bd)', margin: '6px 4px' }} />
              )}
            </div>
          ))}
        </nav>

        {/* Footer : sélecteur langue (mobile) + déconnexion */}
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--bd)' }}>

          {/* Sélecteur langue — visible uniquement en mode drawer (mobile) */}
          <div className="mobile-only" style={{
            display: 'flex', gap: 6, marginBottom: 10,
          }}>
            {(['fr', 'en'] as const).map(l => (
              <button key={l} onClick={async () => {
                try {
                  localStorage.setItem('pxLang', l)
                  const { supabasePublic } = await import('@/lib/supabase')
                  const { data: { session } } = await supabasePublic.auth.getSession()
                  if (session) await supabasePublic.from('profiles').update({ locale: l }).eq('id', session.user.id)
                } catch {}
                window.location.reload()
              }} style={{
                flex: 1, fontFamily: HUD, fontSize: 9, letterSpacing: 2,
                padding: '9px 0', borderRadius: 6, cursor: 'pointer',
                border: `1px solid ${locale === l ? 'rgba(0,255,178,0.4)' : 'rgba(255,255,255,0.08)'}`,
                background: locale === l ? 'rgba(0,255,178,0.1)' : 'transparent',
                color: locale === l ? '#00FFB2' : 'rgba(232,244,248,0.35)',
                fontWeight: locale === l ? 700 : 400,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}>
                <span style={{ fontSize: 14 }}>{l === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', width: '100%' }}>
            <i className="ti ti-logout" style={{ fontSize: 14, color: subColor, flexShrink: 0 }} aria-hidden="true" />
            <span className="sidebar-label" style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 2, color: subColor }}>
              {locale === 'fr' ? 'DÉCONNEXION' : 'LOGOUT'}
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}
