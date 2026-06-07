// ============================================================
// PROFITYX — ReferralCard : parrainage dans le dashboard
// ============================================================
'use client'
import { useState, useEffect } from 'react'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

interface ReferralData {
  code: string
  ref_url: string
  wa_url: string
  stats: { total_filleuls: number; total_credits: number; dernier_parrainage: string | null }
}

export default function ReferralCard({ token }: { token: string }) {
  const [data,    setData]    = useState<ReferralData | null>(null)
  const [code,    setCode]    = useState('')
  const [applying, setApplying] = useState(false)
  const [result,  setResult]  = useState<{ ok: boolean; msg: string } | null>(null)
  const [copied,  setCopied]  = useState(false)

  useEffect(() => {
    if (!token) return
    fetch('/api/referral', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(j => { if (j.success) setData(j) })
  }, [token])

  const copyLink = async () => {
    if (!data) return
    try {
      await navigator.clipboard.writeText(data.ref_url)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback manuel
    }
  }

  const applyCode = async () => {
    if (!code.trim() || !token) return
    setApplying(true); setResult(null)
    const res  = await fetch('/api/referral', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ code: code.trim() }) })
    const json = await res.json()
    if (json.success) {
      setResult({ ok: true, msg: `✅ Code appliqué ! +${json.credits_bonus} crédits ajoutés.` })
      setCode('')
    } else {
      setResult({ ok: false, msg: `❌ ${json.error}` })
    }
    setApplying(false)
  }

  if (!data) return null

  return (
    <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:12, overflow:'hidden', marginTop:'1.25rem' }}>
      {/* Barre top */}
      <div style={{ height:2, background:'linear-gradient(90deg, transparent, var(--ac), var(--ac2), transparent)' }} />

      <div style={{ padding:'1.25rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'1rem' }}>
          <div style={{ width:36, height:36, borderRadius:9, background:'color-mix(in srgb, var(--ac) 12%, transparent)', border:'1px solid color-mix(in srgb, var(--ac) 25%, transparent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 20h5v-1a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-1c0-.656-.126-1.283-.356-1.857M7 20H2v-1a3 3 0 0 1 5.356-1.857M7 20v-1c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0" stroke="var(--ac)" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </div>
          <div>
            <div style={{ fontFamily:HUD, fontSize:11, color:'var(--tx0)', letterSpacing:1 }}>PARRAINER UN AMI</div>
            <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx3)' }}>+20 crédits pour vous · +10 crédits pour votre filleul</div>
          </div>
        </div>

        {/* Statistiques */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:'1rem' }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:8, padding:'0.75rem', textAlign:'center' }}>
            <div style={{ fontFamily:HUD, fontSize:22, fontWeight:900, color:'var(--ac)', lineHeight:1, marginBottom:4 }}>{data.stats.total_filleuls}</div>
            <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)' }}>FILLEULS</div>
          </div>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:8, padding:'0.75rem', textAlign:'center' }}>
            <div style={{ fontFamily:HUD, fontSize:22, fontWeight:900, color:'var(--ac2)', lineHeight:1, marginBottom:4 }}>{data.stats.total_credits}</div>
            <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)' }}>CRÉDITS GAGNÉS</div>
          </div>
        </div>

        {/* Lien de parrainage */}
        <div style={{ marginBottom:'0.875rem' }}>
          <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--tx3)', marginBottom:6 }}>VOTRE LIEN DE PARRAINAGE</div>
          <div style={{ display:'flex', gap:6 }}>
            <div style={{ flex:1, background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:6, padding:'9px 12px', fontFamily:'monospace', fontSize:11, color:'var(--ac)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              profity-x.com/auth/login?ref={data.code}
            </div>
            <button onClick={copyLink} style={{ background: copied ? 'var(--ok)' : 'var(--ac)', border:'none', borderRadius:6, padding:'9px 14px', cursor:'pointer', color:'#020408', fontFamily:HUD, fontSize:8, letterSpacing:1, fontWeight:700, flexShrink:0, whiteSpace:'nowrap' }}>
              {copied ? '✓ COPIÉ' : 'COPIER'}
            </button>
          </div>
        </div>

        {/* Partage WhatsApp */}
        <a href={data.wa_url} target="_blank" rel="noopener noreferrer"
          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'#25D366', borderRadius:8, padding:'11px', textDecoration:'none', marginBottom:'1rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.121.555 4.109 1.524 5.832L0 24l6.335-1.498A11.96 11.96 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.005-1.368l-.359-.213-3.72.879.894-3.628-.234-.373A9.772 9.772 0 0 1 2.182 12C2.182 6.575 6.575 2.182 12 2.182S21.818 6.575 21.818 12 17.425 21.818 12 21.818z"/></svg>
          <span style={{ fontFamily:HUD, fontSize:9, letterSpacing:1, color:'#fff', fontWeight:700 }}>PARTAGER SUR WHATSAPP</span>
        </a>

        {/* Saisir un code parrain */}
        <div style={{ borderTop:'1px solid var(--bd)', paddingTop:'0.875rem' }}>
          <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--tx3)', marginBottom:6 }}>VOUS AVEZ UN CODE PARRAIN ?</div>
          <div style={{ display:'flex', gap:6 }}>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="PX-XXXXXX"
              maxLength={10}
              style={{ flex:1, background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:6, padding:'9px 12px', color:'var(--tx0)', fontFamily:'monospace', fontSize:12, letterSpacing:1, outline:'none' }}
            />
            <button onClick={applyCode} disabled={applying || !code.trim()}
              style={{ background: applying || !code.trim() ? 'var(--bd)' : 'var(--ac2)', border:'none', borderRadius:6, padding:'9px 14px', cursor: applying ? 'wait' : 'pointer', color: applying || !code.trim() ? 'var(--tx3)' : '#020408', fontFamily:HUD, fontSize:8, letterSpacing:1, fontWeight:700, flexShrink:0 }}>
              {applying ? '...' : 'APPLIQUER'}
            </button>
          </div>
          {result && (
            <div style={{ marginTop:6, fontFamily:BODY, fontSize:13, color: result.ok ? 'var(--ok)' : 'var(--red)' }}>
              {result.msg}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
