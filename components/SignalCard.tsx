// ============================================================
// PROFITYX — SignalCard v3 (SMC complet)
// ============================================================
'use client'
import type { ChartSignal, NewsSignal, OrderType } from '@/types'
import dynamic from 'next/dynamic'

// ============================================================
// PROFITYX — SignalCard v3 (SMC complet)
// ============================================================
'use client'
import { useState, useRef, useEffect } from 'react'
import type { ChartSignal, NewsSignal, OrderType } from '@/types'
import dynamic from 'next/dynamic'

// ── Composant de partage multi-réseaux ───────────────────────
interface ShareMenuProps {
  pair: string; dir: string; tf?: string | null
  cs?: Partial<ChartSignal> | null; locale: string
}
function ShareMenu({ pair, dir, tf, cs, locale }: ShareMenuProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const HUD = "'Orbitron', monospace"

  // Fermer si clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const emoji = dir === 'LONG' ? '🟢' : dir === 'SHORT' ? '🔴' : '🟡'
  const entry = cs?.entry ?? 0
  const sl    = cs?.stop_loss ?? 0
  const t1    = cs?.tp1 ?? 0
  const t2    = cs?.tp2 ?? 0
  const t3    = cs?.tp3 ?? 0
  const rr    = cs?.rr_ratio ?? 0
  const url   = 'https://profity-x.com'

  const text =
    `${emoji} Signal ProfityX — ${pair}\n` +
    `📊 ${dir}${tf ? ` | ${tf}` : ''}\n` +
    `🎯 Entrée : ${entry}\n` +
    `🛑 Stop : ${sl}\n` +
    `✅ TP1 : ${t1}${t2 ? ` | TP2 : ${t2}` : ''}${t3 ? ` | TP3 : ${t3}` : ''}\n` +
    (rr ? `📐 R/R : 1:${rr}\n` : '') +
    `\n🤖 Généré par ProfityX — ${url}`

  const textWa = text.replace(/\n/g, '\n') // WhatsApp accepte \n natif
  const textTw = `${emoji} Signal ${pair} ${dir}${tf ? ` ${tf}` : ''} | Entrée ${entry} · SL ${sl} · TP ${t1}${t2 ? `/${t2}` : ''} | via @ProfityX ${url}`

  const CHANNELS = [
    {
      id: 'whatsapp', label: 'WhatsApp', color: '#25D366',
      bg: 'rgba(37,211,102,0.1)', border: 'rgba(37,211,102,0.3)',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.554 4.122 1.527 5.857L0 24l6.335-1.509A11.934 11.934 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.007-1.372l-.36-.213-3.728.888.906-3.624-.233-.372A9.818 9.818 0 0 1 2.182 12c0-5.42 4.398-9.818 9.818-9.818s9.818 4.398 9.818 9.818-4.398 9.818-9.818 9.818z"/>
        </svg>
      ),
      action: () => window.open(`https://wa.me/?text=${encodeURIComponent(textWa)}`, '_blank'),
    },
    {
      id: 'telegram', label: 'Telegram', color: '#2AABEE',
      bg: 'rgba(42,171,238,0.1)', border: 'rgba(42,171,238,0.3)',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#2AABEE">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.67l-2.94-.918c-.64-.203-.658-.64.135-.954l11.57-4.461c.537-.194 1.006.131.959.884z"/>
        </svg>
      ),
      action: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank'),
    },
    {
      id: 'twitter', label: 'X (Twitter)', color: '#E7E9EA',
      bg: 'rgba(231,233,234,0.08)', border: 'rgba(231,233,234,0.2)',
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="#E7E9EA">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      action: () => window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(textTw)}`, '_blank'),
    },
    {
      id: 'facebook', label: 'Facebook', color: '#1877F2',
      bg: 'rgba(24,119,242,0.1)', border: 'rgba(24,119,242,0.3)',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
        </svg>
      ),
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank'),
    },
    {
      id: 'copy', label: copied ? '✓ Copié !' : 'Copier', color: copied ? '#00FFB2' : 'rgba(232,244,248,0.5)',
      bg: copied ? 'rgba(0,255,178,0.1)' : 'rgba(255,255,255,0.04)', border: copied ? 'rgba(0,255,178,0.3)' : 'rgba(255,255,255,0.1)',
      icon: <span style={{ fontSize:13 }}>{copied ? '✓' : '📋'}</span>,
      action: async () => {
        try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {}
      },
    },
  ]

  // Partage natif (mobile)
  const nativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `Signal ${pair} — ProfityX`, text, url }) } catch {}
    } else setOpen(v => !v)
  }

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button onClick={nativeShare} style={{
        display:'flex', alignItems:'center', gap:7,
        background:'rgba(0,255,178,0.08)', border:'1px solid rgba(0,255,178,0.2)',
        borderRadius:6, padding:'7px 14px', cursor:'pointer',
        fontFamily:HUD, fontSize:8, letterSpacing:1, color:'#00FFB2',
      }}>
        <span style={{ fontSize:14 }}>📤</span>
        {locale === 'fr' ? 'PARTAGER' : 'SHARE'}
        <span style={{ fontSize:10, opacity:.6 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position:'absolute', bottom:'calc(100% + 8px)', left:0, zIndex:100,
          background:'#0D1628', border:'1px solid rgba(0,255,178,0.15)',
          borderRadius:10, padding:8, minWidth:180,
          boxShadow:'0 8px 32px rgba(0,0,0,0.6)',
          animation:'onboardIn .2s ease',
        }}>
          <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'rgba(232,244,248,0.3)', padding:'4px 8px 8px' }}>
            PARTAGER CE SIGNAL
          </div>
          {CHANNELS.map(ch => (
            <button key={ch.id} onClick={() => { ch.action(); if (ch.id !== 'copy') setOpen(false) }} style={{
              width:'100%', display:'flex', alignItems:'center', gap:10,
              background: open ? ch.bg : 'transparent', border:`1px solid ${ch.border}`,
              borderRadius:7, padding:'9px 12px', cursor:'pointer', marginBottom:5,
              transition:'all .15s',
            }}>
              {ch.icon}
              <span style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:ch.color }}>{ch.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
const ChartAnnotation = dynamic(() => import('@/components/ChartAnnotation'), { ssr: false })

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

// ── SVG visualisation des niveaux ─────────────────────────
function PriceLevelsSVG({ signal: s }: { signal: ChartSignal }) {
  const prices = [
    s.entry, s.stop_loss, s.tp1, s.tp2, s.tp3,
    s.order_block?.high, s.order_block?.low,
    s.fvg?.high, s.fvg?.low,
    s.bos_level, s.choch_level,
    s.liquidity_high, s.liquidity_low,
  ].filter((p): p is number => p != null && p > 0)

  if (prices.length < 2) return null

  const hi = Math.max(...prices), lo = Math.min(...prices)
  const rng = hi - lo || 1
  const top = hi + rng * 0.15, bot = lo - rng * 0.15, span = top - bot
  const W = 360, H = 180
  const toY = (p: number) => ((top - p) / span) * H

  const lines: { price:number; label:string; color:string; dashed:boolean }[] = []
  if (s.entry)          lines.push({ price:s.entry,         label:'ENTRÉE', color:'#00FFB2', dashed:false })
  if (s.stop_loss)      lines.push({ price:s.stop_loss,     label:'STOP',   color:'#FF3A5C', dashed:false })
  if (s.tp1)            lines.push({ price:s.tp1,           label:'TP 1',   color:'#00FFB2', dashed:true })
  if (s.tp2)            lines.push({ price:s.tp2!,          label:'TP 2',   color:'#00D4FF', dashed:true })
  if (s.tp3)            lines.push({ price:s.tp3!,          label:'TP 3',   color:'#7B61FF', dashed:true })
  if (s.bos_level)      lines.push({ price:s.bos_level!,    label:'BOS',    color:'#00D4FF', dashed:true })
  if (s.choch_level)    lines.push({ price:s.choch_level!,  label:'CHoCH',  color:'#FF6B35', dashed:true })
  if (s.liquidity_high) lines.push({ price:s.liquidity_high!,label:'BSL',   color:'#FF3A5C', dashed:true })
  if (s.liquidity_low)  lines.push({ price:s.liquidity_low!, label:'SSL',   color:'#00FFB2', dashed:true })

  const zones: { y1:number; y2:number; color:string; label:string }[] = []
  if (s.order_block) {
    const c = s.direction === 'LONG' ? '#00FFB2' : '#FF3A5C'
    const y1 = toY(s.order_block.high), y2 = toY(s.order_block.low)
    zones.push({ y1:Math.min(y1,y2), y2:Math.max(y1,y2), color:c, label:s.order_block.label||'OB' })
  }
  if (s.fvg) {
    const y1 = toY(s.fvg.high), y2 = toY(s.fvg.low)
    zones.push({ y1:Math.min(y1,y2), y2:Math.max(y1,y2), color:'#C9A84C', label:s.fvg.label||'FVG' })
  }

  const fmtP = (n: number) => n >= 100 ? n.toLocaleString('fr-FR',{maximumFractionDigits:2}) : n.toLocaleString('fr-FR',{maximumFractionDigits:5})

  return (
    <div style={{ background:'#020408', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', display:'block', maxHeight:200 }}>
        <rect width={W} height={H} fill="#060B14"/>
        {/* Grille */}
        {[0.25,0.5,0.75].map(p=>(
          <line key={p} x1={0} y1={H*p} x2={W} y2={H*p} stroke="rgba(255,255,255,0.03)" strokeWidth={1}/>
        ))}
        {/* Zones OB / FVG */}
        {zones.map((z,i)=>(
          <g key={i}>
            <rect x={0} y={z.y1} width={W} height={Math.max(z.y2-z.y1,1)} fill={z.color} fillOpacity={0.07}/>
            <line x1={0} y1={z.y1} x2={W} y2={z.y1} stroke={z.color} strokeWidth={0.8} strokeOpacity={0.35}/>
            <line x1={0} y1={z.y2} x2={W} y2={z.y2} stroke={z.color} strokeWidth={0.8} strokeOpacity={0.35}/>
            <text x={W-4} y={z.y1-2} textAnchor="end" fill={z.color} fontSize={7} fontFamily="Orbitron,monospace" opacity={0.6}>{z.label}</text>
          </g>
        ))}
        {/* Lignes niveaux */}
        {lines.map((l,i)=>{
          const y=toY(l.price); if(y<0||y>H)return null
          const lw = l.label.length * 6 + 8
          return (
            <g key={i}>
              <line x1={0} y1={y} x2={W} y2={y} stroke={l.color} strokeWidth={1.5} strokeOpacity={0.85}
                strokeDasharray={l.dashed?'6,3':undefined}/>
              {/* Badge label gauche */}
              <rect x={2} y={y-9} width={lw} height={12} rx={2} fill={l.color} fillOpacity={0.15}/>
              <text x={6} y={y} dominantBaseline="middle" fill={l.color} fontSize={9} fontFamily="Orbitron,monospace" fontWeight="bold">{l.label}</text>
              {/* Prix côté droit */}
              <text x={W-4} y={y} dominantBaseline="middle" textAnchor="end" fill={l.color} fontSize={9} fontFamily="Orbitron,monospace" opacity={0.9}>{fmtP(l.price)}</text>
            </g>
          )
        })}
      </svg>
      {/* Légende */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, padding:'5px 14px 7px', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
        {lines.slice(0,6).map((l,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ width:12, height:2, background:l.color, display:'inline-block', borderRadius:1 }}/>
            <span style={{ fontFamily:HUD, fontSize:6, letterSpacing:1, color:'rgba(232,244,248,0.35)' }}>{l.label}</span>
          </div>
        ))}
        {zones.map((z,i)=>(
          <div key={'z'+i} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ width:12, height:6, background:z.color, opacity:0.3, display:'inline-block', borderRadius:1 }}/>
            <span style={{ fontFamily:HUD, fontSize:6, letterSpacing:1, color:'rgba(232,244,248,0.35)' }}>{z.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Config order types ─────────────────────────────────────
const ORDER_TYPE_CFG: Record<OrderType, { label:string; color:string; bg:string; icon:string; desc:string }> = {
  BUY_LIMIT:   { label:'BUY LIMIT',   color:'#00FFB2', bg:'rgba(0,255,178,0.1)',  icon:'⬇️', desc:'Retour sur zone attendu' },
  SELL_LIMIT:  { label:'SELL LIMIT',  color:'#FF3A5C', bg:'rgba(255,58,92,0.1)',  icon:'⬆️', desc:'Retour sur zone attendu' },
  BUY_STOP:    { label:'BUY STOP',    color:'#00D4FF', bg:'rgba(0,212,255,0.1)',  icon:'⬆️', desc:'Cassure confirmation' },
  SELL_STOP:   { label:'SELL STOP',   color:'#FF6B35', bg:'rgba(255,107,53,0.1)', icon:'⬇️', desc:'Cassure confirmation' },
  MARKET_BUY:  { label:'MARKET BUY',  color:'#00FFB2', bg:'rgba(0,255,178,0.08)', icon:'▲',  desc:'Entrée immédiate' },
  MARKET_SELL: { label:'MARKET SELL', color:'#FF3A5C', bg:'rgba(255,58,92,0.08)', icon:'▼',  desc:'Entrée immédiate' },
  WAIT:        { label:'ATTENDRE',    color:'#C9A84C', bg:'rgba(201,168,76,0.08)',icon:'⏳', desc:'Setup insuffisant' },
}

const CONFIDENCE_CFG = {
  HIGH:   { color:'#00FFB2', label:'ÉLEVÉE',  stars:'●●●' },
  MEDIUM: { color:'#C9A84C', label:'MOYENNE', stars:'●●○' },
  LOW:    { color:'#FF3A5C', label:'FAIBLE',  stars:'●○○' },
}

function fmt(n: number | null | undefined, dec?: number): string {
  if (n == null || n === 0) return '—'
  const decimals = dec ?? (n > 100 ? 2 : 5)
  return n.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}
function rr(n: number | null | undefined): string {
  if (!n) return '—'
  return `1 : ${n.toFixed(2)}`
}

interface Props {
  signal:     ChartSignal | NewsSignal
  type?:      'chart' | 'news'
  locale?:    string
  imageFile?: File | null   // image uploadée — si fournie, affiche le chart annoté
  plan?:      string
  mode?:      'swing' | 'scalp'
}

export default function SignalCard({ signal, type = 'chart', locale = 'fr', imageFile, plan = 'free', mode = 'swing' }: Props) {
  const isChart  = type === 'chart'
  const cs       = isChart ? signal as ChartSignal : null
  const ns       = !isChart ? signal as NewsSignal : null
  const isScalp  = mode === 'scalp'
  const rrMin    = isScalp ? 1.0 : 1.5  // seuil R/R acceptable selon le mode
  const dir      = signal.direction
  const dirColor = dir === 'LONG' ? '#00FFB2' : dir === 'SHORT' ? '#FF3A5C' : '#C9A84C'
  const dirBg    = dir === 'LONG' ? 'rgba(0,255,178,0.08)' : dir === 'SHORT' ? 'rgba(255,58,92,0.08)' : 'rgba(201,168,76,0.08)'

  const orderCfg = cs?.order_type ? ORDER_TYPE_CFG[cs.order_type] : null
  const confCfg  = cs?.confidence ? CONFIDENCE_CFG[cs.confidence] : null
  const pair     = cs?.pair ?? ns?.pair_cible ?? '—'
  const tf       = cs?.timeframe
  const hasOB    = !!cs?.order_block
  const hasFVG   = !!cs?.fvg
  const hasBOS   = !!(cs?.bos_level || cs?.choch_level)

  return (
    <div style={{ background:'linear-gradient(145deg,#0A1628,#060B14)', border:'1px solid rgba(0,255,178,0.15)',
      borderRadius:14, overflow:'hidden', fontFamily:BODY }}>

      {/* Top gradient line */}
      <div style={{ height:3, background:`linear-gradient(90deg, transparent, ${dirColor}, ${orderCfg?.color || dirColor}, transparent)` }} />

      {/* Header */}
      <div style={{ padding:'16px 16px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, marginBottom:12 }}>
          {/* Paire + TF */}
          <div>
            <div style={{ fontFamily:HUD, fontSize:24, fontWeight:900, color:dirColor, letterSpacing:1 }}>
              {pair}
            </div>
            {tf && (
              <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'rgba(232,244,248,0.35)', marginTop:2 }}>
                TIMEFRAME · {tf}
              </div>
            )}
          </div>

          {/* Direction + Order type */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
            {/* Badge SCALP */}
            {isScalp && (
              <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'#FF6B35',
                background:'rgba(255,107,53,0.1)', border:'1px solid rgba(255,107,53,0.35)',
                padding:'3px 10px', borderRadius:4 }}>
                ⚡ SCALP
              </div>
            )}
            <div style={{ fontFamily:HUD, fontSize:13, fontWeight:900, color:dirColor,
              background:dirBg, border:`1px solid ${dirColor}30`,
              padding:'5px 14px', borderRadius:6 }}>
              {dir === 'LONG' ? '▲ LONG' : dir === 'SHORT' ? '▼ SHORT' : '⟷ NEUTRE'}
            </div>
            {orderCfg && (
              <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:orderCfg.color,
                background:orderCfg.bg, border:`1px solid ${orderCfg.color}30`,
                padding:'4px 10px', borderRadius:4 }}>
                {orderCfg.icon} {orderCfg.label}
              </div>
            )}
          </div>
        </div>

        {/* Confiance + trend + phase */}
        {(confCfg || cs?.trend) && (
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {confCfg && (
              <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.07)', borderRadius:6, padding:'4px 10px' }}>
                <span style={{ fontFamily:HUD, fontSize:11, color:confCfg.color }}>{confCfg.stars}</span>
                <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:confCfg.color }}>
                  CONFIANCE {confCfg.label}
                </span>
              </div>
            )}
            {cs?.trend && (
              <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, padding:'4px 10px', borderRadius:6,
                background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)',
                color:'rgba(232,244,248,0.5)' }}>
                {cs.trend === 'BULLISH' ? '📈' : cs.trend === 'BEARISH' ? '📉' : '↔️'} {cs.trend}
                {cs.phase && <span style={{ color:'rgba(232,244,248,0.3)', marginLeft:4 }}>· {cs.phase.toUpperCase()}</span>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart annoté après étoiles de confiance */}
      {cs && imageFile && (
        <ChartAnnotation imageFile={imageFile} signal={cs} plan={plan} />
      )}

      {/* Niveaux principaux */}
      <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'rgba(232,244,248,0.3)', marginBottom:10 }}>
          NIVEAUX DU SIGNAL
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:10 }}>
          {/* Entrée */}
          <div style={{ background:'rgba(0,255,178,0.06)', border:'1px solid rgba(0,255,178,0.2)', borderRadius:8, padding:'10px', textAlign:'center' }}>
            <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'rgba(0,255,178,0.6)', marginBottom:4 }}>
              {orderCfg ? orderCfg.label : 'ENTRÉE'}
            </div>
            <div style={{ fontFamily:HUD, fontSize:16, fontWeight:900, color:'#00FFB2' }}>
              {fmt(signal.entry)}
            </div>
            {orderCfg?.desc && (
              <div style={{ fontFamily:BODY, fontSize:9, color:'rgba(0,255,178,0.4)', marginTop:2 }}>
                {orderCfg.desc}
              </div>
            )}
          </div>
          {/* Stop Loss */}
          <div style={{ background:'rgba(255,58,92,0.06)', border:'1px solid rgba(255,58,92,0.2)', borderRadius:8, padding:'10px', textAlign:'center' }}>
            <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'rgba(255,58,92,0.6)', marginBottom:4 }}>STOP LOSS</div>
            <div style={{ fontFamily:HUD, fontSize:16, fontWeight:900, color:'#FF3A5C' }}>{fmt(signal.stop_loss)}</div>
            <div style={{ fontFamily:BODY, fontSize:9, color:'rgba(255,58,92,0.4)', marginTop:2 }}>Invalidation</div>
          </div>
          {/* R/R */}
          <div style={{ background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'10px', textAlign:'center' }}>
            <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'rgba(201,168,76,0.6)', marginBottom:4 }}>RATIO R/R</div>
            <div style={{ fontFamily:HUD, fontSize:16, fontWeight:900, color:'#C9A84C' }}>{rr(signal.rr_ratio)}</div>
            <div style={{ fontFamily:BODY, fontSize:9, color: (signal.rr_ratio ?? 0) >= 2 ? '#00FFB2' : (signal.rr_ratio ?? 0) >= rrMin ? '#C9A84C' : '#FF3A5C', marginTop:2 }}>
              {(signal.rr_ratio ?? 0) >= 2 ? '✅ Excellent' : (signal.rr_ratio ?? 0) >= rrMin ? '⚠️ Acceptable' : '❌ Faible'}
            </div>
          </div>
        </div>

        {/* TPs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:6 }}>
          {[['TP1', signal.tp1, '#00FFB2'], ['TP2', signal.tp2, '#00D4FF'], ['TP3', signal.tp3, '#7B61FF']].map(([label, val, color]) =>
            val ? (
              <div key={String(label)} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:6, padding:'8px', textAlign:'center' }}>
                <div style={{ fontFamily:HUD, fontSize:6, letterSpacing:1, color:'rgba(232,244,248,0.3)', marginBottom:3 }}>{label}</div>
                <div style={{ fontFamily:HUD, fontSize:13, fontWeight:700, color:String(color) }}>{fmt(Number(val))}</div>
              </div>
            ) : null
          )}
        </div>
      </div>

      {/* Zones SMC (OB, FVG, BOS) */}
      {(hasOB || hasFVG || hasBOS || cs?.liquidity_high || cs?.liquidity_low) && (
        <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'rgba(232,244,248,0.3)', marginBottom:8 }}>
            STRUCTURE SMC
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>

            {cs?.order_block && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                background: cs.order_block.type==='bullish' ? 'rgba(0,255,178,0.05)' : 'rgba(255,58,92,0.05)',
                border: `1px solid ${cs.order_block.type==='bullish' ? 'rgba(0,255,178,0.2)' : 'rgba(255,58,92,0.2)'}`,
                borderRadius:7, padding:'8px 12px' }}>
                <div>
                  <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:1,
                    color: cs.order_block.type==='bullish' ? '#00FFB2' : '#FF3A5C', marginBottom:2 }}>
                    📦 ORDER BLOCK {cs.order_block.type.toUpperCase()} · {cs.order_block.label}
                  </div>
                  <div style={{ fontFamily:HUD, fontSize:9, color:'rgba(232,244,248,0.5)' }}>
                    {fmt(cs.order_block.low)} – {fmt(cs.order_block.high)}
                  </div>
                </div>
                <div style={{ fontFamily:HUD, fontSize:7, color:'rgba(232,244,248,0.3)' }}>Zone d'intérêt</div>
              </div>
            )}

            {cs?.fvg && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                background:'rgba(201,168,76,0.05)', border:'1px solid rgba(201,168,76,0.2)',
                borderRadius:7, padding:'8px 12px' }}>
                <div>
                  <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'#C9A84C', marginBottom:2 }}>
                    ⚡ FAIR VALUE GAP · {cs.fvg.label}
                  </div>
                  <div style={{ fontFamily:HUD, fontSize:9, color:'rgba(232,244,248,0.5)' }}>
                    {fmt(cs.fvg.low)} – {fmt(cs.fvg.high)}
                  </div>
                </div>
                <div style={{ fontFamily:HUD, fontSize:7, color:'rgba(232,244,248,0.3)' }}>Déséquilibre</div>
              </div>
            )}

            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {cs?.bos_level && (
                <div style={{ flex:1, background:'rgba(0,212,255,0.05)', border:'1px solid rgba(0,212,255,0.2)',
                  borderRadius:7, padding:'8px 10px' }}>
                  <div style={{ fontFamily:HUD, fontSize:7, color:'#00D4FF', letterSpacing:1, marginBottom:2 }}>🔀 BOS</div>
                  <div style={{ fontFamily:HUD, fontSize:12, color:'#00D4FF' }}>{fmt(cs.bos_level)}</div>
                </div>
              )}
              {cs?.choch_level && (
                <div style={{ flex:1, background:'rgba(255,107,53,0.05)', border:'1px solid rgba(255,107,53,0.2)',
                  borderRadius:7, padding:'8px 10px' }}>
                  <div style={{ fontFamily:HUD, fontSize:7, color:'#FF6B35', letterSpacing:1, marginBottom:2 }}>↩️ CHOCH</div>
                  <div style={{ fontFamily:HUD, fontSize:12, color:'#FF6B35' }}>{fmt(cs.choch_level)}</div>
                </div>
              )}
              {cs?.liquidity_high && (
                <div style={{ flex:1, background:'rgba(255,58,92,0.05)', border:'1px solid rgba(255,58,92,0.15)',
                  borderRadius:7, padding:'8px 10px' }}>
                  <div style={{ fontFamily:HUD, fontSize:7, color:'rgba(255,58,92,0.7)', letterSpacing:1, marginBottom:2 }}>💧 BSL</div>
                  <div style={{ fontFamily:HUD, fontSize:12, color:'#FF3A5C' }}>{fmt(cs.liquidity_high)}</div>
                </div>
              )}
              {cs?.liquidity_low && (
                <div style={{ flex:1, background:'rgba(0,255,178,0.04)', border:'1px solid rgba(0,255,178,0.12)',
                  borderRadius:7, padding:'8px 10px' }}>
                  <div style={{ fontFamily:HUD, fontSize:7, color:'rgba(0,255,178,0.5)', letterSpacing:1, marginBottom:2 }}>💧 SSL</div>
                  <div style={{ fontFamily:HUD, fontSize:12, color:'#00FFB2' }}>{fmt(cs.liquidity_low)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confluences */}
      {cs?.confluence_factors && cs.confluence_factors.length > 0 && (
        <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'rgba(232,244,248,0.3)', marginBottom:8 }}>
            CONFLUENCES ({cs.confluence_factors.length})
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {cs.confluence_factors.map((c, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ color:'#00FFB2', fontSize:10 }}>✓</span>
                <span style={{ fontFamily:BODY, fontSize:13, color:'rgba(232,244,248,0.7)' }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analyse SMC */}
      {(cs?.smc_analysis || cs?.market_state) && (
        <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          {cs.market_state && (
            <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'rgba(0,212,255,0.7)',
              background:'rgba(0,212,255,0.06)', border:'1px solid rgba(0,212,255,0.1)',
              borderRadius:5, padding:'5px 10px', marginBottom:8 }}>
              📊 {cs.market_state}
            </div>
          )}
          {cs.smc_analysis && (
            <p style={{ fontFamily:BODY, fontSize:14, color:'rgba(232,244,248,0.6)', lineHeight:1.7, margin:0 }}>
              {cs.smc_analysis}
            </p>
          )}
        </div>
      )}

      {/* Conclusion + news interpretation */}
      <div style={{ padding:'14px 16px' }}>
        <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'rgba(232,244,248,0.3)', marginBottom:8 }}>
          CONCLUSION
        </div>
        <p style={{ fontFamily:BODY, fontSize:14, color:'rgba(232,244,248,0.75)', lineHeight:1.7, margin:0 }}>
          {cs?.conclusion || ns?.interpretation || ''}
        </p>
        {/* Avertissement risk */}
        <div style={{ marginTop:12, fontFamily:BODY, fontSize:10, color:'rgba(232,244,248,0.2)', fontStyle:'italic' }}>
          ⚠️ Signal éducatif uniquement — gérez votre risque. Ne jamais risquer plus de 2% par trade.
        </div>
      </div>

      {/* Actions — Partage multi-réseaux + Track record */}
      <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.05)', display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>

        {/* Bouton partage — menu déroulant */}
        <ShareMenu pair={pair} dir={dir} tf={tf} cs={cs} locale={locale} />

        {/* Lien track record */}
        <a href="/results" target="_blank" style={{
          display:'flex', alignItems:'center', gap:5,
          background:'transparent', border:'1px solid rgba(255,255,255,0.07)',
          borderRadius:6, padding:'7px 12px',
          fontFamily:HUD, fontSize:8, letterSpacing:1, color:'rgba(240,248,255,0.35)',
          textDecoration:'none',
        }}>
          📊 TRACK RECORD
        </a>

        {/* Badge vérifié si WIN */}
        {(cs as ChartSignal & { trade_result?: string })?.trade_result === 'WIN' && (
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5,
            background:'rgba(0,255,178,0.08)', border:'1px solid rgba(0,255,178,0.25)',
            borderRadius:6, padding:'5px 10px' }}>
            <span style={{ fontSize:12 }}>✅</span>
            <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'#00FFB2' }}>VÉRIFIÉ WIN</span>
          </div>
        )}
        {(cs as ChartSignal & { trade_result?: string })?.trade_result === 'LOSS' && (
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5,
            background:'rgba(255,58,92,0.08)', border:'1px solid rgba(255,58,92,0.2)',
            borderRadius:6, padding:'5px 10px' }}>
            <span style={{ fontSize:12 }}>📉</span>
            <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'#FF3A5C' }}>VÉRIFIÉ LOSS</span>
          </div>
        )}
      </div>
    </div>
  )
}
