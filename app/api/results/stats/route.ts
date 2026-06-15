import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key'
  )

  // Stats globales sur TOUTES les analyses (agrégé anonyme — pas de données perso)
  const { data } = await admin
    .from('chart_analyses')
    .select('trade_result, rr_ratio, created_at, user_id, pair')

  const rows = data ?? []
  const wins    = rows.filter(r => r.trade_result === 'WIN').length
  const losses  = rows.filter(r => r.trade_result === 'LOSS').length
  const total   = rows.length
  const pending = rows.filter(r => !r.trade_result).length
  const rated   = wins + losses
  const winrate = rated > 0 ? Math.round((wins / rated) * 100) : 0
  const rrValues = rows.filter(r => r.rr_ratio > 0).map(r => Number(r.rr_ratio))
  const avg_rr  = rrValues.length > 0
    ? Math.round((rrValues.reduce((a, b) => a + b, 0) / rrValues.length) * 100) / 100
    : 0
  const traders        = new Set(rows.map(r => r.user_id)).size
  const week           = new Date(Date.now() - 7 * 864e5).toISOString()
  const this_week      = rows.filter(r => r.created_at > week).length
  const pairs_traded   = new Set(rows.map(r => r.pair).filter(Boolean)).size

  return NextResponse.json(
    { total, wins, losses, pending, winrate, avg_rr, traders, this_week, pairs_traded },
    { headers: { 'Cache-Control': 'no-store, no-cache' } }
  )
}
