// ============================================================
// PROFITYX — POST /api/payment/paystack/checkout
// Initialise un paiement Paystack pour les users Nigeria
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY ?? ''
const SITE_URL        = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://profity-x.com'

// Tarifs NGN (Naira) — 1 USD ≈ 1600 NGN
const PLANS_NGN: Record<string, { amount: number; label: string; credits: number; key: string }> = {
  pro:   { amount: 4500000, label: 'Plan PRO — 150 crédits/mois',   credits: 150, key: 'pro'   }, // 45 000 NGN (en kobo ×100)
  elite: { amount: 9000000, label: 'Plan ELITE — 600 crédits/mois', credits: 600, key: 'elite' }, // 90 000 NGN
}

export async function POST(req: NextRequest) {
  const { plan, user_id, email, name } = await req.json()

  if (!plan || !user_id || !email) {
    return NextResponse.json({ error: 'plan, user_id et email requis' }, { status: 400 })
  }

  const planData = PLANS_NGN[plan]
  if (!planData) {
    return NextResponse.json({ error: 'Plan inconnu' }, { status: 400 })
  }

  // Référence unique
  const reference = `PX-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`

  // Sauvegarder la référence en DB pour la retrouver dans le webhook
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  await admin.from('payment_transactions').insert({
    geniuspay_ref: reference,
    user_id,
    plan_id:       plan,
    amount_xof:    Math.round(planData.amount / 100 / 1.6), // Approximation FCFA
    status:        'pending',
    payment_method:'Paystack',
    metadata:      { plan, user_id, email, name, source: 'nigeria' },
  })

  // Initialiser la transaction Paystack
  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      email,
      amount:       planData.amount,
      currency:     'NGN',
      reference,
      callback_url: `${SITE_URL}/paystack-callback?ref=${reference}`,
      metadata: {
        user_id, plan, name,
        custom_fields: [
          { display_name: 'Plan',         variable_name: 'plan',    value: plan.toUpperCase() },
          { display_name: 'User ID',      variable_name: 'user_id', value: user_id },
          { display_name: 'Credits',      variable_name: 'credits', value: String(planData.credits) },
        ],
      },
    }),
  })

  const data = await res.json()
  if (!data.status) {
    return NextResponse.json({ error: data.message ?? 'Erreur Paystack' }, { status: 500 })
  }

  return NextResponse.json({
    authorization_url: data.data.authorization_url,
    reference,
    access_code:       data.data.access_code,
  })
}
