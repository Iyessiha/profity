// ============================================================
// PROFITYX — SignalCard v2 (style landing page mockup)
// ============================================================
'use client'
import type { ChartSignal, NewsSignal } from '@/types'

type Signal = ChartSignal | NewsSignal
interface Props { signal: Signal; type: 'chart' | 'news'; creditBalance?: number }

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

const DIR_CFG = {
  LONG:   { color: '#00FFB2', bg: 'rgba(0,255,178,0.1)',  border: 'rgba(0,255,178,0.3)'  },
  SHORT:  { color: '#FF3A5C', bg: 'rgba(255,58,92,0.1)',  border: 'rgba(255,58,92,0.3)'  },
  NEUTRE: { color: '#C9A84C', bg: 'rgba(201,168,76,0.1)', border: 'rgba(201,168,76,0.3)' },
}

function fmt(n: number | null | undefined): string {
  if (n == null || isNaN(n as number)) return '—'
  return (n as number) > 1000
    ? (n as number).toLocaleString('fr-FR', { maximumFractionDigits: 2 })
    : (n as number).toFixed(5)
}

function ConfidenceBar({ value }: { value?: string }) {
  if (!value) return null
  const pct = /ELEV|HIGH/i.test(value) ? 87 : /MOY|MED/i.test(value) ? 62 : 38
  const col = pct >= 75 ? '#00FFB2' : pct >= 50 ? '#C9A84C' : '#FF3A5C'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', borderTop:'1px solid rgba(0,255,178,0.06)' }}>
      <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'rgba(232,244,248,0.35)', whiteSpace:'nowrap' }}>CONFIANCE IA</span>
      <div style={{ flex:1, height:5, background:'rgba(255,255,255,0.06)', borderRadius:3 }}>
        <div style={{ width:`${pct}%`, height:'100%', background:`linear-gradient(90deg, ${col}, ${col}99)`, borderRadius:3, transition:'width .8s ease' }} />
      </div>
      <span style={{ fontFamily:HUD, fontSize:12, fontWeight:900, color:col }}>{pct}%</span>
    </div>
  )
}

