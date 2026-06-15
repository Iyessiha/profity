// ============================================================
// PROFITYX — /referral : page parrainage complète
// ============================================================
'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { supabasePublic } from '@/lib/supabase'
import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'
import QuotaBar from '@/components/dashboard/QuotaBar'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

interface Stats { total_filleuls: number; total_credits: number; dernier_parrainage: string | null }
interface Filleul { created_at: string; credits_given_referrer: number; status: string }
interface PageData { code: string; ref_url: string; wa_url: string; stats: Stats; filleuls: Filleul[] }

// QR Code SVG simplifié (représentation visuelle du lien)
function QRPlaceholder({ code }: { code: string }) {
  const cells = 9
  // Seed pseudo-aléatoire basé sur le code
  const seed = code.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const grid = Array.from({ length: cells * cells }, (_, i) => {
    const x = i % cells, y = Math.floor(i / cells)
    // Coins fixes (timing pattern QR)
    if ((x < 3 && y < 3) || (x >= 6 && y < 3) || (x < 3 && y >= 6)) return true
    return ((seed * (i + 7) * 13) % 17) > 8
  })

  const handleLangChange = async (lang: 'fr' | 'en') => {
    setLocale(lang)
    try {
      localStorage.setItem('pxLang', lang)
      const { data: { session } } = await supabasePublic.auth.getSession()
      if (session) {
        await supabasePublic.from('profiles').update({ locale: lang }).eq('id', session.user.id)
      }
    } catch {}
  }

  return (
    <div style={{ background:'#fff', borderRadius:10, padding:10, display:'inline-block', boxShadow:'0 4px 20px rgba(0,0,0,0.3)' }}>
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${cells}, 14px)`, gap:1 }}>
        {grid.map((on, i) => (
          <div key={i} style={{ width:14, height:14, borderRadius:2, background: on ? '#020408' : '#fff' }} />
        ))}
      </div>
      <div style={{ marginTop:6, fontFamily:HUD, fontSize:7, letterSpacing:1, color:'#020408', textAlign:'center' }}>profity-x.com</div>
    </div>
  )
}

export default function ReferralPage() {
  const [token,   setToken]   = useState('')
  const [user,    setUser]    = useState<{ id: string; email?: string } | null>(null)
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [plan,    setPlan]    = useState('free')
  const [locale,  setLocale]  = useState('fr')

  // i18n
  const T = {
    title:        locale === 'en' ? 'REFERRAL'               : '{T.title}',
    subtitle:     locale === 'en' ? 'Invite friends and earn credits!' : '{T.subtitle}',
    your_link:    locale === 'en' ? 'YOUR REFERRAL LINK'     : '{T.your_link}',
    copy:         locale === 'en' ? 'COPY'                   : 'COPIER',
    copied:       locale === 'en' ? '✓ COPIED!'              : '✓ COPIÉ !',
    credits:      locale === 'en' ? 'CREDITS EARNED'         : '{T.credits}',
    friends:      locale === 'en' ? 'FRIENDS INVITED'        : '{T.friends}',
    apply_code:   locale === 'en' ? 'APPLY A CODE'           : 'APPLIQUER UN CODE',
    apply_btn:    locale === 'en' ? 'APPLY'                  : 'APPLIQUER',
    how_it_works: locale === 'en' ? 'HOW IT WORKS'           : '{T.how_it_works}',
    step1:        locale === 'en' ? 'Share your link with a friend' : 'Partagez votre lien avec un ami',
    step2:        locale === 'en' ? 'They sign up with your link'   : "Il s'inscrit avec votre lien",
    step3:        locale === 'en' ? 'You earn +20 credits, they get +10' : 'Vous gagnez +20 crédits, lui +10',
  }
  const [data,    setData]    = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [code,    setCode]    = useState('')
  const [applying,setApplying]= useState(false)
  const [result,  setResult]  = useState<{ ok: boolean; msg: string } | null>(null)
  const [copied,  setCopied]  = useState(false)
  const [toast,   setToast]   = useState<string | null>(null)


  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabasePublic.auth.getSession()
      if (!session) { window.location.href = '/auth/login'; return }
      setUser(session.user as { id: string; email?: string })
      setToken(session.access_token)
      const { data: p } = await supabasePublic.from('profiles').select('*').eq('id', session.user.id).single()
      if (p) { setProfile(p); setPlan(p.user_plan as string || 'free'); setLocale(p.locale as string || 'fr') }
      // Charger les données parrainage
      const res  = await fetch('/api/referral', { headers: { Authorization: `Bearer ${session.access_token}` } })
      const json = await res.json()
      if (json.success) setData(json)
      setLoading(false)
    })()
  }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const copyLink = async () => {
    if (!data) return
    try {
      await navigator.clipboard.writeText(data.ref_url)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
      showToast('✅ Lien copié !')
    } catch {
      showToast('Sélectionnez le lien manuellement')
    }
  }

  const applyCode = async () => {
    if (!code.trim() || !token) return
    setApplying(true); setResult(null)
    const res  = await fetch('/api/referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code: code.trim() }),
    })
    const json = await res.json()
    if (json.success) {
      setResult({ ok: true,  msg: `✅ Code appliqué ! +${json.credits_bonus} crédits ajoutés.` })
      setCode('')
    } else {
      setResult({ ok: false, msg: `❌ ${json.error}` })
    }
    setApplying(false)
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' })

  const SHARE_TEXT = data ? `🚀 Rejoins ProfityX et reçois +10 crédits offerts !\nAnalyse tes charts avec l'IA en 3 secondes.\n\nMon lien : ${data.ref_url}` : ''

  return (
    <div className="app-shell">
      <Sidebar tab="history" setTab={() => {}} plan={plan} locale={locale} />
      <div className="app-main" style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'var(--bg0)', width:'100%', overflow:'hidden' }}>
        <TopBar locale={locale} profile={profile} onLangChange={handleLangChange} />
        <QuotaBar token={token} locale={locale} plan={plan} />

        {/* Toast */}
        {toast && (
          <div style={{ position:'fixed', top:70, left:'50%', transform:'translateX(-50%)', zIndex:999, background:'var(--bg2)', border:'1px solid var(--bd2)', borderRadius:8, padding:'10px 20px', fontFamily:HUD, fontSize:9, letterSpacing:1, color:'var(--ac)', boxShadow:'0 8px 24px var(--sh)', whiteSpace:'nowrap' }}>
            {toast}
          </div>
        )}

        <div className="resp-pad" style={{ padding:'1.5rem', flex:1, maxWidth:720, margin:'0 auto', width:'100%' }}>

          {/* En-tête */}
          <div style={{ marginBottom:'2rem' }}>
            <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:3, color:'var(--ac2)', marginBottom:6 }}>MODULE</div>
            <h1 style={{ fontFamily:HUD, fontSize:22, fontWeight:900, color:'var(--tx0)', margin:'0 0 8px' }}>
              PARRAI<span style={{ color:'var(--ac)' }}>NAGE</span>
            </h1>
            <p style={{ fontFamily:BODY, fontSize:15, color:'var(--tx2)', margin:0, lineHeight:1.6 }}>
              Invitez vos amis traders et gagnez des crédits à chaque inscription.
              <strong style={{ color:'var(--ac)' }}> +20 crédits</strong> pour vous,
              <strong style={{ color:'var(--ac2)' }}> +10 crédits</strong> pour votre filleul.
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign:'center', padding:'4rem', fontFamily:HUD, fontSize:9, letterSpacing:2, color:'var(--tx3)' }}>CHARGEMENT...</div>
          ) : data && (
            <>
              {/* ── STATS KPIs ── */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:'1.5rem' }}>
                {[
                  { label:'FILLEULS',       value:String(data.stats.total_filleuls), color:'var(--ac)',  icon:'ti-users' },
                  { label:'CRÉDITS GAGNÉS', value:String(data.stats.total_credits),  color:'var(--ac2)', icon:'ti-coin'  },
                  { label:'VALEUR',         value:`${data.stats.total_credits * 80} F`, color:'var(--ac3)', icon:'ti-currency-franc' },
                ].map(k => (
                  <div key={k.label} style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:10, padding:'1rem', position:'relative', overflow:'hidden', textAlign:'center' }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${k.color}, transparent)` }} />
                    <i className={`ti ${k.icon}`} style={{ fontSize:20, color:k.color, display:'block', marginBottom:6 }} />
                    <div style={{ fontFamily:HUD, fontSize:22, fontWeight:900, color:k.color, lineHeight:1, marginBottom:4 }}>{k.value}</div>
                    <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)' }}>{k.label}</div>
                  </div>
                ))}
              </div>

              {/* ── LIEN + QR CODE ── */}
              <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:12, overflow:'hidden', marginBottom:'1.5rem' }}>
                <div style={{ height:2, background:'linear-gradient(90deg, transparent, var(--ac), var(--ac2), transparent)' }} />
                <div style={{ padding:'1.25rem' }}>
                  <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'var(--ac)', marginBottom:'1rem' }}>🔗 VOTRE LIEN DE PARRAINAGE</div>
                  <div style={{ display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap' }}>

                    {/* QR Code */}
                    <div style={{ flexShrink:0 }}>
                      <QRPlaceholder code={data.code} />
                      <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)', textAlign:'center', marginTop:6 }}>Scanner pour rejoindre</div>
                    </div>

                    {/* Lien + actions */}
                    <div style={{ flex:1, minWidth:220 }}>
                      <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--tx3)', marginBottom:8 }}>VOTRE CODE</div>
                      <div style={{ fontFamily:HUD, fontSize:20, fontWeight:900, color:'var(--ac)', letterSpacing:2, marginBottom:12 }}>{data.code}</div>

                      <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--tx3)', marginBottom:6 }}>LIEN COMPLET</div>
                      <div style={{ display:'flex', gap:6, marginBottom:12 }}>
                        <div style={{ flex:1, background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:6, padding:'8px 10px', fontFamily:'monospace', fontSize:11, color:'var(--ac)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {data.ref_url}
                        </div>
                        <button onClick={copyLink} style={{ background: copied ? 'var(--ok)' : 'var(--ac)', border:'none', borderRadius:6, padding:'8px 14px', cursor:'pointer', color:'#020408', fontFamily:HUD, fontSize:8, letterSpacing:1, fontWeight:700, flexShrink:0 }}>
                          {copied ? '✓ COPIÉ' : 'COPIER'}
                        </button>
                      </div>

                      {/* Boutons partage */}
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                        <a href={data.wa_url} target="_blank" rel="noopener noreferrer"
                          style={{ flex:1, minWidth:140, display:'flex', alignItems:'center', justifyContent:'center', gap:7, background:'#25D366', borderRadius:7, padding:'10px', textDecoration:'none' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.121.555 4.109 1.524 5.832L0 24l6.335-1.498A11.96 11.96 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.005-1.368l-.359-.213-3.72.879.894-3.628-.234-.373A9.772 9.772 0 0 1 2.182 12C2.182 6.575 6.575 2.182 12 2.182S21.818 6.575 21.818 12 17.425 21.818 12 21.818z"/></svg>
                          <span style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'#fff', fontWeight:700 }}>WHATSAPP</span>
                        </a>
                        <button onClick={() => { const el = document.createElement('textarea'); el.value = SHARE_TEXT; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); showToast('✅ Message copié !') }}
                          style={{ flex:1, minWidth:120, display:'flex', alignItems:'center', justifyContent:'center', gap:7, background:'var(--bg2)', border:'1px solid var(--bd2)', borderRadius:7, padding:'10px', cursor:'pointer' }}>
                          <i className="ti ti-message-2" style={{ fontSize:15, color:'var(--ac2)' }} />
                          <span style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--ac2)' }}>COPIER MSG</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── COMMENT ÇA MARCHE ── */}
              <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:12, padding:'1.25rem', marginBottom:'1.5rem' }}>
                <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'var(--tx2)', marginBottom:'1rem' }}>COMMENT ÇA MARCHE</div>
                <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                  {[
                    { n:'01', icon:'ti-share',       title:'Partagez votre lien',        desc:'Envoyez votre lien à vos amis traders sur WhatsApp, TikTok, Instagram.', color:'var(--ac)'  },
                    { n:'02', icon:'ti-user-plus',    title:'Votre ami s\'inscrit',       desc:'Il crée son compte gratuitement avec votre lien — reçoit +10 crédits.', color:'var(--ac2)' },
                    { n:'03', icon:'ti-coin',         title:'Vous gagnez des crédits',    desc:'+20 crédits ajoutés automatiquement à votre solde. Notification envoyée.', color:'var(--ac3)' },
                  ].map((s, i) => (
                    <div key={s.n} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom: i < 2 ? '1px solid var(--bd)' : 'none' }}>
                      <div style={{ width:40, height:40, borderRadius:10, background:`color-mix(in srgb, ${s.color} 10%, transparent)`, border:`1px solid color-mix(in srgb, ${s.color} 25%, transparent)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <i className={`ti ${s.icon}`} style={{ fontSize:18, color:s.color }} />
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:1, color:'var(--tx0)', marginBottom:3 }}>{s.title}</div>
                        <div style={{ fontFamily:BODY, fontSize:13, color:'var(--tx3)', lineHeight:1.5 }}>{s.desc}</div>
                      </div>
                      <div style={{ fontFamily:HUD, fontSize:20, fontWeight:900, color:`color-mix(in srgb, ${s.color} 20%, transparent)`, flexShrink:0, alignSelf:'center' }}>{s.n}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── LISTE FILLEULS ── */}
              <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:12, overflow:'hidden', marginBottom:'1.5rem' }}>
                <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid var(--bd)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'var(--tx2)' }}>MES FILLEULS ({data.stats.total_filleuls})</div>
                </div>
                {data.filleuls.length === 0 ? (
                  <div style={{ padding:'3rem', textAlign:'center' }}>
                    <i className="ti ti-users" style={{ fontSize:32, color:'var(--tx3)', display:'block', marginBottom:10 }} />
                    <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:1, color:'var(--tx3)', marginBottom:6 }}>PAS ENCORE DE FILLEUL</div>
                    <div style={{ fontFamily:BODY, fontSize:13, color:'var(--tx3)' }}>Partagez votre lien pour commencer à gagner des crédits.</div>
                  </div>
                ) : (
                  <div>
                    {/* Header */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 120px 100px', padding:'8px 16px', background:'var(--bg2)', borderBottom:'1px solid var(--bd)' }}>
                      {['DATE', 'CRÉDITS GAGNÉS', 'STATUT'].map(h => (
                        <span key={h} style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'var(--tx3)' }}>{h}</span>
                      ))}
                    </div>
                    {data.filleuls.map((f, i) => (
                      <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 120px 100px', padding:'12px 16px', borderBottom: i < data.filleuls.length - 1 ? '1px solid var(--bd)' : 'none', alignItems:'center' }}>
                        <div style={{ fontFamily:BODY, fontSize:13, color:'var(--tx1)' }}>{fmtDate(f.created_at)}</div>
                        <div style={{ fontFamily:HUD, fontSize:12, fontWeight:700, color:'var(--ac)' }}>+{f.credits_given_referrer}</div>
                        <div>
                          <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color: f.status === 'credited' ? 'var(--ok)' : 'var(--ora)', background: f.status === 'credited' ? 'rgba(0,230,118,0.1)' : 'rgba(255,153,0,0.1)', border: `1px solid ${f.status === 'credited' ? 'rgba(0,230,118,0.25)' : 'rgba(255,153,0,0.25)'}`, borderRadius:3, padding:'2px 8px' }}>
                            {f.status === 'credited' ? 'CRÉDITÉ' : 'EN ATTENTE'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── ENTRER UN CODE PARRAIN ── */}
              <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:12, padding:'1.25rem' }}>
                <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'var(--tx2)', marginBottom:6 }}>VOUS AVEZ UN CODE PARRAIN ?</div>
                <div style={{ fontFamily:BODY, fontSize:13, color:'var(--tx3)', marginBottom:'0.875rem' }}>
                  Entrez le code de la personne qui vous a invité pour recevoir vos +10 crédits bonus.
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <input
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="PX-XXXXXX"
                    maxLength={10}
                    style={{ flex:1, background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:7, padding:'11px 14px', color:'var(--tx0)', fontFamily:'monospace', fontSize:13, letterSpacing:2, outline:'none' }}
                  />
                  <button onClick={applyCode} disabled={applying || !code.trim()}
                    style={{ background: applying || !code.trim() ? 'var(--bd)' : 'var(--ac2)', border:'none', borderRadius:7, padding:'11px 20px', cursor: applying ? 'wait' : 'pointer', color: applying || !code.trim() ? 'var(--tx3)' : '#020408', fontFamily:HUD, fontSize:9, letterSpacing:1, fontWeight:700, flexShrink:0 }}>
                    {applying ? '...' : 'APPLIQUER'}
                  </button>
                </div>
                {result && (
                  <div style={{ marginTop:8, fontFamily:BODY, fontSize:14, color: result.ok ? 'var(--ok)' : 'var(--red)', display:'flex', alignItems:'center', gap:6 }}>
                    {result.msg}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer légal */}
        <footer className="app-footer">
          <a href="/legal/cgu">CGU</a>
          <span style={{ color:'var(--tx3)' }}>·</span>
          <a href="/legal/confidentialite">Confidentialité</a>
          <span style={{ color:'var(--tx3)' }}>·</span>
          <a href="/support">Assistance</a>
        </footer>
      </div>
    </div>
  )
}
