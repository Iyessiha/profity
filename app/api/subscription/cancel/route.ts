// ============================================================
// PROFITYX — DELETE /api/subscription/cancel
// Annule le renouvellement : l'accès reste jusqu'à la fin de période
// (l'API GeniusPay paiements est one-shot ; pas d'abonnement récurrent à résilier côté GeniusPay)
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function DELETE(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'
  )
  const { data: { user } } = await anonClient.auth.getUser(token)
  if (!user) return NextResponse.json({ success: false, error: 'Token invalide' }, { status: 401 })

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .single()

  if (!sub || sub.status === 'cancelled') {
    return NextResponse.json({ success: false, error: 'Aucun abonnement actif' }, { status: 404 })
  }

  // Désactiver le renouvellement et marquer annulé (accès maintenu jusqu'à l'échéance)
  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'cancelled', auto_renew: false, cancelled_at: new Date().toISOString() })
    .eq('user_id', user.id)

  return NextResponse.json({
    success: true,
    message: 'Renouvellement annulé. Votre accès reste actif jusqu\'à la fin de la période.',
  })
}
