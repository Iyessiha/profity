// ============================================================
// PROFITYX — POST /api/push/send
// Envoie une notification push web-push (VAPID)
// Utilisé par le module calendrier quand une annonce approche
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import webpush                       from 'web-push'

// Configurer web-push avec les clés VAPID
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL ?? 'monweci@gmail.com'}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

interface PushPayload {
  title:   string
  body:    string
  url?:    string
  impact?: string
  country?:string
  tag?:    string
}

export async function POST(req: NextRequest) {
  // Vérifier le secret interne (appelé par cron ou le module calendrier)
  const secret = req.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body: {
    user_id?:   string          // Si absent → broadcast à tous
    plan_filter?: string[]       // ex: ['pro','elite'] → seulement ces plans
    payload:    PushPayload
  } = await req.json()

  const { user_id, plan_filter, payload } = body

  if (!payload?.title) {
    return NextResponse.json({ error: 'Payload manquant' }, { status: 400 })
  }

  // ── Récupérer les subscriptions cibles ──────────────────
  let query = supabaseAdmin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth_key, user_id')
    .eq('active', true)

  if (user_id) {
    query = query.eq('user_id', user_id)
  } else if (plan_filter && plan_filter.length > 0) {
    // Filtrer par plan via join profiles
    const { data: users } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .in('user_plan', plan_filter)

    const ids = (users ?? []).map(u => u.id)
    if (ids.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'Aucun user éligible' })
    }
    query = query.in('user_id', ids)
  }

  const { data: subs, error: fetchErr } = await query

  if (fetchErr || !subs?.length) {
    return NextResponse.json({ success: true, sent: 0 })
  }

  // ── Envoyer les notifications ────────────────────────────
  const notifPayload = JSON.stringify(payload)
  let sent = 0, failed = 0

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys:     { p256dh: sub.p256dh, auth: sub.auth_key },
          },
          notifPayload,
          { TTL: 60 * 60 } // 1 heure de TTL
        )
        sent++
      } catch (err: unknown) {
        failed++
        // Subscription expirée → désactiver
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          await supabaseAdmin
            .from('push_subscriptions')
            .update({ active: false })
            .eq('endpoint', sub.endpoint)
        }
        console.warn('[Push] Erreur envoi:', sub.endpoint, status)
      }
    })
  )

  console.log(`[Push] Envoyé: ${sent}, Échec: ${failed}`)
  return NextResponse.json({ success: true, sent, failed })
}
