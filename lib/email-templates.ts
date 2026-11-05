// ============================================================
// PROFITYX — Modèles d'emails transactionnels (FR / EN)
// Rendu HTML inline, thème sombre aligné sur emails/*.html.
// Toutes les valeurs dynamiques sont échappées.
// ============================================================

export type EmailLocale = 'fr' | 'en'

export type EmailTemplate =
  | 'welcome'
  | 'confirm'
  | 'reset'
  | 'plan_activated'
  | 'low_credits'
  | 'referral'
  | 'reactivation'
  | 'invoice'
  | 'checkout_abandoned'
  | 'seq_j1'
  | 'seq_j3'
  | 'seq_j7'
  | 'seq_j14'

export interface TemplateInput {
  name?: string
  locale: EmailLocale
  data?: Record<string, string>
}

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://profity-x.com'

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Contenu d'un modèle : sujet, titre, paragraphes, bouton optionnel. */
interface Content {
  subject: string
  heading: string
  paragraphs: string[]   // texte brut, échappé au rendu
  cta?: { label: string; url: string }
  note?: string
}

const DASHBOARD = (locale: EmailLocale) => `${SITE_URL}/${locale}/dashboard`
const PRICING = (locale: EmailLocale) => `${SITE_URL}/${locale}/pricing`

type Builder = (i: TemplateInput, t: (fr: string, en: string) => string, name: string, d: Record<string, string>) => Content

