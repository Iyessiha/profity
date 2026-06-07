// ============================================================
// PROFITYX — /share/[id] : Page de partage publique d'un signal
// ============================================================
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

interface Analysis {
  id: string; pair: string; direction: string; entry: number
  stop_loss: number; tp1: number; tp2?: number; rr_ratio: number
  conclusion: string; trade_result?: string; created_at: string
  profiles?: { full_name?: string; public_id?: string }
}

async function getAnalysis(id: string): Promise<Analysis | null> {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data } = await db
    .from('chart_analyses')
    .select('id, pair, direction, entry, stop_loss, tp1, tp2, rr_ratio, conclusion, trade_result, created_at, profiles(full_name, public_id)')
    .eq('id', id)
    .single()
  return data as Analysis | null
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const a = await getAnalysis(params.id)
  if (!a) return { title: 'ProfityX' }
  const result = a.trade_result === 'WIN' ? '✅ WIN' : a.trade_result === 'LOSS' ? '❌ LOSS' : '📊 Signal'
  return {
    title: `${result} ${a.direction} ${a.pair} — ProfityX`,
    description: `Signal IA généré par ProfityX · ${a.pair} ${a.direction} · R/R ${a.rr_ratio} · Entrée ${a.entry}`,
    openGraph: {
      title: `${result} ${a.direction} ${a.pair} · ProfityX`,
      description: `Signal analysé par IA · R/R ${a.rr_ratio} · Résultat : ${a.trade_result ?? 'En cours'}`,
      siteName: 'ProfityX',
    },
    twitter: { card: 'summary', title: `${result} ${a.pair} · ProfityX` },
  }
}

