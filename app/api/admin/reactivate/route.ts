// ── POST /api/admin/reactivate : email relance users inactifs ──
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const anon  = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key')
  const { data: { user } } = await anon.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key')
  const { data: prof } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!prof?.is_admin) return NextResponse.json({ error: 'Admin requis' }, { status: 403 })

  // Récupérer les users inactifs (0 analyses, inscrits il y a > 24h)
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: inactive } = await admin
    .from('profiles')
    .select('id, email, full_name, locale')
    .eq('analyses_used', 0)
    .lt('created_at', cutoff)
    .neq('email', '')

  if (!inactive || inactive.length === 0)
    return NextResponse.json({ sent: 0, message: 'Aucun utilisateur inactif' })

  let sent = 0
  const errors: string[] = []

  for (const u of inactive) {
    const firstName = u.full_name?.split(' ')[0] ?? 'trader'
    const subject   = u.locale === 'en'
      ? '🚀 Your first AI signal is waiting for you'
      : '🚀 Ton premier signal IA t\'attend'
    const body = u.locale === 'en'
      ? `Hi ${firstName},\n\nYou signed up on ProfityX but haven't launched your first AI analysis yet.\n\n👉 Upload a chart → get your entry, stop loss and take profit in 10 seconds.\n\nYour 10 free credits are waiting.\n\n→ profity-x.com/analysis\n\nProfityX Team`
      : `Bonjour ${firstName},\n\nTu t'es inscrit sur ProfityX mais n'as pas encore lancé ta première analyse IA.\n\n👉 Uploade un chart → reçois ton entrée, stop loss et take profit en 10 secondes.\n\nTes 10 crédits gratuits t'attendent.\n\n→ profity-x.com/analysis\n\nL'équipe ProfityX`

    try {
      const { error } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: u.email,
        options: { redirectTo: 'https://profity-x.com/analysis' }
      })
      if (!error) sent++
    } catch (e) {
      errors.push(u.email)
    }
  }

  return NextResponse.json({
    sent,
    total_inactive: inactive.length,
    errors,
    users: inactive.map(u => ({ email: u.email, name: u.full_name })),
  })
}
