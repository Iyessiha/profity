'use client'
export const dynamic = 'force-dynamic'
// ============================================================
// PROFITYX — /guide : Guide visuel interactif
// Aide les traders à maîtriser chaque outil de la plateforme
// ============================================================
import { useState, useEffect } from 'react'
import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'
import { QuotaBar } from '@/components/dashboard/TopBar'
import { supabasePublic } from '@/lib/supabase'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

// ── Données du guide ──────────────────────────────────────────
const TOOLS = [
  {
    id: 'analyse',
    icon: '🔍',
    color: '#00FFB2',
    titleFr: 'Analyse IA',
    titleEn: 'AI Analysis',
    descFr: 'Uploadez votre chart et obtenez une analyse SMC complète en secondes.',
    descEn: 'Upload your chart and get a complete SMC analysis in seconds.',
    badge: 'CORE',
    stepsFr: [
      { icon: '📸', title: 'Uploader votre chart', desc: 'Faites une capture depuis TradingView (ou votre broker). Format PNG ou JPG, avec les chandeliers visibles.' },
      { icon: '🎯', title: 'Choisir le timeframe', desc: 'Sélectionnez le timeframe de votre chart (H1, H4, D1…). Plus c\'est précis, meilleure est l\'analyse.' },
      { icon: '🤖', title: 'Lancer l\'analyse', desc: 'Cliquez sur "ANALYSER". L\'IA identifie la tendance, les zones SMC, l\'entrée, le SL et les TP.' },
      { icon: '📊', title: 'Lire le signal', desc: 'Consultez la direction (BUY/SELL), le niveau d\'entrée, le stop loss, les take profits et le R/R.' },
      { icon: '⭐', title: 'Noter le résultat', desc: 'Après la clôture du trade, notez WIN ou LOSS. Ça alimente votre track record et vos statistiques.' },
    ],
    stepsEn: [
      { icon: '📸', title: 'Upload your chart', desc: 'Take a screenshot from TradingView (or your broker). PNG or JPG format, with candlesticks visible.' },
      { icon: '🎯', title: 'Choose the timeframe', desc: 'Select your chart timeframe (H1, H4, D1…). The more precise, the better the analysis.' },
      { icon: '🤖', title: 'Launch the analysis', desc: 'Click "ANALYZE". The AI identifies the trend, SMC zones, entry, SL and TPs.' },
      { icon: '📊', title: 'Read the signal', desc: 'Check the direction (BUY/SELL), entry level, stop loss, take profits and R/R ratio.' },
      { icon: '⭐', title: 'Rate the result', desc: 'After the trade closes, rate it WIN or LOSS. This builds your track record and statistics.' },
    ],
    tipFr: '💡 Conseil : Analysez sur H4 ou D1 pour obtenir la tendance principale, puis affinez sur H1 pour l\'entrée.',
    tipEn: '💡 Tip: Analyze on H4 or D1 for the main trend, then refine on H1 for the entry.',
  },
  {
    id: 'journal',
    icon: '📒',
    color: '#00D4FF',
    titleFr: 'Journal de Trading',
    titleEn: 'Trading Journal',
    badge: 'NEW',
    descFr: 'Enregistrez chaque trade, suivez vos émotions et identifiez vos patterns gagnants.',
    descEn: 'Log every trade, track your emotions and identify your winning patterns.',
    stepsFr: [
      { icon: '✏️', title: 'Créer une entrée', desc: 'Cliquez sur "+ Nouveau trade" et remplissez la paire, la direction et la date d\'entrée.' },
      { icon: '😤', title: 'Noter vos émotions', desc: 'Évaluez votre état émotionnel avant le trade (calme, stressé, euphorique). C\'est la clé de la discipline.' },
      { icon: '📷', title: 'Attacher le chart', desc: 'Sauvegardez une capture du setup avant d\'entrer en position. Vous pouvez la revoir après.' },
      { icon: '🎯', title: 'Documenter la stratégie', desc: 'Notez pourquoi vous prenez ce trade. Zone SMC ? Breakout ? Reversal ? Soyez précis.' },
      { icon: '📈', title: 'Analyser vos stats', desc: 'Le journal calcule automatiquement votre win rate, R/R moyen et vos meilleures sessions.' },
    ],
    stepsEn: [
      { icon: '✏️', title: 'Create an entry', desc: 'Click "+ New trade" and fill in the pair, direction and entry date.' },
      { icon: '😤', title: 'Log your emotions', desc: 'Rate your emotional state before the trade (calm, stressed, euphoric). This is the key to discipline.' },
      { icon: '📷', title: 'Attach the chart', desc: 'Save a screenshot of the setup before entering. You can review it afterwards.' },
      { icon: '🎯', title: 'Document the strategy', desc: 'Note why you\'re taking this trade. SMC zone? Breakout? Reversal? Be precise.' },
      { icon: '📈', title: 'Analyze your stats', desc: 'The journal automatically calculates your win rate, average R/R and best sessions.' },
    ],
    tipFr: '💡 Conseil : Écrivez dans votre journal AVANT d\'entrer en position, pas après. Ça évite le biais rétrospectif.',
    tipEn: '💡 Tip: Write in your journal BEFORE entering a position, not after. This avoids hindsight bias.',
  },
  {
    id: 'propfirm',
    icon: '🏦',
    color: '#C9A84C',
    titleFr: 'Outils Prop Firm',
    titleEn: 'Prop Firm Tools',
    badge: 'ELITE',
    descFr: 'Surveillez vos règles de challenge en temps réel et ne jamais dépasser vos limites.',
    descEn: 'Monitor your challenge rules in real time and never exceed your limits.',
    stepsFr: [
      { icon: '🏢', title: 'Ajouter votre compte', desc: 'Sélectionnez votre prop firm (FTMO, E8, MyForexFunds…) ou créez un compte custom avec vos règles.' },
      { icon: '💰', title: 'Entrer la taille du compte', desc: 'Indiquez le capital fourni (ex: 10 000$). Les limites absolues sont calculées automatiquement.' },
      { icon: '📊', title: 'Suivre vos limites', desc: 'Profit target, drawdown max, daily loss — 3 barres de progression mises à jour à chaque analyse.' },
      { icon: '⚠️', title: 'Recevoir les alertes', desc: 'Dès que vous approchez de 80% d\'une limite, vous recevez une notification dans le dashboard.' },
      { icon: '🔗', title: 'Liaison automatique', desc: 'Chaque analyse IA déduit automatiquement le risque estimé de votre daily loss. Zéro saisie manuelle.' },
    ],
    stepsEn: [
      { icon: '🏢', title: 'Add your account', desc: 'Select your prop firm (FTMO, E8, MyForexFunds…) or create a custom account with your rules.' },
      { icon: '💰', title: 'Enter account size', desc: 'Enter the funded capital (e.g., $10,000). Absolute limits are calculated automatically.' },
      { icon: '📊', title: 'Track your limits', desc: 'Profit target, max drawdown, daily loss — 3 progress bars updated with each analysis.' },
      { icon: '⚠️', title: 'Receive alerts', desc: 'When you approach 80% of any limit, you get a notification in the dashboard.' },
      { icon: '🔗', title: 'Automatic link', desc: 'Each AI analysis automatically deducts the estimated risk from your daily loss. Zero manual entry.' },
    ],
    tipFr: '💡 Conseil : Mettez à jour votre solde chaque jour avant de trader. Le score de sécurité vous dira si c\'est sûr de continuer.',
    tipEn: '💡 Tip: Update your balance every day before trading. The safety score tells you whether it\'s safe to continue.',
  },
  {
    id: 'calculator',
    icon: '🧮',
    color: '#FF9F43',
    titleFr: 'Calculateur de Risque',
    titleEn: 'Risk Calculator',
    badge: 'PRO',
    descFr: 'Calculez votre taille de position idéale avant chaque trade.',
    descEn: 'Calculate your ideal position size before every trade.',
    stepsFr: [
      { icon: '💵', title: 'Entrer votre capital', desc: 'Indiquez votre solde de compte actuel. Il est sauvegardé pour la prochaine session.' },
      { icon: '📉', title: 'Définir le risque %', desc: 'Choisissez combien vous risquez par trade (recommandé : 0.5% à 1% maximum en prop firm).' },
      { icon: '📍', title: 'Entrer le SL en pips', desc: 'Mesurez la distance entre votre entrée et votre stop loss sur le chart, en pips.' },
      { icon: '📐', title: 'Obtenir la taille de lot', desc: 'Le calculateur vous donne le nombre de lots exact pour respecter votre risque défini.' },
      { icon: '✅', title: 'Vérifier le RR', desc: 'Comparez le risque en dollars avec votre TP cible pour confirmer que le R/R vaut le coup.' },
    ],
    stepsEn: [
      { icon: '💵', title: 'Enter your capital', desc: 'Enter your current account balance. It\'s saved for your next session.' },
      { icon: '📉', title: 'Set risk %', desc: 'Choose how much you risk per trade (recommended: 0.5% to 1% max in prop firm).' },
      { icon: '📍', title: 'Enter SL in pips', desc: 'Measure the distance between your entry and stop loss on the chart, in pips.' },
      { icon: '📐', title: 'Get lot size', desc: 'The calculator gives you the exact lot size to respect your defined risk.' },
      { icon: '✅', title: 'Check the RR', desc: 'Compare the dollar risk with your TP target to confirm the R/R is worth it.' },
    ],
    tipFr: '💡 Conseil : Ne jamais risquer plus de 1% par trade en challenge prop firm. 0.5% est encore mieux.',
    tipEn: '💡 Tip: Never risk more than 1% per trade in a prop firm challenge. 0.5% is even better.',
  },
  {
    id: 'history',
    icon: '📜',
    color: '#A29BFE',
    titleFr: 'Historique & Résultats',
    titleEn: 'History & Results',
    badge: null,
    descFr: 'Consultez toutes vos analyses passées et partagez vos meilleurs signaux.',
    descEn: 'View all your past analyses and share your best signals.',
    stepsFr: [
      { icon: '🔍', title: 'Filtrer vos analyses', desc: 'Filtrez par paire, direction ou résultat (WIN/LOSS). Identifiez vos patterns les plus profitables.' },
      { icon: '👁️', title: 'Voir le détail', desc: 'Cliquez sur une analyse pour voir tous les niveaux SMC, l\'entrée exacte, le SL et les TP.' },
      { icon: '⭐', title: 'Noter les trades', desc: 'Marquez chaque analyse WIN ou LOSS une fois le trade terminé pour alimenter vos stats.' },
      { icon: '🌐', title: 'Partager publiquement', desc: 'Activez 🌐 sur les analyses dont vous êtes fier. Elles apparaissent sur /results.' },
      { icon: '📤', title: 'Partager sur les réseaux', desc: 'Bouton de partage direct vers WhatsApp, Telegram, X et Facebook.' },
    ],
    stepsEn: [
      { icon: '🔍', title: 'Filter your analyses', desc: 'Filter by pair, direction or result (WIN/LOSS). Identify your most profitable patterns.' },
      { icon: '👁️', title: 'View details', desc: 'Click an analysis to see all SMC levels, exact entry, SL and TPs.' },
      { icon: '⭐', title: 'Rate trades', desc: 'Mark each analysis WIN or LOSS once the trade closes to feed your stats.' },
      { icon: '🌐', title: 'Share publicly', desc: 'Enable 🌐 on analyses you\'re proud of. They appear on /results.' },
      { icon: '📤', title: 'Share on social', desc: 'Direct share button to WhatsApp, Telegram, X and Facebook.' },
    ],
    tipFr: '💡 Conseil : Revoyez votre historique chaque semaine. Les patterns de vos pertes vous révèlent vos biais cognitifs.',
    tipEn: '💡 Tip: Review your history every week. The patterns in your losses reveal your cognitive biases.',
  },
  {
    id: 'news',
    icon: '📰',
    color: '#FF6B6B',
    titleFr: 'Annonces Macro',
    titleEn: 'Macro News',
    badge: 'LIVE',
    descFr: 'Suivez les événements économiques majeurs qui impactent vos paires.',
    descEn: 'Track major economic events that impact your pairs.',
    stepsFr: [
      { icon: '🗓️', title: 'Consulter le calendrier', desc: 'Le calendrier économique liste les publications de la semaine : NFP, CPI, taux directeurs, PIB…' },
      { icon: '🔴', title: 'Identifier l\'impact', desc: 'Les événements High Impact (rouge) sont les plus volatils. Évitez de trader 15 min avant et après.' },
      { icon: '⏰', title: 'Configurer des alertes', desc: 'Ajoutez des rappels pour les événements importants dans vos paramètres de notifications.' },
      { icon: '🎯', title: 'Adapter votre stratégie', desc: 'Sur les grosses news, élargissez votre SL ou restez en dehors du marché jusqu\'à la confirmation.' },
    ],
    stepsEn: [
      { icon: '🗓️', title: 'Check the calendar', desc: 'The economic calendar lists this week\'s publications: NFP, CPI, interest rates, GDP…' },
      { icon: '🔴', title: 'Identify the impact', desc: 'High Impact events (red) are the most volatile. Avoid trading 15 min before and after.' },
      { icon: '⏰', title: 'Set alerts', desc: 'Add reminders for important events in your notification settings.' },
      { icon: '🎯', title: 'Adapt your strategy', desc: 'On major news, widen your SL or stay out of the market until confirmation.' },
    ],
    tipFr: '💡 Conseil : Le NFP (premier vendredi du mois) et les décisions de la Fed sont les événements les plus impactants sur Forex.',
    tipEn: '💡 Tip: NFP (first Friday of the month) and Fed decisions are the most impactful events on Forex.',
  },
]

