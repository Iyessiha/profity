// ============================================================
// PROFITYX — Sélecteur de langue au premier atterrissage
// Affiché une seule fois, mémorisé dans localStorage
// ============================================================
'use client'
import { useState, useEffect } from 'react'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"
const KEY  = 'px_lang_chosen'

const LANGS = [
  { code:'fr', flag:'🇫🇷', label:'Français',  sub:'France · Côte d\'Ivoire · Sénégal · Bénin', color:'#00FFB2' },
  { code:'en', flag:'🇬🇧', label:'English',   sub:'Nigeria · Ghana · Kenya · South Africa',    color:'#00D4FF' },
]

interface Props { onChoice: (lang: 'fr' | 'en') => void }

export default function LangModal({ onChoice }: Props) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true)
    } catch {}
  }, [])

  const choose = (lang: 'fr' | 'en') => {
    try { localStorage.setItem(KEY, lang) } catch {}
    setLeaving(true)
    setTimeout(() => { setVisible(false); onChoice(lang) }, 350)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(2,4,8,0.96)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
      backdropFilter: 'blur(12px)',
      opacity: leaving ? 0 : 1,
      transition: 'opacity .35s ease',
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'linear-gradient(160deg, #0A1628, #060B14)',
        border: '1px solid rgba(0,255,178,0.15)',
        borderRadius: 18,
        padding: '2rem 1.5rem',
        boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
        animation: 'langIn .4s cubic-bezier(0.34,1.56,0.64,1)',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{ fontFamily: HUD, fontSize: 22, letterSpacing: 4, marginBottom: 4 }}>
          <span style={{ color: '#00FFB2' }}>PROFIT</span>
          <span style={{ color: '#00D4FF' }}>YX</span>
        </div>
        <div style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 3, color: 'rgba(232,244,248,0.3)', marginBottom: '2rem' }}>
          AI TRADING SIGNALS
        </div>

        {/* Titre */}
        <div style={{ fontFamily: HUD, fontSize: 12, color: '#E8F4F8', marginBottom: 6, letterSpacing: 1 }}>
          Choisissez votre langue
        </div>
        <div style={{ fontFamily: BODY, fontSize: 12, color: 'rgba(232,244,248,0.35)', marginBottom: '1.5rem' }}>
          Choose your language
        </div>

        {/* Boutons langue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {LANGS.map(l => (
            <button key={l.code} onClick={() => choose(l.code as 'fr' | 'en')} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: `${l.color}08`,
              border: `1px solid ${l.color}25`,
              borderRadius: 10, padding: '14px 18px',
              cursor: 'pointer', transition: 'all .2s', textAlign: 'left',
              width: '100%',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = `${l.color}15`)}
            onMouseLeave={e => (e.currentTarget.style.background = `${l.color}08`)}
            >
              <span style={{ fontSize: 28, flexShrink: 0 }}>{l.flag}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: HUD, fontSize: 13, color: l.color, marginBottom: 3 }}>
                  {l.label}
                </div>
                <div style={{ fontFamily: BODY, fontSize: 11, color: 'rgba(232,244,248,0.4)' }}>
                  {l.sub}
                </div>
              </div>
              <span style={{ color: l.color, opacity: 0.6, fontSize: 14 }}>→</span>
            </button>
          ))}
        </div>

        <div style={{ fontFamily: BODY, fontSize: 11, color: 'rgba(232,244,248,0.2)', marginTop: '1.25rem' }}>
          Vous pourrez changer la langue dans les paramètres · You can change later in settings
        </div>
      </div>

      <style>{`
        @keyframes langIn {
          from { transform: scale(0.85) translateY(24px); opacity: 0 }
          to   { transform: scale(1) translateY(0); opacity: 1 }
        }
      `}</style>
    </div>
  )
}
