import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get('period') ?? 'month'
  const since  = period === 'month'
    ? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    : '2020-01-01T00:00:00Z'

  // Top traders par win rate (minimum 3 trades notés)
  const { data } = await db.from('profiles')
    .select('public_id, full_name, user_plan, total_wins, total_losses, total_rated')
    .gte('total_rated', 3)
    .order('total_wins', { ascending: false })
    .limit(20)

  const leaders = (data ?? [])
    .map((p, i) => ({
      rank:        i + 1,
      public_id:   p.public_id,
      full_name:   p.full_name,
      user_plan:   p.user_plan,
      total_wins:  p.total_wins  ?? 0,
      total_rated: p.total_rated ?? 0,
      win_rate:    p.total_rated > 0 ? Math.round((p.total_wins / p.total_rated) * 100) : 0,
    }))
    .filter(l => l.win_rate > 0)
    .sort((a, b) => b.win_rate - a.win_rate || b.total_wins - a.total_wins)
    .map((l, i) => ({ ...l, rank: i + 1 }))

  return NextResponse.json({ leaders }, {
    headers: { 'Cache-Control': 'public, s-maxage=300' }
  })
}
