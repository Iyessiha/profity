// ============================================================
// PROFITYX — /invoice/[token] : Facture publique imprimable
// MonWe Infinity LLC — EIN 38-4396094
// ============================================================
import { createClient } from '@supabase/supabase-js'
import { notFound }     from 'next/navigation'

interface Invoice {
  invoice_number: string; client_name: string; client_email: string
  client_address: string; plan: string; description: string
  amount_xof: number; amount_usd: number; payment_method: string
  payment_ref: string; status: string; created_at: string
}

async function getInvoice(token: string): Promise<Invoice | null> {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await admin.from('invoices')
    .select('invoice_number, client_name, client_email, client_address, plan, description, amount_xof, amount_usd, payment_method, payment_ref, status, created_at')
    .eq('token', token).single()
  return data
}

export default async function InvoicePage({ params }: { params: { token: string } }) {
  const invoice = await getInvoice(params.token)
  if (!invoice) notFound()

  const date = new Date(invoice.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })
  const fmt  = (n: number) => n.toLocaleString('fr-FR')

  return (
    <html lang="fr">
    <head>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Facture {invoice.invoice_number} — ProfityX</title>
      <style>{`
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Segoe UI',Arial,sans-serif; background:#F4F6F8; color:#0D1B2A; }
        .page { max-width:680px; margin:0 auto; background:#FFF; padding:48px; min-height:100vh; }
        .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px; padding-bottom:24px; border-bottom:3px solid #007A52; }
        .logo-block { display:flex; flex-direction:column; gap:4px; }
        .logo { font-size:26px; font-weight:900; letter-spacing:3px; font-family:monospace; }
        .logo .x { color:#007A52; }
        .logo .profity { color:#0D1B2A; }
        .tagline { font-size:10px; letter-spacing:2px; color:#8A9FB0; }
        .company-info { font-size:12px; color:#4A6070; line-height:1.8; text-align:right; }
        .invoice-title { font-size:14px; letter-spacing:3px; color:#007A52; font-weight:700; text-transform:uppercase; margin-bottom:4px; }
        .invoice-meta { display:grid; grid-template-columns:1fr 1fr; gap:32px; margin-bottom:40px; }
        .meta-block label { font-size:10px; letter-spacing:2px; color:#8A9FB0; text-transform:uppercase; display:block; margin-bottom:6px; }
        .meta-block .value { font-size:14px; color:#0D1B2A; font-weight:600; }
        .meta-block .sub { font-size:12px; color:#4A6070; margin-top:2px; }
        .table { width:100%; border-collapse:collapse; margin-bottom:32px; }
        .table th { background:#F0FBF6; color:#007A52; font-size:10px; letter-spacing:2px; text-transform:uppercase; padding:12px 16px; text-align:left; font-weight:700; }
        .table td { padding:14px 16px; border-bottom:1px solid #E8EDF2; font-size:14px; color:#0D1B2A; }
        .table tr:last-child td { border-bottom:none; }
        .totals { margin-left:auto; max-width:280px; }
        .total-row { display:flex; justify-content:space-between; padding:8px 0; font-size:14px; color:#4A6070; border-bottom:1px solid #E8EDF2; }
        .total-row.grand { font-size:18px; font-weight:900; color:#007A52; border-bottom:none; padding-top:14px; border-top:2px solid #007A52; }
        .status-badge { display:inline-block; background:#E8F8EE; color:#007A52; border:1px solid #B3E6CF; border-radius:20px; padding:4px 14px; font-size:11px; font-weight:700; letter-spacing:1px; }
        .footer { margin-top:48px; padding-top:24px; border-top:1px solid #E8EDF2; display:flex; justify-content:space-between; align-items:flex-end; }
        .footer-legal { font-size:11px; color:#8A9FB0; line-height:1.7; max-width:320px; }
        .footer-sig { font-size:12px; color:#0D1B2A; text-align:right; line-height:1.7; }
        .print-btn { position:fixed; top:20px; right:20px; background:#007A52; color:#FFF; border:none; padding:10px 24px; border-radius:6px; font-size:14px; font-weight:700; cursor:pointer; box-shadow:0 2px 12px rgba(0,122,82,0.3); }
        @media print {
          body { background:#FFF; }
          .page { padding:32px; box-shadow:none; }
          .print-btn { display:none; }
        }
      `}</style>
    </head>
    <body>
      <button className="print-btn" onClick={() => window?.print()}>⬇ Télécharger PDF</button>

      <div className="page">
        {/* En-tête */}
        <div className="header">
          <div className="logo-block">
            <div className="logo">
              <span className="profity">Profity</span>
              <span className="x">X</span>
            </div>
            <div className="tagline">AI TRADING SIGNALS</div>
            <div style={{ fontSize:10, color:'#8A9FB0', marginTop:4 }}>By MonWe Infinity LLC</div>
          </div>
          <div className="company-info">
            <div className="invoice-title">FACTURE</div>
            <strong>MonWe Infinity LLC</strong><br />
            1209 Mountain Road PL NE, STE R<br />
            Albuquerque, NM 87110 — USA<br />
            monweci@gmail.com<br />
            +225 05 00 44 64 64
          </div>
        </div>

        {/* Méta */}
        <div className="invoice-meta">
          <div className="meta-block">
            <label>Facturé à</label>
            <div className="value">{invoice.client_name}</div>
            <div className="sub">{invoice.client_email}</div>
            <div className="sub">{invoice.client_address}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div className="meta-block" style={{ marginBottom:12 }}>
              <label>N° Facture</label>
              <div className="value" style={{ color:'#007A52' }}>{invoice.invoice_number}</div>
            </div>
            <div className="meta-block" style={{ marginBottom:12 }}>
              <label>Date</label>
              <div className="value">{date}</div>
            </div>
            <div className="meta-block">
              <label>Statut</label>
              <span className="status-badge">✓ {invoice.status === 'paid' ? 'PAYÉE' : invoice.status.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Tableau */}
        <table className="table">
          <thead>
            <tr>
              <th>Description</th>
              <th style={{ textAlign:'right' }}>Montant FCFA</th>
              <th style={{ textAlign:'right' }}>Montant USD</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div style={{ fontWeight:700 }}>{invoice.description}</div>
                <div style={{ fontSize:12, color:'#8A9FB0', marginTop:4 }}>ProfityX — {invoice.plan.toUpperCase()} Plan</div>
                {invoice.payment_ref && <div style={{ fontSize:11, color:'#8A9FB0' }}>Réf : {invoice.payment_ref}</div>}
              </td>
              <td style={{ textAlign:'right', fontWeight:700 }}>{fmt(invoice.amount_xof)} FCFA</td>
              <td style={{ textAlign:'right', color:'#4A6070' }}>${invoice.amount_usd}</td>
            </tr>
          </tbody>
        </table>

        {/* Totaux */}
        <div className="totals">
          <div className="total-row">
            <span>Sous-total</span>
            <span>{fmt(invoice.amount_xof)} FCFA</span>
          </div>
          <div className="total-row">
            <span>TVA (0%)</span>
            <span>0 FCFA</span>
          </div>
          <div className="total-row grand">
            <span>TOTAL</span>
            <span>{fmt(invoice.amount_xof)} FCFA</span>
          </div>
        </div>

        {/* Moyen de paiement */}
        <div style={{ marginTop:28, padding:'14px 16px', background:'#F8FAFC', borderRadius:8, fontSize:13, color:'#4A6070' }}>
          <strong style={{ color:'#0D1B2A' }}>Paiement reçu via :</strong> {invoice.payment_method}
          {invoice.payment_ref && <span style={{ marginLeft:8, color:'#8A9FB0' }}>— Réf : {invoice.payment_ref}</span>}
        </div>

        {/* Pied */}
        <div className="footer">
          <div className="footer-legal">
            MonWe Infinity LLC — Société à responsabilité limitée<br />
            constituée dans l'État du Nouveau-Mexique (États-Unis)<br />
            N° de dépôt SOS : 3213688 — profity-x.com<br />
            <span style={{ marginTop:6, display:'block' }}>Merci pour votre confiance !</span>
          </div>
          <div className="footer-sig">
            <strong>Yessiha Ilboudo</strong><br />
            Gérante — MonWe Infinity LLC<br />
            monweci@gmail.com
          </div>
        </div>
      </div>
    </body>
    </html>
  )
}
