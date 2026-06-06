// ============================================================
// PROFITYX — Parser de réponse Claude IA
// ============================================================
import type { ChartSignal, NewsSignal } from '@/types'

// Nettoyer et parser le JSON brut retourné par Claude
export function parseClaudeJSON<T>(rawText: string): T | null {
  try {
    // Supprimer les backticks markdown si présents
    let cleaned = rawText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()

    // Extraire uniquement le bloc JSON (entre { et })
    const start = cleaned.indexOf('{')
    const end   = cleaned.lastIndexOf('}')
    if (start === -1 || end === -1) return null

    cleaned = cleaned.slice(start, end + 1)
    return JSON.parse(cleaned) as T
  } catch {
    return null
  }
}

// Valider et normaliser un signal chart
export function validateChartSignal(raw: Record<string, unknown>): ChartSignal | null {
  try {
    const direction = String(raw.direction ?? '').toUpperCase()
    if (!['LONG', 'SHORT', 'NEUTRE', 'NEUTRAL'].includes(direction)) return null

    const entry     = Number(raw.entry)
    const stop_loss = Number(raw.stop_loss)
    const tp1       = Number(raw.tp1)

    if (!entry || !stop_loss || !tp1) return null
    if (isNaN(entry) || isNaN(stop_loss) || isNaN(tp1)) return null

    const slDist = Math.abs(entry - stop_loss)
    const tp1Dist = Math.abs(tp1 - entry)
    const rr_ratio = slDist > 0 ? Number((tp1Dist / slDist).toFixed(2)) : 0

    return {
      pair:         String(raw.pair       ?? 'INCONNU'),
      timeframe:    String(raw.timeframe  ?? 'INCONNU'),
      direction:    (direction === 'NEUTRAL' ? 'NEUTRE' : direction) as ChartSignal['direction'],
      entry,
      stop_loss,
      tp1,
      tp2:          raw.tp2 ? Number(raw.tp2) : null,
      tp3:          raw.tp3 ? Number(raw.tp3) : null,
      rr_ratio:     Number(raw.rr_ratio ?? rr_ratio),
      conclusion:   String(raw.conclusion ?? ''),
      market_state:       raw.market_state ? String(raw.market_state) : null,
      confidence:         raw.confidence ? String(raw.confidence) : null,
      smc_analysis:       raw.smc_analysis ? String(raw.smc_analysis) : null,
      confluence_factors: Array.isArray(raw.confluence_factors) ? (raw.confluence_factors as string[]).map(String) : null,
      key_levels:         (raw.key_levels && typeof raw.key_levels === 'object') ? raw.key_levels as ChartSignal['key_levels'] : null,
      raw_analysis: JSON.stringify(raw),
    }
  } catch {
    return null
  }
}

// Valider et normaliser un signal news
export function validateNewsSignal(raw: Record<string, unknown>): NewsSignal | null {
  try {
    const direction = String(raw.direction ?? '').toUpperCase()
    if (!['LONG', 'SHORT', 'NEUTRE', 'NEUTRAL'].includes(direction)) return null

    const entry     = Number(raw.entry)
    const stop_loss = Number(raw.stop_loss)
    const tp1       = Number(raw.tp1)

    if (!entry || !stop_loss || !tp1) return null

    const slDist  = Math.abs(entry - stop_loss)
    const tp1Dist = Math.abs(tp1 - entry)
    const rr      = slDist > 0 ? Number((tp1Dist / slDist).toFixed(2)) : 0

    return {
      event_title:    String(raw.event_title    ?? ''),
      country:        String(raw.country        ?? ''),
      pair_cible:     String(raw.pair_cible     ?? ''),
      direction:      (direction === 'NEUTRAL' ? 'NEUTRE' : direction) as NewsSignal['direction'],
      entry,
      stop_loss,
      tp1,
      tp2:            raw.tp2 ? Number(raw.tp2) : null,
      tp3:            raw.tp3 ? Number(raw.tp3) : null,
      rr_ratio:       Number(raw.rr_ratio ?? rr),
      interpretation: String(raw.interpretation ?? ''),
    }
  } catch {
    return null
  }
}
