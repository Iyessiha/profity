// ============================================================
// PROFITYX — HistoryPanel (avec SignalCard v2 en détail)
// ============================================================
'use client'
import { useState, useEffect } from 'react'
import { supabasePublic } from '@/lib/supabase'
import SignalCard from '@/components/SignalCard'

interface Props { locale: string; userId: string }
type HistTab = 'charts' | 'news'

interface ChartRecord {
  id:string; pair:string; timeframe:string; direction:'LONG'|'SHORT'|'NEUTRE'
  entry:number; stop_loss:number; tp1:number; tp2?:number; tp3?:number; rr_ratio:number
  conclusion:string; market_state?:string; confidence?:string; smc_analysis?:string
  confluence_factors?:string[]; created_at:string; trade_result?:'WIN'|'LOSS'|'PENDING'|'CANCELLED'
}
interface NewsRecord {
  id:string; event_title:string; country:string; direction:'LONG'|'SHORT'|'NEUTRE'
  pair_cible:string; entry:number; stop_loss:number; tp1:number; rr_ratio:number
  interpretation:string; actual:string; forecast:string; created_at:string
}

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"
const DIR_COLORS: Record<string, string> = { LONG:'#00FFB2', SHORT:'#FF3A5C', NEUTRE:'#C9A84C' }

function fmt(n:number|null|undefined) {
  if (n == null) return '—'
  return n >= 1000 ? n.toLocaleString('fr-FR',{maximumFractionDigits:2}) : n.toLocaleString('fr-FR',{maximumFractionDigits:4})
}
function fmtDate(d:string, locale:string) {
  return new Date(d).toLocaleDateString(locale==='fr'?'fr-FR':'en-US',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})
}

// Modal avec la SignalCard v2
function DetailModal({ item, type, locale, onClose }: { item:ChartRecord|NewsRecord; type:HistTab; locale:string; onClose:()=>void }) {
  // Convertir le record historique en signal compatible avec SignalCard
  const signal = type === 'charts'
    ? item as unknown as Parameters<typeof SignalCard>[0]['signal']
    : item as unknown as Parameters<typeof SignalCard>[0]['signal']

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.82)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', backdropFilter:'blur(4px)' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width:'100%', maxWidth:460, maxHeight:'90vh', overflowY:'auto', position:'relative' }}
      >
        {/* Bouton fermer flottant */}
        <button
          onClick={onClose}
          style={{ position:'sticky', top:0, float:'right', zIndex:10, background:'rgba(6,9,15,0.9)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'50%', width:32, height:32, cursor:'pointer', color:'var(--tx2)', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:8 }}
        >✕</button>

        {/* Date en haut */}
        <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'var(--tx3)', marginBottom:10, clear:'both' }}>
          {fmtDate(item.created_at, locale)}
        </div>

        {/* SignalCard v2 */}
        <SignalCard
          signal={signal}
          type={type === 'charts' ? 'chart' : 'news'}
        />
      </div>
    </div>
  )
}

