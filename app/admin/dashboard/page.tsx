// ============================================================
// PROFITYX — app/admin/dashboard/page.tsx
// Dashboard admin principal
// ============================================================
'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'
import { useRouter }                         from 'next/navigation'
import { supabasePublic }                    from '@/lib/supabase'
import { useMenu }                           from '@/lib/menu-context'

// ─── Types ─────────────────────────────────────────────────
interface Stats {
  total_users:       number
  free_users:        number
  pro_users:         number
  elite_users:       number
  new_users_24h:     number
  new_users_7d:      number
  total_analyses:    number
  analyses_24h:      number
  total_news_signals:number
  active_subscriptions:number
  mrr_total_xof:     number
  online_count:      number
  growth:            { day: string; count: number }[]
  top_pairs:         { pair: string; count: number }[]
  analyses_per_day:  { day: string; count: number }[]
}

interface User {
  id:            string
  public_id:     string
  full_name:     string
  email:               string
  user_plan:           string
  is_admin:            boolean
  suspended?:          boolean
  analyses_used:       number
  news_used:           number
  credit_balance?:     number
  current_streak?:     number
  longest_streak?:     number
  total_xp?:           number
  last_active_date?:   string
  total_analyses?:     number
  total_journal_entries?: number
  is_online?:          boolean
  created_at:          string
  subscriptions:       { status: string; amount: number }[]
}

type AdminTab = 'overview' | 'users' | 'subscriptions' | 'treasury' | 'notifications' | 'export' | 'broadcast' | 'logs'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

const PLAN_C: Record<string, string> = { free:'#888', pro:'#00FFB2', elite:'#C9A84C' }

function fNum(n: number) { return n.toLocaleString('fr-FR') }
function fXOF(n: number) { return `${fNum(n)} FCFA` }

// ─── Composant ModalInput ─────────────────────────────────
function ModalInput({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label style={{ fontFamily: "'Orbitron',monospace", fontSize: 8, letterSpacing: 2, color: 'rgba(232,244,248,0.35)', display: 'block', marginBottom: 7 }}>{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '11px 12px', background: '#06090F', border: '1px solid rgba(0,255,178,0.15)', borderRadius: 4, color: '#E8F4F8', fontFamily: "'Rajdhani',sans-serif", fontSize: 14, outline: 'none' }} />
    </div>
  )
}

