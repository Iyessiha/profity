// ============================================================
// PROFITYX — GET /api/admin/treasury
// Métriques financières réelles avec tracking token Anthropic
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// ── Constantes financières ───────────────────────────────────

export const dynamic = 'force-dynamic'
const XOF_PER_USD       = 620
const ANTHROPIC_BUDGET  = 500    // Budget mensuel Anthropic en $
const ANTHROPIC_SPENT   = 0.80   // Dépensé ce mois (à remplacer par API Anthropic quand disponible)

// Prix des plans en XOF
const PLAN_PRICES: Record<string, number> = { pro: 17500, elite: 35000 }

async function getUser(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key')
  const { data: { user } } = await anon.auth.getUser(token)
  return user
}

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: prof } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!prof?.is_admin) return NextResponse.json({ error: 'Admin requis' }, { status: 403 })

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const weekStart  = new Date(Date.now() - 7 * 864e5).toISOString()

  const [
    { data: users },
    { data: subs },
    { data: txMonth },
    { data: txAll },
    { data: credits },
    { data: usageMonth },
    { data: usageAll },
    { data: usageByPlan },
    { data: usageDaily },
  ] = await Promise.all([
    admin.from('profiles').select('user_plan, created_at'),
    admin.from('subscriptions').select('plan, status, amount'),
    admin.from('credit_transactions').select('type, amount').gte('created_at', monthStart),
    admin.from('credit_transactions').select('type, amount, created_at'),
    admin.from('credits').select('balance, total_spent, total_earned'),
    // Tokens réels ce mois
    admin.from('api_usage').select('input_tokens, output_tokens, cost_usd, type').gte('created_at', monthStart),
    // Tokens réels tout temps
    admin.from('api_usage').select('input_tokens, output_tokens, cost_usd'),
    // Par plan
    admin.from('api_usage').select('plan, cost_usd, input_tokens, output_tokens').gte('created_at', monthStart),
    // Par jour (7 derniers jours)
    admin.from('api_usage').select('cost_usd, created_at').gte('created_at', weekStart),
  ])

  // ── Utilisateurs ────────────────────────────────────────────
  const userList   = (users ?? []) as Array<{ user_plan: string; created_at: string }>
  const freeUsers  = userList.filter(u => u.user_plan === 'free').length
  const proUsers   = userList.filter(u => u.user_plan === 'pro').length
  const eliteUsers = userList.filter(u => u.user_plan === 'elite').length
  const totalUsers = userList.length
  const newUsers7d = userList.filter(u => new Date(u.created_at) > new Date(weekStart)).length

  // ── Revenus ─────────────────────────────────────────────────
  const activeSubs  = (subs ?? []).filter((s: { status: string }) => s.status === 'active')
  const mrrXof      = activeSubs.reduce((a: number, s: { amount: number }) => a + (s.amount || 0), 0)
  const arrXof      = mrrXof * 12

  // ── Coûts Anthropic RÉELS (tokens trackés) ──────────────────
  const umList = (usageMonth ?? []) as Array<{ input_tokens: number; output_tokens: number; cost_usd: number; type: string }>
  const uaList = (usageAll   ?? []) as Array<{ input_tokens: number; output_tokens: number; cost_usd: number }>
  const ubList = (usageByPlan ?? []) as Array<{ plan: string; cost_usd: number; input_tokens: number; output_tokens: number }>

  const monthCostUsdReal  = umList.reduce((a, u) => a + Number(u.cost_usd), 0)
  const totalCostUsdReal  = uaList.reduce((a, u) => a + Number(u.cost_usd), 0)
  const totalInputTokens  = uaList.reduce((a, u) => a + u.input_tokens, 0)
  const totalOutputTokens = uaList.reduce((a, u) => a + u.output_tokens, 0)
  const avgCostPerCall    = umList.length > 0 ? monthCostUsdReal / umList.length : 0

  // Fallback : si pas encore de données réelles (api_usage vide), utiliser $0.80 console
  const monthCostUsd  = monthCostUsdReal > 0 ? monthCostUsdReal : ANTHROPIC_SPENT
  const totalCostUsd  = totalCostUsdReal  > 0 ? totalCostUsdReal : ANTHROPIC_SPENT
  const monthCostXof  = Math.round(monthCostUsd * XOF_PER_USD)
  const totalCostXof  = Math.round(totalCostUsd * XOF_PER_USD)

  // Calls depuis credit_transactions (historique complet)
  const allTx         = (txAll   ?? []) as Array<{ type: string; amount: number; created_at: string }>
  const monthTx       = (txMonth ?? []) as Array<{ type: string; amount: number }>
  const totalApiCalls = allTx.filter(t => ['analysis','news'].includes(t.type) && t.amount < 0).length
  const callsMonth    = monthTx.filter(t => ['analysis','news'].includes(t.type) && t.amount < 0).length
  const calls7d       = allTx.filter(t => ['analysis','news'].includes(t.type) && t.amount < 0 && new Date(t.created_at) > new Date(weekStart)).length
  const refunds       = allTx.filter(t => t.type === 'refund' && t.amount > 0).length

  // Budget Anthropic
  const budgetPct     = Math.min(100, (monthCostUsd / ANTHROPIC_BUDGET) * 100)
  const budgetStatus  = budgetPct < 50 ? 'ok' : budgetPct < 80 ? 'warning' : 'danger'

  // Coût par plan ce mois
  const costByPlan: Record<string, { calls: number; cost_usd: number; cost_xof: number }> = {}
  for (const u of ubList) {
    const k = u.plan ?? 'free'
    if (!costByPlan[k]) costByPlan[k] = { calls: 0, cost_usd: 0, cost_xof: 0 }
    costByPlan[k].calls++
    costByPlan[k].cost_usd += Number(u.cost_usd)
    costByPlan[k].cost_xof  = Math.round(costByPlan[k].cost_usd * XOF_PER_USD)
  }

  // Courbe 7 jours
  const dailyList = (usageDaily ?? []) as Array<{ cost_usd: number; created_at: string }>
  const dailyMap: Record<string, number> = {}
  for (const u of dailyList) {
    const day = u.created_at.substring(0, 10)
    dailyMap[day] = (dailyMap[day] ?? 0) + Number(u.cost_usd)
  }

  // Crédits
  const creditBals   = (credits ?? []) as Array<{ balance: number; total_spent: number; total_earned: number }>
  const totalSpent   = creditBals.reduce((a, c) => a + (c.total_spent || 0), 0)
  const outstanding  = creditBals.reduce((a, c) => a + (c.balance || 0), 0)

  // Marges
  const netProfitXof  = mrrXof - monthCostXof
  const marginPct     = mrrXof > 0 ? Math.round((netProfitXof / mrrXof) * 100) : 0

  // Économie par plan
  const perPlan = {
    free:  { price: 0,              api_cost_xof: Math.round(10  * avgCostPerCall * XOF_PER_USD), margin_xof: 0, margin_pct: -100 },
    pro:   { price: PLAN_PRICES.pro, api_cost_xof: Math.round(150 * avgCostPerCall * XOF_PER_USD), margin_xof: 0, margin_pct: 0 },
    elite: { price: PLAN_PRICES.elite, api_cost_xof: Math.round(600 * avgCostPerCall * XOF_PER_USD), margin_xof: 0, margin_pct: 0 },
  }
  perPlan.pro.margin_xof   = perPlan.pro.price - perPlan.pro.api_cost_xof
  perPlan.elite.margin_xof = perPlan.elite.price - perPlan.elite.api_cost_xof
  perPlan.pro.margin_pct   = perPlan.pro.price > 0 ? Math.round((perPlan.pro.margin_xof / perPlan.pro.price) * 100) : 0
  perPlan.elite.margin_pct = perPlan.elite.price > 0 ? Math.round((perPlan.elite.margin_xof / perPlan.elite.price) * 100) : 0

  return NextResponse.json({
    users:     { total: totalUsers, free: freeUsers, pro: proUsers, elite: eliteUsers, new_7d: newUsers7d },
    revenue:   { mrr_xof: mrrXof, arr_xof: arrXof, active_subs: activeSubs.length, pack_sales: 0 },
    anthropic: {
      // Budget console
      budget_usd:       ANTHROPIC_BUDGET,
      spent_usd:        monthCostUsd,
      budget_pct:       Math.round(budgetPct * 10) / 10,
      budget_status:    budgetStatus,
      budget_remaining: Math.round((ANTHROPIC_BUDGET - monthCostUsd) * 100) / 100,
      // Coûts
      month_cost_usd:   Math.round(monthCostUsd * 1000) / 1000,
      month_cost_xof:   monthCostXof,
      total_cost_usd:   Math.round(totalCostUsd * 1000) / 1000,
      total_cost_xof:   totalCostXof,
      // Appels
      calls_month:      callsMonth,
      calls_7d:         calls7d,
      total_calls:      totalApiCalls,
      refunds,
      // Tokens réels
      total_input_tokens:  totalInputTokens,
      total_output_tokens: totalOutputTokens,
      avg_cost_per_call:   Math.round(avgCostPerCall * 10000) / 10000,
      // Par plan
      cost_by_plan:     costByPlan,
      // Courbe 7j
      daily_costs:      dailyMap,
      // Source des données
      data_source: umList.length > 0 ? 'real_tokens' : 'console_estimate',
    },
    credits:   { total_issued: totalSpent + outstanding, total_consumed: totalSpent, outstanding },
    margin:    { net_profit_xof: netProfitXof, percent: marginPct },
    per_plan:  perPlan,
    constants: { xof_per_usd: XOF_PER_USD, anthropic_budget: ANTHROPIC_BUDGET },
  })
}
