// ============================================================
// PROFITYX — /api/watchlist
// GET : liste des paires suivies · POST : ajouter · DELETE : retirer
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function getUser(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await anon.auth.getUser(token)
  return user
}

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('watchlist').select('id, symbol').eq('user_id', user.id).order('created_at', { ascending: true })

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data: data ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const symbol = String(body.symbol ?? '').trim().toUpperCase()
  if (!symbol || symbol.length > 20) {
    return NextResponse.json({ success: false, error: 'Symbole invalide' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('watchlist')
    .upsert({ user_id: user.id, symbol }, { onConflict: 'user_id,symbol' })
    .select('id, symbol')
    .single()

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}

export async function DELETE(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ success: false, error: 'ID manquant' }, { status: 400 })

  // S'assurer que la ligne appartient bien à l'utilisateur
  const { error } = await supabaseAdmin
    .from('watchlist').delete().eq('id', id).eq('user_id', user.id)

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
