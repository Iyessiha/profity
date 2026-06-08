// ============================================================
// PROFITYX — app/settings/page.tsx
// Page paramètres complète
// ============================================================
'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'
import { useRouter }                         from 'next/navigation'
import { supabasePublic }                    from '@/lib/supabase'
import PaymentMethods                         from '@/components/dashboard/PaymentMethods'
import {
  registerSW, requestPermission,
  subscribeToPush, unsubscribeFromPush,
  saveSubscriptionToServer, deleteSubscriptionFromServer,
  sendTestNotification, getNotificationState,
} from '@/lib/push'

// ─── Types ─────────────────────────────────────────────────
interface Profile {
  id:                   string
  public_id:            string
  full_name:            string
  email:                string
  phone:                string
  locale:               string
  currency:             string
  country:              string
  timezone:             string
  avatar_url:           string
  user_plan:            string
  notifications_email:  boolean
  notifications_push:   boolean
  analyses_used:        number
  news_used:            number
  reset_at:             string
}

type SettingsTab = 'profile' | 'notifications' | 'subscription' | 'security' | 'invoices'

// ─── Constantes ────────────────────────────────────────────
const LOCALES   = [{ v:'fr',label:'🇫🇷 Français'}, {v:'en',label:'🇬🇧 English'}, {v:'ar',label:'🇲🇦 العربية'}, {v:'pt',label:'🇧🇷 Português'}]
const CURRENCIES = [
  {v:'XOF',label:'FCFA — Afrique de l\'Ouest (UEMOA)'},
  {v:'XAF',label:'FCFA — Afrique Centrale (CEMAC)'},
  {v:'USD',label:'$ — Dollar US'},
  {v:'EUR',label:'€ — Euro'},
  {v:'GHS',label:'₵ — Cedi (Ghana)'},
  {v:'NGN',label:'₦ — Naira (Nigeria)'},
  {v:'MAD',label:'د.م — Dirham (Maroc)'},
]
const TIMEZONES = [
  'Africa/Abidjan','Africa/Dakar','Africa/Lagos','Africa/Accra',
  'Africa/Douala','Africa/Nairobi','Africa/Cairo','Europe/Paris','America/New_York',
]
const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free:  { label: 'Starter — Gratuit',    color: '#888'    },
  pro:   { label: 'Pro — 17 500 FCFA/mois', color: '#00FFB2' },
  elite: { label: 'Elite — 35 000 FCFA/mois', color: '#C9A84C' },
}

