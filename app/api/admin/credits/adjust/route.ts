import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { email, amount, reason } = await req.json()
  if (!email || !amount || !reason) return NextResponse.json({ error: 'email, amount et reason requis' }, { status: 400 })
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key')
  const { data: prof } = await admin.from('profiles').select('id').eq('email', email).single()
  if (!prof) return NextResponse.json({ error: `User ${email} introuvable` }, { status: 404 })
  const { error } = await admin.rpc('add_credits', {
    p_user_id: prof.id, p_amount: amount,
    p_type: 'admin_adjust', p_description: `Admin: ${reason}`,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, user_id: prof.id, amount })
}
