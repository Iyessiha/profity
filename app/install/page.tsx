'use client'
// ============================================================
// PROFITYX — /install : Guide d'installation (PWA)
// ============================================================
import { useState, useEffect } from 'react'
import Link from 'next/link'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

type OS = 'android' | 'ios' | 'desktop' | 'unknown'

function detectOS(): OS {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  if (/Windows|Macintosh|Linux/.test(ua)) return 'desktop'
  return 'unknown'
}

const STEPS = {
  android: [
    {
      num: '01',
      title: 'Ouvrir dans Chrome',
      desc: 'Visitez profity-x.com dans Google Chrome (pas un autre navigateur).',
      icon: '🌐',
      tip: 'Chrome est requis pour l\'installation sur Android',
    },
    {
      num: '02',
      title: 'Menu Chrome',
      desc: 'Appuyez sur les trois points ⋮ en haut à droite de Chrome.',
      icon: '⋮',
      tip: 'Le menu se trouve dans le coin supérieur droit',
    },
    {
      num: '03',
      title: 'Ajouter à l\'écran d\'accueil',
      desc: 'Appuyez sur « Ajouter à l\'écran d\'accueil » dans le menu déroulant.',
      icon: '📲',
      tip: 'Vous verrez une bannière de confirmation',
    },
    {
      num: '04',
      title: 'Confirmer l\'installation',
      desc: 'Appuyez sur « Ajouter » dans la popup de confirmation.',
      icon: '✅',
      tip: 'ProfityX apparaît sur votre écran d\'accueil',
    },
    {
      num: '05',
      title: 'Lancer l\'app',
      desc: 'Ouvrez ProfityX depuis votre écran d\'accueil — elle se lancera en plein écran comme une vraie app.',
      icon: '🚀',
      tip: 'Profitez de l\'expérience app complète !',
    },
  ],
  ios: [
    {
      num: '01',
      title: 'Ouvrir dans Safari',
      desc: 'Visitez profity-x.com dans Safari. L\'installation PWA n\'est disponible que via Safari sur iOS.',
      icon: '🧭',
      tip: 'Uniquement disponible dans Safari (pas Chrome ni Firefox)',
    },
    {
      num: '02',
      title: 'Bouton Partager',
      desc: 'Appuyez sur le bouton Partager ↑ en bas de l\'écran (carré avec une flèche vers le haut).',
      icon: '↑',
      tip: 'Le bouton partager est dans la barre du bas',
    },
    {
      num: '03',
      title: 'Sur l\'écran d\'accueil',
      desc: 'Faites défiler vers le bas dans le menu et appuyez sur « Sur l\'écran d\'accueil ».',
      icon: '📱',
      tip: 'Faites glisser le menu vers le haut pour trouver l\'option',
    },
    {
      num: '04',
      title: 'Confirmer le nom',
      desc: 'Vérifiez que le nom est « ProfityX » puis appuyez sur « Ajouter » en haut à droite.',
      icon: '✅',
      tip: 'Vous pouvez modifier le nom si vous le souhaitez',
    },
    {
      num: '05',
      title: 'Lancer l\'app',
      desc: 'Ouvrez ProfityX depuis votre écran d\'accueil — elle se lancera sans barre d\'adresse comme une vraie app.',
      icon: '🚀',
      tip: 'Expérience plein écran optimisée !',
    },
  ],
  desktop: [
    {
      num: '01',
      title: 'Ouvrir dans Chrome ou Edge',
      desc: 'Visitez profity-x.com dans Google Chrome ou Microsoft Edge.',
      icon: '🖥️',
      tip: 'Firefox ne supporte pas l\'installation PWA',
    },
    {
      num: '02',
      title: 'Icône d\'installation',
      desc: 'Cliquez sur l\'icône ⊕ dans la barre d\'adresse (à droite de l\'URL).',
      icon: '⊕',
      tip: 'L\'icône apparaît automatiquement si l\'app est installable',
    },
    {
      num: '03',
      title: 'Installer',
      desc: 'Cliquez sur « Installer » dans la popup de confirmation.',
      icon: '💻',
      tip: 'ProfityX s\'ouvrira dans sa propre fenêtre',
    },
    {
      num: '04',
      title: 'Accès rapide',
      desc: 'ProfityX est maintenant dans votre bureau et votre barre des tâches / dock.',
      icon: '✅',
      tip: 'Lancez-la depuis votre bureau comme n\'importe quelle app',
    },
  ],
  unknown: [],
}

