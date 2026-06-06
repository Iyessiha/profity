'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { supabasePublic } from '@/lib/supabase'
import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'
import QuotaBar from '@/components/dashboard/QuotaBar'
import HistoryPanel from '@/components/dashboard/HistoryPanel'

export default function HistoryPage() {
  const [token,   setToken]   = useState('')
  const [user, setUser]       = useState<{ id: string; email?: string } | null>(null)
  const [profile, setProfile] = useState<Record<string,unknown>|null>(null)
  const [plan, setPlan]       = useState('free')
  const [locale, setLocale]   = useState('fr')

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabasePublic.auth.getSession()
      if (!session) { window.location.href = '/auth/login'; return }
      setUser(session.user as { id: string; email?: string })
      setToken(session.access_token)
      const { data: p } = await supabasePublic.from('profiles').select('*').eq('id', session.user.id).single()
      if (p) { setProfile(p); setPlan(p.user_plan as string || 'free'); setLocale(p.locale as string || 'fr') }
    })()
  }, [])

  return (
    <div className="app-shell">
      <Sidebar tab="history" setTab={() => {}} plan={plan} locale={locale} />
      <div className="app-main" style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'var(--bg0)', width:'100%', overflow:'hidden' }}>
        <TopBar locale={locale} profile={profile} />
        <QuotaBar token={token} locale={locale} plan={plan} />
        <div className="resp-pad" style={{ padding:'1.25rem 1.5rem', flex:1, width:'100%', overflowX:'hidden' }}>
          <div style={{ marginBottom:'1.25rem' }}>
            <div style={{ fontFamily:"'Orbitron',monospace", fontSize:10, letterSpacing:3, color:'var(--ac2)', marginBottom:4 }}>MODULE</div>
            <h1 style={{ fontFamily:"'Orbitron',monospace", fontSize:22, fontWeight:900, color:'var(--tx0)' }}>
              HISTO<span style={{ color:'var(--ac)' }}>RIQUE</span>
            </h1>
          </div>
          {user && <HistoryPanel locale={locale} userId={user.id} />}
        </div>

      {/* Footer légal */}
      <footer className="app-footer">
        <a href="/legal/cgu">CGU</a>
        <span style={{color:"var(--tx3)"}}>·</span>
        <a href="/legal/confidentialite">Confidentialité</a>
        <span style={{color:"var(--tx3)"}}>·</span>
        <a href="/legal/mentions">Mentions légales</a>
        <span style={{color:"var(--tx3)"}}>·</span>
        <a href="/support">Assistance</a>
      </footer>
          </div>
    </div>
  )
}