function MiniChart({ direction }: { direction: string }) {
  const isLong  = direction === 'LONG'
  const lineClr = '#00FFB2'
  // Chemin haussier ou baissier selon direction
  const path = isLong
    ? 'M0,62 L32,55 L64,58 L96,44 L128,40 L160,46 L192,32 L224,26 L256,32 L288,18 L320,22 L352,14 L380,8'
    : 'M0,8  L32,14 L64,10 L96,22 L128,28 L160,20 L192,36 L224,42 L256,36 L288,50 L320,46 L352,54 L380,62'
  const fill = isLong
    ? 'M0,62 L32,55 L64,58 L96,44 L128,40 L160,46 L192,32 L224,26 L256,32 L288,18 L320,22 L352,14 L380,8 L380,72 L0,72Z'
    : 'M0,8  L32,14 L64,10 L96,22 L128,28 L160,20 L192,36 L224,42 L256,36 L288,50 L320,46 L352,54 L380,62 L380,0 L0,0Z'
  const entryY = isLong ? 26 : 46
  const slY    = isLong ? 46 : 20
  const tpY    = isLong ? 8  : 60
  const candles = isLong
    ? [[32,51,59],[96,40,48],[160,42,50],[224,22,30],[288,14,22],[352,10,18]]
    : [[32,10,18],[96,18,28],[160,16,26],[224,38,46],[288,44,52],[352,50,58]]
  const reds = isLong
    ? [[64,54,61],[128,36,44],[256,28,36]]
    : [[64,8,14],[128,24,32],[256,32,40]]

  return (
    <div style={{ background:'rgba(0,0,0,0.25)', border:'1px solid rgba(0,255,178,0.07)', borderRadius:10, padding:'10px 12px', marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <span style={{ fontFamily:HUD, fontSize:8, color:'#00FFB2', letterSpacing:1 }}>CHART IA</span>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#00E676', display:'inline-block', animation:'pxPulse 1.5s infinite' }} />
          <span style={{ fontFamily:HUD, fontSize:7, color:'rgba(232,244,248,0.4)' }}>LIVE</span>
        </div>
      </div>
      <svg width="100%" height="72" viewBox="0 0 380 72" preserveAspectRatio="none">
        {[18,36,54].map(y => <line key={y} x1="0" y1={y} x2="380" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>)}
        <defs>
          <linearGradient id={`cf${direction}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineClr} stopOpacity={isLong?0.15:0.08}/>
            <stop offset="100%" stopColor={lineClr} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={fill} fill={`url(#cf${direction})`}/>
        <path d={path} stroke={lineClr} strokeWidth="2" fill="none" strokeLinecap="round"/>
        {candles.map(([x,y1,y2],i) => <line key={'g'+i} x1={x} y1={y1} x2={x} y2={y2} stroke="#00FFB2" strokeWidth="5" strokeLinecap="round" opacity="0.85"/>)}
        {reds.map(([x,y1,y2],i) => <line key={'r'+i} x1={x} y1={y1} x2={x} y2={y2} stroke="#FF3A5C" strokeWidth="5" strokeLinecap="round" opacity="0.85"/>)}
        {/* Lignes TP / ENTRÉE / SL */}
        <line x1="180" y1={tpY}    x2="380" y2={tpY}    stroke="#00D4FF" strokeWidth="1" strokeDasharray="4,3"/>
        <line x1="180" y1={entryY} x2="380" y2={entryY} stroke="#00FFB2" strokeWidth="1.2" strokeDasharray="4,3"/>
        <line x1="180" y1={slY}    x2="380" y2={slY}    stroke="#FF3A5C" strokeWidth="1" strokeDasharray="4,3"/>
        <text x="310" y={tpY-3}    fontFamily="monospace" fontSize="7.5" fill="#00D4FF">TP</text>
        <text x="296" y={entryY-3} fontFamily="monospace" fontSize="7.5" fill="#00FFB2">ENTRÉE</text>
        <text x="316" y={slY-3}    fontFamily="monospace" fontSize="7.5" fill="#FF3A5C">SL</text>
      </svg>
      <style>{`@keyframes pxPulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  )
}

export default function SignalCard({ signal, type, creditBalance }: Props) {
  const dir    = signal.direction in DIR_CFG ? signal.direction : 'NEUTRE'
  const cfg    = DIR_CFG[dir as keyof typeof DIR_CFG]
  const pair   = type === 'chart' ? (signal as ChartSignal).pair : (signal as NewsSignal).pair_cible
  const tf     = type === 'chart' ? (signal as ChartSignal).timeframe : null
  const cs     = type === 'chart' ? signal as ChartSignal : null
  const concl  = cs?.conclusion ?? (signal as NewsSignal).interpretation
  const rr     = signal.rr_ratio

  return (
    <div style={{ background:'linear-gradient(160deg,#0A1628,#060B14)', border:`1px solid ${cfg.border}`, borderRadius:14, overflow:'hidden', boxShadow:`0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,255,178,0.05)`, fontFamily:BODY }}>

      {/* Barre couleur top */}
      <div style={{ height:2, background:`linear-gradient(90deg, transparent, ${cfg.color}, transparent)` }} />

      <div style={{ padding:'14px 16px' }}>

        {/* Chart IA */}
        <MiniChart direction={dir} />

        {/* Signal principal */}
        <div style={{ background:'linear-gradient(135deg,rgba(0,255,178,0.05),rgba(0,212,255,0.03))', border:`1px solid ${cfg.border}`, borderRadius:10, padding:'14px 16px' }}>

          {/* Direction + Paire + R/R */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                <span style={{ fontFamily:HUD, fontSize:22, fontWeight:900, color:cfg.color, lineHeight:1 }}>{dir}</span>
                <span style={{ fontFamily:HUD, fontSize:13, color:'#E8F4F8' }}>{pair || '—'}</span>
                {tf && <span style={{ fontFamily:HUD, fontSize:9, color:'#00D4FF', background:'rgba(0,212,255,0.1)', border:'1px solid rgba(0,212,255,0.2)', borderRadius:4, padding:'2px 8px' }}>{tf}</span>}
              </div>
              {cs?.smc_analysis && (
                <div style={{ fontFamily:BODY, fontSize:12, color:'rgba(232,244,248,0.45)', lineHeight:1.4, maxWidth:220 }}>
                  {cs.smc_analysis.slice(0, 55)}{cs.smc_analysis.length > 55 ? '…' : ''}
                </div>
              )}
              {!cs?.smc_analysis && concl && (
                <div style={{ fontFamily:BODY, fontSize:12, color:'rgba(232,244,248,0.45)' }}>
                  {concl.slice(0, 55)}{concl.length > 55 ? '…' : ''}
                </div>
              )}
            </div>
            {rr && (
              <div style={{ background:'rgba(0,255,178,0.08)', border:'1px solid rgba(0,255,178,0.2)', borderRadius:8, padding:'8px 12px', textAlign:'center', minWidth:60 }}>
                <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'rgba(232,244,248,0.4)', marginBottom:2 }}>R/R</div>
                <div style={{ fontFamily:HUD, fontSize:16, fontWeight:900, color:'#00FFB2', lineHeight:1 }}>1:{rr}</div>
              </div>
            )}
          </div>

          {/* ENTRÉE / STOP / TP1 */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {[
              { l:'ENTRÉE', v:fmt(signal.entry),     c:'#00FFB2' },
              { l:'STOP',   v:fmt(signal.stop_loss), c:'#FF3A5C' },
              { l:'TP1',    v:fmt(signal.tp1),       c:'#00D4FF' },
            ].map(s => (
              <div key={s.l} style={{ background:'rgba(0,0,0,0.3)', borderRadius:7, padding:'9px 10px', textAlign:'center' }}>
                <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'rgba(232,244,248,0.35)', marginBottom:4 }}>{s.l}</div>
                <div style={{ fontFamily:HUD, fontSize:14, fontWeight:700, color:s.c, lineHeight:1 }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* TP2 / TP3 si disponibles */}
          {(signal.tp2 || signal.tp3) && (
            <div style={{ display:'grid', gridTemplateColumns:`repeat(${[signal.tp2,signal.tp3].filter(Boolean).length},1fr)`, gap:8, marginTop:8 }}>
              {[{l:'TP2',v:signal.tp2},{l:'TP3',v:signal.tp3}].filter(t=>t.v).map(t => (
                <div key={t.l} style={{ background:'rgba(0,255,178,0.04)', border:'1px solid rgba(0,255,178,0.1)', borderRadius:7, padding:'9px 10px', textAlign:'center' }}>
                  <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'rgba(232,244,248,0.35)', marginBottom:4 }}>{t.l}</div>
                  <div style={{ fontFamily:HUD, fontSize:13, fontWeight:700, color:'#00E676', lineHeight:1 }}>{fmt(t.v)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Badges SMC / marché */}
        {cs && (cs.market_state || cs.confluence_factors) && (
          <div style={{ marginTop:10, display:'flex', flexWrap:'wrap', gap:6 }}>
            {cs.market_state && (
              <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'#00D4FF', background:'rgba(0,212,255,0.08)', border:'1px solid rgba(0,212,255,0.2)', borderRadius:3, padding:'3px 9px' }}>
                {cs.market_state.replace(/_/g,' ')}
              </span>
            )}
            {(cs.confluence_factors ?? []).slice(0,3).map((f:string,i:number) => (
              <span key={i} style={{ fontFamily:BODY, fontSize:11, color:'rgba(0,255,178,0.7)', background:'rgba(0,255,178,0.05)', border:'1px solid rgba(0,255,178,0.12)', borderRadius:100, padding:'2px 9px' }}>
                ✓ {f}
              </span>
            ))}
          </div>
        )}

        {/* Conclusion IA complète */}
        {concl && (
          <div style={{ marginTop:10, background:'rgba(0,212,255,0.04)', border:'1px solid rgba(0,212,255,0.1)', borderRadius:8, padding:'12px 14px' }}>
            <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'#00D4FF', marginBottom:7 }}>
              &gt; {type === 'chart' ? 'ANALYSE IA' : 'INTERPRÉTATION IA'}
            </div>
            <p style={{ fontFamily:BODY, fontSize:13, color:'rgba(232,244,248,0.65)', lineHeight:1.7, margin:0 }}>{concl}</p>
          </div>
        )}
      </div>

      {/* Barre confiance IA */}
      <ConfidenceBar value={cs?.confidence} />

      {/* Footer crédits */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 16px', background:'rgba(0,255,178,0.03)', borderTop:'1px solid rgba(0,255,178,0.06)' }}>
        <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'rgba(232,244,248,0.3)' }}>
          1 CRÉDIT UTILISÉ{creditBalance !== undefined ? ` · SOLDE : ${creditBalance}` : ''}
        </span>
        <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'#00FFB2' }}>
          ✓ ANALYSE {type==='chart'?'SMC ':''}COMPLÈTE
        </span>
      </div>
    </div>
  )
}
