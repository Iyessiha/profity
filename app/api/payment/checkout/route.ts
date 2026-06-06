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
      paymentMethod: body.payment_method,
    })

    // 6. Enregistrer un abonnement "pending"
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
    const detail  = err instanceof Error ? err.message : String(err)
    const isSetup = /MISSING_API_KEY|INVALID_API_KEY|401|403|allowlist|Host not/i.test(detail)

    console.error('[GeniusPay] checkout error:', detail)

    // Fallback WhatsApp si GeniusPay non configuré
    if (isSetup) {
      const { data: userProfile } = await supabaseAdmin.from('profiles').select('public_id').eq('id', user.id).single()
      const pid   = userProfile?.public_id ?? 'INCONNU'
      const pname = planKey === 'pro' ? 'Pro (17 500 FCFA/mois)' : 'Elite (35 000 FCFA/mois)'
      const msg   = encodeURIComponent(
        `Bonjour ProfityX 👋\n\nJe souhaite souscrire au plan ${pname}.\n\nMon identifiant : ${pid}\nEmail : ${profile.email ?? user.email}\n\nMerci de me confirmer les instructions de paiement.`
      )
      const waUrl = `https://wa.me/+2250500446464?text=${msg}`
      return NextResponse.json({
        success:     true,
        redirectUrl: waUrl,
        fallback:    true,
        message:     'Paiement via WhatsApp (configuration GeniusPay en cours)',
      })
    }

    return NextResponse.json({ success: false, error: 'Erreur paiement — contactez le support', detail }, { status: 502 })
  }
}