// ─── Composant MetricCard ─────────────────────────────────
function MetricCard({ label, value, sub, color = '#00FFB2', icon }: {
  label: string; value: string | number; sub?: string; color?: string; icon: string
}) {
  return (
    <div style={{
      background: '#06090F', border: '1px solid rgba(0,255,178,0.08)',
      borderRadius: 8, padding: '1.25rem', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 2, color: 'rgba(232,244,248,0.3)' }}>{label}</span>
        <i className={`ti ${icon}`} style={{ fontSize: 16, color: `${color}60` }} aria-hidden="true" />
      </div>
      <div style={{ fontFamily: HUD, fontSize: 32, fontWeight: 900, color, letterSpacing: 1, lineHeight: 1 }}>
        {typeof value === 'number' ? fNum(value) : value}
      </div>
      {sub && <div style={{ fontFamily: BODY, fontSize: 12, color: 'rgba(232,244,248,0.3)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ─── Composant mini bar chart ─────────────────────────────
function MiniBarChart({ data, color = '#00FFB2', label }: {
  data: { day: string; count: number }[]
  color?: string
  label: string
}) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div>
      <div style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 2, color: 'rgba(232,244,248,0.3)', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 48 }}>
        {data.slice(-14).map((d, i) => (
          <div key={i} title={`${d.day}: ${d.count}`} style={{
            flex: 1, borderRadius: '2px 2px 0 0',
            background: `${color}${Math.round(40 + (d.count / max) * 160).toString(16).padStart(2,'0')}`,
            height: `${Math.max(4, (d.count / max) * 100)}%`,
            minHeight: 4, cursor: 'default', transition: 'opacity .2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Page principale admin ────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter()
  const [tab,    setTab]    = useState<AdminTab>('overview')
  const [stats,  setStats]  = useState<Stats | null>(null)
  const [users,  setUsers]  = useState<User[]>([])
  const [token,  setToken]  = useState('')
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast,  setToast]  = useState<{ msg: string; ok: boolean } | null>(null)
  const { open: drawerOpen, toggle: toggleDrawer, close: closeDrawer } = useMenu()

  // Broadcast state
  const [bcTitle,  setBcTitle]  = useState('')
  const [bcBody,   setBcBody]   = useState('')
  const [bcPlans,  setBcPlans]  = useState<string[]>(['pro','elite'])
  const [bcLoading,setBcLoading]= useState(false)

  // Modal création / édition user
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [formEmail, setFormEmail] = useState('')
  const [formName, setFormName] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formPlan, setFormPlan] = useState('free')
  const [formAdmin, setFormAdmin] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const handleLogout = async () => {
    try { await supabasePublic.auth.signOut() } catch (_) {}
    try { Object.keys(localStorage).filter(k=>k.includes('supabase')||k.includes('sb-')).forEach(k=>localStorage.removeItem(k)) } catch (_) {}
    window.location.replace('/auth/login')
  }

  // ── Auth + vérif admin ─────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabasePublic.auth.getSession()
      if (!session) { router.push('/auth/login'); return }
      setToken(session.access_token)

      // Vérifier is_admin
      const { data: p } = await supabasePublic
        .from('profiles').select('is_admin').eq('id', session.user.id).single()
      if (!p?.is_admin) { router.push('/dashboard'); return }

      setLoading(false)
    }
    init()
  }, [router])

  // ── Fetch stats ────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    if (!token) return
    const res  = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    if (json.success) setStats(json.data)
  }, [token])

  // ── Fetch users ────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    if (!token) return
    const params = new URLSearchParams({ limit: '30', page: '1' })
    if (search)               params.set('search', search)
    if (planFilter !== 'all') params.set('plan', planFilter)
    const res  = await fetch(`/api/admin/users?${params}`, { headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    if (json.success) setUsers(json.data)
  }, [token, search, planFilter])

  useEffect(() => {
    if (!token) return
    fetchStats()
    fetchUsers()
    // Auto-refresh toutes les 30 secondes
    const id = setInterval(() => { fetchStats(); fetchUsers() }, 30_000)
    return () => clearInterval(id)
  }, [token, fetchStats, fetchUsers])

  // ── Action sur un user ─────────────────────────────────
  const userAction = async (action: string, userId: string, plan?: string) => {
    setActionLoading(`${action}-${userId}`)
    const res  = await fetch('/api/admin/users', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, user_id: userId, plan }),
    })
    const json = await res.json()
    showToast(json.message ?? json.error, json.success)
    if (json.success) { fetchUsers(); fetchStats() }
    setActionLoading(null)
  }

  // ── Créer un utilisateur ───────────────────────────────
  const resetForm = () => {
    setFormEmail(''); setFormName(''); setFormPassword(''); setFormPlan('free'); setFormAdmin(false)
  }

  const createUser = async () => {
    if (!formEmail || !formPassword) { showToast('Email et mot de passe requis', false); return }
    if (formPassword.length < 8) { showToast('Mot de passe : min 8 caractères', false); return }
    setFormLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: formEmail, password: formPassword, full_name: formName, user_plan: formPlan, is_admin: formAdmin }),
      })
      let json: { success?: boolean; message?: string; error?: string }
      try {
        json = await res.json()
      } catch {
        // Réponse non-JSON (souvent erreur serveur 500)
        showToast(`Erreur serveur (${res.status}) — vérifiez la clé SUPABASE_SERVICE_ROLE_KEY sur Vercel`, false)
        setFormLoading(false)
        return
      }
      showToast(json.message ?? json.error ?? 'Erreur inconnue', !!json.success)
      if (json.success) { setShowCreate(false); resetForm(); fetchUsers(); fetchStats() }
    } catch {
      showToast('Erreur réseau — réessayez', false)
    } finally {
      setFormLoading(false)
    }
  }

  // ── Sauvegarder l'édition d'un user ────────────────────
  const openEdit = (u: User) => {
    setEditUser(u)
    setFormName(u.full_name || '')
    setFormPlan(u.user_plan)
    setFormPassword('')
  }

  const saveEdit = async () => {
    if (!editUser) return
    setFormLoading(true)
    const body: Record<string, unknown> = { action: 'edit', user_id: editUser.id, full_name: formName, plan: formPlan }
    if (formPassword) body.new_password = formPassword
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      let json: { success?: boolean; message?: string; error?: string }
      try {
        json = await res.json()
      } catch {
        showToast(`Erreur serveur (${res.status}) — vérifiez la clé SUPABASE_SERVICE_ROLE_KEY sur Vercel`, false)
        setFormLoading(false)
        return
      }
      showToast(json.message ?? json.error ?? 'Erreur inconnue', !!json.success)
      if (json.success) { setEditUser(null); setFormPassword(''); fetchUsers() }
    } catch {
      showToast('Erreur réseau — réessayez', false)
    } finally {
      setFormLoading(false)
    }
  }

  // ── Broadcast ─────────────────────────────────────────
  const sendBroadcast = async () => {
    if (!bcTitle || !bcBody) { showToast('Titre et message requis', false); return }
    setBcLoading(true)
    const res  = await fetch('/api/admin/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: bcTitle, body: bcBody, target_plans: bcPlans }),
    })
    const json = await res.json()
    showToast(json.success ? `✓ Envoyé à ${json.sent} utilisateurs` : json.error, json.success)
    if (json.success) { setBcTitle(''); setBcBody('') }
    setBcLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020408' }}>
      <div style={{ fontFamily: HUD, fontSize: 11, color: '#FF3A5C', letterSpacing: 4 }}>ADMIN · VÉRIFICATION...</div>
    </div>
  )

  const TABS: { key: AdminTab; icon: string; label: string }[] = [
    { key: 'overview',      icon: 'ti-dashboard',    label: 'OVERVIEW'      },
    { key: 'users',         icon: 'ti-users',          label: 'UTILISATEURS' },
    { key: 'subscriptions', icon: 'ti-credit-card',    label: 'ABONNEMENTS'  },
    { key: 'treasury',      icon: 'ti-cash',           label: 'TRÉSORERIE'   },
    { key: 'notifications', icon: 'ti-bell',            label: 'NOTIFS'       },
    { key: 'broadcast',     icon: 'ti-speakerphone',   label: 'BROADCAST'    },
    { key: 'export',        icon: 'ti-file-download',  label: 'EXPORT'       },
    { key: 'logs',          icon: 'ti-file-analytics', label: 'LOGS'         },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#020408', fontFamily: BODY }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 1000,
          background: toast.ok ? 'rgba(0,255,178,0.12)' : 'rgba(255,58,92,0.12)',
          border: `1px solid ${toast.ok ? 'rgba(0,255,178,0.3)' : 'rgba(255,58,92,0.3)'}`,
          borderRadius: 6, padding: '10px 16px',
          fontFamily: HUD, fontSize: 10, letterSpacing: 1,
          color: toast.ok ? '#00FFB2' : '#FF3A5C',
          animation: 'fadeIn .3s ease',
        }}>{toast.msg}</div>
      )}

      {/* Header admin avec hamburger INLINE */}
      <div className="admin-topbar" style={{
        background: '#06090F', borderBottom: '1px solid rgba(255,58,92,0.15)',
        padding: '0 1rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 56,
        position: 'sticky', top: 0, zIndex: 10, gap: 10,
      }}>
        {/* Gauche : hamburger (mobile) + logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="hamburger-btn" onClick={toggleDrawer} aria-label="Menu"
            style={{ position: 'static', background: 'rgba(255,58,92,0.1)', borderColor: 'rgba(255,58,92,0.3)', color: '#FF3A5C', flexShrink: 0 }}>
            <i className="ti ti-menu-2" style={{ fontSize: 18 }} aria-hidden="true" />
          </button>
          <span style={{ fontFamily: HUD, fontSize: 16, letterSpacing: 3, color: '#FF3A5C' }}>
            PROFIT<span style={{ color: '#00D4FF' }}>YX</span>
          </span>
          <div className="topbar-hide" style={{
            background: 'rgba(255,58,92,0.1)', border: '1px solid rgba(255,58,92,0.3)',
            borderRadius: 3, padding: '3px 8px',
            fontFamily: HUD, fontSize: 7, letterSpacing: 2, color: '#FF3A5C',
          }}>ADMIN</div>
        </div>
        <a href="/dashboard" style={{
          fontFamily: HUD, fontSize: 8, letterSpacing: 2, color: 'rgba(232,244,248,0.3)',
          textDecoration: 'none', whiteSpace: 'nowrap',
        }}>← APP</a>
      </div>

      <div className="admin-shell" style={{ minHeight: 'calc(100vh - 56px)' }}>

        {/* Overlay drawer */}
        <div className={`drawer-overlay${drawerOpen ? ' show' : ''}`} onClick={closeDrawer} />

        {/* Sidebar */}
        <aside className={`admin-sidebar${drawerOpen ? ' drawer-open' : ''}`} style={{
          background: '#06090F', borderRight: '1px solid rgba(255,58,92,0.08)',
          padding: '1.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {/* Fermer (mobile) */}
          <button className="mobile-only" onClick={closeDrawer} aria-label="Fermer"
            style={{ alignSelf: 'flex-end', background: 'transparent', border: 'none', color: 'rgba(232,244,248,0.5)', cursor: 'pointer', fontSize: 22, marginBottom: 8 }}>
            <i className="ti ti-x" aria-hidden="true" />
          </button>
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); closeDrawer() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 4, cursor: 'pointer',
                background: tab === t.key ? 'rgba(255,58,92,0.08)' : 'transparent',
                border: `1px solid ${tab === t.key ? 'rgba(255,58,92,0.25)' : 'transparent'}`,
                color: tab === t.key ? '#FF3A5C' : 'rgba(232,244,248,0.35)',
                fontFamily: HUD, fontSize: 9, letterSpacing: 1.5, transition: 'all .2s',
              }}>
              <i className={`ti ${t.icon}`} style={{ fontSize: 14 }} aria-hidden="true" />
              <span className="sidebar-label">{t.label}</span>
            </button>
          ))}

          <div className="sidebar-label" style={{ flex: 1 }} />

          {/* Lien vers l'app + Déconnexion */}
          <a href="/dashboard" style={{
            display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
            padding: '10px 12px', borderRadius: 4,
            color: 'rgba(0,212,255,0.6)', fontFamily: HUD, fontSize: 9, letterSpacing: 1.5,
          }}>
            <i className="ti ti-app-window" style={{ fontSize: 14 }} aria-hidden="true" />
            <span className="sidebar-label">ESPACE TRADING</span>
          </a>
          <button onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 4, cursor: 'pointer',
              background: 'transparent', border: '1px solid rgba(255,58,92,0.2)',
              color: '#FF3A5C', fontFamily: HUD, fontSize: 9, letterSpacing: 1.5,
            }}>
            <i className="ti ti-logout" style={{ fontSize: 14 }} aria-hidden="true" />
            <span className="sidebar-label">DÉCONNEXION</span>
          </button>
        </aside>

        {/* Main content */}
        <main className="admin-main resp-pad" style={{ padding: '2rem', overflow: 'auto' }}>

          {/* ══ OVERVIEW ══════════════════════════════════ */}
          {tab === 'overview' && stats && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Métriques principales */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <MetricCard label="UTILISATEURS TOTAL"  value={stats.total_users}        sub={`+${stats.new_users_24h} aujourd'hui`} icon="ti-users"        color="#00D4FF" />
                <MetricCard label="EN LIGNE MAINTENANT" value={stats.online_count ?? 0}  sub="Actifs < 10 min"               icon="ti-activity"    color="#00FFB2" />
                <MetricCard label="ABONNÉS ACTIFS"       value={stats.active_subscriptions} sub={`${stats.pro_users} Pro · ${stats.elite_users} Elite`}     icon="ti-crown"       color="#00FFB2" />
                <MetricCard label="MRR"                  value={fXOF(stats.mrr_total_xof)}  sub="Revenus mensuels récurrents"                                icon="ti-coin"        color="#C9A84C" />
                <MetricCard label="PUSH SUBSCRIBERS"    value={stats.push_subscribers}     sub="Alertes activées"                                           icon="ti-bell"        color="#FF3A5C" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <MetricCard label="PLAN FREE"    value={stats.free_users}        icon="ti-user"        color="#888"    />
                <MetricCard label="PLAN PRO"     value={stats.pro_users}         icon="ti-star"        color="#00FFB2" />
                <MetricCard label="PLAN ELITE"   value={stats.elite_users}       icon="ti-crown"       color="#C9A84C" />
                <MetricCard label="ANALYSES 24H" value={stats.analyses_24h}      icon="ti-chart-candle" color="#00D4FF" />
              </div>

              {/* Graphiques */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{
                  background: '#06090F', border: '1px solid rgba(0,255,178,0.08)',
                  borderRadius: 8, padding: '1.25rem',
                }}>
                  <MiniBarChart data={stats.growth} color="#00D4FF" label="NOUVEAUX USERS — 30 JOURS" />
                </div>
                <div style={{
                  background: '#06090F', border: '1px solid rgba(0,255,178,0.08)',
                  borderRadius: 8, padding: '1.25rem',
                }}>
                  <MiniBarChart data={stats.analyses_per_day} color="#00FFB2" label="ANALYSES IA — 7 JOURS" />
                </div>
              </div>

              {/* Top paires + Répartition plans */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Top paires */}
                <div style={{
                  background: '#06090F', border: '1px solid rgba(0,255,178,0.08)',
                  borderRadius: 8, padding: '1.25rem',
                }}>
                  <div style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 2, color: 'rgba(232,244,248,0.3)', marginBottom: 12 }}>
                    TOP ACTIFS ANALYSÉS
                  </div>
                  {stats.top_pairs.map((p, i) => (
                    <div key={p.pair} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontFamily: HUD, fontSize: 9, color: 'rgba(232,244,248,0.25)', minWidth: 16 }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span style={{ fontFamily: HUD, fontSize: 11, color: '#00FFB2', flex: 1 }}>{p.pair}</span>
                      <div style={{ height: 4, width: `${(p.count / stats.top_pairs[0]?.count) * 80}px`, background: 'rgba(0,255,178,0.3)', borderRadius: 2 }} />
                      <span style={{ fontFamily: HUD, fontSize: 10, color: 'rgba(232,244,248,0.4)', minWidth: 30, textAlign: 'right' }}>{p.count}</span>
                    </div>
                  ))}
                </div>

                {/* Répartition plans */}
                <div style={{
                  background: '#06090F', border: '1px solid rgba(0,255,178,0.08)',
                  borderRadius: 8, padding: '1.25rem',
                }}>
                  <div style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 2, color: 'rgba(232,244,248,0.3)', marginBottom: 16 }}>
                    RÉPARTITION PLANS
                  </div>
                  {[
                    { plan: 'free',  count: stats.free_users,  color: '#888' },
                    { plan: 'pro',   count: stats.pro_users,   color: '#00FFB2' },
                    { plan: 'elite', count: stats.elite_users, color: '#C9A84C' },
                  ].map(p => {
                    const pct = stats.total_users > 0 ? Math.round((p.count / stats.total_users) * 100) : 0
                    return (
                      <div key={p.plan} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontFamily: HUD, fontSize: 9, color: p.color, letterSpacing: 2 }}>{p.plan.toUpperCase()}</span>
                          <span style={{ fontFamily: HUD, fontSize: 9, color: 'rgba(232,244,248,0.4)' }}>{p.count} · {pct}%</span>
                        </div>
                        <div style={{ height: 4, background: 'rgba(232,244,248,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: p.color, borderRadius: 2, transition: 'width .5s' }} />
                        </div>
                      </div>
                    )
                  })}

                  {/* MRR détail */}
                  <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.12)', borderRadius: 4 }}>
                    <div style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 2, color: 'rgba(201,168,76,0.6)', marginBottom: 4 }}>MRR TOTAL</div>
                    <div style={{ fontFamily: HUD, fontSize: 20, color: '#C9A84C', fontWeight: 900 }}>{fXOF(stats.mrr_total_xof)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ USERS ═════════════════════════════════════ */}
          {tab === 'users' && (
            <div>
              {/* Barre d'actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ fontFamily: HUD, fontSize: 11, letterSpacing: 2, color: '#00FFB2' }}>
                    GESTION DES UTILISATEURS
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:5, fontFamily:HUD, fontSize:7, color:'rgba(232,244,248,0.3)', letterSpacing:1 }}>
                    <span style={{ width:5, height:5, borderRadius:'50%', background:'#00FFB2', boxShadow:'0 0 5px #00FFB2', animation:'pulse 2.5s infinite', display:'inline-block' }} />
                    SYNC 30S
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => { fetchUsers(); fetchStats() }}
                    style={{ background:'transparent', border:'1px solid rgba(0,255,178,0.2)', color:'#00FFB2', fontFamily:HUD, fontSize:8, letterSpacing:1, padding:'8px 12px', borderRadius:4, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                    <i className="ti ti-refresh" style={{ fontSize:13 }} /> ACTUALISER
                  </button>
                  <button onClick={() => { resetForm(); setShowCreate(true) }}
                    style={{ background: '#00FFB2', border: 'none', color: '#020408', fontFamily: HUD, fontSize: 9, letterSpacing: 2, fontWeight: 700, padding: '9px 18px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="ti ti-user-plus" style={{ fontSize: 14 }} aria-hidden="true" />
                    CRÉER UN UTILISATEUR
                  </button>
                </div>
              </div>

              {/* Filtres */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <input
                  placeholder="Rechercher par nom ou email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchUsers()}
                  style={{
                    flex: 1, padding: '9px 12px',
                    background: '#06090F', border: '1px solid rgba(0,255,178,0.15)',
                    borderRadius: 4, color: '#E8F4F8', fontFamily: BODY, fontSize: 14, outline: 'none',
                  }}
                />
                {['all','free','pro','elite'].map(p => (
                  <button key={p} onClick={() => { setPlanFilter(p); fetchUsers() }}
                    style={{
                      padding: '9px 14px', borderRadius: 4, cursor: 'pointer',
                      background: planFilter === p ? `rgba(${p==='pro'?'0,255,178':p==='elite'?'201,168,76':p==='free'?'100,100,120':'232,244,248'}, 0.1)` : 'transparent',
                      border: `1px solid ${planFilter === p ? (PLAN_C[p]??'#888')+'50' : 'rgba(0,255,178,0.1)'}`,
                      color: PLAN_C[p] ?? (planFilter === p ? '#E8F4F8' : 'rgba(232,244,248,0.4)'),
                      fontFamily: HUD, fontSize: 9, letterSpacing: 1,
                    }}>
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Table users */}
              <div className="table-scroll" style={{ background: '#06090F', border: '1px solid rgba(0,255,178,0.08)', borderRadius: 8, overflow: 'hidden' }}>
                {/* Header */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1.4fr 90px 65px 60px 65px 80px 70px 90px 220px',
                  padding: '10px 16px', background: '#0A0F1A',
                  borderBottom: '1px solid rgba(0,255,178,0.06)',
                  minWidth: 900,
                }}>
                  {['UTILISATEUR','PLAN','ANALYSES','NEWS','CRÉDITS','STREAK','ACTIVITÉ','STATUT','ACTIONS'].map(h => (
                    <span key={h} style={{ fontFamily: HUD, fontSize: 7, letterSpacing: 2, color: 'rgba(232,244,248,0.25)' }}>{h}</span>
                  ))}
                </div>

                {users.map((u, i) => (
                  <div key={u.id}
                    style={{
                      display: 'grid', gridTemplateColumns: '1.4fr 90px 65px 60px 65px 80px 70px 90px 220px',
                      padding: '12px 16px', alignItems: 'center',
                      borderBottom: '1px solid rgba(0,255,178,0.04)',
                      background: u.suspended ? 'rgba(255,58,92,0.04)' : i % 2 === 0 ? 'transparent' : 'rgba(0,255,178,0.01)',
                      transition: 'background .15s', opacity: u.suspended ? 0.6 : 1,
                      minWidth: 900,
                    }}
                  >
                    {/* User info */}
                    <div>
                      <div style={{ fontFamily: HUD, fontSize: 11, color: '#E8F4F8', letterSpacing: 1 }}>
                        {u.full_name || 'Sans nom'}
                      </div>
                      <div style={{ fontFamily: BODY, fontSize: 12, color: 'rgba(232,244,248,0.35)' }}>{u.email}</div>
                      {u.public_id && (
                        <div style={{ fontFamily: HUD, fontSize: 8, color: '#00FFB2', letterSpacing: 1, marginTop: 2 }}>{u.public_id}</div>
                      )}
                    </div>

                    {/* Plan */}
                    <div>
                      <span style={{
                        fontFamily: HUD, fontSize: 10, letterSpacing: 1,
                        color: PLAN_C[u.user_plan] ?? '#888',
                        background: `rgba(${u.user_plan==='pro'?'0,255,178':u.user_plan==='elite'?'201,168,76':'100,100,120'}, 0.08)`,
                        border: `1px solid ${PLAN_C[u.user_plan] ?? '#888'}30`,
                        borderRadius: 3, padding: '3px 8px', display: 'inline-block',
                      }}>
                        {u.user_plan.toUpperCase()}
                      </span>
                    </div>

                    {/* Analyses */}
                    <span style={{ fontFamily: HUD, fontSize: 10, color: '#00FFB2' }}>{u.analyses_used ?? 0}</span>

                    {/* News */}
                    <span style={{ fontFamily: HUD, fontSize: 10, color: '#00D4FF' }}>{u.news_used ?? 0}</span>

                    {/* Crédits restants */}
                    <span style={{ fontFamily: HUD, fontSize: 10, color: (u.credit_balance ?? 0) <= 5 ? '#FF3A5C' : '#C9A84C', fontWeight: 700 }}>
                      {u.credit_balance ?? '—'}
                    </span>

                    {/* Streak */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <span style={{ fontFamily: HUD, fontSize: 10, color: '#FF9500' }}>🔥 {u.current_streak ?? 0}j</span>
                      <span style={{ fontFamily: HUD, fontSize: 7, color: 'rgba(232,244,248,0.3)' }}>XP {u.total_xp ?? 0}</span>
                    </div>

                    {/* Dernière activité */}
                    <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: 'rgba(232,244,248,0.5)' }}>
                      {u.last_active_date ? new Date(u.last_active_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}
                    </span>

                    {/* Statut */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {u.is_online && (
                        <span style={{ display:'flex', alignItems:'center', gap:3, fontFamily: HUD, fontSize: 7, letterSpacing: 1, color: '#00FFB2', background: 'rgba(0,255,178,0.08)', border: '1px solid rgba(0,255,178,0.2)', borderRadius: 3, padding: '2px 6px' }}>
                          <span style={{ width:5, height:5, borderRadius:'50%', background:'#00FFB2', boxShadow:'0 0 5px #00FFB2', animation:'pulse 2s infinite', display:'inline-block' }} />
                          EN LIGNE
                        </span>
                      )}
                      {u.is_admin && (
                        <span style={{ fontFamily: HUD, fontSize: 7, letterSpacing: 1, color: '#FF3A5C', background: 'rgba(255,58,92,0.1)', border: '1px solid rgba(255,58,92,0.2)', borderRadius: 3, padding: '2px 6px' }}>ADMIN</span>
                      )}
                      {u.suspended ? (
                        <span style={{ fontFamily: HUD, fontSize: 7, letterSpacing: 1, color: '#FF8800', background: 'rgba(255,136,0,0.1)', border: '1px solid rgba(255,136,0,0.2)', borderRadius: 3, padding: '2px 6px' }}>SUSPENDU</span>
                      ) : !u.is_admin && !u.is_online && (
                        <span style={{ fontFamily: HUD, fontSize: 7, letterSpacing: 1, color: '#00E676', background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.15)', borderRadius: 3, padding: '2px 6px' }}>ACTIF</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {/* Octroyer un plan */}
                      <select
                        value={u.user_plan}
                        onChange={e => userAction(e.target.value === 'free' ? 'downgrade' : 'upgrade', u.id, e.target.value)}
                        disabled={actionLoading?.endsWith(u.id)}
                        style={{ background: '#0A0F1A', border: '1px solid rgba(0,255,178,0.2)', color: '#00FFB2', fontFamily: HUD, fontSize: 8, letterSpacing: 1, padding: '4px 6px', borderRadius: 3, cursor: 'pointer', outline: 'none' }}
                        title="Octroyer un plan"
                      >
                        <option value="free">FREE</option>
                        <option value="pro">PRO</option>
                        <option value="elite">ELITE</option>
                      </select>

                      {/* Modifier */}
                      <button onClick={() => openEdit(u)}
                        style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF', fontSize: 11, padding: '4px 7px', borderRadius: 3, cursor: 'pointer' }}
                        title="Modifier">
                        <i className="ti ti-edit" aria-hidden="true" />
                      </button>

                      {/* Reset quota */}
                      <button onClick={() => userAction('reset_quota', u.id)} disabled={actionLoading === `reset_quota-${u.id}`}
                        style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF', fontSize: 11, padding: '4px 7px', borderRadius: 3, cursor: 'pointer' }}
                        title="Réinitialiser le quota">
                        <i className="ti ti-refresh" aria-hidden="true" />
                      </button>

                      {/* Suspendre / Réactiver */}
                      {u.suspended ? (
                        <button onClick={() => userAction('reactivate', u.id)} disabled={actionLoading === `reactivate-${u.id}`}
                          style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)', color: '#00E676', fontSize: 11, padding: '4px 7px', borderRadius: 3, cursor: 'pointer' }}
                          title="Réactiver">
                          <i className="ti ti-player-play" aria-hidden="true" />
                        </button>
                      ) : (
                        <button onClick={() => userAction('suspend', u.id)} disabled={actionLoading === `suspend-${u.id}`}
                          style={{ background: 'rgba(255,136,0,0.08)', border: '1px solid rgba(255,136,0,0.2)', color: '#FF8800', fontSize: 11, padding: '4px 7px', borderRadius: 3, cursor: 'pointer' }}
                          title="Suspendre">
                          <i className="ti ti-ban" aria-hidden="true" />
                        </button>
                      )}

                      {/* Toggle admin */}
                      <button onClick={() => userAction('toggle_admin', u.id)} disabled={actionLoading === `toggle_admin-${u.id}`}
                        style={{ background: 'rgba(255,58,92,0.06)', border: '1px solid rgba(255,58,92,0.15)', color: '#FF3A5C', fontSize: 11, padding: '4px 7px', borderRadius: 3, cursor: 'pointer' }}
                        title={u.is_admin ? 'Révoquer admin' : 'Donner admin'}>
                        <i className={u.is_admin ? 'ti ti-shield-off' : 'ti ti-shield'} aria-hidden="true" />
                      </button>

                      {/* Supprimer */}
                      <button onClick={() => { if (confirm(`Supprimer définitivement ${u.email} ?`)) userAction('delete', u.id) }} disabled={actionLoading === `delete-${u.id}`}
                        style={{ background: 'rgba(255,58,92,0.06)', border: '1px solid rgba(255,58,92,0.15)', color: '#FF3A5C', fontSize: 11, padding: '4px 7px', borderRadius: 3, cursor: 'pointer' }}
                        title="Supprimer">
                        <i className="ti ti-trash" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}

                {users.length === 0 && (
                  <div style={{ padding: '3rem', textAlign: 'center', fontFamily: HUD, fontSize: 10, color: 'rgba(232,244,248,0.2)', letterSpacing: 3 }}>
                    AUCUN UTILISATEUR TROUVÉ
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ MODAL CRÉER UTILISATEUR ══════════════════ */}
          {showCreate && (
            <div onClick={() => setShowCreate(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="modal-card" onClick={e => e.stopPropagation()} style={{ background: '#0A0F1A', border: '1px solid rgba(0,255,178,0.2)', borderRadius: 12, padding: '2rem', width: 420, maxWidth: '90vw' }}>
                <div style={{ fontFamily: HUD, fontSize: 14, letterSpacing: 2, color: '#00FFB2', marginBottom: '1.5rem' }}>NOUVEL UTILISATEUR</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <ModalInput label="NOM COMPLET" value={formName} onChange={setFormName} placeholder="Jean Kouassi" />
                  <ModalInput label="EMAIL" value={formEmail} onChange={setFormEmail} placeholder="trader@profityx.app" type="email" />
                  <ModalInput label="MOT DE PASSE" value={formPassword} onChange={setFormPassword} placeholder="min. 8 caractères" type="password" />
                  <div>
                    <label style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 2, color: 'rgba(232,244,248,0.35)', display: 'block', marginBottom: 7 }}>PLAN</label>
                    <select value={formPlan} onChange={e => setFormPlan(e.target.value)} style={{ width: '100%', padding: '11px 12px', background: '#06090F', border: '1px solid rgba(0,255,178,0.15)', borderRadius: 4, color: '#E8F4F8', fontFamily: BODY, fontSize: 14, outline: 'none' }}>
                      <option value="free">FREE</option>
                      <option value="pro">PRO</option>
                      <option value="elite">ELITE</option>
                    </select>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: BODY, fontSize: 14, color: 'rgba(232,244,248,0.7)' }}>
                    <input type="checkbox" checked={formAdmin} onChange={e => setFormAdmin(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#FF3A5C' }} />
                    Donner les droits administrateur
                  </label>
                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid rgba(232,244,248,0.15)', borderRadius: 4, color: 'rgba(232,244,248,0.5)', fontFamily: HUD, fontSize: 9, letterSpacing: 2, cursor: 'pointer' }}>ANNULER</button>
                    <button onClick={createUser} disabled={formLoading} style={{ flex: 1, padding: '11px', background: '#00FFB2', border: 'none', borderRadius: 4, color: '#020408', fontFamily: HUD, fontSize: 9, letterSpacing: 2, fontWeight: 700, cursor: formLoading ? 'wait' : 'pointer' }}>{formLoading ? 'CRÉATION...' : 'CRÉER'}</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ MODAL MODIFIER UTILISATEUR ═══════════════ */}
          {editUser && (
            <div onClick={() => setEditUser(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="modal-card" onClick={e => e.stopPropagation()} style={{ background: '#0A0F1A', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 12, padding: '2rem', width: 420, maxWidth: '90vw' }}>
                <div style={{ fontFamily: HUD, fontSize: 14, letterSpacing: 2, color: '#00D4FF', marginBottom: 6 }}>MODIFIER UTILISATEUR</div>
                <div style={{ fontFamily: BODY, fontSize: 13, color: 'rgba(232,244,248,0.4)', marginBottom: '1.5rem' }}>{editUser.email}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <ModalInput label="NOM COMPLET" value={formName} onChange={setFormName} placeholder="Nom" />
                  <div>
                    <label style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 2, color: 'rgba(232,244,248,0.35)', display: 'block', marginBottom: 7 }}>PLAN</label>
                    <select value={formPlan} onChange={e => setFormPlan(e.target.value)} style={{ width: '100%', padding: '11px 12px', background: '#06090F', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 4, color: '#E8F4F8', fontFamily: BODY, fontSize: 14, outline: 'none' }}>
                      <option value="free">FREE</option>
                      <option value="pro">PRO</option>
                      <option value="elite">ELITE</option>
                    </select>
                  </div>
                  <ModalInput label="NOUVEAU MOT DE PASSE (optionnel)" value={formPassword} onChange={setFormPassword} placeholder="laisser vide pour ne pas changer" type="password" />
                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <button onClick={() => setEditUser(null)} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid rgba(232,244,248,0.15)', borderRadius: 4, color: 'rgba(232,244,248,0.5)', fontFamily: HUD, fontSize: 9, letterSpacing: 2, cursor: 'pointer' }}>ANNULER</button>
                    <button onClick={saveEdit} disabled={formLoading} style={{ flex: 1, padding: '11px', background: '#00D4FF', border: 'none', borderRadius: 4, color: '#020408', fontFamily: HUD, fontSize: 9, letterSpacing: 2, fontWeight: 700, cursor: formLoading ? 'wait' : 'pointer' }}>{formLoading ? 'ENREGISTREMENT...' : 'ENREGISTRER'}</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ ABONNEMENTS ═══════════════════════════════ */}
          {tab === 'subscriptions' && <SubscriptionsPanel token={token} />}

          {tab === 'treasury' && (
            <TreasuryPanel token={token} />
          )}
          {/* ══ BROADCAST ════════════════════════════════ */}
          {tab === 'broadcast' && (            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <div style={{ fontFamily: HUD, fontSize: 10, letterSpacing: 2, color: '#FF3A5C', marginBottom: 16 }}>
                  ENVOYER UNE NOTIFICATION
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 2, color: 'rgba(232,244,248,0.35)', display: 'block', marginBottom: 6 }}>
                      TITRE
                    </label>
                    <input value={bcTitle} onChange={e => setBcTitle(e.target.value)}
                      placeholder="ProfityX — Signal urgent"
                      style={{ width: '100%', padding: '10px 12px', background: '#06090F', border: '1px solid rgba(255,58,92,0.15)', borderRadius: 4, color: '#E8F4F8', fontFamily: BODY, fontSize: 14, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 2, color: 'rgba(232,244,248,0.35)', display: 'block', marginBottom: 6 }}>
                      MESSAGE
                    </label>
                    <textarea value={bcBody} onChange={e => setBcBody(e.target.value)}
                      placeholder="Votre message aux traders..."
                      rows={4}
                      style={{ width: '100%', padding: '10px 12px', background: '#06090F', border: '1px solid rgba(255,58,92,0.15)', borderRadius: 4, color: '#E8F4F8', fontFamily: BODY, fontSize: 14, outline: 'none', resize: 'vertical' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 2, color: 'rgba(232,244,248,0.35)', display: 'block', marginBottom: 8 }}>
                      DESTINATAIRES
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {['free','pro','elite'].map(p => (
                        <button key={p}
                          onClick={() => setBcPlans(prev => prev.includes(p) ? prev.filter(x=>x!==p) : [...prev, p])}
                          style={{
                            padding: '7px 14px', borderRadius: 3, cursor: 'pointer',
                            background: bcPlans.includes(p) ? `rgba(${p==='pro'?'0,255,178':p==='elite'?'201,168,76':'100,100,120'}, 0.12)` : 'transparent',
                            border: `1px solid ${bcPlans.includes(p) ? (PLAN_C[p]??'#888')+'60' : 'rgba(232,244,248,0.1)'}`,
                            color: bcPlans.includes(p) ? PLAN_C[p]??'#888' : 'rgba(232,244,248,0.35)',
                            fontFamily: HUD, fontSize: 9, letterSpacing: 1,
                            transition: 'all .2s',
                          }}>
                          {p.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={sendBroadcast} disabled={bcLoading || !bcTitle || !bcBody}
                    style={{
                      padding: '12px', background: '#FF3A5C', border: 'none',
                      borderRadius: 4, color: '#fff', fontFamily: HUD, fontSize: 10,
                      letterSpacing: 2, cursor: 'pointer', fontWeight: 700,
                      opacity: (bcLoading || !bcTitle || !bcBody) ? 0.5 : 1,
                    }}>
                    {bcLoading ? 'ENVOI...' : `ENVOYER AUX PLANS: ${bcPlans.map(p=>p.toUpperCase()).join(' · ')}`}
                  </button>
                </div>
              </div>

              {/* Aperçu */}
              <div>
                <div style={{ fontFamily: HUD, fontSize: 10, letterSpacing: 2, color: 'rgba(232,244,248,0.3)', marginBottom: 16 }}>
                  APERÇU NOTIFICATION
                </div>
                <div style={{
                  background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, padding: '1rem', maxWidth: 320,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FF3A5C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HUD, fontSize: 10, color: '#fff' }}>PX</div>
                    <div>
                      <div style={{ fontFamily: HUD, fontSize: 10, color: '#E8F4F8', letterSpacing: 1 }}>ProfityX</div>
                      <div style={{ fontFamily: BODY, fontSize: 11, color: 'rgba(232,244,248,0.4)' }}>Maintenant</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: HUD, fontSize: 12, color: '#E8F4F8', marginBottom: 4 }}>
                    {bcTitle || 'Titre de la notification'}
                  </div>
                  <div style={{ fontFamily: BODY, fontSize: 13, color: 'rgba(232,244,248,0.6)', lineHeight: 1.5 }}>
                    {bcBody || 'Le contenu de votre message apparaîtra ici...'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ LOGS ══════════════════════════════════════ */}
          {/* ══ NOTIFICATIONS ═══════════════════════════ */}
          {tab === 'notifications' && (
            <>
              <NotifSenderPanel token={token} showToast={showToast} />
              <EmailTestPanel token={token} showToast={showToast} />
            </>
          )}

          {/* ══ EXPORT ═══════════════════════════════════ */}
          {tab === 'export' && <ExportPanel token={token} />}

          {tab === 'logs' && <LogsPanel token={token} />}

        </main>
      </div>

      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  )
}

// ─── Sous-composant Notifications Admin ─────────────────
function NotifSenderPanel({ token, showToast }: { token:string; showToast:(msg:string,ok:boolean)=>void }) {
  const HUD  = "'Orbitron', monospace"
  const BODY = "'Rajdhani', sans-serif"
  const [form, setForm] = useState({ title:'', message:'', type:'admin_message', priority:'normal', target_plan:'', target_user_id:'' })
  const [sending, setSending] = useState(false)

  const send = async () => {
    if (!form.title || !form.message) { showToast('Titre et message requis', false); return }
    setSending(true)
    const body: Record<string,string> = { title:form.title, message:form.message, type:form.type, priority:form.priority }
    if (form.target_user_id.trim()) body.target_user_id = form.target_user_id.trim()
    else if (form.target_plan) body.target_plan = form.target_plan
    const res = await fetch('/api/notifications', { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body:JSON.stringify(body) })
    const json = await res.json()
    if (json.success) { showToast(`✅ Envoyé à ${json.sent_to} utilisateur(s)`, true); setForm(f=>({...f,title:'',message:'',target_user_id:''})) }
    else showToast(json.error||'Erreur', false)
    setSending(false)
  }

  const inp = { background:'var(--bg2)', border:'1px solid var(--bd)', color:'var(--tx0)', fontFamily:BODY, fontSize:14, padding:'9px 12px', borderRadius:4, width:'100%', boxSizing:'border-box' as const }
  const lbl = { fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--tx3)', marginBottom:5, display:'block' as const }

  return (
    <div>
      <div style={{ fontFamily:HUD, fontSize:12, color:'var(--ac)', letterSpacing:1, marginBottom:'1.5rem' }}>🔔 ENVOYER UNE NOTIFICATION</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
        {/* Formulaire */}
        <div style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.25rem', display:'flex', flexDirection:'column', gap:12 }}>
          <div><span style={lbl}>TITRE</span><input style={inp} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Ex: Signal NFP disponible !" /></div>
          <div><span style={lbl}>MESSAGE</span><textarea style={{...inp, minHeight:90, resize:'vertical'}} value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} placeholder="Corps de la notification..." /></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <span style={lbl}>TYPE</span>
              <select style={inp} value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                <option value="admin_message">📢 Message admin</option>
                <option value="announcement">📣 Annonce</option>
                <option value="signal">📊 Signal</option>
                <option value="upgrade_invite">🚀 Invitation upgrade</option>
                <option value="quota_warning">⚠️ Alerte quota</option>
                <option value="plan_change">👑 Changement plan</option>
                <option value="success">✅ Succès</option>
                <option value="info">ℹ️ Info</option>
              </select>
            </div>
            <div>
              <span style={lbl}>PRIORITÉ</span>
              <select style={inp} value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
                <option value="low">Faible</option>
                <option value="normal">Normale</option>
                <option value="high">Haute</option>
                <option value="urgent">🚨 Urgente</option>
              </select>
            </div>
          </div>
          <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:6, padding:'0.875rem' }}>
            <span style={{...lbl, marginBottom:10}}>🎯 CIBLAGE (laisser vide = tous les users)</span>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div>
                <span style={{...lbl, color:'var(--tx2)'}}>ID USER SPÉCIFIQUE</span>
                <input style={inp} value={form.target_user_id} onChange={e=>setForm(f=>({...f,target_user_id:e.target.value}))} placeholder="UUID de l'utilisateur (optionnel)" />
              </div>
              <div>
                <span style={{...lbl, color:'var(--tx2)'}}>OU FILTRER PAR PLAN</span>
                <select style={inp} value={form.target_plan} onChange={e=>setForm(f=>({...f,target_plan:e.target.value}))}>
                  <option value="">Tous les plans</option>
                  <option value="free">Free uniquement</option>
                  <option value="pro">Pro uniquement</option>
                  <option value="elite">Elite uniquement</option>
                </select>
              </div>
            </div>
          </div>
          <button onClick={send} disabled={sending||!form.title||!form.message}
            style={{ padding:'12px', borderRadius:6, border:'none', background:sending||!form.title||!form.message?'var(--bd)':'var(--ac)', color:'#020408', fontFamily:HUD, fontSize:10, letterSpacing:2, fontWeight:700, cursor:sending?'wait':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {sending ? '⏳ ENVOI...' : '🔔 ENVOYER LA NOTIFICATION'}
          </button>
        </div>

        {/* Exemples rapides */}
        <div>
          <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'var(--tx3)', marginBottom:10 }}>MESSAGES RAPIDES</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { title:'🚀 Passez Pro maintenant', msg:'Débloquez 100 analyses SMC, coaching NFP/CPI et signaux illimités. Offre spéciale ce mois-ci.', type:'upgrade_invite', priority:'high', plan:'free' },
              { title:'📊 Signal NFP publié', msg:'Un nouveau signal a été généré pour le NFP. Consultez le module Annonces pour la stratégie complète.', type:'signal', priority:'high', plan:'' },
              { title:'⚠️ Renouvellement de quota', msg:'Votre quota mensuel sera remis à zéro le 1er du mois. Pensez à analyser vos charts restants.', type:'announcement', priority:'normal', plan:'' },
              { title:'🎉 Nouvelle fonctionnalité', msg:'Les horloges des marchés mondiaux sont maintenant disponibles sur votre dashboard. Découvrez-les !', type:'success', priority:'normal', plan:'' },
            ].map((tpl,i) => (
              <button key={i} onClick={()=>setForm(f=>({...f, title:tpl.title, message:tpl.msg, type:tpl.type, priority:tpl.priority, target_plan:tpl.plan}))}
                style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:6, padding:'0.75rem', textAlign:'left', cursor:'pointer', transition:'background .15s' }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='var(--bg3)'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='var(--bg2)'}>
                <div style={{ fontFamily:HUD, fontSize:9, color:'var(--tx0)', marginBottom:4 }}>{tpl.title}</div>
                <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)', lineHeight:1.4 }}>{tpl.msg.slice(0,60)}...</div>
                {tpl.plan && <div style={{ fontFamily:HUD, fontSize:7, color:'var(--ac)', marginTop:4 }}>→ Plan {tpl.plan.toUpperCase()} uniquement</div>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sous-composant Abonnements ─────────────────────────
function SubscriptionsPanel({ token }: { token: string }) {
  const [subs, setSubs]   = useState<unknown[]>([])
  const [mrr,  setMrr]    = useState({ pro: 0, elite: 0, total: 0 })
  const [status, setStatus] = useState('active')

  useEffect(() => {
    fetch(`/api/admin/subscriptions?status=${status}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(j => {
      if (j.success) { setSubs(j.data); setMrr(j.mrr) }
    })
  }, [token, status])

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { l: 'MRR PRO',   v: mrr.pro,   c: '#00FFB2' },
          { l: 'MRR ELITE', v: mrr.elite, c: '#C9A84C' },
          { l: 'MRR TOTAL', v: mrr.total, c: '#FF3A5C' },
        ].map(m => (
          <div key={m.l} style={{ background: '#06090F', border: '1px solid rgba(0,255,178,0.08)', borderRadius: 8, padding: '1rem' }}>
            <div style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 2, color: 'rgba(232,244,248,0.3)', marginBottom: 6 }}>{m.l}</div>
            <div style={{ fontFamily: HUD, fontSize: 24, color: m.c, fontWeight: 900 }}>
              {m.v.toLocaleString('fr-FR')} <span style={{ fontSize: 12 }}>FCFA</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {['active','cancelled','expired','all'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            style={{
              padding: '7px 14px', borderRadius: 3, cursor: 'pointer',
              background: status === s ? 'rgba(255,58,92,0.1)' : 'transparent',
              border: `1px solid ${status === s ? 'rgba(255,58,92,0.3)' : 'rgba(232,244,248,0.08)'}`,
              color: status === s ? '#FF3A5C' : 'rgba(232,244,248,0.35)',
              fontFamily: HUD, fontSize: 9, letterSpacing: 1,
            }}>
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ background: '#06090F', border: '1px solid rgba(0,255,178,0.08)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px 140px', padding: '10px 16px', background: '#0A0F1A', borderBottom: '1px solid rgba(0,255,178,0.06)' }}>
          {['UTILISATEUR','PLAN','MONTANT','STATUT','FIN PÉRIODE'].map(h => (
            <span key={h} style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 2, color: 'rgba(232,244,248,0.25)' }}>{h}</span>
          ))}
        </div>
        {(subs as Record<string, unknown>[]).map((s, i) => {
          const profile = s.profiles as Record<string, string> | null
          const statusColors: Record<string, string> = { active:'#00FFB2', cancelled:'#FF3A5C', expired:'#888', past_due:'#C9A84C' }
          const status = String(s.status)
          return (
            <div key={String(s.id)} style={{
              display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px 140px',
              padding: '11px 16px', borderBottom: '1px solid rgba(0,255,178,0.04)',
              background: i % 2 === 0 ? 'transparent' : 'rgba(0,255,178,0.01)', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontFamily: HUD, fontSize: 11, color: '#E8F4F8' }}>{profile?.full_name ?? '—'}</div>
                <div style={{ fontFamily: BODY, fontSize: 12, color: 'rgba(232,244,248,0.3)' }}>{profile?.email ?? ''}</div>
              </div>
              <span style={{ fontFamily: HUD, fontSize: 10, color: PLAN_C[String(s.plan)] ?? '#888' }}>{String(s.plan).toUpperCase()}</span>
              <span style={{ fontFamily: HUD, fontSize: 10, color: '#C9A84C' }}>{Number(s.amount).toLocaleString('fr-FR')}</span>
              <span style={{ fontFamily: HUD, fontSize: 9, color: statusColors[status] ?? '#888' }}>{status.toUpperCase()}</span>
              <span style={{ fontFamily: BODY, fontSize: 12, color: 'rgba(232,244,248,0.3)' }}>
                {s.current_period_end ? new Date(String(s.current_period_end)).toLocaleDateString('fr-FR') : '—'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Sous-composant Logs ────────────────────────────────
function LogsPanel({ token }: { token: string }) {
  const [logs, setLogs] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    // Fetch depuis Supabase directement
    import('@/lib/supabase').then(({ supabasePublic }) => {
      supabasePublic
        .from('admin_logs')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(100)
        .then(({ data }) => { if (data) setLogs(data as Record<string, unknown>[]) })
    })
  }, [token])

  const ACTION_COLORS: Record<string, string> = {
    upgrade: '#00FFB2', downgrade: '#888', toggle_admin: '#FF3A5C',
    reset_quota: '#00D4FF', delete: '#FF3A5C', broadcast: '#C9A84C',
  }

  return (
    <div style={{ background: '#06090F', border: '1px solid rgba(0,255,178,0.08)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', background: '#0A0F1A', borderBottom: '1px solid rgba(0,255,178,0.06)', fontFamily: HUD, fontSize: 9, letterSpacing: 2, color: 'rgba(232,244,248,0.3)' }}>
        AUDIT TRAIL — 100 DERNIÈRES ACTIONS
      </div>
      {logs.map((log, i) => {
        const profile = log.profiles as Record<string, string> | null
        const action  = String(log.action)
        return (
          <div key={String(log.id)} style={{
            display: 'grid', gridTemplateColumns: '140px 120px 1fr 160px',
            padding: '10px 16px', borderBottom: '1px solid rgba(0,255,178,0.04)',
            background: i % 2 === 0 ? 'transparent' : 'rgba(0,255,178,0.01)',
            alignItems: 'center',
          }}>
            <span style={{ fontFamily: HUD, fontSize: 9, color: ACTION_COLORS[action] ?? '#888', letterSpacing: 1 }}>{action.toUpperCase()}</span>
            <span style={{ fontFamily: BODY, fontSize: 12, color: 'rgba(232,244,248,0.4)' }}>{profile?.email ?? '—'}</span>
            <span style={{ fontFamily: BODY, fontSize: 12, color: 'rgba(232,244,248,0.5)' }}>
              {log.target_type ? `${log.target_type}: ${log.target_id}` : '—'}
            </span>
            <span style={{ fontFamily: BODY, fontSize: 11, color: 'rgba(232,244,248,0.25)', textAlign: 'right' }}>
              {new Date(String(log.created_at)).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
            </span>
          </div>
        )
      })}
      {logs.length === 0 && (
        <div style={{ padding: '3rem', textAlign: 'center', fontFamily: HUD, fontSize: 10, color: 'rgba(232,244,248,0.2)', letterSpacing: 3 }}>
          AUCUNE ACTION ENREGISTRÉE
        </div>
      )}
    </div>
  )
}

// ─── Diagnostic GeniusPay ─────────────────────────────────
function GeniusPayDiag({ token }: { token: string }) {
  const HUD  = "'Orbitron', monospace"
  const BODY = "'Rajdhani', sans-serif"
  const [result, setResult] = useState<Record<string,unknown>|null>(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/payment-test', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      setResult(json)
    } catch(e) {
      setResult({ status: '❌ Erreur réseau', error: String(e) })
    }
    setLoading(false)
  }

  const s = result?.geniuspay_test as Record<string,unknown>|undefined
  const httpOk = s?.http_ok === true
  const env = result?.env as Record<string,string>|undefined

  return (
    <div style={{ marginTop:'2rem', background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.25rem' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', flexWrap:'wrap', gap:10 }}>
        <div style={{ fontFamily:HUD, fontSize:11, color:'var(--ac)', letterSpacing:1 }}>⚡ DIAGNOSTIC GENIUSPAY</div>
        <button onClick={run} disabled={loading}
          style={{ fontFamily:HUD, fontSize:9, letterSpacing:1, background:loading?'var(--bd)':'var(--ac)', color:'#020408', border:'none', borderRadius:4, padding:'8px 18px', cursor:loading?'wait':'pointer', fontWeight:700 }}>
          {loading ? 'TEST EN COURS...' : '▶ TESTER LA CONNEXION'}
        </button>
      </div>

      {result && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {/* Statut global */}
          <div style={{ fontFamily:BODY, fontSize:15, color: httpOk?'var(--ok)':'var(--red)', fontWeight:700 }}>
            {String(result.status ?? '')}
          </div>

          {/* Variables d'environnement */}
          {env && (
            <div style={{ background:'var(--bg1)', borderRadius:6, padding:'0.875rem', display:'grid', gridTemplateColumns:'auto 1fr', gap:'6px 16px', alignItems:'center' }}>
              <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--tx3)', gridColumn:'1/-1', marginBottom:4 }}>VARIABLES D'ENVIRONNEMENT</div>
              {Object.entries(env).map(([k,v]) => (
                <>
                  <span key={k+'k'} style={{ fontFamily:HUD, fontSize:8, color:'var(--tx3)' }}>{k}</span>
                  <span key={k+'v'} style={{ fontFamily:BODY, fontSize:13, color: v.startsWith('✅')?'var(--ok)':'var(--red)' }}>{v}</span>
                </>
              ))}
            </div>
          )}

          {/* Réponse GeniusPay */}
          {s && (
            <div style={{ background:'var(--bg1)', borderRadius:6, padding:'0.875rem' }}>
              <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--tx3)', marginBottom:8 }}>RÉPONSE GENIUSPAY</div>
              <div style={{ display:'flex', gap:10, marginBottom:8, flexWrap:'wrap' }}>
                <span style={{ fontFamily:HUD, fontSize:12, fontWeight:900, color: httpOk?'var(--ok)':'var(--red)' }}>HTTP {String(s.http_status)}</span>
                <span style={{ fontFamily:BODY, fontSize:12, color: httpOk?'var(--ok)':'var(--red)' }}>{httpOk?'✓ Succès':'✗ Échec'}</span>
              </div>
              <pre style={{ fontFamily:'monospace', fontSize:11, color:'var(--tx1)', background:'var(--bg2)', padding:'0.75rem', borderRadius:4, overflowX:'auto', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                {JSON.stringify(s.response, null, 2)}
              </pre>
            </div>
          )}

          {/* Instruction fix */}
          {result.fix && (
            <div style={{ background:'rgba(255,153,0,0.08)', border:'1px solid rgba(255,153,0,0.25)', borderRadius:6, padding:'0.875rem', fontFamily:BODY, fontSize:14, color:'var(--ora)', lineHeight:1.6 }}>
              💡 {String(result.fix)}
            </div>
          )}

          {/* URL checkout si OK */}
          {result.checkout_url && (
            <div style={{ background:'rgba(0,230,118,0.08)', border:'1px solid rgba(0,230,118,0.2)', borderRadius:6, padding:'0.875rem' }}>
              <div style={{ fontFamily:HUD, fontSize:8, color:'var(--ok)', marginBottom:4 }}>✅ CHECKOUT URL GÉNÉRÉE</div>
              <a href={String(result.checkout_url)} target="_blank" style={{ fontFamily:BODY, fontSize:12, color:'var(--ok)', wordBreak:'break-all' }}>{String(result.checkout_url)}</a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Trésorerie complète avec coûts Anthropic ──────────────
function TreasuryPanel({ token }: { token: string }) {
  const HUD  = "'Orbitron', monospace"
  const BODY = "'Rajdhani', sans-serif"

  type TData = {
    users: { total:number; free:number; pro:number; elite:number; new_7d:number }
    revenue: { mrr_xof:number; arr_xof:number; active_subs:number; pack_sales:number }
    anthropic: { cost_per_call_usd:number; cost_per_call_xof:number; total_calls:number; calls_this_month:number; calls_7d:number; total_cost_usd:number; total_cost_xof:number; month_cost_usd:number; month_cost_xof:number; refunds:number }
    credits: { total_issued:number; total_consumed:number; outstanding:number }
    margin: { net_profit_xof:number; percent:number }
    per_plan: Record<string, { price_xof:number; api_cost_xof:number; margin_xof:number; margin_pct:number }>
  }

  const [data, setData]       = useState<TData|null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const load = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/treasury', { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (!json.error) { setData(json); setLastRefresh(new Date()) }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const card = (label: string, value: string, sub: string, color: string, icon: string) => (
    <div key={label} style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.1rem', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, bottom:0, width:3, background:color }} />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)' }}>{label}</span>
        <i className={'ti '+icon} style={{ fontSize:15, color }} />
      </div>
      <div style={{ fontFamily:HUD, fontSize:18, fontWeight:900, color, lineHeight:1, marginBottom:4 }}>{value}</div>
      <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)' }}>{sub}</div>
    </div>
  )

  const fmt = (n: number) => n.toLocaleString('fr-FR')

  if (loading) return (
    <div style={{ textAlign:'center', padding:'4rem', fontFamily:HUD, fontSize:9, color:'var(--tx3)', letterSpacing:2 }}>
      CHARGEMENT TRÉSORERIE...
    </div>
  )

  if (!data) return <div style={{ color:'var(--red)', fontFamily:HUD, fontSize:10, padding:'2rem' }}>Erreur de chargement</div>

  const { users, revenue, anthropic, credits, margin, per_plan } = data

  const payingUsers   = users.pro + users.elite
  const convRate      = users.total > 0 ? Math.round((payingUsers / users.total) * 100) : 0
  const arpu          = revenue.active_subs > 0 ? Math.round(revenue.mrr_xof / revenue.active_subs) : 0

  // Projections (estimations avec 50 Pro + 10 Elite)
  const proj50pro10elite = {
    mrr: 50 * 17500 + 10 * 35000,
    apiCost: Math.round((50 * 150 + 10 * 600) * 6.2),
    net: 50 * 17500 + 10 * 35000 - Math.round((50 * 150 + 10 * 600) * 6.2),
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
      {/* En-tête */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div style={{ fontFamily:HUD, fontSize:13, color:'var(--ac3)', letterSpacing:2 }}>💰 TRÉSORERIE & COÛTS ANTHROPIC</div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)' }}>
            {anthropic.data_source === 'real_tokens'
              ? '✅ Données réelles (token tracking)'
              : '⚠️ Estimation console ($0.80 saisi manuellement)'}
          </span>
          <button onClick={load} disabled={loading}
            style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, background:'var(--bg2)', border:'1px solid var(--bd)', color:'var(--ac)', borderRadius:4, padding:'6px 14px', cursor:'pointer' }}>
            ↻ ACTUALISER
          </button>
        </div>
      </div>

      {/* ── GAUGE BUDGET ANTHROPIC ───────────────────────────── */}
      <div style={{ background:'var(--bg2)', border:`1px solid ${anthropic.budget_status==='ok'?'var(--bd2)':anthropic.budget_status==='warning'?'rgba(255,153,0,0.35)':'rgba(220,38,38,0.4)'}`, borderRadius:12, padding:'1.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div>
            <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'var(--tx3)', marginBottom:6 }}>⚡ BUDGET ANTHROPIC API</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:12 }}>
              <span style={{ fontFamily:HUD, fontSize:32, fontWeight:900, lineHeight:1,
                color: anthropic.budget_status==='ok' ? 'var(--ok)' : anthropic.budget_status==='warning' ? 'var(--ora)' : 'var(--red)' }}>
                ${anthropic.spent_usd.toFixed(2)}
              </span>
              <span style={{ fontFamily:HUD, fontSize:14, color:'var(--tx3)' }}>/ ${anthropic.budget_usd} $</span>
            </div>
            <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)', marginTop:4 }}>
              {fmt(Math.round(anthropic.spent_usd * (constants?.xof_per_usd ?? 620)))} FCFA dépensés ce mois
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:HUD, fontSize:22, fontWeight:900,
              color: anthropic.budget_status==='ok' ? 'var(--ok)' : anthropic.budget_status==='warning' ? 'var(--ora)' : 'var(--red)' }}>
              {anthropic.budget_pct.toFixed(1)}%
            </div>
            <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)' }}>utilisé</div>
            <div style={{ fontFamily:HUD, fontSize:10, color:'var(--ok)', marginTop:4 }}>
              ${anthropic.budget_remaining} restants
            </div>
          </div>
        </div>
        {/* Barre budget */}
        <div style={{ height:10, background:'var(--bd)', borderRadius:5, overflow:'hidden' }}>
          <div style={{
            height:'100%',
            width:`${anthropic.budget_pct}%`,
            background: anthropic.budget_status==='ok'
              ? 'linear-gradient(90deg,#00FFB2,#00D4FF)'
              : anthropic.budget_status==='warning'
              ? 'linear-gradient(90deg,#FF9900,#FFB74D)'
              : 'linear-gradient(90deg,#FF4466,#FF6B6B)',
            borderRadius:5, transition:'width 1s ease',
          }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
          <span style={{ fontFamily:HUD, fontSize:7, color:'var(--tx3)' }}>$0</span>
          <span style={{ fontFamily:HUD, fontSize:7, color: anthropic.budget_status==='warning'?'var(--ora)':'var(--tx3)' }}>⚠️ $250</span>
          <span style={{ fontFamily:HUD, fontSize:7, color:'var(--red)' }}>🚨 $400</span>
          <span style={{ fontFamily:HUD, fontSize:7, color:'var(--tx3)' }}>${anthropic.budget_usd}</span>
        </div>
        {/* Métriques détaillées tokens */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginTop:14 }}>
          {[
            { l:'COÛT/APPEL',   v:`$${(anthropic.avg_cost_per_call??0).toFixed(4)}`, s:'Coût réel moyen/analyse' },
            { l:'APPELS/MOIS',  v:fmt(anthropic.calls_month),                         s:`${fmt(anthropic.calls_7d)} cette semaine` },
            { l:'TOKENS INPUT', v:fmt(anthropic.total_input_tokens??0),               s:'Total cumulé' },
            { l:'TOKENS OUTPUT',v:fmt(anthropic.total_output_tokens??0),              s:'Total cumulé' },
          ].map(m => (
            <div key={m.l} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--bd)', borderRadius:7, padding:'8px 10px', textAlign:'center' }}>
              <div style={{ fontFamily:HUD, fontSize:6, letterSpacing:1, color:'var(--tx3)', marginBottom:4 }}>{m.l}</div>
              <div style={{ fontFamily:HUD, fontSize:13, fontWeight:900, color:'var(--ora)' }}>{m.v}</div>
              <div style={{ fontFamily:BODY, fontSize:9, color:'var(--tx3)', marginTop:2 }}>{m.s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs revenus */}
      <div>
        <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'var(--tx3)', marginBottom:10 }}>📈 REVENUS</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10 }}>
          {card('MRR', `${fmt(revenue.mrr_xof)} FCFA`, 'Revenu mensuel récurrent', 'var(--ac)', 'ti-trending-up')}
          {card('ARR ESTIMÉ', `${fmt(revenue.arr_xof)} FCFA`, 'Revenu annuel projeté', 'var(--ac2)', 'ti-calendar-stats')}
          {card('ABONNEMENTS', String(revenue.active_subs), 'Comptes payants actifs', 'var(--ac3)', 'ti-crown')}
          {card('ARPU', arpu > 0 ? `${fmt(arpu)} FCFA` : '—', 'Revenu moyen/utilisateur', '#888', 'ti-user-dollar')}
        </div>
      </div>

      {/* Marge nette */}
      <div style={{ background:'var(--bg2)', border:`1px solid ${margin.percent >= 80?'var(--bd2)':margin.percent >= 50?'rgba(255,153,0,0.3)':'rgba(220,38,38,0.3)'}`, borderRadius:10, padding:'1.25rem' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'var(--tx3)', marginBottom:8 }}>📊 MARGE NETTE CE MOIS</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:12, flexWrap:'wrap' }}>
              <span style={{ fontFamily:HUD, fontSize:28, fontWeight:900, color: margin.net_profit_xof >= 0 ? 'var(--ok)' : 'var(--red)', lineHeight:1 }}>
                {margin.net_profit_xof >= 0 ? '+' : ''}{fmt(margin.net_profit_xof)} FCFA
              </span>
              <span style={{ fontFamily:HUD, fontSize:16, color: margin.percent >= 80 ? 'var(--ok)' : margin.percent >= 50 ? 'var(--ora)' : 'var(--red)' }}>
                {margin.percent}%
              </span>
            </div>
            <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)', marginTop:6 }}>
              {fmt(revenue.mrr_xof)} FCFA revenus — {fmt(anthropic.month_cost_xof)} FCFA coûts API
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--tx3)', marginBottom:4 }}>COÛT TOTAL PAR USER</div>
            <div style={{ fontFamily:HUD, fontSize:18, color:'var(--ora)' }}>
              {users.total > 0 ? `${(anthropic.month_cost_xof / users.total).toFixed(0)} FCFA` : '—'}
            </div>
            <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)' }}>par utilisateur ce mois</div>
          </div>
        </div>

        {/* Barre marge */}
        <div style={{ marginTop:14, height:8, background:'var(--bd)', borderRadius:4, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${Math.max(0, Math.min(100, margin.percent))}%`, background: margin.percent >= 80 ? 'var(--ok)' : margin.percent >= 50 ? 'var(--ora)' : 'var(--red)', borderRadius:4, transition:'width 1s' }} />
        </div>
      </div>

      {/* Économie par plan */}
      <div>
        <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'var(--tx3)', marginBottom:10 }}>💎 ÉCONOMIE PAR PLAN (coût API max si tous crédits utilisés)</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:10 }}>
          {[
            { key:'free',  label:'FREE',  color:'#888',        users:users.free },
            { key:'pro',   label:'PRO',   color:'var(--ac)',   users:users.pro  },
            { key:'elite', label:'ELITE', color:'var(--ac3)',  users:users.elite },
          ].map(({ key, label, color, users: count }) => {
            const p = per_plan[key]
            if (!p) return null
            return (
              <div key={key} style={{ background:'var(--bg2)', border:`1px solid color-mix(in srgb, ${color} 20%, var(--bd))`, borderRadius:10, padding:'1.1rem' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <span style={{ fontFamily:HUD, fontSize:10, letterSpacing:1, color, fontWeight:900 }}>{label}</span>
                  <span style={{ fontFamily:HUD, fontSize:8, color:'var(--tx3)' }}>{count} users</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)' }}>Prix</span>
                    <span style={{ fontFamily:HUD, fontSize:10, color:'var(--tx0)' }}>{p.price_xof > 0 ? `${fmt(p.price_xof)} FCFA` : 'Gratuit'}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)' }}>Coût API max</span>
                    <span style={{ fontFamily:HUD, fontSize:10, color:'var(--red)' }}>−{fmt(p.api_cost_xof)} FCFA</span>
                  </div>
                  <div style={{ height:1, background:'var(--bd)', margin:'2px 0' }} />
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)' }}>Marge nette</span>
                    <span style={{ fontFamily:HUD, fontSize:11, fontWeight:900, color: p.margin_xof >= 0 ? 'var(--ok)' : 'var(--red)' }}>
                      {p.margin_xof >= 0 ? '+' : ''}{fmt(p.margin_xof)} FCFA
                    </span>
                  </div>
                  <div style={{ height:5, background:'var(--bd)', borderRadius:3, overflow:'hidden', marginTop:4 }}>
                    <div style={{ height:'100%', width:`${Math.max(0,p.margin_pct)}%`, background: p.margin_pct >= 80 ? 'var(--ok)' : 'var(--ora)', borderRadius:3 }} />
                  </div>
                  <div style={{ textAlign:'right', fontFamily:HUD, fontSize:9, color: p.margin_pct >= 80 ? 'var(--ok)' : 'var(--ora)' }}>
                    {p.margin_pct > 0 ? `${p.margin_pct}% de marge` : 'Coût acquisition'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Crédits & utilisateurs */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {/* Crédits */}
        <div style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.1rem' }}>
          <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'var(--tx3)', marginBottom:12 }}>🪙 CRÉDITS</div>
          {[
            { l:'Émis au total',   v: fmt(credits.total_issued),   c:'var(--ac)' },
            { l:'Consommés',       v: fmt(credits.total_consumed), c:'var(--ora)' },
            { l:'Soldes restants', v: fmt(credits.outstanding),    c:'var(--ac2)' },
            { l:'Packs vendus',    v: String(revenue.pack_sales),  c:'var(--ac3)' },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)' }}>{l}</span>
              <span style={{ fontFamily:HUD, fontSize:10, color:c }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Utilisateurs */}
        <div style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.1rem' }}>
          <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'var(--tx3)', marginBottom:12 }}>👥 UTILISATEURS</div>
          {[
            { l:'Free',           v: `${users.free}`,        c:'#888' },
            { l:'Pro',            v: `${users.pro}`,         c:'var(--ac)' },
            { l:'Elite',          v: `${users.elite}`,       c:'var(--ac3)' },
            { l:'Taux conversion',v: `${convRate}%`,         c:'var(--ac2)' },
            { l:'Nouveaux 7j',    v: `+${users.new_7d}`,     c:'var(--ok)' },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)' }}>{l}</span>
              <span style={{ fontFamily:HUD, fontSize:10, color:c }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Projection */}
      <div style={{ background:'color-mix(in srgb, var(--ac) 4%, transparent)', border:'1px solid color-mix(in srgb, var(--ac) 20%, transparent)', borderRadius:10, padding:'1.25rem' }}>
        <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'var(--ac)', marginBottom:12 }}>🚀 PROJECTION — 50 PRO + 10 ELITE</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10 }}>
          {[
            { l:'MRR projeté',   v:`${fmt(proj50pro10elite.mrr)} FCFA`,     c:'var(--ac)' },
            { l:'Coût API/mois', v:`${fmt(proj50pro10elite.apiCost)} FCFA`, c:'var(--ora)' },
            { l:'Profit net',    v:`${fmt(proj50pro10elite.net)} FCFA`,     c:'var(--ok)' },
            { l:'Marge nette',   v:`${Math.round((1 - proj50pro10elite.apiCost/proj50pro10elite.mrr)*100)}%`, c:'var(--ok)' },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ background:'var(--bg1)', borderRadius:8, padding:'0.875rem' }}>
              <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:1, color:'var(--tx3)', marginBottom:4 }}>{l}</div>
              <div style={{ fontFamily:HUD, fontSize:15, fontWeight:900, color:c }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)', marginTop:10 }}>
          * Coût Anthropic 0,01 $/appel (6,2 FCFA). Pro = 150 crédits max/mois. Elite = 600 crédits max/mois.
        </div>
      </div>

      {/* Diagnostic GeniusPay */}
      <GeniusPayDiag token={token} />
    </div>
  )
}

// ─── Panneau Export ────────────────────────────────────────
function ExportPanel({ token }: { token: string }) {
  const HUD  = "'Orbitron', monospace"
  const BODY = "'Rajdhani', sans-serif"

  const [loading, setLoading] = useState<string | null>(null)
  const [lastExport, setLastExport] = useState<Record<string, string>>({})

  const download = async (type: string, format: 'csv' | 'json') => {
    const key = `${type}_${format}`
    setLoading(key)
    try {
      const res = await fetch(`/api/admin/export?type=${type}&format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) { alert('Erreur export'); setLoading(null); return }

      const blob     = await res.blob()
      const ext      = format === 'json' ? 'json' : 'csv'
      const filename = `profityx_${type}_${new Date().toISOString().slice(0,10)}.${ext}`
      const url      = URL.createObjectURL(blob)
      const a        = document.createElement('a')
      a.href = url; a.download = filename; a.click()
      URL.revokeObjectURL(url)
      setLastExport(prev => ({ ...prev, [key]: new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }) }))
    } catch { alert('Erreur réseau') }
    setLoading(null)
  }

  const EXPORTS = [
    {
      type: 'users',
      label: 'Utilisateurs',
      icon: 'ti-users',
      color: 'var(--ac)',
      desc: 'Profils complets : email, plan, streak, analyses, pays, broker, préférences',
      fields: ['public_id', 'email', 'plan', 'analyses_used', 'streak', 'xp', 'pays', 'inscription'],
    },
    {
      type: 'subscriptions',
      label: 'Abonnements',
      icon: 'ti-credit-card',
      color: 'var(--ac2)',
      desc: 'Tous les abonnements avec statut, montant, dates de période et référence paiement',
      fields: ['email', 'plan', 'statut', 'montant_fcfa', 'ref_paiement', 'debut', 'fin'],
    },
    {
      type: 'credits',
      label: 'Transactions crédits',
      icon: 'ti-coin',
      color: 'var(--ac3)',
      desc: 'Historique complet des mouvements de crédits avec coût Anthropic calculé',
      fields: ['email', 'montant', 'type', 'description', 'cout_usd', 'cout_fcfa', 'date'],
    },
    {
      type: 'analyses',
      label: 'Analyses charts',
      icon: 'ti-chart-candle',
      color: 'var(--ok)',
      desc: 'Toutes les analyses IA : paire, timeframe, direction, entrée, SL, TP, R/R',
      fields: ['email', 'paire', 'timeframe', 'direction', 'entree', 'sl', 'tp1', 'tp2', 'tp3'],
    },
    {
      type: 'treasury',
      label: 'Rapport trésorerie',
      icon: 'ti-report-money',
      color: 'var(--ora)',
      desc: 'Snapshot financier : MRR, ARR, coûts Anthropic réels, marge nette, crédits',
      fields: ['mrr_fcfa', 'arr_fcfa', 'coût_anthropic_usd', 'marge_nette_fcfa', 'appels_api'],
    },
  ]

  return (
    <div>
      <div style={{ fontFamily:HUD, fontSize:13, color:'var(--ac)', letterSpacing:2, marginBottom:'0.5rem' }}>
        📥 EXPORT DES DONNÉES
      </div>
      <div style={{ fontFamily:BODY, fontSize:13, color:'var(--tx3)', marginBottom:'1.5rem' }}>
        Téléchargez les données en CSV (Excel) ou JSON. Fichiers horodatés, encodés UTF-8.
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {EXPORTS.map(exp => (
          <div key={exp.type} style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.1rem', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            {/* Icône */}
            <div style={{ width:44, height:44, borderRadius:9, background:`color-mix(in srgb, ${exp.color} 10%, transparent)`, border:`1px solid color-mix(in srgb, ${exp.color} 20%, transparent)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <i className={'ti '+exp.icon} style={{ fontSize:20, color:exp.color }} />
            </div>

            {/* Info */}
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ fontFamily:HUD, fontSize:10, color:'var(--tx0)', letterSpacing:0.5, marginBottom:3 }}>{exp.label}</div>
              <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)', lineHeight:1.4, marginBottom:5 }}>{exp.desc}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {exp.fields.map(f => (
                  <span key={f} style={{ fontFamily:HUD, fontSize:7, letterSpacing:0.5, color:'var(--tx3)', background:'var(--bg3)', border:'1px solid var(--bd)', borderRadius:3, padding:'2px 6px' }}>{f}</span>
                ))}
              </div>
            </div>

            {/* Boutons */}
            <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end', flexShrink:0 }}>
              <div style={{ display:'flex', gap:8 }}>
                <button
                  onClick={() => download(exp.type, 'csv')}
                  disabled={loading === `${exp.type}_csv`}
                  style={{ display:'flex', alignItems:'center', gap:6, background:'var(--ac)', color:'#020408', border:'none', borderRadius:5, padding:'8px 14px', fontFamily:HUD, fontSize:8, letterSpacing:1, fontWeight:700, cursor:'pointer', opacity: loading === `${exp.type}_csv` ? 0.6 : 1 }}>
                  <i className="ti ti-file-spreadsheet" style={{ fontSize:13 }} />
                  {loading === `${exp.type}_csv` ? 'Export...' : 'CSV'}
                </button>
                <button
                  onClick={() => download(exp.type, 'json')}
                  disabled={loading === `${exp.type}_json`}
                  style={{ display:'flex', alignItems:'center', gap:6, background:'transparent', color:'var(--ac2)', border:'1px solid var(--bd2)', borderRadius:5, padding:'8px 14px', fontFamily:HUD, fontSize:8, letterSpacing:1, cursor:'pointer', opacity: loading === `${exp.type}_json` ? 0.6 : 1 }}>
                  <i className="ti ti-code" style={{ fontSize:13 }} />
                  {loading === `${exp.type}_json` ? 'Export...' : 'JSON'}
                </button>
              </div>
              {(lastExport[`${exp.type}_csv`] || lastExport[`${exp.type}_json`]) && (
                <div style={{ fontFamily:BODY, fontSize:10, color:'var(--ok)' }}>
                  ✓ Exporté à {lastExport[`${exp.type}_csv`] || lastExport[`${exp.type}_json`]}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <div style={{ marginTop:'1.25rem', background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:8, padding:'0.875rem', display:'flex', gap:10, alignItems:'flex-start' }}>
        <i className="ti ti-shield-lock" style={{ fontSize:16, color:'var(--ac)', flexShrink:0, marginTop:2 }} />
        <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)', lineHeight:1.6 }}>
          Les exports sont réservés aux administrateurs. Les données sensibles (mots de passe, tokens) ne sont jamais incluses. Fichiers conformes RGPD — traitez-les avec précaution.
        </div>
      </div>
    </div>
  )
}

