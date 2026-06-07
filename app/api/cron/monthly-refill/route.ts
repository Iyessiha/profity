import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') || new URL(req.url).searchParams.get('secret')
  if (secret !== process.env.PROFITY_CRON_KEY && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error:'Unauthorized' }, { status:401 })
  }
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth:{autoRefreshToken:false,persistSession:false} })
  const { error } = await db.rpc('monthly_credit_refill')
  if (error) return NextResponse.json({ success:false, error:error.message }, { status:500 })
  return NextResponse.json({ success:true, message:'Recharge mensuelle effectuée', timestamp:new Date().toISOString() })
}
