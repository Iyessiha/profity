// ============================================================
// PROFITYX — NotificationBell (cloche + panel responsive)
// ============================================================
'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabasePublic } from '@/lib/supabase'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

interface Notif {
  id:string; type:string; title:string; message:string
  action_url?:string; action_label?:string; read:boolean
  priority:string; created_at:string
}

const TYPE_CONFIG: Record<string, { icon:string; color:string }> = {
  admin_message:  { icon:'ti-message-2',      color:'var(--ac2)' },
  signal:         { icon:'ti-chart-candle',   color:'var(--ac)'  },
  plan_change:    { icon:'ti-crown',          color:'var(--ac3)' },
  quota_warning:  { icon:'ti-alert-triangle', color:'var(--ora)' },
  upgrade_invite: { icon:'ti-rocket',         color:'var(--ac)'  },
  announcement:   { icon:'ti-speakerphone',   color:'var(--ac2)' },
  plan_expiry:    { icon:'ti-calendar-off',   color:'var(--red)' },
  success:        { icon:'ti-circle-check',   color:'var(--ok)'  },
  info:           { icon:'ti-info-circle',    color:'var(--ac2)' },
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return "À l'instant"
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  return `Il y a ${Math.floor(h / 24)}j`
}

const PRIORITY_ORDER: Record<string, number> = { urgent:0, high:1, normal:2, low:3 }

