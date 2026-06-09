// GET /api/payment/paystack/verify?reference=PX-xxx
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('reference')
  if (!ref) return NextResponse.json({ error: 'reference requis' }, { status: 400 })

  const res = await fetch(`https://api.paystack.co/transaction/verify/${ref}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  })
  const data = await res.json()
  return NextResponse.json(data)
}
