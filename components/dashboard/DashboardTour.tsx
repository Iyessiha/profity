'use client'
// ============================================================
// PROFITYX — DashboardTour
// Guide interactif transparent pour les nouveaux utilisateurs
// S'affiche une seule fois après l'inscription
// ============================================================
import { useState, useEffect, useRef } from 'react'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

interface TourStep {
  target: string          // sélecteur CSS de l'élément à pointer
  titleFr: string
  titleEn: string
  descFr: string
  descEn: string
  position: 'top' | 'bottom' | 'left' | 'right'
  icon: string
}

const STEPS: TourStep[] = [
  {
    target: '.tour-analyse',
    titleFr: 'Analyse IA',
    titleEn: 'AI Analysis',
    descFr: 'Uploadez votre chart et obtenez un signal complet avec entrée, SL et TP en quelques secondes.',
    descEn: 'Upload your chart and get a complete signal with entry, SL and TP in seconds.',
    position: 'right',
    icon: '🔍',
  },
  {
    target: '.tour-credits',
    titleFr: 'Vos crédits',
    titleEn: 'Your credits',
    descFr: 'Chaque analyse consomme 1 crédit. Rechargez depuis la page Abonnement.',
    descEn: 'Each analysis uses 1 credit. Top up from the Subscription page.',
    position: 'bottom',
    icon: '⚡',
  },
  {
    target: '.tour-history',
    titleFr: 'Historique',
    titleEn: 'History',
    descFr: 'Retrouvez toutes vos analyses passées. Notez vos trades WIN ou LOSS pour suivre vos performances.',
    descEn: 'Find all your past analyses. Rate your trades WIN or LOSS to track your performance.',
    position: 'right',
    icon: '📜',
  },
  {
    target: '.tour-journal',
    titleFr: 'Journal de Trading',
    titleEn: 'Trading Journal',
    descFr: 'Documentez chaque trade avec vos émotions et votre stratégie. La clé de la progression.',
    descEn: 'Document every trade with your emotions and strategy. The key to improvement.',
    position: 'right',
    icon: '📒',
  },
  {
    target: '.tour-propfirm',
    titleFr: 'Prop Firm (Elite)',
    titleEn: 'Prop Firm (Elite)',
    descFr: 'Suivez vos challenges prop firm en temps réel. Alertes automatiques avant les limites.',
    descEn: 'Track your prop firm challenges in real time. Automatic alerts before limits.',
    position: 'right',
    icon: '🏦',
  },
  {
    target: '.tour-guide',
    titleFr: 'Guide complet',
    titleEn: 'Full guide',
    descFr: 'Accédez au guide interactif pour maîtriser chaque outil de la plateforme.',
    descEn: 'Access the interactive guide to master every platform tool.',
    position: 'right',
    icon: '📚',
  },
]

interface Props {
  locale: string
  onDone: () => void
}

