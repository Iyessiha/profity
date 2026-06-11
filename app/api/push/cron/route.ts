// ============================================================
// PROFITYX — app/api/push/cron/route.ts
// Cron Vercel toutes les 5 min — détecte les annonces
// imminentes et envoie les notifications push aux abonnés
// Configurer dans vercel.json : "schedule": "*/5 * * * *"
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import type { FFEvent }              from '@/types'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const ALERT_MINUTES = [15, 5] // Alertes à 15min et 5min avant

export async function GET(req: NextRequest) {
  // Vérifier le secret cron Vercel
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Récupérer les événements depuis le cache
    const { data: cacheRow } = await supabaseAdmin
      .from('calendar_cache')
      .select('events, fetched_at')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single()

    if (!cacheRow?.events) {
      return NextResponse.json({ success: true, alerts: 0, reason: 'no_cache' })
    }

    const events = cacheRow.events as FFEvent[]
    const now    = Date.now()
    let alertsSent = 0

    // 2. Trouver les annonces dans les fenêtres d'alerte
    for (const event of events) {
      if (event.impact !== 'High' && event.impact !== 'Medium') continue
      if (event.actual != null) continue // déjà publiée

      const eventTime = new Date(event.date).getTime()
      const diffMin   = Math.round((eventTime - now) / 60000)

      // Vérifier si on est dans une fenêtre d'alerte
      const triggerMin = ALERT_MINUTES.find(m => diffMin >= m - 1 && diffMin <= m + 1)
      if (!triggerMin) continue

      // Construire la notification
      const isHigh   = event.impact === 'High'
      const flag     = getFlag(event.country)
      const payload  = {
        title:   `${flag} ${event.title}`,
        body:    `Impact ${event.impact} · ${event.country} · Dans ${triggerMin} minutes${event.forecast ? ` · Prévu: ${event.forecast}` : ''}`,
        url:     '/dashboard?tab=calendar',
        impact:  event.impact,
        country: event.country,
        tag:     `alert-${event.title}-${triggerMin}`,
      }

      // 3. Envoyer aux utilisateurs Pro/Elite qui ont les alertes actives
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://profity-x.com'
      const res = await fetch(`${appUrl}/api/push/send`, {
        method:  'POST',
        headers: {
          'Content-Type':      'application/json',
          'x-internal-secret': process.env.INTERNAL_SECRET ?? '',
        },
        body: JSON.stringify({
          plan_filter: isHigh ? ['pro', 'elite'] : ['elite'],
          payload,
        }),
      })

      if (res.ok) {
        const result = await res.json()
        alertsSent += result.sent ?? 0
        console.log(`[PushCron] ${event.title} (${triggerMin}min) → ${result.sent} notifications`)
      }
    }

    return NextResponse.json({ success: true, alerts: alertsSent, checked: events.length })

  } catch (err) {
    console.error('[PushCron] Erreur:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

// ─── Drapeaux pays ────────────────────────────────────────
function getFlag(country: string): string {
  const FLAGS: Record<string, string> = {
    USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵',
    CAD: '🇨🇦', AUD: '🇦🇺', CHF: '🇨🇭', NZD: '🇳🇿',
    CNY: '🇨🇳', KRW: '🇰🇷',
  }
  return FLAGS[country] ?? '🌍'
}
