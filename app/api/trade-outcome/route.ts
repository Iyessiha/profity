// ============================================================
// PROFITYX — POST /api/trade-outcome
// Soumettre WIN / LOSS / PENDING sur une analyse
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = () => createClient(
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

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { analysis_id, result } = body as { analysis_id?: string; result?: string }

  if (!analysis_id || !result) {
    return NextResponse.json({ success: false, error: 'analysis_id et result requis' }, { status: 400 })
  }
  if (!['win', 'loss', 'pending'].includes(result)) {
    return NextResponse.json({ success: false, error: 'result doit être win, loss ou pending' }, { status: 400 })
  }

  const db = admin()
  const { data, error } = await db.rpc('submit_trade_outcome', {
    p_analysis_id: analysis_id,
    p_user_id:     user.id,
    p_result:      result,
  })

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  const res = data as { success: boolean; error?: string }
  if (!res?.success) {
    return NextResponse.json({ success: false, error: res?.error ?? 'Erreur' }, { status: 400 })
  }

  // Bonus +1 crédit si WIN (encourage à noter)
  if (result === 'win') {
    await db.rpc('add_credits', {
      p_user_id: user.id,
      p_amount:  1,
      p_type:    'bonus',
      p_desc:    '🏆 Bonus WIN — merci pour votre retour !',
    })
  }

  return NextResponse.json({ success: true, result })
}
