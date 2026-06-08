import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { getBasicPrompt, getAdvancedPrompt, getElitePrompt, getScalpPrompt } from '@/lib/prompts'
import { parseClaudeJSON, validateChartSignal } from '@/lib/parser'
import { saveChartAnalysis }         from '@/lib/supabase'
import { rateLimit }                 from '@/lib/rate-limit'
import type { ApiResponse, ChartSignal } from '@/types'

const MAX_SIZE_MB = 4.5

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer '))
    return NextResponse.json<ApiResponse<null>>({ success:false, error:'Non authentifié', code:'UNAUTHORIZED' }, { status:401 })

  const token = authHeader.replace('Bearer ', '')
  const anon  = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data:{ user }, error:authErr } = await anon.auth.getUser(token)
  if (authErr || !user)
    return NextResponse.json<ApiResponse<null>>({ success:false, error:'Token invalide', code:'UNAUTHORIZED' }, { status:401 })

  // Rate limiting : max 10 analyses/min par utilisateur
  const rl = rateLimit(`analyze:${user.id}`, { limit:10, window:60 })
  if (!rl.ok) {
    return NextResponse.json({ success:false, error:'Trop de requêtes. Attendez 1 minute.', code:'RATE_LIMITED' }, { status:429 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth:{ autoRefreshToken:false, persistSession:false } }
  )

  // ── Utiliser 1 crédit (atomique) ──────────────────────────
  const { data:hasCredit, error:creditErr } = await admin.rpc('use_credit', {
    p_user_id: user.id,
    p_type:    'analysis',
    p_desc:    'Analyse de chart IA',
  })

  if (creditErr || !hasCredit) {
    // Vérifier le solde pour message adapté
    const { data:credits } = await admin.from('credits').select('balance').eq('user_id', user.id).single()
    const balance = credits?.balance ?? 0
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error:   balance <= 0
        ? 'Crédits épuisés — rechargez pour continuer.'
        : 'Impossible de déduire le crédit.',
      code:    'QUOTA_EXCEEDED',
      data:    { balance } as never,
    }, { status:429 })
  }

  // ── Tier selon le plan + SMC gratuit quotidien ───────────
  const { data:prof } = await anon.from('profiles').select('user_plan,is_admin,locale').eq('id', user.id).single()
  const plan   = prof?.user_plan ?? 'free'
  const locale = (prof?.locale as string) ?? 'fr'

  let tier: 'basic' | 'advanced' | 'elite' = 'basic'
  let freeDailySmc = false
  let smcAlreadyUsed = false

  if (prof?.is_admin || plan === 'elite') {
    tier = 'elite'
  } else if (plan === 'pro') {
    tier = 'advanced'
  } else {
    // Free : vérifier et consommer le SMC gratuit du jour
    const admin2 = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: smcResult } = await admin2.rpc('check_free_smc', { p_user_id: user.id })
    const smc = smcResult as { has_smc: boolean; is_free_daily: boolean; already_used: boolean }
    if (smc?.has_smc) {
      tier = 'advanced'
      freeDailySmc = true
    } else {
      smcAlreadyUsed = true
    }
  }

  // ── Mode (swing / scalp) ────────────────────────────────
  let analysisMode: 'swing' | 'scalp' = 'swing'
  let derivSymbol: string | null = null
  // Peek le body pour lire le mode avant de lire l'image en FormData
  const contentTypeHdr = req.headers.get('content-type') ?? ''
  if (contentTypeHdr.includes('application/json')) {
    try {
      const bodyClone = await req.clone().json()
      if (bodyClone.mode === 'scalp') analysisMode = 'scalp'
      if (bodyClone.derivSymbol) derivSymbol = String(bodyClone.derivSymbol)
    } catch {}
  }

  // ── Lire l'image ──────────────────────────────────────────
  let imageBase64: string, mimeType: string
  try {
    const ct = req.headers.get('content-type') ?? ''
    if (ct.includes('application/json')) {
      const body = await req.json()
      mimeType    = body.mediaType ?? 'image/jpeg'
      imageBase64 = body.image
    } else {
      const fd   = await req.formData()
      const file = fd.get('image') as File | null
      if (!file) throw new Error('no file')
      mimeType    = file.type
      const buf   = await file.arrayBuffer()
      imageBase64 = Buffer.from(buf).toString('base64')
    }
    if (!imageBase64) throw new Error('no image data')
    const approxMB = (imageBase64.length * 0.75) / (1024*1024)
    if (approxMB > MAX_SIZE_MB) throw new Error(`Image trop lourde (max ${MAX_SIZE_MB}MB)`)
    mimeType = (['image/jpeg','image/png','image/webp','image/gif'].includes(mimeType.split(';')[0])
      ? mimeType.split(';')[0] : 'image/jpeg')
  } catch (e) {
    // Rembourser le crédit si erreur lecture
    await admin.rpc('add_credits', { p_user_id:user.id, p_amount:1, p_type:'refund', p_desc:'Remboursement — erreur image' })
    return NextResponse.json<ApiResponse<null>>({ success:false, error:'Impossible de lire le fichier — JPG, PNG ou WEBP requis', code:'INVALID_IMAGE' }, { status:400 })
  }

  // ── Appel Claude ──────────────────────────────────────────
  let rawText: string
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'x-api-key':process.env.ANTHROPIC_API_KEY!, 'anthropic-version':'2023-06-01' },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        system:     analysisMode === 'scalp'
                          ? (tier === 'basic' ? getScalpPrompt(locale) : getScalpPrompt(locale))
                          : tier === 'elite' ? getElitePrompt(locale)
                          : tier === 'advanced' ? getAdvancedPrompt(locale)
                          : getBasicPrompt(locale),
        max_tokens: tier === 'elite' ? 1500 : tier === 'advanced' ? 1200 : 600,
        messages: [{
          role:'user',
          content:[
            { type:'image', source:{ type:'base64', media_type:mimeType, data:imageBase64 } },
            { type:'text',  text: locale==='fr'
              ? `MODE : ${analysisMode === 'scalp'
                  ? 'SCALP ⚡ — Timeframes courts attendus (M1/M5/M15/M30). Analyse la micro-structure.'
                  : 'SWING/DAY 📈 — Timeframes moyens/longs attendus (H1/H4/D1). Analyse la structure principale.'
                }
${derivSymbol ? `
ACTIF CONNU : ${derivSymbol} (synthétique Deriv). Utilise "${derivSymbol}" comme valeur du champ "pair" dans le JSON.` : ''}
Analyse ce chart. LIS le timeframe visible (coin sup. gauche ou titre), la paire exacte, et les PRIX sur l'axe Y droit. Les prix du signal DOIVENT correspondre aux valeurs visibles sur le chart. JSON uniquement.`
              : `MODE: ${analysisMode === 'scalp'
                  ? 'SCALP ⚡ — Short timeframes expected (M1/M5/M15/M30). Analyze micro-structure.'
                  : 'SWING/DAY 📈 — Medium/long timeframes expected (H1/H4/D1). Analyze main structure.'
                }

Analyze this chart. READ the visible timeframe (top-left corner or title), exact pair name, and PRICES from the Y-axis (right side). Signal prices MUST match visible values. JSON only.` },
          ],
        }],
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('[Claude]', err)
      await admin.rpc('add_credits', { p_user_id:user.id, p_amount:1, p_type:'refund', p_desc:'Remboursement — erreur IA' })
      return NextResponse.json<ApiResponse<null>>({ success:false, error:'Erreur IA — réessayez', code:'AI_ERROR' }, { status:502 })
    }
    const cd = await res.json()
    rawText  = cd.content?.[0]?.text ?? ''
  } catch {
    await admin.rpc('add_credits', { p_user_id:user.id, p_amount:1, p_type:'refund', p_desc:'Remboursement — erreur réseau IA' })
    return NextResponse.json<ApiResponse<null>>({ success:false, error:'Connexion IA impossible', code:'AI_ERROR' }, { status:502 })
  }

  // ── Parser le signal ──────────────────────────────────────
  const parsed = parseClaudeJSON<Record<string,unknown>>(rawText)
  if (!parsed || parsed['error'])
    return NextResponse.json<ApiResponse<null>>({ success:false, error:parsed?.['error'] as string ?? 'Image non reconnue comme chart.', code:'INVALID_IMAGE' }, { status:422 })

  const signal = validateChartSignal(parsed)
  if (!signal)
    return NextResponse.json<ApiResponse<null>>({ success:false, error:'Signal incomplet', code:'AI_ERROR' }, { status:422 })

  await saveChartAnalysis({
    userId:             user.id,
    pair:               signal.pair,
    timeframe:          signal.timeframe,
    direction:          signal.direction,
    entry:              signal.entry,
    stopLoss:           signal.stop_loss,
    tp1:                signal.tp1,
    tp2:                signal.tp2,
    tp3:                signal.tp3,
    rrRatio:            signal.rr_ratio,
    conclusion:         signal.conclusion,
    rawAnalysis:        signal.raw_analysis ?? '',
    locale,
    marketState:        signal.market_state,
    confidence:         signal.confidence,
    smcAnalysis:        signal.smc_analysis,
    confluenceFactors:  signal.confluence_factors,
    orderType:          signal.order_type,
    trend:              signal.trend,
    orderBlock:         signal.order_block ?? null,
    fvg:                signal.fvg ?? null,
    bosLevel:           signal.bos_level,
    chochLevel:         signal.choch_level,
    liquidityHigh:      signal.liquidity_high,
    liquidityLow:       signal.liquidity_low,
  })

  // Notifier si solde bas après déduction
  const { data:newBal } = await admin.from('credits').select('balance').eq('user_id', user.id).single()
  if ((newBal?.balance ?? 0) <= 5 && (newBal?.balance ?? 0) > 0) {
    await admin.from('notifications').insert({ user_id:user.id, type:'quota_warning', priority:'high',
      title:`⚡ Il vous reste ${newBal?.balance} crédit${(newBal?.balance ?? 0)>1?'s':''}`,
      message:'Rechargez vos crédits pour continuer à analyser vos charts.', action_url:'/pricing', action_label:'Recharger' })
  }
  if ((newBal?.balance ?? 0) === 0) {
    await admin.from('notifications').insert({ user_id:user.id, type:'quota_warning', priority:'urgent',
      title:'🚨 Crédits épuisés', message:'Vous n\'avez plus de crédits. Achetez un pack ou passez à Pro.',
      action_url:'/pricing', action_label:'Voir les packs' })
  }

  return NextResponse.json({ success:true, data:signal, free_daily_smc: freeDailySmc, smc_already_used: smcAlreadyUsed, mode: analysisMode }, { status:200 })
}

export const maxDuration = 30
