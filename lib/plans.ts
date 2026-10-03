// ============================================================
// PROFITYX — Prix des plans (affichage)
// Les paiements sont encaissés en FCFA (GeniusPay). Les montants USD
// affichés en anglais sont l'équivalent au taux de 620 FCFA / USD.
// ============================================================
import type { Locale } from '@/lib/i18n'

export const XOF_PER_USD = 620

export const PLAN_PRICES = {
  pro:   { month: 17_500, year: 150_000, usdMonth: 28, usdYear: 240 },
  elite: { month: 35_000, year: 300_000, usdMonth: 56, usdYear: 480 },
} as const

export type PaidPlan = keyof typeof PLAN_PRICES

/** « 17 500 FCFA » en français, « $28 » en anglais. */
export function planPrice(lang: Locale | string, plan: PaidPlan, period: 'month' | 'year' = 'month'): string {
  const p = PLAN_PRICES[plan]
  if (lang === 'en') return `$${period === 'month' ? p.usdMonth : p.usdYear}`
  return `${(period === 'month' ? p.month : p.year).toLocaleString('fr-FR').replace(/ | /g, ' ')} FCFA`
}

/** « 17 500 FCFA/mois » ou « $28/month ». */
export function planPricePerPeriod(lang: Locale | string, plan: PaidPlan, period: 'month' | 'year' = 'month'): string {
  const unit = lang === 'en' ? (period === 'month' ? '/month' : '/year') : (period === 'month' ? '/mois' : '/an')
  return planPrice(lang, plan, period) + unit
}
