// GET /api/payment/paystack/verify?reference=PX-xxx
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key')
  const { data: { user } } = await anon.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

  const ref = req.nextUrl.searchParams.get('reference')
  if (!ref || !/^[A-Za-z0-9_-]{1,100}$/.test(ref))
    return NextResponse.json({ error: 'reference invalide' }, { status: 400 })

  // Seul le propriétaire de la transaction peut la consulter
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key', { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: tx } = await admin.from('payment_transactions').select('user_id').eq('geniuspay_ref', ref).single()
  if (!tx || tx.user_id !== user.id) return NextResponse.json({ error: 'Transaction introuvable' }, { status: 404 })

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  })
  const json = await res.json()
  // Ne renvoyer que le nécessaire (pas les données client complètes)
  return NextResponse.json({
    status: json.status,
    data: {
      status: json.data?.status, reference: json.data?.reference, amount: json.data?.amount, currency: json.data?.currency,
      metadata: { plan: json.data?.metadata?.plan },
    },
  })
}
