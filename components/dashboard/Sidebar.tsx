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
      { key: 'propfirm',   icon: 'ti-building-bank', fr: 'PROP FIRM', en: 'PROP FIRM',   href: '/propfirm',    badge: 'ELITE' },
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

  // ── Couleurs sidebar premium ────────────────────────────────
  const planColor     = PLAN_COLORS[plan] ?? '#888'
  const currentPath   = typeof window !== 'undefined' ? window.location.pathname : ''
  // Fond sidebar légèrement différencié
  const sidebarBg     = isDark ? '#0C1628'     : '#FFFFFF'
  const sidebarBorder = isDark ? 'rgba(0,255,178,0.08)' : '#E5E7EB'
  // Labels de groupe
  const groupColor    = isDark ? 'rgba(0,255,178,0.5)' : '#9CA3AF'
  // Items inactifs — bien lisibles
  const inactiveColor = isDark ? 'rgba(220,235,255,0.75)' : '#374151'
  const inactiveBg    = isDark ? 'transparent'           : 'transparent'
  // Item actif
  const activeBg      = isDark ? 'rgba(0,255,178,0.1)'  : 'rgba(0,166,81,0.08)'
  const activeBorder  = isDark ? 'rgba(0,255,178,0.2)'  : 'rgba(0,166,81,0.2)'
  const activeColor   = isDark ? '#00FFB2'               : '#00A651'
  // Séparateurs
  const divider       = isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6'
  // Déconnexion
  const logoutColor   = isDark ? 'rgba(220,235,255,0.4)' : '#9CA3AF'

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
          background: sidebarBg,
          borderRight: `1px solid ${sidebarBorder}`,
          boxShadow: isDark ? '4px 0 24px rgba(0,0,0,0.4)' : '4px 0 16px rgba(0,0,0,0.06)',
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
        {/* Header : logo + bouton fermer */}
        <div className="sidebar-logo" style={{
          padding: '1.1rem 1rem',
          borderBottom: `1px solid ${divider}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <a href="/dashboard" onClick={close} style={{ textDecoration: 'none' }}>
            <img src="/logos/profityx-logo.png" alt="ProfityX"
              style={{ height:30, width:'auto', objectFit:'contain' }} />
            <div style={{ fontFamily: BODY, fontSize: 9, color: groupColor, letterSpacing: 2, marginTop: 3 }}>
              AI TRADING
            </div>
          </a>
          <button
            className="mobile-only"
            onClick={close}
            aria-label="Fermer le menu"
            style={{
              background: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
              border: 'none', borderRadius: 8,
              color: inactiveColor, cursor: 'pointer',
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <i className="ti ti-x" style={{ fontSize: 16 }} aria-hidden="true" />
          </button>
        </div>

        {/* Plan badge */}
        <div style={{ padding: '0.75rem 1rem' }}>
          <div style={{
            background: planColor + '18',
            border: `1px solid ${planColor}35`,
            borderRadius: 8, padding: '7px 12px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: planColor, boxShadow: `0 0 6px ${planColor}` }} />
            <span style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 2, color: planColor, fontWeight: 700 }}>
              {(plan ?? 'free').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Navigation groupée */}
        <nav style={{ padding: '0 0.625rem', flex: 1, paddingBottom: '0.5rem' }}>
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.labelFr} style={{ marginBottom: gi < NAV_GROUPS.length - 1 ? 4 : 0 }}>

              {/* Label de groupe */}
              <div style={{
                fontFamily: HUD, fontSize: 7, letterSpacing: 2.5,
                color: groupColor, padding: '12px 10px 5px',
                textTransform: 'uppercase',
              }}>
                {locale === 'fr' ? group.labelFr : group.labelEn}
              </div>

              {/* Items */}
              {group.items.map(item => {
                const isActive = currentPath === item.href
                const label    = locale === 'fr' ? item.fr : item.en
                return (
                  <a key={item.key} href={item.href} onClick={() => {
                    close()
                    if (item.key === 'chart') {
                      try { localStorage.setItem(ANALYSIS_BADGE_KEY, '1') } catch {}
                      setChartBadge(false)
                    }
                  }} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px',
                    background: isActive ? activeBg : inactiveBg,
                    border: `1px solid ${isActive ? activeBorder : 'transparent'}`,
                    borderRadius: 8, textDecoration: 'none', marginBottom: 2,
                    position: 'relative', transition: 'all .15s',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB'
                  }}
                  onMouseLeave={e => {
                    if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                  }}
                  >
                    {/* Barre active */}
                    {isActive && (
                      <div style={{ position: 'absolute', left: 0, top: '18%', height: '64%', width: 3, background: activeColor, borderRadius: '0 3px 3px 0' }} />
                    )}
                    <i className={`ti ${item.icon}`} style={{
                      fontSize: 17, flexShrink: 0,
                      color: isActive ? activeColor : inactiveColor,
                    }} aria-hidden="true" />
                    <span className="sidebar-label" style={{
                      fontFamily: HUD, fontSize: 9, letterSpacing: 1.5, flex: 1,
                      color: isActive ? activeColor : inactiveColor,
                      fontWeight: isActive ? 700 : 500,
                    }}>
                      {label}
                    </span>

                    {/* Badges */}
                    {(item.key === 'chart' ? chartBadge : item.badge) && (() => {
                      const txt = item.key === 'chart' ? 'NEW' : item.badge as string
                      const styles: Record<string, React.CSSProperties> = {
                        NEW:     { background: '#00FFB2', color: '#051A0F', fontWeight: 800 },
                        LIVE:    { background: '#FF6B35', color: '#fff' },
                        PRO:     { background: 'rgba(201,168,76,0.2)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.45)' },
                        ELITE:   { background: 'linear-gradient(135deg,rgba(201,168,76,0.28),rgba(255,200,80,0.12))', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.55)' },
                        '+20 CR':{ background: 'rgba(0,212,255,0.14)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.4)' },
                      }
                      const s = styles[txt] ?? { background: activeColor, color: '#020408' }
                      return (
                        <span className="sidebar-label" style={{
                          fontFamily: HUD, fontSize: 6, letterSpacing: 1,
                          borderRadius: 4, padding: '3px 7px', fontWeight: 700, flexShrink: 0,
                          ...s,
                        }}>
                          {txt}
                        </span>
                      )
                    })()}
                  </a>
                )
              })}

              {/* Séparateur */}
              {gi < NAV_GROUPS.length - 1 && (
                <div style={{ height: 1, background: divider, margin: '6px 6px' }} />
              )}
            </div>
          ))}
        </nav>

        {/* Footer : langue + déconnexion */}
        <div style={{ padding: '0.75rem 1rem', borderTop: `1px solid ${divider}` }}>

          {/* Sélecteur langue — mobile uniquement */}
          <div className="mobile-only" style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
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
                padding: '10px 0', borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${locale === l ? activeBorder : divider}`,
                background: locale === l ? activeBg : 'transparent',
                color: locale === l ? activeColor : inactiveColor,
                fontWeight: locale === l ? 700 : 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all .15s',
              }}>
                <span style={{ fontSize: 15 }}>{l === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '8px 6px', width: '100%', borderRadius: 6,
            transition: 'background .15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(255,58,92,0.08)' : '#FEF2F2')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <i className="ti ti-logout" style={{ fontSize: 15, color: logoutColor, flexShrink: 0 }} aria-hidden="true" />
            <span className="sidebar-label" style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 2, color: logoutColor }}>
              {locale === 'fr' ? 'DÉCONNEXION' : 'LOGOUT'}
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}
