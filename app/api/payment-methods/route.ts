// ============================================================
// PROFITYX — /api/payment-methods
// GET : liste · POST : ajouter · DELETE : retirer · PATCH : défaut/récurrence
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function getUser(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: { user } } = await anon.auth.getUser(token)
  return user
}

const TYPES = ['orange_money', 'mtn', 'moov', 'wave', 'card']

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
  const { data, error } = await admin.from('payment_methods').select('*').eq('user_id', user.id).order('created_at')
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data: data ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const type = String(body.type ?? '')
  const number = String(body.number ?? '').replace(/\s/g, '')

  if (!TYPES.includes(type)) return NextResponse.json({ success: false, error: 'Type invalide' }, { status: 400 })
  if (type !== 'card' && !/^\+?\d{8,15}$/.test(number)) {
    return NextResponse.json({ success: false, error: 'Numéro invalide' }, { status: 400 })
  }

  const masked = type === 'card'
    ? `Carte ****${number.slice(-4)}`
    : `${labelFor(type)} ****${number.slice(-4)}`

  // Le premier moyen ajouté devient le défaut
  const { count } = await admin.from('payment_methods').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
  const isFirst = (count ?? 0) === 0

  const { data, error } = await admin.from('payment_methods').insert({
    user_id: user.id, type, label: masked,
    details: { last4: number.slice(-4) },
    is_default: isFirst,
  }).select('*').single()

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}

export async function DELETE(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ success: false, error: 'ID manquant' }, { status: 400 })
  const { error } = await admin.from('payment_methods').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
  const body = await req.json().catch(() => ({}))

  // Définir un moyen par défaut
  if (body.set_default) {
    await admin.from('payment_methods').update({ is_default: false }).eq('user_id', user.id)
    await admin.from('payment_methods').update({ is_default: true }).eq('id', body.set_default).eq('user_id', user.id)
    return NextResponse.json({ success: true })
  }

  // Activer/désactiver le renouvellement automatique
  if (typeof body.auto_renew === 'boolean') {
    await admin.from('subscriptions').update({ auto_renew: body.auto_renew }).eq('user_id', user.id)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ success: false, error: 'Action inconnue' }, { status: 400 })
}

function labelFor(type: string): string {
  return { orange_money: 'Orange Money', mtn: 'MTN MoMo', moov: 'Moov Money', wave: 'Wave', card: 'Carte' }[type] ?? type
}
