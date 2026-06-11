// ============================================================
// PROFITYX — POST /api/payment/checkout
// Ordre : Supabase Edge Function (proxy GP) → WhatsApp fallback
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PLAN_PRICES } from '@/lib/geniuspay'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// URL de l'Edge Function Supabase (proxy GeniusPay — IPs Deno Deploy)
const EDGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/payment-proxy`

export async function POST(req: NextRequest) {
  // 1. Auth
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })

  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key')
  const { data: { user }, error: authErr } = await anon.auth.getUser(token)
  if (authErr || !user) return NextResponse.json({ success: false, error: 'Token invalide' }, { status: 401 })

  // 2. Paramètres
  const body    = await req.json().catch(() => ({}))
  const planKey = body.plan as 'pro' | 'elite'
  if (!['pro', 'elite'].includes(planKey))
    return NextResponse.json({ success: false, error: 'Plan invalide' }, { status: 400 })

  // 3. Profil
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('email,full_name,phone,user_plan,currency,public_id').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ success: false, error: 'Profil introuvable' }, { status: 404 })
  if (profile.user_plan === planKey)
    return NextResponse.json({ success: false, error: 'Vous êtes déjà sur ce plan' }, { status: 409 })

  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'https://profity-x.com'
  const currency = (profile.currency as string) || 'XOF'
  const amount   = (PLAN_PRICES[currency] ?? PLAN_PRICES.XOF)[planKey] ?? PLAN_PRICES.XOF[planKey]
  const email    = (profile.email as string) ?? user.email ?? ''
  const name     = (profile.full_name as string) ?? email.split('@')[0]
  const phone    = (profile.phone as string) || '+2250000000000'
  const pid      = (profile.public_id as string) ?? 'INCONNU'
  const txId     = `PX-${pid}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`

  // ── Enregistrer l'intention de paiement (relance panier abandonné) ──
  // Fait avant l'appel GeniusPay pour capturer même les redirections qui ne reviennent pas
  await supabaseAdmin.from('checkout_intents').insert({
    user_id:   user.id,
    tx_id:     txId,
    plan:      planKey,
    amount_xof: PLAN_PRICES.XOF[planKey] ?? 0,
    email,
    full_name: name,
    status:    'pending',
  }).then(({ error: e }) => {
    if (e) console.warn('[Checkout] intent insert warn:', e.message)
  })
  // ESSAI : Supabase Edge Function → GeniusPay
  // (Deno Deploy — IPs non bloquées par GeniusPay)
  // ═══════════════════════════════════════════════════════
  try {
    const edgeRes = await fetch(EDGE_URL, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,  // JWT user — validé dans l'Edge Function
      },
      body: JSON.stringify({
        planKey,
        amount,
        currency,
        customerName:  name,
        customerEmail: email,
        customerPhone: phone,
        userId:        user.id,
        transactionId: txId,
        successUrl:    `${appUrl}/dashboard?subscription=success&plan=${planKey}`,
        errorUrl:      `${appUrl}/pricing?subscription=cancelled`,
      }),
    })

    const edgeJson = await edgeRes.json()

    if (edgeJson.success && edgeJson.redirectUrl) {
      // Enregistrer l'abonnement pending
      await supabaseAdmin.from('subscriptions').upsert({
        user_id:              user.id,
        plan:                 planKey,
        status:               'pending',
        currency:             'XOF',
        amount:               PLAN_PRICES.XOF[planKey],
        paygenius_id:         edgeJson.reference ?? txId,
        current_period_start: new Date().toISOString(),
        current_period_end:   new Date(Date.now() + 30 * 864e5).toISOString(),
      }, { onConflict: 'user_id' })

      console.log('[Checkout] ✅ GeniusPay via Edge Function:', edgeJson.reference)
      return NextResponse.json({
        success:     true,
        redirectUrl: edgeJson.redirectUrl,
        reference:   edgeJson.reference,
        gateway:     'geniuspay-edge',
      })
    }

    // L'Edge Function a répondu mais sans URL → logguer et passer au fallback
    console.error('[Checkout] Edge Function sans URL:', edgeJson)
  } catch (edgeErr) {
    console.error('[Checkout] Edge Function erreur:', edgeErr instanceof Error ? edgeErr.message : edgeErr)
  }

  // ═══════════════════════════════════════════════════════
  // FALLBACK FINAL : WhatsApp (paiement manuel)
  // ═══════════════════════════════════════════════════════
  const pname = planKey === 'pro' ? 'Pro — 17 500 FCFA/mois' : 'Elite — 35 000 FCFA/mois'
  const msg   = encodeURIComponent(
    `Bonjour ProfityX 👋\n\nJe souhaite souscrire au plan ${pname}.\n\n🆔 Mon identifiant : ${pid}\n📧 Email : ${email}\n\nMerci de m'envoyer les instructions de paiement.`
  )
  console.warn('[Checkout] ⚠️ Fallback WhatsApp pour', pid)

  return NextResponse.json({
    success:     true,
    redirectUrl: `https://wa.me/+2250500446464?text=${msg}`,
    fallback:    true,
    gateway:     'whatsapp',
  })
}
