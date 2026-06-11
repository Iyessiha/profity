// ============================================================
// PROFITYX — Hook useSubscription
// Gère l'abonnement côté client : statut, upgrade, annulation
// ============================================================
'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabasePublic }                   from '@/lib/supabase'
import { PLANS, PLAN_PRICES, type PlanKey } from '@/lib/geniuspay'

// ─── Types ───────────────────────────────────────────────────
export interface SubscriptionStatus {
  plan:           string
  analyses_used:  number
  news_used:      number
  reset_at:       string
  subscription:   {
    status:             string
    plan:               string
    amount:             number
    currency:           string
    current_period_end: string
    cancelled_at:       string | null
  } | null
}

// ─── Hook principal ───────────────────────────────────────────
export function useSubscription() {
  const [status,    setStatus]    = useState<SubscriptionStatus | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [cancelling,setCancelling]= useState(false)
  const [error,     setError]     = useState<string | null>(null)

  // Charger le statut
  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabasePublic.auth.getSession()
      if (!session) { setLoading(false); return }

      const res  = await fetch('/api/payment/status', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      })
      const json = await res.json()
      if (json.success) setStatus(json.data)
    } catch (e) {
      console.error('[useSubscription]', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  // Upgrader vers un plan payant
  const upgrade = useCallback(async (planKey: PlanKey, phone?: string) => {
    setUpgrading(true)
    setError(null)
    try {
      const { data: { session } } = await supabasePublic.auth.getSession()
      if (!session) throw new Error('Non connecté')

      const res  = await fetch('/api/payment/checkout', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan: planKey, phone }),
      })
      const json = await res.json()

      if (!json.success) throw new Error(json.error ?? 'Erreur checkout')

      // Rediriger vers GeniusPay / Stripe Checkout
      window.location.href = json.redirectUrl

    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setUpgrading(false)
    }
  }, [])

  // Annuler l'abonnement
  const cancel = useCallback(async () => {
    setCancelling(true)
    setError(null)
    try {
      const { data: { session } } = await supabasePublic.auth.getSession()
      if (!session) throw new Error('Non connecté')

      const res  = await fetch('/api/subscription/cancel', {
        method:  'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      })
      const json = await res.json()

      if (!json.success) throw new Error(json.error)
      await fetchStatus()   // rafraîchir

    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setCancelling(false)
    }
  }, [fetchStatus])

  return { status, loading, upgrading, cancelling, error, upgrade, cancel, refetch: fetchStatus }
}

// ============================================================
// Composant PricingCard
// ============================================================
interface PricingCardProps {
  planKey:     PlanKey
  currency:    string
  currentPlan: string
  onUpgrade:   (plan: PlanKey) => void
  upgrading:   boolean
  locale?:     string
}

const LABELS_FR = {
  free:  { cta: 'Plan actuel',     subCta: 'Commencer gratuit' },
  pro:   { cta: 'Passer au Pro',   subCta: 'Activer — Pro'     },
  elite: { cta: 'Passer à Elite',  subCta: 'Activer — Elite'   },
}
const LABELS_EN = {
  free:  { cta: 'Current plan',    subCta: 'Start free'        },
  pro:   { cta: 'Upgrade to Pro',  subCta: 'Activate — Pro'    },
  elite: { cta: 'Upgrade to Elite',subCta: 'Activate — Elite'  },
}

const FEATURES: Record<PlanKey, string[]> = {
  free:  ['3 analyses chart / mois', '5 signaux annonces / mois', 'Calendrier économique'],
  pro:   ['100 analyses chart / mois', 'Signaux annonces illimités', 'Alertes push', 'Historique 90 jours'],
  elite: ['Analyses illimitées', 'Annonces illimitées', 'Tous les actifs', 'Alertes prioritaires', 'Historique illimité'],
}

export function PricingCard({ planKey, currency, currentPlan, onUpgrade, upgrading, locale = 'fr' }: PricingCardProps) {
  const plan     = PLANS[planKey]
  const price    = PLAN_PRICES[currency]?.[planKey] ?? PLAN_PRICES['XOF'][planKey]
  const isCurrent = currentPlan === planKey
  const isFeatured = planKey === 'pro'
  const labels   = locale === 'fr' ? LABELS_FR : LABELS_EN
  const label    = labels[planKey]

  const HUD = "'Orbitron', monospace"
  const BODY = "'Rajdhani', sans-serif"

  const CURR_SYMBOLS: Record<string, string> = {
    XOF: 'FCFA', XAF: 'FCFA', USD: '$', EUR: '€', GHS: '₵', NGN: '₦', MAD: 'MAD'
  }
  const sym = CURR_SYMBOLS[currency] ?? 'FCFA'

  return (
    <div style={{
      background:   isFeatured ? '#0D1420' : '#06090F',
      border:       `1px solid ${isFeatured ? 'rgba(0,255,178,0.35)' : 'rgba(0,255,178,0.1)'}`,
      borderRadius: 4,
      padding:      '1.75rem',
      position:     'relative',
      overflow:     'hidden',
      fontFamily:   BODY,
      transition:   'border-color .3s',
    }}>
      {/* Ligne top featured */}
      {isFeatured && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, #00FFB2, #00D4FF, transparent)',
        }} />
      )}

      {/* Badge populaire */}
      {isFeatured && (
        <div style={{
          position: 'absolute', top: '1rem', right: '1rem',
          background: 'rgba(0,255,178,0.1)', border: '1px solid rgba(0,255,178,0.25)',
          color: '#00FFB2', fontFamily: HUD, fontSize: 8, letterSpacing: 3,
          padding: '3px 10px', borderRadius: 2,
        }}>
          {locale === 'fr' ? 'LE PLUS POPULAIRE' : 'MOST POPULAR'}
        </div>
      )}

      {/* Plan name */}
      <div style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 4, color: 'rgba(232,244,248,0.4)', marginBottom: '1rem' }}>
        {planKey.toUpperCase()}
      </div>

      {/* Prix */}
      <div style={{ fontFamily: HUD, fontSize: 48, fontWeight: 900, lineHeight: 1, letterSpacing: 1, color: '#E8F4F8', marginBottom: 2 }}>
        {price === 0 ? '0' : price.toLocaleString('fr-FR')}
      </div>
      <div style={{ fontFamily: BODY, fontSize: 14, color: 'rgba(232,244,248,0.4)', marginBottom: '1.5rem' }}>
        {sym} · {locale === 'fr' ? (price === 0 ? 'gratuit' : 'par mois') : (price === 0 ? 'free' : 'per month')}
      </div>

      {/* Features */}
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '2rem' }}>
        {FEATURES[planKey].map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'rgba(232,244,248,0.6)', fontWeight: 300 }}>
            <span style={{ color: '#00E676', fontSize: 12 }}>✓</span> {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={() => !isCurrent && planKey !== 'free' && onUpgrade(planKey)}
        disabled={isCurrent || planKey === 'free' || upgrading}
        style={{
          width:        '100%',
          padding:      '12px',
          borderRadius: 3,
          fontFamily:   HUD,
          fontSize:     10,
          letterSpacing: 2,
          cursor:       isCurrent || planKey === 'free' ? 'default' : 'pointer',
          transition:   'all .2s',
          background:   isFeatured && !isCurrent ? '#00FFB2' : 'transparent',
          color:        isFeatured && !isCurrent ? '#020408' : (isCurrent ? '#00FFB2' : '#E8F4F8'),
          border:       isFeatured && !isCurrent ? 'none' : '1px solid rgba(0,255,178,0.2)',
          fontWeight:   700,
          opacity:      upgrading ? 0.7 : 1,
        }}
      >
        {isCurrent
          ? (locale === 'fr' ? '✓ PLAN ACTUEL' : '✓ CURRENT PLAN')
          : upgrading
          ? (locale === 'fr' ? 'REDIRECTION...' : 'REDIRECTING...')
          : label.subCta.toUpperCase()
        }
      </button>
    </div>
  )
}

export { PLANS, PLAN_PRICES }
