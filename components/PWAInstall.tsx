// ============================================================
// PROFITYX — PWAInstall
// Invite d'installation automatique (Android + iOS) FR/EN
// ============================================================
'use client'
import { useState, useEffect } from 'react'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const COPY = {
  fr: {
    title:       'Installer ProfityX',
    android:     "Installez l'app pour un accès hors ligne et des alertes push.",
    ios:         "Ajoutez l'app sur votre écran d'accueil pour un accès rapide.",
    how:         'COMMENT INSTALLER',
    step1t:      'Appuyez sur',   step1s: "le bouton Partager en bas de Safari",
    step2t:      'Choisissez',    step2s: '"Sur l\'écran d\'accueil"',
    step3t:      'Appuyez sur',   step3s: '"Ajouter" en haut à droite',
    install:     "INSTALLER L'APP",
    later:       'PLUS TARD',
  },
  en: {
    title:       'Install ProfityX',
    android:     'Install the app for offline access and push alerts.',
    ios:         'Add the app to your home screen for quick access.',
    how:         'HOW TO INSTALL',
    step1t:      'Tap',          step1s: 'the Share button at the bottom of Safari',
    step2t:      'Choose',       step2s: '"Add to Home Screen"',
    step3t:      'Tap',          step3s: '"Add" in the top right',
    install:     'INSTALL APP',
    later:       'LATER',
  },
}

