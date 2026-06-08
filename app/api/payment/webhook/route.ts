// ============================================================
// PROFITYX — POST /api/payment/webhook
// Webhook GeniusPay unifié — accepte tous les formats de headers
// URL à configurer dans GeniusPay : https://profity-x.com/api/payment/webhook
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { verifyWebhookSignature, CREDIT_PACK_PRICES } from '@/lib/geniuspay'
import { sendEmail }                                   from '@/lib/email'

const PLAN_CREDITS: Record<string, number> = { pro: 150, elite: 600 }

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── GET : Health check (GeniusPay vérifie l'endpoint) ────────
export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'profityx-payment-webhook', version: '2' })
}

// ── POST : Traitement webhook ─────────────────────────────────
export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // Accepter les deux formats de headers GeniusPay
  const sig = req.headers.get('x-geniuspay-signature')
           ?? req.headers.get('x-webhook-signature')
           ?? ''
  const ts  = req.headers.get('x-geniuspay-timestamp')
           ?? req.headers.get('x-webhook-timestamp')
           ?? ''

  // Vérification signature (si secret configuré)
  const secret = process.env.GENIUSPAY_SECRET
              ?? process.env.GENIUSPAY_WEBHOOK_SECRET
              ?? ''

  if (secret && sig && ts) {
    if (!verifyWebhookSignature(rawBody, sig, ts, secret)) {
      console.error('[Webhook] ❌ Signature invalide')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  let payload: Record<string, unknown>
  try { payload = JSON.parse(rawBody) } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Accepter les deux formats d'événements
  const event  = (payload.event  as string)
              ?? req.headers.get('x-webhook-event')
              ?? ''
  const data   = (payload.data   as Record<string, unknown>) ?? {}
  const status = (data.status    as string) ?? ''
  const meta   = (data.metadata  as Record<string, string>) ?? {}
  const ref    = (data.reference as string) ?? ''
  const amount = Number(data.amount ?? 0)

  // Log dans webhook_logs
  const { data: logRow } = await admin.from('webhook_logs').insert({
    provider: 'geniuspay', event_type: event,
    geniuspay_ref: ref, payload, status: 'received',
  }).select('id').single()
  const logId = logRow?.id

  console.log(`[Webhook] ${event} | status=${status} | ref=${ref}`)

  // Ignorer les événements non-payment.success/completed
  const isSuccess = status === 'completed'
                 || event   === 'payment.success'
                 || event   === 'payment.completed'
  if (!isSuccess) {
    await admin.from('webhook_logs').update({ status: 'ignored' }).eq('id', logId)
    return NextResponse.json({ received: true, action: 'skipped', event, status })
  }

  const userId  = meta.user_id
  const kind    = meta.kind     // 'subscription' | 'credit_pack'
  const planKey = meta.plan_key ?? meta.plan_id
  const packKey = meta.pack_key

  if (!userId) {
    await admin.from('webhook_logs').update({ status: 'error', error_message: 'Missing user_id' }).eq('id', logId)
    return NextResponse.json({ error: 'Missing user_id in metadata' }, { status: 400 })
  }

  try {
    // ── Récupérer le profil pour email + facture ─────────────
    const { data: prof } = await admin.from('profiles')
      .select('email, full_name').eq('id', userId).single()

    // ── CAS 1 : Abonnement Pro / Elite ───────────────────────
    if ((kind === 'subscription' || !kind) && planKey && PLAN_CREDITS[planKey]) {
      const credits = PLAN_CREDITS[planKey]

      await admin.from('profiles').update({ user_plan: planKey }).eq('id', userId)

      await admin.rpc('add_credits', {
        p_user_id: userId, p_amount: credits,
        p_type: 'subscription',
        p_description: `Abonnement ${planKey.toUpperCase()} — ${amount.toLocaleString('fr-FR')} XOF — Réf: ${ref}`,
        p_reference: ref,
      })

      await admin.from('subscriptions').upsert({
        user_id: userId, plan: planKey, status: 'active',
        currency: (data.currency as string) ?? 'XOF', amount,
        paygenius_id: ref,
        current_period_start: new Date().toISOString(),
        current_period_end:   new Date(Date.now() + 30 * 864e5).toISOString(),
      }, { onConflict: 'user_id' })

      await admin.rpc('notify_user', {
        p_user_id: userId, p_type: 'payment',
        p_title:   `🎉 Plan ${planKey.toUpperCase()} activé !`,
        p_message: `Votre paiement de ${amount.toLocaleString('fr-FR')} XOF confirmé. ${credits} crédits ajoutés.`,
        p_action_url: '/dashboard', p_action_label: 'Accéder au dashboard', p_priority: 'high',
      })

      // Log paiement dans payment_transactions
      await admin.from('payment_transactions').upsert({
        geniuspay_ref: ref, user_id: userId, plan_id: planKey,
        amount_xof: amount, status: 'completed',
        payment_method: (data.payment_method as string) ?? 'GeniusPay',
        metadata: meta, webhook_received_at: new Date().toISOString(),
      }, { onConflict: 'geniuspay_ref' })

      if (prof?.email) {
        // Email confirmation plan activé
        await sendEmail({ template: 'plan_activated', to: prof.email,
          name: prof.full_name ?? 'Trader', data: { plan: planKey, credits: String(credits) }
        }).catch(() => {})

        // Générer la facture
        const invRes = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://profity-x.com'}/api/invoice/create`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, client_name: prof.full_name ?? 'Trader',
              client_email: prof.email, plan: planKey, amount_xof: amount,
              payment_method: (data.payment_method as string) ?? 'GeniusPay', payment_ref: ref })
          }
        ).catch(() => null)
        if (invRes?.ok) {
          const inv = await invRes.json()
          console.log(`[Webhook] 🧾 Facture ${inv.invoice_number} → ${prof.email}`)
        }
      }

      await admin.from('webhook_logs').update({ status: 'processed' }).eq('id', logId)
      console.log(`[Webhook] ✅ Plan ${planKey} activé — ${credits} crédits — user:${userId}`)
      return NextResponse.json({ received: true, action: 'plan_activated', plan: planKey, credits })
    }

    // ── CAS 2 : Pack de crédits ──────────────────────────────
    if (kind === 'credit_pack' && packKey && CREDIT_PACK_PRICES[packKey]) {
      const pack = CREDIT_PACK_PRICES[packKey]

      await admin.rpc('add_credits', {
        p_user_id: userId, p_amount: pack.credits,
        p_type: 'pack_purchase',
        p_description: `${pack.label} — ${pack.amount.toLocaleString('fr-FR')} XOF — Réf: ${ref}`,
        p_reference: ref,
      })

      await admin.rpc('notify_user', {
        p_user_id: userId, p_type: 'payment',
        p_title:   `✅ ${pack.credits} crédits ajoutés !`,
        p_message: `Votre achat de ${pack.label} est confirmé. Réf: ${ref}`,
        p_action_url: '/analysis', p_action_label: 'Analyser maintenant', p_priority: 'high',
      })

      await admin.from('payment_transactions').upsert({
        geniuspay_ref: ref, user_id: userId, plan_id: packKey,
        amount_xof: pack.amount, status: 'completed',
        payment_method: (data.payment_method as string) ?? 'GeniusPay',
        metadata: meta, webhook_received_at: new Date().toISOString(),
      }, { onConflict: 'geniuspay_ref' })

      if (prof?.email) {
        await sendEmail({ template: 'plan_activated', to: prof.email,
          name: prof.full_name ?? 'Trader', data: { plan: pack.label, credits: String(pack.credits) }
        }).catch(() => {})
        await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://profity-x.com'}/api/invoice/create`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, client_name: prof.full_name ?? 'Trader',
              client_email: prof.email, plan: 'credits', amount_xof: pack.amount,
              payment_method: (data.payment_method as string) ?? 'GeniusPay', payment_ref: ref })
          }
        ).catch(() => {})
      }

      await admin.from('webhook_logs').update({ status: 'processed' }).eq('id', logId)
      console.log(`[Webhook] ✅ ${pack.credits} crédits pack — user:${userId}`)
      return NextResponse.json({ received: true, action: 'credits_added', credits: pack.credits })
    }

    await admin.from('webhook_logs').update({ status: 'ignored', error_message: `kind inconnu: ${kind}` }).eq('id', logId)
    return NextResponse.json({ received: true, action: 'unhandled', kind, planKey })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Webhook] Erreur:', msg)
    await admin.from('webhook_logs').update({ status: 'error', error_message: msg }).eq('id', logId)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
