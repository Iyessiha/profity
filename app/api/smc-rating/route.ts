import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ','')
  if (!token) return NextResponse.json({ success:false }, { status:401 })

  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key')
  const { data:{ user } } = await anon.auth.getUser(token)
  if (!user) return NextResponse.json({ success:false }, { status:401 })

  const { analysis_id, result, shared = false } = await req.json()
  if (!analysis_id || !result) return NextResponse.json({ success:false, error:'Paramètres manquants' }, { status:400 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key',
    { auth:{ autoRefreshToken:false, persistSession:false } }
  )

  const { data, error } = await admin.rpc('rate_smc', {
    p_user_id:     user.id,
    p_analysis_id: analysis_id,
    p_result:      result,
    p_shared:      shared,
  })

  if (error) return NextResponse.json({ success:false, error:error.message }, { status:500 })

  return NextResponse.json({ success:true, ...(data as object) })
}
