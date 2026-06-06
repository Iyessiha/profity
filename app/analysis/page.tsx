'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { supabasePublic } from '@/lib/supabase'
import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'
import QuotaBar from '@/components/dashboard/QuotaBar'
import SignalCard from '@/components/SignalCard'
import OnboardingModal from '@/components/OnboardingModal'
import { RandomAd } from '@/components/AdSlot'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

// Actifs suggérés selon préférences
const ASSET_MAP: Record<string, { symbol: string; label: string; broker?: string }[]> = {
  forex:       [{ symbol:'EURUSD',label:'EUR/USD'},{symbol:'GBPUSD',label:'GBP/USD'},{symbol:'USDJPY',label:'USD/JPY'},{symbol:'AUDUSD',label:'AUD/USD'},{symbol:'XAUUSD',label:'XAU/USD'}],
  crypto:      [{ symbol:'BTCUSDT',label:'BTC/USDT'},{symbol:'ETHUSD',label:'ETH/USD'},{symbol:'BNBUSDT',label:'BNB'},{symbol:'SOLUSDT',label:'SOL'},{symbol:'XRPUSDT',label:'XRP'}],
  synthetic:   [{ symbol:'Volatility 75',label:'VOL 75',broker:'Deriv'},{symbol:'Volatility 25',label:'VOL 25',broker:'Deriv'},{symbol:'Crash 500',label:'CRASH 500',broker:'Deriv'},{symbol:'Boom 1000',label:'BOOM 1000',broker:'Deriv'},{symbol:'Step Index',label:'STEP',broker:'Deriv'}],
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
  const [showOnboarding, setOnboarding] = useState(false)

  const fileRef  = useRef<HTMLInputElement>(null)
  const [preview, setPreview]   = useState<string|null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [signal, setSignal]     = useState<Record<string,unknown>|null>(null)
  const [error, setError]       = useState<string|null>(null)
  const [quotaErr, setQuotaErr] = useState(false)
  const [showTV, setShowTV]     = useState(false)
  const tvRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabasePublic.auth.getSession()
      if (!session) { window.location.href = '/auth/login'; return }
      setUser(session.user as { id:string; email?:string })
      setToken(session.access_token)
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
    tvRef.current.innerHTML = `<iframe src="https://www.tradingview.com/widgetembed/?frameElementId=tv_px&symbol=BINANCE%3ABTCUSDT&interval=60&hidesidetoolbar=0&hidetoptoolbar=0&symboledit=1&saveimage=0&toolbarbg=020408&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=fr&utm_source=profity-x.com" style="width:100%;height:450px;border:none;" allowtransparency="true"></iframe>`
  }, [showTV])

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) { setError('Image requise (JPG, PNG, WEBP)'); return }
    if (f.size > 8*1024*1024) { setError('Image trop lourde — max 8 Mo'); return }
    const r = new FileReader()
    r.onload = e => setPreview(e.target?.result as string)
    r.readAsDataURL(f)
    setSignal(null); setError(null); setQuotaErr(false)
  }

  const analyze = async () => {
    if (!preview || !token) return
    setAnalyzing(true); setError(null)
    try {
      const res = await fetch('/api/analyze', {
        method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
        body: JSON.stringify({ image: preview.split(',')[1], mediaType: preview.split(';')[0].split(':')[1], locale }),
      })
      const json = await res.json()
      if (json.code === 'QUOTA_EXCEEDED') setQuotaErr(true)
      else if (!json.success) setError(json.error || 'Erreur analyse')
      else setSignal(json.data)
    } catch { setError('Erreur réseau') }
    setAnalyzing(false)
  }

  const tradingType = (profile?.trading_type as string) ?? 'forex'
  const suggestedAssets = ASSET_MAP[tradingType] ?? ASSET_MAP.forex
  const analysesLeft = plan === 'free' ? Math.max(0, 3 - ((profile?.analyses_used as number) ?? 0)) : undefined
  const isPremium = plan === 'pro' || plan === 'elite'

  return (
    <div className="app-shell">
      {showOnboarding && user && <OnboardingModal userId={user.id} locale={locale} onClose={() => { setOnboarding(false); window.location.reload() }} />}
      <Sidebar tab="chart" setTab={() => {}} plan={plan} locale={locale} />
      <div className="app-main" style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'var(--bg0)', width:'100%', overflow:'hidden' }}>
        <TopBar locale={locale} profile={profile} />
        <QuotaBar profile={profile} locale={locale} plan={plan} />

        <div className="resp-pad" style={{ padding:'1.25rem 1.5rem', flex:1, width:'100%', overflowX:'hidden' }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem', flexWrap:'wrap', gap:10 }}>
            <div>
              <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:3, color:'var(--ac2)', marginBottom:4 }}>MODULE</div>
              <h1 style={{ fontFamily:HUD, fontSize:'clamp(18px,4vw,26px)', fontWeight:900, color:'var(--tx0)' }}>ANALYSE <span style={{ color:'var(--ac)' }}>IA</span></h1>
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {isPremium && <div style={{ background:'color-mix(in srgb, var(--ac) 8%, transparent)', border:'1px solid var(--bd2)', borderRadius:6, padding:'6px 12px', fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--ac)' }}>✦ SMC ACTIVÉ</div>}
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
              <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, padding:'4px 10px', borderRadius:3, border:'1px solid var(--bd)', color:isPremium?'var(--ac)':'var(--tx3)', background:'color-mix(in srgb, var(--ac) 5%, transparent)' }}>
                {plan === 'elite' ? '🔷 ELITE · SMC' : plan === 'pro' ? '⬛ PRO · SMC' : '⬜ FREE · BASIQUE'}
              </div>
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
                        style={{ flex:1, background: analyzing||(plan==='free'&&analysesLeft===0)?'var(--bd)':'var(--ac)', border:'none', color:'#020408', fontFamily:HUD, fontSize:11, letterSpacing:2, fontWeight:700, padding:'14px', borderRadius:6, cursor: analyzing?'wait':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontSize:12 }}>
                        {analyzing ? <><div style={{ width:16, height:16, border:'2px solid rgba(0,0,0,0.2)', borderTop:'2px solid #020408', borderRadius:'50%', animation:'spin .8s linear infinite' }} />ANALYSE EN COURS...</> : <><i className="ti ti-sparkles" style={{ fontSize:16 }} />GÉNÉRER LE SIGNAL</>}
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
                <SignalCard signal={signal as Parameters<typeof SignalCard>[0]['signal']} type="chart" />
                {plan === 'free' && (
                  <div style={{ marginTop:'1rem', background:'linear-gradient(135deg,color-mix(in srgb, var(--ac) 6%, transparent),color-mix(in srgb, var(--ac2) 4%, transparent))', border:'1px solid var(--bd2)', borderRadius:8, padding:'1rem 1.25rem', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                    <i className="ti ti-bolt" style={{ fontSize:22, color:'var(--ac)', flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:160 }}>
                      <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:1, color:'var(--ac)', marginBottom:4 }}>ANALYSE SMC AVEC PRO</div>
                      <div style={{ fontFamily:BODY, fontSize:13, color:'var(--tx2)' }}>Order Blocks, FVG, Liquidité, Confluence institutionnelle, Market State.</div>
                    </div>
                    <a href="/pricing" style={{ background:'var(--ac)', color:'#020408', fontFamily:HUD, fontSize:9, letterSpacing:2, padding:'9px 16px', borderRadius:4, textDecoration:'none', fontWeight:700, whiteSpace:'nowrap' }}>PASSER PRO →</a>
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
  )
}