export default function NotificationBell({ token }: { token: string }) {
  const [notifs,  setNotifs]  = useState<Notif[]>([])
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [tab,     setTab]     = useState<'all' | 'unread'>('unread')
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifs.filter(n => !n.read).length

  // ── Chargement (renommé loadNotifs pour éviter conflit avec window.fetch)
  const loadNotifs = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res  = await window.fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success) {
        const sorted = (json.data as Notif[]).sort((a, b) =>
          (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2) ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        setNotifs(sorted)
      }
    } catch {}
    setLoading(false)
  }, [token])

  useEffect(() => { loadNotifs() }, [loadNotifs])

  // Polling 30s
  useEffect(() => {
    const id = setInterval(loadNotifs, 30_000)
    return () => clearInterval(id)
  }, [loadNotifs])

  // Fermer en cliquant dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markRead = async (id?: string) => {
    await window.fetch('/api/notifications', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify(id ? { id } : { all: true }),
    })
    setNotifs(prev =>
      id
        ? prev.map(n => n.id === id ? { ...n, read: true } : n)
        : prev.map(n => ({ ...n, read: true }))
    )
  }

  const handleClick = async (n: Notif) => {
    if (!n.read) await markRead(n.id)
    if (n.action_url) window.location.href = n.action_url
    else setOpen(false)
  }

  const displayed = notifs.filter(n => tab === 'all' || !n.read)

  return (
    <div ref={ref} style={{ position: 'relative' }}>

      {/* ── Bouton cloche ── */}
      <button
        onClick={() => { setOpen(v => !v); if (!open) loadNotifs() }}
        style={{ width:36, height:36, borderRadius:8, border:'1px solid var(--bd1)', background:'var(--bg2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--tx2)', position:'relative', flexShrink:0 }}
        aria-label={`Notifications${unread > 0 ? ` (${unread} non lues)` : ''}`}
      >
        <i className="ti ti-bell" style={{ fontSize:17, color: unread > 0 ? 'var(--ac)' : 'var(--tx2)' }} />
        {unread > 0 && (
          <span style={{ position:'absolute', top:-3, right:-3, width:17, height:17, borderRadius:'50%', background:'var(--red)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:HUD, fontSize:9, fontWeight:900, color:'#fff', border:'2px solid var(--bg1)' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* ── Panel — responsive mobile (fixed sur écrans < 480px) ── */}
      {open && (
        <>
          {/* Overlay mobile cliquable */}
          <div
            onClick={() => setOpen(false)}
            style={{ position:'fixed', inset:0, zIndex:199 }}
          />
          <div style={{
            position:  'fixed',
            zIndex:    200,
            animation: 'fadeIn .18s ease',
            // Desktop : dropdown relatif au bouton
            // Mobile  : plein bas d'écran
            top:      'var(--notif-top, auto)',
            right:    'var(--notif-right, 10px)',
            bottom:   'var(--notif-bottom, auto)',
            left:     'var(--notif-left, auto)',
            width:    'min(380px, calc(100vw - 20px))',
            maxHeight: 'calc(100dvh - 80px)',
            background: 'var(--bg1)',
            border:     '1px solid var(--bd1)',
            borderRadius: 12,
            boxShadow: '0 12px 40px var(--sh)',
            overflow:  'hidden',
            display:   'flex',
            flexDirection: 'column',
          }}
            // JS pour positionner correctement selon la taille d'écran
            ref={(el) => {
              if (!el || !ref.current) return
              const btn  = ref.current.getBoundingClientRect()
              const vw   = window.innerWidth
              const vh   = window.innerHeight
              const w    = Math.min(380, vw - 20)
              const isMobile = vw < 480

              if (isMobile) {
                // Mobile : ancré en haut sous la TopBar
                el.style.setProperty('top',    '70px')
                el.style.setProperty('left',   '10px')
                el.style.setProperty('right',  '10px')
                el.style.setProperty('width',  'calc(100vw - 20px)')
                el.style.setProperty('bottom', 'auto')
              } else {
                // Desktop : dropdown sous le bouton
                const rightEdge = vw - btn.right
                el.style.setProperty('top',   `${btn.bottom + 10}px`)
                el.style.setProperty('right', `${Math.max(10, rightEdge)}px`)
                el.style.setProperty('left',  'auto')
                el.style.setProperty('width', `${w}px`)
              }
            }}
          >
            {/* Barre colorée */}
            <div style={{ height:2, background:'linear-gradient(90deg, var(--ac), var(--ac2))', flexShrink:0 }} />

            {/* Header */}
            <div style={{ padding:'12px 14px 8px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--bd)', flexShrink:0 }}>
              <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:1, color:'var(--tx0)' }}>NOTIFICATIONS</div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                {unread > 0 && (
                  <button onClick={() => markRead()} style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--ac)', background:'transparent', border:'none', cursor:'pointer' }}>
                    TOUT LIRE
                  </button>
                )}
                <button onClick={() => setOpen(false)} style={{ background:'transparent', border:'none', color:'var(--tx3)', cursor:'pointer', fontSize:20, lineHeight:1 }}>✕</button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', borderBottom:'1px solid var(--bd)', flexShrink:0 }}>
              {(['unread', 'all'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ flex:1, padding:'9px 0', fontFamily:HUD, fontSize:8, letterSpacing:1, background:'transparent', border:'none', borderBottom:`2px solid ${tab===t?'var(--ac)':'transparent'}`, color:tab===t?'var(--ac)':'var(--tx3)', cursor:'pointer', transition:'all .2s' }}>
                  {t === 'unread' ? `NON LUES (${unread})` : 'TOUTES'}
                </button>
              ))}
            </div>

            {/* Liste scrollable */}
            <div style={{ flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch' }}>
              {loading && displayed.length === 0 && (
                <div style={{ padding:'2rem', textAlign:'center', fontFamily:BODY, fontSize:13, color:'var(--tx3)' }}>Chargement...</div>
              )}
              {!loading && displayed.length === 0 && (
                <div style={{ padding:'2.5rem 1rem', textAlign:'center' }}>
                  <i className="ti ti-bell-off" style={{ fontSize:32, color:'var(--tx3)', display:'block', marginBottom:8 }} />
                  <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:1, color:'var(--tx3)' }}>
                    {tab === 'unread' ? 'Aucune notif non lue' : 'Aucune notification'}
                  </div>
                </div>
              )}
              {displayed.map(n => {
                const cfg        = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.info
                const isPriority = n.priority === 'urgent' || n.priority === 'high'
                return (
                  <div key={n.id} onClick={() => handleClick(n)}
                    style={{ padding:'12px 14px', borderBottom:'1px solid var(--bd)', cursor:'pointer', background: n.read ? 'transparent' : 'rgba(0,255,178,0.03)', transition:'background .15s', display:'flex', gap:10, alignItems:'flex-start' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = n.read ? 'transparent' : 'rgba(0,255,178,0.03)'}
                  >
                    <div style={{ width:34, height:34, borderRadius:8, background:`color-mix(in srgb, ${cfg.color} 12%, transparent)`, border:`1px solid color-mix(in srgb, ${cfg.color} 20%, transparent)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                      <i className={'ti ' + cfg.icon} style={{ fontSize:16, color:cfg.color }} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:6, marginBottom:3 }}>
                        <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:0.5, color: n.read ? 'var(--tx1)' : 'var(--tx0)', fontWeight: n.read ? 400 : 700, lineHeight:1.4, flex:1 }}>
                          {isPriority && !n.read && <span style={{ color: n.priority==='urgent' ? 'var(--red)' : 'var(--ora)', marginRight:4 }}>●</span>}
                          {n.title}
                        </div>
                        {!n.read && <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--ac)', display:'block', flexShrink:0, marginTop:3 }} />}
                      </div>
                      <div style={{ fontFamily:BODY, fontSize:13, color:'var(--tx2)', lineHeight:1.5, marginBottom:5 }}>{n.message}</div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:4 }}>
                        <span style={{ fontFamily:BODY, fontSize:10, color:'var(--tx3)' }}>{timeAgo(n.created_at)}</span>
                        {n.action_label && (
                          <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:cfg.color }}>{n.action_label} →</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
