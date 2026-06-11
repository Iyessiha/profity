// ============================================================
// PROFITYX — GET /api/cron/upsell
// Cron hebdomadaire : identifie les PRO actifs → notif ELITE
// Déclenché : tous les lundis à 10h UTC
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adm = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = adm()

  // Trouver les PRO qui ont fait 5+ analyses cette semaine
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString()
  const { data: activeProUsers } = await db.rpc('get_upsell_candidates', {
    p_plan:         'pro',
    p_min_analyses: 5,
    p_since:        weekAgo,
  })

  if (!activeProUsers?.length) {
    return NextResponse.json({ sent: 0, message: 'No candidates this week' })
  }

  let sent = 0
  for (const user of activeProUsers as Array<{id: string; full_name: string; weekly_analyses: number}>) {
    // Vérifier si déjà notifié cette semaine
    const { data: recent } = await db.from('notifications')
      .select('id').eq('user_id', user.id)
      .eq('type', 'upsell').gte('created_at', weekAgo).single()

    if (recent) continue // Déjà notifié cette semaine

    await db.rpc('notify_user', {
      p_user_id:     user.id,
      p_type:        'upsell',
      p_title:       '🚀 Passez à ELITE — vous êtes prêt !',
      p_message:     `Vous avez fait ${user.weekly_analyses} analyses cette semaine. L'ELITE vous donne 4× plus de crédits (600/mois) pour seulement 35 000 FCFA. Vos crédits PRO ne suffisent plus !`,
      p_action_url:  '/pricing',
      p_action_label:'Voir le plan ELITE',
      p_priority:    'high',
    })
    sent++
  }

  return NextResponse.json({ success: true, sent, candidates: activeProUsers.length })
}
