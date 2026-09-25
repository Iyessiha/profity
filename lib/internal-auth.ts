// ============================================================
// PROFITYX — lib/internal-auth.ts
// Authentification des appels serveur→serveur et des crons.
// Échec fermé : si aucun secret n'est configuré, tout est refusé.
// ============================================================
import { NextRequest } from 'next/server'
import { timingSafeEqual } from 'node:crypto'

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

// Secret partagé pour les appels internes (webhooks → invoice, analyze → telegram, crons → push).
// INTERNAL_SECRET si défini, sinon la clé service Supabase (toujours présente côté serveur).
export function internalSecret(): string {
  return process.env.INTERNAL_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

export function internalHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json', 'x-internal-secret': internalSecret() }
}

export function isInternalRequest(req: NextRequest): boolean {
  const expected = internalSecret()
  const given = req.headers.get('x-internal-secret') ?? ''
  return !!expected && safeEqual(given, expected)
}

// Crons : Vercel envoie `Authorization: Bearer $CRON_SECRET`.
// Les planificateurs externes peuvent utiliser PROFITY_CRON_KEY via
// `Authorization: Bearer`, `x-cron-secret` ou `?secret=`.
export function isCronAuthorized(req: NextRequest): boolean {
  const candidates = [process.env.CRON_SECRET, process.env.PROFITY_CRON_KEY].filter(
    (s): s is string => !!s
  )
  if (candidates.length === 0) return false

  const bearer = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  const given = [
    bearer,
    req.headers.get('x-cron-secret') ?? '',
    req.nextUrl.searchParams.get('secret') ?? '',
  ].filter(Boolean)

  return given.some(g => candidates.some(c => safeEqual(g, c)))
}

// IP client (Vercel place l'IP réelle en premier dans x-forwarded-for)
export function clientIp(req: NextRequest): string {
  return (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || 'unknown'
}
