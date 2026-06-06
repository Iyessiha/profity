'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { supabasePublic } from '@/lib/supabase'
import CalendarWidget from '@/components/CalendarWidget'
import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'
import { QuotaBar } from '@/components/dashboard/TopBar'
import { RandomAd } from '@/components/AdSlot'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

interface ScheduledEvent { id:string; code:string; name:string; description:string; country:string; flag:string; impact:string; event_date:string }
interface Signal { direction:'LONG'|'SHORT'|'NEUTRE'; pair:string; entry:string; sl:string; tp1:string; rr:string; note:string }

// Signaux prédéfinis robustes par type d'événement (patterns historiques)
const EVENT_SIGNALS: Record<string, { better: Signal; worse: Signal; intro: string }> = {
  NFP: {
    intro: 'Le NFP détermine la force de l\'emploi US. Impact direct sur l\'USD et les actifs risqués.',
    better: { direction:'LONG', pair:'USD/JPY', entry:'Prix du marché +5 pips', sl:'-20 pips', tp1:'+45 pips', rr:'1:2.2', note:'NFP > prévision → USD fort. Attendre 5 min après la publication. Entrée sur retest du niveau pré-annonce.' },
    worse:  { direction:'SHORT', pair:'EUR/USD', entry:'Prix du marché -5 pips', sl:'+20 pips', tp1:'-50 pips', rr:'1:2.5', note:'NFP < prévision → USD faible. XAU/USD également haussier. Confirmer sur M5 après le spike initial.' },
  },
  CPI: {
    intro: 'L\'inflation CPI guide les décisions de la Fed. Influence majeure sur les taux et les devises.',
    better: { direction:'SHORT', pair:'XAU/USD', entry:'Prix du marché -10 pips', sl:'+25 pips', tp1:'-60 pips', rr:'1:2.4', note:'CPI > prévision = inflation chaude = hawkish Fed → baissier XAU. Surveiller le cassage du support H1.' },
    worse:  { direction:'LONG',  pair:'XAU/USD', entry:'Prix du marché +10 pips', sl:'-25 pips', tp1:'+65 pips', rr:'1:2.6', note:'CPI < prévision = refroidissement = dovish → haussier XAU. NAS100 également achetable.' },
  },
  FOMC: {
    intro: 'La Fed définit la politique monétaire USA. L\'un des événements les plus volatils du calendrier.',
    better: { direction:'SHORT', pair:'NAS100', entry:'Résistance H1', sl:'+30 pts', tp1:'-80 pts', rr:'1:2.7', note:'Hausse taux → baissier indices. Attendre le discours de Powell (15 min après). Pas d\'entrée sur la décision seule.' },
    worse:  { direction:'LONG',  pair:'NAS100', entry:'Support H1', sl:'-30 pts', tp1:'+90 pts', rr:'1:3.0', note:'Pause/baisse taux → haussier indices. Confirmer sur clôture H1 au-dessus de la moyenne 20.' },
  },
  ECB: {
    intro: 'La BCE fixe les taux pour la zone euro. Impact direct sur EUR/USD, EUR/GBP et indices européens.',
    better: { direction:'LONG', pair:'EUR/USD', entry:'Prix du marché +5 pips', sl:'-18 pips', tp1:'+40 pips', rr:'1:2.2', note:'Hausse taux BCE → EUR fort. Surveiller le niveau 1.0800 comme support clé à tenir.' },
    worse:  { direction:'SHORT', pair:'EUR/USD', entry:'Prix du marché -5 pips', sl:'+18 pips', tp1:'-45 pips', rr:'1:2.5', note:'Ton dovish → EUR faible. Confirmer le bris du support avant entrée. SL serré obligatoire.' },
  },
  BOE: {
    intro: 'La Banque d\'Angleterre fixe les taux UK. GBP/USD et EUR/GBP sont les plus réactifs.',
    better: { direction:'LONG', pair:'GBP/USD', entry:'Prix du marché +5 pips', sl:'-20 pips', tp1:'+50 pips', rr:'1:2.5', note:'Hausse taux BoE → GBP fort. Niveau 1.2700 clé. Entrée après confirmation sur M15.' },
    worse:  { direction:'SHORT', pair:'GBP/USD', entry:'Prix du marché -5 pips', sl:'+20 pips', tp1:'-55 pips', rr:'1:2.75', note:'BoE dovish → GBP faible. EUR/GBP également intéressant à l\'achat dans ce cas.' },
  },
  PCE: {
    intro: 'L\'indicateur d\'inflation préféré de la Fed. Corrélation forte avec XAU et USD.',
    better: { direction:'SHORT', pair:'XAU/USD', entry:'Résistance D1', sl:'+20 pips', tp1:'-55 pips', rr:'1:2.75', note:'PCE > prévision → USD fort, XAU baissier. Confirmer sur clôture H4 sous la résistance.' },
    worse:  { direction:'LONG',  pair:'GBP/USD', entry:'Support H1', sl:'-15 pips', tp1:'+40 pips', rr:'1:2.7', note:'PCE < prévision → USD faible, majors haussières. Privilégier GBP/USD et EUR/USD.' },
  },
  GDP: {
    intro: 'Le PIB mesure la croissance économique. Impact modéré mais durable sur le USD.',
    better: { direction:'LONG', pair:'USD/CAD', entry:'Prix du marché +3 pips', sl:'-15 pips', tp1:'+35 pips', rr:'1:2.3', note:'PIB > prévision → USD fort. USD/CAD techniquement en range haussier — cibler la résistance.' },
    worse:  { direction:'SHORT', pair:'USD/CAD', entry:'Prix du marché -3 pips', sl:'+15 pips', tp1:'-38 pips', rr:'1:2.5', note:'PIB < prévision → récession fears → USD faible. Valider avec clôture H1 sous support.' },
  },
  DEFAULT: {
    intro: 'Annonce macroéconomique à fort impact. Attendre la confirmation avant d\'entrer.',
    better: { direction:'LONG', pair:'EUR/USD', entry:'Prix du marché', sl:'-20 pips', tp1:'+50 pips', rr:'1:2.5', note:'Résultat meilleur que prévu → biais haussier sur les paires concernées. Attendre 3 bougies de confirmation.' },
    worse:  { direction:'SHORT', pair:'EUR/USD', entry:'Prix du marché', sl:'+20 pips', tp1:'-50 pips', rr:'1:2.5', note:'Résultat décevant → biais baissier. Réduire la taille de position à 50-70% du normal.' },
  },
}

