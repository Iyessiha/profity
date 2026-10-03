// ============================================================
// PROFITYX — Analytics via Posthog
// ============================================================
import posthog from 'posthog-js'

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || ''
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

export function initAnalytics() {
  if (typeof window === 'undefined' || !KEY) return
  if (posthog.__loaded) return
  posthog.init(KEY, {
    api_host: HOST,
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false,
    persistence: 'localStorage',
  })
}

export function identify(userId: string, props?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !KEY) return
  posthog.identify(userId, props)
}

export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !KEY) return
  posthog.capture(event, props)
}

export function trackPage(page: string) {
  track('$pageview', { page })
}
