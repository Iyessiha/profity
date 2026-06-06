// ============================================================
// PROFITYX — /api/credits  (GET balance + historique)
//                          (POST achat pack)
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = () => createClient(
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

// GET — solde + historique + packs disponibles
export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })

  const admin = sb()

  const [{ data: credits }, { data: txs }, { data: packs }] = await Promise.all([
    admin.from('credits').select('*').eq('user_id', user.id).single(),
    admin.from('credit_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    admin.from('credit_packs').select('*').eq('is_active', true).order('sort_order'),
  ])

  return NextResponse.json({
    success: true,
    balance:  credits?.balance ?? 0,
    earned:   credits?.total_earned ?? 0,
    spent:    credits?.total_spent ?? 0,
    transactions: txs ?? [],
    packs: packs ?? [],
  })
}

// POST — initier l'achat d'un pack
export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { pack_id } = body

  if (!pack_id) return NextResponse.json({ success: false, error: 'pack_id requis' }, { status: 400 })

  const admin = sb()

  // Récupérer le pack
  const { data: pack } = await admin.from('credit_packs').select('*').eq('id', pack_id).single()
  if (!pack) return NextResponse.json({ success: false, error: 'Pack introuvable' }, { status: 404 })

  // Récupérer le profil
  const { data: profile } = await admin.from('profiles').select('email,full_name,phone,currency,public_id').eq('id', user.id).single()

  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'https://profity-x.com'
  const currency = (profile?.currency as string) || 'XOF'
  const amount   = currency === 'XOF' ? pack.price_xof : Math.round((pack.price_usd ?? pack.price_xof / 620) * 100) / 100
  const pid      = profile?.public_id ?? 'INCONNU'

  // Appel Edge Function GeniusPay
  const EDGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/payment-proxy`
  const txId = `CR-${pid}-${pack.credits}C-${Date.now()}`

  try {
    const edgeRes = await fetch(EDGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''}` },
      body: JSON.stringify({
        planKey:       `credits_${pack.credits}`,
        amount,
        currency,
        customerName:  profile?.full_name ?? 'Utilisateur',
        customerEmail: profile?.email ?? user.email ?? '',
        customerPhone: (profile?.phone as string) ?? '+2250000000000',
        userId:        user.id,
        transactionId: txId,
        successUrl:    `${appUrl}/dashboard?credits=success&pack=${pack.credits}`,
        errorUrl:      `${appUrl}/pricing?credits=cancelled`,
      }),
    })
    const edgeJson = await edgeRes.json()

    if (edgeJson.success && edgeJson.redirectUrl) {
      return NextResponse.json({ success: true, redirectUrl: edgeJson.redirectUrl, txId, pack })
    }
  } catch {}

  // Fallback WhatsApp
  const msg = encodeURIComponent(`Bonjour ProfityX 👋\n\nJe souhaite acheter le pack de ${pack.credits} crédits (${pack.price_xof.toLocaleString('fr-FR')} FCFA).\n\n🆔 Mon identifiant : ${pid}\n📧 Email : ${profile?.email ?? user.email}\n\nMerci !`)
  return NextResponse.json({
    success: true,
    redirectUrl: `https://wa.me/+2250500446464?text=${msg}`,
    fallback: true,
    txId, pack,
  })
}
