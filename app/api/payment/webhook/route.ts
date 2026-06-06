// ============================================================
// PROFITYX — POST /api/payment/webhook
// Reçoit les webhooks GeniusPay et active les plans
// Doc : signature = HMAC-SHA256(timestamp + "." + payload, whsec_...)
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { verifyWebhookSignature }    from '@/lib/geniuspay'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  // 1. Body brut (nécessaire pour la signature)
  const rawBody = await req.text()

  // 2. Vérifier la signature
  const signature = req.headers.get('x-webhook-signature') ?? ''
  const timestamp = req.headers.get('x-webhook-timestamp') ?? ''
  const eventHdr  = req.headers.get('x-webhook-event') ?? ''
  const secret    = process.env.GENIUSPAY_WEBHOOK_SECRET ?? ''

  if (secret) {
    // Protection replay : timestamp < 5 min
    if (timestamp && Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
      return NextResponse.json({ error: 'Timestamp trop ancien' }, { status: 400 })
    }
    if (!verifyWebhookSignature(rawBody, signature, timestamp, secret)) {
      console.warn('[Webhook] Signature invalide — rejetée')
      return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
    }
  }

  // 3. Parser
  let payload: { event?: string; data?: Record<string, unknown> }
  try { payload = JSON.parse(rawBody) } catch { return NextResponse.json({ error: 'Payload invalide' }, { status: 400 }) }

  const eventType = payload.event ?? eventHdr
  const data = payload.data ?? {}
  const metadata = (data.metadata ?? {}) as Record<string, string>
  const reference = String(data.reference ?? '')
  const userId = metadata.user_id
  const planKey = metadata.plan_key

  console.log(`[Webhook] ${eventType} · ref=${reference} · user=${userId} · plan=${planKey}`)

  // 4. Router les événements
  switch (eventType) {
    case 'payment.success': {
      if (userId && planKey && ['pro', 'elite'].includes(planKey)) {
        // Activer le plan → le trigger sync_subscription crée l'abonnement actif
        await supabaseAdmin.from('profiles').update({ user_plan: planKey }).eq('id', userId)
        // Marquer la période
        await supabaseAdmin.from('subscriptions').update({
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 864e5).toISOString(),
        }).eq('user_id', userId)
        console.log(`[Webhook] Plan ${planKey} activé pour ${userId}`)
      }
      break
    }

    case 'payment.failed':
    case 'payment.cancelled':
    case 'payment.expired': {
      if (userId) {
        // Laisser le plan inchangé ; marquer l'abonnement pending comme cancelled
        await supabaseAdmin.from('subscriptions')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
          .eq('user_id', userId).eq('status', 'pending')
      }
      break
    }

    case 'payment.refunded': {
      if (userId) {
        await supabaseAdmin.from('profiles').update({ user_plan: 'free' }).eq('id', userId)
      }
      break
    }

    default:
      // payment.initiated, webhook.test, etc. → on accuse réception
      break
  }

  // 5. Toujours répondre 200 pour accuser réception
  return NextResponse.json({ received: true })
}
