// ============================================================
// PROFITYX — GET /api/admin/export?type=X&format=csv|json
// Export des données admin (users, subs, crédits, trésorerie)
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

async function getAdminUser(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  const anon  = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key')
  const { data: { user } } = await anon.auth.getUser(token)
  if (!user) return null
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key')
  const { data: prof } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  return prof?.is_admin ? user : null
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const escape  = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
  ].join('\n')
}

export async function GET(req: NextRequest) {
  const user = await getAdminUser(req)
  if (!user) return NextResponse.json({ error: 'Admin requis' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const type   = searchParams.get('type') ?? 'users'
  const format = searchParams.get('format') ?? 'csv'

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  let data: Record<string, unknown>[] = []
  let filename = `profityx_${type}_${new Date().toISOString().slice(0, 10)}`

  switch (type) {

    // ── Utilisateurs ──────────────────────────────────────
    case 'users': {
      const { data: rows } = await admin
        .from('profiles')
        .select('public_id, email, full_name, user_plan, is_admin, suspended, country, locale, currency, trading_type, preferred_broker, risk_level, analyses_used, last_analysis_at, current_streak, total_xp, created_at')
        .order('created_at', { ascending: false })
      data = (rows ?? []).map(r => ({
        ID_Public:      r.public_id,
        Email:          r.email,
        Nom:            r.full_name ?? '',
        Plan:           r.user_plan,
        Admin:          r.is_admin ? 'Oui' : 'Non',
        Suspendu:       r.suspended ? 'Oui' : 'Non',
        Pays:           r.country ?? '',
        Langue:         r.locale ?? 'fr',
        Devise:         r.currency ?? 'XOF',
        Type_Trading:   r.trading_type ?? '',
        Broker:         r.preferred_broker ?? '',
        Risque:         r.risk_level ?? '',
        Analyses_Total: r.analyses_used ?? 0,
        Derniere_Analyse: r.last_analysis_at ?? '',
        Streak:         r.current_streak ?? 0,
        XP_Total:       r.total_xp ?? 0,
        Inscription:    r.created_at,
      }))
      filename = `profityx_utilisateurs_${new Date().toISOString().slice(0, 10)}`
      break
    }

    // ── Abonnements ───────────────────────────────────────
    case 'subscriptions': {
      const { data: rows } = await admin
        .from('subscriptions')
        .select('user_id, plan, status, amount, currency, paygenius_id, current_period_start, current_period_end, auto_renew, cancelled_at, created_at')
        .order('created_at', { ascending: false })
      // Enrichir avec email
      const { data: profs } = await admin.from('profiles').select('id, email, public_id')
      const profMap = Object.fromEntries((profs ?? []).map(p => [p.id, p]))
      data = (rows ?? []).map(r => ({
        User_ID:          profMap[r.user_id]?.public_id ?? r.user_id,
        Email:            profMap[r.user_id]?.email ?? '',
        Plan:             r.plan,
        Statut:           r.status,
        Montant_FCFA:     r.amount,
        Devise:           r.currency,
        Ref_Paiement:     r.paygenius_id ?? '',
        Debut_Periode:    r.current_period_start ?? '',
        Fin_Periode:      r.current_period_end ?? '',
        Renouvellement:   r.auto_renew ? 'Auto' : 'Manuel',
        Date_Annulation:  r.cancelled_at ?? '',
        Date_Creation:    r.created_at,
      }))
      filename = `profityx_abonnements_${new Date().toISOString().slice(0, 10)}`
      break
    }

    // ── Transactions crédits ──────────────────────────────
    case 'credits': {
      const { data: rows } = await admin
        .from('credit_transactions')
        .select('user_id, amount, type, description, ref, created_at')
        .order('created_at', { ascending: false })
        .limit(5000)
      const { data: profs } = await admin.from('profiles').select('id, email, public_id')
      const profMap = Object.fromEntries((profs ?? []).map(p => [p.id, p]))
      data = (rows ?? []).map(r => ({
        User_ID:    profMap[r.user_id]?.public_id ?? r.user_id,
        Email:      profMap[r.user_id]?.email ?? '',
        Montant:    r.amount,
        Sens:       r.amount > 0 ? 'Crédit' : 'Débit',
        Type:       r.type,
        Description:r.description ?? '',
        Reference:  r.ref ?? '',
        Date:       r.created_at,
        Cout_USD:   r.amount < 0 ? Math.abs(r.amount) * 0.01 : 0,
        Cout_FCFA:  r.amount < 0 ? Math.abs(r.amount) * 6.2 : 0,
      }))
      filename = `profityx_credits_${new Date().toISOString().slice(0, 10)}`
      break
    }

    // ── Analyses charts ───────────────────────────────────
    case 'analyses': {
      const { data: rows } = await admin
        .from('chart_analyses')
        .select('user_id, pair, timeframe, direction, entry, stop_loss, tp1, tp2, tp3, rr_ratio, locale, created_at')
        .order('created_at', { ascending: false })
        .limit(5000)
      const { data: profs } = await admin.from('profiles').select('id, email, public_id')
      const profMap = Object.fromEntries((profs ?? []).map(p => [p.id, p]))
      data = (rows ?? []).map(r => ({
        User_ID:   profMap[r.user_id]?.public_id ?? r.user_id,
        Email:     profMap[r.user_id]?.email ?? '',
        Paire:     r.pair,
        Timeframe: r.timeframe,
        Direction: r.direction,
        Entree:    r.entry,
        Stop_Loss: r.stop_loss,
        TP1:       r.tp1,
        TP2:       r.tp2 ?? '',
        TP3:       r.tp3 ?? '',
        RR:        r.rr_ratio,
        Langue:    r.locale ?? 'fr',
        Date:      r.created_at,
      }))
      filename = `profityx_analyses_${new Date().toISOString().slice(0, 10)}`
      break
    }

    // ── Rapport trésorerie ────────────────────────────────
    case 'treasury': {
      const [{ data: txs }, { data: subs }, { data: profs }, { data: creds }] = await Promise.all([
        admin.from('credit_transactions').select('type, amount, created_at'),
        admin.from('subscriptions').select('plan, status, amount'),
        admin.from('profiles').select('user_plan'),
        admin.from('credits').select('balance, total_spent, total_earned'),
      ])

      const txList   = (txs   ?? []) as Array<{type:string;amount:number;created_at:string}>
      const subList  = (subs  ?? []) as Array<{plan:string;status:string;amount:number}>
      const profList = (profs ?? []) as Array<{user_plan:string}>
      const credList = (creds ?? []) as Array<{balance:number;total_spent:number;total_earned:number}>

      const apiCalls     = txList.filter(t => ['analysis','news'].includes(t.type) && t.amount < 0).length
      const thisMonth    = new Date(new Date().setDate(1)).toISOString()
      const apiCallsM    = txList.filter(t => ['analysis','news'].includes(t.type) && t.amount < 0 && t.created_at >= thisMonth).length
      const activeSubs   = subList.filter(s => s.status === 'active')
      const mrrXof       = activeSubs.reduce((a, s) => a + (s.amount || 0), 0)

      data = [{
        Date_Export:             new Date().toISOString(),
        Total_Users:             profList.length,
        Free_Users:              profList.filter(p => p.user_plan === 'free').length,
        Pro_Users:               profList.filter(p => p.user_plan === 'pro').length,
        Elite_Users:             profList.filter(p => p.user_plan === 'elite').length,
        Abonnements_Actifs:      activeSubs.length,
        MRR_FCFA:                mrrXof,
        ARR_FCFA:                mrrXof * 12,
        Total_Appels_Anthropic:  apiCalls,
        Appels_Ce_Mois:          apiCallsM,
        Cout_Total_USD:          (apiCalls * 0.01).toFixed(2),
        Cout_Total_FCFA:         Math.round(apiCalls * 6.2),
        Cout_Mois_USD:           (apiCallsM * 0.01).toFixed(2),
        Cout_Mois_FCFA:          Math.round(apiCallsM * 6.2),
        Marge_Nette_FCFA:        mrrXof - Math.round(apiCallsM * 6.2),
        Credits_Emis:            credList.reduce((a, c) => a + (c.total_earned || 0), 0),
        Credits_Consommes:       credList.reduce((a, c) => a + (c.total_spent || 0), 0),
        Credits_Solde_Total:     credList.reduce((a, c) => a + (c.balance || 0), 0),
        Coût_Par_Appel_USD:      0.01,
        Coût_Par_Appel_FCFA:     6.2,
      }]
      filename = `profityx_tresorerie_${new Date().toISOString().slice(0, 10)}`
      break
    }

    default:
      return NextResponse.json({ error: `Type '${type}' inconnu. Types: users, subscriptions, credits, analyses, treasury` }, { status: 400 })
  }

  // ── Générer la réponse ────────────────────────────────
  if (format === 'json') {
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}.json"`,
      },
    })
  }

  // CSV par défaut
  return new NextResponse(toCSV(data), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
    },
  })
}
