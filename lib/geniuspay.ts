import crypto from 'crypto'
// ============================================================
// PROFITYX — Client GeniusPay (API Paiements / mode Checkout)
// Doc : https://geniuspay.ci/docs/api
// Base : https://geniuspay.ci/api/v1/merchant
// ============================================================

const GP_BASE    = 'https://geniuspay.ci/api/v1/merchant'
const GP_API_KEY = process.env.GENIUSPAY_API_KEY!
const GP_SECRET  = process.env.GENIUSPAY_SECRET!

function gpHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-API-Key':    GP_API_KEY,
    'X-API-Secret': GP_SECRET,
  }
}

// ─── PLANS PROFITYX ──────────────────────────────────────────
export const PLANS = {
  free:  { name: 'Starter',        amount: 0,     currency: 'XOF' },
  pro:   { name: 'ProfityX Pro',   amount: 17500, currency: 'XOF' },
  elite: { name: 'ProfityX Elite', amount: 35000, currency: 'XOF' },
} as const

export type PlanKey = keyof typeof PLANS

export const PLAN_PRICES: Record<string, Record<string, number>> = {
  XOF: { free: 0, pro: 17500, elite: 35000 },
  XAF: { free: 0, pro: 17500, elite: 35000 },
  USD: { free: 0, pro: 29,    elite: 59    },
  EUR: { free: 0, pro: 27,    elite: 54    },
  GHS: { free: 0, pro: 500,   elite: 1000  },
  NGN: { free: 0, pro: 47000, elite: 94000 },
  MAD: { free: 0, pro: 450,   elite: 900   },
}

// ─── PACKS DE CRÉDITS ────────────────────────────────────────
export const CREDIT_PACK_PRICES: Record<string, { credits: number; amount: number; label: string }> = {
  starter:     { credits: 30,  amount: 2000, label: 'Pack Starter — 30 crédits'      },
  standard:    { credits: 80,  amount: 4500, label: 'Pack Standard — 80 crédits'     },
  pro_oneshot: { credits: 200, amount: 9900, label: 'Pack Pro One-shot — 200 crédits' },
}

// ============================================================
// Extraire un message d'erreur lisible de la réponse GeniusPay
// Format doc : { success:false, error:{ code, message } }
// ============================================================
function parseError(status: number, body: string): string {
  try {
    const j = JSON.parse(body)
    if (j?.error?.message) return `${j.error.code ?? status} : ${j.error.message}`
    if (j?.message) return String(j.message)
  } catch { /* body non-JSON */ }
  return `HTTP ${status} ${body.slice(0, 200)}`
}

// ============================================================
// CRÉER UN PAIEMENT (mode Checkout — le client choisit Wave/OM/MTN/carte)
// Utilisé pour souscrire/renouveler un plan ProfityX
// ============================================================
export interface CheckoutParams {
  planKey:       PlanKey
  amount:        number          // montant dans la devise choisie (converti côté appelant si besoin)
  currency?:     string
  customerName:  string
  customerEmail: string
  customerPhone: string
  userId:        string
  successUrl:    string
  errorUrl:      string
  paymentMethod?: string         // optionnel : 'wave','orange_money','mtn_money','moov_money','card'. Omis = page checkout
}

export interface CheckoutResult {
  reference:   string
  status:      string
  redirectUrl: string
  planKey:     PlanKey
}

export async function createPlanCheckout(p: CheckoutParams): Promise<CheckoutResult> {
  const plan = PLANS[p.planKey]

  const body: Record<string, unknown> = {
    amount:      p.amount,
    currency:    p.currency ?? 'XOF',
    description: `Abonnement ${plan.name} (mensuel)`,
    customer: {
      name:    p.customerName,
      email:   p.customerEmail,
      phone:   p.customerPhone,
      country: 'CI',
    },
    success_url: p.successUrl,
    error_url:   p.errorUrl,
    metadata: {
      user_id:  p.userId,
      plan_key: p.planKey,
      app:      'profityx',
      kind:     'subscription',
    },
  }
  // Si un moyen précis est demandé, on le passe (sinon page checkout GeniusPay)
  if (p.paymentMethod) body.payment_method = p.paymentMethod

  const res = await fetch(`${GP_BASE}/payments`, {
    method:  'POST',
    headers: gpHeaders(),
    body:    JSON.stringify(body),
  })

  const text = await res.text()
  if (!res.ok) throw new Error(parseError(res.status, text))

  const json = JSON.parse(text)
  const d = json.data ?? {}
  const redirectUrl = d.checkout_url ?? d.payment_url
  if (!redirectUrl) throw new Error('Réponse GeniusPay sans URL de paiement')

  return {
    reference:   d.reference,
    status:      d.status ?? 'pending',
    redirectUrl,
    planKey:     p.planKey,
  }
}

// ============================================================
// RÉCUPÉRER UN PAIEMENT (vérification du statut)
// ============================================================
export async function getPayment(reference: string) {
  const res = await fetch(`${GP_BASE}/payments/${reference}`, { headers: gpHeaders() })
  const text = await res.text()
  if (!res.ok) throw new Error(parseError(res.status, text))
  const json = JSON.parse(text)
  return json.data as {
    reference: string
    amount:    number
    status:    'pending' | 'processing' | 'completed' | 'failed' | 'expired' | 'cancelled'
    metadata:  Record<string, string>
    completed_at: string | null
  }
}

// ============================================================
// VÉRIFIER LA SIGNATURE WEBHOOK
// Doc : signature = HMAC-SHA256(timestamp + "." + json_payload, secret)
// ============================================================
export function verifyWebhookSignature(
  rawPayload: string,
  signature:  string,
  timestamp:  string,
  secret:     string
): boolean {
  const data = `${timestamp}.${rawPayload}`
  const expected = crypto.createHmac('sha256', secret).update(data).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}
