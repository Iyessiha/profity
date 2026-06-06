// ============================================================
// PROFITYX — HistoryPanel (avec détail cliquable)
// ============================================================
'use client'
import { useState, useEffect } from 'react'
import { supabasePublic } from '@/lib/supabase'

interface Props { locale: string; userId: string }
type HistTab = 'charts' | 'news'

interface ChartRecord {
  id:string; pair:string; timeframe:string; direction:'LONG'|'SHORT'|'NEUTRE'
  entry:number; stop_loss:number; tp1:number; tp2?:number; tp3?:number; rr_ratio:number
  conclusion:string; market_state?:string; confidence?:string; smc_analysis?:string
  created_at:string
}
interface NewsRecord {
  id:string; event_title:string; country:string; direction:'LONG'|'SHORT'|'NEUTRE'
  pair_cible:string; entry:number; stop_loss:number; tp1:number; rr_ratio:number
  interpretation:string; actual:string; forecast:string; created_at:string
}

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"
const DIR_COLORS: Record<string, string> = { LONG:'#00B890', SHORT:'#DC2626', NEUTRE:'#888' }

function fmt(n:number|null|undefined) {
  if (n == null) return '—'
  return n >= 1000 ? n.toLocaleString('fr-FR',{maximumFractionDigits:2}) : n.toLocaleString('fr-FR',{maximumFractionDigits:4})
}
function fmtDate(d:string, locale:string) {
  return new Date(d).toLocaleDateString(locale==='fr'?'fr-FR':'en-US',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})
}

// Modal de détail
function DetailModal({ item, type, locale, onClose }: { item:ChartRecord|NewsRecord; type:HistTab; locale:string; onClose:()=>void }) {
  const dirColor = DIR_COLORS[item.direction] ?? '#888'
  const chart = type === 'charts' ? item as ChartRecord : null
  const news  = type === 'news'   ? item as NewsRecord  : null

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={onClose}>
      <div className="modal-card" onClick={e=>e.stopPropagation()} style={{ background:'var(--bg2)', border:'1px solid var(--bd2)', borderRadius:14, padding:'1.5rem', width:460, maxWidth:'100%', position:'relative', overflow:'hidden', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg, ${dirColor}, transparent)` }} />

        {/* En-tête */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1.25rem' }}>
          <div>
            <div style={{ fontFamily:HUD, fontSize:16, color:'var(--tx0)', letterSpacing:1, marginBottom:4 }}>
              {chart ? (chart.pair || 'INCONNU') : (news?.event_title || '—')}
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <span style={{ fontFamily:HUD, fontSize:9, color:dirColor, background:dirColor+'15', border:`1px solid ${dirColor}30`, borderRadius:3, padding:'3px 8px' }}>{item.direction}</span>
              {chart?.timeframe && <span style={{ fontFamily:HUD, fontSize:9, color:'var(--ac2)', background:'color-mix(in srgb, var(--ac2) 10%, transparent)', border:'1px solid color-mix(in srgb, var(--ac2) 20%, transparent)', borderRadius:3, padding:'3px 8px' }}>{chart.timeframe}</span>}
              {chart?.confidence && <span style={{ fontFamily:HUD, fontSize:9, color:'var(--tx3)', border:'1px solid var(--bd)', borderRadius:3, padding:'3px 8px' }}>CONF. {chart.confidence}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:'var(--tx3)', cursor:'pointer', fontSize:22, padding:0 }}>✕</button>
        </div>

        {/* Niveaux de prix */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px,1fr))', gap:8, marginBottom:'1.25rem' }}>
          {[
            { l:'ENTRÉE',    v:item.entry,     c:'var(--ac)' },
            { l:'STOP LOSS', v:item.stop_loss, c:'var(--red)' },
            { l:'TP1',       v:item.tp1,       c:'#00D4FF' },
            ...(chart?.tp2 ? [{ l:'TP2', v:chart.tp2, c:'#00D4FF' }] : []),
            ...(chart?.tp3 ? [{ l:'TP3', v:chart.tp3, c:'#00D4FF' }] : []),
            { l:'R/R',       v:`${item.rr_ratio?.toFixed(2) ?? '—'}x`, c:'var(--ac3)', raw:true },
          ].map((p, i) => (
            <div key={i} style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:8, padding:'0.75rem' }}>
              <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)', marginBottom:4 }}>{p.l}</div>
              <div style={{ fontFamily:HUD, fontSize:15, fontWeight:900, color:p.c }}>
                {(p as {raw?:boolean}).raw ? p.v : fmt(p.v as number)}
              </div>
            </div>
          ))}
        </div>

        {/* État du marché (chart) */}
        {chart?.market_state && (
          <div style={{ marginBottom:'0.875rem', fontFamily:HUD, fontSize:9, letterSpacing:1, color:'var(--ac2)', background:'color-mix(in srgb, var(--ac2) 8%, transparent)', border:'1px solid color-mix(in srgb, var(--ac2) 15%, transparent)', borderRadius:6, padding:'7px 12px' }}>
            📊 {chart.market_state.replace(/_/g,' ')}
          </div>
        )}

        {/* Conclusion / Interprétation */}
        <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:8, padding:'1rem', marginBottom: chart?.smc_analysis ? '0.875rem' : 0 }}>
          <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'var(--tx3)', marginBottom:6 }}>
            {locale==='fr' ? 'ANALYSE' : 'ANALYSIS'}
          </div>
          <p style={{ fontFamily:BODY, fontSize:14, color:'var(--tx1)', lineHeight:1.7, margin:0 }}>
            {chart?.conclusion || news?.interpretation || '—'}
          </p>
        </div>

        {/* SMC (Pro/Elite) */}
        {chart?.smc_analysis && (
          <div style={{ background:'color-mix(in srgb, var(--ac3) 5%, transparent)', border:'1px solid color-mix(in srgb, var(--ac3) 15%, transparent)', borderRadius:8, padding:'1rem', marginTop:'0.875rem' }}>
            <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'var(--ac3)', marginBottom:6 }}>🎯 SMART MONEY CONCEPTS</div>
            <p style={{ fontFamily:BODY, fontSize:13, color:'var(--tx2)', lineHeight:1.6, margin:0 }}>{chart.smc_analysis}</p>
          </div>
        )}

        {/* Date */}
        <div style={{ marginTop:'1rem', fontFamily:BODY, fontSize:12, color:'var(--tx3)', textAlign:'right' }}>
          {fmtDate(item.created_at, locale)}
        </div>
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
                  style={{ display:'grid', gridTemplateColumns:tab==='charts'?'1fr 60px 80px 100px 80px 80px':'1fr 60px 80px 100px 80px 80px', padding:'13px 16px', borderBottom:'1px solid var(--bd)', cursor:'pointer', transition:'background .15s', gap:4, alignItems:'center' }}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='color-mix(in srgb, var(--ac) 4%, transparent)'}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                  <div style={{ fontFamily:BODY, fontSize:13, color:'var(--tx0)', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {chart?.pair || newsR?.event_title || '—'}
                  </div>
                  <div style={{ fontFamily:HUD, fontSize:9, color:'var(--ac2)' }}>{chart?.timeframe || newsR?.country || '—'}</div>
                  <div style={{ fontFamily:HUD, fontSize:10, fontWeight:700, color:dc }}>{dir}</div>
                  <div style={{ fontFamily:HUD, fontSize:11, color:'var(--tx0)' }}>{fmt(row.entry)}</div>
                  <div style={{ fontFamily:HUD, fontSize:11, color:'var(--red)', opacity:0.8 }}>{fmt(row.stop_loss)}</div>
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
