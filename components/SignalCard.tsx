// ============================================================
// PROFITYX — SignalCard v3 (SMC complet)
// ============================================================
'use client'
import type { ChartSignal, NewsSignal, OrderType } from '@/types'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

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
  signal: ChartSignal | NewsSignal
  type?: 'chart' | 'news'
  locale?: string
}

export default function SignalCard({ signal, type = 'chart', locale = 'fr' }: Props) {
  const isChart  = type === 'chart'
  const cs       = isChart ? signal as ChartSignal : null
  const ns       = !isChart ? signal as NewsSignal : null

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
            <div style={{ fontFamily:BODY, fontSize:9, color: (signal.rr_ratio ?? 0) >= 2 ? '#00FFB2' : (signal.rr_ratio ?? 0) >= 1.5 ? '#C9A84C' : '#FF3A5C', marginTop:2 }}>
              {(signal.rr_ratio ?? 0) >= 2 ? '✅ Excellent' : (signal.rr_ratio ?? 0) >= 1.5 ? '⚠️ Acceptable' : '❌ Faible'}
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
    </div>
  )
}
