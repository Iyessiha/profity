// ============================================================
// PROFITYX — POST /api/auth/signup
// Inscription sans vérification email + welcome Brevo
// + séquence marketing automatique
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { sendEmail }                  from '@/lib/email'

export const dynamic = 'force-dynamic'

const SEQUENCE_DAYS = [0, 1, 3, 7, 14] // jours de la séquence

export async function POST(req: NextRequest) {
  const { email, password, name, ref_code, locale } = await req.json()
  if (!email || !password)
    return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // 1. Créer le compte
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,  // ← Auto-confirm, pas de vérification
    user_metadata: { full_name: name || email.split('@')[0], ref_code: ref_code || '', locale: locale || 'fr' },
  })

  if (createErr) {
    const msg = createErr.message.includes('already')
      ? 'Cet email est déjà utilisé.'
      : createErr.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const userId   = created.user.id
  const userName = name || email.split('@')[0]
  const now      = new Date()

  // 2. Créer la séquence marketing en DB
  const sequenceRows = SEQUENCE_DAYS.map(day => ({
    user_id:      userId,
    sequence_day: day,
    status:       'pending',
    scheduled_at: new Date(now.getTime() + day * 24 * 60 * 60 * 1000).toISOString(),
  }))

  await admin.from('email_sequences').insert(sequenceRows).select()

  // 3. Email de bienvenue immédiat (J0) via Brevo
  try {
    await sendEmail({ template: 'welcome', to: email, name: userName })
    // Marquer J0 comme envoyé
    await admin.from('email_sequences')
      .update({ status: 'sent', sent_at: now.toISOString() })
      .eq('user_id', userId).eq('sequence_day', 0)
  } catch {}

  // 4. Connexion automatique pour récupérer le token
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'
  )
  const { data: signIn, error: signInErr } = await anon.auth.signInWithPassword({ email, password })

  if (signInErr || !signIn.session)
    return NextResponse.json({ error: 'Compte créé mais connexion échouée — connectez-vous manuellement.' }, { status: 500 })

  return NextResponse.json({
    success: true,
    access_token:  signIn.session.access_token,
    refresh_token: signIn.session.refresh_token,
    user_id: userId,
  })
}
