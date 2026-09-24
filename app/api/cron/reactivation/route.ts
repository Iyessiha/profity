// Cron hebdomadaire : email de réactivation pour inactifs > 7 jours
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import { isCronAuthorized } from '@/lib/internal-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error:'Unauthorized' }, { status:401 })
  }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key', { auth:{autoRefreshToken:false,persistSession:false} })

  // Utilisateurs inactifs depuis 7 jours (pas de connexion = last_active_date)
  const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0,10)
  const { data: inactifs } = await db
    .from('profiles')
    .select('email, full_name, credits(balance)')
    .lt('last_active_date', cutoff)
    .eq('suspended', false)
    .limit(50)

  if (!inactifs?.length) return NextResponse.json({ sent:0, message:'Aucun inactif' })

  let sent = 0
  for (const u of inactifs) {
    if (!u.email) continue
    const balance = (u.credits as { balance:number }[])?.[0]?.balance ?? 0
    const ok = await sendEmail({
      template: 'reactivation',
      to: u.email,
      name: (u.full_name as string)?.split(' ')[0] || 'Trader',
      data: { balance: String(balance) },
    })
    if (ok) sent++
    await new Promise(r => setTimeout(r, 200)) // Rate limit Brevo
  }

  return NextResponse.json({ sent, total: inactifs.length, timestamp: new Date().toISOString() })
}
