// ============================================================
// PROFITYX — PopupManager : 7 popups stratégiques
// ============================================================
'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { pixelLead } from '@/lib/pixel'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

export type PopupType =
  | 'upgrade'       // Free essaie une feature Pro
  | 'welcome'       // 1er login
  | 'low_credits'   // < 3 crédits
  | 'win'           // après un WIN
  | 'macro_alert'   // annonce < 15 min
  | 'after_3'       // après 3 analyses
  | 'exit_intent'   // quitte la page

export interface PopupPayload {
  type:         PopupType
  plan?:        string
  credits?:     number
  eventTitle?:  string
  minutesLeft?: number
  analysisCount?: number
  winPair?:     string
}

interface Props {
  popup:    PopupPayload | null
  onClose:  () => void
  locale?:  string
  plan?:    string
}

// ── Overlay ──────────────────────────────────────────────────
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'rgba(2,4,8,0.85)', backdropFilter:'blur(8px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'1rem', animation:'fadeIn .2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width:'100%', maxWidth:440, position:'relative',
        animation:'slideUp .25s ease',
      }}>
        {children}
      </div>
    </div>
  )
}

// ── Card générique ───────────────────────────────────────────
function PopCard({ color, icon, tag, title, body, cta, ctaHref, ctaSecondary, onSecondary, onClose, children }: {
  color: string; icon: string; tag?: string; title: string; body: string
  cta: string; ctaHref?: string; ctaSecondary?: string
  onSecondary?: () => void; onClose: () => void
  children?: React.ReactNode
}) {
  return (
    <div style={{
      background:'#080F1A', border:`1px solid ${color}25`,
      borderRadius:16, overflow:'hidden',
      boxShadow:`0 0 60px ${color}15, 0 20px 40px rgba(0,0,0,0.6)`,
    }}>
      {/* Barre colorée */}
      <div style={{ height:3, background:`linear-gradient(90deg, transparent, ${color}, transparent)` }} />

      {/* Header */}
      <div style={{ padding:'20px 20px 0', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:44, height:44, borderRadius:10, background:`${color}12`, border:`1px solid ${color}25`,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
            {icon}
          </div>
          <div>
            {tag && <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:color, marginBottom:4 }}>{tag}</div>}
            <div style={{ fontFamily:HUD, fontSize:14, fontWeight:900, color:'#E8F4F8', letterSpacing:1 }}>{title}</div>
          </div>
        </div>
        <button onClick={onClose} style={{
          background:'transparent', border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:6, color:'rgba(232,244,248,0.35)', cursor:'pointer',
          width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:HUD, fontSize:10, flexShrink:0,
        }}>✕</button>
      </div>

      {/* Body */}
      <div style={{ padding:'14px 20px' }}>
        <p style={{ fontFamily:BODY, fontSize:14, color:'rgba(232,244,248,0.6)', lineHeight:1.6, marginBottom:14 }}
          dangerouslySetInnerHTML={{ __html: body }} />
        {children}
      </div>

      {/* CTAs */}
      <div style={{ padding:'0 20px 20px', display:'flex', flexDirection:'column', gap:8 }}>
        {ctaHref ? (
          <a href={ctaHref} style={{
            display:'block', textAlign:'center', padding:'13px', borderRadius:7,
            background:color, color:'#020408', fontFamily:HUD, fontSize:10,
            letterSpacing:2, fontWeight:700, textDecoration:'none',
          }}>{cta}</a>
        ) : (
          <button onClick={onClose} style={{
            width:'100%', padding:'13px', borderRadius:7, border:'none',
            background:color, color:'#020408', fontFamily:HUD, fontSize:10,
            letterSpacing:2, fontWeight:700, cursor:'pointer',
          }}>{cta}</button>
        )}
        {ctaSecondary && (
          <button onClick={onSecondary ?? onClose} style={{
            width:'100%', padding:'10px', borderRadius:7, cursor:'pointer',
            background:'transparent', border:'1px solid rgba(255,255,255,0.08)',
            color:'rgba(232,244,248,0.35)', fontFamily:HUD, fontSize:9, letterSpacing:1,
          }}>{ctaSecondary}</button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// POPUP 1 — UPGRADE (feature Pro/Elite pour un Free)
// ─────────────────────────────────────────────────────────────
function UpgradePopup({ onClose, locale }: { onClose: () => void; locale: string }) {
  const fr = locale === 'fr'
  return (
    <Overlay onClose={onClose}>
      <PopCard color="#00FFB2" icon="⭐" tag={fr ? 'FONCTIONNALITÉ PRO' : 'PRO FEATURE'}
        title={fr ? 'Passe au Plan Pro' : 'Upgrade to Pro'}
        body={fr
          ? 'Cette fonctionnalité est réservée aux membres <b>Pro</b> et <b>Elite</b>.<br/>Accède aux analyses illimitées, au chart annoté et aux signaux SMC complets.'
          : 'This feature is for <b>Pro</b> and <b>Elite</b> members.<br/>Get unlimited analyses, annotated charts and full SMC signals.'}
        cta={fr ? '✦ VOIR LES PLANS' : '✦ SEE PLANS'}
        ctaHref="/pricing"
        ctaSecondary={fr ? 'Rester en Free' : 'Stay on Free'}
        onClose={onClose}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:4 }}>
          {[
            { plan:'PRO', price:'9.90$', color:'#00FFB2',  features:['Analyses illimitées','Chart annoté','SMC complet'] },
            { plan:'ELITE', price:'24.90$', color:'#C9A84C', features:['Tout Pro','Annotations précises','Priorité IA'] },
          ].map(p => (
            <div key={p.plan} style={{
              background:`${p.color}08`, border:`1px solid ${p.color}20`,
              borderRadius:8, padding:'10px 12px',
            }}>
              <div style={{ fontFamily:HUD, fontSize:9, color:p.color, letterSpacing:1, marginBottom:6 }}>{p.plan}</div>
              <div style={{ fontFamily:HUD, fontSize:16, fontWeight:900, color:p.color, marginBottom:8 }}>{p.price}<span style={{ fontSize:9, opacity:0.6 }}>/mois</span></div>
              {p.features.map(f => (
                <div key={f} style={{ fontFamily:BODY, fontSize:11, color:'rgba(232,244,248,0.5)', marginBottom:2 }}>✓ {f}</div>
              ))}
            </div>
          ))}
        </div>
      </PopCard>
    </Overlay>
  )
}

// ─────────────────────────────────────────────────────────────
// POPUP 2 — BIENVENUE (1er login)
// ─────────────────────────────────────────────────────────────
function WelcomePopup({ onClose, locale }: { onClose: () => void; locale: string }) {
  const fr = locale === 'fr'
  return (
    <Overlay onClose={onClose}>
      <PopCard color="#00D4FF" icon="👋" tag={fr ? 'BIENVENUE SUR PROFITYX' : 'WELCOME TO PROFITYX'}
        title={fr ? 'Prêt à trader smarter ?' : 'Ready to trade smarter?'}
        body={fr
          ? 'Uploade ton chart TradingView → reçois ton signal IA en <b>10 secondes</b>.<br/>Entrée · Stop Loss · Take Profit · Order Block · FVG · BOS'
          : 'Upload your TradingView chart → get your AI signal in <b>10 seconds</b>.<br/>Entry · Stop Loss · Take Profit · Order Block · FVG · BOS'}
        cta={fr ? '🚀 LANCER MA 1ÈRE ANALYSE' : '🚀 START MY 1ST ANALYSIS'}
        ctaHref="/analysis"
        ctaSecondary={fr ? 'Explorer le dashboard' : 'Explore dashboard'}
        onSecondary={onClose}
        onClose={onClose}>
        <div style={{
          background:'rgba(0,212,255,0.06)', border:'1px solid rgba(0,212,255,0.15)',
          borderRadius:8, padding:'10px 12px', marginBottom:4,
          display:'flex', gap:16, flexWrap:'wrap',
        }}>
          {[['1 analyse SMC', 'offerte/jour'], ['10 crédits', 'pour commencer'], ['Gratuit', 'pour toujours']].map(([n,l]) => (
            <div key={n} style={{ textAlign:'center', flex:1 }}>
              <div style={{ fontFamily:HUD, fontSize:12, fontWeight:900, color:'#00D4FF' }}>{n}</div>
              <div style={{ fontFamily:BODY, fontSize:10, color:'rgba(232,244,248,0.4)' }}>{l}</div>
            </div>
          ))}
        </div>
      </PopCard>
    </Overlay>
  )
}

// ─────────────────────────────────────────────────────────────
// POPUP 3 — CRÉDITS FAIBLES
// ─────────────────────────────────────────────────────────────
function LowCreditsPopup({ onClose, credits, locale }: { onClose: () => void; credits: number; locale: string }) {
  const fr = locale === 'fr'
  return (
    <Overlay onClose={onClose}>
      <PopCard color="#C9A84C" icon="⚡" tag={fr ? 'CRÉDITS FAIBLES' : 'LOW CREDITS'}
        title={fr ? `Plus que ${credits} crédit${credits>1?'s':''} !` : `Only ${credits} credit${credits>1?'s':''} left!`}
        body={fr
          ? `Tu as <b>${credits} crédit${credits>1?'s':''}</b> restant${credits>1?'s':''}. Chaque analyse consomme 1 crédit.<br/>Gagne des crédits en notant tes trades (WIN/LOSS) ou passe au plan Pro.`
          : `You have <b>${credits} credit${credits>1?'s':''}</b> remaining. Each analysis uses 1 credit.<br/>Earn credits by rating your trades or upgrade to Pro.`}
        cta={fr ? '🎯 VOIR MES OPTIONS' : '🎯 SEE MY OPTIONS'}
        ctaHref="/pricing"
        ctaSecondary={fr ? 'Continuer avec mes crédits' : 'Continue with my credits'}
        onClose={onClose}>
        <div style={{ display:'flex', gap:8, marginBottom:4 }}>
          {[
            { icon:'🏆', text: fr ? '+1 crédit par WIN noté' : '+1 credit per rated WIN' },
            { icon:'🤝', text: fr ? '+20 crédits par filleul' : '+20 credits per referral' },
          ].map(item => (
            <div key={item.icon} style={{
              flex:1, background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.15)',
              borderRadius:6, padding:'8px 10px', display:'flex', alignItems:'center', gap:6,
            }}>
              <span style={{ fontSize:14 }}>{item.icon}</span>
              <span style={{ fontFamily:BODY, fontSize:11, color:'rgba(232,244,248,0.5)' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </PopCard>
    </Overlay>
  )
}

// ─────────────────────────────────────────────────────────────
// POPUP 4 — APRÈS UN WIN 🏆
// ─────────────────────────────────────────────────────────────
function WinPopup({ onClose, winPair, locale }: { onClose: () => void; winPair?: string; locale: string }) {
  const fr = locale === 'fr'
  return (
    <Overlay onClose={onClose}>
      <PopCard color="#00FFB2" icon="🏆" tag={fr ? 'TRADE GAGNANT !' : 'WINNING TRADE!'}
        title={fr ? 'Félicitations !' : 'Congratulations!'}
        body={fr
          ? `Ton trade${winPair ? ` sur <b>${winPair}</b>` : ''} est un <b style="color:#00FFB2">WIN</b> ! 🎉<br/>Partage ton succès et inspire la communauté ProfityX.`
          : `Your trade${winPair ? ` on <b>${winPair}</b>` : ''} is a <b style="color:#00FFB2">WIN</b>! 🎉<br/>Share your success and inspire the ProfityX community.`}
        cta={fr ? '📤 PARTAGER CE WIN' : '📤 SHARE THIS WIN'}
        ctaHref="/history"
        ctaSecondary={fr ? 'Continuer à trader' : 'Keep trading'}
        onClose={onClose}>
        <div style={{
          background:'rgba(0,255,178,0.06)', border:'1px solid rgba(0,255,178,0.15)',
          borderRadius:8, padding:'10px 12px', marginBottom:4, textAlign:'center',
        }}>
          <div style={{ fontFamily:HUD, fontSize:11, color:'rgba(0,255,178,0.7)', letterSpacing:1 }}>
            {fr ? '+1 crédit bonus ajouté à ton compte !' : '+1 bonus credit added to your account!'}
          </div>
        </div>
      </PopCard>
    </Overlay>
  )
}

// ─────────────────────────────────────────────────────────────
// POPUP 5 — ANNONCE IMMINENTE 🚨
// ─────────────────────────────────────────────────────────────
function MacroAlertPopup({ onClose, eventTitle, minutesLeft, locale }: {
  onClose: () => void; eventTitle?: string; minutesLeft?: number; locale: string
}) {
  const fr = locale === 'fr'
  return (
    <Overlay onClose={onClose}>
      <PopCard color="#FF3A5C" icon="🚨" tag={fr ? 'ANNONCE IMMINENTE' : 'IMMINENT ANNOUNCEMENT'}
        title={eventTitle ?? (fr ? 'Annonce économique' : 'Economic Announcement')}
        body={fr
          ? `Publication dans <b style="color:#FF3A5C">${minutesLeft ?? '?'} minute${(minutesLeft ?? 0) > 1 ? 's' : ''}</b> !<br/>Le marché peut bouger fortement. Anticipe maintenant avec le signal IA.`
          : `Release in <b style="color:#FF3A5C">${minutesLeft ?? '?'} minute${(minutesLeft ?? 0) > 1 ? 's' : ''}</b>!<br/>The market may move sharply. Anticipate now with the AI signal.`}
        cta={fr ? '⚡ GÉNÉRER LE SIGNAL' : '⚡ GENERATE SIGNAL'}
        ctaHref="/news"
        ctaSecondary={fr ? 'Ignorer' : 'Dismiss'}
        onClose={onClose}>
        <div style={{
          background:'rgba(255,58,92,0.08)', border:'1px solid rgba(255,58,92,0.2)',
          borderRadius:8, padding:'10px 12px', marginBottom:4,
          display:'flex', alignItems:'center', gap:8,
        }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#FF3A5C',
            boxShadow:'0 0 8px #FF3A5C', flexShrink:0 }} />
          <span style={{ fontFamily:HUD, fontSize:9, color:'rgba(255,58,92,0.8)', letterSpacing:1 }}>
            {fr ? 'IMPACT FORT · USD · HIGH' : 'HIGH IMPACT · USD'}
          </span>
        </div>
      </PopCard>
    </Overlay>
  )
}

// ─────────────────────────────────────────────────────────────
// POPUP 6 — APRÈS 3 ANALYSES 🔥
// ─────────────────────────────────────────────────────────────
function After3Popup({ onClose, locale }: { onClose: () => void; locale: string }) {
  const fr = locale === 'fr'
  return (
    <Overlay onClose={onClose}>
      <PopCard color="#FF6B35" icon="🔥" tag={fr ? 'TU PRENDS LE RYTHME !' : "YOU'RE ON A ROLL!"}
        title={fr ? 'Passe au niveau supérieur' : 'Level up your trading'}
        body={fr
          ? 'Tu as déjà réalisé <b>3 analyses</b> avec l\'IA ! Nos membres Pro font en moyenne <b>15 analyses/semaine</b>.<br/>Analyses illimitées + chart annoté pour 9.90$/mois.'
          : 'You\'ve already done <b>3 analyses</b> with the AI! Pro members average <b>15 analyses/week</b>.<br/>Unlimited analyses + annotated chart for $9.90/month.'}
        cta={fr ? '⭐ PASSER PRO — 9.90$/mois' : '⭐ GO PRO — $9.90/month'}
        ctaHref="/pricing"
        ctaSecondary={fr ? 'Continuer en Free' : 'Continue for free'}
        onClose={onClose}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:4 }}>
          {(fr
            ? ['Analyses illimitées', 'Chart annoté IA', 'SMC Pro complet', 'Priorité de traitement']
            : ['Unlimited analyses', 'AI annotated chart', 'Full SMC Pro', 'Priority processing']
          ).map(f => (
            <span key={f} style={{
              fontFamily:BODY, fontSize:11, color:'rgba(255,107,53,0.8)',
              background:'rgba(255,107,53,0.08)', border:'1px solid rgba(255,107,53,0.2)',
              borderRadius:4, padding:'3px 8px',
            }}>✓ {f}</span>
          ))}
        </div>
      </PopCard>
    </Overlay>
  )
}

// ─────────────────────────────────────────────────────────────
// POPUP 7 — EXIT INTENT 💬
// ─────────────────────────────────────────────────────────────
function ExitIntentPopup({ onClose, locale, plan }: { onClose: () => void; locale: string; plan: string }) {
  const fr = locale === 'fr'
  const isFree = plan === 'free'
  return (
    <Overlay onClose={onClose}>
      <PopCard color="#7B61FF" icon="💬" tag={fr ? 'ATTENDS UNE SECONDE !' : 'WAIT A SECOND!'}
        title={fr ? 'Tu repars déjà ?' : 'Leaving so soon?'}
        body={fr
          ? isFree
            ? 'Ton prochain trade mérite un signal IA. Reste et lance ta <b>1ère analyse gratuite</b> — ça prend 10 secondes.'
            : 'Tu as encore des <b>crédits disponibles</b>. Lance une analyse avant de partir — le marché n\'attend pas.'
          : isFree
            ? 'Your next trade deserves an AI signal. Stay and launch your <b>1st free analysis</b> — it takes 10 seconds.'
            : 'You still have <b>available credits</b>. Launch an analysis before you go — the market won\'t wait.'}
        cta={fr ? '📊 ANALYSER UN CHART' : '📊 ANALYZE A CHART'}
        ctaHref="/analysis"
        ctaSecondary={fr ? 'Non merci, je pars' : 'No thanks, I\'ll leave'}
        onClose={onClose} />
    </Overlay>
  )
}

// ─────────────────────────────────────────────────────────────
// POPUP MANAGER — Point d'entrée principal
// ─────────────────────────────────────────────────────────────
export default function PopupManager({ popup, onClose, locale = 'fr', plan = 'free' }: Props) {
  if (!popup) return null

  const props = { onClose, locale, plan }

  switch (popup.type) {
    case 'upgrade':
      return <UpgradePopup {...props} />
    case 'welcome':
      return <WelcomePopup {...props} />
    case 'low_credits':
      return <LowCreditsPopup {...props} credits={popup.credits ?? 2} />
    case 'win':
      return <WinPopup {...props} winPair={popup.winPair} />
    case 'macro_alert':
      return <MacroAlertPopup {...props} eventTitle={popup.eventTitle} minutesLeft={popup.minutesLeft} />
    case 'after_3':
      return <After3Popup {...props} />
    case 'exit_intent':
      return <ExitIntentPopup {...props} />
    default:
      return null
  }
}

// ─────────────────────────────────────────────────────────────
// HOOK — Logique de déclenchement des popups
// ─────────────────────────────────────────────────────────────
export function usePopups({ plan, credits, analysisCount, locale }: {
  plan: string; credits: number; analysisCount: number; locale: string
}) {
  const [popup, setPopup] = useState<PopupPayload | null>(null)
  const shownRef = useRef<Set<string>>(new Set())

  const show = useCallback((p: PopupPayload) => {
    const key = p.type + (p.eventTitle ?? '')
    if (shownRef.current.has(key)) return
    shownRef.current.add(key)
    setPopup(p)
  }, [])

  const close = useCallback(() => setPopup(null), [])

  // Popup Bienvenue — 1er login
  useEffect(() => {
    if (typeof window === 'undefined') return
    const welcomed = localStorage.getItem('px_welcomed')
    if (!welcomed) {
      localStorage.setItem('px_welcomed', '1')
      setTimeout(() => show({ type:'welcome' }), 1500)
    }
  }, [show])

  // Popup Crédits faibles — < 3 crédits
  useEffect(() => {
    if (credits > 0 && credits < 3 && plan === 'free') {
      const key = `px_lowcredits_${credits}`
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, '1')
        show({ type:'low_credits', credits })
      }
    }
  }, [credits, plan, show])

  // Popup Après 3 analyses — exactement 3
  useEffect(() => {
    if (analysisCount === 3 && plan === 'free') {
      if (!localStorage.getItem('px_after3')) {
        localStorage.setItem('px_after3', '1')
        setTimeout(() => show({ type:'after_3', analysisCount }), 2000)
      }
    }
  }, [analysisCount, plan, show])

  // Exit intent (desktop) — souris sort par le haut
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('px_exit')) return

    const handler = (e: MouseEvent) => {
      if (e.clientY < 10) {
        localStorage.setItem('px_exit', '1')
        show({ type:'exit_intent' })
      }
    }
    document.addEventListener('mouseleave', handler)
    return () => document.removeEventListener('mouseleave', handler)
  }, [show])

  return { popup, close, showPopup: show }
}
