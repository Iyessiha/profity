// ============================================================
// PROFITYX — POST /api/payment/webhook
// Réception et traitement des notifications GeniusPay
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { verifyWebhookSignature, CREDIT_PACK_PRICES } from '@/lib/geniuspay'
import { sendEmail }                              from '@/lib/email'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Crédits par plan
const PLAN_CREDITS: Record<string, number> = { pro: 150, elite: 600 }

// ─── Handler principal ────────────────────────────────────────
export async function POST(req: NextRequest) {
  const rawBody  = await req.text()
  const sig      = req.headers.get('x-geniuspay-signature') ?? ''
  const ts       = req.headers.get('x-geniuspay-timestamp')  ?? ''

  // 1. Vérification de la signature
  const secret = process.env.GENIUSPAY_SECRET!
  if (!verifyWebhookSignature(rawBody, sig, ts, secret)) {
    console.error('[Webhook] ❌ Signature invalide')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // 2. Parser le payload
  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event   = (payload.event   as string) ?? ''
  const data    = (payload.data    as Record<string, unknown>) ?? {}
  const status  = (data.status     as string) ?? ''
  const meta    = (data.metadata   as Record<string, string>) ?? {}
  const ref     = (data.reference  as string) ?? ''
  const amount  = Number(data.amount ?? 0)

  console.log(`[Webhook] Événement: ${event} | Statut: ${status} | Réf: ${ref}`)

  // 3. Seuls les paiements complétés nous intéressent
  if (status !== 'completed') {
    return NextResponse.json({ received: true, action: 'skipped', status })
  }

  const userId  = meta.user_id
  const kind    = meta.kind    // 'subscription' ou 'credit_pack'
  const planKey = meta.plan_key
  const packKey = meta.pack_key

  if (!userId) {
    console.error('[Webhook] Pas de user_id dans metadata')
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
  }

  try {
    // ─── CAS 1 : Abonnement Pro / Elite ──────────────────────
    if (kind === 'subscription' && planKey && PLAN_CREDITS[planKey]) {
      const credits = PLAN_CREDITS[planKey]

      // Mettre à jour le plan
      await supabaseAdmin
        .from('profiles')
        .update({ user_plan: planKey })
        .eq('id', userId)

      // Créditer les crédits mensuels
      await supabaseAdmin.rpc('add_credits', {
        p_user_id:    userId,
        p_amount:     credits,
        p_type:       'subscription',
        p_description:`Abonnement ${planKey.toUpperCase()} — ${amount.toLocaleString('fr-FR')} XOF — Réf: ${ref}`,
        p_reference:  ref,
      })

      // Upsert abonnement
      await supabaseAdmin.from('subscriptions').upsert({
        user_id:              userId,
        plan:                 planKey,
        status:               'active',
        currency:             (data.currency as string) ?? 'XOF',
        amount,
        paygenius_id:         ref,
        current_period_start: new Date().toISOString(),
        current_period_end:   new Date(Date.now() + 30 * 864e5).toISOString(),
      }, { onConflict: 'user_id' })

      // Notification in-app
      await supabaseAdmin.rpc('notify_user', {
        p_user_id:     userId,
        p_type:        'payment',
        p_title:       `🎉 Plan ${planKey.toUpperCase()} activé !`,
        p_message:     `Votre paiement de ${amount.toLocaleString('fr-FR')} XOF a été confirmé. ${credits} crédits ont été ajoutés à votre compte.`,
        p_action_url:  '/dashboard',
        p_action_label:'Accéder au dashboard',
        p_priority:    'high',
      })

      // Email plan_activated via Brevo
      const { data: prof } = await supabaseAdmin.from('profiles')
        .select('email, full_name').eq('id', userId).single()
      if (prof?.email) {
        await sendEmail({
          template: 'plan_activated',
          to: prof.email,
          name: prof.full_name ?? 'Trader',
          data: { plan: planKey, credits: String(credits) },
        }).catch(() => {})

        // Générer la facture
        const invoiceRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://profity-x.com'}/api/invoice/create`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id:        userId,
            client_name:    prof.full_name ?? 'Trader',
            client_email:   prof.email,
            plan:           planKey,
            amount_xof:     amount,
            payment_method: (data.payment_method as string) ?? 'GeniusPay',
            payment_ref:    ref,
          }),
        }).catch(() => null)
        if (invoiceRes?.ok) {
          const inv = await invoiceRes.json()
          console.log(`[Webhook] 🧾 Facture ${inv.invoice_number} générée → ${prof.email}`)
        }
      }

      console.log(`[Webhook] ✅ Plan ${planKey} activé pour ${userId} — ${credits} crédits`)
      return NextResponse.json({ received: true, action: 'plan_activated', plan: planKey, credits })
    }

    // ─── CAS 2 : Pack de crédits ─────────────────────────────
    if (kind === 'credit_pack' && packKey && CREDIT_PACK_PRICES[packKey]) {
      const pack = CREDIT_PACK_PRICES[packKey]

      await supabaseAdmin.rpc('add_credits', {
        p_user_id:    userId,
        p_amount:     pack.credits,
        p_type:       'pack_purchase',
        p_description:`${pack.label} — ${pack.amount.toLocaleString('fr-FR')} XOF — Réf: ${ref}`,
        p_reference:  ref,
      })

      // Notification in-app
      await supabaseAdmin.rpc('notify_user', {
        p_user_id:     userId,
        p_type:        'payment',
        p_title:       `✅ ${pack.credits} crédits ajoutés !`,
        p_message:     `Votre achat de ${pack.label} est confirmé. Réf: ${ref}`,
        p_action_url:  '/analysis',
        p_action_label:'Analyser maintenant',
        p_priority:    'high',
      })

      // Email confirmation pack crédits
      const { data: profPack } = await supabaseAdmin.from('profiles')
        .select('email, full_name').eq('id', userId).single()
      if (profPack?.email) {
        await sendEmail({
          template: 'plan_activated',
          to: profPack.email,
          name: profPack.full_name ?? 'Trader',
          data: { plan: pack.label, credits: String(pack.credits) },
        }).catch(() => {})

        // Générer la facture pack
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://profity-x.com'}/api/invoice/create`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id:        userId,
            client_name:    profPack.full_name ?? 'Trader',
            client_email:   profPack.email,
            plan:           'credits',
            amount_xof:     pack.amount,
            payment_method: (data.payment_method as string) ?? 'GeniusPay',
            payment_ref:    ref,
          }),
        }).catch(() => {})
      }

      console.log(`[Webhook] ✅ ${pack.credits} crédits pack ajoutés pour ${userId}`)
      return NextResponse.json({ received: true, action: 'credits_added', credits: pack.credits })
    }

    // Événement non reconnu
    console.warn('[Webhook] ⚠️ kind non reconnu:', kind, planKey, packKey)
    return NextResponse.json({ received: true, action: 'unhandled_kind', kind })

  } catch (err) {
    console.error('[Webhook] Erreur:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// GeniusPay peut envoyer un GET pour vérifier l'endpoint
export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'profityx-payment-webhook' })
}
