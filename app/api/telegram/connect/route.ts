import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { chat_id } = await req.json()
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token || !chat_id) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key')
  const { data: { user } } = await anon.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key')
  await admin.from('profiles').update({ telegram_chat_id: String(chat_id) }).eq('id', user.id)

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (botToken) {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: String(chat_id), parse_mode: 'Markdown',
        text: '✅ *ProfityX connecté !*\n\nVous recevrez vos signaux SMC ici.\n\n_Analysez un chart → signal en 10 secondes._'
      }),
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
