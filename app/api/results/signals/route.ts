import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'
export async function GET() {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await admin.from('chart_analyses')
    .select('id, pair, timeframe, direction, entry, rr_ratio, confidence, trade_result, created_at')
    .order('created_at', { ascending: false })
    .limit(50)
  return NextResponse.json({ signals: data ?? [] }, {
    headers: { 'Cache-Control': 'no-store, no-cache' }
  })
}