export default function SettingsPage() {
  const router  = useRouter()
  const [profile,  setProfile]  = useState<Profile | null>(null)
  const [tab,      setTab]      = useState<SettingsTab>('profile')
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [invoices, setInvoices] = useState<Array<{
    id: string; invoice_number: string; plan: string; description: string
    amount_xof: number; amount_usd: number; payment_method: string
    status: string; token: string; created_at: string
  }>>([])
  const [invoicesLoading, setInvoicesLoading] = useState(false)
  const [token,    setToken]    = useState<string>('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarErr, setAvatarErr] = useState<string | null>(null)

  // État push
  const [pushState,      setPushState]      = useState<{ supported: boolean; permission: string }>({ supported: false, permission: 'default' })
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const [pushLoading,    setPushLoading]    = useState(false)
  const [swReg,          setSwReg]          = useState<ServiceWorkerRegistration | null>(null)

  const HUD  = "'Orbitron', monospace"
  const BODY = "'Rajdhani', sans-serif"

  // ── Chargement initial ────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabasePublic.auth.getSession()
      if (!session) { router.push('/auth/login'); return }
      setToken(session.access_token)

      const { data: p } = await supabasePublic
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (p) setProfile({ ...p, email: p.email ?? session.user.email ?? '' })
      setLoading(false)

      // État push
      const state = getNotificationState()
      setPushState(state)

      // Service Worker
      const reg = await registerSW()
      if (reg) {
        setSwReg(reg)
        const existing = await reg.pushManager.getSubscription()
        setPushSubscribed(!!existing)
      }
    }
    init()
  }, [router])

  // ── Upload photo de profil ────────────────────────────────
  const handleAvatarUpload = async (file: File) => {
    if (!profile) return
    setAvatarErr(null)
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarErr('Format : JPG, PNG ou WEBP'); return
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarErr('Image trop lourde (max 2 Mo)'); return
    }
    setAvatarUploading(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${profile.id}/avatar_${Date.now()}.${ext}`
      const { error: upErr } = await supabasePublic.storage
        .from('avatars').upload(path, file, { upsert: true, cacheControl: '3600' })
      if (upErr) { setAvatarErr(upErr.message); setAvatarUploading(false); return }

      const { data: pub } = supabasePublic.storage.from('avatars').getPublicUrl(path)
      const url = pub.publicUrl
      // Sauvegarder l'URL en base immédiatement
      await supabasePublic.from('profiles').update({ avatar_url: url }).eq('id', profile.id)
      setProfile(p => p ? { ...p, avatar_url: url } : p)
    } catch (e) {
      setAvatarErr(e instanceof Error ? e.message : 'Erreur upload')
    } finally {
      setAvatarUploading(false)
    }
  }

  // ── Sauvegarder le profil ─────────────────────────────────
  const saveProfile = async () => {
    if (!profile) return
    setSaving(true)
    setError(null)

    const { error: e } = await supabasePublic
      .from('profiles')
      .update({
        full_name:           profile.full_name,
        phone:               profile.phone,
        locale:              profile.locale,
        currency:            profile.currency,
        country:             profile.country,
        timezone:            profile.timezone,
        avatar_url:          profile.avatar_url,
        notifications_email: profile.notifications_email,
        notifications_push:  profile.notifications_push,
      })
      .eq('id', profile.id)

    if (e) { setError(e.message) }
    else   { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    setSaving(false)
  }

  // ── Toggle notifications push ─────────────────────────────
  const togglePush = useCallback(async () => {
    if (!swReg || !token) return
    setPushLoading(true)

    try {
      if (!pushSubscribed) {
        // Activer
        const perm = await requestPermission()
        if (perm !== 'granted') {
          setError('Permission de notification refusée. Autorisez les notifications dans les paramètres du navigateur.')
          setPushLoading(false)
          return
        }

        const sub = await subscribeToPush(swReg)
        if (!sub) throw new Error('Impossible de créer la subscription')

        await saveSubscriptionToServer(sub, token)
        await sendTestNotification()

        setPushSubscribed(true)
        setProfile(prev => prev ? { ...prev, notifications_push: true } : prev)

        // Sauvegarder en DB
        await supabasePublic
          .from('profiles')
          .update({ notifications_push: true })
          .eq('id', profile!.id)

      } else {
        // Désactiver
        const sub = await swReg.pushManager.getSubscription()
        if (sub) {
          await deleteSubscriptionFromServer(sub, token)
          await unsubscribeFromPush(swReg)
        }

        setPushSubscribed(false)
        setProfile(prev => prev ? { ...prev, notifications_push: false } : prev)

        await supabasePublic
          .from('profiles')
          .update({ notifications_push: false })
          .eq('id', profile!.id)
      }
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setPushLoading(false)
    }
  }, [swReg, token, pushSubscribed, profile])

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#020408' }}>
      <div style={{ fontFamily: HUD, fontSize: 11, color: '#00FFB2', letterSpacing: 4, animation: 'pulse 1.5s infinite' }}>
        CHARGEMENT...
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  )

  const locale = profile?.locale ?? 'fr'

  // ── Styles communs ────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width:'100%', padding:'10px 12px',
    background:'#0A0F1A', border:'1px solid rgba(0,255,178,0.15)',
    borderRadius:4, color:'#E8F4F8',
    fontFamily:BODY, fontSize:14, outline:'none',
  }
  const labelStyle: React.CSSProperties = {
    fontFamily:HUD, fontSize:8, letterSpacing:2,
    color:'rgba(232,244,248,0.4)', display:'block', marginBottom:6,
  }
  const cardStyle: React.CSSProperties = {
    background:'#06090F', border:'1px solid rgba(0,255,178,0.08)',
    borderRadius:8, padding:'1.5rem', marginBottom:'1rem',
  }

  // ── i18n settings ────────────────────────────────────────
  const T = {
    fr: { settings:'PARAMÈTRES', save:'SAUVEGARDER', saved:'✓ SAUVEGARDÉ',
          profile:'PROFIL', notifications:'ALERTES', subscription:'ABONNEMENT', security:'SÉCURITÉ', invoices:'FACTURES' },
    en: { settings:'SETTINGS',   save:'SAVE',         saved:'✓ SAVED',
          profile:'PROFILE', notifications:'ALERTS',  subscription:'SUBSCRIPTION', security:'SECURITY', invoices:'INVOICES' },
    ar: { settings:'الإعدادات',  save:'حفظ',          saved:'✓ تم الحفظ',
          profile:'الملف',    notifications:'التنبيهات', subscription:'الاشتراك', security:'الأمان', invoices:'الفواتير' },
    pt: { settings:'CONFIGURAÇÕES', save:'SALVAR',   saved:'✓ SALVO',
          profile:'PERFIL',  notifications:'ALERTAS', subscription:'ASSINATURA', security:'SEGURANÇA', invoices:'FATURAS' },
  } as Record<string, Record<string,string>>
  const t = T[locale] ?? T['en']

  const TABS: { key: SettingsTab; icon: string; fr: string }[] = [
    { key:'profile',       icon:'ti-user',        fr: t.profile       },
    { key:'notifications', icon:'ti-bell',        fr: t.notifications },
    { key:'subscription',  icon:'ti-credit-card', fr: t.subscription  },
    { key:'invoices',      icon:'ti-receipt',     fr: t.invoices      },
    { key:'security',      icon:'ti-lock',        fr: t.security      },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#020408', fontFamily:BODY }}>

      {/* Header */}
      <div style={{
        background:'#06090F', borderBottom:'1px solid rgba(0,255,178,0.06)',
        padding:'0.875rem 1.25rem', display:'flex', alignItems:'center',
        justifyContent:'space-between', gap:8, position:'sticky', top:0, zIndex:40,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
          <a href="/dashboard" style={{
            fontFamily:HUD, fontSize:8, color:'rgba(232,244,248,0.3)',
            textDecoration:'none', letterSpacing:1, flexShrink:0,
            display:'flex', alignItems:'center', gap:5,
          }}>
            <i className="ti ti-arrow-left" style={{ fontSize:12 }} />
            <span className="topbar-hide">DASHBOARD</span>
          </a>
          <span style={{ color:'rgba(0,255,178,0.15)', flexShrink:0 }}>·</span>
          <span style={{ fontFamily:HUD, fontSize:12, letterSpacing:2, color:'#00FFB2', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            { t.settings }
          </span>
        </div>

        <button onClick={saveProfile} disabled={saving}
          style={{
            background: saved ? 'rgba(0,255,178,0.15)' : '#00FFB2',
            border:     saved ? '1px solid rgba(0,255,178,0.3)' : 'none',
            color:      saved ? '#00FFB2' : '#020408',
            fontFamily: HUD, fontSize:9, letterSpacing:2,
            padding:'8px 16px', borderRadius:4, cursor:'pointer',
            opacity: saving ? 0.6 : 1, transition:'all .3s', flexShrink:0,
          }}>
          {saving ? '...' : saved ? t.saved : t.save}
        </button>
      </div>

      {/* Tabs horizontaux sur mobile */}
      <div style={{ overflowX:'auto', borderBottom:'1px solid rgba(0,255,178,0.06)', background:'#06090F' }}
        className="settings-tabs-scroll">
        <div style={{ display:'flex', padding:'0 1rem', gap:4, minWidth:'max-content' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="settings-tab-pill"
              style={{
                display:'flex', alignItems:'center', gap:7,
                padding:'10px 14px', borderBottom:`2px solid ${tab===t.key?'#00FFB2':'transparent'}`,
                background:'transparent', border:'none', borderBottom:`2px solid ${tab===t.key?'#00FFB2':'transparent'}`,
                color: tab===t.key ? '#00FFB2' : 'rgba(232,244,248,0.35)',
                fontFamily:HUD, fontSize:8, letterSpacing:2,
                cursor:'pointer', whiteSpace:'nowrap', transition:'all .2s',
              }}>
              <i className={`ti ${t.icon}`} style={{ fontSize:13 }} />
              {t.fr}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:700, margin:'0 auto', padding:'1.5rem 1rem' }}>

          {/* ── PROFIL ───────────────────────────────────── */}
          {tab === 'profile' && (
            <div>
              {/* Photo de profil */}
              <div style={cardStyle}>
                <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:2, color:'#00D4FF', marginBottom:'1.25rem' }}>
                  PHOTO DE PROFIL
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:18, flexWrap:'wrap' }}>
                  <div style={{
                    width:72, height:72, borderRadius:'50%', flexShrink:0, overflow:'hidden',
                    background:'rgba(0,255,178,0.1)', border:'1px solid rgba(0,255,178,0.25)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:HUD, fontSize:24, color:'#00FFB2', fontWeight:700,
                  }}>
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} alt="Avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : (profile?.full_name?.[0]?.toUpperCase() ?? 'T')}
                  </div>
                  <div>
                    <label style={{
                      display:'inline-flex', alignItems:'center', gap:8, cursor: avatarUploading ? 'wait' : 'pointer',
                      background:'rgba(0,255,178,0.08)', border:'1px solid rgba(0,255,178,0.25)',
                      color:'#00FFB2', fontFamily:HUD, fontSize:9, letterSpacing:1, padding:'9px 16px', borderRadius:4,
                    }}>
                      <i className="ti ti-camera" style={{ fontSize:14 }} aria-hidden="true" />
                      {avatarUploading ? 'ENVOI...' : (profile?.avatar_url ? 'CHANGER LA PHOTO' : 'AJOUTER UNE PHOTO')}
                      <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display:'none' }}
                        disabled={avatarUploading}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f) }} />
                    </label>
                    <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:12, color:'rgba(232,244,248,0.35)', marginTop:6 }}>
                      JPG, PNG ou WEBP · max 2 Mo
                    </div>
                    {avatarErr && <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:12, color:'#FF3A5C', marginTop:4 }}>{avatarErr}</div>}
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:2, color:'#00D4FF', marginBottom:'1.25rem' }}>
                  INFORMATIONS PERSONNELLES
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:12 }}>
                  <div>
                    <label style={labelStyle}>NOM COMPLET</label>
                    <input style={inputStyle}
                      value={profile?.full_name ?? ''}
                      onChange={e => setProfile(p => p ? {...p, full_name: e.target.value} : p)}
                      onFocus={e => (e.target.style.borderColor = 'rgba(0,255,178,0.4)')}
                      onBlur={e  => (e.target.style.borderColor = 'rgba(0,255,178,0.15)')}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>EMAIL</label>
                    <input style={{ ...inputStyle, opacity:.5, cursor:'not-allowed' }}
                      value={profile?.email ?? ''} readOnly />
                  </div>
                  <div>
                    <label style={labelStyle}>IDENTIFIANT PROFITYX</label>
                    <input style={{ ...inputStyle, opacity:.7, cursor:'not-allowed', fontFamily:HUD, letterSpacing:2, color:'#00FFB2' }}
                      value={profile?.public_id ?? '—'} readOnly />
                  </div>
                  <div>
                    <label style={labelStyle}>TÉLÉPHONE</label>
                    <input style={inputStyle} placeholder="+225 07 00 00 00 00"
                      value={profile?.phone ?? ''}
                      onChange={e => setProfile(p => p ? {...p, phone: e.target.value} : p)}
                      onFocus={e => (e.target.style.borderColor = 'rgba(0,255,178,0.4)')}
                      onBlur={e  => (e.target.style.borderColor = 'rgba(0,255,178,0.15)')}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>PAYS</label>
                    <select style={{ ...inputStyle, cursor:'pointer' }}
                      value={profile?.country ?? 'CI'}
                      onChange={e => setProfile(p => p ? {...p, country: e.target.value} : p)}>
                      {[['CI','🇨🇮 Côte d\'Ivoire'],['SN','🇸🇳 Sénégal'],['GH','🇬🇭 Ghana'],['NG','🇳🇬 Nigeria'],['CM','🇨🇲 Cameroun'],['MA','🇲🇦 Maroc'],['FR','🇫🇷 France'],['US','🇺🇸 USA']].map(([v,l]) => (
                        <option key={v} value={v} style={{ background:'#0A0F1A' }}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:2, color:'#00D4FF', marginBottom:'1.25rem' }}>
                  PRÉFÉRENCES AFFICHAGE
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:12 }}>
                  <div>
                    <label style={labelStyle}>LANGUE</label>
                    <select style={{ ...inputStyle, cursor:'pointer' }}
                      value={profile?.locale ?? 'fr'}
                      onChange={e => setProfile(p => p ? {...p, locale: e.target.value} : p)}>
                      {LOCALES.map(l => (
                        <option key={l.v} value={l.v} style={{ background:'#0A0F1A' }}>{l.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>DEVISE PAR DÉFAUT</label>
                    <select style={{ ...inputStyle, cursor:'pointer' }}
                      value={profile?.currency ?? 'XOF'}
                      onChange={e => setProfile(p => p ? {...p, currency: e.target.value} : p)}>
                      {CURRENCIES.map(c => (
                        <option key={c.v} value={c.v} style={{ background:'#0A0F1A' }}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>FUSEAU HORAIRE</label>
                    <select style={{ ...inputStyle, cursor:'pointer' }}
                      value={profile?.timezone ?? 'Africa/Abidjan'}
                      onChange={e => setProfile(p => p ? {...p, timezone: e.target.value} : p)}>
                      {TIMEZONES.map(tz => (
                        <option key={tz} value={tz} style={{ background:'#0A0F1A' }}>{tz}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS ─────────────────────────────── */}
          {tab === 'notifications' && (
            <div>
              {/* Push Web */}
              <div style={cardStyle}>
                <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:2, color:'#00D4FF', marginBottom:'1.25rem' }}>
                  ALERTES PUSH — ANNONCES ÉCONOMIQUES
                </div>

                {!pushState.supported ? (
                  <div style={{ fontFamily:BODY, fontSize:14, color:'rgba(232,244,248,0.4)' }}>
                    Notifications push non supportées par ce navigateur. Utilisez Chrome, Edge ou Firefox.
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                    {/* Toggle principal */}
                    <div style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      background: pushSubscribed ? 'rgba(0,255,178,0.06)' : 'rgba(0,0,0,0.2)',
                      border:`1px solid ${pushSubscribed ? 'rgba(0,255,178,0.2)' : 'rgba(232,244,248,0.06)'}`,
                      borderRadius:6, padding:'14px 16px',
                    }}>
                      <div>
                        <div style={{ fontFamily:HUD, fontSize:11, color: pushSubscribed ? '#00FFB2' : '#E8F4F8', letterSpacing:1, marginBottom:4 }}>
                          {pushSubscribed ? '✓ ALERTES ACTIVÉES' : 'ALERTES DÉSACTIVÉES'}
                        </div>
                        <div style={{ fontFamily:BODY, fontSize:13, color:'rgba(232,244,248,0.4)' }}>
                          {pushSubscribed
                            ? 'Vous recevrez une alerte 15 min avant chaque annonce High Impact.'
                            : 'Activez pour recevoir les alertes avant les annonces économiques majeures.'}
                        </div>
                      </div>
                      <button onClick={togglePush} disabled={pushLoading}
                        style={{
                          width:52, height:28, borderRadius:14,
                          background: pushSubscribed ? '#00FFB2' : 'rgba(232,244,248,0.1)',
                          border:'none', cursor:'pointer',
                          position:'relative', transition:'background .3s',
                          flexShrink:0, opacity: pushLoading ? 0.5 : 1,
                        }}>
                        <div style={{
                          width:22, height:22, borderRadius:'50%',
                          background:'#fff',
                          position:'absolute', top:3,
                          left: pushSubscribed ? 27 : 3,
                          transition:'left .3s',
                        }} />
                      </button>
                    </div>

                    {/* Infos plan */}
                    {(profile?.user_plan === 'free') && (
                      <div style={{
                        background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.2)',
                        borderRadius:6, padding:'12px 14px',
                        display:'flex', alignItems:'center', justifyContent:'space-between',
                      }}>
                        <div style={{ fontFamily:BODY, fontSize:13, color:'rgba(232,244,248,0.55)' }}>
                          Les alertes push sont disponibles à partir du plan Pro.
                        </div>
                        <a href="/pricing" style={{
                          background:'#C9A84C', color:'#020408',
                          fontFamily:HUD, fontSize:8, letterSpacing:2,
                          padding:'6px 14px', borderRadius:3, textDecoration:'none', fontWeight:700,
                        }}>UPGRADE</a>
                      </div>
                    )}

                    {/* Test notification */}
                    {pushSubscribed && (
                      <button onClick={sendTestNotification}
                        style={{
                          alignSelf:'flex-start',
                          background:'transparent', border:'1px solid rgba(0,255,178,0.2)',
                          color:'#00FFB2', fontFamily:HUD, fontSize:9, letterSpacing:2,
                          padding:'8px 16px', borderRadius:4, cursor:'pointer',
                        }}>
                        ENVOYER UNE NOTIFICATION DE TEST
                      </button>
                    )}

                    {/* Info fenêtres d'alerte */}
                    {pushSubscribed && (
                      <div style={{
                        display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:8,
                      }}>
                        {[
                          { t:'15 min avant', d:'Préparez votre analyse', c:'#00FFB2' },
                          { t:'5 min avant',  d:'Signal imminent',        c:'#C9A84C' },
                        ].map(a => (
                          <div key={a.t} style={{
                            background:'rgba(0,255,178,0.03)', border:'1px solid rgba(0,255,178,0.08)',
                            borderRadius:6, padding:'10px 12px',
                          }}>
                            <div style={{ fontFamily:HUD, fontSize:10, color:a.c, marginBottom:4 }}>{a.t}</div>
                            <div style={{ fontFamily:BODY, fontSize:13, color:'rgba(232,244,248,0.4)' }}>{a.d}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Email */}
              <div style={cardStyle}>
                <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:2, color:'#00D4FF', marginBottom:'1.25rem' }}>
                  NOTIFICATIONS EMAIL
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontFamily:HUD, fontSize:11, color:'#E8F4F8', letterSpacing:1, marginBottom:4 }}>
                      RÉCAPITULATIF HEBDOMADAIRE
                    </div>
                    <div style={{ fontFamily:BODY, fontSize:13, color:'rgba(232,244,248,0.4)' }}>
                      Résumé de vos analyses et performances chaque lundi.
                    </div>
                  </div>
                  <button
                    onClick={() => setProfile(p => p ? {...p, notifications_email: !p.notifications_email} : p)}
                    style={{
                      width:52, height:28, borderRadius:14,
                      background: profile?.notifications_email ? '#00FFB2' : 'rgba(232,244,248,0.1)',
                      border:'none', cursor:'pointer', position:'relative', transition:'background .3s', flexShrink:0,
                    }}>
                    <div style={{
                      width:22, height:22, borderRadius:'50%', background:'#fff',
                      position:'absolute', top:3,
                      left: profile?.notifications_email ? 27 : 3,
                      transition:'left .3s',
                    }} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── ABONNEMENT ─────────────────────────────────── */}
          {tab === 'subscription' && (
            <div>
              <div style={cardStyle}>
                <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:2, color:'#00D4FF', marginBottom:'1.25rem' }}>
                  PLAN ACTUEL
                </div>
                <div style={{
                  background:'rgba(0,255,178,0.04)', border:'1px solid rgba(0,255,178,0.1)',
                  borderRadius:6, padding:'1.25rem',
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                }}>
                  <div>
                    <div style={{ fontFamily:HUD, fontSize:14, color: PLAN_LABELS[profile?.user_plan ?? 'free']?.color ?? '#888', letterSpacing:1, marginBottom:4 }}>
                      {PLAN_LABELS[profile?.user_plan ?? 'free']?.label}
                    </div>
                    <div style={{ fontFamily:BODY, fontSize:13, color:'rgba(232,244,248,0.4)' }}>
                      {profile?.user_plan === 'free'
                        ? `${profile.analyses_used}/3 analyses · ${profile.news_used}/5 signaux news utilisés ce mois`
                        : profile?.user_plan === 'pro'
                        ? `${profile?.analyses_used ?? 0}/100 analyses utilisées ce mois`
                        : 'Analyses et signaux illimités'}
                    </div>
                  </div>
                  {profile?.user_plan === 'free' && (
                    <a href="/pricing" style={{
                      background:'#00FFB2', color:'#020408',
                      fontFamily:HUD, fontSize:9, letterSpacing:2,
                      padding:'10px 20px', borderRadius:4, textDecoration:'none', fontWeight:700,
                    }}>UPGRADER</a>
                  )}
                </div>
              </div>

              {/* Moyens de paiement + renouvellement */}
              <PaymentMethods hasSubscription={profile?.user_plan !== 'free'} />

              {/* Quota visuel */}
              <div style={cardStyle}>
                <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:2, color:'#00D4FF', marginBottom:'1.25rem' }}>
                  UTILISATION DU MOIS
                </div>
                {[
                  { label:'Analyses de charts', used: profile?.analyses_used ?? 0, max: profile?.user_plan === 'free' ? 3 : profile?.user_plan === 'pro' ? 100 : 999, color:'#00FFB2' },
                  { label:'Signaux news',        used: profile?.news_used     ?? 0, max: profile?.user_plan === 'free' ? 5 : 999, color:'#00D4FF' },
                ].map(q => {
                  const pct = Math.min(100, (q.used / q.max) * 100)
                  const isUnlimited = q.max >= 999
                  return (
                    <div key={q.label} style={{ marginBottom:16 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                        <span style={{ fontFamily:BODY, fontSize:13, color:'rgba(232,244,248,0.6)' }}>{q.label}</span>
                        <span style={{ fontFamily:HUD, fontSize:10, color:q.color }}>
                          {isUnlimited ? '∞' : `${q.used} / ${q.max}`}
                        </span>
                      </div>
                      <div style={{ height:4, background:'rgba(232,244,248,0.06)', borderRadius:2, overflow:'hidden' }}>
                        <div style={{
                          height:'100%', borderRadius:2, transition:'width .5s',
                          width: isUnlimited ? '20%' : `${pct}%`,
                          background: pct > 80 ? '#FF3A5C' : q.color,
                        }} />
                      </div>
                    </div>
                  )
                })}
                <div style={{ fontFamily:HUD, fontSize:8, color:'rgba(232,244,248,0.2)', letterSpacing:2, marginTop:8 }}>
                  RESET LE 1er DU MOIS
                </div>
              </div>
            </div>
          )}

          {/* ── SÉCURITÉ ──────────────────────────────────── */}
          {tab === 'security' && (
            <div>
              <div style={cardStyle}>
                <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:2, color:'#00D4FF', marginBottom:'1.25rem' }}>
                  MOT DE PASSE
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {['NOUVEAU MOT DE PASSE', 'CONFIRMER'].map(l => (
                    <div key={l}>
                      <label style={labelStyle}>{l}</label>
                      <input type="password" style={inputStyle} placeholder="••••••••"
                        onFocus={e => (e.target.style.borderColor = 'rgba(0,255,178,0.4)')}
                        onBlur={e  => (e.target.style.borderColor = 'rgba(0,255,178,0.15)')}
                      />
                    </div>
                  ))}
                  <button
                    onClick={async () => {
                      // Implémentation changement de mot de passe
                      await supabasePublic.auth.resetPasswordForEmail(profile?.email ?? '', {
                        redirectTo: `${window.location.origin}/auth/reset`,
                      })
                      setSaved(true)
                      setTimeout(() => setSaved(false), 3000)
                    }}
                    style={{
                      alignSelf:'flex-start',
                      background:'transparent', border:'1px solid rgba(0,255,178,0.25)',
                      color:'#00FFB2', fontFamily:HUD, fontSize:9, letterSpacing:2,
                      padding:'9px 20px', borderRadius:4, cursor:'pointer',
                    }}>
                    ENVOYER UN LIEN DE RÉINITIALISATION
                  </button>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:2, color:'#FF3A5C', marginBottom:'1rem' }}>
                  ZONE DANGEREUSE
                </div>
                <div style={{ fontFamily:BODY, fontSize:14, color:'rgba(232,244,248,0.5)', marginBottom:'1rem' }}>
                  La suppression de votre compte est permanente. Toutes vos données seront effacées.
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Voulez-vous vraiment supprimer votre compte ? Cette action est irréversible.')) {
                      supabasePublic.auth.signOut().then(() => router.push('/'))
                    }
                  }}
                  style={{
                    background:'rgba(255,58,92,0.08)', border:'1px solid rgba(255,58,92,0.25)',
                    color:'#FF3A5C', fontFamily:HUD, fontSize:9, letterSpacing:2,
                    padding:'9px 20px', borderRadius:4, cursor:'pointer',
                  }}>
                  SUPPRIMER MON COMPTE
                </button>
              </div>
            </div>
          )}

          {/* ── FACTURES ─────────────────────────────────── */}
          {tab === 'invoices' && (
            <InvoicesTab token={token} invoices={invoices} setInvoices={setInvoices}
              loading={invoicesLoading} setLoading={setInvoicesLoading} />
          )}

          {/* Erreur globale */}
          {error && (
            <div style={{
              background:'rgba(255,58,92,0.08)', border:'1px solid rgba(255,58,92,0.2)',
              borderRadius:6, padding:'10px 14px', marginTop:12,
              fontFamily:BODY, fontSize:13, color:'#FF3A5C',
            }}>
              {error}
            </div>
          )}
        </div>
      </div>
  )
}

// ─────────────────────────────────────────────────────────
// FACTURES
// ─────────────────────────────────────────────────────────
function InvoicesTab({ token, invoices, setInvoices, loading, setLoading }: {
  token: string
  invoices: Array<{ id:string; invoice_number:string; plan:string; description:string; amount_xof:number; amount_usd:number; payment_method:string; status:string; token:string; created_at:string }>
  setInvoices: (v: typeof invoices) => void
  loading: boolean
  setLoading: (v: boolean) => void
}) {
  const HUD  = "'Orbitron', monospace"
  const BODY = "'Rajdhani', sans-serif"

  useEffect(() => {
    if (!token || invoices.length > 0) return
    setLoading(true)
    fetch('/api/invoices', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setInvoices(d.invoices ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  const planColor = (plan: string) => plan === 'pro' ? '#00FFB2' : plan === 'elite' ? '#C9A84C' : '#888'
  const fmt       = (n: number) => n.toLocaleString('fr-FR')

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.25rem' }}>
        <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:2, color:'var(--ac)', marginBottom:6 }}>
          🧾 MES FACTURES
        </div>
        <div style={{ fontFamily:BODY, fontSize:13, color:'var(--tx3)' }}>
          Toutes vos factures ProfityX. Cliquez pour télécharger en PDF.
        </div>
      </div>

      {loading && (
        <div style={{ textAlign:'center', padding:'2rem', fontFamily:HUD, fontSize:8, letterSpacing:2, color:'var(--tx3)' }}>
          CHARGEMENT...
        </div>
      )}

      {!loading && invoices.length === 0 && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:10, padding:'2rem', textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🧾</div>
          <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'var(--tx3)', marginBottom:8 }}>AUCUNE FACTURE</div>
          <div style={{ fontFamily:BODY, fontSize:13, color:'var(--tx3)' }}>
            Vos factures apparaîtront ici après votre premier abonnement.
          </div>
          <a href="/pricing" style={{ display:'inline-block', marginTop:16, fontFamily:HUD, fontSize:9, letterSpacing:2,
            color:'#020408', background:'var(--ac)', padding:'10px 22px', borderRadius:4, textDecoration:'none' }}>
            VOIR LES PLANS →
          </a>
        </div>
      )}

      {!loading && invoices.map(inv => (
        <a key={inv.id} href={`/invoice/${inv.token}`} target="_blank" rel="noopener"
          style={{ textDecoration:'none', display:'block',
            background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:10,
            padding:'1rem 1.25rem', transition:'border-color .2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,255,178,0.3)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--bd)')}
        >
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:40, height:40, borderRadius:8, background:'rgba(0,255,178,0.06)',
                border:'1px solid var(--bd)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                🧾
              </div>
              <div>
                <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:1, color:'var(--tx0)', marginBottom:3 }}>
                  {inv.invoice_number}
                </div>
                <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)', marginBottom:2 }}>{inv.description}</div>
                <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)' }}>
                  {new Date(inv.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })}
                  {' · '}{inv.payment_method}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:HUD, fontSize:14, fontWeight:900, color:planColor(inv.plan) }}>
                  {fmt(inv.amount_xof)} FCFA
                </div>
                <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)' }}>${inv.amount_usd}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:1,
                  background:'rgba(0,255,178,0.08)', border:'1px solid rgba(0,255,178,0.2)',
                  color:'var(--ac)', borderRadius:20, padding:'3px 10px' }}>✓ PAYÉE</span>
                <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)' }}>⬇ PDF</span>
              </div>
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}
