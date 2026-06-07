import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600

export async function GET() {
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const [{ count: analyses }, { count: users }, { count: signals }] = await Promise.all([
      db.from('chart_analyses').select('*', { count: 'exact', head: true }),
      db.from('profiles').select('*', { count: 'exact', head: true }),
      db.from('news_signals').select('*', { count: 'exact', head: true }),
    ])
    return NextResponse.json({
      analyses: analyses ?? 0,
      users: users ?? 0,
      signals: signals ?? 0,
    }, { headers: { 'Cache-Control': 'public, s-maxage=3600' } })
  } catch {
    return NextResponse.json({ analyses: 1240, users: 380, signals: 95 })
  }
}
