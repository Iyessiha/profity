// ============================================================
// PROFITYX — GET /api/admin/treasury
// Métriques financières complètes pour le dashboard admin
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const COST_PER_CALL_USD = 0.01   // Anthropic
const XOF_PER_USD       = 620    // Taux de change
const COST_PER_CALL_XOF = COST_PER_CALL_USD * XOF_PER_USD  // = 6.2 FCFA

// Prix des plans en XOF
const PLAN_PRICES_XOF = { pro: 17500, elite: 35000 }
// Coût API max par plan (crédits inclus × coût/appel)
const PLAN_API_COST = { free: 10 * COST_PER_CALL_XOF, pro: 150 * COST_PER_CALL_XOF, elite: 600 * COST_PER_CALL_XOF }

async function getUser(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: { user } } = await anon.auth.getUser(token)
  return user
}

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: prof } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!prof?.is_admin) return NextResponse.json({ error: 'Admin requis' }, { status: 403 })

  // ── Requête SQL complète ────────────────────────────────
  const { data: stats } = await admin.rpc('get_treasury_stats' as never)
  
  // Fallback si la fonction n'existe pas encore
  const [
    { data: users },
    { data: subs },
    { data: txAll },
    { data: txMonth },
    { data: credits },
    { data: packSales },
  ] = await Promise.all([
    admin.from('profiles').select('user_plan, created_at'),
    admin.from('subscriptions').select('plan, status, amount, updated_at'),
    admin.from('credit_transactions').select('type, amount, created_at'),
    admin.from('credit_transactions').select('type, amount').gte('created_at', new Date(new Date().setDate(1)).toISOString()),
    admin.from('credits').select('balance, total_spent, total_earned'),
    admin.from('credit_transactions').select('amount').eq('type', 'purchase').gt('amount', 0),
  ])

  // ── Calculs ─────────────────────────────────────────────
  const userList = (users ?? []) as Array<{ user_plan: string; created_at: string }>
  const freeUsers  = userList.filter(u => u.user_plan === 'free').length
  const proUsers   = userList.filter(u => u.user_plan === 'pro').length
  const eliteUsers = userList.filter(u => u.user_plan === 'elite').length
  const totalUsers = userList.length
  const newUsers7d = userList.filter(u => new Date(u.created_at) > new Date(Date.now() - 7*864e5)).length

  // Revenus abonnements
  const activeSubs   = (subs ?? []).filter((s: { status: string }) => s.status === 'active')
  const mrrXof       = activeSubs.reduce((acc: number, s: { amount: number }) => acc + (s.amount || 0), 0)
  const arrXof       = mrrXof * 12

  // API calls Anthropic (crédits débités)
  const allTx       = (txAll ?? []) as Array<{ type: string; amount: number; created_at: string }>
  const monthTx     = (txMonth ?? []) as Array<{ type: string; amount: number }>
  
  const totalApiCalls      = allTx.filter(t => ['analysis','news'].includes(t.type) && t.amount < 0).length
  const apiCallsThisMonth  = monthTx.filter(t => ['analysis','news'].includes(t.type) && t.amount < 0).length
  const apiCalls7d         = allTx.filter(t => ['analysis','news'].includes(t.type) && t.amount < 0 && new Date(t.created_at) > new Date(Date.now() - 7*864e5)).length
  const refunds            = allTx.filter(t => t.type === 'refund' && t.amount > 0).length

  // Coûts Anthropic
  const totalCostUsd      = totalApiCalls * COST_PER_CALL_USD
  const totalCostXof      = totalApiCalls * COST_PER_CALL_XOF
  const monthCostUsd      = apiCallsThisMonth * COST_PER_CALL_USD
  const monthCostXof      = apiCallsThisMonth * COST_PER_CALL_XOF

  // Revenus packs crédits
  const creditBals   = (credits ?? []) as Array<{ balance: number; total_spent: number; total_earned: number }>
  const totalSpent   = creditBals.reduce((a, c) => a + (c.total_spent || 0), 0)
  const totalIssued  = creditBals.reduce((a, c) => a + (c.total_earned || 0), 0)
  const outstanding  = creditBals.reduce((a, c) => a + (c.balance || 0), 0)
  const packSalesList = (packSales ?? []) as Array<{ amount: number }>
  const packSalesCount = packSalesList.length

  // Marge nette ce mois
  const netProfitXof   = mrrXof - monthCostXof
  const marginPercent  = mrrXof > 0 ? Math.round((netProfitXof / mrrXof) * 100) : 0

  // Projection si N users payants
  const perPlanEcon = {
    free:  { price_xof: 0, api_cost_xof: Math.round(PLAN_API_COST.free), margin_xof: -Math.round(PLAN_API_COST.free), margin_pct: -100 },
    pro:   { price_xof: PLAN_PRICES_XOF.pro, api_cost_xof: Math.round(PLAN_API_COST.pro), margin_xof: Math.round(PLAN_PRICES_XOF.pro - PLAN_API_COST.pro), margin_pct: Math.round((1 - PLAN_API_COST.pro / PLAN_PRICES_XOF.pro) * 100) },
    elite: { price_xof: PLAN_PRICES_XOF.elite, api_cost_xof: Math.round(PLAN_API_COST.elite), margin_xof: Math.round(PLAN_PRICES_XOF.elite - PLAN_API_COST.elite), margin_pct: Math.round((1 - PLAN_API_COST.elite / PLAN_PRICES_XOF.elite) * 100) },
  }

  return NextResponse.json({
    // Utilisateurs
    users: { total: totalUsers, free: freeUsers, pro: proUsers, elite: eliteUsers, new_7d: newUsers7d },
    // Revenus
    revenue: { mrr_xof: mrrXof, arr_xof: arrXof, active_subs: activeSubs.length, pack_sales: packSalesCount },
    // Coûts Anthropic
    anthropic: {
      cost_per_call_usd: COST_PER_CALL_USD,
      cost_per_call_xof: COST_PER_CALL_XOF,
      total_calls: totalApiCalls, calls_this_month: apiCallsThisMonth, calls_7d: apiCalls7d,
      total_cost_usd: Math.round(totalCostUsd * 100) / 100,
      total_cost_xof: Math.round(totalCostXof),
      month_cost_usd: Math.round(monthCostUsd * 100) / 100,
      month_cost_xof: Math.round(monthCostXof),
      refunds,
    },
    // Crédits
    credits: { total_issued: totalIssued, total_consumed: totalSpent, outstanding },
    // Marges
    margin: { net_profit_xof: netProfitXof, percent: marginPercent },
    // Économie par plan
    per_plan: perPlanEcon,
    // Constantes utilisées
    constants: { cost_per_call_usd: COST_PER_CALL_USD, xof_per_usd: XOF_PER_USD },
  })
}
