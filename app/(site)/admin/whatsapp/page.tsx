'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { supabasePublic } from '@/lib/supabase'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

interface Lead { phone:string; name?:string; plan_asked?:string; registered:boolean; created_at:string }
interface Msg  { role:string; content:string; created_at:string }

export default function WhatsAppAdmin() {
  const [leads,   setLeads]   = useState<Lead[]>([])
  const [convs,   setConvs]   = useState<Msg[]>([])
  const [phone,   setPhone]   = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data:{ session } } = await supabasePublic.auth.getSession()
      if (!session) { window.location.href='/auth/login'; return }
      const { data:p } = await supabasePublic.from('profiles').select('is_admin').eq('id', session.user.id).single()
      if (!p?.is_admin) { window.location.href='/dashboard'; return }
      const { data } = await supabasePublic.from('whatsapp_leads').select('*').order('created_at', { ascending:false }).limit(100)
      setLeads(data ?? [])
      setLoading(false)
    })()
  }, [])

  const loadConv = async (p: string) => {
    setPhone(p)
    const { data } = await supabasePublic.from('whatsapp_conversations').select('*').eq('phone', p).order('created_at', { ascending:true }).limit(50)
    setConvs(data ?? [])
  }

  if (loading) return <div style={{ minHeight:'100vh', background:'#020408', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:HUD, color:'#00FFB2' }}>Chargement...</div>

  return (
    <div style={{ minHeight:'100vh', background:'#020408', display:'flex' }}>
      {/* Liste des leads */}
      <div style={{ width:320, borderRight:'1px solid rgba(0,255,178,0.1)', padding:'1.5rem 1rem', overflowY:'auto' }}>
        <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:2, color:'#00FFB2', marginBottom:'1rem' }}>
          📱 LEADS WHATSAPP ({leads.length})
        </div>
        {leads.map(l => (
          <div key={l.phone} onClick={() => loadConv(l.phone)}
            style={{ background: phone===l.phone ? 'rgba(0,255,178,0.08)' : 'var(--bg1,#0A1628)', border:`1px solid ${phone===l.phone?'rgba(0,255,178,0.25)':'rgba(255,255,255,0.06)'}`, borderRadius:8, padding:'10px 12px', marginBottom:8, cursor:'pointer' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontFamily:HUD, fontSize:9, color:'#E8F4F8' }}>{l.phone}</span>
              {l.plan_asked && <span style={{ fontFamily:HUD, fontSize:7, color:'#00FFB2', background:'rgba(0,255,178,0.1)', padding:'2px 6px', borderRadius:3 }}>{l.plan_asked.toUpperCase()}</span>}
            </div>
            <div style={{ fontFamily:BODY, fontSize:11, color:'rgba(232,244,248,0.4)' }}>
              {new Date(l.created_at).toLocaleDateString('fr-FR')} · {l.registered ? '✅ Inscrit' : '⏳ Prospect'}
            </div>
          </div>
        ))}
      </div>

      {/* Conversation */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'1.5rem' }}>
        {!phone ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:BODY, fontSize:16, color:'rgba(232,244,248,0.3)' }}>
            Sélectionne un contact pour voir la conversation
          </div>
        ) : (
          <>
            <div style={{ fontFamily:HUD, fontSize:10, color:'#00FFB2', marginBottom:'1rem', letterSpacing:1 }}>
              💬 Conversation avec {phone}
            </div>
            <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:10 }}>
              {convs.map((m, i) => (
                <div key={i} style={{ display:'flex', justifyContent: m.role==='user' ? 'flex-start' : 'flex-end' }}>
                  <div style={{ maxWidth:'70%', background: m.role==='user' ? 'rgba(255,255,255,0.05)' : 'rgba(0,255,178,0.08)', border:`1px solid ${m.role==='user'?'rgba(255,255,255,0.08)':'rgba(0,255,178,0.15)'}`, borderRadius:10, padding:'10px 14px' }}>
                    <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'rgba(232,244,248,0.3)', marginBottom:5 }}>
                      {m.role==='user' ? '👤 CLIENT' : '🤖 PROFI'} · {new Date(m.created_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
                    </div>
                    <div style={{ fontFamily:BODY, fontSize:14, color:'rgba(232,244,248,0.85)', lineHeight:1.6, whiteSpace:'pre-wrap' }}>{m.content}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
