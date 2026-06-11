import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key')
  const { data: { user } } = await anon.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key')
  const { data } = await admin.from('invoices')
    .select('id, invoice_number, plan, description, amount_xof, amount_usd, payment_method, status, token, created_at')
    .eq('user_id', user.id).order('created_at', { ascending: false })
  return NextResponse.json({ invoices: data ?? [] })
}