const FEATURES = [
  { icon: '⚡', title: 'Rapide', desc: 'Chargement instantané, pas de délai navigateur' },
  { icon: '📵', title: 'Hors ligne', desc: 'Interface disponible même sans connexion' },
  { icon: '🔔', title: 'Notifications', desc: 'Alertes de prix et signaux en temps réel' },
  { icon: '🔒', title: 'Sécurisé', desc: 'Même sécurité qu\'une app native' },
  { icon: '💾', title: 'Léger', desc: 'Aucun téléchargement d\'app store requis' },
  { icon: '🔄', title: 'Toujours à jour', desc: 'Mises à jour automatiques, rien à faire' },
]

export default function InstallPage() {
  const [os, setOs] = useState<OS>('android')  // android par défaut (cible principale)
  const [installed, setInstalled] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    setOs(detectOS())
    // Détecter si déjà installé en mode standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
    }
  }, [])

  const steps = STEPS[os] || STEPS.android
  const osLabel = { android: 'Android', ios: 'iPhone / iPad', desktop: 'PC / Mac', unknown: 'Android' }[os]

  return (
    <div style={{ minHeight: '100vh', background: '#020408', color: '#E8F4F8', fontFamily: BODY }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg, #0A1628 0%, #020408 100%)', borderBottom: '1px solid rgba(0,255,178,0.1)', padding: '1.5rem 1rem' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <Link href="/" style={{ fontFamily: HUD, fontSize: 18, letterSpacing: 4, color: '#00FFB2', textDecoration: 'none' }}>
            PROFIT<span style={{ color: '#00D4FF' }}>YX</span>
          </Link>
          <div style={{ fontFamily: HUD, fontSize: 7, letterSpacing: 3, color: 'rgba(232,244,248,0.35)', marginTop: 3 }}>
            AI TRADING SIGNAL
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* Déjà installé */}
        {installed ? (
          <div style={{ background: 'rgba(0,255,178,0.06)', border: '1px solid rgba(0,255,178,0.2)', borderRadius: 12, padding: '2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: 48, marginBottom: '1rem' }}>🎉</div>
            <div style={{ fontFamily: HUD, fontSize: 14, color: '#00FFB2', letterSpacing: 2, marginBottom: 8 }}>APP DÉJÀ INSTALLÉE</div>
            <div style={{ fontFamily: BODY, fontSize: 14, color: 'rgba(232,244,248,0.6)', marginBottom: '1.5rem' }}>
              ProfityX est installée sur cet appareil. Vous l'utilisez en ce moment.
            </div>
            <Link href="/dashboard" style={{ display: 'inline-block', background: '#00FFB2', color: '#020408', fontFamily: HUD, fontSize: 9, letterSpacing: 2, padding: '12px 24px', borderRadius: 6, textDecoration: 'none', fontWeight: 700 }}>
              ACCÉDER AU DASHBOARD →
            </Link>
          </div>
        ) : (
          <>
            {/* Hero */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg, #00FFB2, #00D4FF)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: 36 }}>
                📲
              </div>
              <h1 style={{ fontFamily: HUD, fontSize: 22, fontWeight: 900, color: '#E8F4F8', letterSpacing: 1, marginBottom: 8 }}>
                INSTALLER PROFITYX
              </h1>
              <p style={{ fontFamily: BODY, fontSize: 14, color: 'rgba(232,244,248,0.6)', lineHeight: 1.6, margin: 0 }}>
                Ajoutez ProfityX à votre écran d'accueil pour une expérience app complète — gratuit, rapide, sans app store.
              </p>
            </div>

            {/* Sélecteur OS */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 2, color: 'rgba(232,244,248,0.4)', marginBottom: 10, textAlign: 'center' }}>
                VOTRE APPAREIL
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {(['android', 'ios', 'desktop'] as OS[]).map(o => (
                  <button key={o} onClick={() => { setOs(o); setStep(0) }}
                    style={{ flex: 1, maxWidth: 140, padding: '10px 8px', border: `1px solid ${os === o ? '#00FFB2' : 'rgba(255,255,255,0.1)'}`, background: os === o ? 'rgba(0,255,178,0.1)' : 'rgba(255,255,255,0.03)', borderRadius: 8, color: os === o ? '#00FFB2' : 'rgba(232,244,248,0.5)', fontFamily: HUD, fontSize: 7, letterSpacing: 1, cursor: 'pointer', transition: 'all .2s' }}>
                    {o === 'android' ? '🤖 Android' : o === 'ios' ? '🍎 iPhone/iPad' : '🖥️ PC/Mac'}
                  </button>
                ))}
              </div>
            </div>

            {/* Étapes */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontFamily: HUD, fontSize: 10, letterSpacing: 2, color: '#00FFB2', marginBottom: '1rem' }}>
                INSTALLATION — {(osLabel ?? 'Android').toUpperCase()}
              </div>

              {steps.map((s, i) => (
                <div key={s.num}
                  onClick={() => setStep(i)}
                  style={{ display: 'flex', gap: 14, padding: '1rem', marginBottom: 8, background: step === i ? 'rgba(0,255,178,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${step === i ? 'rgba(0,255,178,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 10, cursor: 'pointer', transition: 'all .2s' }}>

                  {/* Numéro */}
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: step === i ? 'rgba(0,255,178,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${step === i ? '#00FFB2' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HUD, fontSize: 10, fontWeight: 900, color: step === i ? '#00FFB2' : 'rgba(232,244,248,0.3)', flexShrink: 0 }}>
                    {i < step ? '✓' : s.num}
                  </div>

                  {/* Contenu */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 1, color: step === i ? '#E8F4F8' : 'rgba(232,244,248,0.6)', marginBottom: 4 }}>
                      {s.icon} {s.title}
                    </div>
                    <div style={{ fontFamily: BODY, fontSize: 13, color: 'rgba(232,244,248,0.55)', lineHeight: 1.5 }}>
                      {s.desc}
                    </div>
                    {step === i && (
                      <div style={{ marginTop: 8, fontFamily: HUD, fontSize: 7, color: '#C9A84C', letterSpacing: 1, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 4, padding: '4px 8px', display: 'inline-block' }}>
                        💡 {s.tip}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Navigation étapes */}
              <div style={{ display: 'flex', gap: 8, marginTop: '1rem' }}>
                <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
                  style={{ flex: 1, padding: '10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, background: 'transparent', color: step === 0 ? 'rgba(232,244,248,0.2)' : 'rgba(232,244,248,0.6)', fontFamily: HUD, fontSize: 8, letterSpacing: 1, cursor: step === 0 ? 'default' : 'pointer' }}>
                  ← PRÉCÉDENT
                </button>
                {step < steps.length - 1 ? (
                  <button onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
                    style={{ flex: 1, padding: '10px', border: '1px solid rgba(0,255,178,0.3)', borderRadius: 7, background: 'rgba(0,255,178,0.08)', color: '#00FFB2', fontFamily: HUD, fontSize: 8, letterSpacing: 1, cursor: 'pointer' }}>
                    SUIVANT →
                  </button>
                ) : (
                  <Link href="/auth/login" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', background: '#00FFB2', borderRadius: 7, color: '#020408', fontFamily: HUD, fontSize: 8, letterSpacing: 1, textDecoration: 'none', fontWeight: 700 }}>
                    🚀 COMMENCER →
                  </Link>
                )}
              </div>
            </div>
          </>
        )}

        {/* Avantages de l'app */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 2, color: 'rgba(232,244,248,0.4)', marginBottom: '1rem', textAlign: 'center' }}>
            POURQUOI INSTALLER L'APP ?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '12px' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{f.icon}</div>
                <div style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 1, color: '#E8F4F8', marginBottom: 3 }}>{f.title}</div>
                <div style={{ fontFamily: BODY, fontSize: 11, color: 'rgba(232,244,248,0.45)', lineHeight: 1.4 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA final */}
        <div style={{ background: 'linear-gradient(135deg, rgba(0,255,178,0.06), rgba(0,212,255,0.03))', border: '1px solid rgba(0,255,178,0.15)', borderRadius: 12, padding: '1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: HUD, fontSize: 10, color: '#00FFB2', letterSpacing: 2, marginBottom: 8 }}>
            DÉJÀ UN COMPTE ?
          </div>
          <p style={{ fontFamily: BODY, fontSize: 14, color: 'rgba(232,244,248,0.6)', margin: '0 0 1rem' }}>
            Connectez-vous pour accéder à vos analyses, votre journal et votre calculateur.
          </p>
          <Link href="/auth/login" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #00FFB2, #00D4FF)', color: '#020408', fontFamily: HUD, fontSize: 9, letterSpacing: 2, fontWeight: 700, padding: '12px 28px', borderRadius: 6, textDecoration: 'none' }}>
            SE CONNECTER →
          </Link>
        </div>

        {/* Pas encore inscrit */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: BODY, fontSize: 12, color: 'rgba(232,244,248,0.3)', margin: '0 0 8px' }}>
            Pas encore de compte ?
          </p>
          <Link href="/auth/login" style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 1, color: '#00D4FF', textDecoration: 'none' }}>
            CRÉER UN COMPTE GRATUIT — 10 CRÉDITS OFFERTS
          </Link>
        </div>

        <div style={{ height: '2rem' }} />
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700&display=swap');
      `}</style>
    </div>
  )
}
