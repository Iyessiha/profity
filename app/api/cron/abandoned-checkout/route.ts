// ============================================================
// PROFITYX — GET /api/cron/abandoned-checkout
// Cron toutes les heures : relance les paniers abandonnés
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = req.nextUrl.searchParams.get('secret')
  const isAuthorized =
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    cronSecret === process.env.PROFITY_CRON_KEY

  if (!isAuthorized && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Paniers > 60 min, jamais relancés
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { data: intents, error } = await db
    .from('checkout_intents')
    .select('id, plan, amount_xof, email, full_name')
    .eq('status', 'pending')
    .is('reminded_at', null)
    .lt('created_at', cutoff)
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!intents?.length) return NextResponse.json({ sent: 0, message: 'Aucun panier abandonné' })

  let sent = 0
  const failed: string[] = []

  for (const intent of intents) {
    try {
      const firstName = (intent.full_name as string)?.split(' ')[0] || 'Trader'
      await sendEmail({
        template: 'checkout_abandoned',
        to: intent.email as string,
        name: firstName,
        data: { plan: intent.plan as string },
      })
      await db
        .from('checkout_intents')
        .update({ status: 'reminded', reminded_at: new Date().toISOString() })
        .eq('id', intent.id)
      sent++
      await new Promise(r => setTimeout(r, 200))
    } catch (e) {
      failed.push(intent.email as string)
      console.error('[abandoned-checkout]', intent.email, e)
    }
  }

  return NextResponse.json({ sent, failed: failed.length, total: intents.length, timestamp: new Date().toISOString() })
}