const FAQ = {
  fr: [
    { q: 'Combien de crédits coûte une analyse ?', a: 'Chaque analyse IA consomme 1 crédit. Les plans PRO et ELITE incluent des crédits mensuels illimités.' },
    { q: 'L\'IA peut se tromper ?', a: 'Oui. L\'IA est un outil d\'aide à la décision, pas un oracle. Validez toujours le signal avec votre propre analyse avant de trader.' },
    { q: 'Mes données sont-elles privées ?', a: 'Oui. Vos analyses sont privées par défaut. Vous choisissez explicitement lesquelles partager sur /results.' },
    { q: 'Puis-je utiliser ProfityX sur mobile ?', a: 'Oui, ProfityX est optimisé pour mobile. Vous pouvez même l\'ajouter à votre écran d\'accueil depuis Safari ou Chrome.' },
    { q: 'Comment annuler mon abonnement ?', a: 'Depuis Paramètres → Abonnement. Votre accès reste actif jusqu\'à la fin de la période en cours.' },
  ],
  en: [
    { q: 'How many credits does an analysis cost?', a: 'Each AI analysis uses 1 credit. PRO and ELITE plans include unlimited monthly credits.' },
    { q: 'Can the AI be wrong?', a: 'Yes. The AI is a decision-support tool, not an oracle. Always validate the signal with your own analysis before trading.' },
    { q: 'Is my data private?', a: 'Yes. Your analyses are private by default. You explicitly choose which ones to share on /results.' },
    { q: 'Can I use ProfityX on mobile?', a: 'Yes, ProfityX is mobile-optimized. You can even add it to your home screen from Safari or Chrome.' },
    { q: 'How do I cancel my subscription?', a: 'From Settings → Subscription. Your access remains active until the end of the current period.' },
  ],
}

