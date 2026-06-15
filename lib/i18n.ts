// ============================================================
// PROFITYX — Dictionnaire i18n centralisé
// Usage : import { t } from '@/lib/i18n'; t(locale, 'key')
// ============================================================

export type Locale = 'fr' | 'en'

const DICT: Record<string, Record<Locale, string>> = {
  // Navigation
  'nav.dashboard':    { fr: 'TABLEAU DE BORD',  en: 'DASHBOARD' },
  'nav.analysis':     { fr: 'ANALYSE IA',        en: 'AI ANALYSIS' },
  'nav.news':         { fr: 'ANNONCES MACRO',    en: 'MACRO NEWS' },
  'nav.history':      { fr: 'HISTORIQUE',        en: 'HISTORY' },
  'nav.journal':      { fr: 'JOURNAL',           en: 'JOURNAL' },
  'nav.calculator':   { fr: 'CALCULATEUR',       en: 'CALCULATOR' },
  'nav.referral':     { fr: 'PARRAINAGE',        en: 'REFERRAL' },
  'nav.settings':     { fr: 'PARAMÈTRES',        en: 'SETTINGS' },
  'nav.support':      { fr: 'ASSISTANCE',        en: 'SUPPORT' },
  'nav.leaderboard':  { fr: 'CLASSEMENT',        en: 'LEADERBOARD' },
  'nav.logout':       { fr: 'DÉCONNEXION',       en: 'LOGOUT' },
  // Actions
  'action.save':      { fr: 'SAUVEGARDER',       en: 'SAVE' },
  'action.saved':     { fr: '✓ SAUVEGARDÉ',      en: '✓ SAVED' },
  'action.cancel':    { fr: 'ANNULER',           en: 'CANCEL' },
  'action.back':      { fr: '← RETOUR',          en: '← BACK' },
  'action.analyze':   { fr: 'ANALYSER →',        en: 'ANALYZE →' },
  'action.upgrade':   { fr: 'PASSER PRO',        en: 'GO PRO' },
  'action.share':     { fr: 'PARTAGER',          en: 'SHARE' },
  'action.copy':      { fr: 'COPIER',            en: 'COPY' },
  'action.copied':    { fr: '✓ COPIÉ !',         en: '✓ COPIED!' },
  'action.loading':   { fr: 'CHARGEMENT...',     en: 'LOADING...' },
  // Status
  'status.win':       { fr: 'WIN',               en: 'WIN' },
  'status.loss':      { fr: 'LOSS',              en: 'LOSS' },
  'status.pending':   { fr: 'EN COURS',          en: 'PENDING' },
  'status.free':      { fr: 'GRATUIT',           en: 'FREE' },
  // Leaderboard
  'lb.title':         { fr: 'CLASSEMENT',        en: 'LEADERBOARD' },
  'lb.month':         { fr: 'CE MOIS',           en: 'THIS MONTH' },
  'lb.all':           { fr: 'TOUT TEMPS',        en: 'ALL TIME' },
  'lb.rank':          { fr: 'RANG',              en: 'RANK' },
  'lb.trader':        { fr: 'TRADER',            en: 'TRADER' },
  'lb.winrate':       { fr: 'WIN RATE',          en: 'WIN RATE' },
  'lb.trades':        { fr: 'TRADES',            en: 'TRADES' },
  'lb.plan':          { fr: 'PLAN',              en: 'PLAN' },
  'lb.empty':         { fr: 'Aucun trader classé ce mois — notez vos trades pour apparaître ici !', en: 'No traders ranked this month — rate your trades to appear here!' },
  // Support
  'sup.title':        { fr: 'ASSISTANCE PROFITYX', en: 'PROFITYX SUPPORT' },
  'sup.subtitle':     { fr: 'Notre équipe est disponible pour vous aider.', en: 'Our team is available to help you.' },
  'sup.whatsapp':     { fr: 'CONTACTER SUR WHATSAPP', en: 'CONTACT ON WHATSAPP' },
  'sup.hours':        { fr: 'Lun–Sam 8h–20h GMT', en: 'Mon–Sat 8am–8pm GMT' },
  'sup.email':        { fr: 'Envoyer un email', en: 'Send an email' },
  'sup.faq':          { fr: 'FAQ', en: 'FAQ' },
  // Settings
  'set.lang_reset':   { fr: '🌍 Réinitialiser le choix de langue', en: '🌍 Reset language choice' },
  'set.lang_hint':    { fr: 'Cela réaffichera le sélecteur de langue au prochain chargement.', en: 'This will show the language selector again on next load.' },
  // Journal
  'jnl.title':        { fr: 'JOURNAL DE TRADING', en: 'TRADING JOURNAL' },
  'jnl.add':          { fr: 'AJOUTER UN TRADE',   en: 'ADD A TRADE' },
  'jnl.empty':        { fr: 'Aucun trade enregistré. Notez vos trades pour gagner des crédits !', en: 'No trades recorded. Rate your trades to earn credits!' },
  'jnl.wins':         { fr: 'VICTOIRES',          en: 'WINS' },
  'jnl.losses':       { fr: 'DÉFAITES',           en: 'LOSSES' },
  'jnl.winrate':      { fr: 'WIN RATE',           en: 'WIN RATE' },
  'jnl.streak':       { fr: 'SÉRIE',              en: 'STREAK' },
  // History
  'hist.title':       { fr: 'HISTORIQUE',         en: 'HISTORY' },
  'hist.empty':       { fr: 'Aucune analyse effectuée.', en: 'No analyses yet.' },
  'hist.date':        { fr: 'DATE',               en: 'DATE' },
  'hist.pair':        { fr: 'ACTIF',              en: 'ASSET' },
  'hist.direction':   { fr: 'DIRECTION',          en: 'DIRECTION' },
  'hist.entry':       { fr: 'ENTRÉE',             en: 'ENTRY' },
  // Referral
  'ref.title':        { fr: 'PARRAINAGE',         en: 'REFERRAL' },
  'ref.subtitle':     { fr: 'Invitez vos amis et gagnez des crédits !', en: 'Invite friends and earn credits!' },
  'ref.your_link':    { fr: 'VOTRE LIEN',         en: 'YOUR LINK' },
  'ref.credits_earned': { fr: 'CRÉDITS GAGNÉS',  en: 'CREDITS EARNED' },
  'ref.friends':      { fr: 'AMIS INVITÉS',       en: 'FRIENDS INVITED' },
}

export function t(locale: string, key: string): string {
  const lang = (locale === 'en' ? 'en' : 'fr') as Locale
  return DICT[key]?.[lang] ?? DICT[key]?.['fr'] ?? key
}

export function getLang(): Locale {
  try {
    const stored = localStorage.getItem('pxLang')
    if (stored === 'en') return 'en'
  } catch {}
  return 'fr'
}
