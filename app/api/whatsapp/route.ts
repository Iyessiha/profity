// ============================================================
// PROFITYX — Agent WhatsApp (webhook Meta Cloud API)
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendText, sendButtons, markAsRead, extractText } from '@/lib/whatsapp'
import { AGENT_SYSTEM_PROMPT } from '@/lib/whatsapp-prompt'

export const dynamic = 'force-dynamic'

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!

// ── GET : vérification du webhook par Meta ────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook WhatsApp vérifié')
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// ── POST : traitement des messages entrants ───────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Extraire le message
    const entry   = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value   = changes?.value
    const messages = value?.messages

    if (!messages?.length) return NextResponse.json({ ok: true })

    const msg     = messages[0]
    const phone   = msg.from
    const msgId   = msg.id
    const text    = extractText(msg).trim()

    if (!text) return NextResponse.json({ ok: true })

    // Marquer comme lu
    await markAsRead(msgId)

    // DB
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Sauvegarder le message utilisateur
    await db.from('whatsapp_conversations').insert({ phone, role: 'user', content: text })

    // Récupérer l'historique (15 derniers messages)
    const { data: history } = await db
      .from('whatsapp_conversations')
      .select('role, content')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(15)

    const messages_hist = (history ?? []).reverse().map(h => ({
      role: h.role as 'user' | 'assistant',
      content: h.content,
    }))

    // Détecter si c'est un nouveau prospect et sauvegarder
    const isNew = !history || history.length <= 1
    if (isNew) {
      await db.from('whatsapp_leads').upsert({ phone, updated_at: new Date().toISOString() }, { onConflict: 'phone' })
    }

    // Appel Claude via fetch direct (pas de SDK)
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system: AGENT_SYSTEM_PROMPT,
        messages: messages_hist,
      }),
    })
    const claudeData = await claudeRes.json()
    const reply = claudeData.content?.[0]?.text ?? "Désolé, je n'ai pas pu traiter votre message. Réessayez."

    // Sauvegarder la réponse
    await db.from('whatsapp_conversations').insert({ phone, role: 'assistant', content: reply })

    // Détecter si on doit ajouter des boutons d'action
    const needsButtons = isNew || /prix|tarif|combien|plan|s'inscrire|inscription|commencer|démarrer/i.test(text)

    if (needsButtons && reply.length < 900) {
      await sendText(phone, reply)
      await new Promise(r => setTimeout(r, 800))
      await sendButtons(phone, '👇 Actions rapides', [
        { id: 'register', title: '✅ M\'inscrire' },
        { id: 'pricing',  title: '💰 Voir les prix' },
        { id: 'demo',     title: '📊 Voir un signal' },
      ])
    } else {
      // Couper les longs messages en 2 parties si besoin
      if (reply.length > 1000) {
        const mid = reply.lastIndexOf('\n', 900)
        const part1 = reply.slice(0, mid > 0 ? mid : 900)
        const part2 = reply.slice(mid > 0 ? mid : 900)
        await sendText(phone, part1)
        await new Promise(r => setTimeout(r, 600))
        await sendText(phone, part2)
      } else {
        await sendText(phone, reply)
      }
    }

    // Mettre à jour les infos du lead
    const planMentioned = /elite/i.test(text) ? 'elite' : /pro/i.test(text) ? 'pro' : /free|gratuit/i.test(text) ? 'free' : undefined
    if (planMentioned) {
      await db.from('whatsapp_leads').upsert({ phone, plan_asked: planMentioned, updated_at: new Date().toISOString() }, { onConflict: 'phone' })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('WhatsApp webhook error:', err)
    return NextResponse.json({ ok: true }) // Toujours 200 pour Meta
  }
}
