// ============================================================
// PROFITYX — /api/referral
// GET : stats de parrainage + lien
// POST : appliquer un code parrain
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
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: { user } } = await anon.auth.getUser(token)
  return user
}

// GET : lien de parrainage + stats
export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })

  const db = admin()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://profity-x.com'

  const [{ data: profile }, { data: stats }, { data: filleuls }] = await Promise.all([
    db.from('profiles').select('public_id, full_name').eq('id', user.id).single(),
    db.from('referral_stats').select('*').eq('referrer_id', user.id).single(),
    db.from('referrals').select('created_at, credits_given_referrer, status').eq('referrer_id', user.id).order('created_at', { ascending: false }).limit(10),
  ])

  const code     = profile?.public_id ?? ''
  const ref_url  = `${appUrl}/auth/login?ref=${code}`
  const wa_msg   = encodeURIComponent(`🚀 Rejoins ProfityX et reçois +10 crédits offerts !\nAnalyse tes charts avec l'IA en 3 secondes.\n\nMon lien : ${ref_url}`)
  const wa_url   = `https://wa.me/?text=${wa_msg}`

  return NextResponse.json({
    success: true,
    code,
    ref_url,
    wa_url,
    stats: {
      total_filleuls:    (stats as {total_filleuls?: number})?.total_filleuls ?? 0,
      total_credits:     (stats as {total_credits_gagnes?: number})?.total_credits_gagnes ?? 0,
      dernier_parrainage:(stats as {dernier_parrainage?: string})?.dernier_parrainage ?? null,
    },
    filleuls: filleuls ?? [],
  })
}

// POST : appliquer un code parrain
export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const code = (body.code as string)?.trim().toUpperCase()
  if (!code) return NextResponse.json({ success: false, error: 'Code requis' }, { status: 400 })

  const db = admin()
  const { data, error } = await db.rpc('apply_referral', {
    p_referred_id:  user.id,
    p_referrer_code: code,
  })

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  const result = data as { success: boolean; error?: string; credits_referred?: number }
  if (!result?.success) return NextResponse.json({ success: false, error: result?.error ?? 'Erreur' }, { status: 400 })

  return NextResponse.json({ success: true, credits_bonus: result.credits_referred })
}
