import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { invoice_id } = await req.json()
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: inv } = await admin.from('invoices').select('*').eq('id', invoice_id).single()
  if (!inv) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
  const ok = await sendEmail({
    template: 'invoice', to: inv.client_email, name: inv.client_name,
    data: {
      invoice_number: inv.invoice_number, plan: inv.plan.toUpperCase(),
      amount_xof: inv.amount_xof.toLocaleString('fr-FR'), amount_usd: String(inv.amount_usd),
      date: new Date(inv.created_at).toLocaleDateString('fr-FR', {day:'2-digit',month:'long',year:'numeric'}),
      invoice_url: `https://profity-x.com/invoice/${inv.token}`,
      payment_method: inv.payment_method,
    }
  })
  return NextResponse.json({ success: ok })
}
