// ============================================================
// PROFITYX — CRON /api/cron/calendar
// Vercel Cron : rafraîchit le cache ForexFactory toutes les 5 min
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

const FF_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json'

const db = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(req: NextRequest) {
  // Vérifier le token CRON
  const auth = req.headers.get('authorization')
  const cronKey = process.env.PROFITY_CRON_KEY ?? ''
  if (cronKey && auth !== `Bearer ${cronKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = await fetch(FF_URL, {
      headers: { 'User-Agent': 'ProfityX-Cron/1.0' },
      cache:   'no-store',
    })
    if (!res.ok) throw new Error(`FF API ${res.status}`)

    const raw: unknown = await res.json()
    if (!Array.isArray(raw)) throw new Error('Réponse FF invalide')

    // Sauvegarder en cache
    const supabase = db()
    await supabase.from('calendar_cache').insert({
      events:     JSON.stringify(raw),
      fetched_at: new Date().toISOString(),
    })

    // Garder seulement les 10 dernières entrées (nettoyage)
    const { data: rows } = await supabase
      .from('calendar_cache')
      .select('id, fetched_at')
      .order('fetched_at', { ascending: false })

    if (rows && rows.length > 10) {
      const toDelete = rows.slice(10).map((r: { id: string }) => r.id)
      await supabase.from('calendar_cache').delete().in('id', toDelete)
    }

    return NextResponse.json({
      success:    true,
      events:     raw.length,
      fetched_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[CRON Calendar]', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
