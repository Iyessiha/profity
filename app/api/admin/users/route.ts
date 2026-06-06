// ============================================================
// PROFITYX — /api/admin/users
// GET  → liste paginée des users
// PUT  → créer un nouvel utilisateur
// POST → actions sur un user (upgrade, downgrade, suspend, etc.)
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, supabaseAdmin, logAdminAction } from '@/lib/admin'

const PLAN_AMOUNTS: Record<string, number> = { free: 0, pro: 17500, elite: 35000 }

// ─── GET : liste des utilisateurs ─────────────────────────
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.error!

  const { searchParams } = new URL(req.url)
  const page   = parseInt(searchParams.get('page')  ?? '1')
  const limit  = parseInt(searchParams.get('limit') ?? '20')
  const search = searchParams.get('search') ?? ''
  const plan   = searchParams.get('plan')   ?? ''
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('profiles')
    .select(`
      id, public_id, full_name, email, user_plan, is_admin, suspended,
      analyses_used, news_used, locale, currency,
      notifications_push, created_at, updated_at,
      subscriptions(status, amount, current_period_end)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  if (plan && plan !== 'all') query = query.eq('user_plan', plan)

  const { data: users, count, error } = await query
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    data: users,
    meta: { total: count ?? 0, page, limit, total_pages: Math.ceil((count ?? 0) / limit) },
  })
}

// ─── PUT : créer un nouvel utilisateur ────────────────────
export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.error!

  const body = await req.json()
  const { email, password, full_name, user_plan = 'free', is_admin = false } = body

  if (!email || !password) {
    return NextResponse.json({ success: false, error: 'Email et mot de passe requis' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ success: false, error: 'Mot de passe : minimum 8 caractères' }, { status: 400 })
  }

  // Créer le compte via l'API admin (email auto-confirmé)
  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name || email.split('@')[0], user_plan, is_admin },
  })

  if (createErr || !created.user) {
    const msg = createErr?.message ?? 'Échec création'
    const hint = msg.includes('already registered') || msg.includes('already exists')
      ? `L'email ${email} est déjà utilisé.`
      : msg.includes('service_role') || msg.includes('JWT')
        ? 'Clé SUPABASE_SERVICE_ROLE_KEY manquante — vérifiez les variables Vercel.'
        : msg
    return NextResponse.json({ success: false, error: hint }, { status: 400 })
  }

  const userId = created.user.id

  // Corriger les tokens null (GoTrue crash si null) + mettre à jour le profil
  await supabaseAdmin.from('profiles')
    .update({ email, full_name: full_name || email.split('@')[0], user_plan, is_admin })
    .eq('id', userId)

  // Forcer les tokens vides (évite le bug de connexion signalé précédemment)
  await supabaseAdmin.rpc('fix_user_tokens' as never, { uid: userId }).catch(() => {})

  await logAdminAction({
    adminId: auth.userId!, action: 'create_user', targetType: 'user', targetId: userId,
    details: { email, user_plan, is_admin },
    ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json({ success: true, message: `Compte ${email} créé`, data: { id: userId } })
}

// ─── POST : actions admin sur un user ─────────────────────
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.error!

  const body = await req.json()
  const { action, user_id, plan, full_name, new_password } = body

  if (!action || !user_id) {
    return NextResponse.json({ success: false, error: 'action et user_id requis' }, { status: 400 })
  }

  // Empêcher l'auto-modification dangereuse
  if (user_id === auth.userId && ['toggle_admin', 'suspend', 'delete'].includes(action)) {
    return NextResponse.json({ success: false, error: 'Action impossible sur votre propre compte' }, { status: 400 })
  }

  let result: string

  switch (action) {
    case 'upgrade': {
      const targetPlan = plan ?? 'pro'
      // Le trigger sync_subscription_on_plan_change s'occupe de l'abonnement automatiquement
      await supabaseAdmin.from('profiles').update({ user_plan: targetPlan }).eq('id', user_id)
      result = `Plan octroyé : ${targetPlan.toUpperCase()}`
      break
    }

    case 'downgrade': {
      // Le trigger annule automatiquement l'abonnement
      await supabaseAdmin.from('profiles').update({ user_plan: 'free' }).eq('id', user_id)
      result = 'Plan rétrogradé vers FREE'
      break
    }

    case 'suspend': {
      await supabaseAdmin.from('profiles').update({ suspended: true }).eq('id', user_id)
      // Bannir via Auth (bloque la connexion) — 100 ans
      await supabaseAdmin.auth.admin.updateUserById(user_id, { ban_duration: '876000h' })
      result = 'Compte suspendu'
      break
    }

    case 'reactivate': {
      await supabaseAdmin.from('profiles').update({ suspended: false }).eq('id', user_id)
      await supabaseAdmin.auth.admin.updateUserById(user_id, { ban_duration: 'none' })
      result = 'Compte réactivé'
      break
    }

    case 'toggle_admin': {
      const { data: current } = await supabaseAdmin.from('profiles').select('is_admin').eq('id', user_id).single()
      const newVal = !current?.is_admin
      await supabaseAdmin.from('profiles').update({ is_admin: newVal }).eq('id', user_id)
      result = `Droits admin ${newVal ? 'accordés' : 'révoqués'}`
      break
    }

    case 'reset_quota': {
      await supabaseAdmin.from('profiles').update({
        analyses_used: 0, news_used: 0,
        reset_at: new Date(Date.now() + 30 * 864e5).toISOString(),
      }).eq('id', user_id)
      result = 'Quota remis à zéro'
      break
    }

    case 'edit': {
      const updates: Record<string, unknown> = {}
      if (full_name) updates.full_name = full_name
      if (plan) updates.user_plan = plan
      if (Object.keys(updates).length > 0) {
        await supabaseAdmin.from('profiles').update(updates).eq('id', user_id)
      }
      if (new_password) {
        if (new_password.length < 8) {
          return NextResponse.json({ success: false, error: 'Mot de passe : minimum 8 caractères' }, { status: 400 })
        }
        await supabaseAdmin.auth.admin.updateUserById(user_id, { password: new_password })
      }
      result = 'Utilisateur modifié'
      break
    }

    case 'delete': {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id)
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 })
      result = 'Compte supprimé'
      break
    }

    default:
      return NextResponse.json({ success: false, error: 'Action inconnue' }, { status: 400 })
  }

  await logAdminAction({
    adminId: auth.userId!, action, targetType: 'user', targetId: user_id,
    details: { plan, result }, ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json({ success: true, message: result })
}
