// ============================================================
// PROFITYX — app/auth/reset/page.tsx
// Cible du lien « mot de passe oublié » (resetPasswordForEmail redirectTo).
// Supabase ouvre une session de récupération à partir du lien, puis on
// appelle updateUser({ password }).
// ============================================================
'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabasePublic } from '@/lib/supabase'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

export default function ResetPasswordPage() {
  const [ready,    setReady]    = useState(false)
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [done,     setDone]     = useState(false)

  useEffect(() => {
    // La session de récupération est établie depuis le fragment d'URL par supabase-js
    const { data: { subscription } } = supabasePublic.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })
    supabasePublic.auth.getSession().then(({ data: { session } }) => { if (session) setReady(true) })
    return () => subscription.unsubscribe()
  }, [])

  const submit = async () => {
    setError(null)
    if (password.length < 8) { setError('Mot de passe : minimum 8 caractères'); return }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    setLoading(true)
    const { error: e } = await supabasePublic.auth.updateUser({ password })
    setLoading(false)
    if (e) { setError(e.message); return }
    setDone(true)
    setTimeout(() => { window.location.replace('/dashboard') }, 1500)
  }

  const input: React.CSSProperties = {
    width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.03)', color:'#E8F4F8',
    border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontFamily:BODY, fontSize:15, outline:'none',
  }

  return (
    <div style={{ minHeight:'100vh', background:'#020408', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem', fontFamily:BODY }}>
      <div style={{ width:'100%', maxWidth:400, display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ fontFamily:HUD, fontSize:14, fontWeight:900, letterSpacing:2, color:'#00FFB2', textAlign:'center' }}>
          NOUVEAU MOT DE PASSE
        </div>

        {done ? (
          <p style={{ color:'#00FFB2', textAlign:'center' }}>✓ Mot de passe mis à jour. Redirection…</p>
        ) : !ready ? (
          <p style={{ color:'rgba(232,244,248,0.5)', textAlign:'center' }}>
            Vérification du lien… Si rien ne se passe, le lien a expiré :{' '}
            <a href="/auth/login" style={{ color:'#00D4FF' }}>demandez-en un nouveau</a>.
          </p>
        ) : (
          <>
            <input type="password" placeholder="Nouveau mot de passe" value={password}
              onChange={e => setPassword(e.target.value)} style={input} autoComplete="new-password" />
            <input type="password" placeholder="Confirmer" value={confirm}
              onChange={e => setConfirm(e.target.value)} style={input} autoComplete="new-password"
              onKeyDown={e => { if (e.key === 'Enter') submit() }} />
            {error && <div style={{ color:'#FF4D6A', fontSize:13 }}>{error}</div>}
            <button onClick={submit} disabled={loading} style={{
              padding:'12px', background:'linear-gradient(135deg,#00FFB2,#00D4FF)', color:'#020408', border:'none',
              borderRadius:8, fontFamily:HUD, fontSize:11, fontWeight:900, letterSpacing:2, cursor:loading ? 'wait' : 'pointer',
            }}>{loading ? '…' : 'VALIDER'}</button>
          </>
        )}
      </div>
    </div>
  )
}