export default function PWAInstall() {
  const [show,      setShow]      = useState(false)
  const [isIOS,     setIsIOS]     = useState(false)
  const [lang,      setLang]      = useState<'fr'|'en'>('fr')
  const [deferredPrompt, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Lire la langue préférée
    const l = localStorage.getItem('pxLang') as 'fr'|'en' | null
    if (l === 'en') setLang('en')
    // Déjà installé → ne rien afficher
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // Déjà refusé récemment (48h)
    const dismissed = localStorage.getItem('pwa_dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 48 * 3600 * 1000) return

    // Détecter iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) &&
                !('MSStream' in window) &&
                !/CriOS|FxiOS/i.test(navigator.userAgent) // pas Chrome iOS
    setIsIOS(ios)

    if (ios) {
      // iOS : afficher le banner après 5 secondes
      const t = setTimeout(() => setShow(true), 5000)
      return () => clearTimeout(t)
    }

    // Android / Chrome : capturer l'événement beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      // Afficher le banner après 4 secondes
      setTimeout(() => setShow(true), 4000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShow(false)
        localStorage.setItem('pwa_dismissed', Date.now().toString())
      }
    }
    setShow(false)
  }

  const dismiss = () => {
    setShow(false)
    localStorage.setItem('pwa_dismissed', Date.now().toString())
  }

  const c = COPY[lang]

  if (!show) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      width: 'calc(100vw - 2rem)',
      maxWidth: 420,
      background: 'linear-gradient(135deg, #0A1628, #060B14)',
      border: '1px solid rgba(0,255,178,0.3)',
      borderRadius: 14,
      boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,255,178,0.05)',
      overflow: 'hidden',
      animation: 'slideUp .4s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      {/* Barre verte top */}
      <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #00FFB2, #00D4FF, transparent)' }} />

      <div style={{ padding: '1rem 1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* Icône app */}
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #00FFB2, #00D4FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(0,255,178,0.3)' }}>
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="18" width="4" height="10" rx="1.5" fill="#020408"/>
              <rect x="11" y="12" width="4" height="16" rx="1.5" fill="#020408"/>
              <rect x="18" y="6"  width="4" height="22" rx="1.5" fill="#020408"/>
              <rect x="25" y="10" width="4" height="18" rx="1.5" fill="#020408"/>
            </svg>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: HUD, fontSize: 11, fontWeight: 900, color: '#E8F4F8', letterSpacing: 0.5, marginBottom: 3 }}>
              {c.title}
            </div>
            <div style={{ fontFamily: BODY, fontSize: 13, color: 'rgba(232,244,248,0.55)', lineHeight: 1.5 }}>
              {isIOS ? c.ios : c.android}
            </div>
          </div>

          {/* Bouton fermer */}
          <button onClick={dismiss} style={{ background: 'transparent', border: 'none', color: 'rgba(232,244,248,0.3)', cursor: 'pointer', fontSize: 18, flexShrink: 0, padding: 0, lineHeight: 1 }}>✕</button>
        </div>

        {/* Instructions iOS */}
        {isIOS && (
          <div style={{ marginTop: '0.875rem', background: 'rgba(0,255,178,0.04)', border: '1px solid rgba(0,255,178,0.1)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontFamily: HUD, fontSize: 7, letterSpacing: 2, color: 'rgba(232,244,248,0.4)', marginBottom: 8 }}>{c.how}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { n:'1', t: c.step1t, icon:'⬆️', sub: c.step1s },
                { n:'2', t: c.step2t, icon:'➕', sub: c.step2s },
                { n:'3', t: c.step3t, icon:'✅', sub: c.step3s },
              ].map(s => (
                <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: HUD, fontSize: 9, color: '#00FFB2', width: 16, flexShrink: 0 }}>{s.n}</span>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
                  <span style={{ fontFamily: BODY, fontSize: 12, color: 'rgba(232,244,248,0.6)' }}>
                    {s.t} <strong style={{ color: '#E8F4F8' }}>{s.sub}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bouton Android */}
        {!isIOS && deferredPrompt && (
          <div style={{ marginTop: '0.875rem', display: 'flex', gap: 8 }}>
            <button onClick={install} style={{ flex: 1, background: '#00FFB2', border: 'none', borderRadius: 8, padding: '11px', fontFamily: HUD, fontSize: 10, letterSpacing: 1, fontWeight: 900, color: '#020408', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3v13M7 11l5 5 5-5M5 20h14" stroke="#020408" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {c.install}
            </button>
            <button onClick={dismiss} style={{ background: 'transparent', border: '1px solid rgba(232,244,248,0.1)', borderRadius: 8, padding: '11px 14px', fontFamily: HUD, fontSize: 9, color: 'rgba(232,244,248,0.4)', cursor: 'pointer' }}>
              {c.later}
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes slideUp { from { transform:translateX(-50%) translateY(120%); opacity:0 } to { transform:translateX(-50%) translateY(0); opacity:1 } }`}</style>
    </div>
  )
}
      {/* Barre verte top */}
      <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #00FFB2, #00D4FF, transparent)' }} />

      <div style={{ padding: '1rem 1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* Icône app */}
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #00FFB2, #00D4FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(0,255,178,0.3)' }}>
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="18" width="4" height="10" rx="1.5" fill="#020408"/>
              <rect x="11" y="12" width="4" height="16" rx="1.5" fill="#020408"/>
              <rect x="18" y="6"  width="4" height="22" rx="1.5" fill="#020408"/>
              <rect x="25" y="10" width="4" height="18" rx="1.5" fill="#020408"/>
            </svg>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: HUD, fontSize: 11, fontWeight: 900, color: '#E8F4F8', letterSpacing: 0.5, marginBottom: 3 }}>
              Installer ProfityX
            </div>
            <div style={{ fontFamily: BODY, fontSize: 13, color: 'rgba(232,244,248,0.55)', lineHeight: 1.5 }}>
              {isIOS
                ? 'Ajoutez l\'app sur votre écran d\'accueil pour un accès rapide.'
                : 'Installez l\'app pour un accès hors ligne et des alertes push.'}
            </div>
          </div>

          {/* Bouton fermer */}
          <button onClick={dismiss} style={{ background: 'transparent', border: 'none', color: 'rgba(232,244,248,0.3)', cursor: 'pointer', fontSize: 18, flexShrink: 0, padding: 0, lineHeight: 1 }}>✕</button>
        </div>

        {/* Instructions iOS */}
        {isIOS && (
          <div style={{ marginTop: '0.875rem', background: 'rgba(0,255,178,0.04)', border: '1px solid rgba(0,255,178,0.1)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontFamily: HUD, fontSize: 7, letterSpacing: 2, color: 'rgba(232,244,248,0.4)', marginBottom: 8 }}>COMMENT INSTALLER</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { n:'1', t:'Appuyez sur', icon:'⬆️', sub:'le bouton Partager en bas de Safari' },
                { n:'2', t:'Choisissez', icon:'➕', sub:'"Sur l\'écran d\'accueil"' },
                { n:'3', t:'Appuyez sur', icon:'✅', sub:'"Ajouter" en haut à droite' },
              ].map(s => (
                <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: HUD, fontSize: 9, color: '#00FFB2', width: 16, flexShrink: 0 }}>{s.n}</span>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
                  <span style={{ fontFamily: BODY, fontSize: 12, color: 'rgba(232,244,248,0.6)' }}>
                    {s.t} <strong style={{ color: '#E8F4F8' }}>{s.sub}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bouton Android */}
        {!isIOS && deferredPrompt && (
          <div style={{ marginTop: '0.875rem', display: 'flex', gap: 8 }}>
            <button onClick={install} style={{ flex: 1, background: '#00FFB2', border: 'none', borderRadius: 8, padding: '11px', fontFamily: HUD, fontSize: 10, letterSpacing: 1, fontWeight: 900, color: '#020408', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3v13M7 11l5 5 5-5M5 20h14" stroke="#020408" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              INSTALLER L'APP
            </button>
            <button onClick={dismiss} style={{ background: 'transparent', border: '1px solid rgba(232,244,248,0.1)', borderRadius: 8, padding: '11px 14px', fontFamily: HUD, fontSize: 9, color: 'rgba(232,244,248,0.4)', cursor: 'pointer' }}>
              PLUS TARD
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes slideUp { from { transform:translateX(-50%) translateY(120%); opacity:0 } to { transform:translateX(-50%) translateY(0); opacity:1 } }`}</style>
    </div>
  )
}
