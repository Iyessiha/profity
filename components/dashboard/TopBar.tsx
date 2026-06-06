'use client'
import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/theme'
import { useMenu } from '@/lib/menu-context'

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
        <div style={{ fontFamily: HUD, fontSize: 15, color: 'var(--ac)', letterSpacing: 2, flexShrink: 0 }}>{time}</div>
        <div className="topbar-hide" style={{ width: 1, height: 16, background: 'var(--bd1)', flexShrink: 0 }} />
        <div className="topbar-hide" style={{ fontFamily: BODY, fontSize: 12, color: 'var(--tx2)', letterSpacing: 1, textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{date}</div>
      </div>

      {/* Droite : devise + toggle thème + profil */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Marché ouvert (caché sur mobile) */}
        <div className="topbar-hide" style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)', borderRadius: 3, padding: '4px 8px' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00E676' }} />
          <span style={{ fontFamily: HUD, fontSize: 7, color: '#00E676', letterSpacing: 1.5 }}>
            {locale === 'fr' ? 'MARCHÉ OUVERT' : 'MARKET OPEN'}
          </span>
        </div>

        {/* Devise */}
        <div style={{ fontFamily: HUD, fontSize: 9, color: 'var(--ac2)', background: 'color-mix(in srgb, var(--ac2) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--ac2) 18%, transparent)', borderRadius: 3, padding: '4px 8px', letterSpacing: 1 }}>
          {currency}
        </div>

        {/* Toggle thème */}
        <button onClick={toggleTheme} title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          style={{ width: 34, height: 34, borderRadius: 7, border: '1px solid var(--bd1)', background: 'var(--bg2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme === 'dark' ? '#C9A84C' : '#0EA5E9', flexShrink: 0 }}>
          <i className={'ti ' + (theme === 'dark' ? 'ti-sun' : 'ti-moon')} style={{ fontSize: 15 }} aria-hidden="true" />
        </button>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: 'color-mix(in srgb, var(--ac) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--ac) 25%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HUD, fontSize: 10, color: 'var(--ac)', fontWeight: 700 }}>
            {name[0]?.toUpperCase() ?? 'T'}
          </div>
          <div className="topbar-name" style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: HUD, fontSize: 9, color: 'var(--tx0)', letterSpacing: 1, whiteSpace: 'nowrap', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis' }}>{name.toUpperCase()}</span>
            <span style={{ fontFamily: BODY, fontSize: 10, color: 'var(--tx3)' }}>{plan.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

/* ── QuotaBar ─────────────────────────────────────────────── */
const PLAN_LIMITS: Record<string, { analyses: number; news: number }> = {
  free:  { analyses: 3,      news: 5      },
  pro:   { analyses: 100,    news: 999999 },
  elite: { analyses: 999999, news: 999999 },
}

interface QuotaBarProps { profile: Record<string,unknown>|null; locale: string; plan: string }

export function QuotaBar({ profile, locale, plan }: QuotaBarProps) {
  if (!profile) return null
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
  const aUsed = (profile.analyses_used as number) ?? 0
  const nUsed = (profile.news_used as number) ?? 0
  const aPct  = Math.min(100, (aUsed / limits.analyses) * 100)
  const nPct  = Math.min(100, (nUsed / limits.news) * 100)
  const isElite = plan === 'elite', isPro = plan === 'pro'
  const HUD = "'Orbitron', monospace"

  return (
    <div style={{ display:'flex', alignItems:'center', gap:14, padding:'7px 1rem', background:'color-mix(in srgb, var(--ac) 3%, transparent)', borderBottom:'1px solid var(--bd)', flexWrap:'wrap', transition:'background .3s, border-color .3s' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:140 }}>
        <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'var(--tx3)', whiteSpace:'nowrap' }}>ANALYSES</span>
        <div style={{ flex:1, height:3, background:'var(--bd)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:2, width:isElite?'5%':`${aPct}%`, background:aPct>80?'var(--red)':'var(--ac)', transition:'width .5s' }} />
        </div>
        <span style={{ fontFamily:HUD, fontSize:9, color:aPct>80?'var(--red)':'var(--ac)', whiteSpace:'nowrap', minWidth:40 }}>
          {isElite?'∞':`${aUsed}/${limits.analyses}`}
        </span>
      </div>
      <div style={{ width:1, height:14, background:'var(--bd)', flexShrink:0 }} />
      <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:140 }}>
        <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'var(--tx3)', whiteSpace:'nowrap' }}>NEWS</span>
        <div style={{ flex:1, height:3, background:'var(--bd)', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:2, width:(isPro||isElite)?'0%':`${nPct}%`, background:nPct>80?'var(--red)':'var(--ac2)', transition:'width .5s' }} />
        </div>
        <span style={{ fontFamily:HUD, fontSize:9, color:'var(--ac2)', whiteSpace:'nowrap', minWidth:40 }}>
          {(isPro||isElite)?'∞':`${nUsed}/${limits.news}`}
        </span>
      </div>
    </div>
  )
}
