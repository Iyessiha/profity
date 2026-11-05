import { describe, it, expect } from 'vitest'
import { renderEmail, type EmailTemplate } from '@/lib/email-templates'

const ALL: EmailTemplate[] = [
  'welcome', 'confirm', 'reset', 'plan_activated', 'low_credits', 'referral',
  'reactivation', 'invoice', 'checkout_abandoned', 'seq_j1', 'seq_j3', 'seq_j7', 'seq_j14',
]

describe('renderEmail', () => {
  it.each(ALL)('renders %s in fr and en with a subject and html', (tpl) => {
    for (const locale of ['fr', 'en'] as const) {
      const out = renderEmail(tpl, { name: 'Awa', locale, data: {} })
      expect(out.subject.length).toBeGreaterThan(0)
      expect(out.html).toContain('<!DOCTYPE html>')
      expect(out.text.length).toBeGreaterThan(0)
    }
  })

  it('escapes user-supplied names and data in html', () => {
    const out = renderEmail('welcome', {
      name: '<script>alert(1)</script>',
      locale: 'fr',
    })
    expect(out.html).not.toContain('<script>alert(1)</script>')
    expect(out.html).toContain('&lt;script&gt;')
  })

  it('does not double-escape ampersands in names', () => {
    const out = renderEmail('welcome', { name: 'Tom & Jerry', locale: 'fr' })
    expect(out.html).toContain('Tom &amp; Jerry')
    expect(out.html).not.toContain('&amp;amp;')
  })

  it('uses the English copy when locale is en', () => {
    const out = renderEmail('welcome', { name: 'Awa', locale: 'en' })
    expect(out.subject).toBe('Welcome to ProfityX')
  })

  it('includes the invoice button only when a URL is provided', () => {
    const without = renderEmail('invoice', { locale: 'fr', data: { invoice_number: 'PX-1' } })
    const withUrl = renderEmail('invoice', {
      locale: 'fr',
      data: { invoice_number: 'PX-1', invoice_url: 'https://profity-x.com/invoice/abc' },
    })
    expect(without.html).not.toContain('Voir la facture')
    expect(withUrl.html).toContain('https://profity-x.com/invoice/abc')
  })
})