const COACHING: Record<string, string[]> = {
  NFP:  ['Attendez 5-10 min — le spike initial est souvent faux.', 'Position sizing à 50% du normal. Volatilité 3-5× supérieure.', 'Résultat > attentes = haussier USD. < attentes = baissier USD.', 'Identifiez les zones de liquidité avant la publication.'],
  CPI:  ['CPI chaud → USD fort, XAU baissier. CPI froid → XAU haussier.', 'Attendez 2-3 bougies de confirmation. Évitez le spike initial.', 'Regardez les obligations 10 ans US — indicateur avancé.', 'Position à 60-70% du normal pendant 30-60 min.'],
  FOMC: ['La DÉCISION est dans le prix. Ce qui compte : le DISCOURS.', 'Ne tradez PAS les 15 premières minutes. Trop imprévisible.', 'Lisez le "dot plot" — plus important que la décision elle-même.', 'Exposition à 30-40% max. La plupart des pros ne tradent pas le FOMC direct.'],
  DEFAULT: ['Définissez votre biais AVANT la publication.', 'Attendez 2-3 bougies de confirmation avant d\'entrer.', 'Stop loss obligatoire — ne l\'ajustez JAMAIS en votre défaveur.', 'Si pas de setup dans 30 min, passez à autre chose.'],
}

