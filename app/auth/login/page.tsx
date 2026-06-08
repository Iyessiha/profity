'use client'
import { gtagLead } from '@/lib/gtag'
import { pixelLead } from '@/lib/pixel'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabasePublic } from '@/lib/supabase'

export default function LoginPage() {
  const [mode,     setMode]    = useState<'login' | 'signup'>('login')
  const [email,    setEmail]   = useState('')
  const [password, setPassword]= useState('')
  const [name,     setName]    = useState('')
  const [loading,  setLoading] = useState(false)
  const [error,    setError]   = useState<string | null>(null)
  const [success,  setSuccess] = useState<string | null>(null)
  const [refCode,  setRefCode] = useState('')

  useEffect(() => {
    // Capturer le code parrain depuis l'URL et le stocker
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      localStorage.setItem('px_ref', ref.toUpperCase())
      setRefCode(ref.toUpperCase())
      setMode('signup') // Basculer directement vers l'inscription
    } else {
      const stored = localStorage.getItem('px_ref')
      if (stored) setRefCode(stored)
    }
  }, [])

  const HUD  = "'Orbitron', monospace"
  const BODY = "'Rajdhani', sans-serif"

  const goToDashboard = async (userId: string) => {
    try {
      const { data: profile } = await supabasePublic
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single()
      window.location.replace(profile?.is_admin ? '/admin/dashboard' : '/dashboard')
    } catch {
      window.location.replace('/dashboard')
    }
  }

  const handleLogin = async () => {
    if (!email || !password) { setError('Email et mot de passe requis'); return }
    setLoading(true)
    setError(null)

    const { data, error: e } = await supabasePublic.auth.signInWithPassword({ email, password })

    if (e) {
      setError(
        e.message.includes('Invalid login credentials') ? 'Email ou mot de passe incorrect'
        : e.message.includes('Email not confirmed') ? 'Confirmez votre email avant de vous connecter'
        : e.message
      )
      setLoading(false)
      return
    }

    if (data.user) {
      // Appliquer le code parrain en attente (stocké avant la confirmation email)
      const pendingRef = localStorage.getItem('px_ref')
      if (pendingRef && data.session?.access_token) {
        try {
          await fetch('/api/referral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
            body: JSON.stringify({ code: pendingRef }),
          })
        } catch {} finally {
          localStorage.removeItem('px_ref')
        }
      }
      await goToDashboard(data.user.id)
    }
  }

  const handleSignup = async () => {
    if (!email || !password) { setError('Email et mot de passe requis'); return }
    if (password.length < 8) { setError('Mot de passe : minimum 8 caractères'); return }
    setLoading(true)
    setError(null)

    const { data: signUpData, error: e } = await supabasePublic.auth.signUp({
      email, password,
      options: { data: { full_name: name || email.split('@')[0], ref_code: refCode || localStorage.getItem('px_ref') || '' } },
    })

    if (e) {
      setError(e.message.includes('already registered') ? 'Cet email est déjà utilisé.' : e.message)
    } else {
      // Appliquer le code parrain si présent
      const ref = refCode || localStorage.getItem('px_ref')
      if (ref && signUpData?.user) {
        try {
          const session = await supabasePublic.auth.getSession()
          const token = session.data.session?.access_token
          if (token) {
            await fetch('/api/referral', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ code: ref }),
            })
          }
        } catch {} finally {
          localStorage.removeItem('px_ref')
        }
      }
      setSuccess(`Compte créé !${ref ? ' +10 crédits bonus parrainage offerts.' : ''} Vérifiez votre email.`)
      setMode('login')
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    await supabasePublic.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: '#0A0F1A', border: '1px solid rgba(0,255,178,0.15)',
    borderRadius: 4, color: '#E8F4F8', fontFamily: BODY, fontSize: 15, outline: 'none',
  }

  return (
    <div className="login-shell" style={{ background: '#020408', fontFamily: BODY, position: 'relative', overflow: 'hidden' }}>

      {/* Fond grille */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,255,178,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,178,0.025) 1px,transparent 1px)', backgroundSize: '50px 50px', maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%,black 0%,transparent 100%)' }} />

      {/* Panneau gauche — Branding */}
      <div className="login-brand" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: '3rem' }}>
          {/* Logo cliquable → landing page */}
          <a href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <div style={{ fontFamily: HUD, fontSize: 32, letterSpacing: 5, color: '#00FFB2', lineHeight: 1 }}>
              PROFIT<span style={{ color: '#00D4FF' }}>YX</span>
            </div>
            <div style={{ fontFamily: BODY, fontSize: 12, color: 'rgba(232,244,248,0.3)', letterSpacing: 4, marginTop: 6 }}>AI TRADING SIGNALS</div>
          </a>
        </div>
        <h1 style={{ fontFamily: HUD, fontSize: 'clamp(32px,4vw,56px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: 2, color: '#E8F4F8', marginBottom: '1.5rem' }}>
          TRADEZ<br /><span style={{ color: '#00FFB2' }}>PLUS</span><br />
          <span style={{ WebkitTextStroke: '1px rgba(0,255,178,0.4)', color: 'transparent' }}>SMART</span>
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(232,244,248,0.45)', lineHeight: 1.8, maxWidth: 400, fontWeight: 300 }}>
          Signaux IA sur BTC, Forex et annonces économiques. Entrée, Stop Loss, Take Profit — en secondes.
        </p>
        <div style={{ display: 'flex', gap: '2rem', marginTop: '3rem' }}>
          {[{ n: '4 800+', l: 'Traders' }, { n: '94%', l: 'Précision' }, { n: '24/7', l: 'Analyse' }].map(s => (
            <div key={s.l} style={{ borderLeft: '2px solid rgba(0,255,178,0.25)', paddingLeft: '1rem' }}>
              <div style={{ fontFamily: HUD, fontSize: 22, color: '#00FFB2', fontWeight: 900 }}>{s.n}</div>
              <div style={{ fontSize: 12, color: 'rgba(232,244,248,0.3)', letterSpacing: 1, marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Séparateur */}
      <div className="login-sep" style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,255,178,0.15), transparent)', flexShrink: 0 }} />

      {/* Panneau droit — Formulaire */}
      <div className="login-form" style={{ position: 'relative', zIndex: 1 }}>

        {/* Retour landing — visible surtout sur mobile */}
        <a href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: HUD, fontSize: 8, letterSpacing: 2,
          color: 'rgba(232,244,248,0.35)', textDecoration: 'none',
          marginBottom: '1.5rem',
          padding: '6px 10px', borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.06)',
          transition: 'all .2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.color = '#00FFB2'; e.currentTarget.style.borderColor = 'rgba(0,255,178,0.25)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(232,244,248,0.35)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 12 }} />
          RETOUR AU SITE
        </a>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: '2rem', background: '#0A0F1A', padding: 4, borderRadius: 6, border: '1px solid rgba(0,255,178,0.08)' }}>
          {(['login', 'signup'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(null); setSuccess(null) }}
              style={{ flex: 1, padding: '9px', border: 'none', borderRadius: 4, background: mode === m ? 'rgba(0,255,178,0.1)' : 'transparent', color: mode === m ? '#00FFB2' : 'rgba(232,244,248,0.3)', fontFamily: HUD, fontSize: 10, letterSpacing: 2, cursor: 'pointer', outline: mode === m ? '1px solid rgba(0,255,178,0.2)' : 'none', transition: 'all .2s' }}>
              {m === 'login' ? 'CONNEXION' : 'INSCRIPTION'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'signup' && (
            <div>
              <label style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 2, color: 'rgba(232,244,248,0.35)', display: 'block', marginBottom: 7 }}>NOM COMPLET</label>
              <input type="text" value={name} placeholder="Jean Kouassi" onChange={e => setName(e.target.value)} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'rgba(0,255,178,0.5)')}
                onBlur={e  => (e.target.style.borderColor = 'rgba(0,255,178,0.15)')} />
            </div>
          )}

          {/* Badge code parrain détecté */}
          {mode === 'signup' && refCode && (
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(0,255,178,0.06)', border:'1px solid rgba(0,255,178,0.2)', borderRadius:6, padding:'9px 12px' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zm0 2l1.5 3H12l-2.5 1.8 1 3L8 10l-2.5 1.8 1-3L4 7h2.5z" fill="#00FFB2"/></svg>
              <span style={{ fontFamily:"'Orbitron',monospace", fontSize:9, color:'#00FFB2', letterSpacing:1 }}>CODE PARRAIN : {refCode}</span>
              <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:12, color:'rgba(232,244,248,0.5)', marginLeft:'auto' }}>+10 crédits offerts</span>
            </div>
          )}

          <div>
            <label style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 2, color: 'rgba(232,244,248,0.35)', display: 'block', marginBottom: 7 }}>EMAIL</label>
            <input type="email" value={email} placeholder="trader@profityx.app" onChange={e => setEmail(e.target.value)} style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'rgba(0,255,178,0.5)')}
              onBlur={e  => (e.target.style.borderColor = 'rgba(0,255,178,0.15)')} />
          </div>

          <div>
            <label style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 2, color: 'rgba(232,244,248,0.35)', display: 'block', marginBottom: 7 }}>MOT DE PASSE</label>
            <input type="password" value={password} placeholder="••••••••" onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())} style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'rgba(0,255,178,0.5)')}
              onBlur={e  => (e.target.style.borderColor = 'rgba(0,255,178,0.15)')} />
          </div>

          {error && (
            <div style={{ background: 'rgba(255,58,92,0.08)', border: '1px solid rgba(255,58,92,0.25)', borderRadius: 4, padding: '10px 12px', fontFamily: BODY, fontSize: 13, color: '#FF3A5C' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: 'rgba(0,255,178,0.06)', border: '1px solid rgba(0,255,178,0.2)', borderRadius: 4, padding: '10px 12px', fontFamily: BODY, fontSize: 13, color: '#00FFB2' }}>
              {success}
            </div>
          )}

          <button onClick={mode === 'login' ? handleLogin : handleSignup} disabled={loading}
            style={{ width: '100%', padding: '13px', background: loading ? 'rgba(0,255,178,0.4)' : '#00FFB2', border: 'none', borderRadius: 4, fontFamily: HUD, fontSize: 11, letterSpacing: 3, color: '#020408', fontWeight: 700, cursor: loading ? 'wait' : 'pointer', transition: 'all .2s', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? (
              <><div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTop: '2px solid #020408', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />{mode === 'login' ? 'CONNEXION...' : 'CRÉATION...'}</>
            ) : mode === 'login' ? 'SE CONNECTER →' : 'CRÉER MON COMPTE →'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,255,178,0.06)' }} />
            <span style={{ fontFamily: HUD, fontSize: 8, color: 'rgba(232,244,248,0.2)', letterSpacing: 2 }}>OU</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,255,178,0.06)' }} />
          </div>

          <button onClick={handleGoogle}
            style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid rgba(0,255,178,0.12)', borderRadius: 4, color: '#E8F4F8', fontFamily: BODY, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,255,178,0.3)'; e.currentTarget.style.background = 'rgba(0,255,178,0.03)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,255,178,0.12)'; e.currentTarget.style.background = 'transparent' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuer avec Google
          </button>

          {mode === 'login' && (
            <button onClick={async () => {
              if (!email) { setError('Entrez votre email'); return }
              await supabasePublic.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/reset` })
              setSuccess('Email de réinitialisation envoyé !')
            }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: HUD, fontSize: 8, letterSpacing: 1, color: 'rgba(0,212,255,0.5)', textAlign: 'center', padding: '4px' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#00D4FF')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,212,255,0.5)')}>
              MOT DE PASSE OUBLIÉ ?
            </button>
          )}
        </div>

        <p style={{ marginTop: '2.5rem', textAlign: 'center', fontFamily: HUD, fontSize: 7, letterSpacing: 1, color: 'rgba(232,244,248,0.15)', lineHeight: 1.8 }}>
          © 2026 MonWe Infinity LLC · Albuquerque, NM, USA
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
