// ============================================================
// PROFITYX — Google Ads Conversion Tracking
// Remplacer AW-XXXXXXXXXX par ton vrai ID Google Ads
// ============================================================

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? 'AW-XXXXXXXXXX'

function gtag(...args: unknown[]) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args)
  }
}

// ── Événements standard ───────────────────────────────────

/** Page vue */
export function gtagPageView(url: string) {
  gtag('config', GA_ID, { page_path: url })
}

/** Inscription — Lead (rempli quand user crée un compte) */
export function gtagLead() {
  gtag('event', 'conversion', {
    send_to: `${GA_ID}/SIGNUP_CONVERSION_ID`,  // à remplacer
    value: 1.0,
    currency: 'USD',
  })
}

/** Analyse de chart lancée */
export function gtagAnalysis() {
  gtag('event', 'conversion', {
    send_to: `${GA_ID}/ANALYSIS_CONVERSION_ID`, // à remplacer
    value: 0.5,
    currency: 'USD',
  })
}

/** Achat confirmé — plan Pro ou Elite */
export function gtagPurchase(plan: 'pro' | 'elite', value: number) {
  gtag('event', 'conversion', {
    send_to: `${GA_ID}/PURCHASE_CONVERSION_ID`, // à remplacer
    value,
    currency: 'USD',
    transaction_id: `px_${Date.now()}`,
  })
  // Aussi envoyer un événement purchase standard
  gtag('event', 'purchase', {
    transaction_id: `px_${Date.now()}`,
    value,
    currency: 'USD',
    items: [{ item_name: `ProfityX ${plan}`, price: value, quantity: 1 }],
  })
}

/** Début de checkout */
export function gtagBeginCheckout(plan: 'pro' | 'elite', value: number) {
  gtag('event', 'begin_checkout', {
    value,
    currency: 'USD',
    items: [{ item_name: `ProfityX ${plan}`, price: value, quantity: 1 }],
  })
}

export { GA_ID }
