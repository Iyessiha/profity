import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key', { auth:{autoRefreshToken:false,persistSession:false} })
async function getUser(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ','')
  if (!token) return null
  const { data:{user} } = await createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key').auth.getUser(token)
  return user
}

// Liste blanche : sans elle, le client pouvait fournir `user_id` (écrit APRÈS celui du token
// → insertion dans le journal d'un autre utilisateur) ou modifier n'importe quelle colonne.
const ALLOWED = ['pair','direction','entry','exit','stop_loss','tp','lot_size','result','pnl_pips','pnl_amount','emotion','notes','trade_date'] as const
function pick(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const k of ALLOWED) if (body[k] !== undefined) out[k] = body[k]
  return out
}

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success:false }, { status:401 })
  const { data, error } = await admin().from('trading_journal').select('*').eq('user_id', user.id).order('trade_date', { ascending:false }).limit(50)
  if (error) return NextResponse.json({ success:false, error:error.message }, { status:500 })

  const wins  = data?.filter(t => t.result === 'WIN').length ?? 0
  const total = data?.filter(t => t.result !== null).length ?? 0
  const pnl   = data?.reduce((sum, t) => sum + (t.pnl_amount ?? 0), 0) ?? 0

  return NextResponse.json({ success:true, trades:data ?? [], stats:{ wins, losses:total-wins, winrate: total>0?Math.round((wins/total)*100):0, total_pnl:pnl } })
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success:false }, { status:401 })
  const body = await req.json().catch(() => ({}))
  const { data, error } = await admin().from('trading_journal').insert({ ...pick(body), user_id:user.id }).select().single()
  if (error) return NextResponse.json({ success:false, error:error.message }, { status:500 })
  await admin().rpc('update_streak_and_reward', { p_user_id: user.id })
  return NextResponse.json({ success:true, trade:data })
}

export async function PATCH(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success:false }, { status:401 })
  const { id, ...rest } = await req.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error:'ID requis' }, { status:400 })
  const { data, error } = await admin().from('trading_journal').update(pick(rest)).eq('id', id).eq('user_id', user.id).select().single()
  if (error) return NextResponse.json({ success:false, error:error.message }, { status:500 })
  return NextResponse.json({ success:true, trade:data })
}

export async function DELETE(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success:false }, { status:401 })
  const { id } = await req.json().catch(() => ({}))
  await admin().from('trading_journal').delete().eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ success:true })
}
