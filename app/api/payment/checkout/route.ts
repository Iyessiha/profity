// ============================================================
// PROFITYX — POST /api/payment/checkout
// Crée un paiement GeniusPay (mode checkout) et retourne l'URL
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { createPlanCheckout, PLAN_PRICES, type PlanKey } from '@/lib/geniuspay'

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
  const body = await req.json().catch(() => ({}))
  const planKey = body.plan as PlanKey
  if (!['pro', 'elite'].includes(planKey)) {
    return NextResponse.json({ success: false, error: 'Plan invalide' }, { status: 400 })
  }

  // 3. Profil
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('email, full_name, phone, user_plan, currency').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ success: false, error: 'Profil introuvable' }, { status: 404 })
  if (profile.user_plan === planKey) {
    return NextResponse.json({ success: false, error: 'Vous êtes déjà sur ce plan' }, { status: 409 })
  }

  // 4. Montant selon la devise (le solde GeniusPay est en XOF, conversion auto pour devises étrangères)
  const currency = (profile.currency as string) || 'XOF'
  const amount = (PLAN_PRICES[currency] ?? PLAN_PRICES.XOF)[planKey] ?? PLAN_PRICES.XOF[planKey]

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://profity-alpha.vercel.app'

  // 5. Créer le paiement GeniusPay
  try {
    const checkout = await createPlanCheckout({
      planKey,
      amount,
      currency,
      customerName:  profile.full_name ?? 'Utilisateur ProfityX',
      customerEmail: profile.email ?? user.email ?? '',
      customerPhone: (profile.phone as string) || '+2250000000000',
      userId:        user.id,
      successUrl:    `${appUrl}/dashboard?subscription=success&plan=${planKey}`,
      errorUrl:      `${appUrl}/pricing?subscription=cancelled`,
      paymentMethod: body.payment_method,  // optionnel
    })

    // 6. Enregistrer un abonnement "pending" lié à la référence
    await supabaseAdmin.from('subscriptions').upsert({
      user_id:              user.id,
      plan:                 planKey,
      status:               'pending',
      currency:             'XOF',
      amount:               PLAN_PRICES.XOF[planKey],
      paygenius_id:         checkout.reference,
      current_period_start: new Date().toISOString(),
      current_period_end:   new Date(Date.now() + 30 * 864e5).toISOString(),
    }, { onConflict: 'user_id' })

    return NextResponse.json({ success: true, redirectUrl: checkout.redirectUrl, reference: checkout.reference })

  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('[GeniusPay] checkout error:', detail)
    let hint = ''
    if (/MISSING_API_KEY|INVALID_API_KEY|401/i.test(detail)) hint = ' (clés GeniusPay invalides — vérifiez GENIUSPAY_API_KEY / GENIUSPAY_SECRET)'
    else if (/MERCHANT_INACTIVE|403/i.test(detail))          hint = ' (compte marchand inactif — activez le mode live)'
    else if (/VALIDATION_ERROR|422/i.test(detail))           hint = ' (données invalides)'
    else if (/ENOTFOUND|ECONNREFUSED|fetch failed/i.test(detail)) hint = ' (impossible de joindre GeniusPay)'
    return NextResponse.json({ success: false, error: `Erreur création paiement${hint}`, detail }, { status: 502 })
  }
}
