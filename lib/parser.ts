// ============================================================
// PROFITYX — Parser de réponses Claude (SMC v3)
// ============================================================
import type { ChartSignal, NewsSignal } from '@/types'

export function parseClaudeJSON(raw: string): Record<string, unknown> | null {
  let cleaned = raw.trim()
  // Retirer les backticks si présents
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '')
  // Extraire le JSON s'il y a du texte autour
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (jsonMatch) cleaned = jsonMatch[0]
  try {
    return JSON.parse(cleaned)
  } catch {
    return null
  }
}

export function validateChartSignal(obj: Record<string, unknown>): ChartSignal | null {
  const n = (v: unknown, fallback = 0): number => {
    const x = parseFloat(String(v))
    return isNaN(x) ? fallback : x
  }
  const s = (v: unknown): string => (v != null ? String(v) : '')
  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.map(String) : []

  const direction = s(obj.direction).toUpperCase() as ChartSignal['direction']
  if (!['LONG', 'SHORT', 'NEUTRE'].includes(direction)) return null

  const entry     = n(obj.entry)
  const stop_loss = n(obj.stop_loss)
  const tp1       = n(obj.tp1)
  if (!entry || !stop_loss || !tp1) return null

  // Calculer rr_ratio si absent ou invalide
  let rr = n(obj.rr_ratio)
  if (!rr && direction !== 'NEUTRE') {
    const slDist = Math.abs(entry - stop_loss)
    const tpDist = Math.abs(tp1 - entry)
    rr = slDist > 0 ? Math.round((tpDist / slDist) * 100) / 100 : 0
  }

  // Order block
  let ob: ChartSignal['order_block'] = null
  if (obj.order_block && typeof obj.order_block === 'object') {
    const o = obj.order_block as Record<string, unknown>
    ob = {
      high:  n(o.high),
      low:   n(o.low),
      type:  s(o.type) === 'bearish' ? 'bearish' : 'bullish',
      label: s(o.label) || 'OB',
    }
  }

  // FVG
  let fvg: ChartSignal['fvg'] = null
  if (obj.fvg && typeof obj.fvg === 'object') {
    const f = obj.fvg as Record<string, unknown>
    fvg = {
      high:  n(f.high),
      low:   n(f.low),
      type:  s(f.type) === 'bearish' ? 'bearish' : 'bullish',
      label: s(f.label) || 'FVG',
    }
  }

  // Annotations chart (Elite)
  let annotations: ChartSignal['annotations'] = null
  if (Array.isArray(obj.annotations) && obj.annotations.length > 0) {
    annotations = (obj.annotations as Record<string, unknown>[])
      .filter(a => n(a.price) > 0)
      .map(a => ({
        type:     s(a.type) as ChartSignal['annotations'][0]['type'],
        price:    n(a.price),
        label:    s(a.label),
        color:    s(a.color) || '#00FFB2',
        style:    (s(a.style) || 'solid') as 'solid' | 'dashed' | 'zone',
        zone_end: a.zone_end != null ? n(a.zone_end) : undefined,
      }))
  }

  // Chart range
  let chart_range: ChartSignal['chart_range'] = null
  if (obj.chart_range && typeof obj.chart_range === 'object') {
    const cr = obj.chart_range as Record<string, unknown>
    const hi = n(cr.high), lo = n(cr.low)
    if (hi > 0 && lo > 0 && hi > lo) chart_range = { high: hi, low: lo }
  }

  const orderType = s(obj.order_type).toUpperCase()
  const validOrderTypes = ['BUY_LIMIT','SELL_LIMIT','BUY_STOP','SELL_STOP','MARKET_BUY','MARKET_SELL','WAIT']

  return {
    pair:       s(obj.pair)      || 'UNKNOWN',
    timeframe:  s(obj.timeframe) || '—',
    direction,
    order_type: validOrderTypes.includes(orderType)
      ? (orderType as ChartSignal['order_type'])
      : null,
    entry, stop_loss, tp1,
    tp2:        obj.tp2 != null && n(obj.tp2) > 0 ? n(obj.tp2) : null,
    tp3:        obj.tp3 != null && n(obj.tp3) > 0 ? n(obj.tp3) : null,
    rr_ratio:   rr,
    confidence: ['HIGH','MEDIUM','LOW'].includes(s(obj.confidence).toUpperCase())
      ? s(obj.confidence).toUpperCase() as ChartSignal['confidence']
      : null,
    trend:      ['BULLISH','BEARISH','RANGING'].includes(s(obj.trend).toUpperCase())
      ? s(obj.trend).toUpperCase() as ChartSignal['trend']
      : null,
    phase:      s(obj.phase) || null,
    bos_level:  obj.bos_level  != null && n(obj.bos_level)  > 0 ? n(obj.bos_level)  : null,
    choch_level:obj.choch_level != null && n(obj.choch_level)> 0 ? n(obj.choch_level): null,
    order_block: ob,
    fvg,
    liquidity_high: obj.liquidity_high != null && n(obj.liquidity_high) > 0 ? n(obj.liquidity_high) : null,
    liquidity_low:  obj.liquidity_low  != null && n(obj.liquidity_low)  > 0 ? n(obj.liquidity_low)  : null,
    market_state:   s(obj.market_state)  || null,
    smc_analysis:   s(obj.smc_analysis)  || null,
    confluence_factors: arr(obj.confluence_factors).filter(Boolean),
    conclusion:  s(obj.conclusion)   || s(obj.smc_analysis) || '',
    raw_analysis:s(obj.raw_analysis) || '',
    chart_range,
    annotations,
    key_levels: null,
  }
}

export function validateNewsSignal(obj: Record<string, unknown>): NewsSignal | null {
  const n = (v: unknown): number => { const x = parseFloat(String(v)); return isNaN(x) ? 0 : x }
  const s = (v: unknown): string => v != null ? String(v) : ''
  const direction = s(obj.direction).toUpperCase() as NewsSignal['direction']
  if (!['LONG','SHORT','NEUTRE'].includes(direction)) return null
  return {
    event_title:    s(obj.event_title),
    country:        s(obj.country),
    pair_cible:     s(obj.pair_cible) || s(obj.pair),
    direction,
    entry:          n(obj.entry),
    stop_loss:      n(obj.stop_loss),
    tp1:            n(obj.tp1),
    tp2:            n(obj.tp2) > 0 ? n(obj.tp2) : null,
    tp3:            n(obj.tp3) > 0 ? n(obj.tp3) : null,
    rr_ratio:       n(obj.rr_ratio),
    interpretation: s(obj.interpretation),
  }
}
