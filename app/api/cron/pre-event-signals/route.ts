// ============================================================
// PROFITYX — Cron : signal automatique 30 min avant annonce
// Schedule : toutes les 30 min via Vercel Cron
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const db = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken:false, persistSession:false } }
)

// Générer un signal via Claude pour une annonce macro
async function generateSignal(event: {
  event_title: string; country: string; impact: string;
  forecast: string; previous: string; description: string
}) {
  const prompt = `Tu es un trader institutionnel expert. Une annonce économique majeure arrive dans 30 minutes.

Annonce : ${event.event_title}
Pays : ${event.country}
Impact : ${event.impact}
Prévision : ${event.forecast || 'N/A'}
Précédent : ${event.previous || 'N/A'}
Contexte : ${event.description || ''}

Génère un signal de trading PRÉ-ANNONCE en JSON pur (sans markdown) :
{
  "direction": "LONG" ou "SHORT" ou "NEUTRE",
  "pair_cible": "paire principale affectée ex: XAU/USD",
  "entry": prix_numerique,
  "stop_loss": prix_numerique,
  "tp1": prix_numerique,
  "tp2": prix_numerique,
  "tp3": prix_numerique,
  "rr_ratio": ratio_numerique,
  "interpretation": "Analyse en 2-3 phrases expliquant le signal",
  "confidence": "ÉLEVÉE" ou "MOYENNE" ou "FAIBLE"
}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await res.json()
  const text = data.content?.[0]?.text ?? ''
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

export async function GET(req: NextRequest) {
  // Vérifier le secret
  const secret = req.headers.get('x-cron-secret') || new URL(req.url).searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error:'Unauthorized' }, { status:401 })
  }

  const supabase = db()
  const now   = new Date()
  const in30  = new Date(now.getTime() + 30 * 60 * 1000)
  const in35  = new Date(now.getTime() + 35 * 60 * 1000)

  // Chercher les événements HIGH/MEDIUM dans les 30 prochaines minutes
  const { data: events } = await supabase
    .from('scheduled_events')
    .select('*')
    .gte('event_date', in30.toISOString())
    .lte('event_date', in35.toISOString())
    .in('impact', ['HIGH', 'MEDIUM'])
    .order('event_date', { ascending: true })
    .limit(5)

  if (!events?.length) {
    return NextResponse.json({ generated: 0, message: 'Aucun événement dans les 30 prochaines minutes' })
  }

  const results = []

  for (const event of events) {
    // Éviter les doublons
    const { count } = await supabase
      .from('auto_signals')
      .select('id', { count:'exact', head:true })
      .eq('event_id', event.id)

    if ((count ?? 0) > 0) continue

    try {
      const signal = await generateSignal({
        event_title: event.event_title || event.title,
        country:     event.country || 'USA',
        impact:      event.impact || 'HIGH',
        forecast:    event.forecast || '',
        previous:    event.previous || '',
        description: event.description || '',
      })

      // Sauvegarder le signal auto
      const { data: saved } = await supabase.from('auto_signals').insert({
        event_id:       event.id,
        event_title:    event.event_title || event.title,
        country:        event.country || 'USA',
        impact:         event.impact || 'HIGH',
        event_date:     event.event_date,
        direction:      signal.direction,
        pair_cible:     signal.pair_cible,
        entry:          signal.entry,
        stop_loss:      signal.stop_loss,
        tp1:            signal.tp1,
        tp2:            signal.tp2,
        tp3:            signal.tp3,
        rr_ratio:       signal.rr_ratio,
        interpretation: signal.interpretation,
        confidence:     signal.confidence,
      }).select().single()

      // Notifier TOUS les utilisateurs
      await supabase.rpc('broadcast_notification', {
        p_type:     'signal',
        p_title:    `⚡ Signal pré-${event.event_title || event.title} — ${signal.direction} ${signal.pair_cible}`,
        p_message:  `Signal généré 30 min avant l'annonce. Entrée : ${signal.entry} · Confiance : ${signal.confidence}`,
        p_link:     '/news',
        p_cta:      'Voir le signal',
        p_priority: 'high',
      })

      results.push({ event: event.event_title || event.title, signal: signal.direction, pair: signal.pair_cible })
      console.log(`[pre-event] ✅ Signal ${signal.direction} ${signal.pair_cible} pour ${event.event_title}`)

    } catch (err) {
      console.error(`[pre-event] ❌ ${event.event_title}:`, err)
    }
  }

  return NextResponse.json({
    generated: results.length,
    signals:   results,
    timestamp: now.toISOString(),
  })
}