export default async function SharePage({ params }: { params: { id: string } }) {
  const a = await getAnalysis(params.id)
  if (!a) notFound()

  const isWin  = a.trade_result === 'WIN'
  const isLoss = a.trade_result === 'LOSS'
  const hasResult = isWin || isLoss
  const traderName = (a.profiles as {full_name?: string})?.full_name?.split(' ')[0] ?? 'Un trader'
  const refCode    = (a.profiles as {public_id?: string})?.public_id ?? ''
  const signupUrl  = `https://profity-x.com/auth/login${refCode ? `?ref=${refCode}` : ''}`
  const shareUrl   = `https://profity-x.com/share/${a.id}`
  const date       = new Date(a.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })

  const dirColor = a.direction === 'LONG' ? '#00FFB2' : '#FF3A5C'
  const resColor = isWin ? '#00FFB2' : isLoss ? '#FF3A5C' : '#C9A84C'

  const waText = encodeURIComponent(
    `${isWin ? '✅ TRADE GAGNANT' : '📊 MON SIGNAL PROFITYX'} — ${a.direction} ${a.pair}\n\n` +
    `🎯 Entrée : ${a.entry}\n🛑 Stop   : ${a.stop_loss}\n✅ TP1    : ${a.tp1}\n⚖️ R/R    : ${a.rr_ratio}\n` +
    `${hasResult ? `\n🏆 Résultat : ${a.trade_result}\n` : ''}` +
    `\n🤖 Généré par l'IA ProfityX\n👉 Rejoins-moi : ${signupUrl}`
  )

  return (
    <div style={{ minHeight:'100vh', background:'#020408', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'1.5rem', fontFamily:BODY, position:'relative', overflow:'hidden' }}>
      {/* Grille de fond */}
      <div style={{ position:'fixed', inset:0, backgroundImage:`linear-gradient(${dirColor}06 1px, transparent 1px), linear-gradient(90deg, ${dirColor}06 1px, transparent 1px)`, backgroundSize:'40px 40px', pointerEvents:'none' }} />

      {/* Halo coloré */}
      <div style={{ position:'fixed', top:'20%', left:'50%', transform:'translateX(-50%)', width:500, height:500, borderRadius:'50%', background:`radial-gradient(circle, ${dirColor}10 0%, transparent 70%)`, pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:460, position:'relative' }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
          <a href="https://profity-x.com" style={{ fontFamily:HUD, fontSize:20, letterSpacing:4, color:'#00FFB2', textDecoration:'none' }}>
            PROFIT<span style={{ color:'#00D4FF' }}>YX</span>
          </a>
          <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:3, color:'rgba(232,244,248,0.3)', marginTop:3 }}>AI TRADING SIGNAL</div>
        </div>

        {/* Card principale */}
        <div style={{ background:'linear-gradient(135deg, #0A1628, #060B14)', border:`1px solid ${dirColor}25`, borderRadius:16, overflow:'hidden', boxShadow:`0 0 60px ${dirColor}10` }}>

          {/* Barre top colorée */}
          <div style={{ height:3, background:`linear-gradient(90deg, transparent, ${dirColor}, transparent)` }} />

          <div style={{ padding:'1.5rem' }}>

            {/* Résultat badge */}
            {hasResult && (
              <div style={{ textAlign:'center', marginBottom:'1.25rem' }}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:`${resColor}12`, border:`1px solid ${resColor}30`, borderRadius:50, padding:'8px 20px' }}>
                  <span style={{ fontSize:20 }}>{isWin ? '🏆' : '❌'}</span>
                  <span style={{ fontFamily:HUD, fontSize:14, fontWeight:900, color:resColor, letterSpacing:2 }}>
                    {isWin ? 'TRADE GAGNANT' : 'TRADE PERDANT'}
                  </span>
                </div>
              </div>
            )}

            {/* Direction + Paire */}
            <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
              <div style={{ fontFamily:HUD, fontSize:32, fontWeight:900, color:dirColor, letterSpacing:2, lineHeight:1 }}>
                {a.direction === 'LONG' ? '▲' : '▼'} {a.direction}
              </div>
              <div style={{ fontFamily:HUD, fontSize:18, color:'#E8F4F8', letterSpacing:3, marginTop:6 }}>{a.pair}</div>
              <div style={{ fontFamily:BODY, fontSize:12, color:'rgba(232,244,248,0.35)', marginTop:4 }}>{date}</div>
            </div>

            {/* Niveaux */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:'1.25rem' }}>
              {[
                { l:'ENTRÉE',   v:a.entry,      c:'#E8F4F8' },
                { l:'STOP',     v:a.stop_loss,  c:'#FF3A5C' },
                { l:'TP1',      v:a.tp1,        c:'#00FFB2' },
              ].map(n => (
                <div key={n.l} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'10px 8px', textAlign:'center' }}>
                  <div style={{ fontFamily:HUD, fontSize:6, letterSpacing:1, color:'rgba(232,244,248,0.35)', marginBottom:4 }}>{n.l}</div>
                  <div style={{ fontFamily:HUD, fontSize:13, fontWeight:700, color:n.c }}>{n.v}</div>
                </div>
              ))}
            </div>

            {/* R/R */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'10px 14px', marginBottom:'1.25rem' }}>
              <span style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'rgba(232,244,248,0.4)' }}>RATIO RISQUE/RENDEMENT</span>
              <span style={{ fontFamily:HUD, fontSize:16, fontWeight:900, color:'#C9A84C' }}>1 : {a.rr_ratio}</span>
            </div>

            {/* Conclusion IA (courte) */}
            {a.conclusion && (
              <div style={{ background:'rgba(0,212,255,0.04)', border:'1px solid rgba(0,212,255,0.1)', borderRadius:8, padding:'10px 14px', marginBottom:'1.25rem' }}>
                <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'#00D4FF', marginBottom:5 }}>🤖 ANALYSE IA</div>
                <div style={{ fontFamily:BODY, fontSize:13, color:'rgba(232,244,248,0.7)', lineHeight:1.6 }}>
                  {a.conclusion.slice(0, 160)}{a.conclusion.length > 160 ? '...' : ''}
                </div>
              </div>
            )}

            {/* Trader */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'1.5rem', padding:'8px 12px', background:'rgba(255,255,255,0.02)', borderRadius:8 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:`${dirColor}15`, border:`1px solid ${dirColor}30`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:HUD, fontSize:12, color:dirColor, fontWeight:700, flexShrink:0 }}>
                {traderName[0]?.toUpperCase() ?? 'T'}
              </div>
              <div>
                <div style={{ fontFamily:HUD, fontSize:9, color:'#E8F4F8', letterSpacing:1 }}>{traderName}</div>
                <div style={{ fontFamily:BODY, fontSize:11, color:'rgba(232,244,248,0.35)' }}>Trader ProfityX</div>
              </div>
              <div style={{ marginLeft:'auto', fontFamily:HUD, fontSize:7, color:dirColor, background:`${dirColor}10`, border:`1px solid ${dirColor}20`, borderRadius:3, padding:'3px 8px', letterSpacing:1 }}>
                🤖 IA
              </div>
            </div>

            {/* CTA inscription */}
            <a href={signupUrl} style={{ display:'block', textAlign:'center', background:`linear-gradient(135deg, ${dirColor}, #00D4FF)`, borderRadius:8, padding:'14px', textDecoration:'none', marginBottom:10 }}>
              <div style={{ fontFamily:HUD, fontSize:11, fontWeight:900, color:'#020408', letterSpacing:2 }}>
                🚀 ANALYSER MES CHARTS GRATUITEMENT
              </div>
              <div style={{ fontFamily:BODY, fontSize:12, color:'rgba(2,4,8,0.7)', marginTop:3 }}>
                Rejoins ProfityX · 10 crédits offerts
              </div>
            </a>

            {/* Boutons partage */}
            <div style={{ display:'flex', gap:8 }}>
              <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noopener noreferrer"
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'#25D366', borderRadius:7, padding:'10px', textDecoration:'none' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.122 1.533 5.856L.053 23.947 6.34 22.49A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.663-.493-5.197-1.355l-.371-.22-3.847.977.997-3.763-.242-.389A9.937 9.937 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                <span style={{ fontFamily:HUD, fontSize:8, color:'white', letterSpacing:1 }}>WHATSAPP</span>
              </a>
              <a href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(isWin ? `✅ Trade gagnant avec ProfityX IA — ${a.direction} ${a.pair} · R/R ${a.rr_ratio}` : `📊 Signal ProfityX — ${a.direction} ${a.pair}`)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'#0088cc', borderRadius:7, padding:'10px', textDecoration:'none' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                <span style={{ fontFamily:HUD, fontSize:8, color:'white', letterSpacing:1 }}>TELEGRAM</span>
              </a>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding:'10px 1.5rem', borderTop:'1px solid rgba(255,255,255,0.04)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontFamily:HUD, fontSize:7, color:'rgba(232,244,248,0.25)', letterSpacing:1 }}>GÉNÉRÉ PAR IA · PROFITYX</span>
            <span style={{ fontFamily:HUD, fontSize:7, color:'rgba(232,244,248,0.25)', letterSpacing:1 }}>profity-x.com</span>
          </div>
        </div>

        {/* Note légale */}
        <p style={{ textAlign:'center', fontFamily:BODY, fontSize:11, color:'rgba(232,244,248,0.2)', marginTop:'1rem', lineHeight:1.6 }}>
          Ce signal est généré par intelligence artificielle à titre informatif.<br/>
          Le trading comporte des risques. Les performances passées ne garantissent pas les résultats futurs.
        </p>
      </div>

      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:#020408; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>
    </div>
  )
}
