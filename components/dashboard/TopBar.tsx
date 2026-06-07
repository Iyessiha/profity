'use client'
import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@/lib/theme'
import { useMenu } from '@/lib/menu-context'
import { supabasePublic } from '@/lib/supabase'
import NotificationBell from '@/components/dashboard/NotificationBell'
import CreditBalance from '@/components/dashboard/CreditBalance'

interface TopBarProps {
  user?: { email?: string; id: string } | null
  profile: Record<string, unknown> | null
  locale: string
  currency?: string
}

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

export default function TopBar({ user, profile, locale, currency = 'XOF' }: TopBarProps) {
  const { theme, toggleTheme } = useTheme()
  const { toggle } = useMenu()
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setDate(now.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [locale])

  const name = (profile?.full_name as string) ?? (user?.email?.split('@')[0]) ?? 'Trader'
  const plan = (profile?.user_plan as string) ?? 'free'
  const [token, setToken] = useState('')

  useEffect(() => {
    supabasePublic.auth.getSession().then(({ data }) => {
      if (data.session) setToken(data.session.access_token)
    })
  }, [])

  return (
    <header style={{
      background: 'var(--bg1)', borderBottom: '1px solid var(--bd)',
      padding: '0 1rem', height: 56, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50,
      transition: 'background .3s, border-color .3s', gap: 8,
    }}>
      {/* Gauche : hamburger (mobile) + horloge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {/* Hamburger — DANS le header, PAS fixed */}
        <button
          className="hamburger-btn"
          onClick={toggle}
          aria-label="Menu"
          style={{
            position: 'static',       /* ← clé : dans le flux normal */
            flexShrink: 0,
          }}
        >
          <i className="ti ti-menu-2" style={{ fontSize: 18 }} aria-hidden="true" />
        </button>

        {/* Horloge */}
        <div className="topbar-clock" style={{ fontFamily: HUD, color: 'var(--ac)', letterSpacing: 2, flexShrink: 0 }}>{time}</div>
        <div className="topbar-hide" style={{ width: 1, height: 16, background: 'var(--bd1)', flexShrink: 0 }} />
        <div className="topbar-hide" style={{ fontFamily: BODY, fontSize: 12, color: 'var(--tx2)', letterSpacing: 1, textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{date}</div>
      </div>

      {/* Droite : devise + toggle thème + profil */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Marché ouvert (caché sur mobile) */}
        <div className="topbar-hide" style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)', borderRadius: 3, padding: '4px 8px' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--ok)' }} />
          <span style={{ fontFamily: HUD, fontSize: 7, color: 'var(--ok)', letterSpacing: 1.5 }}>
            {locale === 'fr' ? 'MARCHÉ OUVERT' : 'MARKET OPEN'}
          </span>
        </div>

        {/* Devise — cachée sur petits écrans */}
        <div className="topbar-hide" style={{ fontFamily: HUD, fontSize: 9, color: 'var(--ac2)', background: 'color-mix(in srgb, var(--ac2) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--ac2) 18%, transparent)', borderRadius: 3, padding: '4px 8px', letterSpacing: 1, flexShrink: 0 }}>
          {currency}
        </div>

        {/* Crédits */}
        {token && <CreditBalance token={token} locale={locale} />}

        {/* Notifications */}
        {token && <NotificationBell token={token} />}

        {/* Toggle thème */}
        <button onClick={toggleTheme} title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          style={{ width: 34, height: 34, borderRadius: 7, border: '1px solid var(--bd1)', background: 'var(--bg2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme === 'dark' ? 'var(--ac3)' : '#0EA5E9', flexShrink: 0 }}>
          <i className={'ti ' + (theme === 'dark' ? 'ti-sun' : 'ti-moon')} style={{ fontSize: 15 }} aria-hidden="true" />
        </button>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: 'color-mix(in srgb, var(--ac) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--ac) 25%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HUD, fontSize: 10, color: 'var(--ac)', fontWeight: 700 }}>
            {name[0]?.toUpperCase() ?? 'T'}
          </div>
          <div className="topbar-name" style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: HUD, fontSize: 9, color: 'var(--tx0)', letterSpacing: 1, whiteSpace: 'nowrap', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis' }}>{(name ?? '').toUpperCase()}</span>
            <span style={{ fontFamily: BODY, fontSize: 10, color: 'var(--tx3)' }}>{(plan ?? 'free').toUpperCase()}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

/* ── CreditBar : remplace l'ancienne QuotaBar ─────────────── */
interface CreditBarProps { token: string; plan: string; locale: string }

export function QuotaBar({ token, plan, locale }: CreditBarProps) {
  const [balance, setBalance] = useState<number | null>(null)
  const [total,   setTotal]   = useState<number>(0)
  const HUD = "'Orbitron', monospace"
  const BODY = "'Rajdhani', sans-serif"

  const refresh = useCallback(() => {
    if (!token) return
    fetch('/api/credits', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(j => { if (j.success) { setBalance(j.balance); setTotal(j.earned) } })
      .catch(() => {})
  }, [token])

  useEffect(() => {
    refresh()
    // Écouter les mises à jour de crédits depuis l'analyse
    window.addEventListener('creditUpdate', refresh)
    // Polling léger toutes les 60s
    const id = setInterval(refresh, 60_000)
    return () => { window.removeEventListener('creditUpdate', refresh); clearInterval(id) }
  }, [refresh])

  if (balance === null) return null

  const planCredits  = plan === 'elite' ? 600 : plan === 'pro' ? 150 : 10
  const used         = Math.max(0, total - balance)
  const pct          = total > 0 ? Math.min(100, (used / total) * 100) : 0
  const remaining    = balance
  const isLow        = remaining <= Math.ceil(planCredits * 0.1)  // < 10%
  const isEmpty      = remaining === 0
  const color        = isEmpty ? 'var(--red)' : isLow ? 'var(--ora)' : 'var(--ac)'

  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'6px 1rem', background:'color-mix(in srgb, var(--ac) 2%, transparent)', borderBottom:'1px solid var(--bd)', flexWrap:'wrap' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:180 }}>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.2"/>
          <path d="M8 4v4l2.5 2.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'var(--tx3)', whiteSpace:'nowrap' }}>CRÉDITS</span>
        <div style={{ flex:1, height:3, background:'var(--bd)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:2, width:`${pct}%`, background:`linear-gradient(90deg, var(--ac), ${color})`, transition:'width .6s ease' }} />
        </div>
        <span style={{ fontFamily:HUD, fontSize:9, fontWeight:700, color, whiteSpace:'nowrap', minWidth:28 }}>
          {remaining}
        </span>
        <span style={{ fontFamily:BODY, fontSize:10, color:'var(--tx3)', whiteSpace:'nowrap' }}>
          {isEmpty ? '— rechargez' : isLow ? '— solde bas' : `restant${remaining > 1 ? 's' : ''}`}
        </span>
      </div>
      {(isEmpty || isLow) && (
        <a href="/pricing" style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'#020408', background:color, borderRadius:3, padding:'3px 10px', textDecoration:'none', whiteSpace:'nowrap', flexShrink:0 }}>
          RECHARGER →
        </a>
      )}
    </div>
  )
}
