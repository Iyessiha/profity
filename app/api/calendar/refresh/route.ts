// ============================================================
// PROFITYX — POST /api/calendar/refresh
// Refresh manuel du cache (appelé par un cron Vercel)
// Protégé par un secret CRON_SECRET
// ============================================================
import { NextRequest, NextResponse } from 'next/server'

const FF_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json'

export async function POST(req: NextRequest) {
  // Vérifier le secret cron
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = await fetch(FF_URL, {
      headers: { 'User-Agent': 'ProfityX/1.0' },
    })

    if (!res.ok) throw new Error(`FF API returned ${res.status}`)

    const events = await res.json()

    // Écrire dans Supabase
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Purger ancien cache
    await supabase
      .from('calendar_cache')
      .delete()
      .lt('fetched_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    // Insérer nouveau
    const { error } = await supabase
      .from('calendar_cache')
      .insert({ events, fetched_at: new Date().toISOString() })

    if (error) throw error

    return NextResponse.json({
      success: true,
      count: Array.isArray(events) ? events.length : 0,
      fetched_at: new Date().toISOString(),
    })

  } catch (err) {
    console.error('[Cron] Calendar refresh error:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
