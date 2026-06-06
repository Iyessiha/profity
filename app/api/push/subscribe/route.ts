// ============================================================
// PROFITYX — POST /api/push/subscribe
// Enregistre la PushSubscription en base Supabase
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  // Auth
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await anonClient.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

  const body = await req.json()
  const { subscription, user_agent, platform } = body

  if (!subscription?.endpoint) {
    return NextResponse.json({ error: 'Subscription invalide' }, { status: 400 })
  }

  // Upsert — un seul enregistrement par endpoint
  const { error } = await supabaseAdmin
    .from('push_subscriptions')
    .upsert({
      user_id:    user.id,
      endpoint:   subscription.endpoint,
      p256dh:     subscription.keys?.p256dh,
      auth_key:   subscription.keys?.auth,
      user_agent: user_agent ?? null,
      platform:   platform   ?? null,
      active:     true,
      created_at: new Date().toISOString(),
    }, { onConflict: 'endpoint' })

  if (error) {
    console.error('[Push] Erreur sauvegarde subscription:', error)
    return NextResponse.json({ error: 'Erreur DB' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
