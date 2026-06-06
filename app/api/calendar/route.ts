// ============================================================
// PROFITYX — GET /api/calendar
// Retourne les annonces économiques de la semaine
// Source : nfs.faireconomy.media (ForexFactory)
// Cache  : Supabase (30 min) pour éviter le rate limit FF
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import type { FFEvent, ApiResponse } from '@/types'

const FF_URL        = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json'
const CACHE_TTL_MS  = 30 * 60 * 1000   // 30 minutes
const HIGH_IMPACT   = ['High']          // filtrer par défaut sur High uniquement

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ─── Normaliser un événement brut ForexFactory ──────────────
function normalizeEvent(raw: Record<string, unknown>): FFEvent {
  return {
    title:    String(raw.title    ?? ''),
    country:  String(raw.country  ?? ''),
    date:     String(raw.date     ?? ''),
    impact:   (raw.impact as FFEvent['impact']) ?? 'Low',
    forecast: raw.forecast != null ? String(raw.forecast) : null,
    previous: raw.previous != null ? String(raw.previous) : null,
    actual:   raw.actual   != null ? String(raw.actual)   : null,
  }
}

// ─── Fetch depuis ForexFactory ───────────────────────────────
async function fetchFromFF(): Promise<FFEvent[]> {
  const res = await fetch(FF_URL, {
    headers: { 'User-Agent': 'ProfityX/1.0' },
    next:    { revalidate: 0 },   // pas de cache Next.js, on gère nous-mêmes
  })

  if (!res.ok) throw new Error(`FF API ${res.status}`)

  const raw: unknown = await res.json()
  if (!Array.isArray(raw)) throw new Error('Réponse FF invalide')

  return (raw as Record<string, unknown>[]).map(normalizeEvent)
}

// ─── Lire depuis le cache Supabase ───────────────────────────
async function readCache(): Promise<{ events: FFEvent[]; age: number } | null> {
  const { data, error } = await supabaseAdmin
    .from('calendar_cache')
    .select('events, fetched_at')
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null

  const age = Date.now() - new Date(data.fetched_at).getTime()
  return { events: data.events as FFEvent[], age }
}

// ─── Écrire dans le cache Supabase ───────────────────────────
async function writeCache(events: FFEvent[]): Promise<void> {
  // Supprimer les anciennes entrées (garder propre)
  await supabaseAdmin
    .from('calendar_cache')
    .delete()
    .lt('fetched_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  await supabaseAdmin
    .from('calendar_cache')
    .insert({ events, fetched_at: new Date().toISOString() })
}

// ─── Handler principal ───────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const impact    = searchParams.get('impact')     // 'High' | 'Medium' | 'Low' | 'all'
  const country   = searchParams.get('country')    // 'USD' | 'EUR' | etc.
  const forceRefresh = searchParams.get('refresh') === '1'

  let events: FFEvent[]
  let fromCache = false
  let cacheAgeMin = 0

  // 1. Tenter de lire depuis le cache
  if (!forceRefresh) {
    const cached = await readCache()
    if (cached && cached.age < CACHE_TTL_MS) {
      events     = cached.events
      fromCache  = true
      cacheAgeMin = Math.floor(cached.age / 60000)
    } else {
      // Cache expiré ou absent → fetch FF
      try {
        events = await fetchFromFF()
        await writeCache(events)
      } catch (err) {
        console.error('[Calendar] Erreur FF API:', err)
        // Fallback : retourner le cache expiré s'il existe
        if (cached) {
          events    = cached.events
          fromCache = true
          cacheAgeMin = Math.floor(cached.age / 60000)
        } else {
          return NextResponse.json<ApiResponse<null>>(
            { success: false, error: 'Impossible de récupérer le calendrier économique' },
            { status: 502 }
          )
        }
      }
    }
  } else {
    // Refresh forcé (admin seulement)
    try {
      events = await fetchFromFF()
      await writeCache(events)
    } catch (err) {
      console.error('[Calendar] Refresh forcé échoué:', err)
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Refresh calendrier échoué' },
        { status: 502 }
      )
    }
  }

  // 2. Filtrer par impact
  const impactFilter = impact === 'all'
    ? null
    : (impact ?? HIGH_IMPACT[0])

  if (impactFilter) {
    events = events.filter(e => e.impact === impactFilter)
  }

  // 3. Filtrer par pays/devise
  if (country && country !== 'all') {
    events = events.filter(e =>
      e.country.toUpperCase() === country.toUpperCase()
    )
  }

  // 4. Trier par date croissante
  events = events.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // 5. Enrichir avec statut (à venir / en cours / publié)
  const now = Date.now()
  const enriched = events.map(e => {
    const eventTime = new Date(e.date).getTime()
    const diff = eventTime - now
    return {
      ...e,
      status: e.actual != null
        ? 'published'
        : diff < 0
        ? 'overdue'
        : diff < 15 * 60 * 1000   // dans moins de 15 min
        ? 'imminent'
        : 'upcoming',
      minutes_until: Math.floor(diff / 60000),
    }
  })

  return NextResponse.json<ApiResponse<typeof enriched>>(
    {
      success: true,
      data: enriched,
      // Métadonnées utiles
      ...(fromCache && { cache: { age_minutes: cacheAgeMin, ttl_minutes: 30 } }),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'X-Cache': fromCache ? `HIT (${cacheAgeMin}min)` : 'MISS',
      },
    }
  )
}
