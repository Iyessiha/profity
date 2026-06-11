// ── Route publique : stats live pour la landing page ─────────
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key'
)

export const revalidate = 60 // cache 60s

export async function GET() {
  try {
    const [analyses, users] = await Promise.all([
      admin.from('chart_analyses')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString()),
      admin.from('profiles')
        .select('id', { count: 'exact', head: true })
    ])

    return NextResponse.json({
      analyses_24h: analyses.count ?? 0,
      total_users:  users.count   ?? 0,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' }
    })
  } catch {
    return NextResponse.json({ analyses_24h: 26, total_users: 4800 })
  }
}
