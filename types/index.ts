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

// ── Trading Accounts & Challenges ─────────────────────────
export interface TradingAccount {
  id: string
  user_id: string
  label: string | null
  connect_token: string
  mt5_login: number | null
  broker_server: string | null
  broker_company: string | null
  currency: string | null
  leverage: number | null
  is_active: boolean
  last_seen_at: string | null
  created_at: string
}

export interface ChallengePres {
  id: string
  name: string
  description: string | null
  account_size: number | null
  profit_target_pct: number
  max_total_dd_pct: number
  dd_type: "static" | "trailing"
  max_daily_dd_pct: number | null
}

export interface Challenge {
  id: string
  account_id: string
  preset_id: string
  status: "active" | "passed" | "breached" | "abandoned"
  starting_balance: number
  current_equity: number
  profit: number
  loss: number
  max_dd: number
  current_dd: number
  days_elapsed: number
  starting_at: string
  ended_at: string | null
  created_at: string
}

export interface ChallengeEvent {
  id: string
  challenge_id: string
  kind: string
  details: Record<string, any> | null
  created_at: string
}

export interface EquitySnapshot {
  id: string
  challenge_id: string
  equity: number
  timestamp: string
}