export default function HistoryPanel({ locale, userId }: Props) {
  const [tab,     setTab]     = useState<HistTab>('charts')
  const [charts,  setCharts]  = useState<ChartRecord[]>([])
  const [news,    setNews]    = useState<NewsRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ChartRecord|NewsRecord|null>(null)

  useEffect(() => {
    if (!userId) return
    ;(async () => {
      setLoading(true)
      const [c, n] = await Promise.all([
        supabasePublic.from('chart_analyses').select('*').eq('user_id', userId).order('created_at',{ascending:false}).limit(50),
        supabasePublic.from('news_signals').select('*').eq('user_id', userId).order('created_at',{ascending:false}).limit(50),
      ])
      if (c.data) setCharts(c.data as ChartRecord[])
      if (n.data) setNews(n.data as NewsRecord[])
      setLoading(false)
    })()
  }, [userId])

  const tabStyle = (active:boolean) => ({
    fontFamily:HUD, fontSize:9, letterSpacing:1.5, padding:'8px 14px',
    border:`1px solid ${active?'var(--bd2)':'var(--bd)'}`,
    background: active?'color-mix(in srgb, var(--ac) 10%, transparent)':'transparent',
    color:active?'var(--ac)':'var(--tx2)', borderRadius:4, cursor:'pointer',
  } as React.CSSProperties)

  const data = tab === 'charts' ? charts : news

  return (
    <div>
      {selected && (
        <DetailModal item={selected} type={tab} locale={locale} onClose={()=>setSelected(null)} />
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
        <button style={tabStyle(tab==='charts')} onClick={()=>setTab('charts')}>
          <i className="ti ti-chart-candle" style={{ fontSize:12, marginRight:5 }} />CHARTS ({charts.length})
        </button>
        <button style={tabStyle(tab==='news')} onClick={()=>setTab('news')}>
          <i className="ti ti-news" style={{ fontSize:12, marginRight:5 }} />ANNONCES ({news.length})
        </button>
      </div>

      <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:8, overflow:'hidden' }}>
        {/* Header table */}
        <div className="table-scroll">
          <div style={{ minWidth:500, background:'var(--bg2)', borderBottom:'1px solid var(--bd)' }}>
            <div style={{ display:'grid', gridTemplateColumns:tab==='charts'?'1fr 60px 80px 100px 80px 80px':'1fr 60px 80px 100px 80px 80px', padding:'10px 16px', gap:4 }}>
              {(tab==='charts'?['PAIRE','TF','DIR.','ENTRÉE','SL','DATE']:['ÉVÉNEMENT','DEV.','DIR.','ENTRÉE','SL','DATE']).map(h=>(
                <span key={h} style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'var(--tx3)', whiteSpace:'nowrap' }}>{h}</span>
              ))}
            </div>

            {/* Lignes */}
            {loading && (
              <div style={{ padding:'2rem', textAlign:'center', fontFamily:HUD, fontSize:9, letterSpacing:2, color:'var(--tx3)' }}>CHARGEMENT...</div>
            )}
            {!loading && data.length === 0 && (
              <div style={{ padding:'3rem', textAlign:'center', fontFamily:HUD, fontSize:9, letterSpacing:2, color:'var(--tx3)' }}>
                {locale==='fr'?'AUCUNE ANALYSE POUR L\'INSTANT':'NO ANALYSIS YET'}
              </div>
            )}
            {!loading && data.map(row => {
              const chart = tab==='charts' ? row as ChartRecord : null
              const newsR = tab==='news'   ? row as NewsRecord  : null
              const dir   = row.direction
              const dc    = DIR_COLORS[dir] ?? '#888'
              return (
                <div key={row.id}
                  onClick={()=>setSelected(row)}
                  style={{ display:'grid', gridTemplateColumns:tab==='charts'?'1fr 60px 80px 100px 80px 80px':'1fr 60px 80px 100px 80px 80px', padding:'12px 16px', borderBottom:'1px solid var(--bd)', cursor:'pointer', transition:'background .15s', gap:4, alignItems:'center' }}
                  onMouseEnter={e=>{
                    (e.currentTarget as HTMLElement).style.background='color-mix(in srgb, var(--ac) 5%, transparent)'
                    ;(e.currentTarget as HTMLElement).style.borderLeft=`2px solid ${dc}`
                  }}
                  onMouseLeave={e=>{
                    (e.currentTarget as HTMLElement).style.background='transparent'
                    ;(e.currentTarget as HTMLElement).style.borderLeft='none'
                  }}>
                  <div style={{ fontFamily:BODY, fontSize:13, color:'var(--tx0)', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {chart?.pair || newsR?.event_title || '—'}
                  </div>
                  <div style={{ fontFamily:HUD, fontSize:9, color:'var(--ac2)' }}>{chart?.timeframe || newsR?.country || '—'}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:dc, display:'inline-block', flexShrink:0 }} />
                    <span style={{ fontFamily:HUD, fontSize:10, fontWeight:700, color:dc }}>{dir}</span>
                    {chart?.trade_result && (
                      <span style={{ fontFamily:HUD, fontSize:6, letterSpacing:1, padding:'2px 5px', borderRadius:2,
                        background: chart.trade_result==='WIN'?'rgba(0,230,118,0.12)':chart.trade_result==='LOSS'?'rgba(220,38,38,0.12)':'rgba(255,255,255,0.05)',
                        color: chart.trade_result==='WIN'?'#00E676':chart.trade_result==='LOSS'?'#FF3A5C':'var(--tx3)' }}>
                        {chart.trade_result==='WIN'?'✅':chart.trade_result==='LOSS'?'❌':'⏳'}
                      </span>
                    )}
                    {chart?.trade_result === 'WIN' && (
                      <a
                        href={`/share/${chart.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ fontFamily:HUD, fontSize:6, letterSpacing:1, padding:'2px 6px', borderRadius:2, background:'rgba(0,255,178,0.08)', color:'#00FFB2', border:'1px solid rgba(0,255,178,0.2)', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:3 }}>
                        <svg width="8" height="8" viewBox="0 0 16 16" fill="none"><path d="M10 2h4v4M14 2l-7 7M7 4H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9" stroke="#00FFB2" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        PARTAGER
                      </a>
                    )}
                  </div>
                  <div style={{ fontFamily:HUD, fontSize:11, color:'var(--tx0)' }}>{fmt(row.entry)}</div>
                  <div style={{ fontFamily:HUD, fontSize:11, color:'#FF3A5C', opacity:0.85 }}>{fmt(row.stop_loss)}</div>
                  <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)' }}>{fmtDate(row.created_at, locale)}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Hint cliquable */}
        {!loading && data.length > 0 && (
          <div style={{ padding:'8px 16px', fontFamily:BODY, fontSize:11, color:'var(--tx3)', textAlign:'center' }}>
            <i className="ti ti-hand-click" style={{ fontSize:12, marginRight:4 }} />
            {locale==='fr'?'Cliquez sur une ligne pour voir les détails':'Click a row to see details'}
          </div>
        )}
      </div>
    </div>
  )
}
