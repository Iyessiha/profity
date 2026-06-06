// ============================================================
// PROFITYX — POST /api/payment/checkout
// GeniusPay (primaire) → CinetPay (fallback) → WhatsApp (dernier recours)
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createPlanCheckout, PLAN_PRICES, type PlanKey } from '@/lib/geniuspay'
import { createCinetPayCheckout, CP_PRICES } from '@/lib/cinetpay'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  // 1. Auth
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })

  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: { user }, error: authErr } = await anon.auth.getUser(token)
  if (authErr || !user) return NextResponse.json({ success: false, error: 'Token invalide' }, { status: 401 })

  // 2. Paramètres
  const body    = await req.json().catch(() => ({}))
  const planKey = body.plan as PlanKey
  if (!['pro', 'elite'].includes(planKey))
    return NextResponse.json({ success: false, error: 'Plan invalide' }, { status: 400 })

  // 3. Profil
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('email,full_name,phone,user_plan,currency,public_id').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ success: false, error: 'Profil introuvable' }, { status: 404 })
  if (profile.user_plan === planKey)
    return NextResponse.json({ success: false, error: 'Vous êtes déjà sur ce plan' }, { status: 409 })

  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'https://profity-alpha.vercel.app'
  const currency = (profile.currency as string) || 'XOF'
  const amount   = (CP_PRICES[currency] ?? CP_PRICES.XOF)[planKey] ?? CP_PRICES.XOF[planKey]
  const email    = profile.email as string ?? user.email ?? ''
  const name     = profile.full_name as string ?? email.split('@')[0]
  const phone    = (profile.phone as string) || '+2250000000000'
  const pid      = profile.public_id as string ?? 'INCONNU'

  // ── Fonction helper : enregistrer l'abonnement pending ──
  const savePending = async (ref: string) => {
    await supabaseAdmin.from('subscriptions').upsert({
      user_id:              user.id,
      plan:                 planKey,
      status:               'pending',
      currency:             'XOF',
      amount:               (CP_PRICES.XOF)[planKey],
      paygenius_id:         ref,
      current_period_start: new Date().toISOString(),
      current_period_end:   new Date(Date.now() + 30 * 864e5).toISOString(),
    }, { onConflict: 'user_id' })
  }

  // ── Fonction helper : message WhatsApp ──
  const waFallback = () => {
    const pname = planKey === 'pro' ? 'Pro — 17 500 FCFA/mois' : 'Elite — 35 000 FCFA/mois'
    const msg   = encodeURIComponent(
      `Bonjour ProfityX 👋\n\nJe souhaite souscrire au plan ${pname}.\n\n🆔 Mon identifiant : ${pid}\n📧 Email : ${email}\n\nMerci de m'envoyer les instructions de paiement.`
    )
    return `https://wa.me/+2250500446464?text=${msg}`
  }

  // ═══════════════════════════════════════════════════════
  // ESSAI 1 : CinetPay (primaire — sans Cloudflare)
  // ═══════════════════════════════════════════════════════
  if (process.env.CINETPAY_APIKEY && process.env.CINETPAY_SITE_ID) {
    try {
      const txId = `PX-${pid}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
      const result = await createCinetPayCheckout({
        planKey,
        amount,
        currency,
        customerName:  name,
        customerEmail: email,
        customerPhone: phone,
        userId:        user.id,
        transactionId: txId,
        successUrl:    `${appUrl}/dashboard?subscription=success&plan=${planKey}`,
        cancelUrl:     `${appUrl}/pricing?subscription=cancelled`,
      })

      await savePending(txId)
      console.log('[CinetPay] checkout OK:', txId)

      return NextResponse.json({
        success:     true,
        redirectUrl: result.paymentUrl,
        reference:   txId,
        gateway:     'cinetpay',
      })
    } catch (cpErr) {
      console.error('[CinetPay] échec:', cpErr instanceof Error ? cpErr.message : cpErr)
      // Continuer vers GeniusPay ou WhatsApp
    }
  }

  // ═══════════════════════════════════════════════════════
  // ESSAI 2 : GeniusPay (si CinetPay absent ou échoue)
  // ═══════════════════════════════════════════════════════
  if (process.env.GENIUSPAY_API_KEY && process.env.GENIUSPAY_SECRET) {
    try {
      const gpAmount  = (PLAN_PRICES[currency] ?? PLAN_PRICES.XOF)[planKey]
      const checkout  = await createPlanCheckout({
        planKey,
        amount:        gpAmount,
        currency,
        customerName:  name,
        customerEmail: email,
        customerPhone: phone,
        userId:        user.id,
        successUrl:    `${appUrl}/dashboard?subscription=success&plan=${planKey}`,
        errorUrl:      `${appUrl}/pricing?subscription=cancelled`,
      })

      await savePending(checkout.reference)
      console.log('[GeniusPay] checkout OK:', checkout.reference)

      return NextResponse.json({
        success:     true,
        redirectUrl: checkout.redirectUrl,
        reference:   checkout.reference,
        gateway:     'geniuspay',
      })
    } catch (gpErr) {
      console.error('[GeniusPay] échec:', gpErr instanceof Error ? gpErr.message : gpErr)
      // Continuer vers WhatsApp
    }
  }

  // ═══════════════════════════════════════════════════════
  // FALLBACK FINAL : WhatsApp (paiement manuel)
  // ═══════════════════════════════════════════════════════
  console.warn('[Payment] Tous les gateways échoués → WhatsApp fallback')
  return NextResponse.json({
    success:     true,
    redirectUrl: waFallback(),
    fallback:    true,
    gateway:     'whatsapp',
    message:     'Paiement via WhatsApp',
  })
}