// ─── Test Email Panel ──────────────────────────────────────
function EmailTestPanel({ token, showToast }: { token:string; showToast:(m:string,ok:boolean)=>void }) {
  const HUD  = "'Orbitron', monospace"
  const BODY = "'Rajdhani', sans-serif"
  const EDGE = `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://crlfkiniwalhzvpxrqav.supabase.co'}/functions/v1/send-email`

  const TEMPLATES = [
    { key:'welcome',        label:'🎉 Bienvenue',          desc:'Email inscription + 10 crédits' },
    { key:'plan_activated', label:'✅ Plan activé',         desc:'Confirmation paiement Pro/Elite' },
    { key:'low_credits',    label:'⚡ Crédits bas',         desc:'Alerte solde < 5 crédits' },
    { key:'referral',       label:'🎁 Parrainage accepté', desc:'+20 crédits au parrain' },
    { key:'reset',          label:'🔐 Mot de passe',        desc:'Reset password' },
    { key:'reactivation',   label:'📊 Réactivation',       desc:'Relance utilisateur inactif' },
  ]

  const [to,       setTo]       = useState('')
  const [name,     setName]     = useState('Yessiha')
  const [template, setTemplate] = useState('welcome')
  const [sending,  setSending]  = useState(false)
  const [lastResult, setLast]   = useState<string|null>(null)

  const send = async () => {
    if (!to) { showToast('Email destinataire requis', false); return }
    setSending(true); setLast(null)
    try {
      const res  = await fetch(EDGE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template,
          to,
          name,
          data: {
            url:     'https://profity-x.com',
            plan:    'pro',
            credits: '150',
            balance: '3',
          },
        }),
      })
      const json = await res.json()
      if (json.success) {
        showToast(`✅ Email "${template}" envoyé à ${to}`, true)
        setLast(`✅ MessageID: ${json.messageId}`)
      } else {
        showToast(`❌ ${json.error}`, false)
        setLast(`❌ Erreur: ${json.error}`)
      }
    } catch (e) {
      showToast('Erreur réseau', false)
      setLast(`❌ ${String(e)}`)
    }
    setSending(false)
  }

  const inp = { background:'var(--bg2)', border:'1px solid var(--bd)', color:'var(--tx0)', fontFamily:BODY, fontSize:14, padding:'9px 12px', borderRadius:4, width:'100%', boxSizing:'border-box' as const }
  const lbl = { fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--tx3)', marginBottom:5, display:'block' as const }

  return (
    <div style={{ marginTop:'2rem', background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.25rem' }}>
      <div style={{ fontFamily:HUD, fontSize:11, color:'var(--ac2)', letterSpacing:1, marginBottom:'1.25rem' }}>📧 TESTER LES EMAILS BREVO</div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:14 }}>
        {/* Formulaire */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <span style={lbl}>DESTINATAIRE</span>
            <input style={inp} value={to} onChange={e=>setTo(e.target.value)} placeholder="monweci@gmail.com" type="email" />
          </div>
          <div>
            <span style={lbl}>NOM</span>
            <input style={inp} value={name} onChange={e=>setName(e.target.value)} placeholder="Yessiha" />
          </div>
          <div>
            <span style={lbl}>TEMPLATE</span>
            <select style={inp} value={template} onChange={e=>setTemplate(e.target.value)}>
              {TEMPLATES.map(t => <option key={t.key} value={t.key}>{t.label} — {t.desc}</option>)}
            </select>
          </div>
          <button onClick={send} disabled={sending || !to}
            style={{ padding:'11px', borderRadius:6, border:'none', background:sending||!to?'var(--bd)':'var(--ac2)', color:sending||!to?'var(--tx3)':'#020408', fontFamily:HUD, fontSize:10, letterSpacing:2, fontWeight:700, cursor:sending?'wait':'pointer' }}>
            {sending ? '⏳ ENVOI...' : '📤 ENVOYER L\'EMAIL TEST'}
          </button>
          {lastResult && (
            <div style={{ fontFamily:BODY, fontSize:13, color:lastResult.startsWith('✅')?'var(--ok)':'var(--red)', padding:'8px 10px', background:'var(--bg1)', borderRadius:5 }}>
              {lastResult}
            </div>
          )}
        </div>

        {/* Templates disponibles */}
        <div>
          <span style={lbl}>TEMPLATES DISPONIBLES</span>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {TEMPLATES.map(t => (
              <button key={t.key} onClick={()=>setTemplate(t.key)}
                style={{ background:template===t.key?'color-mix(in srgb, var(--ac2) 10%, transparent)':'var(--bg1)', border:`1px solid ${template===t.key?'var(--ac2)':'var(--bd)'}`, borderRadius:6, padding:'8px 12px', textAlign:'left', cursor:'pointer' }}>
                <div style={{ fontFamily:HUD, fontSize:9, color:template===t.key?'var(--ac2)':'var(--tx1)', marginBottom:2 }}>{t.label}</div>
                <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)' }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
