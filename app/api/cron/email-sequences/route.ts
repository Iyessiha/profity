// ============================================================
// PROFITYX — GET /api/cron/email-sequences
// Cron quotidien : envoie les emails de séquence marketing
// Appelé par Vercel Cron (configuré dans vercel.json)
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { sendEmail }                  from '@/lib/email'

export const dynamic = 'force-dynamic'

const DAY_TEMPLATE: Record<number, string> = {
  1:  'seq_j1',
  3:  'seq_j3',
  7:  'seq_j7',
  14: 'seq_j14',
}

export async function GET(req: NextRequest) {
  // Sécurité : vérifier le secret Vercel Cron
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key'
  )

  // Récupérer les séquences en attente dont l'heure est arrivée
  const { data: pending } = await admin
    .from('email_sequences')
    .select(`
      id, user_id, sequence_day,
      profiles!inner(email, full_name, user_plan, analyses_used, locale)
    `)
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .neq('sequence_day', 0) // J0 envoyé au signup
    .limit(50)

  if (!pending || pending.length === 0)
    return NextResponse.json({ processed: 0, message: 'Rien à envoyer' })

  let sent = 0
  let skipped = 0

  for (const row of pending) {
    const prof    = row.profiles as { email:string; full_name:string; user_plan:string; analyses_used:number; locale:string }
    const day     = row.sequence_day
    const template = DAY_TEMPLATE[day]

    // Logique de skip : ne pas envoyer si déjà converti au bon moment
    let shouldSkip = false
    if (day === 1 && prof.analyses_used > 0) shouldSkip = true  // J1 : a déjà analysé
    if (day === 7 && prof.user_plan !== 'free') shouldSkip = true // J7 : déjà Pro/Elite
    if (day === 14 && prof.user_plan !== 'free') shouldSkip = true // J14 : déjà payant

    await admin.from('email_sequences').update({
      status:  shouldSkip ? 'skipped' : 'sent',
      sent_at: new Date().toISOString(),
    }).eq('id', row.id)

    if (shouldSkip) { skipped++; continue }
    if (!template)  { skipped++; continue }

    try {
      await sendEmail({
        template,
        to:   prof.email,
        name: prof.full_name ?? 'Trader',
      })
      sent++
    } catch (e) {
      console.error(`[cron] email failed for ${prof.email}:`, e)
    }
  }

  return NextResponse.json({
    processed: pending.length,
    sent,
    skipped,
    timestamp: new Date().toISOString(),
  })
}