const BUILDERS: Record<EmailTemplate, Builder> = {
  welcome: (i, t, name) => ({
    subject: t('Bienvenue sur ProfityX', 'Welcome to ProfityX'),
    heading: t(`Bienvenue, ${name} !`, `Welcome, ${name}!`),
    paragraphs: [
      t(
        'Ton compte est prêt. Envoie ton premier graphique pour recevoir une analyse SMC complète.',
        'Your account is ready. Upload your first chart to get a full SMC analysis.',
      ),
    ],
    cta: { label: t('Ouvrir mon tableau de bord', 'Open my dashboard'), url: DASHBOARD(i.locale) },
  }),

  confirm: (i, t, name, d) => ({
    subject: t('Confirme ton adresse email', 'Confirm your email address'),
    heading: t('Confirme ton email', 'Confirm your email'),
    paragraphs: [
      t(`Bonjour ${name}, clique sur le bouton ci-dessous pour activer ton compte.`,
        `Hi ${name}, click the button below to activate your account.`),
    ],
    cta: { label: t('Confirmer mon email', 'Confirm my email'), url: d.confirm_url ?? SITE_URL },
    note: t('Si tu n\'es pas à l\'origine de cette demande, ignore cet email.',
      'If you did not request this, you can ignore this email.'),
  }),

  reset: (i, t, name, d) => ({
    subject: t('Réinitialisation de ton mot de passe', 'Reset your password'),
    heading: t('Réinitialise ton mot de passe', 'Reset your password'),
    paragraphs: [
      t(`Bonjour ${name}, tu as demandé à réinitialiser ton mot de passe.`,
        `Hi ${name}, you asked to reset your password.`),
    ],
    cta: { label: t('Choisir un nouveau mot de passe', 'Choose a new password'), url: d.reset_url ?? SITE_URL },
    note: t('Ce lien expire bientôt. Si tu n\'as rien demandé, ignore cet email.',
      'This link expires soon. If you did not ask for it, ignore this email.'),
  }),

  plan_activated: (i, t, name, d) => ({
    subject: t(`Ton plan ${d.plan ?? ''} est activé`, `Your ${d.plan ?? ''} plan is active`),
    heading: t('Ton abonnement est actif', 'Your subscription is active'),
    paragraphs: [
      t(`Merci ${name}. Ton plan ${d.plan ?? ''} est activé et tes crédits sont disponibles.`,
        `Thanks ${name}. Your ${d.plan ?? ''} plan is active and your credits are available.`),
      d.credits ? t(`Crédits ajoutés : ${d.credits}`, `Credits added: ${d.credits}`) : '',
    ].filter(Boolean),
    cta: { label: t('Accéder au tableau de bord', 'Go to dashboard'), url: DASHBOARD(i.locale) },
  }),

  low_credits: (i, t, name, d) => ({
    subject: t('Il te reste peu de crédits', 'You are running low on credits'),
    heading: t('Crédits bientôt épuisés', 'Credits running low'),
    paragraphs: [
      t(`Bonjour ${name}, il ne te reste que ${d.balance ?? 'quelques'} crédit(s).`,
        `Hi ${name}, you only have ${d.balance ?? 'a few'} credit(s) left.`),
    ],
    cta: { label: t('Recharger mes crédits', 'Top up my credits'), url: PRICING(i.locale) },
  }),

  referral: (i, t, name) => ({
    subject: t('Un filleul a rejoint ProfityX grâce à toi', 'Someone joined ProfityX through your link'),
    heading: t('Parrainage validé', 'Referral confirmed'),
    paragraphs: [
      t(`Bonjour ${name}, un nouveau trader s'est inscrit avec ton code de parrainage.`,
        `Hi ${name}, a new trader signed up with your referral code.`),
    ],
    cta: { label: t('Voir mes parrainages', 'View my referrals'), url: `${DASHBOARD(i.locale)}` },
  }),

  reactivation: (i, t, name, d) => ({
    subject: t('Tu nous manques, ton analyse t\'attend', 'We miss you, your analysis is waiting'),
    heading: t('Reviens analyser les marchés', 'Come back and analyse the markets'),
    paragraphs: [
      t(`Bonjour ${name}, tu as encore ${d.balance ?? '0'} crédit(s) disponibles.`,
        `Hi ${name}, you still have ${d.balance ?? '0'} credit(s) available.`),
    ],
    cta: { label: t('Lancer une analyse', 'Run an analysis'), url: `${SITE_URL}/${i.locale}/analysis` },
  }),

  invoice: (i, t, name, d) => ({
    subject: t(`Ta facture ${d.invoice_number ?? ''}`, `Your invoice ${d.invoice_number ?? ''}`),
    heading: t('Facture disponible', 'Invoice available'),
    paragraphs: [
      t(`Bonjour ${name}, voici le détail de ta facture.`, `Hi ${name}, here are your invoice details.`),
      `${t('Numéro', 'Number')} : ${d.invoice_number ?? '—'}`,
      `${t('Plan', 'Plan')} : ${d.plan ?? '—'}`,
      `${t('Montant', 'Amount')} : ${d.amount_xof ?? '—'} XOF (${d.amount_usd ?? '—'} USD)`,
      `${t('Date', 'Date')} : ${d.date ?? '—'}`,
      d.payment_method ? `${t('Paiement', 'Payment')} : ${d.payment_method}` : '',
    ].filter(Boolean),
    cta: d.invoice_url ? { label: t('Voir la facture', 'View invoice'), url: d.invoice_url } : undefined,
  }),

  checkout_abandoned: (i, t, name, d) => ({
    subject: t('Ton abonnement t\'attend', 'Your subscription is waiting'),
    heading: t('Tu n\'as pas fini ton paiement', 'You did not finish your payment'),
    paragraphs: [
      t(`Bonjour ${name}, ton passage au plan ${d.plan ?? ''} n'a pas été finalisé.`,
        `Hi ${name}, your upgrade to the ${d.plan ?? ''} plan was not completed.`),
    ],
    cta: { label: t('Reprendre mon abonnement', 'Resume my subscription'), url: PRICING(i.locale) },
  }),

  seq_j1: (i, t, name) => ({
    subject: t('Ton premier signal en 3 étapes', 'Your first signal in 3 steps'),
    heading: t('Démarre en 3 étapes', 'Get started in 3 steps'),
    paragraphs: [
      t(`${name}, 1) envoie un graphique, 2) lis le biais et les zones clés, 3) note ton plan de trade.`,
        `${name}, 1) upload a chart, 2) read the bias and key zones, 3) note your trade plan.`),
    ],
    cta: { label: t('Analyser un graphique', 'Analyse a chart'), url: `${SITE_URL}/${i.locale}/analysis` },
  }),

  seq_j3: (i, t, name) => ({
    subject: t('Le journal de trading, ton meilleur allié', 'The trading journal, your best ally'),
    heading: t('Suis tes trades', 'Track your trades'),
    paragraphs: [
      t(`${name}, note chaque trade dans ton journal pour repérer tes forces et tes erreurs.`,
        `${name}, log each trade in your journal to spot your strengths and mistakes.`),
    ],
    cta: { label: t('Ouvrir le journal', 'Open the journal'), url: `${SITE_URL}/${i.locale}/journal` },
  }),

  seq_j7: (i, t, name) => ({
    subject: t('Passe au niveau supérieur', 'Level up'),
    heading: t('Débloque plus d\'analyses', 'Unlock more analyses'),
    paragraphs: [
      t(`${name}, les plans Pro et Elite donnent plus d'analyses et des fonctions avancées.`,
        `${name}, the Pro and Elite plans give you more analyses and advanced features.`),
    ],
    cta: { label: t('Voir les plans', 'See plans'), url: PRICING(i.locale) },
  }),

  seq_j14: (i, t, name) => ({
    subject: t('Dernier rappel', 'Last reminder'),
    heading: t('On reste disponible pour toi', 'We are still here for you'),
    paragraphs: [
      t(`${name}, ton compte ProfityX reste actif. Reviens quand tu veux analyser un marché.`,
        `${name}, your ProfityX account is still active. Come back whenever you want to analyse a market.`),
    ],
    cta: { label: t('Revenir sur ProfityX', 'Back to ProfityX'), url: DASHBOARD(i.locale) },
  }),
}

