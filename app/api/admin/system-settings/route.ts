import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { anthropic_budget, anthropic_spent, xof_per_usd } = await req.json()
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  // Stocker dans une table settings
  await admin.from('system_settings').upsert([
    { key: 'anthropic_budget', value: String(anthropic_budget ?? 500) },
    { key: 'anthropic_spent',  value: String(anthropic_spent ?? 0) },
    { key: 'xof_per_usd',      value: String(xof_per_usd ?? 620) },
  ], { onConflict: 'key' })
  return NextResponse.json({ success: true })
}
