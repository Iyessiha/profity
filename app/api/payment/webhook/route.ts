// ============================================================
// PROFITYX — POST /api/payment/webhook
// Reçoit les notifications CinetPay ET GeniusPay
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyWebhookSignature } from '@/lib/geniuspay'
import { checkCinetPayPayment } from '@/lib/cinetpay'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function activatePlan(userId: string, planKey: string, ref: string) {
  // Mettre à jour le plan
  await supabaseAdmin.from('profiles')
    .update({ user_plan: planKey })
    .eq('id', userId)

  // Mettre à jour l'abonnement
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

  // Notification à l'utilisateur
  await supabaseAdmin.from('notifications').insert({
    user_id:  userId,
    type:     'plan_change',
    title:    planKey === 'pro' ? '🎉 Plan Pro activé !' : '👑 Plan Elite activé !',
    message:  planKey === 'pro'
      ? 'Votre plan Pro est maintenant actif. Profitez de 100 analyses SMC, signaux illimités et coaching psychologique.'
      : 'Votre plan Elite est actif. Accès illimité à tout — sans aucune restriction.',
    action_url:   '/dashboard',
    action_label: 'Voir le dashboard',
    priority:     'high',
  })

  console.log(`[Webhook] Plan ${planKey} activé pour user ${userId}`)
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  let body: Record<string, unknown>
  try { body = JSON.parse(rawBody) } catch { return NextResponse.json({ ok: false }, { status: 400 }) }

  // ── Détecter la source du webhook ──────────────────────

  // ── CinetPay webhook ──
  // CinetPay envoie : { cpm_trans_id, cpm_site_id, cpm_amount, cpm_currency, cpm_payment_status, ... }
  if (body.cpm_site_id || body.cpm_trans_id) {
    const transactionId = body.cpm_trans_id as string
    const status        = body.cpm_payment_status as string  // 'ACCEPTED' ou 'REFUSED'

    if (status !== 'ACCEPTED') {
      console.log(`[CinetPay webhook] Paiement non accepté: ${status}`)
      return NextResponse.json({ ok: true })
    }

    // Vérifier le statut en appelant l'API CinetPay (double vérification)
    try {
      const check = await checkCinetPayPayment(transactionId)
      if (check.status !== 'ACCEPTED') {
        console.log('[CinetPay webhook] Vérification échouée:', check.status)
        return NextResponse.json({ ok: true })
      }

      const meta    = check.metadata
      const userId  = meta.user_id
      const planKey = meta.plan_key

      if (!userId || !planKey) {
        console.error('[CinetPay webhook] metadata manquant:', meta)
        return NextResponse.json({ ok: false }, { status: 400 })
      }

      await activatePlan(userId, planKey, transactionId)
      return NextResponse.json({ ok: true })

    } catch (err) {
      console.error('[CinetPay webhook] Erreur vérification:', err)
      return NextResponse.json({ ok: false }, { status: 500 })
    }
  }

  // ── GeniusPay webhook ──
  // GeniusPay envoie avec headers X-Webhook-Signature et X-Webhook-Timestamp
  if (body.event || body.reference) {
    const signature = req.headers.get('x-webhook-signature') ?? ''
    const timestamp = req.headers.get('x-webhook-timestamp') ?? ''
    const secret    = process.env.GENIUSPAY_WEBHOOK_SECRET ?? ''

    if (secret && signature && timestamp) {
      const valid = verifyWebhookSignature(rawBody, signature, timestamp, secret)
      if (!valid) {
        console.error('[GeniusPay webhook] Signature invalide')
        return NextResponse.json({ ok: false }, { status: 403 })
      }
    }

    const event = body.event as string
    if (event !== 'payment.success') return NextResponse.json({ ok: true })

    const data    = (body.data ?? {}) as Record<string, unknown>
    const meta    = (data.metadata ?? {}) as Record<string, string>
    const userId  = meta.user_id
    const planKey = meta.plan_key
    const ref     = data.reference as string ?? ''

    if (!userId || !planKey) {
      console.error('[GeniusPay webhook] metadata manquant:', meta)
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    await activatePlan(userId, planKey, ref)
    return NextResponse.json({ ok: true })
  }

  // Webhook inconnu
  console.warn('[Webhook] Format non reconnu:', Object.keys(body))
  return NextResponse.json({ ok: true })
}

export const maxDuration = 15
