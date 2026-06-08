import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await admin.from('invoices').select('*').order('created_at', { ascending: false })
  return NextResponse.json({ invoices: data ?? [] })
}
