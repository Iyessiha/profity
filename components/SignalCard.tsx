// ============================================================
// PROFITYX — Composant SignalCard
// Affiche le signal IA : direction, entrée, SL, TP1/2/3
// ============================================================
'use client'
import type { ChartSignal, NewsSignal } from '@/types'

type Signal = ChartSignal | NewsSignal

interface Props {
  signal: Signal
  type:   'chart' | 'news'
}

const DIRECTION_COLORS = {
  LONG:   { bg: 'rgba(0,230,118,0.08)', border: 'rgba(0,230,118,0.3)', text: '#00E676', label: 'LONG' },
  SHORT:  { bg: 'rgba(255,58,92,0.08)', border: 'rgba(255,58,92,0.3)', text: '#FF3A5C', label: 'SHORT' },
  NEUTRE: { bg: 'rgba(201,168,76,0.08)', border: 'rgba(201,168,76,0.3)', text: '#C9A84C', label: 'NEUTRE' },
}

function formatPrice(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—'
  if (n > 1000) return n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
  return n.toFixed(5)
}

export default function SignalCard({ signal, type }: Props) {
  const dir    = signal.direction in DIRECTION_COLORS ? signal.direction : 'NEUTRE'
  const colors = DIRECTION_COLORS[dir as keyof typeof DIRECTION_COLORS]

  const pair = type === 'chart'
    ? (signal as ChartSignal).pair
    : (signal as NewsSignal).pair_cible

  const conclusion = type === 'chart'
    ? (signal as ChartSignal).conclusion
    : (signal as NewsSignal).interpretation

  return (
    <div style={{
      background: 'var(--bg3)',
      border: '1px solid rgba(0,255,178,0.12)',
      borderRadius: '8px',
      overflow: 'hidden',
      fontFamily: "'Rajdhani', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: 'var(--bg1)',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(0,255,178,0.08)',
      }}>
        <div>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, color: '#00FFB2', letterSpacing: 2 }}>
            {pair || '—'}
          </div>
          {type === 'chart' && (signal as ChartSignal).timeframe && (
            <div style={{ fontSize: 11, color: 'rgba(232,244,248,0.4)', marginTop: 2 }}>
              Timeframe : {(signal as ChartSignal).timeframe}
            </div>
          )}
          {type === 'news' && (signal as NewsSignal).event_title && (
            <div style={{ fontSize: 11, color: 'rgba(232,244,248,0.4)', marginTop: 2 }}>
              {(signal as NewsSignal).event_title}
            </div>
          )}
        </div>
        <div style={{
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          color: colors.text,
          fontFamily: "'Orbitron', monospace",
          fontSize: 11,
          letterSpacing: 2,
          padding: '5px 14px',
          borderRadius: 4,
        }}>
          {colors.label}
        </div>
      </div>

      {/* Grid signal */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 1,
        background: 'rgba(0,255,178,0.05)',
        padding: '1px',
      }}>
        {/* Entrée */}
        <div style={{ background: 'var(--bg3)', padding: '14px 16px', borderLeft: '2px solid #C9A84C' }}>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 8, letterSpacing: 2, color: 'rgba(232,244,248,0.4)', marginBottom: 4 }}>
            ENTRÉE
          </div>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 18, fontWeight: 700, color: '#C9A84C' }}>
            {formatPrice(signal.entry)}
          </div>
        </div>

        {/* Stop Loss */}
        <div style={{ background: 'var(--bg3)', padding: '14px 16px', borderLeft: '2px solid #FF3A5C' }}>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 8, letterSpacing: 2, color: 'rgba(232,244,248,0.4)', marginBottom: 4 }}>
            STOP LOSS
          </div>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 18, fontWeight: 700, color: '#FF3A5C' }}>
            {formatPrice(signal.stop_loss)}
          </div>
        </div>

        {/* Ratio R/R */}
        <div style={{ background: 'var(--bg3)', padding: '14px 16px', borderLeft: '2px solid rgba(0,212,255,0.4)' }}>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 8, letterSpacing: 2, color: 'rgba(232,244,248,0.4)', marginBottom: 4 }}>
            RATIO R/R
          </div>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 18, fontWeight: 700, color: '#00D4FF' }}>
            {signal.rr_ratio ? `${signal.rr_ratio}x` : '—'}
          </div>
        </div>
      </div>

      {/* Take Profits */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '12px 16px' }}>
        {[signal.tp1, signal.tp2, signal.tp3].map((tp, i) => (
          <div key={i} style={{
            background: tp ? 'rgba(0,255,178,0.05)' : 'rgba(232,244,248,0.02)',
            border: `1px solid ${tp ? 'rgba(0,255,178,0.15)' : 'rgba(232,244,248,0.05)'}`,
            borderRadius: 6,
            padding: '10px 12px',
            opacity: tp ? 1 : 0.3,
          }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 8, letterSpacing: 2, color: 'rgba(232,244,248,0.4)', marginBottom: 4 }}>
              TP {i + 1}
            </div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 15, fontWeight: 700, color: '#00E676' }}>
              {tp ? formatPrice(tp) : '—'}
            </div>
          </div>
        ))}
      </div>

      {/* Conclusion */}
      {conclusion && (
        <div style={{
          margin: '0 16px 16px',
          background: 'rgba(0,255,178,0.04)',
          border: '1px solid var(--bd)',
          borderRadius: 6,
          padding: '12px 14px',
        }}>
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 8,
            letterSpacing: 3,
            color: '#00D4FF',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span style={{ color: 'rgba(0,212,255,0.4)' }}>&gt;</span>
            {type === 'chart' ? 'ANALYSE IA' : 'INTERPRÉTATION IA'}
          </div>
          <p style={{ fontSize: 14, color: 'rgba(232,244,248,0.65)', lineHeight: 1.7, margin: 0, fontWeight: 300 }}>
            {conclusion}
          </p>
        </div>
      )}

      {/* Champs avancés (Pro/Elite) — état marché, confiance, SMC */}
      {type === 'chart' && (() => {
        const s = signal as ChartSignal
        if (!s.market_state && !s.confidence && !s.smc_analysis) return null
        const confColor = s.confidence && /ELEV|HIGH/i.test(s.confidence) ? '#00E676'
          : s.confidence && /MOY|MEDIUM/i.test(s.confidence) ? '#C9A84C' : '#FF8800'
        return (
          <div style={{ margin: '0 16px 16px' }}>
            {/* Badges état + confiance */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: (s.smc_analysis || s.confluence_factors) ? 12 : 0 }}>
              {s.market_state && (
                <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 8, letterSpacing: 1, color: '#00D4FF', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 3, padding: '4px 10px' }}>
                  📊 {s.market_state.replace(/_/g, ' ')}
                </span>
              )}
              {s.confidence && (
                <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 8, letterSpacing: 1, color: confColor, background: confColor + '15', border: `1px solid ${confColor}30`, borderRadius: 3, padding: '4px 10px' }}>
                  CONFIANCE : {s.confidence}
                </span>
              )}
            </div>

            {/* Analyse SMC */}
            {s.smc_analysis && (
              <div style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 6, padding: '12px 14px', marginBottom: s.confluence_factors ? 10 : 0 }}>
                <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 8, letterSpacing: 2, color: '#C9A84C', marginBottom: 6 }}>
                  🎯 SMART MONEY CONCEPTS
                </div>
                <p style={{ fontSize: 13, color: 'rgba(232,244,248,0.6)', lineHeight: 1.6, margin: 0, fontWeight: 300 }}>{s.smc_analysis}</p>
              </div>
            )}

            {/* Facteurs de confluence */}
            {s.confluence_factors && s.confluence_factors.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {s.confluence_factors.map((f, i) => (
                  <span key={i} style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: 'rgba(0,255,178,0.7)', background: 'rgba(0,255,178,0.05)', border: '1px solid rgba(0,255,178,0.12)', borderRadius: 100, padding: '3px 10px' }}>
                    ✓ {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
