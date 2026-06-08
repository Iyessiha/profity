'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { supabasePublic } from '@/lib/supabase'
import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'
import QuotaBar from '@/components/dashboard/QuotaBar'
import SignalCard from '@/components/SignalCard'
import ChartAnnotation from '@/components/ChartAnnotation'
import OnboardingModal from '@/components/OnboardingModal'
import { pixelAnalysis, pixelSignalReceived } from '@/lib/pixel'
import PopupManager, { usePopups, type PopupPayload } from '@/components/PopupManager'
import { playAnalysisStart, playAnalysisComplete, isSoundEnabled } from '@/lib/notif-sound'
import { RandomAd } from '@/components/AdSlot'
import Confetti from '@/components/Confetti'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

// Actifs suggérés selon préférences
const ASSET_MAP: Record<string, { symbol: string; label: string; broker?: string }[]> = {
  forex:       [{ symbol:'EURUSD',label:'EUR/USD'},{symbol:'GBPUSD',label:'GBP/USD'},{symbol:'USDJPY',label:'USD/JPY'},{symbol:'AUDUSD',label:'AUD/USD'},{symbol:'XAUUSD',label:'XAU/USD'}],
  crypto:      [{ symbol:'BTCUSDT',label:'BTC/USDT'},{symbol:'ETHUSD',label:'ETH/USD'},{symbol:'BNBUSDT',label:'BNB'},{symbol:'SOLUSDT',label:'SOL'},{symbol:'XRPUSDT',label:'XRP'}],
  synthetic:   [
    { symbol:'Boom 1000',    label:'BOOM 1000',   broker:'Deriv'},
    { symbol:'Boom 500',     label:'BOOM 500',    broker:'Deriv'},
    { symbol:'Crash 1000',   label:'CRASH 1000',  broker:'Deriv'},
    { symbol:'Crash 500',    label:'CRASH 500',   broker:'Deriv'},
    { symbol:'Volatility 75',label:'VOL 75',      broker:'Deriv'},
    { symbol:'Volatility 50',label:'VOL 50',      broker:'Deriv'},
    { symbol:'Volatility 25',label:'VOL 25',      broker:'Deriv'},
    { symbol:'Volatility 100',label:'VOL 100',    broker:'Deriv'},
    { symbol:'Step Index',   label:'STEP',        broker:'Deriv'},
    { symbol:'GainX 600',    label:'GainX 600',   broker:'Deriv'},
    { symbol:'GainX 1000',   label:'GainX 1000',  broker:'Deriv'},
    { symbol:'LossX 600',    label:'LossX 600',   broker:'Deriv'},
    { symbol:'LossX 1000',   label:'LossX 1000',  broker:'Deriv'},
    { symbol:'Jump 75',      label:'JUMP 75',     broker:'Deriv'},
    { symbol:'Jump 100',     label:'JUMP 100',    broker:'Deriv'},
    { symbol:'Range Break 100',label:'RANGE BR',  broker:'Deriv'},
  ],
  commodities: [{ symbol:'XAUUSD',label:'Or/USD'},{symbol:'XAGUSD',label:'Argent'},{symbol:'WTICOUSD',label:'WTI'},{symbol:'USOIL',label:'Pétrole'},{symbol:'NGAS',label:'Gaz naturel'}],
  indices:     [{ symbol:'NAS100',label:'NAS100'},{symbol:'SPX500',label:'SP500'},{symbol:'US30',label:'DOW30'},{symbol:'GER40',label:'DAX40'},{symbol:'UK100',label:'FTSE100'}],
  stocks:      [{ symbol:'AAPL',label:'Apple'},{symbol:'TSLA',label:'Tesla'},{symbol:'NVDA',label:'Nvidia'},{symbol:'META',label:'Meta'},{symbol:'AMZN',label:'Amazon'}],
}

