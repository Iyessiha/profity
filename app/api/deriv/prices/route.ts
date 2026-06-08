// ============================================================
// PROFITYX — Deriv Live Prices API
// WebSocket court terme : open → auth → ticks → close → respond
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import WebSocket from 'ws'

const DERIV_WS  = 'wss://ws.binaryws.com/websockets/v3?app_id=1089'
const TIMEOUT_MS = 8000

// Symboles supportés
export const DERIV_SYMBOLS: Record<string, { name: string; category: string; flag: string }> = {
  // ── Synthétiques Boom/Crash ───────────────────────────
  BOOM1000:  { name: 'Boom 1000',    category: 'Boom/Crash', flag: '📈' },
  BOOM500:   { name: 'Boom 500',     category: 'Boom/Crash', flag: '📈' },
  BOOM300N:  { name: 'Boom 300',     category: 'Boom/Crash', flag: '📈' },
  CRASH1000: { name: 'Crash 1000',   category: 'Boom/Crash', flag: '📉' },
  CRASH500:  { name: 'Crash 500',    category: 'Boom/Crash', flag: '📉' },
  CRASH300N: { name: 'Crash 300',    category: 'Boom/Crash', flag: '📉' },
  // ── Synthétiques Volatility ──────────────────────────
  R_10:      { name: 'Volatility 10',  category: 'Volatility', flag: '〰️' },
  R_25:      { name: 'Volatility 25',  category: 'Volatility', flag: '〰️' },
  R_50:      { name: 'Volatility 50',  category: 'Volatility', flag: '〰️' },
  R_75:      { name: 'Volatility 75',  category: 'Volatility', flag: '〰️' },
  R_100:     { name: 'Volatility 100', category: 'Volatility', flag: '〰️' },
  // ── Synthétiques Step & Jump ─────────────────────────
  STPRNG:    { name: 'Step Index',     category: 'Step/Jump',  flag: '📊' },
  JD10:      { name: 'Jump 10',        category: 'Step/Jump',  flag: '⚡' },
  JD25:      { name: 'Jump 25',        category: 'Step/Jump',  flag: '⚡' },
  JD50:      { name: 'Jump 50',        category: 'Step/Jump',  flag: '⚡' },
  JD75:      { name: 'Jump 75',        category: 'Step/Jump',  flag: '⚡' },
  JD100:     { name: 'Jump 100',       category: 'Step/Jump',  flag: '⚡' },
  // ── Forex ────────────────────────────────────────────
  frxEURUSD: { name: 'EUR/USD',  category: 'Forex', flag: '🇪🇺' },
  frxGBPUSD: { name: 'GBP/USD',  category: 'Forex', flag: '🇬🇧' },
  frxUSDJPY: { name: 'USD/JPY',  category: 'Forex', flag: '🇯🇵' },
  frxUSDCHF: { name: 'USD/CHF',  category: 'Forex', flag: '🇨🇭' },
  frxAUDUSD: { name: 'AUD/USD',  category: 'Forex', flag: '🇦🇺' },
  frxUSDCAD: { name: 'USD/CAD',  category: 'Forex', flag: '🇨🇦' },
  frxEURGBP: { name: 'EUR/GBP',  category: 'Forex', flag: '🇪🇺' },
  frxEURJPY: { name: 'EUR/JPY',  category: 'Forex', flag: '🇯🇵' },
  frxGBPJPY: { name: 'GBP/JPY',  category: 'Forex', flag: '🇬🇧' },
  frxXAUUSD: { name: 'XAU/USD',  category: 'Forex', flag: '🥇' },
  // ── Matières premières ───────────────────────────────
  frxXAGUSD: { name: 'Argent (XAG)', category: 'Commodités', flag: '🥈' },
  frxBROUSD: { name: 'Brent (OIL)', category: 'Commodités', flag: '🛢️' },
  // ── Crypto ───────────────────────────────────────────
  cryBTCUSD:  { name: 'Bitcoin',   category: 'Crypto', flag: '₿'  },
  cryETHUSD:  { name: 'Ethereum',  category: 'Crypto', flag: '⟠'  },
  cryBNBUSD:  { name: 'BNB',       category: 'Crypto', flag: '🔶' },
  cryXRPUSD:  { name: 'XRP',       category: 'Crypto', flag: '✕'  },
  crySOLUSD:  { name: 'Solana',    category: 'Crypto', flag: '◎'  },
  cryLTCUSD:  { name: 'Litecoin',  category: 'Crypto', flag: 'Ł'  },
}

function fetchDerivPrices(symbols: string[], token: string): Promise<Record<string, number | null>> {
  return new Promise((resolve) => {
    const prices: Record<string, number | null> = {}
    symbols.forEach(s => { prices[s] = null })
    let received = 0
    let done = false

    const finish = () => {
      if (done) return
      done = true
      try { ws.close() } catch {}
      resolve(prices)
    }

    const timer = setTimeout(finish, TIMEOUT_MS)
    const ws = new WebSocket(DERIV_WS)

    ws.on('open', () => {
      ws.send(JSON.stringify({ authorize: token }))
    })

    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString())

        if (msg.msg_type === 'authorize') {
          // Demander les ticks pour tous les symboles en une fois
          symbols.forEach(sym => {
            ws.send(JSON.stringify({ ticks: sym }))
          })
        }

        if (msg.msg_type === 'tick' && msg.tick) {
          const sym = msg.tick.symbol
          if (sym in prices) {
            prices[sym] = msg.tick.quote
            received++
          }
          if (received >= symbols.length) {
            clearTimeout(timer)
            finish()
          }
        }

        if (msg.error) {
          console.error('[Deriv]', msg.error)
        }
      } catch {}
    })

    ws.on('error', finish)
    ws.on('close', () => { if (!done) finish() })
  })
}

export async function GET(req: NextRequest) {
  const token = process.env.DERIV_API_TOKEN
  if (!token) return NextResponse.json({ error: 'Token Deriv non configuré' }, { status: 500 })

  const url = new URL(req.url)
  const reqSymbols = url.searchParams.get('symbols')
  const symbols = reqSymbols
    ? reqSymbols.split(',').filter(s => s in DERIV_SYMBOLS)
    : Object.keys(DERIV_SYMBOLS).slice(0, 8)  // Par défaut : 8 premiers

  const prices = await fetchDerivPrices(symbols, token)

  return NextResponse.json(
    { success: true, prices, timestamp: Date.now() },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
