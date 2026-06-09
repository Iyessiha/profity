// ============================================================
// PROFITYX — /results : Track record public live
// Accessible sans connexion — preuve sociale
// ============================================================
'use client'
import { useEffect, useState } from 'react'

const HUD  = "'Orbitron',monospace"
const BODY = "'Rajdhani',sans-serif"

interface Signal {
  id: string
  pair: string
  timeframe: string
  direction: string
  entry: number
  rr_ratio: number
  confidence: string
  trade_result: string | null
  created_at: string
}

interface Stats {
  total: number
  wins: number
  losses: number
  pending: number
  winrate: number
  avg_rr: number
  traders: number
  this_week: number
  pairs_traded: number
}

export default function ResultsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/results/stats').then(r => r.json()),
      fetch('/api/results/signals').then(r => r.json()),
    ]).then(([s, sg]) => {
      setStats(s)
      setSignals(sg.signals ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const fmt = (n: number) => n.toLocaleString('fr-FR')
  const dirColor = (d: string) => d?.includes('BUY') || d?.includes('LONG') ? '#00FFB2' : '#FF3A5C'
  const resColor = (r: string | null) => r === 'WIN' ? '#00FFB2' : r === 'LOSS' ? '#FF3A5C' : 'rgba(240,248,255,0.35)'

  return (
    <div style={{ minHeight:'100vh', background:'#020408', color:'#F0F8FF', fontFamily:BODY }}>
      {/* Header */}
      <header style={{ borderBottom:'1px solid rgba(0,255,178,0.08)', padding:'0 1.5rem', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:'rgba(2,4,8,0.95)', backdropFilter:'blur(12px)', zIndex:10 }}>
        <a href="/" style={{ textDecoration:'none' }}>
          <span style={{ fontFamily:HUD, fontSize:15, fontWeight:900, letterSpacing:2, color:'#00FFB2' }}>PROFIT<span style={{ color:'#00D4FF' }}>YX</span></span>
        </a>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#00E676', animation:'pulse 1.5s infinite' }} />
          <span style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'#00E676' }}>LIVE</span>
        </div>
        <a href="/auth/login" style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'#020408', background:'#00FFB2', padding:'9px 20px', borderRadius:4, textDecoration:'none', fontWeight:700 }}>
          ESSAYER GRATUIT
        </a>
      </header>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'2rem 1rem' }}>
        {/* Titre */}
        <div style={{ textAlign:'center', marginBottom:'3rem' }}>
          <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:3, color:'rgba(0,255,178,0.6)', marginBottom:10 }}>TRANSPARENCE TOTALE</div>
          <h1 style={{ fontFamily:HUD, fontSize:'clamp(28px,4vw,48px)', fontWeight:900, lineHeight:1.1, marginBottom:14 }}>
            TRACK RECORD <span style={{ color:'#00FFB2' }}>EN DIRECT</span>
          </h1>
          <p style={{ fontFamily:BODY, fontSize:16, color:'rgba(240,248,255,0.5)', maxWidth:520, margin:'0 auto' }}>
            Tous les signaux générés par ProfityX — WIN, LOSS et en cours. Aucun filtre, aucune triche.
          </p>
        </div>

        {/* Stats globales */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'3rem', color:'rgba(240,248,255,0.3)', fontFamily:HUD, fontSize:9, letterSpacing:2 }}>CHARGEMENT...</div>
        ) : stats && (
          <>
            {/* KPI principal — Win Rate */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:20 }}>
              {/* Gauge winrate — pleine largeur */}
              <div style={{ background:'#08111F', border:'1px solid rgba(0,255,178,0.15)', borderRadius:12, padding:'1.5rem', textAlign:'center', position:'relative', overflow:'hidden', gridColumn:'1 / -1' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,transparent,#00FFB2,transparent)' }} />
                <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'rgba(0,255,178,0.6)', marginBottom:12 }}>WIN RATE</div>
                <div style={{ fontFamily:HUD, fontSize:56, fontWeight:900, lineHeight:1,
                  color: stats.winrate >= 60 ? '#00FFB2' : stats.winrate >= 45 ? '#C9A84C' : '#FF3A5C' }}>
                  {stats.wins + stats.losses > 0 ? `${stats.winrate}%` : '—'}
                </div>
                <div style={{ fontFamily:BODY, fontSize:13, color:'rgba(240,248,255,0.4)', marginTop:8 }}>
                  {stats.wins} WIN · {stats.losses} LOSS
                </div>
                {stats.wins + stats.losses === 0 && (
                  <div style={{ fontFamily:BODY, fontSize:11, color:'rgba(240,248,255,0.3)', marginTop:8 }}>
                    Notation des trades en cours...
                  </div>
                )}
                {/* Mini barre */}
                <div style={{ marginTop:14, height:6, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${stats.winrate}%`, background:'linear-gradient(90deg,#00FFB2,#00D4FF)', borderRadius:3 }} />
                </div>
              </div>

              {/* KPIs secondaires */}
              {[
                  { l:'SIGNAUX GÉNÉRÉS', v:fmt(stats.total),      s:'total cumulé',          c:'#00FFB2' },
                  { l:'CETTE SEMAINE',   v:fmt(stats.this_week),  s:'7 derniers jours',       c:'#00D4FF' },
                  { l:'TRADERS ACTIFS',  v:fmt(stats.traders),    s:'utilisateurs',           c:'#C9A84C' },
                  { l:'R/R MOYEN',       v:stats.avg_rr ? `1:${stats.avg_rr}` : '—', s:'ratio risque/récompense', c:'#00FFB2' },
                  { l:'PAIRES TRADÉES',  v:fmt(stats.pairs_traded),s:'actifs différents',    c:'#00D4FF' },
                  { l:'EN ATTENTE',      v:fmt(stats.pending),    s:'trades non encore notés', c:'rgba(240,248,255,0.4)' },
                ].map(k => (
                  <div key={k.l} style={{ background:'#08111F', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'1rem' }}>
                    <div style={{ fontFamily:HUD, fontSize:6, letterSpacing:1.5, color:'rgba(240,248,255,0.4)', marginBottom:6 }}>{k.l}</div>
                    <div style={{ fontFamily:HUD, fontSize:20, fontWeight:900, color:k.c, lineHeight:1 }}>{k.v}</div>
                    <div style={{ fontFamily:BODY, fontSize:10, color:'rgba(240,248,255,0.3)', marginTop:4 }}>{k.s}</div>
                  </div>
                ))}
            </div>

            {/* Disclaimer honnête */}
            <div style={{ background:'rgba(201,168,76,0.05)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'12px 16px', marginBottom:24, display:'flex', gap:10, alignItems:'flex-start' }}>
              <span style={{ fontSize:16 }}>⚠️</span>
              <p style={{ fontFamily:BODY, fontSize:12, color:'rgba(240,248,255,0.5)', margin:0, lineHeight:1.6 }}>
                Le trading comporte des risques de perte en capital. Les performances passées ne garantissent pas les résultats futurs.
                Les signaux en attente ({stats.pending}) seront notés par les traders qui les ont utilisés. ProfityX n'est pas un conseiller financier.
              </p>
            </div>

            {/* Tableau des signaux récents */}
            <div>
              <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'rgba(240,248,255,0.4)', marginBottom:14 }}>
                DERNIERS SIGNAUX — {signals.length} affichés
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {signals.map(s => (
                  <div key={s.id} style={{
                    background:'#08111F', border:`1px solid ${s.trade_result ? (s.trade_result === 'WIN' ? 'rgba(0,255,178,0.2)' : 'rgba(255,58,92,0.2)') : 'rgba(255,255,255,0.05)'}`,
                    borderRadius:8, padding:'12px 16px',
                    display:'flex', alignItems:'center', gap:12, flexWrap:'wrap',
                  }}>
                    {/* Résultat badge */}
                    <div style={{
                      fontFamily:HUD, fontSize:8, letterSpacing:1,
                      color: s.trade_result ? (s.trade_result === 'WIN' ? '#020408' : '#020408') : 'rgba(240,248,255,0.35)',
                      background: s.trade_result === 'WIN' ? '#00FFB2' : s.trade_result === 'LOSS' ? '#FF3A5C' : 'rgba(255,255,255,0.07)',
                      borderRadius:4, padding:'4px 8px', flexShrink:0, minWidth:52, textAlign:'center',
                    }}>
                      {s.trade_result ?? '⏳'}
                    </div>
                    {/* Paire */}
                    <div style={{ fontFamily:HUD, fontSize:11, fontWeight:900, color:'#F0F8FF', minWidth:90 }}>{s.pair}</div>
                    {/* Direction */}
                    <div style={{ fontFamily:HUD, fontSize:9, color:dirColor(s.direction), letterSpacing:1, minWidth:80 }}>{s.direction}</div>
                    {/* TF */}
                    <div style={{ fontFamily:BODY, fontSize:12, color:'rgba(240,248,255,0.4)', minWidth:40 }}>{s.timeframe}</div>
                    {/* Entry */}
                    <div style={{ fontFamily:BODY, fontSize:12, color:'rgba(240,248,255,0.6)' }}>
                      Entrée : <strong style={{ color:'#F0F8FF' }}>{s.entry}</strong>
                    </div>
                    {/* R/R */}
                    {s.rr_ratio > 0 && (
                      <div style={{ fontFamily:HUD, fontSize:9, color:'#C9A84C' }}>R/R 1:{s.rr_ratio}</div>
                    )}
                    {/* Confidence */}
                    {s.confidence && (
                      <div style={{ fontFamily:BODY, fontSize:11, color:'rgba(240,248,255,0.35)' }}>
                        {s.confidence === 'high' || s.confidence === 'ÉLEVÉE' ? '●●●' : s.confidence === 'medium' ? '●●○' : '●○○'}
                      </div>
                    )}
                    {/* Date */}
                    <div style={{ marginLeft:'auto', fontFamily:BODY, fontSize:11, color:'rgba(240,248,255,0.25)' }}>
                      {new Date(s.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* CTA bas */}
        <div style={{ textAlign:'center', marginTop:'4rem', padding:'3rem', background:'rgba(0,255,178,0.03)', border:'1px solid rgba(0,255,178,0.1)', borderRadius:12 }}>
          <div style={{ fontFamily:HUD, fontSize:'clamp(18px,3vw,28px)', fontWeight:900, marginBottom:12 }}>
            GÉNÈRE TON PROCHAIN SIGNAL
          </div>
          <p style={{ fontFamily:BODY, fontSize:15, color:'rgba(240,248,255,0.5)', marginBottom:24 }}>
            Upload ton chart → reçois l'entrée, le Stop Loss et les Take Profit en 10 secondes.
          </p>
          <a href="/auth/login" style={{ fontFamily:HUD, fontSize:11, letterSpacing:2, color:'#020408', background:'#00FFB2', padding:'15px 40px', borderRadius:4, textDecoration:'none', fontWeight:700, boxShadow:'0 0 30px rgba(0,255,178,0.3)' }}>
            COMMENCER GRATUITEMENT →
          </a>
          <p style={{ fontFamily:BODY, fontSize:12, color:'rgba(240,248,255,0.3)', marginTop:12 }}>✓ Sans carte bancaire · ✓ 10 crédits offerts</p>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}