export default function AnalysisPage() {
  const [user, setUser]           = useState<{ id:string; email?:string }|null>(null)
  const [profile, setProfile]     = useState<Record<string,unknown>|null>(null)
  const [plan, setPlan]           = useState('free')
  const [locale, setLocale]       = useState('fr')
  const [token, setToken]         = useState('')
  const [balance, setBalance]     = useState<number|undefined>(undefined)
  const [showOnboarding, setOnboarding] = useState(false)
  const [freeSMCUsed, setFreeSMCUsed]   = useState(false)
  const [showConfetti, setConfetti]     = useState(false)
  const [smcAnalysisId, setSmcId]       = useState<string|null>(null)
  const [smcRated, setSmcRated]         = useState(false)
  const [smcBonus, setSmcBonus]         = useState(0)
  const [needsRating, setNeedsRating]   = useState(false)

  const fileRef  = useRef<HTMLInputElement>(null)
  const [preview, setPreview]   = useState<string|null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [signal, setSignal]     = useState<Record<string,unknown>|null>(null)
  const [error, setError]       = useState<string|null>(null)
  const [quotaErr, setQuotaErr] = useState(false)
  const [showTV, setShowTV]     = useState(false)
  const [analysisMode, setAnalysisMode] = useState<'swing'|'scalp'>('swing')
  const analysisCount = (profile?.analyses_used as number) ?? 0
  const { popup: activePopup, close: closePopup, showPopup } = usePopups({
    plan, credits: balance, analysisCount, locale,
  })
  const [derivSymbol, setDerivSymbol]   = useState<string>('')   // actif Deriv sélectionné
  const tvRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabasePublic.auth.getSession()
      if (!session) { window.location.href = '/auth/login'; return }
      setUser(session.user as { id:string; email?:string })
      setToken(session.access_token)
      // Charger le solde crédits
      fetch('/api/credits', { headers:{ Authorization:`Bearer ${session.access_token}` } })
        .then(r=>r.json()).then(j=>{ if(j.success) setBalance(j.balance) }).catch(()=>{})
      const { data: p } = await supabasePublic.from('profiles').select('*').eq('id', session.user.id).single()
      if (p) {
        setProfile(p)
        setPlan(p.user_plan as string || 'free')
        setLocale(p.locale as string || 'fr')
        if (!p.onboarding_done) setOnboarding(true)
      }
    })()
  }, [])

  // TradingView optionnel
  useEffect(() => {
    if (!showTV || !tvRef.current) return
    tvRef.current.innerHTML = `<iframe src="https://www.tradingview.com/widgetembed/?frameElementId=tv_px&symbol=BINANCE%3ABTCUSDT&interval=60&hidesidetoolbar=0&hidetoptoolbar=0&symboledit=1&saveimage=0&toolbarbg=020408&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=${locale}&utm_source=profity-x.com" style="width:100%;height:450px;border:none;" allowtransparency="true"></iframe>`
  }, [showTV])

  const [imageFile, setImageFile] = useState<File | null>(null)

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) { setError('Image requise (JPG, PNG, WEBP)'); return }
    if (f.size > 8*1024*1024) { setError('Image trop lourde — max 8 Mo'); return }
    const r = new FileReader()
    r.onload = e => setPreview(e.target?.result as string)
    r.readAsDataURL(f)
    setImageFile(f)
    setSignal(null); setError(null); setQuotaErr(false)
  }

  const analyze = async () => {
    if (!preview || !token) return
    setAnalyzing(true); setError(null)

    // Rafraîchir le token juste avant l'appel (expire après 1h)
    let activeToken = token
    try {
      const { data: { session } } = await supabasePublic.auth.getSession()
      if (session?.access_token) {
        activeToken = session.access_token
        setToken(session.access_token)
      }
    } catch {}

    // Son de démarrage analyse
    if (isSoundEnabled()) playAnalysisStart()
    pixelAnalysis(analysisMode)
    try {
      const res = await fetch('/api/analyze', {
        method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${activeToken}`},
        body: JSON.stringify({ image: preview.split(',')[1], mediaType: preview.split(';')[0].split(':')[1], locale, mode: analysisMode, derivSymbol: derivSymbol || undefined }),
      })
      const json = await res.json()
      if (json.code === 'QUOTA_EXCEEDED') setQuotaErr(true)
      else if (!json.success) setError(json.error || 'Erreur analyse')
      else {
        setSignal(json.data)
        // Son de résultat reçu
        if (isSoundEnabled()) playAnalysisComplete()
        pixelSignalReceived((json.data as Record<string,unknown>)?.direction as string ?? '', (json.data as Record<string,unknown>)?.pair as string ?? '')
        // Capturer l'ID si SMC gratuit pour la notation
        if (json.free_daily_smc) {
          setFreeSMCUsed(true)
          setSmcId((json.data as Record<string,unknown>)?.id as string ?? null)
        }
        // Vérifier si notation requise
        if (json.needs_rating) setNeedsRating(true)
        // Confettis sur la toute première analyse
        const analysesCount = (profile?.analyses_used as number) ?? 0
        if (analysesCount === 0) setConfetti(true)
        if (json.free_daily_smc) setFreeSMCUsed(true)
        // Notifier CreditBalance de se rafraîchir
        window.dispatchEvent(new Event('creditUpdate'))
        // Mettre à jour le solde local
        fetch('/api/credits', { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json()).then(j => { if (j.success) setBalance(j.balance) }).catch(() => {})
      }
    } catch { setError('Erreur réseau') }
    setAnalyzing(false)
  }

  const tradingType = (profile?.trading_type as string) ?? 'forex'
  const suggestedAssets = ASSET_MAP[tradingType] ?? ASSET_MAP.forex
  const analysesLeft = plan === 'free' ? Math.max(0, 3 - ((profile?.analyses_used as number) ?? 0)) : undefined
  const isPremium = plan === 'pro' || plan === 'elite'

  return (
    <>
      {showConfetti && <Confetti duration={4000} />}
    <div className="app-shell">
      {showOnboarding && user && <OnboardingModal userId={user.id} locale={locale} onClose={() => { setOnboarding(false); window.location.reload() }} />}
      <Sidebar tab="chart" setTab={() => {}} plan={plan} locale={locale} />
      <div className="app-main" style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'var(--bg0)', width:'100%', overflow:'hidden' }}>
        <TopBar locale={locale} profile={profile} />
        <QuotaBar token={token} locale={locale} plan={plan} />

        <div className="resp-pad" style={{ padding:'1.25rem 1.5rem', flex:1, width:'100%', overflowX:'hidden' }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem', flexWrap:'wrap', gap:10 }}>
            <div>
              <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:3, color:'var(--ac2)', marginBottom:4 }}>MODULE</div>
              <h1 style={{ fontFamily:HUD, fontSize:'clamp(18px,4vw,26px)', fontWeight:900, color:'var(--tx0)' }}>ANALYSE <span style={{ color:'var(--ac)' }}>IA</span></h1>
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
              {isPremium ? (
                /* SMC toujours actif — Pro/Elite */
                <div style={{ display:'flex', alignItems:'center', gap:6, background:'color-mix(in srgb, var(--ac) 8%, transparent)', border:'1px solid var(--bd2)', borderRadius:6, padding:'6px 12px', fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--ac)' }}>
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.5 3H12l-2.5 1.8 1 3L8 8.5l-2.5 1.3 1-3L4 5h2.5z" fill="var(--ac)"/></svg>
                  SMC ACTIVÉ
                </div>
              ) : needsRating ? (
                /* Notation requise pour débloquer le SMC */
                <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:6, padding:'6px 12px', fontFamily:HUD, fontSize:8, letterSpacing:1, color:'#C9A84C' }}>
                  ⚠️ NOTEZ HIER → SMC DÉBLOQUÉ
                </div>
              ) : freeSMCUsed ? (
                /* SMC gratuit vient d'être utilisé aujourd'hui */
                <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(0,255,178,0.06)', border:'1px solid rgba(0,255,178,0.2)', borderRadius:6, padding:'6px 12px', fontFamily:HUD, fontSize:8, letterSpacing:1, color:'rgba(0,255,178,0.7)' }}>
                  ✓ SMC GRATUIT UTILISÉ
                  <span style={{ fontFamily:HUD, fontSize:6, color:'var(--tx3)', marginLeft:4 }}>Revient demain</span>
                </div>
              ) : (
                /* SMC gratuit disponible aujourd'hui */
                <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(0,255,178,0.08)', border:'1px solid rgba(0,255,178,0.25)', borderRadius:6, padding:'6px 12px', fontFamily:HUD, fontSize:8, letterSpacing:1, color:'#00FFB2' }}>
                  🎁 1 ANALYSE SMC OFFERTE AUJOURD'HUI
                </div>
              )}
              <button onClick={() => setOnboarding(true)} style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--tx2)', background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:4, padding:'6px 12px', cursor:'pointer' }}>
                <i className="ti ti-settings" style={{ marginRight:4, fontSize:12 }} />PRÉFÉRENCES
              </button>
            </div>
          </div>

          {/* Pub affiliate */}
          <div style={{ marginBottom:'1rem' }}><RandomAd type="banner" /></div>

          {/* Actifs suggérés */}
          <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:10, padding:'1rem', marginBottom:'1.25rem' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.75rem', flexWrap:'wrap', gap:8 }}>
              <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'var(--tx3)' }}>
                ACTIFS SUGGÉRÉS {tradingType === 'synthetic' ? '· DERIV' : tradingType === 'crypto' ? '· CRYPTO' : '· ' + tradingType.toUpperCase()}
              </div>
              <button onClick={() => setOnboarding(true)} style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--ac2)', background:'transparent', border:'none', cursor:'pointer' }}>CHANGER PRÉFÉRENCES →</button>
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {suggestedAssets.map(a => (
                <div key={a.symbol} style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:6, padding:'6px 12px', cursor:'pointer', userSelect:'none' }}
                  onClick={() => { if (!preview) { /* suggestion copier le nom */ } }}>
                  <div style={{ fontFamily:HUD, fontSize:10, color:'var(--ac)', letterSpacing:1 }}>{a.label}</div>
                  {a.broker && <div style={{ fontFamily:BODY, fontSize:10, color:'var(--tx3)' }}>{a.broker}</div>}
                </div>
              ))}
            </div>
            {tradingType === 'synthetic' && (
              <div style={{ marginTop:'0.75rem', fontFamily:BODY, fontSize:12, color:'var(--tx2)', padding:'8px 10px', background:'color-mix(in srgb, var(--red) 6%, transparent)', border:'1px solid color-mix(in srgb, var(--red) 15%, transparent)', borderRadius:6 }}>
                💡 Pour les indices synthétiques Deriv : prenez le screenshot depuis l'application Deriv/DTrader, puis uploadez-le ici.
              </div>
            )}
          </div>

          {/* ZONE PRINCIPALE : Analyse IA */}
          <div style={{ background:'var(--bg1)', border:'1px solid var(--bd1)', borderRadius:12, padding:'1.5rem', marginBottom:'1.25rem' }}>

            {/* Badge plan */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'1.25rem' }}>
              <i className="ti ti-sparkles" style={{ fontSize:20, color:'var(--ac)' }} />
              <div style={{ fontFamily:HUD, fontSize:12, letterSpacing:1, color:'var(--tx0)' }}>SIGNAL IA</div>
              <div style={{ flex:1 }} />
              {isPremium ? (
                <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, padding:'4px 10px', borderRadius:3, border:'1px solid var(--bd2)', color:'var(--ac)', background:'color-mix(in srgb, var(--ac) 8%, transparent)', display:'flex', alignItems:'center', gap:5 }}>
                  {plan === 'elite' ? '💎 ELITE · SMC' : '⭐ PRO · SMC'}
                </div>
              ) : !freeSMCUsed ? (
                <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, padding:'4px 10px', borderRadius:3, border:'1px solid rgba(0,255,178,0.25)', color:'#00FFB2', background:'rgba(0,255,178,0.06)', display:'flex', alignItems:'center', gap:5 }}>
                  🎁 FREE · SMC OFFERT
                </div>
              ) : (
                <a href="/pricing" style={{ display:'flex', alignItems:'center', gap:6, fontFamily:HUD, fontSize:7, letterSpacing:1, padding:'4px 10px', borderRadius:3, border:'1px solid rgba(201,168,76,0.3)', color:'rgba(201,168,76,0.8)', background:'rgba(201,168,76,0.06)', textDecoration:'none' }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke="#C9A84C" strokeWidth="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"/></svg>
                  FREE · BASIQUE
                  <span style={{ color:'rgba(201,168,76,0.5)', marginLeft:2 }}>→ PRO</span>
                </a>
              )}
            </div>

            {/* Quota alert */}
            {plan === 'free' && typeof analysesLeft === 'number' && analysesLeft <= 2 && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background: analysesLeft===0?'rgba(255,58,92,0.08)':'rgba(201,168,76,0.08)', border:`1px solid ${analysesLeft===0?'rgba(255,58,92,0.3)':'rgba(201,168,76,0.3)'}`, borderRadius:6, padding:'10px 14px', marginBottom:'1rem', flexWrap:'wrap', gap:8 }}>
                <span style={{ fontFamily:HUD, fontSize:9, color:analysesLeft===0?'var(--red)':'var(--ac3)' }}>
                  {analysesLeft===0?'QUOTA ÉPUISÉ':`PLUS QUE ${analysesLeft} ANALYSE${analysesLeft>1?'S':''}`}
                </span>
                <a href="/pricing" style={{ background:analysesLeft===0?'var(--red)':'var(--ac3)', color:'#020408', fontFamily:HUD, fontSize:8, padding:'7px 14px', borderRadius:3, textDecoration:'none', fontWeight:700 }}>DÉBLOQUER →</a>
              </div>
            )}

            {!signal ? (
              <>
                {/* ── Sélecteur mode + guide timeframes ─────────────────── */}
                <div style={{ marginBottom:14 }}>
                  {/* Tabs SWING / SCALP */}
                  <div style={{ display:'flex', gap:6, marginBottom:10 }}>
                    {([
                      { key:'swing', label:'📈 SWING / DAY', desc:'SMC classique, R/R ≥ 1.5' },
                      { key:'scalp', label:'⚡ SCALP',        desc:'Micro-structure, R/R ≥ 1.0' },
                    ] as const).map(m => (
                      <button key={m.key} onClick={() => setAnalysisMode(m.key)}
                        style={{ flex:1, padding:'8px 10px', borderRadius:7, cursor:'pointer', transition:'all .2s',
                          background: analysisMode===m.key
                            ? m.key==='scalp' ? 'rgba(255,107,53,0.12)' : 'rgba(0,255,178,0.08)'
                            : 'transparent',
                          border: `1px solid ${analysisMode===m.key
                            ? m.key==='scalp' ? 'rgba(255,107,53,0.4)' : 'rgba(0,255,178,0.3)'
                            : 'rgba(255,255,255,0.08)'}` }}>
                        <div style={{ fontFamily:"'Orbitron',monospace", fontSize:8, letterSpacing:1,
                          color: analysisMode===m.key
                            ? m.key==='scalp' ? '#FF6B35' : '#00FFB2'
                            : 'rgba(232,244,248,0.4)',
                          marginBottom:2 }}>{m.label}</div>
                        <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:10,
                          color:'rgba(232,244,248,0.3)' }}>{m.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* Sélecteur actif Deriv (optionnel) */}
                  <div style={{ marginBottom:10 }}>
                    <div style={{ fontFamily:"'Orbitron',monospace", fontSize:7, letterSpacing:2,
                      color:'rgba(0,212,255,0.6)', marginBottom:6 }}>
                      ⬡ ACTIF DERIV <span style={{ color:'rgba(232,244,248,0.3)', fontFamily:"'Rajdhani',sans-serif", fontSize:10, letterSpacing:0 }}>— optionnel, améliore la précision</span>
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                      {[
                        { sym:'',           label:'— Auto'      },
                        { sym:'Boom 1000',  label:'Boom 1000'   },
                        { sym:'Boom 500',   label:'Boom 500'    },
                        { sym:'Crash 1000', label:'Crash 1000'  },
                        { sym:'Crash 500',  label:'Crash 500'   },
                        { sym:'GainX 600',  label:'GainX 600'   },
                        { sym:'GainX 1000', label:'GainX 1000'  },
                        { sym:'LossX 600',  label:'LossX 600'   },
                        { sym:'LossX 1000', label:'LossX 1000'  },
                        { sym:'Volatility 50',  label:'Vol 50'  },
                        { sym:'Volatility 75',  label:'Vol 75'  },
                        { sym:'Volatility 100', label:'Vol 100' },
                        { sym:'Step Index', label:'Step'        },
                        { sym:'Jump 75',    label:'Jump 75'     },
                        { sym:'Jump 100',   label:'Jump 100'    },
                      ].map(({ sym, label }) => (
                        <button key={sym} onClick={() => setDerivSymbol(sym)}
                          style={{ padding:'5px 10px', borderRadius:4, cursor:'pointer',
                            fontFamily:"'Orbitron',monospace", fontSize:7, letterSpacing:1,
                            transition:'all .15s',
                            background: derivSymbol===sym ? 'rgba(0,212,255,0.12)' : 'transparent',
                            border:`1px solid ${derivSymbol===sym ? 'rgba(0,212,255,0.35)' : 'rgba(255,255,255,0.07)'}`,
                            color: derivSymbol===sym ? '#00D4FF' : 'rgba(232,244,248,0.35)' }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Guide timeframes recommandés */}
                  <div style={{ background: analysisMode==='scalp'
                    ? 'rgba(255,107,53,0.04)' : 'rgba(0,255,178,0.03)',
                    border: `1px solid ${analysisMode==='scalp'
                      ? 'rgba(255,107,53,0.15)' : 'rgba(0,255,178,0.1)'}`,
                    borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontFamily:"'Orbitron',monospace", fontSize:7, letterSpacing:2,
                      color: analysisMode==='scalp' ? 'rgba(255,107,53,0.7)' : 'rgba(0,255,178,0.6)',
                      marginBottom:8 }}>
                      {analysisMode==='scalp' ? '⚡ TIMEFRAMES RECOMMANDÉS — SCALP' : '📈 TIMEFRAMES RECOMMANDÉS — SWING / DAY'}
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {analysisMode==='scalp' ? (
                        <>
                          {[
                            { tf:'M1',  role:'Exécution', desc:'Timing précis d\'entrée · réaction instantanée', primary:true },
                            { tf:'M5',  role:'Signal',    desc:'Zone d\'entrée · Micro OB · FVG · BOS',          primary:true },
                            { tf:'M15', role:'Contexte',  desc:'Structure court terme · tendance rapide',        primary:false },
                            { tf:'M30', role:'HTF rapide',desc:'Biais directionnel · liquidité proche',          primary:false },
                          ].map(({ tf, role, desc, primary }) => (
                            <div key={tf} style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:10, fontWeight:900,
                                color: primary ? '#FF6B35' : 'rgba(255,107,53,0.45)',
                                minWidth:36, background: primary ? 'rgba(255,107,53,0.12)' : 'rgba(255,107,53,0.04)',
                                border:`1px solid ${primary?'rgba(255,107,53,0.3)':'rgba(255,107,53,0.1)'}`,
                                borderRadius:4, padding:'2px 6px', textAlign:'center' }}>{tf}</div>
                              <div>
                                <span style={{ fontFamily:"'Orbitron',monospace", fontSize:7, letterSpacing:1,
                                  color: primary ? 'rgba(255,107,53,0.8)' : 'rgba(232,244,248,0.3)' }}>
                                  {role}{primary ? ' ★' : ''}
                                </span>
                                <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:11,
                                  color:'rgba(232,244,248,0.35)', marginLeft:6 }}>{desc}</span>
                              </div>
                            </div>
                          ))}
                          <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:11,
                            color:'rgba(255,107,53,0.5)', marginTop:2, paddingTop:6,
                            borderTop:'1px solid rgba(255,107,53,0.1)' }}>
                            💡 Uploadez de préférence un <strong style={{color:'#FF6B35'}}>M5 ou M1</strong> — l'IA identifie automatiquement les micro OB et FVG
                          </div>
                        </>
                      ) : (
                        <>
                          {[
                            { tf:'H4',  role:'Structure',  desc:'Tendance dominante · OB majeurs · liquidité HTF', primary:true },
                            { tf:'H1',  role:'Signal',     desc:'Entrée précise · OB/FVG · BOS/CHOCH',            primary:true },
                            { tf:'D1',  role:'Contexte',   desc:'Zone premium/discount · biais hebdo',            primary:false },
                            { tf:'M15', role:'Affinement', desc:'Timing d\'entrée après confirmation H1',         primary:false },
                          ].map(({ tf, role, desc, primary }) => (
                            <div key={tf} style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:10, fontWeight:900,
                                color: primary ? '#00FFB2' : 'rgba(0,255,178,0.35)',
                                minWidth:36, background: primary ? 'rgba(0,255,178,0.08)' : 'rgba(0,255,178,0.02)',
                                border:`1px solid ${primary?'rgba(0,255,178,0.25)':'rgba(0,255,178,0.08)'}`,
                                borderRadius:4, padding:'2px 6px', textAlign:'center' }}>{tf}</div>
                              <div>
                                <span style={{ fontFamily:"'Orbitron',monospace", fontSize:7, letterSpacing:1,
                                  color: primary ? 'rgba(0,255,178,0.8)' : 'rgba(232,244,248,0.3)' }}>
                                  {role}{primary ? ' ★' : ''}
                                </span>
                                <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:11,
                                  color:'rgba(232,244,248,0.35)', marginLeft:6 }}>{desc}</span>
                              </div>
                            </div>
                          ))}
                          <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:11,
                            color:'rgba(0,255,178,0.45)', marginTop:2, paddingTop:6,
                            borderTop:'1px solid rgba(0,255,178,0.08)' }}>
                            💡 Uploadez de préférence un <strong style={{color:'#00FFB2'}}>H1 ou H4</strong> — l'IA lit automatiquement le TF visible sur le chart
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Zone dépôt */}
                {!preview ? (
                  <div
                    onDragOver={e=>{e.preventDefault();setDragOver(true)}}
                    onDragLeave={()=>setDragOver(false)}
                    onDrop={e=>{e.preventDefault();setDragOver(false);const f=e.dataTransfer.files[0];if(f)handleFile(f)}}
                    onClick={()=>fileRef.current?.click()}
                    style={{ border:`2px dashed ${dragOver?'var(--ac)':'var(--bd1)'}`, borderRadius:10, padding:'2.5rem 1.5rem', textAlign:'center', cursor:'pointer', background:dragOver?'color-mix(in srgb, var(--ac) 4%, transparent)':'transparent', transition:'all .2s' }}>
                    <i className="ti ti-cloud-upload" style={{ fontSize:42, color:'var(--ac)', opacity:0.5, marginBottom:12, display:'block' }} />
                    <div style={{ fontFamily:HUD, fontSize:13, letterSpacing:2, color:'var(--tx1)', marginBottom:8 }}>UPLOADEZ VOTRE CHART</div>
                    <div style={{ fontFamily:BODY, fontSize:14, color:'var(--tx2)', marginBottom:6 }}>Glissez-déposez ou cliquez pour choisir</div>
                    <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)' }}>JPG · PNG · WEBP · Max 8 Mo</div>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>{const f=e.target.files?.[0];if(f)handleFile(f)}} />
                  </div>
                ) : (
                  <div>
                    <img src={preview} alt="Chart" style={{ width:'100%', maxHeight:300, objectFit:'contain', borderRadius:8, background:'var(--bg2)', marginBottom:'1rem' }} />
                    {error && <div style={{ background:'rgba(255,58,92,0.08)', border:'1px solid rgba(255,58,92,0.25)', borderRadius:6, padding:'10px 14px', marginBottom:'1rem', fontFamily:BODY, fontSize:13, color:'var(--red)' }}>{error}</div>}

                    <div style={{ display:'flex', gap:10 }}>
                      <button onClick={analyze} disabled={analyzing||(plan==='free'&&analysesLeft===0)}
                        style={{ flex:1, background: analyzing||(plan==='free'&&analysesLeft===0)?'var(--bd)': analysisMode==='scalp'?'#FF6B35':'var(--ac)', border:'none', color:'#020408', fontFamily:HUD, fontSize:11, letterSpacing:2, fontWeight:700, padding:'14px', borderRadius:6, cursor: analyzing?'wait':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontSize:12 }}>
                        {analyzing ? <><div style={{ width:16, height:16, border:'2px solid rgba(0,0,0,0.2)', borderTop:'2px solid #020408', borderRadius:'50%', animation:'spin .8s linear infinite' }} />ANALYSE EN COURS...</> : <><i className={`ti ${analysisMode==='scalp'?'ti-bolt':'ti-sparkles'}`} style={{ fontSize:16 }} />{analysisMode==='scalp'?'SCALP RAPIDE':'GÉNÉRER LE SIGNAL'}</>}
                      </button>
                      <button onClick={()=>{setPreview(null);setSignal(null);setError(null)}} style={{ background:'transparent', border:'1px solid var(--bd)', color:'var(--tx2)', fontFamily:HUD, fontSize:9, padding:'0 16px', borderRadius:6, cursor:'pointer' }}>✕</button>
                    </div>
                  </div>
                )}

                {/* Teasing SMC pour free */}
                {!preview && plan === 'free' && (
                  <div style={{ marginTop:'1.25rem', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px,1fr))', gap:8 }}>
                    {[{icon:'ti-building-bank',label:'Order Blocks'},{icon:'ti-arrows-diff',label:'Fair Value Gaps'},{icon:'ti-map-pin',label:'Liquidité zones'}].map(f => (
                      <a key={f.label} href="/pricing" style={{ position:'relative', background:'var(--bg2)', border:'1px solid color-mix(in srgb, var(--ac3) 15%, transparent)', borderRadius:8, padding:'0.875rem', textDecoration:'none', display:'block', overflow:'hidden' }}>
                        <div style={{ filter:'blur(3px)', opacity:0.35 }}>
                          <i className={'ti '+f.icon} style={{ fontSize:20, color:'var(--ac3)', display:'block', marginBottom:4 }} />
                          <div style={{ fontFamily:HUD, fontSize:8, color:'var(--tx1)' }}>{f.label}</div>
                          <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)', marginTop:2 }}>●●●●●●●</div>
                        </div>
                        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3 }}>
                          <i className="ti ti-lock" style={{ fontSize:14, color:'var(--ac3)' }} />
                          <span style={{ fontFamily:HUD, fontSize:6, letterSpacing:1, color:'var(--ac3)' }}>PRO</span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div>
                <SignalCard
                  signal={signal as Parameters<typeof SignalCard>[0]['signal']}
                  type="chart"
                  locale={locale}
                  imageFile={(plan === 'pro' || plan === 'elite' || isAdmin) ? imageFile : null}
                  plan={plan}
                  mode={analysisMode}
                />

                {/* Prompt de notation — uniquement après SMC gratuit non encore noté */}
                {freeSMCUsed && !smcRated && smcAnalysisId && (
                  <div style={{ marginTop:'1rem', background:'linear-gradient(135deg,rgba(0,255,178,0.05),rgba(0,212,255,0.03))', border:'1px solid rgba(0,255,178,0.2)', borderRadius:10, padding:'1.25rem' }}>
                    <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'#00FFB2', marginBottom:6 }}>
                      🎁 ÉVALUEZ VOTRE SIGNAL SMC GRATUIT
                    </div>
                    <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, color:'rgba(232,244,248,0.6)', marginBottom:'1rem' }}>
                      Notez ce signal pour débloquer votre SMC gratuit de demain. Si vous partagez le résultat, vous gagnez <strong style={{ color:'#00FFB2' }}>+2 crédits</strong> bonus.
                    </div>

                    {/* Boutons de notation */}
                    <div style={{ display:'flex', gap:8, marginBottom:'1rem', flexWrap:'wrap' }}>
                      {[
                        { r:'WIN',     l:'✅ WIN',      c:'#00FFB2', bg:'rgba(0,255,178,0.1)',  bc:'rgba(0,255,178,0.3)' },
                        { r:'LOSS',    l:'❌ LOSS',     c:'#FF3A5C', bg:'rgba(255,58,92,0.1)',  bc:'rgba(255,58,92,0.3)' },
                        { r:'PENDING', l:'⏳ EN COURS', c:'#C9A84C', bg:'rgba(201,168,76,0.1)', bc:'rgba(201,168,76,0.3)' },
                      ].map(btn => (
                        <button key={btn.r}
                          onClick={async () => {
                            const res = await fetch('/api/smc-rating', {
                              method:'POST',
                              headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
                              body: JSON.stringify({ analysis_id: smcAnalysisId, result: btn.r, shared: false })
                            })
                            const j = await res.json()
                            if (j.success) {
                              setSmcRated(true)
                              setSmcBonus(j.bonus_credits ?? 0)
                              window.dispatchEvent(new Event('creditUpdate'))
                            }
                          }}
                          style={{ flex:1, minWidth:100, padding:'10px 8px', border:`1px solid ${btn.bc}`, borderRadius:7, background:btn.bg, color:btn.c, fontFamily:HUD, fontSize:9, letterSpacing:1, cursor:'pointer', fontWeight:700, transition:'all .2s' }}>
                          {btn.l}
                        </button>
                      ))}
                    </div>

                    <div style={{ fontFamily:HUD, fontSize:7, color:'rgba(232,244,248,0.3)', letterSpacing:1, textAlign:'center' }}>
                      Votre notation améliore la précision de l'IA pour tous les traders
                    </div>
                  </div>
                )}

                {/* Confirmation après notation */}
                {smcRated && (
                  <div style={{ marginTop:'1rem', background:'rgba(0,255,178,0.05)', border:'1px solid rgba(0,255,178,0.15)', borderRadius:10, padding:'1rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                    <div>
                      <div style={{ fontFamily:HUD, fontSize:9, color:'#00FFB2', letterSpacing:1, marginBottom:3 }}>
                        ✅ NOTÉ — SMC DE DEMAIN DÉBLOQUÉ
                      </div>
                      {smcBonus > 0 && <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:12, color:'rgba(232,244,248,0.5)' }}>+{smcBonus} crédits bonus reçus</div>}
                    </div>
                    <a href={`/share/${smcAnalysisId}`} target="_blank" rel="noopener noreferrer"
                      style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(0,255,178,0.08)', border:'1px solid rgba(0,255,178,0.2)', borderRadius:6, padding:'8px 14px', textDecoration:'none', color:'#00FFB2', fontFamily:HUD, fontSize:8, letterSpacing:1 }}>
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M10 2h4v4M14 2l-7 7M7 4H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9" stroke="#00FFB2" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      PARTAGER (+2 CRÉDITS)
                    </a>
                  </div>
                )}

                <button onClick={()=>{setPreview(null);setSignal(null)}} style={{ marginTop:'1rem', background:'transparent', border:'1px solid var(--bd1)', color:'var(--ac)', fontFamily:HUD, fontSize:9, letterSpacing:2, padding:'10px 24px', borderRadius:4, cursor:'pointer', width:'100%' }}>+ NOUVELLE ANALYSE</button>
              </div>
            )}
          </div>

          {/* TradingView optionnel */}
          <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:10, overflow:'hidden' }}>
            <button onClick={()=>setShowTV(v=>!v)} style={{ width:'100%', padding:'12px 16px', background:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <i className="ti ti-chart-candle" style={{ fontSize:18, color:'var(--ac2)' }} />
                <span style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'var(--tx2)' }}>TRADINGVIEW (OPTIONNEL)</span>
              </div>
              <i className={'ti '+(showTV?'ti-chevron-up':'ti-chevron-down')} style={{ fontSize:14, color:'var(--tx3)' }} />
            </button>
            {showTV && (
              <>
                <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)', padding:'0 16px 10px' }}>Analysez le chart, prenez un screenshot et uploadez-le dans l'analyseur IA ci-dessus.</div>
                <div ref={tvRef} style={{ width:'100%' }} />
              </>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
    </>
  )
}