export default function GuidePage() {
  const [token,   setToken]   = useState('')
  const [profile, setProfile] = useState<Record<string,unknown>|null>(null)
  const [plan,    setPlan]    = useState('free')
  const [locale,  setLocale]  = useState('fr')
  const [active,  setActive]  = useState('analyse')
  const [step,    setStep]    = useState(0)
  const [openFaq, setOpenFaq] = useState<number|null>(null)

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabasePublic.auth.getSession()
      if (!session) { window.location.href = '/auth/login'; return }
      setToken(session.access_token)
      const { data: p } = await supabasePublic.from('profiles').select('*').eq('id', session.user.id).single()
      if (p) { setProfile(p); setPlan(p.user_plan as string || 'free'); setLocale(p.locale as string || 'fr') }
    })()
  }, [])

  const tool  = TOOLS.find(t => t.id === active) ?? TOOLS[0]
  const steps = locale === 'en' ? tool.stepsEn : tool.stepsFr
  const faq   = locale === 'en' ? FAQ.en : FAQ.fr

  const T = {
    title:   locale === 'en' ? 'USER GUIDE'        : 'GUIDE UTILISATEUR',
    sub:     locale === 'en' ? 'Master every tool in a few minutes.' : 'Maîtrisez chaque outil en quelques minutes.',
    tools:   locale === 'en' ? 'TOOLS'             : 'OUTILS',
    howto:   locale === 'en' ? 'HOW IT WORKS'      : 'COMMENT ÇA MARCHE',
    faqLbl:  locale === 'en' ? 'FREQUENTLY ASKED'  : 'QUESTIONS FRÉQUENTES',
    start:   locale === 'en' ? 'START NOW →'       : 'COMMENCER →',
    next:    locale === 'en' ? 'NEXT →'            : 'SUIVANT →',
    prev:    locale === 'en' ? '← BACK'            : '← RETOUR',
    done:    locale === 'en' ? '✓ DONE!'           : '✓ COMPRIS !',
    step:    locale === 'en' ? 'Step'              : 'Étape',
  }

  const badgeStyle = (badge: string | null): React.CSSProperties => {
    if (!badge) return {}
    const map: Record<string, React.CSSProperties> = {
      CORE:  { background: '#00FFB2', color: '#020408' },
      NEW:   { background: '#00FFB2', color: '#020408' },
      LIVE:  { background: '#FF6B35', color: '#fff' },
      PRO:   { background: 'rgba(201,168,76,0.2)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.4)' },
      ELITE: { background: 'linear-gradient(135deg,rgba(201,168,76,0.28),rgba(255,200,80,0.12))', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.55)' },
    }
    return map[badge] ?? {}
  }

  return (
    <div className="app-shell">
      <Sidebar tab={'chart' as any} setTab={() => {}} plan={plan} locale={locale} />
      <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'var(--bg0)', width:'100%', overflow:'hidden' }}>
        <TopBar locale={locale} profile={profile} />
        <QuotaBar token={token} locale={locale} plan={plan} />

        <div className="resp-pad" style={{ padding:'1.5rem', flex:1, overflowX:'hidden' }}>
          <div style={{ maxWidth:960, margin:'0 auto' }}>

            {/* Header */}
            <div style={{ textAlign:'center', marginBottom:'2rem' }}>
              <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:3, color:'var(--ac2)', marginBottom:8 }}>PROFITYX</div>
              <h1 style={{ fontFamily:HUD, fontSize:'clamp(20px,4vw,34px)', fontWeight:900, color:'var(--tx0)', marginBottom:8 }}>
                {T.title}
              </h1>
              <p style={{ fontFamily:BODY, fontSize:14, color:'var(--tx3)', maxWidth:500, margin:'0 auto' }}>{T.sub}</p>
            </div>

            {/* Sélecteur d'outil */}
            <div style={{ marginBottom:'1.5rem' }}>
              <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'var(--tx3)', marginBottom:'0.75rem' }}>{T.tools}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {TOOLS.map(t => (
                  <button key={t.id} onClick={() => { setActive(t.id); setStep(0) }} style={{
                    display:'flex', alignItems:'center', gap:6,
                    padding:'9px 14px', borderRadius:8, cursor:'pointer',
                    background: active === t.id ? `${t.color}15` : 'var(--bg1)',
                    border: `1px solid ${active === t.id ? t.color + '40' : 'var(--bd)'}`,
                    fontFamily:HUD, fontSize:8, letterSpacing:1,
                    color: active === t.id ? t.color : 'var(--tx2)',
                    fontWeight: active === t.id ? 700 : 400,
                    transition:'all .2s',
                  }}>
                    <span style={{ fontSize:14 }}>{t.icon}</span>
                    <span className="sidebar-label">{locale === 'en' ? t.titleEn : t.titleFr}</span>
                    {t.badge && (
                      <span style={{ fontFamily:HUD, fontSize:6, letterSpacing:1, padding:'2px 6px', borderRadius:3, ...badgeStyle(t.badge) }}>
                        {t.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Corps : description + steps */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:'1.5rem' }}>

              {/* Description de l'outil */}
              <div style={{ background:'var(--bg1)', border:`1px solid ${tool.color}25`, borderRadius:12, padding:'1.5rem', position:'relative', overflow:'hidden' }}>
                {/* Accent couleur */}
                <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${tool.color},transparent)` }} />

                <div style={{ fontSize:36, marginBottom:12 }}>{tool.icon}</div>
                <div style={{ fontFamily:HUD, fontSize:14, fontWeight:900, color:'var(--tx0)', marginBottom:8 }}>
                  {locale === 'en' ? tool.titleEn : tool.titleFr}
                </div>
                <p style={{ fontFamily:BODY, fontSize:14, color:'var(--tx2)', lineHeight:1.7, marginBottom:'1.5rem' }}>
                  {locale === 'en' ? tool.descEn : tool.descFr}
                </p>

                {/* Tip */}
                <div style={{ background:`${tool.color}08`, border:`1px solid ${tool.color}20`, borderRadius:8, padding:'12px 14px' }}>
                  <p style={{ fontFamily:BODY, fontSize:13, color:`${tool.color}CC`, lineHeight:1.6, margin:0 }}>
                    {locale === 'en' ? tool.tipEn : tool.tipFr}
                  </p>
                </div>

                {/* CTA */}
                <a href={`/${tool.id === 'analyse' ? 'analysis' : tool.id}`}
                  style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:'1.5rem',
                    fontFamily:HUD, fontSize:9, letterSpacing:1, fontWeight:700,
                    color:'#020408', background:tool.color, padding:'10px 20px', borderRadius:6, textDecoration:'none' }}>
                  {T.start}
                </a>
              </div>

              {/* Stepper interactif */}
              <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:12, padding:'1.5rem' }}>
                <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'var(--tx3)', marginBottom:'1rem' }}>{T.howto}</div>

                {/* Progress bar */}
                <div style={{ height:3, background:'var(--bg2)', borderRadius:2, marginBottom:'1.25rem', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${((step + 1) / steps.length) * 100}%`, background:tool.color, borderRadius:2, transition:'width .4s' }} />
                </div>

                {/* Step actif */}
                <div style={{ minHeight:140 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:'1rem' }}>
                    <div style={{
                      width:42, height:42, borderRadius:10, flexShrink:0,
                      background:`${tool.color}15`, border:`1px solid ${tool.color}30`,
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:22,
                    }}>
                      {steps[step]?.icon}
                    </div>
                    <div>
                      <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)', marginBottom:4 }}>
                        {T.step} {step + 1}/{steps.length}
                      </div>
                      <div style={{ fontFamily:HUD, fontSize:11, color:tool.color, fontWeight:700, marginBottom:6 }}>
                        {steps[step]?.title}
                      </div>
                      <p style={{ fontFamily:BODY, fontSize:13, color:'var(--tx2)', lineHeight:1.7, margin:0 }}>
                        {steps[step]?.desc}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Navigation steps */}
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
                    style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, padding:'8px 14px', borderRadius:6, cursor:'pointer',
                      background:'transparent', border:'1px solid var(--bd)', color: step === 0 ? 'var(--tx3)' : 'var(--tx1)',
                      opacity: step === 0 ? 0.4 : 1 }}>
                    {T.prev}
                  </button>

                  {/* Dots */}
                  <div style={{ flex:1, display:'flex', justifyContent:'center', gap:6 }}>
                    {steps.map((_, i) => (
                      <button key={i} onClick={() => setStep(i)} style={{
                        width: i === step ? 18 : 6, height:6, borderRadius:3,
                        background: i === step ? tool.color : 'var(--bd)',
                        border:'none', cursor:'pointer', padding:0, transition:'all .2s',
                      }} />
                    ))}
                  </div>

                  <button onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}
                    style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, padding:'8px 14px', borderRadius:6, cursor:'pointer',
                      background: step === steps.length - 1 ? tool.color : 'var(--bg2)',
                      border: `1px solid ${step === steps.length - 1 ? tool.color : 'var(--bd)'}`,
                      color: step === steps.length - 1 ? '#020408' : 'var(--tx1)',
                      fontWeight: step === steps.length - 1 ? 700 : 400 }}>
                    {step === steps.length - 1 ? T.done : T.next}
                  </button>
                </div>
              </div>
            </div>

            {/* Vue d'ensemble de tous les steps */}
            <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:12, padding:'1.25rem', marginBottom:'1.5rem' }}>
              <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'var(--tx3)', marginBottom:'1rem' }}>
                {locale === 'en' ? 'ALL STEPS AT A GLANCE' : 'TOUTES LES ÉTAPES EN UN COUP D\'ŒIL'}
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {steps.map((s, i) => (
                  <button key={i} onClick={() => setStep(i)} style={{
                    display:'flex', alignItems:'center', gap:6, padding:'8px 12px',
                    background: i === step ? `${tool.color}10` : 'transparent',
                    border: `1px solid ${i === step ? tool.color + '35' : 'var(--bd)'}`,
                    borderRadius:7, cursor:'pointer', transition:'all .15s',
                  }}>
                    <span style={{ fontSize:14 }}>{s.icon}</span>
                    <span style={{ fontFamily:BODY, fontSize:12, color: i === step ? tool.color : 'var(--tx2)' }}>
                      {i + 1}. {s.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div style={{ marginBottom:'2rem' }}>
              <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:3, color:'var(--tx3)', marginBottom:'1rem' }}>{T.faqLbl}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {faq.map((item, i) => (
                  <div key={i} style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:10, overflow:'hidden' }}>
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{
                      width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'14px 16px', background:'transparent', border:'none', cursor:'pointer', gap:12,
                    }}>
                      <span style={{ fontFamily:BODY, fontSize:14, color:'var(--tx0)', textAlign:'left', fontWeight:600 }}>{item.q}</span>
                      <span style={{ fontFamily:HUD, fontSize:12, color:'var(--ac)', flexShrink:0, transition:'transform .2s',
                        transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
                    </button>
                    {openFaq === i && (
                      <div style={{ padding:'0 16px 14px', fontFamily:BODY, fontSize:13, color:'var(--tx2)', lineHeight:1.7, borderTop:'1px solid var(--bd)' }}>
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA support */}
            <div style={{ background:'linear-gradient(135deg,rgba(0,255,178,0.06),rgba(0,212,255,0.03))', border:'1px solid rgba(0,255,178,0.12)', borderRadius:12, padding:'1.5rem', textAlign:'center' }}>
              <div style={{ fontFamily:HUD, fontSize:10, color:'var(--tx0)', marginBottom:6 }}>
                {locale === 'en' ? 'Still have questions?' : 'Vous avez encore des questions ?'}
              </div>
              <p style={{ fontFamily:BODY, fontSize:13, color:'var(--tx3)', marginBottom:'1rem' }}>
                {locale === 'en'
                  ? 'Our support team responds within 24h via Telegram or email.'
                  : 'Notre équipe support répond sous 24h via Telegram ou email.'}
              </p>
              <a href="/support" style={{ display:'inline-block', fontFamily:HUD, fontSize:9, letterSpacing:1, color:'#020408', background:'#00FFB2', padding:'10px 24px', borderRadius:6, textDecoration:'none', fontWeight:700 }}>
                {locale === 'en' ? 'CONTACT SUPPORT →' : 'CONTACTER LE SUPPORT →'}
              </a>
            </div>

          </div>
        </div>

        <footer className="app-footer">
          <a href="/legal/cgu">CGU</a>
          <span style={{color:'var(--tx3)'}}>·</span>
          <a href="/support">{locale === 'en' ? 'Support' : 'Assistance'}</a>
        </footer>
      </div>
    </div>
  )
}
