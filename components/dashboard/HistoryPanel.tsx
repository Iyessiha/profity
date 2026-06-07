// ============================================================
// PROFITYX — HistoryPanel + Suivi résultats WIN/LOSS/EN COURS
// ============================================================
'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabasePublic } from '@/lib/supabase'
import SignalCard from '@/components/SignalCard'

interface Props { locale: string; userId: string; token?: string }
type HistTab    = 'charts' | 'news'
type TradeResult = 'win' | 'loss' | 'pending'

interface ChartRecord {
  id: string; pair: string; timeframe: string; direction: 'LONG'|'SHORT'|'NEUTRE'
  entry: number; stop_loss: number; tp1: number; tp2?: number; tp3?: number; rr_ratio: number
  conclusion: string; market_state?: string; confidence?: string; smc_analysis?: string
  confluence_factors?: string[]; created_at: string
  trade_result?: TradeResult | null
  rated_at?: string | null
}
interface NewsRecord {
  id: string; event_title: string; country: string; direction: 'LONG'|'SHORT'|'NEUTRE'
  pair_cible: string; entry: number; stop_loss: number; tp1: number; rr_ratio: number
  interpretation: string; actual: string; forecast: string; created_at: string
}

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"
const DIR_COLORS: Record<string, string> = { LONG:'#00FFB2', SHORT:'#FF3A5C', NEUTRE:'#C9A84C' }

const RESULT_CFG: Record<TradeResult, { label:string; icon:string; bg:string; color:string }> = {
  win:     { label:'WIN',      icon:'🏆', bg:'rgba(0,255,178,0.1)',  color:'#00FFB2' },
  loss:    { label:'LOSS',     icon:'❌', bg:'rgba(255,58,92,0.1)', color:'#FF3A5C' },
  pending: { label:'EN COURS', icon:'⏳', bg:'rgba(201,168,76,0.1)',color:'#C9A84C' },
}

function fmt(n: number|null|undefined) {
  if (n == null) return '—'
  return n >= 1000
    ? n.toLocaleString('fr-FR', { maximumFractionDigits:2 })
    : n.toLocaleString('fr-FR', { maximumFractionDigits:4 })
}
function fmtDate(d: string, locale: string) {
  return new Date(d).toLocaleDateString(locale==='fr'?'fr-FR':'en-US',
    { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })
}
function isOldEnough(created_at: string): boolean {
  return Date.now() - new Date(created_at).getTime() > 60 * 60 * 1000 // > 1h
}

// ── Boutons de notation ────────────────────────────────────
function RatingButtons({
  analysisId, current, token, onRated
}: {
  analysisId: string
  current?: TradeResult | null
  token?: string
  onRated: (id: string, result: TradeResult) => void
}) {
  const [loading, setLoading] = useState<TradeResult | null>(null)

  const rate = async (result: TradeResult, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!token || loading) return
    setLoading(result)
    try {
      const res = await window.fetch('/api/trade-outcome', {
        method:  'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body:    JSON.stringify({ analysis_id: analysisId, result }),
      })
      const json = await res.json()
      if (json.success) onRated(analysisId, result)
    } catch {}
    setLoading(null)
  }

  return (
    <div
      style={{ display:'flex', gap:4, alignItems:'center' }}
      onClick={e => e.stopPropagation()}
    >
      {current ? (
        // Résultat déjà noté
        <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, padding:'3px 7px', borderRadius:4,
          background: RESULT_CFG[current].bg, color: RESULT_CFG[current].color, border:`1px solid ${RESULT_CFG[current].color}30` }}>
          {RESULT_CFG[current].icon} {RESULT_CFG[current].label}
        </span>
      ) : (
        // Boutons de notation
        <>
          <span style={{ fontFamily:HUD, fontSize:6, color:'var(--tx3)', letterSpacing:1, marginRight:2 }}>RÉSULTAT :</span>
          {(['win','loss','pending'] as TradeResult[]).map(r => (
            <button key={r} onClick={(e) => rate(r, e)} disabled={!!loading}
              style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, padding:'3px 7px', borderRadius:4, cursor:'pointer', border:'none',
                background: loading === r ? RESULT_CFG[r].bg : 'rgba(255,255,255,0.06)',
                color: loading === r ? RESULT_CFG[r].color : 'var(--tx3)',
                transition:'all .15s', opacity: loading && loading !== r ? 0.4 : 1 }}>
              {RESULT_CFG[r].icon}
            </button>
          ))}
        </>
      )}
    </div>
  )
}

