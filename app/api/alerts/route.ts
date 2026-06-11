// ============================================================
// PROFITYX — /api/alerts : CRUD alertes de prix
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key',
  { auth: { autoRefreshToken:false, persistSession:false } }
)

async function getUser(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ','')
  if (!token) return null
  const { data:{ user } } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'
  ).auth.getUser(token)
  return user
}

// GET — liste des alertes + prix actuels
export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success:false }, { status:401 })

  const db = admin()
  const [{ data:alerts }, { data:profile }] = await Promise.all([
    db.from('price_alerts').select('*').eq('user_id', user.id).order('created_at', { ascending:false }),
    db.from('profiles').select('user_plan').eq('id', user.id).single(),
  ])

  const plan  = (profile as { user_plan: string } | null)?.user_plan ?? 'free'
  const limit = plan === 'elite' ? 999 : plan === 'pro' ? 10 : 2

  return NextResponse.json({ success:true, alerts: alerts ?? [], plan, limit })
}

// POST — créer une alerte
export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success:false }, { status:401 })

  const body = await req.json().catch(() => ({}))
  const { pair, target_price, condition } = body as { pair:string; target_price:number; condition:'above'|'below' }
  if (!pair || !target_price || !condition) return NextResponse.json({ error:'Champs requis' }, { status:400 })

  const db = admin()
  const { data:profile } = await db.from('profiles').select('user_plan').eq('id', user.id).single()
  const plan  = (profile as { user_plan: string } | null)?.user_plan ?? 'free'
  const limit = plan === 'elite' ? 999 : plan === 'pro' ? 10 : 2

  const { count } = await db.from('price_alerts').select('id', { count:'exact', head:true }).eq('user_id', user.id).eq('active', true).eq('triggered', false)
  if ((count ?? 0) >= limit) return NextResponse.json({ error:`Limite atteinte (${limit} alertes actives pour votre plan)`, limit }, { status:403 })

  const { data, error } = await db.from('price_alerts').insert({ user_id:user.id, pair, target_price, condition }).select().single()
  if (error) return NextResponse.json({ error:error.message }, { status:500 })

  return NextResponse.json({ success:true, alert:data })
}

// DELETE — supprimer une alerte
export async function DELETE(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success:false }, { status:401 })

  const { id } = await req.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error:'ID requis' }, { status:400 })

  const { error } = await admin().from('price_alerts').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error:error.message }, { status:500 })

  return NextResponse.json({ success:true })
}
