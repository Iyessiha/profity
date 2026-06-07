// ============================================================
// PROFITYX — Client email via Edge Function send-email
// ============================================================

const EDGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`

export type EmailTemplate =
  | 'welcome'
  | 'confirm'
  | 'reset'
  | 'plan_activated'
  | 'low_credits'
  | 'referral'
  | 'reactivation'

export async function sendEmail(opts: {
  template: EmailTemplate
  to: string
  name?: string
  data?: Record<string, string>
}): Promise<boolean> {
  try {
    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts),
    })
    const json = await res.json()
    if (!json.success) console.error('[email]', json.error)
    return json.success === true
  } catch (e) {
    console.error('[email] fetch error:', e)
    return false
  }
}
