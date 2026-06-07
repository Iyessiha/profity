import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const db = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken:false, persistSession:false } }
)

async function getPrice(pair: string): Promise<number | null> {
  try {
    if (pair === 'BTC/USD') {
      const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', { signal:AbortSignal.timeout(5000) })
      return (await r.json()).bitcoin?.usd ?? null
    }
    if (pair === 'ETH/USD') {
      const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd', { signal:AbortSignal.timeout(5000) })
      return (await r.json()).ethereum?.usd ?? null
    }
    if (pair === 'XAU/USD') {
      const r = await fetch('https://api.frankfurter.app/latest?from=XAU&to=USD', { signal:AbortSignal.timeout(5000) })
      return (await r.json()).rates?.USD ?? null
    }
    if (pair.includes('/') && !pair.includes('V')) {
      const [base, quote] = pair.split('/')
      const r = await fetch(`https://api.frankfurter.app/latest?from=${base}&to=${quote}`, { signal:AbortSignal.timeout(5000) })
      return (await r.json()).rates?.[quote] ?? null
    }
    return null
  } catch { return null }
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') || new URL(req.url).searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error:'Unauthorized' }, { status:401 })
  }

  const supabase = db()
  const { data:alerts } = await supabase
    .from('price_alerts').select('*').eq('active', true).eq('triggered', false).limit(100)

  if (!alerts?.length) return NextResponse.json({ checked:0, triggered:0 })

  const pairs = [...new Set(alerts.map((a: { pair: string }) => a.pair))]
  const prices: Record<string, number|null> = {}
  await Promise.all(pairs.map(async (p: string) => { prices[p] = await getPrice(p) }))

  let triggered = 0
  for (const alert of alerts as Array<{ id:string; user_id:string; pair:string; condition:string; target_price:number }>) {
    const cur = prices[alert.pair]
    if (cur == null) continue
    const hit = (alert.condition === 'above' && cur >= alert.target_price) ||
                (alert.condition === 'below' && cur <= alert.target_price)
    if (!hit) continue

    await supabase.from('price_alerts').update({ triggered:true, triggered_at:new Date().toISOString() }).eq('id', alert.id)
    await supabase.from('notifications').insert({
      user_id: alert.user_id, type:'alert',
      title: `🔔 Alerte ${alert.pair} !`,
      message: `${alert.pair} a atteint ${cur.toFixed(alert.pair.includes('JPY')?3:5)}. Votre cible : ${alert.target_price}`,
      link:'/analysis', cta:'Analyser maintenant', priority:'high',
    })
    triggered++
  }

  return NextResponse.json({ checked:alerts.length, triggered, timestamp:new Date().toISOString() })
}
