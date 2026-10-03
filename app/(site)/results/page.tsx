'use client'
export const dynamic = 'force-dynamic'
// ============================================================
// PROFITYX — /results : Track record agrégé + signaux publics
// Stats = toutes analyses (anonymisées)
// Signaux = uniquement ceux marqués is_public=true par l'utilisateur
// ============================================================
import { useEffect, useState } from 'react'

const HUD  = "'Orbitron',monospace"
const BODY = "'Rajdhani',sans-serif"

interface Signal {
  id: string; pair: string; timeframe: string; direction: string
  entry: number; rr_ratio: number; confidence: string
  trade_result: string | null; created_at: string
}
interface Stats {
  total: number; wins: number; losses: number; pending: number
  winrate: number; avg_rr: number; traders: number
  this_week: number; pairs_traded: number
}

export default function ResultsPage() {
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [lang,    setLang]    = useState('fr')

  useEffect(() => { setLang(localStorage.getItem('pxLang') || 'fr') }, [])

  useEffect(() => {
    Promise.all([
      fetch('/api/results/stats').then(r => r.json()),
      fetch('/api/results/signals').then(r => r.json()),
    ]).then(([s, sg]) => {
      setStats(s)
      setSignals(sg.signals ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const fmt      = (n: number) => n.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR')
  const dirColor = (d: string) => d?.includes('BUY') || d?.includes('LONG') ? '#00FFB2' : '#FF3A5C'
  const resColor = (r: string | null) => r === 'WIN' ? '#00FFB2' : r === 'LOSS' ? '#FF3A5C' : 'rgba(240,248,255,0.35)'

  const T = {
    title:        lang === 'en' ? 'LIVE TRACK RECORD'      : 'TRACK RECORD LIVE',
    subtitle:     lang === 'en' ? 'Aggregated statistics from all AI analyses generated on ProfityX. Individual signals shown are voluntarily shared by users.' : 'Statistiques agrégées de toutes les analyses IA générées sur ProfityX. Les signaux affichés sont partagés volontairement par les utilisateurs.',
    total:        lang === 'en' ? 'TOTAL ANALYSES'         : 'ANALYSES TOTALES',
    winrate:      lang === 'en' ? 'WIN RATE'               : 'WIN RATE',
    rr:           lang === 'en' ? 'AVG R/R'                : 'R/R MOYEN',
    traders:      lang === 'en' ? 'TRADERS'                : 'TRADERS',
    week:         lang === 'en' ? 'THIS WEEK'              : 'CETTE SEMAINE',
    pairs:        lang === 'en' ? 'PAIRS'                  : 'PAIRES',
    public_signals: lang === 'en' ? 'PUBLICLY SHARED SIGNALS' : 'SIGNAUX PARTAGÉS PUBLIQUEMENT',
    empty_public: lang === 'en' ? 'No public signals yet. Users can share their analyses from their History page.' : 'Aucun signal public pour le moment. Les utilisateurs peuvent partager leurs analyses depuis leur page Historique.',
    share_cta:    lang === 'en' ? 'Want to share your results? Enable sharing in your History.' : 'Vous voulez partager vos résultats ? Activez le partage depuis votre Historique.',
    rated:        lang === 'en' ? 'rated'                  : 'notés',
    pending_lbl:  lang === 'en' ? 'PENDING'                : 'EN COURS',
    try_free:     lang === 'en' ? 'TRY FOR FREE →'         : 'ESSAI GRATUIT →',
    subtitle2:    lang === 'en' ? 'Generate your own AI signals' : 'Générez vos propres signaux IA',
    note:         lang === 'en' ? '* Win rate calculated on rated trades only. Stats updated in real time.' : '* Win rate calculé sur les trades notés uniquement. Stats mises à jour en temps réel.',
  }

  return (
    <div style={{ minHeight:'100vh', background:'#020408', color:'#F0F8FF', fontFamily:BODY }}>

      {/* Navbar */}
      <nav style={{ position:'sticky', top:0, zIndex:100, borderBottom:'1px solid rgba(0,255,178,0.07)', background:'rgba(2,4,8,0.95)', backdropFilter:'blur(16px)', padding:'0 1.5rem', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <a href="/" style={{ textDecoration:'none' }}>
          <img src="/logos/profityx-logo.png" alt="ProfityX" style={{ height:32, objectFit:'contain' }} />
        </a>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <a href="/" style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'rgba(240,248,255,0.4)', textDecoration:'none', padding:'5px 9px', borderRadius:5, border:'1px solid rgba(255,255,255,0.1)' }}>FR</a>
          <a href="/en" style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'rgba(240,248,255,0.4)', textDecoration:'none', padding:'5px 9px', borderRadius:5, border:'1px solid rgba(255,255,255,0.1)' }}>EN</a>
          <a href="/auth/login" style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'#020408', background:'#00FFB2', padding:'8px 16px', borderRadius:4, textDecoration:'none', fontWeight:700 }}>
            {lang === 'en' ? 'LOGIN' : 'CONNEXION'}
          </a>
        </div>
      </nav>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'2.5rem 1.5rem' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <div style={{ display:'flex', justifyContent:'center', gap:10, marginBottom:12, flexWrap:'wrap' }}>
            <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:3, color:'rgba(0,255,178,0.6)' }}>
              {lang === 'en' ? 'FULL TRANSPARENCY' : 'TRANSPARENCE TOTALE'}
            </div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(0,255,178,0.08)', border:'1px solid rgba(0,255,178,0.25)', borderRadius:100, padding:'3px 10px' }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:'#00E676', animation:'pulse 1s infinite', display:'inline-block' }} />
              <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'#00FFB2' }}>LIVE</span>
            </div>
          </div>
          <h1 style={{ fontFamily:HUD, fontSize:'clamp(22px,4vw,38px)', fontWeight:900, marginBottom:12 }}>
            {T.title}
          </h1>
          <p style={{ fontFamily:BODY, fontSize:14, color:'rgba(240,248,255,0.45)', lineHeight:1.7, maxWidth:620, margin:'0 auto' }}>
            {T.subtitle}
          </p>
        </div>

        {/* Stats grille */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'3rem', fontFamily:HUD, fontSize:10, color:'rgba(0,255,178,0.5)', letterSpacing:3 }}>
            {lang === 'en' ? 'LOADING...' : 'CHARGEMENT...'}
          </div>
        ) : stats && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12, marginBottom:'2.5rem' }}>
            {[
              { label:T.total,   value:fmt(stats.total),   sub:`${stats.wins}W · ${stats.losses}L · ${stats.pending} ${T.pending_lbl}`, color:'#00FFB2' },
              { label:T.winrate, value:`${stats.winrate}%`, sub:`${stats.wins + stats.losses} ${T.rated}`, color: stats.winrate >= 60 ? '#00FFB2' : stats.winrate >= 45 ? '#C9A84C' : '#FF3A5C' },
              { label:T.rr,      value:`1:${stats.avg_rr}`, sub:'risk/reward', color:'#00D4FF' },
              { label:T.traders, value:fmt(stats.traders),  sub:lang === 'en' ? 'active users' : 'utilisateurs actifs', color:'#C9A84C' },
              { label:T.week,    value:fmt(stats.this_week),sub:lang === 'en' ? 'last 7 days' : '7 derniers jours', color:'rgba(240,248,255,0.6)' },
              { label:T.pairs,   value:fmt(stats.pairs_traded), sub:lang === 'en' ? 'different assets' : 'actifs différents', color:'rgba(240,248,255,0.6)' },
            ].map(s => (
              <div key={s.label} style={{ background:'#08111F', border:`1px solid rgba(255,255,255,0.06)`, borderRadius:10, padding:'1.25rem', textAlign:'center' }}>
                <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'rgba(240,248,255,0.35)', marginBottom:8 }}>{s.label}</div>
                <div style={{ fontFamily:HUD, fontSize:22, fontWeight:900, color:s.color, marginBottom:4 }}>{s.value}</div>
                <div style={{ fontFamily:BODY, fontSize:11, color:'rgba(240,248,255,0.35)' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Bandeau opt-in */}
        <div style={{ background:'linear-gradient(135deg,rgba(0,255,178,0.06),rgba(0,212,255,0.03))', border:'1px solid rgba(0,255,178,0.12)', borderRadius:10, padding:'1rem 1.25rem', marginBottom:'2rem', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <span style={{ fontSize:20 }}>📊</span>
          <div style={{ flex:1, minWidth:160 }}>
            <div style={{ fontFamily:HUD, fontSize:8, color:'#00FFB2', letterSpacing:1, marginBottom:3 }}>
              {lang === 'en' ? 'SHARE YOUR SIGNALS' : 'PARTAGEZ VOS SIGNAUX'}
            </div>
            <div style={{ fontFamily:BODY, fontSize:12, color:'rgba(232,244,248,0.55)' }}>{T.share_cta}</div>
          </div>
          <a href="/history" style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'#00FFB2', border:'1px solid rgba(0,255,178,0.3)', padding:'7px 14px', borderRadius:5, textDecoration:'none', whiteSpace:'nowrap' }}>
            {lang === 'en' ? 'MY HISTORY →' : 'MON HISTORIQUE →'}
          </a>
        </div>

        {/* Signaux publics */}
        <div style={{ marginBottom:'2rem' }}>
          <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:3, color:'rgba(240,248,255,0.35)', marginBottom:'1rem' }}>
            {T.public_signals} {signals.length > 0 && `(${signals.length})`}
          </div>

          {signals.length === 0 ? (
            <div style={{ background:'#08111F', border:'1px solid rgba(255,255,255,0.05)', borderRadius:10, padding:'2.5rem', textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🔒</div>
              <div style={{ fontFamily:BODY, fontSize:14, color:'rgba(240,248,255,0.4)', lineHeight:1.7 }}>{T.empty_public}</div>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:10 }}>
              {signals.map(s => (
                <div key={s.id} style={{ background:'#08111F', border:`1px solid ${s.trade_result ? (s.trade_result==='WIN'?'rgba(0,255,178,0.2)':'rgba(255,58,92,0.2)'):'rgba(255,255,255,0.05)'}`, borderRadius:8, padding:'1rem', position:'relative' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div>
                      <div style={{ fontFamily:HUD, fontSize:11, fontWeight:700, color:'#F0F8FF', marginBottom:2 }}>{s.pair}</div>
                      <div style={{ fontFamily:BODY, fontSize:11, color:'rgba(240,248,255,0.4)' }}>{s.timeframe}</div>
                    </div>
                    <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, padding:'3px 7px', borderRadius:3, background: s.trade_result==='WIN'?'#00FFB2':s.trade_result==='LOSS'?'#FF3A5C':'rgba(255,255,255,0.07)', color: s.trade_result?'#020408':'rgba(240,248,255,0.4)' }}>
                      {s.trade_result ?? (lang==='en'?'PENDING':'EN COURS')}
                    </span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontFamily:HUD, fontSize:9, color:dirColor(s.direction) }}>{s.direction}</span>
                    <span style={{ fontFamily:HUD, fontSize:9, color:'#00D4FF' }}>1:{s.rr_ratio}</span>
                  </div>
                  <div style={{ fontFamily:BODY, fontSize:10, color:'rgba(240,248,255,0.25)', marginTop:6 }}>
                    {new Date(s.created_at).toLocaleDateString(lang==='en'?'en-US':'fr-FR',{day:'2-digit',month:'short'})}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Note transparence */}
        <p style={{ fontFamily:BODY, fontSize:11, color:'rgba(240,248,255,0.25)', textAlign:'center', marginBottom:'2rem' }}>{T.note}</p>

        {/* CTA */}
        <div style={{ textAlign:'center', padding:'2.5rem', background:'rgba(8,17,31,0.6)', borderRadius:12, border:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontFamily:HUD, fontSize:10, color:'rgba(240,248,255,0.4)', marginBottom:8 }}>{T.subtitle2}</div>
          <a href="/auth/login" style={{ display:'inline-block', fontFamily:HUD, fontSize:10, letterSpacing:2, color:'#020408', background:'#00FFB2', padding:'13px 32px', borderRadius:4, textDecoration:'none', fontWeight:700 }}>
            {T.try_free}
          </a>
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  )
}
