// ============================================================
// PROFITYX — POST /api/payment/webhook
// Reçoit les confirmations GeniusPay
// Gère : activation plan Pro/Elite + achat crédits
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyWebhookSignature } from '@/lib/geniuspay'
import { sendEmail } from '@/lib/email'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── Activer un plan abonnement ────────────────────────────
async function activatePlan(userId: string, planKey: string, ref: string) {
  await supabaseAdmin.from('profiles')
    .update({ user_plan: planKey })
    .eq('id', userId)

  await supabaseAdmin.from('subscriptions').upsert({
    user_id:              userId,
    plan:                 planKey,
    status:               'active',
    currency:             'XOF',
    amount:               planKey === 'pro' ? 17500 : 35000,
    paygenius_id:         ref,
    current_period_start: new Date().toISOString(),
    current_period_end:   new Date(Date.now() + 30 * 864e5).toISOString(),
  }, { onConflict: 'user_id' })

  // Crédits mensuels selon le plan
  const credits = planKey === 'pro' ? 150 : 600
  await supabaseAdmin.rpc('add_credits', {
    p_user_id: userId,
    p_amount:  credits,
    p_type:    'monthly',
    p_desc:    `Crédits inclus plan ${planKey.toUpperCase()} (mensuel)`,
    p_ref:     ref,
  })

  await supabaseAdmin.from('notifications').insert({
    user_id:      userId,
    type:         'plan_change',
    priority:     'high',
    title:        planKey === 'pro' ? '🎉 Plan Pro activé !' : '👑 Plan Elite activé !',
    message:      planKey === 'pro'
      ? `Plan Pro actif. ${credits} crédits ajoutés. Analyses SMC, signaux illimités et coaching.`
      : `Plan Elite actif. ${credits} crédits ajoutés. Accès illimité à tout.`,
    action_url:   '/dashboard',
    action_label: 'Voir le dashboard',
  })

  console.log(`[Webhook] Plan ${planKey} activé, ${credits} crédits ajoutés — user ${userId}`)

  // Email confirmation plan activé
  const { data: prof } = await supabaseAdmin.from('profiles').select('email, full_name').eq('id', userId).single()
  if (prof?.email) {
    await sendEmail({
      template: 'plan_activated',
      to: prof.email,
      name: prof.full_name as string ?? 'Trader',
      data: { plan: planKey, credits: String(credits) },
    })
  }
}

// ── Créditer un achat de pack ─────────────────────────────
async function activateCredits(userId: string, credits: number, ref: string) {
  await supabaseAdmin.rpc('add_credits', {
    p_user_id: userId,
    p_amount:  credits,
    p_type:    'purchase',
    p_desc:    `Achat pack ${credits} crédits`,
    p_ref:     ref,
  })

  await supabaseAdmin.from('notifications').insert({
    user_id:      userId,
    type:         'success',
    priority:     'high',
    title:        `💰 ${credits} crédits ajoutés !`,
    message:      `Votre pack de ${credits} crédits est maintenant disponible. Bonne analyse !`,
    action_url:   '/analysis',
    action_label: 'Analyser maintenant',
  })

  console.log(`[Webhook] ${credits} crédits ajoutés — user ${userId}`)
}

// ── Route principale ──────────────────────────────────────
export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // Parser le body
  let body: Record<string, unknown>
  try { body = JSON.parse(rawBody) }
  catch { return NextResponse.json({ ok: false, error: 'JSON invalide' }, { status: 400 }) }

  // Vérification signature GeniusPay (si secret configuré)
  const signature = req.headers.get('x-webhook-signature') ?? ''
  const timestamp = req.headers.get('x-webhook-timestamp') ?? ''
  const secret    = process.env.GENIUSPAY_WEBHOOK_SECRET ?? ''

  if (secret && signature && timestamp) {
    const valid = verifyWebhookSignature(rawBody, signature, timestamp, secret)
    if (!valid) {
      console.error('[Webhook] ❌ Signature invalide')
      return NextResponse.json({ ok: false, error: 'Signature invalide' }, { status: 403 })
    }
  }

  // Filtrer les événements
  const event = body.event as string
  console.log(`[Webhook] Événement reçu: ${event}`)

  if (event !== 'payment.success') {
    return NextResponse.json({ ok: true, skipped: `Événement ${event} ignoré` })
  }

  // Extraire les metadata
  const data    = (body.data ?? {}) as Record<string, unknown>
  const meta    = (data.metadata ?? {}) as Record<string, string>
  const ref     = (data.reference as string) ?? ''
  const userId  = meta.user_id
  const planKey = meta.plan_key   // 'pro', 'elite', 'credits_75', 'credits_200', etc.
  const amount  = data.amount as number

  if (!userId || !planKey) {
    console.error('[Webhook] metadata manquant:', meta)
    return NextResponse.json({ ok: false, error: 'metadata manquant' }, { status: 400 })
  }

  // Détecter le type de paiement
  if (planKey === 'pro' || planKey === 'elite') {
    // ── Activation d'un plan abonnement ──
    await activatePlan(userId, planKey, ref)
  } else if (planKey.startsWith('credits_')) {
    // ── Achat de crédits — extraire le nombre depuis 'credits_75', 'credits_200'...
    const creditCount = parseInt(planKey.replace('credits_', ''), 10)
    if (isNaN(creditCount) || creditCount <= 0) {
      console.error('[Webhook] Nombre de crédits invalide:', planKey)
      return NextResponse.json({ ok: false, error: 'credits invalide' }, { status: 400 })
    }
    await activateCredits(userId, creditCount, ref)
  } else {
    console.warn('[Webhook] Type de paiement inconnu:', planKey)
  }

  return NextResponse.json({ ok: true, event, planKey, userId })
}

export const maxDuration = 15