export default function DashboardTour({ locale, onDone }: Props) {
  const [step, setStep]       = useState(0)
  const [rect, setRect]       = useState<DOMRect | null>(null)
  const [visible, setVisible] = useState(false)
  const rafRef = useRef<number>()

  const current = STEPS[step]

  // Trouver et observer l'élément cible
  useEffect(() => {
    setVisible(false)
    const update = () => {
      const el = document.querySelector(current.target)
      if (el) {
        setRect(el.getBoundingClientRect())
        setVisible(true)
      }
    }
    update()
    // Retry au cas où l'élément n'est pas encore monté
    const t = setTimeout(update, 300)
    return () => clearTimeout(t)
  }, [step, current.target])

  const next = () => {
    if (step < STEPS.length - 1) { setStep(s => s + 1) }
    else { onDone() }
  }
  const skip = () => onDone()

  const T = {
    skip:  locale === 'en' ? 'Skip tour' : 'Passer',
    next:  locale === 'en' ? 'NEXT →'    : 'SUIVANT →',
    done:  locale === 'en' ? '✓ START!'  : '✓ C\'EST PARTI !',
    of:    locale === 'en' ? 'of'         : 'sur',
  }

  if (!visible || !rect) return null

  // Calcul position du tooltip
  const pad     = 16
  const tipW    = 280
  const tipH    = 160
  const spacing = 14

  let tipTop  = 0
  let tipLeft = 0
  let arrowPos: 'top' | 'bottom' | 'left' | 'right' = 'top'

  const pos = current.position

  if (pos === 'right') {
    tipTop  = rect.top + rect.height / 2 - tipH / 2
    tipLeft = rect.right + spacing
    arrowPos = 'left'
  } else if (pos === 'left') {
    tipTop  = rect.top + rect.height / 2 - tipH / 2
    tipLeft = rect.left - tipW - spacing
    arrowPos = 'right'
  } else if (pos === 'bottom') {
    tipTop  = rect.bottom + spacing
    tipLeft = rect.left + rect.width / 2 - tipW / 2
    arrowPos = 'top'
  } else {
    tipTop  = rect.top - tipH - spacing
    tipLeft = rect.left + rect.width / 2 - tipW / 2
    arrowPos = 'bottom'
  }

  // Garder dans la fenêtre
  const vw = typeof window !== 'undefined' ? window.innerWidth : 800
  const vh = typeof window !== 'undefined' ? window.innerHeight : 600
  tipLeft = Math.max(pad, Math.min(tipLeft, vw - tipW - pad))
  tipTop  = Math.max(pad, Math.min(tipTop,  vh - tipH - pad))

  // Spotlight rect avec marge
  const margin  = 8
  const sLeft   = rect.left - margin
  const sTop    = rect.top  - margin
  const sWidth  = rect.width  + margin * 2
  const sHeight = rect.height + margin * 2

  // Couleur de la step
  const colors = ['#00FFB2', '#00D4FF', '#A29BFE', '#00D4FF', '#C9A84C', '#00FFB2']
  const color  = colors[step] ?? '#00FFB2'

  const arrowSize = 8
  const arrowStyle = (dir: string): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute', width: 0, height: 0,
    }
    if (dir === 'left') return { ...base, left: -arrowSize, top: '50%', transform: 'translateY(-50%)',
      borderTop: `${arrowSize}px solid transparent`, borderBottom: `${arrowSize}px solid transparent`, borderRight: `${arrowSize}px solid #1A2744` }
    if (dir === 'right') return { ...base, right: -arrowSize, top: '50%', transform: 'translateY(-50%)',
      borderTop: `${arrowSize}px solid transparent`, borderBottom: `${arrowSize}px solid transparent`, borderLeft: `${arrowSize}px solid #1A2744` }
    if (dir === 'top') return { ...base, top: -arrowSize, left: '50%', transform: 'translateX(-50%)',
      borderLeft: `${arrowSize}px solid transparent`, borderRight: `${arrowSize}px solid transparent`, borderBottom: `${arrowSize}px solid #1A2744` }
    return { ...base, bottom: -arrowSize, left: '50%', transform: 'translateX(-50%)',
      borderLeft: `${arrowSize}px solid transparent`, borderRight: `${arrowSize}px solid transparent`, borderTop: `${arrowSize}px solid #1A2744` }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>

      {/* Overlay sombre avec découpe spotlight via clip-path / SVG */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'all' }}
        onClick={e => { if ((e.target as SVGElement).tagName === 'path') next() }}
      >
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect x={sLeft} y={sTop} width={sWidth} height={sHeight} rx="8" fill="black" />
          </mask>
        </defs>
        {/* Fond sombre */}
        <rect width="100%" height="100%" fill="rgba(2,4,8,0.72)" mask="url(#tour-mask)" />
        {/* Bordure spotlight animée */}
        <rect
          x={sLeft} y={sTop} width={sWidth} height={sHeight} rx="8"
          fill="none" stroke={color} strokeWidth="2"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>

      {/* Tooltip */}
      <div style={{
        position: 'fixed',
        top: tipTop, left: tipLeft,
        width: tipW,
        background: '#1A2744',
        border: `1px solid ${color}40`,
        borderRadius: 12,
        padding: '16px',
        pointerEvents: 'all',
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${color}20`,
        zIndex: 10000,
        animation: 'tour-in .2s ease',
      }}>
        {/* Flèche */}
        <div style={arrowStyle(arrowPos)} />

        {/* Contenu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>{current.icon}</span>
          <div>
            <div style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 2, color, fontWeight: 700 }}>
              {locale === 'en' ? current.titleEn : current.titleFr}
            </div>
            <div style={{ fontFamily: HUD, fontSize: 7, color: 'rgba(220,235,255,0.35)' }}>
              {step + 1} {T.of} {STEPS.length}
            </div>
          </div>
        </div>

        <p style={{ fontFamily: BODY, fontSize: 13, color: 'rgba(220,235,255,0.75)', lineHeight: 1.6, margin: '0 0 14px' }}>
          {locale === 'en' ? current.descEn : current.descFr}
        </p>

        {/* Dots de progression */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              height: 3, flex: i === step ? 2 : 1, borderRadius: 2,
              background: i <= step ? color : 'rgba(255,255,255,0.1)',
              transition: 'all .3s',
            }} />
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={skip} style={{
            flex: 1, fontFamily: HUD, fontSize: 7, letterSpacing: 1,
            padding: '7px', borderRadius: 6, cursor: 'pointer',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(220,235,255,0.4)',
          }}>
            {T.skip}
          </button>
          <button onClick={next} style={{
            flex: 2, fontFamily: HUD, fontSize: 8, letterSpacing: 1, fontWeight: 700,
            padding: '8px', borderRadius: 6, cursor: 'pointer',
            background: color, border: 'none',
            color: step === STEPS.length - 1 ? '#020408' : '#020408',
          }}>
            {step === STEPS.length - 1 ? T.done : T.next}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes tour-in {
          from { opacity: 0; transform: scale(.95) translateY(4px); }
          to   { opacity: 1; transform: scale(1)  translateY(0); }
        }
      `}</style>
    </div>
  )
}