function useCountdown(date: string) {
  const [cd, setCd] = useState({ d:0, h:0, m:0, s:0, passed:false })
  useEffect(() => {
    const update = () => {
      const diff = new Date(date).getTime() - Date.now()
      if (diff <= 0) { setCd(c => ({...c, passed:true})); return }
      setCd({ d:Math.floor(diff/864e5), h:Math.floor((diff%864e5)/36e5), m:Math.floor((diff%36e5)/6e4), s:Math.floor((diff%6e4)/1e3), passed:false })
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [date])
  return cd
}

function ImpactBadge({ impact }: { impact: string }) {
  const color = impact === 'High' ? 'var(--red)' : impact === 'Medium' ? 'var(--ora)' : 'var(--tx3)'
  return <span style={{ fontFamily:HUD, fontSize:6, letterSpacing:1, color, background:color+'18', border:`1px solid ${color}30`, borderRadius:2, padding:'2px 6px' }}>{impact.toUpperCase()}</span>
}

function SignalBox({ sig, label }: { sig: Signal; label: string }) {
  const dc = sig.direction === 'LONG' ? '#00B890' : sig.direction === 'SHORT' ? 'var(--red)' : '#888'
  return (
    <div style={{ background:'var(--bg2)', border:`1px solid ${dc}25`, borderRadius:8, padding:'0.875rem', flex:1 }}>
      <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--tx3)', marginBottom:6 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
        <span style={{ fontFamily:HUD, fontSize:13, fontWeight:900, color:dc }}>{sig.direction}</span>
        <span style={{ fontFamily:HUD, fontSize:10, color:'var(--tx0)' }}>{sig.pair}</span>
        <span style={{ fontFamily:HUD, fontSize:9, color:'var(--ac)', marginLeft:'auto' }}>R/R {sig.rr}</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:8 }}>
        {[{l:'ENTRÉE', v:sig.entry, c:'var(--ac)'},{l:'SL', v:sig.sl, c:'var(--red)'},{l:'TP1', v:sig.tp1, c:'var(--ac2)'}].map(p=>(
          <div key={p.l} style={{ background:'var(--bg1)', borderRadius:5, padding:'5px', textAlign:'center' }}>
            <div style={{ fontFamily:HUD, fontSize:6, letterSpacing:1, color:'var(--tx3)', marginBottom:2 }}>{p.l}</div>
            <div style={{ fontFamily:HUD, fontSize:10, color:p.c, fontWeight:700 }}>{p.v}</div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx2)', lineHeight:1.5 }}>{sig.note}</div>
    </div>
  )
}

function CountdownCard({ ev, isPremium, onSelect, index }: { ev:ScheduledEvent; isPremium:boolean; onSelect:(ev:ScheduledEvent)=>void; index:number }) {
  const cd = useCountdown(ev.event_date)
  const isImminent = !cd.passed && cd.d===0 && cd.h<4
  const color = ev.impact==='High' ? 'var(--red)' : 'var(--ora)'
  const sig = EVENT_SIGNALS[ev.code] ?? EVENT_SIGNALS.DEFAULT

  // Les 2 premiers événements sont visibles pour tous — le reste flou pour free
  const isLocked = !isPremium && index >= 2

  return (
    <div style={{ background:'var(--bg1)', border:`1px solid ${isImminent&&!isLocked?'rgba(220,38,38,0.4)':isLocked?'var(--bd)':'var(--bd)'}`, borderRadius:10, overflow:'hidden', transition:'transform .2s, box-shadow .2s', position:'relative' }}
      onMouseEnter={e=>{if(!isLocked){(e.currentTarget as HTMLElement).style.transform='translateY(-2px)';(e.currentTarget as HTMLElement).style.boxShadow=`0 6px 20px rgba(0,0,0,0.3)`}}}
      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='none'}}>

      {/* Barre impact */}
      <div style={{ height:2, background: isLocked ? 'var(--bd)' : `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

      <div style={{ padding:'0.875rem', filter: isLocked ? 'blur(4px)' : 'none', userSelect: isLocked ? 'none' : 'auto', pointerEvents: isLocked ? 'none' : 'auto', transition:'filter .2s' }}>
        {/* En-tête événement — TOUJOURS visible (pas flou) */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:18 }}>{ev.flag}</span>
            <div>
              <div style={{ fontFamily:HUD, fontSize:12, color:'var(--tx0)', letterSpacing:1 }}>{ev.code}</div>
              <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx2)', lineHeight:1.3 }}>{ev.description}</div>
            </div>
          </div>
          <ImpactBadge impact={ev.impact} />
        </div>

        {/* Chronomètre */}
        {!cd.passed ? (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:4, marginBottom:8 }}>
              {[{v:cd.d,l:'J'},{v:cd.h,l:'H'},{v:cd.m,l:'M'},{v:cd.s,l:'S'}].map(c=>(
                <div key={c.l} style={{ background:'var(--bg2)', borderRadius:5, padding:'6px 4px', textAlign:'center' }}>
                  <div style={{ fontFamily:HUD, fontSize:isImminent?22:18, fontWeight:900, color:isImminent?'var(--red)':'var(--ac)', lineHeight:1 }}>{String(c.v).padStart(2,'0')}</div>
                  <div style={{ fontFamily:HUD, fontSize:7, color:'var(--tx3)' }}>{c.l}</div>
                </div>
              ))}
            </div>
            {isImminent && <div style={{ textAlign:'center', marginBottom:8 }}><span style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'var(--red)', background:'rgba(220,38,38,0.1)', border:'1px solid rgba(220,38,38,0.25)', borderRadius:3, padding:'3px 10px', animation:'pulse 1s infinite' }}>⚡ IMMINENT</span></div>}
            <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx3)' }}>
              {new Date(ev.event_date).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
            </div>
          </>
        ) : (
          <div onClick={()=>onSelect(ev)} style={{ background:'color-mix(in srgb, var(--ac) 6%, transparent)', border:'1px solid var(--bd2)', borderRadius:6, padding:'8px 10px', marginBottom:8, textAlign:'center', cursor:'pointer' }}>
            <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--ac)', marginBottom:2 }}>✓ RÉSULTATS PUBLIÉS</div>
            <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx2)' }}>Voir le signal →</div>
          </div>
        )}

        {/* Intro + bouton signal */}
        <div style={{ marginTop:8, fontFamily:BODY, fontSize:11, color:'var(--tx3)', lineHeight:1.4, borderTop:'1px solid var(--bd)', paddingTop:8 }}>{sig.intro}</div>
        <button onClick={()=>onSelect(ev)} style={{ marginTop:10, width:'100%', background:'color-mix(in srgb, var(--ac) 8%, transparent)', border:'1px solid var(--bd2)', borderRadius:5, padding:'7px', fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--ac)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
          <i className="ti ti-chart-line" style={{ fontSize:13 }} />
          VOIR LES SIGNAUX
        </button>
      </div>

      {/* Overlay lock — uniquement pour les cards floutées */}
      {isLocked && (
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, background:'rgba(var(--bg1-raw,8,17,31), 0.55)', backdropFilter:'blur(0px)', zIndex:2 }}>
          {/* Badge impact visible malgré le flou */}
          <div style={{ position:'absolute', top:10, right:10 }}>
            <ImpactBadge impact={ev.impact} />
          </div>
          {/* En-tête visible */}
          <div style={{ position:'absolute', top:14, left:14, display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:16 }}>{ev.flag}</span>
            <span style={{ fontFamily:HUD, fontSize:11, color:'var(--tx0)', letterSpacing:1 }}>{ev.code}</span>
          </div>

          {/* Lock CTA */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--bd2)', borderRadius:10, padding:'1rem 1.25rem', textAlign:'center', margin:'0 1rem', backdropFilter:'blur(8px)' }}>
            <i className="ti ti-lock" style={{ fontSize:22, color:'var(--ac)', display:'block', marginBottom:6 }} />
            <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:1, color:'var(--tx0)', marginBottom:4 }}>SIGNAL RÉSERVÉ PRO</div>
            <div style={{ fontFamily:BODY, fontSize:11, color:'var(--tx2)', marginBottom:10 }}>Countdown, stratégie et coaching</div>
            <a href="/pricing" style={{ display:'inline-block', background:'var(--ac)', color:'#020408', fontFamily:HUD, fontSize:8, letterSpacing:1, fontWeight:700, padding:'7px 16px', borderRadius:4, textDecoration:'none' }}>
              DÉBLOQUER →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

function EventModal({ ev, isPremium, onClose }: { ev:ScheduledEvent; isPremium:boolean; onClose:()=>void }) {
  const sig = EVENT_SIGNALS[ev.code] ?? EVENT_SIGNALS.DEFAULT
  const coaching = COACHING[ev.code] ?? COACHING.DEFAULT
  const cd = useCountdown(ev.event_date)

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.78)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'var(--bg2)', border:'1px solid var(--bd2)', borderRadius:14, width:560, maxWidth:'100%', maxHeight:'90vh', overflowY:'auto', position:'relative' }}>
        <div style={{ height:3, background:'linear-gradient(90deg, var(--ac), var(--ac2))', borderRadius:'14px 14px 0 0' }} />

        <div style={{ padding:'1.5rem' }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1.25rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:28 }}>{ev.flag}</span>
              <div>
                <div style={{ fontFamily:HUD, fontSize:18, color:'var(--tx0)', letterSpacing:1 }}>{ev.code}</div>
                <div style={{ fontFamily:BODY, fontSize:13, color:'var(--tx2)' }}>{ev.name}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'transparent', border:'none', color:'var(--tx3)', cursor:'pointer', fontSize:22 }}>✕</button>
          </div>

          {/* Chrono si pas encore passé */}
          {!cd.passed && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:'1.25rem' }}>
              {[{v:cd.d,l:'JOURS'},{v:cd.h,l:'HEURES'},{v:cd.m,l:'MIN'},{v:cd.s,l:'SEC'}].map(c=>(
                <div key={c.l} style={{ background:'var(--bg1)', borderRadius:8, padding:'0.75rem', textAlign:'center' }}>
                  <div style={{ fontFamily:HUD, fontSize:26, fontWeight:900, color:'var(--ac)', lineHeight:1 }}>{String(c.v).padStart(2,'0')}</div>
                  <div style={{ fontFamily:HUD, fontSize:7, color:'var(--tx3)', marginTop:4 }}>{c.l}</div>
                </div>
              ))}
            </div>
          )}

          {/* Date */}
          <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:1, color:'var(--tx3)', marginBottom:'1.25rem' }}>
            📅 {new Date(ev.event_date).toLocaleDateString('fr-FR',{weekday:'long',day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})}
          </div>

          {/* Intro */}
          <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:8, padding:'0.875rem', marginBottom:'1.25rem' }}>
            <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--ac)', marginBottom:6 }}>📊 CONTEXTE MACRO</div>
            <p style={{ fontFamily:BODY, fontSize:14, color:'var(--tx1)', lineHeight:1.7, margin:0 }}>{sig.intro}</p>
          </div>

          {/* Signaux */}
          <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'var(--tx3)', marginBottom:10 }}>SCÉNARIOS DE TRADING</div>
          <div style={{ display:'flex', gap:10, marginBottom:'1.25rem', flexWrap:'wrap' }}>
            <SignalBox sig={sig.better} label="✅ SI MEILLEUR QUE PRÉVU" />
            <SignalBox sig={sig.worse}  label="⚠️ SI DÉCEVANT" />
          </div>

          {/* Coaching (Pro/Elite) */}
          {isPremium ? (
            <div style={{ background:'linear-gradient(135deg,color-mix(in srgb, var(--ac3) 8%, var(--bg1)),var(--bg1))', border:'1px solid color-mix(in srgb, var(--ac3) 25%, transparent)', borderRadius:8, padding:'1rem' }}>
              <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:1, color:'var(--ac3)', marginBottom:10 }}>🧠 COACHING PSYCHOLOGIQUE</div>
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {coaching.map((tip,i)=>(
                  <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', background:'color-mix(in srgb, var(--ac3) 12%, transparent)', border:'1px solid color-mix(in srgb, var(--ac3) 22%, transparent)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:HUD, fontSize:8, color:'var(--ac3)', flexShrink:0 }}>{i+1}</div>
                    <div style={{ fontFamily:BODY, fontSize:13, color:'var(--tx1)', lineHeight:1.6 }}>{tip}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ background:'color-mix(in srgb, var(--ac3) 5%, transparent)', border:'1px solid color-mix(in srgb, var(--ac3) 15%, transparent)', borderRadius:8, padding:'1rem', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
              <span style={{ fontSize:20 }}>🧠</span>
              <div style={{ flex:1, minWidth:160 }}>
                <div style={{ fontFamily:HUD, fontSize:9, color:'var(--ac3)', letterSpacing:1, marginBottom:3 }}>COACHING PSYCHOLOGIQUE · PRO & ELITE</div>
                <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx2)' }}>Stratégies mentales, position sizing et timing optimaux pour chaque type d'annonce.</div>
              </div>
              <a href="/pricing" style={{ background:'var(--ac3)', color:'#020408', fontFamily:HUD, fontSize:8, letterSpacing:1, padding:'8px 14px', borderRadius:4, textDecoration:'none', fontWeight:700, whiteSpace:'nowrap' }}>DÉBLOQUER</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function NewsPage() {
  const [token,   setToken]   = useState('')
  const [user, setUser]       = useState<{id:string;email?:string}|null>(null)
  const [profile, setProfile] = useState<Record<string,unknown>|null>(null)
  const [plan, setPlan]       = useState('free')
  const [locale, setLocale]   = useState('fr')
  const [events, setEvents]   = useState<ScheduledEvent[]>([])
  const [selected, setSelected] = useState<ScheduledEvent|null>(null)
  const [tab, setTab]         = useState<'calendar'|'upcoming'>('calendar')

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabasePublic.auth.getSession()
      if (!session) { window.location.href = '/auth/login'; return }
      setUser(session.user as {id:string;email?:string})
      setToken(session.access_token)
      const [{ data: p }, { data: ev }] = await Promise.all([
        supabasePublic.from('profiles').select('*').eq('id', session.user.id).single(),
        supabasePublic.from('scheduled_events').select('*').gte('event_date', new Date(Date.now() - 86400000*3).toISOString()).order('event_date').limit(40),
      ])
      if (p) { setProfile(p); setPlan(p.user_plan as string||'free'); setLocale(p.locale as string||'fr') }
      if (ev) setEvents(ev as ScheduledEvent[])
    })()
  }, [])

  const isPremium = plan === 'pro' || plan === 'elite'

  return (
    <div className="app-shell">
      {selected && <EventModal ev={selected} isPremium={isPremium} onClose={()=>setSelected(null)} />}
      <Sidebar tab="calendar" setTab={()=>{}} plan={plan} locale={locale} />
      <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'var(--bg0)', width:'100%', overflow:'hidden' }}>
        <TopBar locale={locale} profile={profile} />
        <QuotaBar token={token} locale={locale} plan={plan} />

        <div className="resp-pad" style={{ padding:'1.25rem 1.5rem', flex:1, width:'100%', overflowX:'hidden' }}>
          {/* En-tête */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', flexWrap:'wrap', gap:10 }}>
            <div>
              <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:3, color:'var(--ac2)', marginBottom:4 }}>MODULE</div>
              <h1 style={{ fontFamily:HUD, fontSize:'clamp(18px,4vw,26px)', fontWeight:900, color:'var(--tx0)' }}>
                ANNONCES <span style={{ color:'var(--ac)' }}>MACRO</span>
              </h1>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {['calendar','upcoming'].map(t=>(
                <button key={t} onClick={()=>setTab(t as 'calendar'|'upcoming')}
                  style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, padding:'7px 12px', borderRadius:4, cursor:'pointer', background:tab===t?'color-mix(in srgb, var(--ac) 12%, transparent)':'var(--bg1)', border:`1px solid ${tab===t?'var(--bd2)':'var(--bd)'}`, color:tab===t?'var(--ac)':'var(--tx2)' }}>
                  {t==='calendar'?'CALENDRIER':'ÉVÉNEMENTS'}
                </button>
              ))}
            </div>
          </div>

          {/* Pub affilié */}
          <div style={{ marginBottom:'1rem' }}><RandomAd type="banner" /></div>

          {tab === 'calendar' && <CalendarWidget locale={locale} />}

          {tab === 'upcoming' && (
            <>
              {!isPremium && (
                <div style={{ background:'color-mix(in srgb, var(--ac3) 5%, transparent)', border:'1px solid color-mix(in srgb, var(--ac3) 15%, transparent)', borderRadius:8, padding:'0.875rem 1rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                  <span style={{ fontSize:16 }}>🧠</span>
                  <div style={{ flex:1, minWidth:160 }}>
                    <div style={{ fontFamily:HUD, fontSize:8, color:'var(--ac3)', letterSpacing:1, marginBottom:2 }}>COACHING PSYCHOLOGIQUE INCLUS DANS PRO & ELITE</div>
                    <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx2)' }}>Stratégies NFP, CPI, FOMC + position sizing + timing optimal.</div>
                  </div>
                  <a href="/pricing" style={{ background:'var(--ac3)', color:'#020408', fontFamily:HUD, fontSize:8, letterSpacing:1, padding:'7px 12px', borderRadius:3, textDecoration:'none', fontWeight:700, whiteSpace:'nowrap' }}>DÉBLOQUER</a>
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(230px,1fr))', gap:12 }}>
                {events.map((ev, i)=>(
                  <CountdownCard key={ev.id} ev={ev} isPremium={isPremium} onSelect={setSelected} index={i} />
                ))}
                {events.length===0 && (
                  <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'3rem', color:'var(--tx3)', fontFamily:HUD, fontSize:10, letterSpacing:2 }}>CHARGEMENT...</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer légal — EN DEHORS de tout composant répété */}
        <footer className="app-footer">
          <a href="/legal/cgu">CGU</a>
          <span style={{color:'var(--tx3)'}}>·</span>
          <a href="/legal/confidentialite">Confidentialité</a>
          <span style={{color:'var(--tx3)'}}>·</span>
          <a href="/legal/mentions">Mentions légales</a>
          <span style={{color:'var(--tx3)'}}>·</span>
          <a href="/support">Assistance</a>
        </footer>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  )
}
