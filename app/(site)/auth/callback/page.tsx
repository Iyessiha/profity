// ============================================================
// PROFITYX — app/auth/callback/page.tsx
// Callback OAuth — redirige admin → /admin/dashboard
//                          user  → /dashboard
// ============================================================
'use client'
export const dynamic = 'force-dynamic'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabasePublic } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handle = async () => {
      // Attendre que Supabase échange le code OAuth
      const { data: { session } } = await supabasePublic.auth.getSession()

      if (session) {
        const { data: profile } = await supabasePublic
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single()

        window.location.href = profile?.is_admin ? '/admin/dashboard' : '/dashboard'
      } else {
        // Écouter l'événement SIGNED_IN (OAuth asynchrone)
        const { data: { subscription } } = supabasePublic.auth.onAuthStateChange(
          async (event, sess) => {
            if (event === 'SIGNED_IN' && sess) {
              subscription.unsubscribe()
              const { data: profile } = await supabasePublic
                .from('profiles')
                .select('is_admin')
                .eq('id', sess.user.id)
                .single()

              window.location.href = profile?.is_admin ? '/admin/dashboard' : '/dashboard'
            }
          }
        )

        // Fallback après 5s
        setTimeout(() => {
          subscription.unsubscribe()
          window.location.href = '/auth/login'
        }, 5000)
      }
    }

    handle()
  }, [router])

  const HUD = "'Orbitron', monospace"

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#020408', gap: 24,
    }}>
      <div style={{ fontFamily: HUD, fontSize: 24, letterSpacing: 4, color: '#00FFB2' }}>
        PROFIT<span style={{ color: '#00D4FF' }}>YX</span>
      </div>

      <div style={{
        width: 44, height: 44,
        border: '2px solid rgba(0,255,178,0.1)',
        borderTop: '2px solid #00FFB2',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />

      <div style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 3, color: 'rgba(232,244,248,0.25)' }}>
        AUTHENTIFICATION EN COURS...
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #020408; }
      `}</style>
    </div>
  )
}
