// ============================================================
// PROFITYX — POST /api/payment/paystack/webhook
// Reçoit les événements Paystack et active les plans
// URL à configurer dans Paystack : https://profity-x.com/api/payment/paystack/webhook
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { sendEmail }                  from '@/lib/email'
import crypto                         from 'crypto'

const PLAN_CREDITS: Record<string, number> = { pro: 150, elite: 600 }

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // Vérification signature Paystack HMAC-SHA512
  const secret    = process.env.PAYSTACK_SECRET_KEY ?? ''
  const signature = req.headers.get('x-paystack-signature') ?? ''
  const hash      = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')

  if (secret && signature && hash !== signature) {
    console.error('[Paystack Webhook] ❌ Signature invalide')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: Record<string, unknown>
  try { event = JSON.parse(rawBody) } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventType = event.event as string
  const data      = event.data as Record<string, unknown>

  console.log(`[Paystack Webhook] event=${eventType} ref=${data?.reference}`)

  // Ne traiter que les charges réussies
  if (eventType !== 'charge.success') {
    return NextResponse.json({ received: true, action: 'skipped', event: eventType })
  }

  const reference = data.reference as string
  const metadata  = (data.metadata as Record<string, unknown>) ?? {}
  const userId    = metadata.user_id as string
  const plan      = (metadata.plan as string)?.toLowerCase()

  if (!userId || !plan || !PLAN_CREDITS[plan]) {
    console.error('[Paystack Webhook] Métadonnées manquantes', { userId, plan })
    return NextResponse.json({ error: 'Métadonnées invalides' }, { status: 400 })
  }

  const credits = PLAN_CREDITS[plan]
  const admin   = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Idempotence — éviter double traitement
  const { data: existing } = await admin
    .from('payment_transactions')
    .select('status')
    .eq('geniuspay_ref', reference)
    .single()

  if (existing?.status === 'completed') {
    return NextResponse.json({ received: true, action: 'already_processed' })
  }

  // Activer le plan
  await admin.from('profiles').update({ user_plan: plan }).eq('id', userId)

  await admin.rpc('add_credits', {
    p_user_id:    userId,
    p_amount:     credits,
    p_type:       'subscription',
    p_description:`Abonnement ${plan.toUpperCase()} Paystack — Réf: ${reference}`,
    p_reference:  reference,
  })

  await admin.from('subscriptions').upsert({
    user_id:              userId,
    plan,
    status:               'active',
    currency:             'NGN',
    amount:               Number(data.amount ?? 0) / 100,
    paygenius_id:         reference,
    current_period_start: new Date().toISOString(),
    current_period_end:   new Date(Date.now() + 30 * 864e5).toISOString(),
  }, { onConflict: 'user_id' })

  // Mettre à jour la transaction
  await admin.from('payment_transactions').update({
    status: 'completed',
    payment_method: 'Paystack',
    webhook_received_at: new Date().toISOString(),
  }).eq('geniuspay_ref', reference)

  await admin.rpc('notify_user', {
    p_user_id:     userId,
    p_type:        'payment',
    p_title:       `🎉 Plan ${plan.toUpperCase()} activé !`,
    p_message:     `Paiement Paystack confirmé. ${credits} crédits ajoutés.`,
    p_action_url:  '/dashboard',
    p_action_label:'Accéder au dashboard',
    p_priority:    'high',
  })

  // Email + Facture
  const { data: prof } = await admin.from('profiles').select('email, full_name').eq('id', userId).single()
  if (prof?.email) {
    await sendEmail({ template: 'plan_activated', to: prof.email,
      name: prof.full_name ?? 'Trader', data: { plan: plan.toUpperCase(), credits: String(credits) }
    }).catch(() => {})

    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://profity-x.com'}/api/invoice/create`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id:        userId,
        client_name:    prof.full_name ?? 'Trader',
        client_email:   prof.email,
        plan,
        amount_xof:     Math.round(Number(data.amount ?? 0) / 100 / 1.6),
        payment_method: 'Paystack (NGN)',
        payment_ref:    reference,
      }),
    }).catch(() => {})
  }

  console.log(`[Paystack Webhook] ✅ Plan ${plan} activé — ${credits} crédits — user:${userId}`)
  return NextResponse.json({ received: true, action: 'plan_activated', plan, credits })
}
