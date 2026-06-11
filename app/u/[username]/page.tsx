// ============================================================
// PROFITYX — /u/[username]
// Track record public partageable par chaque trader
// ============================================================
export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-svc-key',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const { data: profile } = await db.from('profiles')
    .select('full_name, public_id').eq('public_id', params.username.toUpperCase()).single()
  if (!profile) return { title: 'Trader — ProfityX' }
  return {
    title: `${profile.full_name} — Track Record | ProfityX`,
    description: `Voir le track record en direct de ${profile.full_name} sur ProfityX — signaux IA SMC vérifiés.`,
    openGraph: {
      title: `${profile.full_name} trade avec ProfityX IA`,
      description: 'Voir ses signaux SMC vérifiés en temps réel.',
      images: ['/logos/profityx-logo.jpg'],
    },
  }
}

export default async function PublicProfile({ params }: { params: { username: string } }) {
  const code = params.username.toUpperCase()

  // Profil
  const { data: profile } = await db.from('profiles')
    .select('id, full_name, user_plan, created_at, total_wins, total_losses, total_rated')
    .eq('public_id', code).single()
  if (!profile) notFound()

  // Analyses publiques (10 dernières)
  const { data: analyses } = await db.from('chart_analyses')
    .select('id, pair, direction, entry, rr_ratio, trade_result, created_at, rated_at')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const wins    = profile.total_wins   ?? 0
  const losses  = profile.total_losses ?? 0
  const rated   = profile.total_rated  ?? wins + losses
  const winRate = rated > 0 ? Math.round((wins / rated) * 100) : 0

  const RESULT_COLOR: Record<string, string> = {
    WIN: '#00FFB2', LOSS: '#FF3A5C', win: '#00FFB2', loss: '#FF3A5C'
  }

  return (
    <div style={{ minHeight:'100vh', background:'#020408', color:'#F0F8FF', fontFamily:BODY }}>
      {/* Nav */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(2,4,8,0.95)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(0,255,178,0.07)', padding:'0 1.5rem', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Link href="/" style={{ textDecoration:'none' }}>
          <img src="/logos/profityx-logo.jpg" alt="ProfityX" style={{ height:32, width:'auto', objectFit:'contain' }} />
        </Link>
        <Link href="/auth/login" style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'#020408', background:'#00FFB2', padding:'8px 18px', borderRadius:4, textDecoration:'none', fontWeight:700 }}>
          ESSAI GRATUIT
        </Link>
      </nav>

      <div style={{ maxWidth:720, margin:'0 auto', padding:'2.5rem 1.5rem' }}>

        {/* Profil header */}
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:32 }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:'linear-gradient(135deg,#00FFB2,#00D4FF)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:HUD, fontSize:20, fontWeight:900, color:'#020408', flexShrink:0 }}>
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily:HUD, fontSize:16, fontWeight:900, color:'#F0F8FF' }}>{profile.full_name}</div>
            <div style={{ display:'flex', gap:8, marginTop:4, flexWrap:'wrap' }}>
              <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'#00FFB2', background:'rgba(0,255,178,0.1)', border:'1px solid rgba(0,255,178,0.2)', borderRadius:100, padding:'3px 10px' }}>
                PLAN {profile.user_plan.toUpperCase()}
              </span>
              <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'rgba(240,248,255,0.35)', background:'rgba(255,255,255,0.04)', borderRadius:100, padding:'3px 10px' }}>
                {code}
              </span>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:32 }}>
          {[
            { label:'WIN RATE', value: winRate > 0 ? `${winRate}%` : '—', color:'#00FFB2' },
            { label:'SIGNAUX WIN', value: String(wins), color:'#00FFB2' },
            { label:'SIGNAUX LOSS', value: String(losses), color:'#FF3A5C' },
            { label:'ANALYSES', value: String(analyses?.length ?? 0), color:'#00D4FF' },
          ].map(k => (
            <div key={k.label} style={{ background:'#08111F', border:'1px solid rgba(255,255,255,0.05)', borderRadius:10, padding:'1rem', textAlign:'center' }}>
              <div style={{ fontFamily:HUD, fontSize:22, fontWeight:900, color:k.color, marginBottom:4 }}>{k.value}</div>
              <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'rgba(240,248,255,0.35)' }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Liste signaux */}
        <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:3, color:'rgba(0,255,178,0.5)', marginBottom:16 }}>
          DERNIERS SIGNAUX
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:40 }}>
          {(analyses ?? []).map(a => (
            <div key={a.id} style={{ background:'#08111F', border:'1px solid rgba(255,255,255,0.05)', borderRadius:8, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <span style={{ fontFamily:HUD, fontSize:10, fontWeight:900, color:'#F0F8FF' }}>{a.pair}</span>
                <span style={{ fontFamily:HUD, fontSize:8, color: a.direction === 'LONG' ? '#00FFB2' : '#FF3A5C', background: a.direction === 'LONG' ? 'rgba(0,255,178,0.1)' : 'rgba(255,58,92,0.1)', padding:'2px 8px', borderRadius:4 }}>{a.direction}</span>
              </div>
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                <span style={{ fontFamily:BODY, fontSize:12, color:'rgba(240,248,255,0.4)' }}>
                  R/R {a.rr_ratio?.toFixed(1) ?? '—'}
                </span>
                {a.trade_result ? (
                  <span style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color: RESULT_COLOR[a.trade_result] ?? '#888', background:`${RESULT_COLOR[a.trade_result] ?? '#888'}15`, padding:'3px 10px', borderRadius:4 }}>
                    {a.trade_result.toUpperCase()}
                  </span>
                ) : (
                  <span style={{ fontFamily:HUD, fontSize:8, color:'rgba(240,248,255,0.25)' }}>EN ATTENTE</span>
                )}
                <span style={{ fontFamily:BODY, fontSize:11, color:'rgba(240,248,255,0.3)' }}>
                  {new Date(a.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'short' })}
                </span>
              </div>
            </div>
          ))}
          {(!analyses || analyses.length === 0) && (
            <div style={{ textAlign:'center', padding:'2rem', color:'rgba(240,248,255,0.3)', fontFamily:BODY, fontSize:14 }}>
              Aucun signal pour le moment
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{ background:'rgba(0,255,178,0.04)', border:'1px solid rgba(0,255,178,0.15)', borderRadius:12, padding:'2rem', textAlign:'center' }}>
          <div style={{ fontFamily:HUD, fontSize:13, fontWeight:900, color:'#00FFB2', marginBottom:8 }}>
            Analysez vos charts comme {profile.full_name}
          </div>
          <p style={{ fontFamily:BODY, fontSize:15, color:'rgba(240,248,255,0.55)', marginBottom:20 }}>
            Signaux SMC IA en 10 secondes — Entrée, Stop Loss, Take Profit
          </p>
          <Link href={`/auth/login?ref=${code}`} style={{ fontFamily:HUD, fontSize:10, letterSpacing:2, color:'#020408', background:'#00FFB2', padding:'13px 32px', borderRadius:4, textDecoration:'none', fontWeight:700 }}>
            COMMENCER GRATUITEMENT (+10 CRÉDITS OFFERTS)
          </Link>
          <div style={{ fontFamily:BODY, fontSize:12, color:'rgba(240,248,255,0.25)', marginTop:10 }}>
            Lien de parrainage de {profile.full_name} — profity-x.com
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.05)', padding:'1.5rem', textAlign:'center' }}>
        <Link href="/" style={{ fontFamily:HUD, fontSize:11, color:'#00FFB2', textDecoration:'none' }}>
          profity-x.com
        </Link>
        <div style={{ fontFamily:BODY, fontSize:11, color:'rgba(240,248,255,0.2)', marginTop:6 }}>© 2026 MonWe Infinity LLC</div>
      </footer>
    </div>
  )
}
