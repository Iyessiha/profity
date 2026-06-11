import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CREDIT_PACK_PRICES } from '@/lib/geniuspay'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const EDGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/payment-proxy`

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ success: false }, { status: 401 })

  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key')
  const { data: { user } } = await anon.auth.getUser(token)
  if (!user) return NextResponse.json({ success: false }, { status: 401 })

  const { packKey } = await req.json()
  const pack = CREDIT_PACK_PRICES[packKey]
  if (!pack) return NextResponse.json({ success: false, error: 'Pack invalide' }, { status: 400 })

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('email,full_name,phone,public_id').eq('id', user.id).single()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://profity-x.com'
  const email  = (profile?.email as string) ?? user.email ?? ''
  const name   = (profile?.full_name as string) ?? email.split('@')[0]
  const phone  = (profile?.phone as string) || '+2250000000000'
  const pid    = (profile?.public_id as string) ?? 'INCONNU'
  const txId   = `PX-PACK-${pid}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`

  try {
    const edgeRes = await fetch(EDGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        packKey, credits: pack.credits, amount: pack.amount,
        currency: 'XOF', label: pack.label, type: 'credit_pack',
        customerName: name, customerEmail: email, customerPhone: phone,
        userId: user.id, transactionId: txId,
        successUrl: `${appUrl}/pricing?credits=success&pack=${packKey}`,
        errorUrl:   `${appUrl}/pricing?credits=cancelled`,
      }),
    })
    const edgeJson = await edgeRes.json()
    if (edgeJson.success && edgeJson.redirectUrl) {
      return NextResponse.json({ success: true, redirectUrl: edgeJson.redirectUrl, gateway: 'geniuspay' })
    }
  } catch {}

  // Fallback WhatsApp
  const msg = encodeURIComponent(
    `Bonjour ProfityX 👋\n\nJe souhaite acheter le ${pack.label} — ${pack.amount.toLocaleString('fr-FR')} FCFA.\n\n🆔 Mon ID : ${pid}\n📧 Email : ${email}\n\nMerci !`
  )
  return NextResponse.json({
    success: true,
    redirectUrl: `https://wa.me/2250500446464?text=${msg}`,
    fallback: true, gateway: 'whatsapp',
  })
}
