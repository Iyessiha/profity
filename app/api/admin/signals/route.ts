import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const filter = req.nextUrl.searchParams.get('filter') ?? 'pending'
  let query = admin.from('chart_analyses')
    .select('id, pair, direction, entry, rr_ratio, trade_result, confidence, created_at, user_id, profiles!inner(email)')
    .order('created_at', { ascending: false }).limit(100)
  if (filter === 'pending') query = query.is('trade_result', null)
  const { data } = await query
  const signals = (data ?? []).map((s: Record<string,unknown>) => ({
    ...s, user_email: (s.profiles as Record<string,string>)?.email,
  }))
  return NextResponse.json({ signals })
}
