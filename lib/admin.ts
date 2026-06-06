// ============================================================
// PROFITYX — lib/admin.ts
// Vérification des droits admin côté serveur
// ============================================================
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ─── Vérifier si une requête vient d'un admin ─────────────
export async function requireAdmin(req: NextRequest): Promise<{
  ok: boolean
  userId?: string
  error?: NextResponse
}> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return {
      ok: false,
      error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }),
    }
  }

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: { user }, error: authErr } = await anonClient.auth.getUser(token)
  if (authErr || !user) {
    return {
      ok: false,
      error: NextResponse.json({ error: 'Token invalide' }, { status: 401 }),
    }
  }

  // Vérifier is_admin
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return {
      ok: false,
      error: NextResponse.json({ error: 'Accès refusé — droits admin requis' }, { status: 403 }),
    }
  }

  return { ok: true, userId: user.id }
}

// ─── Logger une action admin ──────────────────────────────
export async function logAdminAction(params: {
  adminId:    string
  action:     string
  targetType?: string
  targetId?:  string
  details?:   Record<string, unknown>
  ipAddress?: string
}) {
  await supabaseAdmin.from('admin_logs').insert({
    admin_id:    params.adminId,
    action:      params.action,
    target_type: params.targetType,
    target_id:   params.targetId,
    details:     params.details,
    ip_address:  params.ipAddress,
  })
}

export { supabaseAdmin }
