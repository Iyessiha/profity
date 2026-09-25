import { NextRequest, NextResponse } from 'next/server'
import { isInternalRequest } from '@/lib/internal-auth'

export const dynamic = 'force-dynamic'

// Appelé uniquement par le serveur (analyze). Sans secret interne, n'importe qui
// pourrait faire envoyer des messages arbitraires par le bot à n'importe quel chat.
export async function POST(req: NextRequest) {
  if (!isInternalRequest(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { chat_id, signal } = await req.json().catch(() => ({}))
  if (!chat_id || !signal) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const emoji = signal.direction === 'LONG' ? '🟢' : '🔴'
  const msg = `${emoji} *${signal.pair} — ${signal.direction}*\n\n` +
    `📍 *Entrée :* \`${signal.entry}\`\n` +
    `🛑 *Stop Loss :* \`${signal.stop_loss}\`\n` +
    `🎯 *TP1 :* \`${signal.tp1}\`\n` +
    `🎯 *TP2 :* \`${signal.tp2}\`\n` +
    `🎯 *TP3 :* \`${signal.tp3}\`\n\n` +
    `📊 R/R : ${signal.rr_ratio} · Confiance : ${signal.confidence}\n\n` +
    `_Analysé par ProfityX IA — profity-x.com_`

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN manquant' }, { status: 500 })

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: String(chat_id), text: msg, parse_mode: 'Markdown' }),
  })
  const data = await res.json()
  return NextResponse.json({ success: data.ok })
}
