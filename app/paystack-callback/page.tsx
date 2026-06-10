// ============================================================
// PROFITYX — /paystack-callback
// useSearchParams() doit être dans un <Suspense> (Next.js 14)
// ============================================================
'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams }               from 'next/navigation'
import { gtagPurchase }                  from '@/lib/gtag'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

function CallbackContent() {
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
          const p = data.data?.metadata?.plan ?? 'pro'
          const amount = data.data?.amount ?? 0
          setPlan(p)
          setStatus('success')
          gtagPurchase(p as 'pro'|'elite', amount / 100, 'NGN') // 🎯 Conversion achat
          setTimeout(() => { window.location.href = '/dashboard' }, 3000)
        } else {
          setStatus('error')
        }
      })
      .catch(() => setStatus('error'))
  }, [reference])

  return (
    <div style={{ textAlign:'center', maxWidth:480, padding:'2rem' }}>
      {status === 'loading' && (
        <>
          <div style={{ fontSize:48, marginBottom:16 }}>⏳</div>
          <div style={{ fontFamily:HUD, fontSize:12, letterSpacing:2, color:'#00FFB2' }}>
            VERIFYING PAYMENT...
          </div>
        </>
      )}
      {status === 'success' && (
        <>
          <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
          <div style={{ fontFamily:HUD, fontSize:16, fontWeight:900, color:'#00FFB2', marginBottom:8 }}>
            PLAN {plan.toUpperCase()} ACTIVATED!
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
          <div style={{ fontFamily:HUD, fontSize:14, color:'#FF3A5C', marginBottom:8 }}>
            PAYMENT NOT CONFIRMED
          </div>
          <p style={{ color:'rgba(240,248,255,0.5)', fontSize:14, marginBottom:24 }}>
            Please contact support if you were charged. Reference: {reference || 'N/A'}
          </p>
          <a href="/en#pricing" style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'#020408', background:'#FF3A5C', padding:'12px 28px', borderRadius:4, textDecoration:'none', fontWeight:700 }}>
            TRY AGAIN
          </a>
        </>
      )}
    </div>
  )
}

export default function PaystackCallbackPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#020408', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:BODY }}>
      <Suspense fallback={
        <div style={{ textAlign:'center', color:'#00FFB2', fontFamily:HUD, fontSize:12, letterSpacing:2 }}>
          LOADING...
        </div>
      }>
        <CallbackContent />
      </Suspense>
    </div>
  )
}
