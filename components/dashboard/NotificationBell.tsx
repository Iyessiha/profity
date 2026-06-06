// ============================================================
// PROFITYX — NotificationBell (cloche avec badge + panel)
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
  admin_message:  { icon:'ti-message-2',     color:'var(--ac2)' },
  signal:         { icon:'ti-chart-candle',  color:'var(--ac)'  },
  plan_change:    { icon:'ti-crown',         color:'var(--ac3)' },
  quota_warning:  { icon:'ti-alert-triangle',color:'var(--ora)' },
  upgrade_invite: { icon:'ti-rocket',        color:'var(--ac)'  },
  announcement:   { icon:'ti-speakerphone',  color:'var(--ac2)' },
  plan_expiry:    { icon:'ti-calendar-off',  color:'var(--red)' },
  success:        { icon:'ti-circle-check',  color:'var(--ok)'  },
  info:           { icon:'ti-info-circle',   color:'var(--ac2)' },
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff/60000)
  if (m < 1) return 'À l\'instant'
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m/60)
  if (h < 24) return `Il y a ${h}h`
  return `Il y a ${Math.floor(h/24)}j`
}

const PRIORITY_ORDER: Record<string,number> = { urgent:0, high:1, normal:2, low:3 }

export default function NotificationBell({ token }: { token: string }) {
  const [notifs,   setNotifs]   = useState<Notif[]>([])
  const [open,     setOpen]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [tab,      setTab]      = useState<'all'|'unread'>('unread')
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifs.filter(n => !n.read).length

  const fetch = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (json.success) {
        const sorted = (json.data as Notif[]).sort((a,b) =>
          (PRIORITY_ORDER[a.priority]??2) - (PRIORITY_ORDER[b.priority]??2) ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        setNotifs(sorted)
      }
    } catch {}
    setLoading(false)
  }, [token])

  useEffect(() => { fetch() }, [fetch])

  // Polling léger toutes les 30s pour les nouvelles notifs
  useEffect(() => {
    const id = setInterval(fetch, 30000)
    return () => clearInterval(id)
  }, [fetch])

  // Fermer en cliquant dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markRead = async (id?: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify(id ? { id } : { all: true }),
    })
    setNotifs(prev => id ? prev.map(n => n.id===id ? {...n,read:true} : n) : prev.map(n => ({...n,read:true})))
  }

  const handleClick = async (n: Notif) => {
    if (!n.read) await markRead(n.id)
    if (n.action_url) window.location.href = n.action_url
    else setOpen(false)
  }

  const displayed = notifs.filter(n => tab === 'all' || !n.read)

  return (
    <div ref={ref} style={{ position:'relative' }}>
      {/* Bouton cloche */}
      <button onClick={() => { setOpen(v=>!v); if (!open) fetch() }}
        style={{ width:36, height:36, borderRadius:8, border:'1px solid var(--bd1)', background:'var(--bg2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--tx2)', position:'relative', flexShrink:0 }}
        aria-label={`Notifications${unread>0?` (${unread} non lues)`:''}`}>
        <i className="ti ti-bell" style={{ fontSize:17, color: unread>0?'var(--ac)':'var(--tx2)' }} />
        {unread > 0 && (
          <span style={{ position:'absolute', top:-3, right:-3, width:17, height:17, borderRadius:'50%', background:'var(--red)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:HUD, fontSize:9, fontWeight:900, color:'#fff', border:'2px solid var(--bg1)' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel notifications */}
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 10px)', right:0, width:340, maxWidth:'calc(100vw - 20px)', background:'var(--bg1)', border:'1px solid var(--bd1)', borderRadius:12, boxShadow:`0 12px 40px var(--sh)`, zIndex:200, overflow:'hidden', animation:'fadeIn .18s ease' }}>
          {/* Barre top */}
          <div style={{ height:2, background:'linear-gradient(90deg, var(--ac), var(--ac2))' }} />

          {/* Header */}
          <div style={{ padding:'12px 14px 8px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--bd)' }}>
            <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:1, color:'var(--tx0)' }}>NOTIFICATIONS</div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {unread > 0 && (
                <button onClick={()=>markRead()} style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--ac)', background:'transparent', border:'none', cursor:'pointer' }}>
                  TOUT LIRE
                </button>
              )}
              <button onClick={()=>setOpen(false)} style={{ background:'transparent', border:'none', color:'var(--tx3)', cursor:'pointer', fontSize:17, lineHeight:1 }}>✕</button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:'1px solid var(--bd)' }}>
            {(['unread','all'] as const).map(t => (
              <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:'8px 0', fontFamily:HUD, fontSize:8, letterSpacing:1, background:'transparent', border:'none', borderBottom:`2px solid ${tab===t?'var(--ac)':'transparent'}`, color:tab===t?'var(--ac)':'var(--tx3)', cursor:'pointer', transition:'all .2s' }}>
                {t==='unread'?`NON LUES (${unread})`:'TOUTES'}
              </button>
            ))}
          </div>

          {/* Liste */}
          <div style={{ maxHeight:360, overflowY:'auto' }}>
            {loading && displayed.length===0 && (
              <div style={{ padding:'2rem', textAlign:'center', fontFamily:BODY, fontSize:13, color:'var(--tx3)' }}>Chargement...</div>
            )}
            {!loading && displayed.length===0 && (
              <div style={{ padding:'2.5rem 1rem', textAlign:'center' }}>
                <i className="ti ti-bell-off" style={{ fontSize:32, color:'var(--tx3)', display:'block', marginBottom:8 }} />
                <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:1, color:'var(--tx3)' }}>
                  {tab==='unread'?'Aucune notif non lue':'Aucune notification'}
                </div>
              </div>
            )}
            {displayed.map(n => {
              const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.info
              const isPriority = n.priority === 'urgent' || n.priority === 'high'
              return (
                <div key={n.id}
                  onClick={() => handleClick(n)}
                  style={{ padding:'11px 14px', borderBottom:'1px solid var(--bd)', cursor:'pointer', background: n.read?'transparent':'color-mix(in srgb, var(--ac) 3%, transparent)', transition:'background .15s', display:'flex', gap:10, alignItems:'flex-start' }}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='var(--bg2)'}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=n.read?'transparent':'color-mix(in srgb, var(--ac) 3%, transparent)'}
                >
                  {/* Icône type */}
                  <div style={{ width:32, height:32, borderRadius:8, background:`color-mix(in srgb, ${cfg.color} 12%, transparent)`, border:`1px solid color-mix(in srgb, ${cfg.color} 20%, transparent)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                    <i className={'ti '+cfg.icon} style={{ fontSize:15, color:cfg.color }} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:6, marginBottom:2 }}>
                      <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:0.5, color:n.read?'var(--tx1)':'var(--tx0)', fontWeight: n.read?400:700, lineHeight:1.3, flex:1 }}>
                        {isPriority && !n.read && <span style={{ color:n.priority==='urgent'?'var(--red)':'var(--ora)', marginRight:4 }}>●</span>}
                        {n.title}
                      </div>
                      {!n.read && <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--ac)', display:'block', flexShrink:0, marginTop:2 }} />}
                    </div>
                    <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx2)', lineHeight:1.5, marginBottom:4 }}>{n.message}</div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:4 }}>
                      <span style={{ fontFamily:BODY, fontSize:10, color:'var(--tx3)' }}>{timeAgo(n.created_at)}</span>
                      {n.action_label && (
                        <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:cfg.color }}>
                          {n.action_label} →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
