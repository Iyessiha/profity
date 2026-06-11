// ============================================================
// PROFITYX — POST /api/admin/broadcast
// Envoie une notification push à tous les users (ou par plan)
// ============================================================
import { NextRequest, NextResponse }       from 'next/server'
import { requireAdmin, supabaseAdmin, logAdminAction } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.error!

  const body: {
    title:        string
    body:         string
    target_plans: string[]
    url?:         string
  } = await req.json()

  const { title, body: msgBody, target_plans, url } = body

  if (!title || !msgBody) {
    return NextResponse.json({ success: false, error: 'title et body requis' }, { status: 400 })
  }

  // Sauvegarder le broadcast en DB
  const { data: broadcast, error: dbErr } = await supabaseAdmin
    .from('broadcast_messages')
    .insert({
      admin_id:     auth.userId,
      title,
      body:         msgBody,
      target_plans: target_plans ?? ['free','pro','elite'],
      status:       'pending',
    })
    .select('id')
    .single()

  if (dbErr) {
    return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 })
  }

  // Envoyer via l'API push interne
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://profity-x.com'

  const res = await fetch(`${appUrl}/api/push/send`, {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-internal-secret': process.env.INTERNAL_SECRET ?? '',
    },
    body: JSON.stringify({
      plan_filter: target_plans,
      payload: {
        title,
        body:   msgBody,
        url:    url ?? '/dashboard',
        impact: 'High',
        tag:    `broadcast-${broadcast.id}`,
      },
    }),
  })

  const sendResult = res.ok ? await res.json() : { sent: 0, failed: 0 }

  // Mettre à jour le statut
  await supabaseAdmin
    .from('broadcast_messages')
    .update({
      status:     res.ok ? 'sent' : 'failed',
      sent_count: sendResult.sent ?? 0,
    })
    .eq('id', broadcast.id)

  await logAdminAction({
    adminId:    auth.userId!,
    action:     'broadcast',
    targetType: 'broadcast',
    targetId:   broadcast.id,
    details:    { title, plans: target_plans, sent: sendResult.sent },
  })

  return NextResponse.json({
    success:   true,
    broadcast_id: broadcast.id,
    sent:      sendResult.sent ?? 0,
    failed:    sendResult.failed ?? 0,
  })
}

// ─── GET : historique des broadcasts ──────────────────────
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.error!

  const { data } = await supabaseAdmin
    .from('broadcast_messages')
    .select('*, profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ success: true, data })
}
