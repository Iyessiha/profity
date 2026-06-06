// ============================================================
// PROFITYX — GET /api/payment/status
// Vérifie le statut de l'abonnement de l'utilisateur connecté
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { getPayment }                from '@/lib/geniuspay'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await anonClient.auth.getUser(token)
  if (!user) return NextResponse.json({ success: false, error: 'Token invalide' }, { status: 401 })

  // ── Récupérer depuis DB ───────────────────────────────────
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('user_plan, analyses_used, news_used, reset_at')
    .eq('id', user.id)
    .single()

  // ── Vérifier en temps réel le dernier paiement ────────────
  let liveStatus: { status: string } | null = null
  if (sub?.paygenius_id) {
    try {
      const pay = await getPayment(sub.paygenius_id)
      // Mapper le statut paiement → statut abonnement
      const mapped = pay.status === 'completed' ? 'active'
        : ['failed', 'cancelled', 'expired'].includes(pay.status) ? 'cancelled'
        : sub.status
      liveStatus = { status: mapped }

      if (mapped !== sub.status) {
        await supabaseAdmin.from('subscriptions').update({ status: mapped }).eq('id', sub.id)
        if (mapped === 'cancelled' && sub.status === 'pending') {
          // paiement échoué : pas de changement de plan
        } else if (mapped === 'active') {
          await supabaseAdmin.from('profiles').update({ user_plan: sub.plan }).eq('id', user.id)
        }
      }
    } catch {
      // API GeniusPay indisponible → on se base sur la DB
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      plan:              profile?.user_plan   ?? 'free',
      analyses_used:     profile?.analyses_used ?? 0,
      news_used:         profile?.news_used    ?? 0,
      reset_at:          profile?.reset_at,
      subscription:      sub ? {
        status:               liveStatus?.status ?? sub.status,
        plan:                 sub.plan,
        amount:               sub.amount,
        currency:             sub.currency,
        current_period_end:   sub.current_period_end,
        cancelled_at:         sub.cancelled_at,
      } : null,
    },
  })
}
