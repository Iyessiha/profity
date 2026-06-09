// ============================================================
// PROFITYX — /paystack-callback
// Page de retour après paiement Paystack
// ============================================================
'use client'
import { useEffect, useState } from 'react'
import { useSearchParams }      from 'next/navigation'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

export default function PaystackCallback() {
  const params    = useSearchParams()
  const reference = params.get('reference') ?? params.get('ref') ?? ''
  const [status, setStatus] = useState<'loading'|'success'|'error'>('loading')
  const [plan,   setPlan]   = useState('')

  useEffect(() => {
    if (!reference) { setStatus('error'); return }
    fetch(`/api/payment/paystack/verify?reference=${reference}`)
      .then(r => r.json())
      .then(data => {
        if (data.data?.status === 'success') {
          setPlan(data.data?.metadata?.plan ?? 'pro')
          setStatus('success')
          setTimeout(() => { window.location.href = '/dashboard' }, 3000)
        } else {
          setStatus('error')
        }
      })
      .catch(() => setStatus('error'))
  }, [reference])

  return (
    <div style={{ minHeight:'100vh', background:'#020408', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:BODY }}>
      <div style={{ textAlign:'center', maxWidth:480, padding:'2rem' }}>
        {status === 'loading' && (
          <>
            <div style={{ fontSize:48, marginBottom:16 }}>⏳</div>
            <div style={{ fontFamily:HUD, fontSize:12, letterSpacing:2, color:'#00FFB2' }}>VÉRIFICATION DU PAIEMENT...</div>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
            <div style={{ fontFamily:HUD, fontSize:16, fontWeight:900, color:'#00FFB2', marginBottom:8 }}>
              PLAN {plan.toUpperCase()} ACTIVÉ !
            </div>
            <p style={{ color:'rgba(240,248,255,0.6)', fontSize:15, marginBottom:24 }}>
              Payment confirmed. Your credits have been added to your account.
            </p>
            <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'rgba(240,248,255,0.3)' }}>
              Redirecting to dashboard in 3 seconds...
            </div>
            <a href="/dashboard" style={{ display:'inline-block', marginTop:20, fontFamily:HUD, fontSize:10, letterSpacing:2, color:'#020408', background:'#00FFB2', padding:'12px 32px', borderRadius:4, textDecoration:'none', fontWeight:700 }}>
              GO TO DASHBOARD →
            </a>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize:48, marginBottom:16 }}>❌</div>
            <div style={{ fontFamily:HUD, fontSize:14, color:'#FF3A5C', marginBottom:8 }}>PAYMENT NOT CONFIRMED</div>
            <p style={{ color:'rgba(240,248,255,0.5)', fontSize:14, marginBottom:24 }}>
              Please contact support if you were charged. Reference: {reference}
            </p>
            <a href="/pricing" style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'#020408', background:'#FF3A5C', padding:'12px 28px', borderRadius:4, textDecoration:'none', fontWeight:700 }}>
              TRY AGAIN
            </a>
          </>
        )}
      </div>
    </div>
  )
}
