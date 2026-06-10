// ============================================================
// PROFITYX — POST /api/payment/webhook
// Webhook GeniusPay — robuste, log tout, fallback email
// ============================================================
import { NextRequest, NextResponse }               from 'next/server'
import { createClient }                            from '@supabase/supabase-js'
import { verifyWebhookSignature, CREDIT_PACK_PRICES } from '@/lib/geniuspay'
import { sendEmail }                               from '@/lib/email'

const PLAN_CREDITS: Record<string, number> = { pro: 150, elite: 600 }
const PLAN_AMOUNT:  Record<string, number> = { pro: 17500, elite: 35000 }

const adm = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'profityx-webhook', version: '3' })
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const db = adm()

  // ── 1. Parse JSON ───────────────────────────────────────────
  let payload: Record<string, unknown>
  try { payload = JSON.parse(rawBody) }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  // ── 2. Extraire les champs (tous les formats GeniusPay) ──────
  const event  = String(payload.event ?? payload.type ?? payload.eventType ?? '')
  const data   = (payload.data   as Record<string, unknown>) ?? payload
  const status = String(data.status ?? payload.status ?? '')
  const ref    = String(data.reference ?? data.id ?? data.transaction_id ?? payload.reference ?? '')
  const amount = Number(data.amount ?? data.amount_xof ?? payload.amount ?? 0)

  // Métadonnées : plusieurs emplacements possibles
  const meta     = (data.metadata  as Record<string, string>)
                ?? (payload.metadata as Record<string, string>)
                ?? {}
  // Email client : plusieurs sources
  const custData = (data.customer as Record<string, unknown>) ?? {}
  const clientEmail = String(
    meta.email ?? custData.email ?? data.email ?? payload.email ?? ''
  )
  const clientName = String(
    meta.name  ?? custData.name  ?? data.name  ?? payload.name  ?? 'Trader'
  )

  // ── 3. Log SYSTÉMATIQUE (même si erreur ensuite) ─────────────
  const { data: logRow } = await db.from('webhook_logs').insert({
    provider:      'geniuspay',
    event_type:    event || 'unknown',
    geniuspay_ref: ref   || `no-ref-${Date.now()}`,
    payload,
    status:        'received',
  }).select('id').single()
  const logId = logRow?.id

  console.log(`[Webhook v3] event="${event}" status="${status}" ref="${ref}" email="${clientEmail}"`)

  // ── 4. Vérifier signature (si secret configuré) ─────────────
  const sig    = req.headers.get('x-geniuspay-signature') ?? req.headers.get('x-webhook-signature') ?? ''
  const ts     = req.headers.get('x-geniuspay-timestamp') ?? req.headers.get('x-webhook-timestamp') ?? ''
  const secret = process.env.GENIUSPAY_SECRET ?? process.env.GENIUSPAY_WEBHOOK_SECRET ?? ''
  if (secret && sig && ts && !verifyWebhookSignature(rawBody, sig, ts, secret)) {
    console.error('[Webhook] ❌ Signature invalide')
    if (logId) await db.from('webhook_logs').update({ status:'error', error_message:'Invalid signature' }).eq('id', logId)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // ── 5. Filtrer les événements non-succès ─────────────────────
  const isSuccess = status === 'completed' || status === 'success' || status === 'paid'
                 || event  === 'payment.success' || event === 'payment.completed'
                 || event  === 'payment.paid'
  if (!isSuccess) {
    if (logId) await db.from('webhook_logs').update({ status: 'ignored' }).eq('id', logId)
    return NextResponse.json({ received: true, action: 'skipped', event, status })
  }

  // ── 6. Idempotence : déjà traité ? ──────────────────────────
  if (ref && ref !== `no-ref-${Date.now()}`) {
    const { data: existing } = await db.from('payment_transactions')
      .select('status').eq('geniuspay_ref', ref).single()
    if (existing?.status === 'completed') {
      if (logId) await db.from('webhook_logs').update({ status: 'duplicate' }).eq('id', logId)
      return NextResponse.json({ received: true, action: 'already_processed' })
    }
  }

  // ── 7. Résoudre l'utilisateur ────────────────────────────────
  let userId   = meta.user_id ?? ''
  let planKey  = (meta.plan_key ?? meta.plan ?? meta.plan_id ?? '').toLowerCase()
  const kind   = meta.kind ?? 'subscription'
  const packKey = meta.pack_key ?? ''

  // Fallback : chercher par email si user_id absent
  if (!userId && clientEmail) {
    const { data: prof } = await db.from('profiles')
      .select('id, user_plan').eq('email', clientEmail).single()
    if (prof?.id) {
      userId = prof.id
      console.log(`[Webhook] 🔍 user_id résolu par email : ${clientEmail} → ${userId}`)
    }
  }

  // Fallback : déduire le plan depuis le montant si planKey absent
  if (!planKey && amount) {
    if (amount <= 20000) planKey = 'pro'
    else if (amount <= 40000) planKey = 'elite'
    console.log(`[Webhook] 🔍 plan déduit du montant ${amount} XOF → ${planKey}`)
  }

  if (!userId) {
    const msg = `user_id introuvable. email="${clientEmail}" montant=${amount}`
    console.error(`[Webhook] ❌ ${msg}`)
    if (logId) await db.from('webhook_logs').update({ status:'error', error_message: msg }).eq('id', logId)
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  try {
    const { data: prof } = await db.from('profiles')
      .select('email, full_name').eq('id', userId).single()

    const userEmail = prof?.email ?? clientEmail
    const userName  = prof?.full_name ?? clientName

    // ── CAS 1 : Abonnement ─────────────────────────────────────
    if ((kind === 'subscription' || !kind) && planKey && PLAN_CREDITS[planKey]) {
      const credits = PLAN_CREDITS[planKey]

      await db.from('profiles').update({ user_plan: planKey }).eq('id', userId)

      await db.rpc('add_credits', {
        p_user_id: userId, p_amount: credits,
        p_type: 'subscription',
        p_description: `Abonnement ${planKey.toUpperCase()} — ${amount.toLocaleString('fr-FR')} XOF — Réf: ${ref}`,
        p_reference: ref,
      })

      await db.from('subscriptions').upsert({
        user_id: userId, plan: planKey, status: 'active',
        currency: String(data.currency ?? 'XOF'), amount,
        paygenius_id: ref,
        current_period_start: new Date().toISOString(),
        current_period_end:   new Date(Date.now() + 30 * 864e5).toISOString(),
      }, { onConflict: 'user_id' })

      await db.from('payment_transactions').upsert({
        geniuspay_ref: ref, user_id: userId,
        amount_xof: amount, status: 'completed',
        payment_method: String(data.payment_method ?? 'GeniusPay'),
        metadata: { ...meta, plan: planKey, email: userEmail },
        webhook_received_at: new Date().toISOString(),
      }, { onConflict: 'geniuspay_ref' })

      await db.rpc('notify_user', {
        p_user_id: userId, p_type: 'payment',
        p_title:   `🎉 Plan ${planKey.toUpperCase()} activé !`,
        p_message: `Paiement de ${amount.toLocaleString('fr-FR')} XOF confirmé. ${credits} crédits ajoutés.`,
        p_action_url: '/dashboard', p_action_label: 'Accéder au dashboard', p_priority: 'high',
      })

      if (userEmail) {
        await sendEmail({ template: 'plan_activated', to: userEmail,
          name: userName, data: { plan: planKey, credits: String(credits) }
        }).catch(() => {})

        // Générer la facture
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://profity-x.com'}/api/invoice/create`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId, client_name: userName, client_email: userEmail,
            plan: planKey, amount_xof: amount,
            payment_method: String(data.payment_method ?? 'GeniusPay'),
            payment_ref: ref,
          }),
        }).catch(() => {})
      }

      if (logId) await db.from('webhook_logs').update({ status: 'processed' }).eq('id', logId)
      console.log(`[Webhook] ✅ Plan ${planKey} activé — ${credits} crédits — ${userEmail}`)
      return NextResponse.json({ received: true, action: 'plan_activated', plan: planKey, credits })
    }

    // ── CAS 2 : Pack de crédits ────────────────────────────────
    if (kind === 'credit_pack' && packKey && CREDIT_PACK_PRICES[packKey]) {
      const pack = CREDIT_PACK_PRICES[packKey]
      await db.rpc('add_credits', {
        p_user_id: userId, p_amount: pack.credits,
        p_type: 'purchase', p_description: `Pack ${pack.credits} crédits — ${ref}`,
        p_reference: ref,
      })
      await db.from('payment_transactions').upsert({
        geniuspay_ref: ref, user_id: userId,
        amount_xof: amount, status: 'completed',
        payment_method: String(data.payment_method ?? 'GeniusPay'),
        metadata: meta, webhook_received_at: new Date().toISOString(),
      }, { onConflict: 'geniuspay_ref' })
      if (logId) await db.from('webhook_logs').update({ status: 'processed' }).eq('id', logId)
      return NextResponse.json({ received: true, action: 'credits_added', credits: pack.credits })
    }

    // Cas non géré
    const msg = `Cas non géré: kind="${kind}" plan="${planKey}" pack="${packKey}"`
    if (logId) await db.from('webhook_logs').update({ status:'error', error_message: msg }).eq('id', logId)
    return NextResponse.json({ received: true, action: 'unhandled', debug: msg })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Webhook] ❌ Erreur:', msg)
    if (logId) await db.from('webhook_logs').update({ status:'error', error_message: msg }).eq('id', logId)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
