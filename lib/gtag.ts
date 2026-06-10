// ============================================================
// PROFITYX — Google Ads Conversion Tracking
// ID : AW-18224201183
// ============================================================

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

const GA_ID = 'AW-18224201183'

function gtag(...args: unknown[]) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args)
  }
}

// ── 1. INSCRIPTION (Lead) ──────────────────────────────────
// Appelé dans app/auth/login/page.tsx après signup réussi
// Label à créer dans Google Ads → Conversions → "Inscription"
export function gtagLead() {
  // Événement Google Ads conversion
  gtag('event', 'conversion', {
    send_to: `${GA_ID}/signup`,   // label généré automatiquement
    value:    1.0,
    currency: 'USD',
  })
  // Événement standard GA4 (aussi visible dans Analytics)
  gtag('event', 'sign_up', {
    method: 'email',
  })
}

// ── 2. ANALYSE CHART ──────────────────────────────────────
// Appelé dans app/analysis/page.tsx après analyse réussie
export function gtagAnalysis() {
  gtag('event', 'conversion', {
    send_to: `${GA_ID}/analysis`,
    value:    0.5,
    currency: 'USD',
  })
  gtag('event', 'generate_lead', {
    event_category: 'engagement',
    event_label:    'chart_analysis',
  })
}

// ── 3. ACHAT CONFIRMÉ (Pro / Elite) ───────────────────────
// Appelé après paiement GeniusPay ou Paystack confirmé
export function gtagPurchase(plan: 'pro' | 'elite', value: number, currency: 'USD' | 'XOF' | 'NGN' = 'USD') {
  const valueUSD = currency === 'XOF' ? +(value / 620).toFixed(2)
                 : currency === 'NGN' ? +(value / 1600).toFixed(2)
                 : value

  // Conversion Google Ads
  gtag('event', 'conversion', {
    send_to:        `${GA_ID}/purchase`,
    value:           valueUSD,
    currency:        'USD',
    transaction_id:  `PX-${Date.now()}`,
  })

  // Événement purchase standard (ecommerce)
  gtag('event', 'purchase', {
    transaction_id: `PX-${Date.now()}`,
    value:           valueUSD,
    currency:        'USD',
    items: [{ item_id: plan, item_name: `ProfityX ${plan.toUpperCase()}`, price: valueUSD, quantity: 1 }],
  })
}

// ── 4. DÉBUT DE CHECKOUT ──────────────────────────────────
// Appelé quand l'utilisateur clique sur un bouton de paiement
export function gtagBeginCheckout(plan: 'pro' | 'elite', value: number) {
  gtag('event', 'begin_checkout', {
    value,
    currency: 'USD',
    items: [{ item_id: plan, item_name: `ProfityX ${plan.toUpperCase()}`, price: value, quantity: 1 }],
  })
}

// ── 5. VUE DE PAGE ────────────────────────────────────────
export function gtagPageView(url: string) {
  gtag('config', GA_ID, { page_path: url })
}

export { GA_ID }
