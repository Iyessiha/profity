// ============================================================
// PROFITYX — GET /api/admin/stats
// Statistiques globales de la plateforme
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, supabaseAdmin } from '@/lib/admin'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.error!

  try {
    // Stats globales depuis la vue
    const { data: stats } = await supabaseAdmin
      .from('admin_stats')
      .select('*')
      .single()

    // Croissance utilisateurs (30 derniers jours) — calcul manuel fiable
    const { data: recentUsers } = await supabaseAdmin
      .from('profiles')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 30 * 864e5).toISOString())
      .order('created_at', { ascending: true })

    const growthMap: Record<string, number> = {}
    ;(recentUsers ?? []).forEach(u => {
      const day = (u.created_at as string).split('T')[0]
      growthMap[day] = (growthMap[day] ?? 0) + 1
    })
    const growth = Object.entries(growthMap).map(([day, count]) => ({ day, count }))

    // Analyses par jour (7 derniers jours)
    const { data: recentAnalyses } = await supabaseAdmin
      .from('chart_analyses')
      .select('created_at, pair')
      .gte('created_at', new Date(Date.now() - 7 * 864e5).toISOString())

    const analysesMap: Record<string, number> = {}
    ;(recentAnalyses ?? []).forEach(a => {
      const day = (a.created_at as string).split('T')[0]
      analysesMap[day] = (analysesMap[day] ?? 0) + 1
    })
    const analyses_per_day = Object.entries(analysesMap).map(([day, count]) => ({ day, count }))

    // Top actifs analysés (30 jours)
    const { data: allAnalyses } = await supabaseAdmin
      .from('chart_analyses')
      .select('pair')
      .not('pair', 'is', null)
      .gte('created_at', new Date(Date.now() - 30 * 864e5).toISOString())

    const pairsMap: Record<string, number> = {}
    ;(allAnalyses ?? []).forEach(a => {
      const p = a.pair as string
      if (p && p !== 'INCONNU') pairsMap[p] = (pairsMap[p] ?? 0) + 1
    })
    const top_pairs = Object.entries(pairsMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([pair, count]) => ({ pair, count }))

    const mrr_total_xof = Number(stats?.mrr_pro_xof ?? 0) + Number(stats?.mrr_elite_xof ?? 0)

    return NextResponse.json({
      success: true,
      data: {
        total_users:          stats?.total_users ?? 0,
        free_users:           stats?.free_users ?? 0,
        pro_users:            stats?.pro_users ?? 0,
        elite_users:          stats?.elite_users ?? 0,
        new_users_24h:        stats?.new_users_24h ?? 0,
        new_users_7d:         stats?.new_users_7d ?? 0,
        total_analyses:       stats?.total_analyses ?? 0,
        analyses_24h:         stats?.analyses_24h ?? 0,
        total_news_signals:   stats?.total_news_signals ?? 0,
        active_subscriptions: stats?.active_subscriptions ?? 0,
        mrr_total_xof,
        push_subscribers:     stats?.push_subscribers ?? 0,
        growth,
        analyses_per_day,
        top_pairs,
      },
    })
  } catch (err) {
    console.error('[Stats] Erreur:', err)
    return NextResponse.json({ success: false, error: 'Erreur chargement statistiques' }, { status: 500 })
  }
}
