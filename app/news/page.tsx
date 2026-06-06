'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { supabasePublic } from '@/lib/supabase'
import CalendarWidget from '@/components/CalendarWidget'
import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'
import QuotaBar from '@/components/dashboard/QuotaBar'
import { RandomAd } from '@/components/AdSlot'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

interface ScheduledEvent { id:string; code:string; name:string; description:string; country:string; flag:string; impact:string; event_date:string }

const PSYCH_COACHING: Record<string, { points: string[]; caution: string }> = {
  NFP:   { points: ['Attendez 5-10 min après la publication — le premier spike est souvent faux.', 'Réduisez la position à 50% du normal. Volatilité 3-5x supérieure.', 'Résultat > attentes = haussier USD. Résultat < attentes = baissier USD.', 'Identifiez les zones de liquidité avant la publication.'], caution: 'SPREADS ÉLARGIS · SLIPPAGE FRÉQUENT · STOP LOSS OBLIGATOIRE' },
  CPI:   { points: ['CPI > prévision = haussier USD, baissier XAU.', 'CPI < prévision = baissier USD, haussier XAU/crypto.', 'Attendez 2-3 bougies de confirmation avant d\'entrer.', 'Surveillez les obligations 10 ans US — indicator avancé.'], caution: 'Position à 60-70% du normal · Pas de contre-tendance immédiate' },
  FOMC:  { points: ['La décision est souvent déjà dans le prix. Ce qui compte : le DISCOURS.', 'Stratégie "buy the rumor, sell the fact" : retournements fréquents.', 'Le "dot plot" est plus important que la décision elle-même.', 'Ne tradez PAS les 15 premières minutes.'], caution: 'JOURNÉE ROUGE · Exposition à 30-40% · La plupart des pros ne tradent pas le FOMC' },
  ECB:   { points: ['Surveiller les déclarations de Lagarde après la décision.', 'Haussier EUR si hausse des taux ou ton hawkish, baissier si dovish.', 'Les paires EUR/USD et EUR/GBP sont les plus réactives.'], caution: 'Forte volatilité sur l\'EUR pendant 1-2 heures post-annonce' },
  DEFAULT: { points: ['Définissez votre biais AVANT la publication.', 'Attendez 2-3 bougies de confirmation avant d\'entrer.', 'Respectez votre stop loss préétabli sans l\'ajuster.', 'Position à 60-70% du normal.'], caution: 'Discipline > Avidité. Un trade raté aujourd\'hui = trade réussi demain.' },
}