function layout(c: Content, locale: EmailLocale): string {
  const cta = c.cta
    ? `<a class="btn" href="${esc(c.cta.url)}" style="display:block;background:#00FFB2;color:#020408;text-align:center;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:700;">${esc(c.cta.label)}</a>`
    : ''
  const paragraphs = c.paragraphs
    .map(p => `<p style="font-size:15px;color:#a9b6c6;line-height:1.7;margin:0 0 16px;">${esc(p)}</p>`)
    .join('')
  const note = c.note
    ? `<p style="font-size:12px;color:#6b7a8c;line-height:1.6;margin:24px 0 0;">${esc(c.note)}</p>`
    : ''
  const footer = locale === 'en'
    ? 'You receive this email because you have a ProfityX account.'
    : 'Tu reçois cet email car tu as un compte ProfityX.'
  return `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${esc(c.subject)}</title></head>
<body style="margin:0;background:#0A0F1A;font-family:'Segoe UI',Arial,sans-serif;color:#E8F4F8;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:26px;font-weight:900;letter-spacing:2px;color:#00FFB2;font-family:monospace;">PROFITY<span style="color:#00D4FF;">X</span></span>
    </div>
    <div style="background:#0D1420;border:1px solid rgba(0,255,178,0.15);border-radius:14px;overflow:hidden;">
      <div style="height:3px;background:linear-gradient(90deg,transparent,#00FFB2,#00D4FF,transparent);"></div>
      <div style="padding:36px 32px;">
        <h1 style="font-size:22px;font-weight:700;color:#E8F4F8;margin:0 0 12px;">${esc(c.heading)}</h1>
        ${paragraphs}
        ${cta ? `<div style="margin-top:24px;">${cta}</div>` : ''}
        ${note}
      </div>
    </div>
    <p style="text-align:center;margin-top:28px;font-size:12px;color:#4b5a6b;line-height:1.6;">${footer}<br/><a href="${SITE_URL}" style="color:#00FFB2;text-decoration:none;">profity-x.com</a></p>
  </div>
</body>
</html>`
}

function toText(c: Content): string {
  const lines = [c.heading, '', ...c.paragraphs]
  if (c.cta) lines.push('', `${c.cta.label}: ${c.cta.url}`)
  if (c.note) lines.push('', c.note)
  return lines.join('\n')
}

/** Rend un modèle en sujet + HTML + texte brut. */
export function renderEmail(template: EmailTemplate, input: TemplateInput): RenderedEmail {
  const locale: EmailLocale = input.locale === 'en' ? 'en' : 'fr'
  const t = (fr: string, en: string) => (locale === 'en' ? en : fr)
  // Pas d'échappement ici : layout() échappe déjà chaque paragraphe.
  const name = input.name?.trim() || 'trader'
  const d = input.data ?? {}
  const build = BUILDERS[template]
  if (!build) throw new Error(`Modèle d'email inconnu : ${template}`)
  const content = build({ ...input, locale }, t, name, d)
  return {
    subject: content.subject,
    html: layout(content, locale),
    text: toText(content),
  }
}
