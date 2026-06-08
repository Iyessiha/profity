// ============================================================
// PROFITYX — Facebook Pixel Helper
// Pixel ID : 971512922538139
// ============================================================

declare global {
  interface Window { fbq?: (...args: unknown[]) => void }
}

function fbq(...args: unknown[]) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq(...args)
  }
}

// ── Événements standard Meta ──────────────────────────────

/** Page vue (automatique via layout, mais utile pour SPA) */
export function pixelPageView() {
  fbq('track', 'PageView')
}

/** Inscription — déclencher après création de compte */
export function pixelLead() {
  fbq('track', 'Lead')
}

/** Début de checkout — déclencher au clic sur "S'abonner" */
export function pixelInitiateCheckout(plan: 'pro' | 'elite', value: number) {
  fbq('track', 'InitiateCheckout', {
    content_name: `ProfityX ${plan.toUpperCase()}`,
    currency: 'USD',
    value,
  })
}

/** Achat confirmé — déclencher après paiement réussi */
export function pixelPurchase(plan: 'pro' | 'elite', value: number) {
  fbq('track', 'Purchase', {
    content_name: `ProfityX ${plan.toUpperCase()}`,
    currency: 'USD',
    value,
    content_type: 'product',
  })
}

// ── Événements personnalisés ProfityX ────────────────────

/** Analyse de chart lancée */
export function pixelAnalysis(mode: 'swing' | 'scalp') {
  fbq('trackCustom', 'ChartAnalysis', { mode })
}

/** Signal IA reçu avec succès */
export function pixelSignalReceived(direction: string, pair: string) {
  fbq('trackCustom', 'SignalReceived', { direction, pair })
}

/** Clic sur un bouton ANTICIPER du calendrier */
export function pixelAnticipate(eventTitle: string) {
  fbq('trackCustom', 'AnticipateEvent', { event_title: eventTitle })
}
