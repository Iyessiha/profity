// ============================================================
// PROFITYX — HistoryPanel v2 (SMC complet + SVG niveaux)
// ============================================================
'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabasePublic } from '@/lib/supabase'
import SignalCard from '@/components/SignalCard'
import type { ChartSignal } from '@/types'

interface Props { locale: string; userId: string; token?: string }
type HistTab     = 'charts' | 'news'
type TradeResult = 'win' | 'loss' | 'pending'

// Interface complète — tous les champs SMC de la DB
interface ChartRecord {
  id: string; pair: string; timeframe: string; direction: 'LONG'|'SHORT'|'NEUTRE'
  entry: number; stop_loss: number; tp1: number; tp2?: number|null; tp3?: number|null
  rr_ratio: number; conclusion: string; created_at: string
  trade_result?: TradeResult|null; rated_at?: string|null
  // SMC
  market_state?: string|null; confidence?: string|null
  smc_analysis?: string|null; confluence_factors?: string[]|null
  order_type?: string|null; trend?: string|null
  order_block?: { high:number; low:number; type:string; label:string }|null
  fvg?: { high:number; low:number; type:string; label:string }|null
  bos_level?: number|null; choch_level?: number|null
  liquidity_high?: number|null; liquidity_low?: number|null
}
interface NewsRecord {
  id:string; event_title:string; country:string; direction:'LONG'|'SHORT'|'NEUTRE'
  pair_cible:string; entry:number; stop_loss:number; tp1:number; rr_ratio:number
  interpretation:string; actual:string; forecast:string; created_at:string
}

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"
const DIR_COLORS: Record<string,string> = { LONG:'#00FFB2', SHORT:'#FF3A5C', NEUTRE:'#C9A84C' }
const RESULT_CFG: Record<TradeResult,{label:string;icon:string;bg:string;color:string}> = {
  win:     { label:'WIN',      icon:'🏆', bg:'rgba(0,255,178,0.1)',  color:'#00FFB2' },
  loss:    { label:'LOSS',     icon:'❌', bg:'rgba(255,58,92,0.1)', color:'#FF3A5C' },
  pending: { label:'EN COURS', icon:'⏳', bg:'rgba(201,168,76,0.1)',color:'#C9A84C' },
}

function fmt(n:number|null|undefined){
  if(n==null)return'—'
  return n>=1000?n.toLocaleString('fr-FR',{maximumFractionDigits:2}):n.toLocaleString('fr-FR',{maximumFractionDigits:4})
}
function fmtDate(d:string,locale:string){
  return new Date(d).toLocaleDateString(locale==='fr'?'fr-FR':'en-US',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})
}
function isOldEnough(created_at:string):boolean{
  return Date.now()-new Date(created_at).getTime()>60*60*1000
}

// Convertir ChartRecord → ChartSignal pour SignalCard
function recordToSignal(r: ChartRecord): ChartSignal {
  return {
    pair:       r.pair,
    timeframe:  r.timeframe,
    direction:  r.direction,
    entry:      r.entry,
    stop_loss:  r.stop_loss,
    tp1:        r.tp1,
    tp2:        r.tp2 ?? null,
    tp3:        r.tp3 ?? null,
    rr_ratio:   r.rr_ratio,
    conclusion: r.conclusion,
    raw_analysis: '',
    order_type:          (r.order_type as ChartSignal['order_type']) ?? null,
    confidence:          (r.confidence as ChartSignal['confidence']) ?? null,
    market_state:        r.market_state ?? null,
    smc_analysis:        r.smc_analysis ?? null,
    confluence_factors:  r.confluence_factors ?? null,
    trend:               (r.trend as ChartSignal['trend']) ?? null,
    order_block:         r.order_block ?? null,
    fvg:                 r.fvg ?? null,
    bos_level:           r.bos_level ?? null,
    choch_level:         r.choch_level ?? null,
    liquidity_high:      r.liquidity_high ?? null,
    liquidity_low:       r.liquidity_low ?? null,
    chart_range: null, annotations: null, key_levels: null, phase: null,
  }
}

