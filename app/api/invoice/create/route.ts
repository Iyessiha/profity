import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { sendEmail }                  from '@/lib/email'

export const dynamic = 'force-dynamic'

const XOF_PER_USD = 620

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { user_id, client_name, client_email, client_address, plan, amount_xof, payment_method, payment_ref } = body
  if (!user_id || !client_email || !plan || !amount_xof)
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const year   = new Date().getFullYear()
  const num    = String(Date.now()).slice(-4).padStart(4, '0')
  const invoiceNumber = `PX-${year}-${num}`

  const planLabels: Record<string, string> = {
    pro:     'Abonnement Plan PRO — 150 crédits/mois',
    elite:   'Abonnement Plan ELITE — 600 crédits/mois',
    credits: 'Pack crédits supplémentaires',
  }
  const { data: invoice, error } = await admin.from('invoices').insert({
    invoice_number: invoiceNumber,
    user_id, client_email,
    client_name:    client_name ?? client_email.split('@')[0],
    client_address: client_address ?? "Côte d'Ivoire",
    plan, description: planLabels[plan] ?? plan,
    amount_xof,
    amount_usd:     Math.round((amount_xof / XOF_PER_USD) * 100) / 100,
    payment_method: payment_method ?? 'GeniusPay',
    payment_ref:    payment_ref ?? '',
    status: 'paid',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const invoiceUrl = `https://profity-x.com/invoice/${invoice.token}`
  try {
    await sendEmail({ template: 'invoice', to: client_email, name: client_name ?? 'Trader',
      data: { invoice_number: invoiceNumber, plan: plan.toUpperCase(),
        amount_xof: amount_xof.toLocaleString('fr-FR'),
        amount_usd: invoice.amount_usd.toString(),
        date: new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' }),
        invoice_url: invoiceUrl, payment_method: payment_method ?? 'GeniusPay' }
    })
  } catch {}

  return NextResponse.json({ success: true, invoice_number: invoiceNumber, invoice_url: invoiceUrl, id: invoice.id })
}
