// ============================================================
// PROFITYX — POST /api/payment/paystack/checkout
// Initialise un paiement Paystack pour les users Nigeria
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { randomBytes }               from 'node:crypto'

export const dynamic = 'force-dynamic'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY ?? ''
const SITE_URL        = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://profity-x.com'

// Tarifs NGN (Naira) — 1 USD ≈ 1600 NGN
// ⚠️ Garder aligné sur PLAN_KOBO dans paystack/webhook
const PLANS_NGN: Record<string, { amount: number; label: string; credits: number; key: string }> = {
  pro:   { amount: 4500000, label: 'Plan PRO — 150 crédits/mois',   credits: 150, key: 'pro'   }, // 45 000 NGN (en kobo ×100)
  elite: { amount: 9000000, label: 'Plan ELITE — 600 crédits/mois', credits: 600, key: 'elite' }, // 90 000 NGN
}

export async function POST(req: NextRequest) {
  // Auth : l'identité vient du token, jamais du body
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key')
  const { data: { user } } = await anon.auth.getUser(token)
  if (!user || !user.email) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

  const { plan, name } = await req.json().catch(() => ({}))
  const planData = PLANS_NGN[plan as string]
  if (!planData) {
    return NextResponse.json({ error: 'Plan inconnu' }, { status: 400 })
  }
  const user_id = user.id
  const email   = user.email

  // Référence unique (non devinable)
  const reference = `PX-${Date.now()}-${randomBytes(6).toString('hex').toUpperCase()}`

  // Sauvegarder la référence en DB pour la retrouver dans le webhook
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key', { auth: { autoRefreshToken: false, persistSession: false } })
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
          { display_name: 'Plan',         variable_name: 'plan',    value: String(plan).toUpperCase() },
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