// ── SVG visualisation des niveaux de prix ─────────────────
function PriceLevelsSVG({ record }: { record: ChartRecord }) {
  const prices = [
    record.entry, record.stop_loss, record.tp1,
    record.tp2, record.tp3,
    record.order_block?.high, record.order_block?.low,
    record.fvg?.high, record.fvg?.low,
    record.bos_level, record.choch_level,
    record.liquidity_high, record.liquidity_low,
  ].filter((p): p is number => p != null && p > 0)

  if (prices.length < 2) return null

  const hi  = Math.max(...prices)
  const lo  = Math.min(...prices)
  const rng = hi - lo || 1
  const pad = rng * 0.15
  const high = hi + pad, low = lo - pad, total = high - low
  const W = 340, H = 200

  const toY = (p: number) => ((high - p) / total) * H

  const levels: { price:number; label:string; color:string; style:'solid'|'dashed'; zoneEnd?:number }[] = []
  if (record.entry)     levels.push({ price:record.entry,     label:'ENTRÉE',   color:'#00FFB2', style:'solid' })
  if (record.stop_loss) levels.push({ price:record.stop_loss, label:'STOP',     color:'#FF3A5C', style:'solid' })
  if (record.tp1)       levels.push({ price:record.tp1,       label:'TP1',      color:'#00FFB2', style:'dashed' })
  if (record.tp2)       levels.push({ price:record.tp2!,      label:'TP2',      color:'#00D4FF', style:'dashed' })
  if (record.tp3)       levels.push({ price:record.tp3!,      label:'TP3',      color:'#7B61FF', style:'dashed' })
  if (record.bos_level)    levels.push({ price:record.bos_level,   label:'BOS',  color:'#00D4FF', style:'dashed' })
  if (record.choch_level)  levels.push({ price:record.choch_level, label:'CHOCH',color:'#FF6B35', style:'dashed' })
  if (record.liquidity_high) levels.push({ price:record.liquidity_high!, label:'BSL', color:'#FF3A5C', style:'dashed' })
  if (record.liquidity_low)  levels.push({ price:record.liquidity_low!,  label:'SSL', color:'#00FFB2', style:'dashed' })

  const zones: { y1:number; y2:number; color:string; label:string }[] = []
  if (record.order_block) {
    const y1 = toY(record.order_block.high), y2 = toY(record.order_block.low)
    zones.push({ y1:Math.min(y1,y2), y2:Math.max(y1,y2), color: record.direction==='LONG'?'#00FFB2':'#FF3A5C', label:record.order_block.label||'OB' })
  }
  if (record.fvg) {
    const y1 = toY(record.fvg.high), y2 = toY(record.fvg.low)
    zones.push({ y1:Math.min(y1,y2), y2:Math.max(y1,y2), color:'#C9A84C', label:record.fvg.label||'FVG' })
  }

  return (
    <div style={{ background:'#020408', borderRadius:10, overflow:'hidden', marginTop:12 }}>
      <div style={{ padding:'6px 10px', background:'rgba(0,255,178,0.05)', borderBottom:'1px solid rgba(0,255,178,0.08)' }}>
        <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'rgba(0,255,178,0.6)' }}>
          NIVEAUX SMC · {record.pair} {record.timeframe}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', display:'block', maxHeight:200 }}>
        {/* Fond */}
        <rect width={W} height={H} fill="#060B14" />
        {/* Grille légère */}
        {[0.25,0.5,0.75].map(p => (
          <line key={p} x1={0} y1={H*p} x2={W} y2={H*p}
            stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
        ))}
        {/* Zones OB / FVG */}
        {zones.map((z,i) => (
          <g key={i}>
            <rect x={0} y={z.y1} width={W} height={z.y2-z.y1} fill={z.color} fillOpacity={0.08} />
            <line x1={0} y1={z.y1} x2={W} y2={z.y1} stroke={z.color} strokeWidth={0.8} strokeOpacity={0.4} />
            <line x1={0} y1={z.y2} x2={W} y2={z.y2} stroke={z.color} strokeWidth={0.8} strokeOpacity={0.4} />
            <text x={W-4} y={z.y1-2} textAnchor="end" fill={z.color} fontSize={7} fontFamily="Orbitron,monospace" opacity={0.7}>{z.label}</text>
          </g>
        ))}
        {/* Lignes de niveaux */}
        {levels.map((l,i) => {
          const y = toY(l.price)
          if (y<0||y>H) return null
          return (
            <g key={i}>
              <line x1={0} y1={y} x2={W} y2={y}
                stroke={l.color} strokeWidth={1.5} strokeOpacity={0.85}
                strokeDasharray={l.style==='dashed'?'5,3':undefined} />
              <rect x={2} y={y-9} width={l.label.length*5.5+6} height={11} rx={2} fill={l.color} fillOpacity={0.12} />
              <text x={5} y={y} dominantBaseline="middle" fill={l.color} fontSize={8} fontFamily="Orbitron,monospace">{l.label}</text>
              <text x={W-4} y={y} dominantBaseline="middle" textAnchor="end" fill={l.color} fontSize={7.5} fontFamily="Orbitron,monospace" opacity={0.85}>
                {fmt(l.price)}
              </text>
            </g>
          )
        })}
      </svg>
      {/* Légende */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, padding:'6px 10px', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
        {levels.slice(0,6).map((l,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ width:12, height:2, background:l.color, display:'inline-block', borderRadius:1 }} />
            <span style={{ fontFamily:HUD, fontSize:6, letterSpacing:1, color:'rgba(232,244,248,0.4)' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Boutons notation ───────────────────────────────────────
function RatingButtons({ analysisId, current, token, onRated }: {
  analysisId:string; current?:TradeResult|null; token?:string
  onRated:(id:string,result:TradeResult)=>void
}) {
  const [loading, setLoading] = useState<TradeResult|null>(null)
  const rate = async (result:TradeResult, e:React.MouseEvent) => {
    e.stopPropagation()
    if(!token||loading)return
    setLoading(result)
    try {
      const res = await window.fetch('/api/trade-outcome',{
        method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
        body:JSON.stringify({analysis_id:analysisId,result}),
      })
      const json = await res.json()
      if(json.success)onRated(analysisId,result)
    } catch {} finally { setLoading(null) }
  }
  return (
    <div style={{display:'flex',gap:4,alignItems:'center'}} onClick={e=>e.stopPropagation()}>
      {current?(
        <span style={{fontFamily:HUD,fontSize:7,letterSpacing:1,padding:'3px 7px',borderRadius:4,
          background:RESULT_CFG[current].bg,color:RESULT_CFG[current].color,border:`1px solid ${RESULT_CFG[current].color}30`}}>
          {RESULT_CFG[current].icon} {RESULT_CFG[current].label}
        </span>
      ):(
        <>
          <span style={{fontFamily:HUD,fontSize:6,color:'var(--tx3)',letterSpacing:1,marginRight:2}}>RÉSULTAT :</span>
          {(['win','loss','pending'] as TradeResult[]).map(r=>(
            <button key={r} onClick={e=>rate(r,e)} disabled={!!loading}
              style={{fontFamily:HUD,fontSize:7,letterSpacing:1,padding:'3px 7px',borderRadius:4,cursor:'pointer',border:'none',
                background:loading===r?RESULT_CFG[r].bg:'rgba(255,255,255,0.06)',
                color:loading===r?RESULT_CFG[r].color:'var(--tx3)',
                transition:'all .15s',opacity:loading&&loading!==r?0.4:1}}>
              {RESULT_CFG[r].icon}
            </button>
          ))}
        </>
      )}
    </div>
  )
}

// ── Modal détail complet ───────────────────────────────────
function DetailModal({ item, type, locale, token, onClose, onRated }: {
  item:ChartRecord|NewsRecord; type:HistTab; locale:string; token?:string
  onClose:()=>void; onRated:(id:string,result:TradeResult)=>void
}) {
  const chart = type==='charts' ? item as ChartRecord : null
  const signal = chart ? recordToSignal(chart) : item as unknown as ChartSignal

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',zIndex:500,display:'flex',
      alignItems:'center',justifyContent:'center',padding:'1rem',backdropFilter:'blur(6px)'}}
      onClick={onClose}>
      <div onClick={e=>e.stopPropagation()}
        style={{width:'100%',maxWidth:480,maxHeight:'92vh',overflowY:'auto',position:'relative',
          display:'flex',flexDirection:'column',gap:0}}>
        {/* Header modal */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
          background:'rgba(0,255,178,0.06)',border:'1px solid rgba(0,255,178,0.15)',
          borderRadius:'12px 12px 0 0',padding:'10px 14px',marginBottom:0}}>
          <span style={{fontFamily:HUD,fontSize:9,letterSpacing:2,color:'#00FFB2'}}>
            {chart ? `📊 ${chart.pair} · ${chart.timeframe}` : '📰 NEWS SIGNAL'}
          </span>
          <button onClick={onClose}
            style={{background:'transparent',border:'1px solid var(--bd)',borderRadius:6,
              color:'var(--tx2)',cursor:'pointer',padding:'4px 10px',fontFamily:HUD,fontSize:8,letterSpacing:1}}>
            ✕ FERMER
          </button>
        </div>

        {/* Signal Card complète */}
        <div style={{borderRadius:'0 0 12px 12px',overflow:'hidden'}}>
          <SignalCard signal={signal as ChartSignal} type={type==='charts'?'chart':'news'} locale={locale} />
        </div>

        {/* Notation */}
        {chart && isOldEnough(chart.created_at) && (
          <div style={{marginTop:10,padding:'10px 14px',background:'rgba(255,255,255,0.02)',
            border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,display:'flex',
            alignItems:'center',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
            <span style={{fontFamily:HUD,fontSize:7,letterSpacing:1,color:'rgba(232,244,248,0.3)'}}>
              CE TRADE A RÉUSSI ?
            </span>
            <RatingButtons analysisId={chart.id} current={chart.trade_result} token={token} onRated={onRated} />
          </div>
        )}
        {chart?.trade_result==='win' && (
          <a href={`/share/${chart.id}`} target="_blank" rel="noopener noreferrer"
            onClick={e=>e.stopPropagation()}
            style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginTop:8,
              padding:'10px',borderRadius:8,background:'rgba(0,255,178,0.08)',border:'1px solid rgba(0,255,178,0.2)',
              color:'#00FFB2',textDecoration:'none',fontFamily:HUD,fontSize:8,letterSpacing:1}}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M10 2h4v4M14 2l-7 7M7 4H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9" stroke="#00FFB2" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            PARTAGER CE WIN
          </a>
        )}
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
  const [winRate,    setWinRate]    = useState<number|null>(null)
  const [totalWins,  setTotalWins]  = useState(0)
  const [totalRated, setTotalRated] = useState(0)

  const loadData = useCallback(async () => {
    setLoading(true)
    if (tab==='charts') {
      const { data:rows } = await supabasePublic
        .from('chart_analyses')
        .select(`id,pair,timeframe,direction,entry,stop_loss,tp1,tp2,tp3,rr_ratio,
                 conclusion,created_at,trade_result,rated_at,
                 market_state,confidence,smc_analysis,confluence_factors,
                 order_type,trend,order_block,fvg,
                 bos_level,choch_level,liquidity_high,liquidity_low`)
        .eq('user_id', userId)
        .order('created_at',{ascending:false})
        .limit(50)
      setData(((rows??[]) as ChartRecord[]).map(r => ({
        ...r,
        trade_result: r.trade_result
          ? (r.trade_result.toLowerCase() as TradeResult)
          : null,
      })))
    } else {
      const { data:rows } = await supabasePublic
        .from('news_signals')
        .select('id,event_title,country,direction,pair_cible,entry,stop_loss,tp1,rr_ratio,interpretation,actual,forecast,created_at')
        .eq('user_id', userId)
        .order('created_at',{ascending:false})
        .limit(50)
      setData((rows??[]) as NewsRecord[])
    }
    setLoading(false)
  }, [tab, userId])

  const loadStats = useCallback(async () => {
    const { data:p } = await supabasePublic
      .from('profiles').select('total_wins,total_losses,total_rated').eq('id',userId).single()
    if(p){
      setTotalWins(p.total_wins??0); setTotalRated(p.total_rated??0)
      setWinRate(p.total_rated>0?Math.round((p.total_wins/p.total_rated)*100):null)
    }
  }, [userId])

  useEffect(()=>{ loadData(); loadStats() },[loadData, loadStats])

  const handleRated = (id:string, result:TradeResult) => {
    setData(prev=>prev.map(r=>r.id===id?{...r,trade_result:result,rated_at:new Date().toISOString()} as ChartRecord:r))
    if(selected && selected.id===id) setSelected({...selected, trade_result:result} as ChartRecord)
    loadStats()
  }

  const charts  = data as ChartRecord[]
  const unrated = tab==='charts' ? charts.filter(c=>!c.trade_result&&isOldEnough(c.created_at)).length : 0

  return (
    <div style={{background:'var(--bg1)',border:'1px solid var(--bd)',borderRadius:12,overflow:'hidden'}}>
      {/* Header */}
      <div style={{padding:'14px 16px',borderBottom:'1px solid var(--bd)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontFamily:HUD,fontSize:10,letterSpacing:2,color:'var(--tx0)'}}>
            {locale==='fr'?'HISTORIQUE':'HISTORY'}
          </span>
          {winRate!==null&&(
            <div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(0,255,178,0.06)',border:'1px solid rgba(0,255,178,0.15)',borderRadius:6,padding:'4px 10px'}}>
              <span style={{fontSize:12}}>🎯</span>
              <span style={{fontFamily:HUD,fontSize:9,color:'#00FFB2',letterSpacing:1}}>{winRate}% WIN</span>
              <span style={{fontFamily:BODY,fontSize:10,color:'var(--tx3)'}}>({totalWins}/{totalRated})</span>
            </div>
          )}
          {unrated>0&&(
            <div style={{background:'rgba(201,168,76,0.08)',border:'1px solid rgba(201,168,76,0.2)',borderRadius:6,padding:'4px 10px'}}>
              <span style={{fontFamily:HUD,fontSize:8,color:'#C9A84C',letterSpacing:1}}>⏳ {unrated} À NOTER</span>
            </div>
          )}
        </div>
        <div style={{display:'flex',gap:4}}>
          {(['charts','news'] as HistTab[]).map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              style={{fontFamily:HUD,fontSize:8,letterSpacing:1,padding:'5px 12px',borderRadius:6,cursor:'pointer',transition:'all .2s',
                background:tab===t?'rgba(0,255,178,0.1)':'transparent',
                border:`1px solid ${tab===t?'rgba(0,255,178,0.25)':'var(--bd)'}`,
                color:tab===t?'var(--ac)':'var(--tx3)'}}>
              {t==='charts'?'📊 CHARTS':'📰 NEWS'}
            </button>
          ))}
        </div>
      </div>

      {/* Table header */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 55px 90px 90px 70px',
        padding:'8px 16px',borderBottom:'1px solid var(--bd)',background:'var(--bg2)'}}>
        {['PAIRE / SIGNAL','TF','DIRECTION','ENTRÉE','DATE'].map(h=>(
          <div key={h} style={{fontFamily:HUD,fontSize:7,letterSpacing:1,color:'var(--tx3)'}}>{h}</div>
        ))}
      </div>

      {/* Rows */}
      <div style={{maxHeight:400,overflowY:'auto',WebkitOverflowScrolling:'touch'} as React.CSSProperties}>
        {loading&&(
          <div style={{padding:'2rem',textAlign:'center',fontFamily:BODY,fontSize:13,color:'var(--tx3)'}}>Chargement...</div>
        )}
        {!loading&&data.length===0&&(
          <div style={{padding:'3rem 1rem',textAlign:'center'}}>
            <i className="ti ti-history" style={{fontSize:28,color:'var(--tx3)',display:'block',marginBottom:8}}/>
            <div style={{fontFamily:HUD,fontSize:9,letterSpacing:1,color:'var(--tx3)'}}>Aucune analyse</div>
          </div>
        )}
        {!loading&&data.map(row=>{
          const chart = tab==='charts'?row as ChartRecord:null
          const newsR = tab==='news'?row as NewsRecord:null
          const dir   = row.direction
          const dc    = DIR_COLORS[dir]??'#888'
          const showRating = tab==='charts'&&chart&&isOldEnough(chart.created_at)
          return (
            <div key={row.id}>
              <div onClick={()=>setSelected(row)}
                style={{display:'grid',gridTemplateColumns:'1fr 55px 90px 90px 70px',
                  padding:'10px 16px',borderBottom:showRating&&!chart?.trade_result?'none':'1px solid var(--bd)',
                  cursor:'pointer',transition:'background .15s',gap:4,alignItems:'center'}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(0,255,178,0.04)'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='transparent'}}>
                <div style={{fontFamily:BODY,fontSize:13,color:'var(--tx0)',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                  {chart?.pair||newsR?.event_title||'—'}
                </div>
                <div style={{fontFamily:HUD,fontSize:9,color:'var(--ac2)'}}>{chart?.timeframe||newsR?.country||'—'}</div>
                <div style={{display:'flex',alignItems:'center',gap:5}}>
                  <span style={{width:6,height:6,borderRadius:'50%',background:dc,display:'inline-block',flexShrink:0}}/>
                  <span style={{fontFamily:HUD,fontSize:10,fontWeight:700,color:dc}}>{dir}</span>
                  {chart?.trade_result&&(
                    <span style={{fontFamily:HUD,fontSize:6,letterSpacing:1,padding:'2px 5px',borderRadius:2,
                      background:RESULT_CFG[chart.trade_result]?.bg,color:RESULT_CFG[chart.trade_result]?.color}}>
                      {RESULT_CFG[chart.trade_result]?.icon}
                    </span>
                  )}
                  {/* Badge order type si disponible */}
                  {chart?.order_type&&chart.order_type!=='WAIT'&&(
                    <span style={{fontFamily:HUD,fontSize:5,letterSpacing:0.5,padding:'1px 4px',borderRadius:2,
                      background:'rgba(0,255,178,0.06)',color:'rgba(0,255,178,0.5)',border:'1px solid rgba(0,255,178,0.1)'}}>
                      {chart.order_type.replace('_',' ')}
                    </span>
                  )}
                </div>
                <div style={{fontFamily:HUD,fontSize:11,color:'var(--tx0)'}}>{fmt(row.entry)}</div>
                <div style={{fontFamily:BODY,fontSize:11,color:'var(--tx3)'}}>{fmtDate(row.created_at,locale)}</div>
              </div>
              {showRating&&(
                <div style={{padding:'6px 16px 8px',borderBottom:'1px solid var(--bd)',
                  background:chart?.trade_result?'transparent':'rgba(201,168,76,0.02)'}}>
                  <RatingButtons analysisId={chart!.id} current={chart?.trade_result} token={token} onRated={handleRated}/>
                  {chart?.trade_result==='win'&&(
                    <a href={`/share/${chart.id}`} target="_blank" rel="noopener noreferrer"
                      onClick={e=>e.stopPropagation()}
                      style={{display:'inline-flex',alignItems:'center',gap:4,marginTop:4,fontFamily:HUD,fontSize:7,
                        letterSpacing:1,padding:'3px 8px',borderRadius:4,background:'rgba(0,255,178,0.08)',
                        color:'#00FFB2',border:'1px solid rgba(0,255,178,0.2)',textDecoration:'none'}}>
                      PARTAGER CE WIN →
                    </a>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      {!loading&&data.length>0&&(
        <div style={{padding:'7px 16px',fontFamily:BODY,fontSize:11,color:'var(--tx3)',textAlign:'center',borderTop:'1px solid var(--bd)'}}>
          <i className="ti ti-hand-click" style={{fontSize:11,marginRight:4}}/>
          Cliquez pour voir les détails SMC complets
        </div>
      )}

      {/* Modal */}
      {selected&&(
        <DetailModal item={selected} type={tab} locale={locale} token={token}
          onClose={()=>setSelected(null)} onRated={handleRated}/>
      )}
    </div>
  )
}
