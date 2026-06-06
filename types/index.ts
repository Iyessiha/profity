// ============================================================
// PROFITYX — Types globaux
// ============================================================

export type Direction = 'LONG' | 'SHORT' | 'NEUTRE'
export type Plan      = 'free' | 'pro' | 'elite'
export type Locale    = 'fr' | 'en' | 'ar' | 'pt'
export type Currency  = 'XOF' | 'XAF' | 'USD' | 'EUR' | 'GHS' | 'NGN' | 'MAD'

// Résultat d'analyse de chart
export interface ChartSignal {
  pair:        string
  timeframe:   string
  direction:   Direction
  entry:       number
  stop_loss:   number
  tp1:         number
  tp2:         number | null
  tp3:         number | null
  rr_ratio:    number
  conclusion:  string
  raw_analysis: string
  // Champs avancés (Pro/Elite)
  market_state?:      string | null
  confidence?:        string | null
  smc_analysis?:      string | null
  confluence_factors?: string[] | null
  key_levels?:        { support?: number; resistance?: number; liquidity_zone?: number } | null
}

// Résultat d'analyse d'annonce économique
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

// Événement calendrier ForexFactory
export interface FFEvent {
  title:    string
  country:  string
  date:     string
  impact:   'High' | 'Medium' | 'Low' | 'Holiday'
  forecast: string | null
  previous: string | null
  actual:   string | null
}

// Réponse API standard
export interface ApiResponse<T> {
  success: boolean
  data?:   T
  error?:  string
  code?:   'QUOTA_EXCEEDED' | 'UNAUTHORIZED' | 'INVALID_IMAGE' | 'AI_ERROR' | 'DB_ERROR'
}