function useCountdown(eventDate: string) {
  const [countdown, setCountdown] = useState({ d:0, h:0, m:0, s:0, passed:false })
  useEffect(() => {
    const update = () => {
      const diff = new Date(eventDate).getTime() - Date.now()
      if (diff <= 0) { setCountdown(c => ({ ...c, passed:true })); return }
      setCountdown({ d:Math.floor(diff/864e5), h:Math.floor((diff%864e5)/36e5), m:Math.floor((diff%36e5)/6e4), s:Math.floor((diff%6e4)/1e3), passed:false })
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [eventDate])
  return countdown
}

function CountdownCard({ ev, isPremium, onCoach }: { ev: ScheduledEvent; isPremium: boolean; onCoach: (code: string) => void }) {
  const cd = useCountdown(ev.event_date)
  const isImminent = !cd.passed && cd.d === 0 && cd.h < 4
  const impactColor = ev.impact === 'High' ? 'var(--red)' : 'var(--ora)'
  return (
    <div style={{ background:'var(--bg1)', border:`1px solid ${cd.passed?'var(--bd)':isImminent?'var(--red)':'var(--bd)'}`, borderRadius:10, padding:'1rem', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${impactColor}, transparent)` }} />
      {isImminent && <div style={{ position:'absolute', top:8, right:8, background:'rgba(255,58,92,0.12)', border:'1px solid rgba(255,58,92,0.3)', borderRadius:3, padding:'2px 8px', fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--red)', animation:'pulse 1.5s infinite' }}>IMMINENT</div>}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
        <span style={{ fontSize:20 }}>{ev.flag}</span>
        <div>
          <div style={{ fontFamily:HUD, fontSize:13, color:'var(--tx0)', letterSpacing:1 }}>{ev.code}</div>
          <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx2)' }}>{ev.description}</div>
        </div>
      </div>
      {!cd.passed ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:4, marginBottom:8 }}>
          {[{v:cd.d,l:'J'},{v:cd.h,l:'H'},{v:cd.m,l:'M'},{v:cd.s,l:'S'}].map(c => (
            <div key={c.l} style={{ background:'var(--bg2)', borderRadius:4, padding:'6px 4px', textAlign:'center' }}>
              <div style={{ fontFamily:HUD, fontSize:18, fontWeight:900, color:isImminent?'var(--red)':'var(--ac)', lineHeight:1 }}>{String(c.v).padStart(2,'0')}</div>
              <div style={{ fontFamily:HUD, fontSize:7, color:'var(--tx3)' }}>{c.l}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background:'rgba(0,255,178,0.06)', border:'1px solid var(--bd1)', borderRadius:6, padding:'6px 10px', marginBottom:8, fontFamily:HUD, fontSize:9, color:'var(--ac)', letterSpacing:1 }}>✓ RÉSULTATS PUBLIÉS — ANALYSEZ LE SIGNAL →</div>
      )}
      <div style={{ display:'flex', gap:8 }}>
        <div style={{ flex:1, fontFamily:BODY, fontSize:11, color:'var(--tx3)' }}>{new Date(ev.event_date).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</div>
        {isPremium && (
          <button onClick={() => onCoach(ev.code)} style={{ background:'color-mix(in srgb, var(--ac3) 12%, transparent)', border:'1px solid color-mix(in srgb, var(--ac3) 25%, transparent)', color:'var(--ac3)', fontFamily:HUD, fontSize:7, letterSpacing:1, padding:'4px 8px', borderRadius:3, cursor:'pointer' }}>
            🧠 COACH
          </button>
        )}

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

export default function NewsPage() {
  const [user, setUser]       = useState<{ id:string; email?:string }|null>(null)
  const [profile, setProfile] = useState<Record<string,unknown>|null>(null)
  const [plan, setPlan]       = useState('free')
  const [locale, setLocale]   = useState('fr')
  const [events, setEvents]   = useState<ScheduledEvent[]>([])
  const [coaching, setCoaching] = useState<string|null>(null)
  const [tab, setTab]         = useState<'upcoming'|'calendar'>('calendar')

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabasePublic.auth.getSession()
      if (!session) { window.location.href = '/auth/login'; return }
      setUser(session.user as { id:string; email?:string })
      const [{ data: p }, { data: ev }] = await Promise.all([
        supabasePublic.from('profiles').select('*').eq('id', session.user.id).single(),
        supabasePublic.from('scheduled_events').select('*').gte('event_date', new Date().toISOString()).order('event_date').limit(30),
      ])
      if (p) { setProfile(p); setPlan(p.user_plan as string || 'free'); setLocale(p.locale as string || 'fr') }
      if (ev) setEvents(ev as ScheduledEvent[])
    })()
  }, [])

  const isPremium = plan === 'pro' || plan === 'elite'
  const coachingData = coaching ? (PSYCH_COACHING[coaching] ?? PSYCH_COACHING.DEFAULT) : null

  return (
    <div className="app-shell">
      <Sidebar tab="calendar" setTab={() => {}} plan={plan} locale={locale} />
      <div className="app-main" style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'var(--bg0)', width:'100%', overflow:'hidden' }}>
        <TopBar locale={locale} profile={profile} />
        <QuotaBar profile={profile} locale={locale} plan={plan} />

        <div className="resp-pad" style={{ padding:'1.25rem 1.5rem', flex:1, width:'100%', maxWidth:'100%', overflowX:'hidden' }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem', flexWrap:'wrap', gap:10 }}>
            <div>
              <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:3, color:'var(--ac2)', marginBottom:4 }}>MODULE</div>
              <h1 style={{ fontFamily:HUD, fontSize:'clamp(18px,4vw,26px)', fontWeight:900, color:'var(--tx0)' }}>ANNONCES <span style={{ color:'var(--ac)' }}>MACRO</span></h1>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {['calendar','upcoming'].map(t => (
                <button key={t} onClick={() => setTab(t as 'upcoming'|'calendar')}
                  style={{ fontFamily:HUD, fontSize:9, letterSpacing:1, padding:'8px 14px', borderRadius:4, cursor:'pointer', background: tab===t ? 'color-mix(in srgb, var(--ac) 12%, transparent)' : 'var(--bg1)', border:`1px solid ${tab===t?'var(--bd2)':'var(--bd)'}`, color:tab===t?'var(--ac)':'var(--tx2)' }}>
                  {t==='calendar'?'CALENDRIER':'ÉVÉNEMENTS'}
                </button>
              ))}
            </div>
          </div>

          {/* Pub affiliate */}
          <div style={{ marginBottom:'1rem' }}><RandomAd type="banner" /></div>

          {tab === 'upcoming' && (
            <>
              {/* Coaching modal */}
              {isPremium && coaching && coachingData && (
                <div style={{ background:'linear-gradient(135deg,var(--bg3),var(--bg2))', border:'1px solid color-mix(in srgb, var(--ac3) 30%, transparent)', borderRadius:10, padding:'1.25rem', marginBottom:'1.25rem', position:'relative' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg, transparent, var(--ac3), var(--ora), transparent)' }} />
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'1rem' }}>
                    <span style={{ fontSize:22 }}>🧠</span>
                    <div style={{ fontFamily:HUD, fontSize:12, color:'var(--ac3)', letterSpacing:1 }}>COACHING {coaching} — PSYCHOLOGIE & STRATÉGIE</div>
                    <button onClick={() => setCoaching(null)} style={{ marginLeft:'auto', background:'transparent', border:'none', color:'var(--tx3)', cursor:'pointer', fontSize:18 }}>✕</button>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:'1rem' }}>
                    {coachingData.points.map((p,i) => (
                      <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                        <div style={{ width:22, height:22, borderRadius:'50%', background:'color-mix(in srgb, var(--ac3) 12%, transparent)', border:'1px solid color-mix(in srgb, var(--ac3) 25%, transparent)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:HUD, fontSize:9, color:'var(--ac3)', flexShrink:0 }}>{i+1}</div>
                        <div style={{ fontFamily:BODY, fontSize:14, color:'var(--tx1)', lineHeight:1.6 }}>{p}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:'rgba(255,58,92,0.08)', border:'1px solid rgba(255,58,92,0.2)', borderRadius:6, padding:'10px 14px', display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ color:'var(--red)', flexShrink:0 }}>⚠</span>
                    <div style={{ fontFamily:BODY, fontSize:13, color:'var(--red)', opacity:0.85 }}>{coachingData.caution}</div>
                  </div>
                </div>
              )}

              {!isPremium && (
                <div style={{ background:'color-mix(in srgb, var(--ac3) 5%, transparent)', border:'1px solid color-mix(in srgb, var(--ac3) 15%, transparent)', borderRadius:8, padding:'0.875rem 1rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                  <span style={{ fontSize:18 }}>🧠</span>
                  <div style={{ flex:1, minWidth:160 }}>
                    <div style={{ fontFamily:HUD, fontSize:9, color:'var(--ac3)', letterSpacing:1, marginBottom:2 }}>COACHING PSYCHOLOGIQUE — PRO & ELITE</div>
                    <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx2)' }}>Stratégie NFP, CPI, FOMC. Position sizing. Gestion émotionnelle.</div>
                  </div>
                  <a href="/pricing" style={{ background:'var(--ac3)', color:'#020408', fontFamily:HUD, fontSize:8, letterSpacing:1, padding:'8px 14px', borderRadius:3, textDecoration:'none', fontWeight:700, whiteSpace:'nowrap' }}>DÉBLOQUER</a>
                </div>
              )}

              {/* Grille d'événements */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:10 }}>
                {events.map(ev => (
                  <CountdownCard key={ev.id} ev={ev} isPremium={isPremium} onCoach={setCoaching} />
                ))}
                {events.length === 0 && (
                  <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'3rem', color:'var(--tx3)', fontFamily:HUD, fontSize:10, letterSpacing:2 }}>AUCUN ÉVÉNEMENT À VENIR</div>
                )}
              </div>
            </>
          )}

          {tab === 'calendar' && (
            <>
              <div style={{ marginBottom:'1rem' }}>
                <CalendarWidget locale={locale} />
              </div>
              <div style={{ marginTop:'0.75rem' }}><RandomAd type="rectangle" /></div>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  )
}
