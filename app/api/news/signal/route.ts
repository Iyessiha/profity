// ============================================================
// PROFITYX — POST /api/news/signal
// Reçoit les données d'une annonce économique,
// Claude interprète et génère un signal de trading
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { getNewsPrompt }             from '@/lib/prompts'
import { parseClaudeJSON, validateNewsSignal } from '@/lib/parser'
import {

  checkAndConsumeNewsQuota,
  saveNewsSignal,
} from '@/lib/supabase'
import type { ApiResponse, NewsSignal } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // ----------------------------------------------------------
  // 1. Authentification
  // ----------------------------------------------------------
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Non authentifié', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Token invalide', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  // ----------------------------------------------------------
  // 2. Vérifier le quota
  // ----------------------------------------------------------
  const hasQuota = await checkAndConsumeNewsQuota(user.id)
  if (!hasQuota) {
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: 'Quota de signaux news épuisé. Passez au plan Pro.',
        code: 'QUOTA_EXCEEDED'
      },
      { status: 429 }
    )
  }

  // ----------------------------------------------------------
  // 3. Récupérer les données de l'annonce
  // ----------------------------------------------------------
  let body: {
    event_title: string
    country:     string
    impact:      string
    actual:      string
    forecast:    string
    previous:    string
    locale?:     string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Corps de requête invalide', code: 'AI_ERROR' },
      { status: 400 }
    )
  }

  const { event_title, country, impact, actual, forecast, previous } = body
  const locale = body.locale ?? 'fr'

  if (!event_title || !country) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Données manquantes : event_title et country requis' },
      { status: 400 }
    )
  }

  // ----------------------------------------------------------
  // 3b. Prix spot live (Frankfurter API)
  // ----------------------------------------------------------
  const spotPrices = await (async () => {
    const lines: string[] = []

    // 1. FOREX — Frankfurter (ECB, gratuit, sans clé)
    try {
      const res = await fetch(
        'https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,JPY,CAD,AUD,CHF,NZD,SEK,NOK,DKK,MXN,SGD,HKD,TRY,ZAR',
        { signal: AbortSignal.timeout(4000) }
      )
      if (res.ok) {
        const d = await res.json()
        const r = d.rates ?? {}
        const f4 = (n: number) => n.toFixed(4)
        const f2 = (n: number) => n.toFixed(2)
        if (r.EUR) lines.push(`EUR/USD=${f4(1/r.EUR)}`)
        if (r.GBP) lines.push(`GBP/USD=${f4(1/r.GBP)}`)
        if (r.JPY) lines.push(`USD/JPY=${f2(r.JPY)}`)
        if (r.CAD) lines.push(`USD/CAD=${f4(r.CAD)}`)
        if (r.AUD) lines.push(`AUD/USD=${f4(1/r.AUD)}`)
        if (r.CHF) lines.push(`USD/CHF=${f4(r.CHF)}`)
        if (r.NZD) lines.push(`NZD/USD=${f4(1/r.NZD)}`)
        if (r.SEK) lines.push(`USD/SEK=${f4(r.SEK)}`)
        if (r.NOK) lines.push(`USD/NOK=${f4(r.NOK)}`)
        if (r.MXN) lines.push(`USD/MXN=${f2(r.MXN)}`)
        if (r.SGD) lines.push(`USD/SGD=${f4(r.SGD)}`)
        if (r.TRY) lines.push(`USD/TRY=${f4(r.TRY)}`)
        if (r.ZAR) lines.push(`USD/ZAR=${f2(r.ZAR)}`)
      }
    } catch {}

    // 2. MÉTAUX — Gold Price API (gratuit, sans clé)
    try {
      const gRes = await fetch(
        'https://api.frankfurter.app/latest?from=XAU&to=USD',
        { signal: AbortSignal.timeout(3000) }
      )
      if (gRes.ok) {
        const gd = await gRes.json()
        const goldUSD = gd?.rates?.USD
        if (goldUSD) lines.push(`XAU/USD=${Number(goldUSD).toFixed(2)}`)
      }
    } catch {
      // Fallback : essayer metals.live
      try {
        const g2 = await fetch('https://api.metals.live/v1/spot', { signal: AbortSignal.timeout(2000) })
        if (g2.ok) {
          const md = await g2.json()
          if (md?.gold)   lines.push(`XAU/USD=${Number(md.gold).toFixed(2)}`)
          if (md?.silver) lines.push(`XAG/USD=${Number(md.silver).toFixed(2)}`)
        }
      } catch {}
    }

    // 3. CRYPTO — CoinGecko (gratuit, sans clé, 60 req/min)
    try {
      const cgRes = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana,ripple&vs_currencies=usd&precision=2',
        { signal: AbortSignal.timeout(4000) }
      )
      if (cgRes.ok) {
        const cg = await cgRes.json()
        if (cg?.bitcoin?.usd)     lines.push(`BTC/USD=${Number(cg.bitcoin.usd).toFixed(2)}`)
        if (cg?.ethereum?.usd)    lines.push(`ETH/USD=${Number(cg.ethereum.usd).toFixed(2)}`)
        if (cg?.binancecoin?.usd) lines.push(`BNB/USD=${Number(cg.binancecoin.usd).toFixed(2)}`)
        if (cg?.solana?.usd)      lines.push(`SOL/USD=${Number(cg.solana.usd).toFixed(2)}`)
        if (cg?.ripple?.usd)      lines.push(`XRP/USD=${Number(cg.ripple.usd).toFixed(4)}`)
      }
    } catch {}

    return lines.join(' | ')
  })()

  const spotNote = spotPrices
    ? `\nPrix spot ACTUELS (live, ${new Date().toUTCString()}) :\n${spotPrices}\n⚠️ OBLIGATOIRE : utilise ces prix réels pour entry/SL/TP. Toute valeur doit être cohérente avec ces niveaux actuels.\nNOTE : indices synthétiques (BOOM, CRASH, JUMP, VOL, STEP) non listés → lis le prix directement sur le chart.`
    : `\nATTENTION : prix live indisponibles. Génère des niveaux approximatifs basés sur ta connaissance récente du marché, et précise dans la conclusion que l'utilisateur doit vérifier les prix actuels.`

  // ----------------------------------------------------------
  // 4. Construire le message utilisateur
  // ----------------------------------------------------------
  const userMessages: Record<string, string> = {
    fr: `Annonce économique :
Événement  : ${event_title}
Pays/Devise: ${country}
Impact     : ${impact}
Résultat   : ${actual}
Prévision  : ${forecast ?? 'N/A'}
Précédent  : ${previous ?? 'N/A'}

Interprète cette annonce et génère le signal JSON.${spotNote}`,

    en: `Economic release:
Event    : ${event_title}
Currency : ${country}
Impact   : ${impact}
Actual   : ${actual}
Forecast : ${forecast ?? 'N/A'}
Previous : ${previous ?? 'N/A'}

Interpret this release and generate the JSON signal.${spotNote}`,

    ar: `بيانات اقتصادية:
الحدث     : ${event_title}
العملة    : ${country}
التأثير   : ${impact}
الفعلي    : ${actual}
التوقعات  : ${forecast ?? 'غير متاح'}
السابق    : ${previous ?? 'غير متاح'}

فسّر هذه البيانات وولّد إشارة JSON.`,

    pt: `Dado económico:
Evento    : ${event_title}
Moeda     : ${country}
Impacto   : ${impact}
Real      : ${actual}
Previsão  : ${forecast ?? 'N/A'}
Anterior  : ${previous ?? 'N/A'}

Interprete este dado e gere o sinal JSON.`,
  }

  const userMessage = userMessages[locale] ?? userMessages['fr']

  // ----------------------------------------------------------
  // 5. Appel Claude
  // ----------------------------------------------------------
  let rawText: string
  try {
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 800,
        system:     getNewsPrompt(locale),
        messages: [
          { role: 'user', content: userMessage }
        ],
      }),
    })

    if (!claudeResponse.ok) {
      const errBody = await claudeResponse.text()
      console.error('[Claude API] News signal error:', errBody)
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Erreur IA — réessayez', code: 'AI_ERROR' },
        { status: 502 }
      )
    }

    const claudeData = await claudeResponse.json()
    rawText = claudeData.content?.[0]?.text ?? ''

  } catch (err) {
    console.error('[Claude API] Exception news:', err)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Connexion IA impossible', code: 'AI_ERROR' },
      { status: 502 }
    )
  }

  // ----------------------------------------------------------
  // 6. Parser la réponse
  // ----------------------------------------------------------
  const parsed = parseClaudeJSON<Record<string, unknown>>(rawText)
  if (!parsed) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Réponse IA invalide', code: 'AI_ERROR' },
      { status: 422 }
    )
  }

  // Injecter les métadonnées de l'annonce dans le résultat
  parsed['event_title'] = event_title
  parsed['country']     = country

  const signal = validateNewsSignal(parsed)
  if (!signal) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Signal news invalide', code: 'AI_ERROR' },
      { status: 422 }
    )
  }

  // ----------------------------------------------------------
  // 7. Sauvegarder
  // ----------------------------------------------------------
  await saveNewsSignal({
    userId:         user.id,
    eventTitle:     event_title,
    country,
    impact,
    actual,
    forecast:       forecast ?? '',
    previous:       previous ?? '',
    direction:      signal.direction,
    pairCible:      signal.pair_cible,
    entry:          signal.entry,
    stopLoss:       signal.stop_loss,
    tp1:            signal.tp1,
    tp2:            signal.tp2,
    tp3:            signal.tp3,
    rrRatio:        signal.rr_ratio,
    interpretation: signal.interpretation,
    rawSignal:      rawText,
    locale,
  })

  // ----------------------------------------------------------
  // 8. Retourner le signal
  // ----------------------------------------------------------
  return NextResponse.json<ApiResponse<NewsSignal>>(
    { success: true, data: signal },
    { status: 200 }
  )
}
