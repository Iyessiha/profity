// ============================================================
// PROFITYX — GET /api/admin/subscriptions
// Liste toutes les souscriptions + revenus
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, supabaseAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.error!

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'active'
  const page   = parseInt(searchParams.get('page') ?? '1')
  const limit  = 20
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('subscriptions')
    .select(`
      id, plan, status, amount, currency,
      current_period_start, current_period_end,
      cancelled_at, created_at, paygenius_sub_id,
      profiles(full_name, email, user_plan, locale)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, count } = await query

  // MRR par plan
  const { data: mrrData } = await supabaseAdmin
    .from('subscriptions')
    .select('plan, amount')
    .eq('status', 'active')

  const mrr = { pro: 0, elite: 0, total: 0 }
  ;(mrrData ?? []).forEach(s => {
    if (s.plan === 'pro')   mrr.pro   += s.amount
    if (s.plan === 'elite') mrr.elite += s.amount
  })
  mrr.total = mrr.pro + mrr.elite

  return NextResponse.json({
    success: true,
    data,
    mrr,
    meta: { total: count ?? 0, page, limit, total_pages: Math.ceil((count ?? 0) / limit) },
  })
}
