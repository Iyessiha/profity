// ============================================================
// PROFITYX — GET /api/admin/payment-test
// Diagnostic GeniusPay — réservé admin
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  // Auth admin uniquement
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await sb.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: prof } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!prof?.is_admin) return NextResponse.json({ error: 'Admin requis' }, { status: 403 })

  const apiKey = process.env.GENIUSPAY_API_KEY ?? ''
  const secret = process.env.GENIUSPAY_SECRET ?? ''

  const result: Record<string, unknown> = {
    env: {
      GENIUSPAY_API_KEY:        apiKey ? `✅ Définie (${apiKey.slice(0, 8)}...)` : '❌ MANQUANTE',
      GENIUSPAY_SECRET:         secret ? `✅ Définie (${secret.slice(0, 6)}...)` : '❌ MANQUANTE',
      GENIUSPAY_WEBHOOK_SECRET: process.env.GENIUSPAY_WEBHOOK_SECRET ? '✅ Définie' : '❌ MANQUANTE',
      APP_URL:                  process.env.NEXT_PUBLIC_APP_URL ?? 'NON DÉFINIE',
    }
  }

  if (!apiKey || !secret) {
    result.status = 'ERREUR — Clés GeniusPay manquantes dans Vercel'
    return NextResponse.json(result)
  }

  // Test réel de l'API GeniusPay
  try {
    const res = await fetch('https://geniuspay.ci/api/v1/merchant/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key':    apiKey,
        'X-API-Secret': secret,
      },
      body: JSON.stringify({
        amount: 100,
        currency: 'XOF',
        description: 'Test ProfityX',
        customer: { name: 'Test', email: 'test@profityx.app', phone: '+2250000000000', country: 'CI' },
        success_url: 'https://profity-alpha.vercel.app/dashboard',
        error_url:   'https://profity-alpha.vercel.app/pricing',
        metadata: { user_id: 'test', plan_key: 'pro', app: 'profityx' },
      }),
    })

    const text = await res.text()
    let body: unknown
    try { body = JSON.parse(text) } catch { body = text }

    result.geniuspay_test = {
      http_status: res.status,
      http_ok:     res.ok,
      response:    body,
    }

    if (res.ok) {
      result.status = '✅ GeniusPay OK — paiements opérationnels'
      result.checkout_url = (body as Record<string, Record<string, string>>)?.data?.checkout_url ?? null
    } else {
      result.status = `❌ GeniusPay erreur ${res.status}`
      result.fix = res.status === 403
        ? 'Allez dans votre compte GeniusPay → Paramètres → Domaines autorisés → Ajouter : profity-alpha.vercel.app'
        : res.status === 401
          ? 'Les clés API sont invalides — vérifiez GENIUSPAY_API_KEY et GENIUSPAY_SECRET dans Vercel'
          : 'Erreur inattendue — contactez le support GeniusPay'
    }
  } catch (err) {
    result.status    = '❌ Impossible de joindre GeniusPay'
    result.error     = err instanceof Error ? err.message : String(err)
  }

  return NextResponse.json(result, { status: 200 })
}
