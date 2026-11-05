// ============================================================
// PROFITYX — Envoi d'emails transactionnels via Resend
// Côté serveur uniquement (route handlers, cron). Ne pas importer
// depuis un composant client : la clé RESEND_API_KEY ne doit pas sortir.
// ============================================================

import { Resend } from 'resend'
import { renderEmail, type EmailTemplate, type EmailLocale } from '@/lib/email-templates'

export type { EmailTemplate } from '@/lib/email-templates'

// Expéditeur : doit être un domaine vérifié dans Resend.
const DEFAULT_FROM = 'ProfityX <noreply@profity-x.com>'

let client: Resend | null = null

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (!client) client = new Resend(key)
  return client
}

export async function sendEmail(opts: {
  template: EmailTemplate
  to: string
  name?: string
  locale?: EmailLocale
  data?: Record<string, string>
}): Promise<boolean> {
  const resend = getClient()
  if (!resend) {
    console.error('[email] RESEND_API_KEY manquante, email non envoyé:', opts.template)
    return false
  }

  try {
    const locale: EmailLocale = opts.locale === 'en' ? 'en' : 'fr'
    const { subject, html, text } = renderEmail(opts.template, {
      name: opts.name,
      locale,
      data: opts.data,
    })

    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || DEFAULT_FROM,
      to: opts.to,
      subject,
      html,
      text,
      tags: [{ name: 'template', value: opts.template }],
    })

    if (error) {
      console.error('[email] Resend:', error.name, error.message)
      return false
    }
    return true
  } catch (e) {
    console.error('[email] envoi échoué:', e)
    return false
  }
}
