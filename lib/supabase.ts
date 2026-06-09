// ============================================================
// PROFITYX — Client Supabase (server-side)
// ============================================================
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  || ''
const anonKey      = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Client public (côté client — respecte le RLS)
export const supabasePublic = createClient(supabaseUrl, anonKey)

// Client admin LAZY (server uniquement — bypasse le RLS)
// Initialisé seulement quand utilisé, pour ne pas planter le client si la clé manque
let _admin: SupabaseClient | null = null
function getAdmin(): SupabaseClient {
  if (!_admin) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    _admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  }
  return _admin
}

// Proxy pour garder la compatibilité `supabaseAdmin.from(...)`
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getAdmin()
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  }
})

// ============================================================
// Vérifier et consommer un quota analyse
// Les admins et le plan Elite ont un accès illimité (pas de consommation)
// ============================================================
export async function checkAndConsumeAnalysisQuota(userId: string): Promise<boolean> {
  // Vérifier si admin → accès vraiment illimité
  // Elite = cap à 500/mois via la DB (use_analysis_quota gère)
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin, user_plan')
    .eq('id', userId)
    .single()

  if (profile?.is_admin) {
    return true // admins : pas de comptage
  }

  // Tous les plans (y compris Elite) passent par la fonction DB
  // qui respecte les caps mensuel + journalier
  const { data, error } = await supabaseAdmin
    .rpc('use_analysis_quota', { p_user_id: userId })

  if (error) {
    console.error('[Quota] Erreur vérification analyse:', error)
    return false
  }
  return data === true
}

// ============================================================
// Vérifier et consommer un quota news
// Les admins, Pro et Elite ont un accès illimité aux signaux news
// ============================================================
export async function checkAndConsumeNewsQuota(userId: string): Promise<boolean> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin, user_plan')
    .eq('id', userId)
    .single()

  if (profile?.is_admin || profile?.user_plan === 'pro' || profile?.user_plan === 'elite') {
    return true // accès illimité
  }

  const { data, error } = await supabaseAdmin
    .rpc('use_news_quota', { p_user_id: userId })

  if (error) {
    console.error('[Quota] Erreur vérification news:', error)
    return false
  }
  return data === true
}

// ============================================================
// Récupérer le profil utilisateur
// ============================================================
export async function getProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return null
  return data
}

// ============================================================
// Sauvegarder une analyse de chart
// ============================================================
export async function saveChartAnalysis(params: {
  userId:      string
  imageUrl?:   string
  pair?:       string
  timeframe?:  string
  direction:   string
  entry:       number
  stopLoss:    number
  tp1:         number
  tp2?:        number | null
  tp3?:        number | null
  rrRatio:     number
  conclusion:  string
  rawAnalysis: string
  locale:      string
  // Champs SMC
  marketState?:       string | null
  confidence?:        string | null
  smcAnalysis?:       string | null
  confluenceFactors?: string[] | null
  orderType?:         string | null
  trend?:             string | null
  orderBlock?:        object | null
  fvg?:               object | null
  bosLevel?:          number | null
  chochLevel?:        number | null
  liquidityHigh?:     number | null
  liquidityLow?:      number | null
  // Champs annotation chart (Pro/Elite)
  chartRange?:        { high: number; low: number } | null
  annotations?:       object[] | null
}) {
  const { error } = await supabaseAdmin
    .from('chart_analyses')
    .insert({
      user_id:            params.userId,
      image_url:          params.imageUrl,
      pair:               params.pair,
      timeframe:          params.timeframe,
      direction:          params.direction,
      entry:              params.entry,
      stop_loss:          params.stopLoss,
      tp1:                params.tp1,
      tp2:                params.tp2 ?? null,
      tp3:                params.tp3 ?? null,
      rr_ratio:           params.rrRatio,
      conclusion:         params.conclusion,
      raw_analysis:       params.rawAnalysis,
      locale:             params.locale,
      market_state:       params.marketState ?? null,
      confidence:         params.confidence ?? null,
      smc_analysis:       params.smcAnalysis ?? null,
      confluence_factors: params.confluenceFactors ?? null,
      order_type:         params.orderType ?? null,
      trend:              params.trend ?? null,
      order_block:        params.orderBlock ?? null,
      fvg:                params.fvg ?? null,
      bos_level:          params.bosLevel ?? null,
      choch_level:        params.chochLevel ?? null,
      liquidity_high:     params.liquidityHigh ?? null,
      liquidity_low:      params.liquidityLow ?? null,
      chart_range:        params.chartRange ?? null,
      annotations:        params.annotations ?? null,
    })

  if (error) console.error('[DB] Erreur sauvegarde chart:', error)
  return !error
}

// ============================================================
// Sauvegarder un signal news
// ============================================================
export async function saveNewsSignal(params: {
  userId:         string
  eventTitle:     string
  country:        string
  impact:         string
  actual:         string
  forecast:       string
  previous:       string
  direction:      string
  pairCible:      string
  entry:          number
  stopLoss:       number
  tp1:            number
  tp2?:           number | null
  tp3?:           number | null
  rrRatio:        number
  interpretation: string
  rawSignal:      string
  locale:         string
}) {
  const { error } = await supabaseAdmin
    .from('news_signals')
    .insert({
      user_id:        params.userId,
      event_title:    params.eventTitle,
      country:        params.country,
      impact:         params.impact,
      actual:         params.actual,
      forecast:       params.forecast,
      previous:       params.previous,
      direction:      params.direction,
      pair_cible:     params.pairCible,
      entry:          params.entry,
      stop_loss:      params.stopLoss,
      tp1:            params.tp1,
      tp2:            params.tp2 ?? null,
      tp3:            params.tp3 ?? null,
      rr_ratio:       params.rrRatio,
      interpretation: params.interpretation,
      raw_signal:     params.rawSignal,
      locale:         params.locale,
    })

  if (error) console.error('[DB] Erreur sauvegarde news signal:', error)
  return !error
}