// ── Modal détail ───────────────────────────────────────────
function DetailModal({ item, type, locale, onClose }: {
  item: ChartRecord|NewsRecord; type: HistTab; locale: string; onClose: () => void
}) {
  const signal = item as unknown as Parameters<typeof SignalCard>[0]['signal']
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.82)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', backdropFilter:'blur(4px)' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ width:'100%', maxWidth:460, maxHeight:'90vh', overflowY:'auto', position:'relative' }}>
        <button onClick={onClose}
          style={{ position:'sticky', top:0, float:'right', zIndex:10, background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:6, color:'var(--tx2)', cursor:'pointer', padding:'4px 10px', fontFamily:HUD, fontSize:9, letterSpacing:1 }}>
          ✕ FERMER
        </button>
        <SignalCard signal={signal} locale={locale} />
      </div>
    </div>
  )
}

// ── Composant principal ────────────────────────────────────
export default function HistoryPanel({ locale, userId, token }: Props) {
  const [tab,      setTab]      = useState<HistTab>('charts')
  const [data,     setData]     = useState<(ChartRecord|NewsRecord)[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState<ChartRecord|NewsRecord|null>(null)

  // Stats win rate
  const [winRate,    setWinRate]    = useState<number|null>(null)
  const [totalWins,  setTotalWins]  = useState(0)
  const [totalRated, setTotalRated] = useState(0)

  const loadData = useCallback(async () => {
    setLoading(true)
    if (tab === 'charts') {
      const { data: rows } = await supabasePublic
        .from('chart_analyses')
        .select('id,pair,timeframe,direction,entry,stop_loss,tp1,tp2,tp3,rr_ratio,conclusion,market_state,confidence,smc_analysis,confluence_factors,created_at,trade_result,rated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      setData((rows ?? []) as ChartRecord[])
    } else {
      const { data: rows } = await supabasePublic
        .from('news_signals')
        .select('id,event_title,country,direction,pair_cible,entry,stop_loss,tp1,rr_ratio,interpretation,actual,forecast,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      setData((rows ?? []) as NewsRecord[])
    }
    setLoading(false)
  }, [tab, userId])

  // Charger win rate depuis profiles
  const loadStats = useCallback(async () => {
    const { data: p } = await supabasePublic
      .from('profiles')
      .select('total_wins, total_losses, total_rated')
      .eq('id', userId)
      .single()
    if (p) {
      setTotalWins(p.total_wins ?? 0)
      setTotalRated(p.total_rated ?? 0)
      setWinRate(p.total_rated > 0
        ? Math.round((p.total_wins / p.total_rated) * 100)
        : null)
    }
  }, [userId])

  useEffect(() => { loadData(); loadStats() }, [loadData, loadStats])

  // Mise à jour optimiste après notation
  const handleRated = (id: string, result: TradeResult) => {
    setData(prev => prev.map(r =>
      r.id === id ? { ...r, trade_result: result, rated_at: new Date().toISOString() } as ChartRecord : r
    ))
    // Recharger les stats
    loadStats()
  }

  const charts = data as ChartRecord[]
  const news   = data as NewsRecord[]

  // Analyses non notées (> 1h)
  const unrated = tab === 'charts'
    ? charts.filter(c => !c.trade_result && isOldEnough(c.created_at)).length
    : 0

  return (
    <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:12, overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--bd)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontFamily:HUD, fontSize:10, letterSpacing:2, color:'var(--tx0)' }}>
            {locale==='fr'?'HISTORIQUE':'HISTORY'}
          </span>

          {/* Win rate badge */}
          {winRate !== null && (
            <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(0,255,178,0.06)', border:'1px solid rgba(0,255,178,0.15)', borderRadius:6, padding:'4px 10px' }}>
              <span style={{ fontSize:12 }}>🎯</span>
              <span style={{ fontFamily:HUD, fontSize:9, color:'#00FFB2', letterSpacing:1 }}>
                {winRate}% WIN
              </span>
              <span style={{ fontFamily:BODY, fontSize:10, color:'var(--tx3)' }}>
                ({totalWins}/{totalRated})
              </span>
            </div>
          )}

          {/* Badge analyses à noter */}
          {unrated > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:6, padding:'4px 10px' }}>
              <span style={{ fontFamily:HUD, fontSize:8, color:'#C9A84C', letterSpacing:1 }}>
                ⏳ {unrated} À NOTER
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4 }}>
          {(['charts','news'] as HistTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, padding:'5px 12px', borderRadius:6, cursor:'pointer', transition:'all .2s',
                background: tab===t ? 'rgba(0,255,178,0.1)' : 'transparent',
                border: `1px solid ${tab===t ? 'rgba(0,255,178,0.25)' : 'var(--bd)'}`,
                color: tab===t ? 'var(--ac)' : 'var(--tx3)' }}>
              {t === 'charts' ? '📊 CHARTS' : '📰 NEWS'}
            </button>
          ))}
        </div>
      </div>

      {/* Table header */}
      <div style={{ display:'grid', gridTemplateColumns: tab==='charts' ? '1fr 55px 90px 90px 70px' : '1fr 55px 90px 90px 70px',
        padding:'8px 16px', borderBottom:'1px solid var(--bd)', background:'var(--bg2)' }}>
        {['PAIRE / SIGNAL','TF','DIRECTION','ENTRÉE','DATE'].map(h => (
          <div key={h} style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)' }}>{h}</div>
        ))}
      </div>

      {/* Rows */}
      <div style={{ maxHeight:400, overflowY:'auto', WebkitOverflowScrolling:'touch' } as React.CSSProperties}>
        {loading && (
          <div style={{ padding:'2rem', textAlign:'center', fontFamily:BODY, fontSize:13, color:'var(--tx3)' }}>
            Chargement...
          </div>
        )}
        {!loading && data.length === 0 && (
          <div style={{ padding:'3rem 1rem', textAlign:'center' }}>
            <i className="ti ti-history" style={{ fontSize:28, color:'var(--tx3)', display:'block', marginBottom:8 }} />
            <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:1, color:'var(--tx3)' }}>
              {locale==='fr' ? 'Aucune analyse' : 'No analysis yet'}
            </div>
          </div>
        )}
        {!loading && data.map(row => {
          const chart = tab==='charts' ? row as ChartRecord  : null
          const newsR = tab==='news'   ? row as NewsRecord   : null
          const dir   = row.direction
          const dc    = DIR_COLORS[dir] ?? '#888'
          const showRating = tab === 'charts' && chart && isOldEnough(chart.created_at)

          return (
            <div key={row.id}>
              {/* Ligne principale */}
              <div
                onClick={() => setSelected(row)}
                style={{ display:'grid', gridTemplateColumns:'1fr 55px 90px 90px 70px',
                  padding:'10px 16px', borderBottom: showRating && !chart?.trade_result ? 'none' : '1px solid var(--bd)',
                  cursor:'pointer', transition:'background .15s', gap:4, alignItems:'center' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `color-mix(in srgb, var(--ac) 4%, transparent)` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>

                {/* Paire */}
                <div style={{ fontFamily:BODY, fontSize:13, color:'var(--tx0)', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {chart?.pair || newsR?.event_title || '—'}
                </div>
                {/* TF */}
                <div style={{ fontFamily:HUD, fontSize:9, color:'var(--ac2)' }}>
                  {chart?.timeframe || newsR?.country || '—'}
                </div>
                {/* Direction + résultat */}
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:dc, display:'inline-block', flexShrink:0 }} />
                  <span style={{ fontFamily:HUD, fontSize:10, fontWeight:700, color:dc }}>{dir}</span>
                  {chart?.trade_result && (
                    <span style={{ fontFamily:HUD, fontSize:6, letterSpacing:1, padding:'2px 5px', borderRadius:2,
                      background: RESULT_CFG[chart.trade_result]?.bg,
                      color:      RESULT_CFG[chart.trade_result]?.color }}>
                      {RESULT_CFG[chart.trade_result]?.icon}
                    </span>
                  )}
                </div>
                {/* Entrée */}
                <div style={{ fontFamily:HUD, fontSize:11, color:'var(--tx0)' }}>{fmt(row.entry)}</div>
                {/* Date */}
                <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)' }}>{fmtDate(row.created_at, locale)}</div>
              </div>

              {/* Bande de notation (analyses non notées > 1h) */}
              {showRating && (
                <div style={{ padding:'6px 16px 8px', borderBottom:'1px solid var(--bd)',
                  background: chart?.trade_result ? 'transparent' : 'rgba(201,168,76,0.03)' }}>
                  <RatingButtons
                    analysisId={chart!.id}
                    current={chart?.trade_result}
                    token={token}
                    onRated={handleRated}
                  />
                  {/* Bouton partage si WIN */}
                  {chart?.trade_result === 'win' && (
                    <a href={`/share/${chart.id}`} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:4, fontFamily:HUD, fontSize:7, letterSpacing:1, padding:'3px 8px', borderRadius:4, background:'rgba(0,255,178,0.08)', color:'#00FFB2', border:'1px solid rgba(0,255,178,0.2)', textDecoration:'none' }}>
                      <svg width="8" height="8" viewBox="0 0 16 16" fill="none"><path d="M10 2h4v4M14 2l-7 7M7 4H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9" stroke="#00FFB2" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      PARTAGER CE WIN →
                    </a>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer hint */}
      {!loading && data.length > 0 && (
        <div style={{ padding:'7px 16px', fontFamily:BODY, fontSize:11, color:'var(--tx3)', textAlign:'center', borderTop:'1px solid var(--bd)' }}>
          <i className="ti ti-hand-click" style={{ fontSize:11, marginRight:4 }} />
          {locale==='fr' ? 'Cliquez pour voir les détails · Notez vos trades pour booster vos stats' : 'Click for details · Rate your trades to boost your stats'}
        </div>
      )}

      {/* Modal détail */}
      {selected && (
        <DetailModal item={selected} type={tab} locale={locale} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
