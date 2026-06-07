// ============================================================
// PROFITYX — Sidebar (drawer mobile via MenuContext)
// Le bouton hamburger est dans TopBar — Sidebar gère le panneau
// ============================================================
'use client'
import { supabasePublic } from '@/lib/supabase'
import { useTheme } from '@/lib/theme'
import { useMenu } from '@/lib/menu-context'

type Tab = 'chart' | 'calendar' | 'history'
interface Props { tab: Tab; setTab: (t: Tab) => void; plan: string; locale: string }

const NAV = [
  { key: 'dashboard',  icon: 'ti-layout-dashboard', fr: 'TABLEAU DE BORD', en: 'DASHBOARD',    href: '/dashboard' },
  { key: 'chart',      icon: 'ti-chart-candle',      fr: 'ANALYSE IA',     en: 'AI ANALYSIS',  href: '/analysis'  },
  { key: 'calendar',   icon: 'ti-news',               fr: 'ANNONCES MACRO', en: 'MACRO NEWS',   href: '/news'      },
  { key: 'history',    icon: 'ti-history',            fr: 'HISTORIQUE',     en: 'HISTORY',      href: '/history'   },
  { key: 'journal',    icon: 'ti-notebook',           fr: 'JOURNAL',        en: 'JOURNAL',      href: '/journal'   },
  { key: 'referral',   icon: 'ti-users-plus',         fr: 'PARRAINAGE',     en: 'REFERRAL',     href: '/referral'  },
] as const

const PLAN_COLORS: Record<string, string> = { free: '#888', pro: '#00B890', elite: '#92671A' }
const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

export default function Sidebar({ plan, locale }: Props) {
  const { open, close } = useMenu()
  const { isDark } = useTheme()

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
          overflowY: 'auto',
          overflowX: 'hidden',
          transition: 'background .3s, border-color .3s, transform .28s cubic-bezier(.4,0,.2,1)',
        }}
      >
        {/* Header du drawer : logo + bouton fermer */}
        <div className="sidebar-logo" style={{ padding: '1.1rem 1rem', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/dashboard" onClick={close} style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: HUD, fontSize: 16, letterSpacing: 3, color: 'var(--ac)', lineHeight: 1 }}>
              PROFIT<span style={{ color: 'var(--ac2)' }}>YX</span>
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
            <span style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 2, color: planColor }}>{plan.toUpperCase()}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '0 0.625rem', flex: 1 }}>
          <div style={{ fontFamily: HUD, fontSize: 7, letterSpacing: 2, color: 'var(--tx3)', padding: '0 8px', marginBottom: 6 }}>MODULES</div>

          {NAV.map(item => {
            const isActive = currentPath === item.href
            const label = locale === 'fr' ? item.fr : item.en
            return (
              <a
                key={item.key}
                href={item.href}
                onClick={close}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
                  background: isActive ? 'color-mix(in srgb, var(--ac) 10%, transparent)' : 'transparent',
                  border: `1px solid ${isActive ? 'color-mix(in srgb, var(--ac) 22%, transparent)' : 'transparent'}`,
                  borderRadius: 6, textDecoration: 'none', marginBottom: 2, position: 'relative',
                  transition: 'background .15s',
                }}
              >
                {isActive && <div style={{ position: 'absolute', left: 0, top: '20%', height: '60%', width: 2, background: 'var(--ac)', borderRadius: '0 2px 2px 0' }} />}
                <i className={`ti ${item.icon}`} style={{ fontSize: 16, color: isActive ? 'var(--ac)' : inactiveColor, flexShrink: 0 }} aria-hidden="true" />
                <span className="sidebar-label" style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 1.5, color: isActive ? 'var(--ac)' : inactiveColor, fontWeight: isActive ? 700 : 400 }}>
                  {label}
                </span>
              </a>
            )
          })}

          <div style={{ height: 1, background: 'var(--bd)', margin: '8px 0' }} />

          {[
            { href: '/pricing',  icon: 'ti-credit-card', fr: 'ABONNEMENT', en: 'SUBSCRIPTION' },
            { href: '/settings', icon: 'ti-settings',    fr: 'PARAMÈTRES',  en: 'SETTINGS' },
            { href: '/support',  icon: 'ti-headset',     fr: 'ASSISTANCE',  en: 'SUPPORT' },
          ].map(l => (
            <a key={l.href} href={l.href} onClick={close} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 5, textDecoration: 'none', marginBottom: 1, transition: 'background .15s' }}>
              <i className={`ti ${l.icon}`} style={{ fontSize: 15, color: subColor, flexShrink: 0 }} aria-hidden="true" />
              <span className="sidebar-label" style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 1.5, color: subColor }}>
                {locale === 'fr' ? l.fr : l.en}
              </span>
            </a>
          ))}
        </nav>

        {/* Footer déconnexion */}
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--bd)' }}>
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
