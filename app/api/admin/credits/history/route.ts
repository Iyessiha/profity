import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key')
  const { data } = await admin.from('credit_transactions')
    .select('amount, type, description, created_at, profiles!inner(email)')
    .eq('type', 'admin_adjust').order('created_at', { ascending: false }).limit(20)
  const history = (data ?? []).map((t: Record<string,unknown>) => ({
    ...t, user_email: (t.profiles as Record<string,string>)?.email,
  }))
  return NextResponse.json({ history })
}
