// ============================================================
// PROFITYX — Types globaux v3
// ============================================================

export type Direction  = 'LONG' | 'SHORT' | 'NEUTRE'
export type Plan       = 'free' | 'pro' | 'elite'
export type Locale     = 'fr' | 'en' | 'ar' | 'pt'
export type Currency   = 'XOF' | 'XAF' | 'USD' | 'EUR' | 'GHS' | 'NGN' | 'MAD'

export type OrderType  =
  | 'BUY_LIMIT'    // attendre retour sur zone — LONG en dessous du marché
  | 'SELL_LIMIT'   // attendre retour sur zone — SHORT au-dessus du marché
  | 'BUY_STOP'     // cassure confirmation — LONG au-dessus du marché
  | 'SELL_STOP'    // cassure confirmation — SHORT en dessous du marché
  | 'MARKET_BUY'   // entrée immédiate au marché LONG
  | 'MARKET_SELL'  // entrée immédiate au marché SHORT
  | 'WAIT'         // signal insuffisant — ne pas trader

export type SMCPhase =
  | 'accumulation' | 'distribution' | 'markup' | 'markdown' | 'ranging'

export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW'

// ── Zone SMC (OB, FVG, etc.) ──────────────────────────────
export interface SMCZone {
  high:  number
  low:   number
  type:  'bullish' | 'bearish'
  label: string
}

// ── Annotation visuelle pour le chart ─────────────────────
export interface ChartAnnotation {
  type:  'ob_bullish' | 'ob_bearish' | 'fvg_bullish' | 'fvg_bearish'
       | 'bos' | 'choch' | 'entry' | 'sl' | 'tp1' | 'tp2' | 'tp3'
       | 'liquidity_high' | 'liquidity_low' | 'premium' | 'discount'
  price: number      // prix réel
  label: string
  color: string
  style: 'solid' | 'dashed' | 'zone'
  zone_end?: number  // pour les zones (OB, FVG)
}

// ── Signal SMC complet ────────────────────────────────────
export interface ChartSignal {
  // Base (Free)
  pair:       string
  timeframe:  string
  direction:  Direction
  entry:      number
  stop_loss:  number
  tp1:        number
  tp2:        number | null
  tp3:        number | null
  rr_ratio:   number
  conclusion: string
  raw_analysis: string

  // Pro+
  order_type?:      OrderType | null
  confidence?:      Confidence | null
  market_state?:    string | null
  smc_analysis?:    string | null
  confluence_factors?: string[] | null

  // SMC structure
  trend?:         'BULLISH' | 'BEARISH' | 'RANGING' | null
  phase?:         SMCPhase | null
  bos_level?:     number | null
  choch_level?:   number | null

  // Zones clés
  order_block?:   SMCZone | null
  fvg?:           SMCZone | null
  liquidity_high?: number | null
  liquidity_low?:  number | null

  // Chart annotation (Elite)
  chart_range?:      { high: number; low: number } | null
  annotations?:      ChartAnnotation[] | null
  key_levels?:       { support?: number; resistance?: number } | null
}

// ── News signal ───────────────────────────────────────────
export interface NewsSignal {
  event_title:    string
  country:        string
  pair_cible:     string
  direction:      Direction
  entry:          number
  stop_loss:      number
  tp1:            number
  tp2:            number | null
  tp3:            number | null
  rr_ratio:       number
  interpretation: string
}

export interface FFEvent {
  title:    string
  country:  string
  date:     string
  impact:   'High' | 'Medium' | 'Low' | 'Holiday'
  forecast: string | null
  previous: string | null
  actual:   string | null
}

export interface ApiResponse<T> {
  success: boolean
  data?:   T
  error?:  string
  code?:   string
}
