// ============================================================
// PROFITYX — POST /api/analyze
// Reçoit une image de chart, appelle Claude Vision,
// retourne un signal Entrée / SL / TP1 / TP2 / TP3
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { getChartPrompt }            from '@/lib/prompts'
import { parseClaudeJSON, validateChartSignal } from '@/lib/parser'
import {
  checkAndConsumeAnalysisQuota,
  saveChartAnalysis,
} from '@/lib/supabase'
import type { ApiResponse, ChartSignal } from '@/types'

// Taille max image : 4.5 MB (base64 ~6 MB)
const MAX_SIZE_MB = 4.5

export async function POST(req: NextRequest) {
  // ----------------------------------------------------------
  // 1. Authentification via Supabase JWT
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
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
  const hasQuota = await checkAndConsumeAnalysisQuota(user.id)
  if (!hasQuota) {
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: 'Quota d\'analyses épuisé. Passez au plan Pro pour continuer.',
        code: 'QUOTA_EXCEEDED'
      },
      { status: 429 }
    )
  }

  // Déterminer le niveau d'analyse selon le plan (SMC réservé Pro/Elite)
  let analysisTier: 'basic' | 'advanced' = 'basic'
  {
    const { data: prof } = await supabase
      .from('profiles').select('user_plan, is_admin').eq('id', user.id).single()
    const plan = prof?.user_plan ?? 'free'
    if (prof?.is_admin || plan === 'pro' || plan === 'elite') analysisTier = 'advanced'
  }

  // ----------------------------------------------------------
  // 3. Récupérer l'image et les paramètres (JSON ou FormData)
  // ----------------------------------------------------------
  let imageBase64: string
  let mimeType: string
  let locale: string

  try {
    const contentType = req.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
      // ── Mode JSON (base64 string depuis la page /analysis) ──
      const body = await req.json()
      locale      = body.locale ?? 'fr'
      mimeType    = body.mediaType ?? 'image/jpeg'

      if (!body.image) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Aucune image fournie', code: 'INVALID_IMAGE' },
          { status: 400 }
        )
      }
      imageBase64 = body.image  // déjà en base64

    } else {
      // ── Mode FormData (ancien ChartUploader) ──
      const formData = await req.formData()
      const file     = formData.get('image') as File | null
      locale         = (formData.get('locale') as string) ?? 'fr'

      if (!file) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Aucune image fournie', code: 'INVALID_IMAGE' },
          { status: 400 }
        )
      }
      mimeType = file.type
      const buffer = await file.arrayBuffer()
      imageBase64  = Buffer.from(buffer).toString('base64')
    }

    // Vérifier le type MIME
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
    const baseMime = mimeType.split(';')[0].trim()
    if (!allowedTypes.includes(baseMime)) {
      mimeType = 'image/jpeg'  // fallback sécurisé
    } else {
      mimeType = baseMime
    }

    // Vérifier la taille (base64 ≈ 4/3 × taille originale)
    const approxMB = (imageBase64.length * 0.75) / (1024 * 1024)
    if (approxMB > MAX_SIZE_MB) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: `Image trop lourde (max ${MAX_SIZE_MB}MB — compressez le screenshot)`, code: 'INVALID_IMAGE' },
        { status: 400 }
      )
    }

  } catch (err) {
    console.error('[Analyze] Erreur lecture:', err)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Impossible de lire le fichier — vérifiez le format (JPG, PNG, WEBP)', code: 'INVALID_IMAGE' },
      { status: 400 }
    )
  }

  // ----------------------------------------------------------
  // 4. Appel Claude Vision (claude-sonnet-4-6)
  // ----------------------------------------------------------
  let rawText: string
  try {
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':         'application/json',
        'x-api-key':            process.env.ANTHROPIC_API_KEY!,
        'anthropic-version':    '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 800,
        system:     getChartPrompt(locale, analysisTier),
        messages: [
          {
            role: 'user',
            content: [
              {
                type:   'image',
                source: {
                  type:       'base64',
                  media_type: mimeType,
                  data:       imageBase64,
                },
              },
              {
                type: 'text',
                text: locale === 'fr'
                  ? `Analyse ce chart de trading. IMPORTANT : lis le timeframe dans le coin supérieur gauche, lis le nom de la paire dans le titre, et lis les prix DIRECTEMENT sur l'axe Y (côté droit). Les prix de ton signal DOIVENT correspondre aux valeurs visibles sur le chart. Génère le signal JSON.`
                  : locale === 'ar'
                  ? `حلّل هذا الرسم البياني. مهم: اقرأ الإطار الزمني من الركن العلوي الأيسر، اقرأ اسم الزوج من العنوان، واقرأ الأسعار من المحور Y (الجانب الأيمن). يجب أن تتطابق أسعار الإشارة مع القيم المرئية في الرسم البياني.`
                  : locale === 'pt'
                  ? `Analisa este gráfico. IMPORTANTE: lê o timeframe no canto superior esquerdo, o par no título, e os preços no eixo Y (lado direito). Os preços do sinal DEVEM corresponder aos valores visíveis no gráfico.`
                  : `Analyze this trading chart. IMPORTANT: read the timeframe from the top-left corner, the pair name from the title, and prices DIRECTLY from the Y-axis (right side). Signal prices MUST match the values visible on the chart. Generate JSON signal.`,
              },
            ],
          },
        ],
      }),
    })

    if (!claudeResponse.ok) {
      const errBody = await claudeResponse.text()
      console.error('[Claude API] Erreur:', errBody)
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Erreur IA — réessayez', code: 'AI_ERROR' },
        { status: 502 }
      )
    }

    const claudeData = await claudeResponse.json()
    rawText = claudeData.content?.[0]?.text ?? ''

  } catch (err) {
    console.error('[Claude API] Exception:', err)
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Connexion IA impossible', code: 'AI_ERROR' },
      { status: 502 }
    )
  }

  // ----------------------------------------------------------
  // 5. Parser et valider la réponse
  // ----------------------------------------------------------
  const parsed  = parseClaudeJSON<Record<string, unknown>>(rawText)
  if (!parsed || parsed['error']) {
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: parsed?.['error'] as string ?? 'Réponse IA invalide — image non reconnue comme chart.',
        code: 'INVALID_IMAGE'
      },
      { status: 422 }
    )
  }

  const signal = validateChartSignal(parsed)
  if (!signal) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Signal incomplet généré par l\'IA', code: 'AI_ERROR' },
      { status: 422 }
    )
  }

  // ----------------------------------------------------------
  // 6. Sauvegarder en base de données
  // ----------------------------------------------------------
  await saveChartAnalysis({
    userId:      user.id,
    pair:        signal.pair,
    timeframe:   signal.timeframe,
    direction:   signal.direction,
    entry:       signal.entry,
    stopLoss:    signal.stop_loss,
    tp1:         signal.tp1,
    tp2:         signal.tp2,
    tp3:         signal.tp3,
    rrRatio:     signal.rr_ratio,
    conclusion:  signal.conclusion,
    rawAnalysis: signal.raw_analysis,
    locale,
  })

  // ----------------------------------------------------------
  // 7. Retourner le signal
  // ----------------------------------------------------------
  return NextResponse.json<ApiResponse<ChartSignal>>(
    { success: true, data: signal },
    { status: 200 }
  )
}

// Config moderne Next.js 14 App Router
export const maxDuration = 30
