// ============================================================
// PROFITYX — Client CinetPay
// Passerelle de paiement CI/WA — sans Cloudflare bot protection
// Doc : https://docs.cinetpay.com
// ============================================================

const CP_BASE    = 'https://api-checkout.cinetpay.com/v2'
const CP_APIKEY  = process.env.CINETPAY_APIKEY!
const CP_SITE_ID = process.env.CINETPAY_SITE_ID!

export const CP_PRICES: Record<string, Record<string, number>> = {
  XOF: { free: 0, pro: 17500, elite: 35000 },
  XAF: { free: 0, pro: 17500, elite: 35000 },
  USD: { free: 0, pro: 29,    elite: 59    },
  EUR: { free: 0, pro: 27,    elite: 54    },
  GHS: { free: 0, pro: 500,   elite: 1000  },
  NGN: { free: 0, pro: 47000, elite: 94000 },
}

export interface CinetPayCheckoutParams {
  planKey:       'pro' | 'elite'
  amount:        number
  currency:      string
  customerName:  string
  customerEmail: string
  customerPhone: string
  userId:        string
  transactionId: string
  successUrl:    string
  cancelUrl:     string
}

export interface CinetPayResult {
  transactionId: string
  paymentUrl:    string
  status:        string
}

export async function createCinetPayCheckout(p: CinetPayCheckoutParams): Promise<CinetPayResult> {
  const body = {
    apikey:          CP_APIKEY,
    site_id:         CP_SITE_ID,
    transaction_id:  p.transactionId,
    amount:          p.amount,
    currency:        p.currency || 'XOF',
    description:     `Abonnement ProfityX ${p.planKey.toUpperCase()} (mensuel)`,
    return_url:      p.successUrl,
    notify_url:      `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/webhook`,
    customer_name:   p.customerName,
    customer_email:  p.customerEmail,
    customer_phone_number: p.customerPhone,
    customer_country:'CI',
    channels:        'ALL',  // Wave, OM, MTN, Moov, CB...
    metadata:        JSON.stringify({ user_id: p.userId, plan_key: p.planKey, app: 'profityx' }),
    lang:            'fr',
    alternative_currency: '',
  }

  const res  = await fetch(`${CP_BASE}/payment`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  const text = await res.text()
  let json: Record<string, unknown>
  try { json = JSON.parse(text) } catch { throw new Error(`CinetPay réponse non-JSON: ${text.slice(0,200)}`) }

  if (json.code !== '201') {
    throw new Error(`CinetPay erreur ${json.code}: ${json.message ?? text.slice(0,200)}`)
  }

  const data = json.data as Record<string, string>
  return {
    transactionId: p.transactionId,
    paymentUrl:    data.payment_url,
    status:        'pending',
  }
}

// Vérifier le statut d'un paiement CinetPay
export async function checkCinetPayPayment(transactionId: string): Promise<{
  status: 'ACCEPTED' | 'REFUSED' | 'PENDING'
  metadata: Record<string, string>
}> {
  const res = await fetch(`${CP_BASE}/payment/check`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ apikey: CP_APIKEY, site_id: CP_SITE_ID, transaction_id: transactionId }),
  })
  const json = await res.json() as Record<string, unknown>
  const data = (json.data ?? {}) as Record<string, unknown>
  return {
    status:   (data.status as string) as 'ACCEPTED' | 'REFUSED' | 'PENDING' ?? 'PENDING',
    metadata: JSON.parse((data.metadata as string) || '{}'),
  }
}
