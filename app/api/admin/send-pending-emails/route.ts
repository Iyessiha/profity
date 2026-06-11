// ============================================================
// POST /api/admin/send-pending-emails
// Envoie les emails manquants aux users Pro/Elite existants
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { sendEmail }                  from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key')
  const { data: { user } } = await anon.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key')
  const { data: prof } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!prof?.is_admin) return NextResponse.json({ error: 'Admin requis' }, { status: 403 })

  const results: Array<{ email: string; emails_sent: string[]; invoice?: string }> = []

  // Récupérer les users payants sans email de bienvenue envoyé
  const { data: payingUsers } = await admin
    .from('profiles')
    .select('id, email, full_name, user_plan')
    .in('user_plan', ['pro', 'elite'])
    .not('email', 'like', '%profityx%')
    .not('email', 'like', '%tivyx%')

  for (const u of (payingUsers ?? [])) {
    const sent: string[] = []

    // Récupérer l'abonnement
    const { data: sub } = await admin
      .from('subscriptions')
      .select('amount, plan, paygenius_id')
      .eq('user_id', u.id)
      .eq('status', 'active')
      .single()

    // Vérifier si facture existe déjà
    const { data: existingInv } = await admin
      .from('invoices')
      .select('invoice_number, token')
      .eq('user_id', u.id)
      .single()

    let invoiceToken = existingInv?.token
    let invoiceNumber = existingInv?.invoice_number

    // Créer la facture si elle n'existe pas
    if (!existingInv && sub) {
      const year = new Date().getFullYear()
      const num  = String(Date.now()).slice(-4)
      invoiceNumber = `PX-${year}-${num}`
      const { data: newInv } = await admin.from('invoices').insert({
        invoice_number: invoiceNumber,
        user_id:        u.id,
        client_name:    u.full_name ?? 'Trader',
        client_email:   u.email,
        client_address: "Côte d'Ivoire",
        plan:           u.user_plan,
        description:    `Abonnement Plan ${u.user_plan.toUpperCase()} — 150 crédits/mois`,
        amount_xof:     Number(sub.amount ?? 17500),
        amount_usd:     Math.round(Number(sub.amount ?? 17500) / 620 * 100) / 100,
        payment_method: 'GeniusPay',
        payment_ref:    sub.paygenius_id ?? '',
        status:         'paid',
      }).select('token, invoice_number').single()
      invoiceToken = newInv?.token
      invoiceNumber = newInv?.invoice_number ?? invoiceNumber
    }

    // 1. Email plan_activated
    const ok1 = await sendEmail({
      template: 'plan_activated',
      to:       u.email,
      name:     u.full_name ?? 'Trader',
      data:     { plan: u.user_plan.toUpperCase(), credits: u.user_plan === 'elite' ? '600' : '150' },
    })
    if (ok1) sent.push('plan_activated')

    // 2. Email facture si token disponible
    if (invoiceToken) {
      const invoiceUrl = `https://profity-x.com/invoice/${invoiceToken}`
      const ok2 = await sendEmail({
        template: 'invoice',
        to:       u.email,
        name:     u.full_name ?? 'Trader',
        data: {
          invoice_number: invoiceNumber ?? 'PX-2026-XXXX',
          plan:           u.user_plan.toUpperCase(),
          amount_xof:     Number(sub?.amount ?? 17500).toLocaleString('fr-FR'),
          amount_usd:     String(Math.round(Number(sub?.amount ?? 17500) / 620 * 100) / 100),
          date:           new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' }),
          invoice_url:    invoiceUrl,
          payment_method: `GeniusPay — Réf: ${sub?.paygenius_id ?? 'N/A'}`,
        },
      })
      if (ok2) sent.push('invoice')
    }

    // 3. Email seq_j3 (contenu éducatif — user actif)
    const ok3 = await sendEmail({ template: 'seq_j3', to: u.email, name: u.full_name ?? 'Trader' })
    if (ok3) sent.push('seq_j3')

    results.push({ email: u.email, emails_sent: sent, invoice: invoiceNumber })
  }

  return NextResponse.json({ success: true, processed: results.length, results })
}
