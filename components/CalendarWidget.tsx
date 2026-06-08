// ============================================================
// PROFITYX — CalendarWidget
// Calendrier économique live avec filtres, countdown,
// et bouton "Analyser" pour générer un signal IA
// ============================================================
'use client'
import { useState }                       from 'react'
import { useCalendar, formatCountdown, formatEventTime,
         IMPACT_COLORS, STATUS_COLORS,
         type ImpactFilter, type CountryFilter,
         type EnrichedEvent }             from '@/lib/useCalendar'
import { useNewsSignal }                  from '@/lib/hooks'
import SignalCard                         from '@/components/SignalCard'

interface Props {
  locale?: string
}

const CURRENCIES: CountryFilter[] = ['all','USD','EUR','GBP','JPY','CAD','AUD','CHF']
const IMPACTS:    ImpactFilter[]  = ['all','High','Medium','Low']

const LABELS: Record<string, Record<string, string>> = {
  fr: {
    title: 'CALENDRIER ÉCONOMIQUE',
    live:  'EN DIRECT',
    filterImpact: 'Impact',
    filterCurr:   'Devise',
    noEvents:     'Aucune annonce pour ces filtres.',
    loading:      'Chargement...',
    error:        'Erreur de chargement',
    actual:       'Réel',
    forecast:     'Prévu',
    previous:     'Préc.',
    analyze:      'ANALYSER',
    anticipate:   'ANTICIPER',
    waiting:      'EN COURS',
    analyzing:    'ANALYSE...',
    lastUpdate:   'Mis à jour',
  },
  en: {
    title: 'ECONOMIC CALENDAR',
    live:  'LIVE',
    filterImpact: 'Impact',
    filterCurr:   'Currency',
    noEvents:     'No events for these filters.',
    loading:      'Loading...',
    error:        'Loading error',
    actual:       'Actual',
    forecast:     'Forecast',
    previous:     'Prev.',
    analyze:      'ANALYZE',
    anticipate:   'ANTICIPATE',
    waiting:      'LIVE',
    analyzing:    'ANALYZING...',
    lastUpdate:   'Updated',
  },
}

function lbl(locale: string, key: string): string {
  return LABELS[locale]?.[key] ?? LABELS['fr'][key] ?? key
}

// ─── Ligne événement ─────────────────────────────────────────
function EventRow({
  event, locale, onAnalyze, isAnalyzing,
}: {
  event:       EnrichedEvent
  locale:      string
  onAnalyze:   (e: EnrichedEvent) => void
  isAnalyzing: boolean
}) {
  const ic = IMPACT_COLORS[event.impact] ?? IMPACT_COLORS['Low']
  const sc = STATUS_COLORS[event.status]
  // Analyser avant (anticipation) ou après (réaction) — toujours possible sauf si imminent (-5min)
  const isImminent  = event.status === 'imminent' && event.minutes_until > -5 && event.minutes_until < 5
  const canAnalyze  = !isImminent
  const isAnticipation = event.actual == null  // pas encore publié → mode anticipation
  const [expanded, setExpanded] = useState(false)

  const impactLabel = event.impact === 'High' ? (locale === 'fr' ? 'Fort impact' : 'High impact')
    : event.impact === 'Medium' ? (locale === 'fr' ? 'Impact moyen' : 'Medium impact')
    : (locale === 'fr' ? 'Faible impact' : 'Low impact')

  // Interprétation simple du résultat
  let interpretation = ''
  if (event.actual != null && event.forecast != null) {
    const a = parseFloat(event.actual), f = parseFloat(event.forecast)
    if (!isNaN(a) && !isNaN(f)) {
      if (a > f) interpretation = locale === 'fr' ? `Résultat SUPÉRIEUR aux attentes (${event.actual} vs ${event.forecast} prévu) — généralement haussier pour ${event.country}.` : `Result ABOVE forecast — typically bullish for ${event.country}.`
      else if (a < f) interpretation = locale === 'fr' ? `Résultat INFÉRIEUR aux attentes (${event.actual} vs ${event.forecast} prévu) — généralement baissier pour ${event.country}.` : `Result BELOW forecast — typically bearish for ${event.country}.`
      else interpretation = locale === 'fr' ? 'Résultat CONFORME aux attentes — impact neutre attendu.' : 'Result IN LINE with forecast — neutral impact expected.'
    }
  }

  return (
    <div style={{ borderBottom: '1px solid rgba(0,255,178,0.05)' }}>
    <div style={{
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      transition: 'background .2s',
      cursor: 'pointer',
      background: expanded ? 'rgba(0,255,178,0.04)' : event.status === 'imminent' ? 'rgba(201,168,76,0.04)' : 'transparent',
    }}
      onClick={() => setExpanded(v => !v)}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,255,178,0.03)')}
      onMouseLeave={e => (e.currentTarget.style.background =
        expanded ? 'rgba(0,255,178,0.04)' : event.status === 'imminent' ? 'rgba(201,168,76,0.04)' : 'transparent'
      )}
    >
      {/* Dot impact */}
      <div style={{
        width: 7, height: 7, borderRadius: '50%',
        background: ic.dot, flexShrink: 0,
        boxShadow: event.impact === 'High' ? `0 0 6px ${ic.dot}` : 'none',
      }} />

      {/* Info principale */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Orbitron', monospace",
          fontSize: 11, letterSpacing: 1,
          color: '#E8F4F8',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {event.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
          <span style={{
            fontFamily: "'Orbitron', monospace", fontSize: 9,
            color: '#00D4FF', letterSpacing: 1,
          }}>{event.country}</span>
          <span style={{ fontSize: 10, color: sc, fontFamily: "'Rajdhani', sans-serif" }}>
            {event.status === 'published'
              ? formatEventTime(event.date, locale)
              : formatCountdown(event.minutes_until, locale)
            }
          </span>
        </div>
      </div>

      {/* Data colonnes */}
      <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
        {[
          { l: lbl(locale, 'actual'),   v: event.actual,   up: event.actual != null && event.forecast != null && parseFloat(event.actual!) > parseFloat(event.forecast!) },
          { l: lbl(locale, 'forecast'), v: event.forecast, up: null },
          { l: lbl(locale, 'previous'), v: event.previous, up: null },
        ].map(({ l, v, up }) => (
          <div key={l} style={{ textAlign: 'right', minWidth: 44 }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 8, color: 'rgba(232,244,248,0.3)', letterSpacing: 1, marginBottom: 2 }}>
              {l}
            </div>
            <div style={{
              fontFamily: "'Orbitron', monospace", fontSize: 12, fontWeight: 700,
              color: v == null ? 'rgba(232,244,248,0.2)'
                : up === true  ? '#00E676'
                : up === false ? '#FF3A5C'
                : '#E8F4F8',
            }}>
              {v ?? '—'}
            </div>
          </div>
        ))}
      </div>

      {/* Bouton analyser */}
      <button
        onClick={(e) => { e.stopPropagation(); canAnalyze && onAnalyze(event) }}
        disabled={!canAnalyze || isAnalyzing}
        style={{
          flexShrink: 0,
          background: canAnalyze ? 'rgba(0,255,178,0.08)' : 'transparent',
          border: `1px solid ${canAnalyze ? 'rgba(0,255,178,0.25)' : 'rgba(232,244,248,0.08)'}`,
          color: canAnalyze ? '#00FFB2' : 'rgba(232,244,248,0.2)',
          fontFamily: "'Orbitron', monospace",
          fontSize: 8, letterSpacing: 2,
          padding: '6px 12px', borderRadius: 3,
          cursor: canAnalyze ? 'pointer' : 'default',
          transition: 'all .2s',
          whiteSpace: 'nowrap',
        }}
      >
        {isAnalyzing
          ? lbl(locale, 'analyzing')
          : isImminent
          ? lbl(locale, 'waiting')
          : isAnticipation
          ? lbl(locale, 'anticipate')
          : lbl(locale, 'analyze')}
      </button>

      {/* Chevron */}
      <i className={'ti ' + (expanded ? 'ti-chevron-up' : 'ti-chevron-down')} style={{ fontSize: 14, color: 'rgba(232,244,248,0.3)', flexShrink: 0 }} aria-hidden="true" />
    </div>

    {/* Panneau détail (au clic) */}
    {expanded && (
      <div style={{ padding: '0 16px 16px 34px', background: 'rgba(0,255,178,0.02)' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 8, letterSpacing: 1, color: ic.dot, background: ic.dot + '15', border: `1px solid ${ic.dot}30`, borderRadius: 3, padding: '3px 8px' }}>{impactLabel}</span>
          <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 8, letterSpacing: 1, color: '#00D4FF', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 3, padding: '3px 8px' }}>{event.country}</span>
          <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 8, letterSpacing: 1, color: sc, background: sc + '15', border: `1px solid ${sc}30`, borderRadius: 3, padding: '3px 8px' }}>
            {event.status === 'published' ? (locale === 'fr' ? 'PUBLIÉ' : 'PUBLISHED') : event.status === 'imminent' ? (locale === 'fr' ? 'IMMINENT' : 'IMMINENT') : event.status === 'overdue' ? (locale === 'fr' ? 'EN RETARD' : 'OVERDUE') : (locale === 'fr' ? 'À VENIR' : 'UPCOMING')}
          </span>
          <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: 'rgba(232,244,248,0.45)', alignSelf: 'center' }}>
            {formatEventTime(event.date, locale)}
          </span>
        </div>

        {interpretation && (
          <div style={{ background: '#0A0F1A', border: '1px solid rgba(0,255,178,0.1)', borderRadius: 6, padding: '12px 14px', marginBottom: 12 }}>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 8, letterSpacing: 2, color: 'rgba(232,244,248,0.35)', marginBottom: 6 }}>{locale === 'fr' ? 'INTERPRÉTATION RAPIDE' : 'QUICK READ'}</div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 14, color: 'rgba(232,244,248,0.75)', lineHeight: 1.6 }}>{interpretation}</div>
          </div>
        )}

        {!canAnalyze && (
          <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13, color: 'rgba(232,244,248,0.4)', fontStyle: 'italic', marginBottom: 12 }}>
            {locale === 'fr' ? "Le résultat n'est pas encore publié. Le bouton Analyser sera disponible dès la publication." : 'Result not published yet. The Analyze button will be available once published.'}
          </div>
        )}

        {canAnalyze && (
          <button
            onClick={(e) => { e.stopPropagation(); onAnalyze(event) }}
            disabled={isAnalyzing}
            style={{ background: '#00FFB2', border: 'none', color: '#020408', fontFamily: "'Orbitron',monospace", fontSize: 10, letterSpacing: 2, fontWeight: 700, padding: '10px 20px', borderRadius: 4, cursor: isAnalyzing ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <i className="ti ti-sparkles" style={{ fontSize: 14 }} aria-hidden="true" />
            {isAnalyzing ? lbl(locale, 'analyzing') : (locale === 'fr' ? 'GÉNÉRER LE SIGNAL IA' : 'GENERATE AI SIGNAL')}
          </button>
        )}
      </div>
    )}
    </div>
  )
}

// ─── Composant principal ─────────────────────────────────────
export default function CalendarWidget({ locale = 'fr' }: Props) {
  const [impact,  setImpact]  = useState<ImpactFilter>('High')
  const [country, setCountry] = useState<CountryFilter>('all')
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [focusMode, setFocusMode] = useState(false)  // TOUT par défaut

  const { events, loading, error, lastFetch, nextPoll, refetch } = useCalendar({ impact, country })
  const { analyze, signal, loading: sigLoading, error: sigError, reset } = useNewsSignal()

  // Mode focus : priorise les annonces imminentes / récentes
  const displayEvents = (() => {
    if (!focusMode) return events
    const rank = (e: EnrichedEvent) => {
      if (e.status === 'imminent') return 0
      if (e.status === 'published' && e.minutes_until > -120) return 1  // publié < 2h
      if (e.status === 'upcoming' && e.minutes_until < 7 * 24 * 60) return 2  // semaine
      if (e.status === 'published') return 4
      return 3
    }
    return [...events]
      .map(e => ({ e, r: rank(e) }))
      .filter(x => x.r <= 2)
      .sort((a, b) => a.r - b.r || Math.abs(a.e.minutes_until) - Math.abs(b.e.minutes_until))
      .map(x => x.e)
  })()

  const handleAnalyze = async (event: EnrichedEvent) => {
    const id = `${event.title}-${event.date}`
    setAnalyzingId(id)
    reset()

    await analyze({
      event_title: event.title,
      country:     event.country,
      impact:      event.impact,
      actual:      event.actual ?? '',
      forecast:    event.forecast ?? '',
      previous:    event.previous ?? '',
      locale,
    })

    setAnalyzingId(null)
  }

  const HUD_FONT = "'Orbitron', monospace"
  const BODY_FONT = "'Rajdhani', sans-serif"

  return (
    <div style={{ fontFamily: BODY_FONT }}>
      {/* Widget calendrier */}
      <div style={{
        background: '#0D1420',
        border: '1px solid rgba(0,255,178,0.12)',
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Ligne lumineuse top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, #00FFB2, #00D4FF, transparent)',
          opacity: 0.5,
        }} />

        {/* Header */}
        <div style={{
          background: '#06090F',
          padding: '12px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid rgba(0,255,178,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: HUD_FONT, fontSize: 11, letterSpacing: 3, color: '#00D4FF' }}>
              {lbl(locale, 'title')}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: HUD_FONT, fontSize: 8, color: '#00E676', letterSpacing: 2 }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%', background: '#00E676',
                animation: 'pulse 1.5s infinite',
                display: 'inline-block',
              }} />
              {lbl(locale, 'live')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Filtre impact */}
            <select
              value={impact}
              onChange={e => setImpact(e.target.value as ImpactFilter)}
              style={{
                background: '#0A0F1A', border: '1px solid rgba(0,255,178,0.15)',
                color: '#00D4FF', fontFamily: HUD_FONT, fontSize: 9,
                padding: '5px 8px', borderRadius: 3, letterSpacing: 1, cursor: 'pointer',
              }}
            >
              {IMPACTS.map(i => <option key={i} value={i}>{i === 'all' ? 'ALL' : i.toUpperCase()}</option>)}
            </select>

            {/* Filtre devise */}
            <select
              value={country}
              onChange={e => setCountry(e.target.value as CountryFilter)}
              style={{
                background: '#0A0F1A', border: '1px solid rgba(0,255,178,0.15)',
                color: '#00D4FF', fontFamily: HUD_FONT, fontSize: 9,
                padding: '5px 8px', borderRadius: 3, letterSpacing: 1, cursor: 'pointer',
              }}
            >
              {CURRENCIES.map(c => <option key={c} value={c}>{c === 'all' ? 'ALL' : c}</option>)}
            </select>

            {/* Toggle focus : annonces en cours/nouvelles */}
            <button
              onClick={() => setFocusMode(v => !v)}
              title={locale === 'fr' ? 'Annonces en cours et à venir' : 'Current & upcoming'}
              style={{
                background: focusMode ? 'rgba(0,255,178,0.12)' : 'rgba(0,212,255,0.06)',
                border: `1px solid ${focusMode ? 'rgba(0,255,178,0.35)' : 'rgba(0,212,255,0.15)'}`,
                color: focusMode ? '#00FFB2' : '#00D4FF', fontFamily: HUD_FONT, fontSize: 8,
                padding: '5px 10px', borderRadius: 3, cursor: 'pointer', letterSpacing: 1, whiteSpace: 'nowrap',
              }}
            >
              {focusMode ? (locale === 'fr' ? '● EN COURS' : '● LIVE') : (locale === 'fr' ? 'TOUT' : 'ALL')}
            </button>

            {/* Refresh */}
            <button
              onClick={refetch}
              style={{
                background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)',
                color: '#00D4FF', fontFamily: HUD_FONT, fontSize: 9,
                padding: '5px 10px', borderRadius: 3, cursor: 'pointer', letterSpacing: 1,
              }}
            >
              ↻
            </button>
          </div>
        </div>

        {/* Barre de statut LIVE */}
        {lastFetch && (
          <div style={{
            background: 'rgba(0,255,178,0.03)',
            padding: '5px 16px',
            borderBottom: '1px solid rgba(0,255,178,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              {/* Point animé */}
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: nextPoll <= 30_000 ? '#FF6B35' : '#00FFB2',
                display: 'inline-block',
                boxShadow: nextPoll <= 30_000 ? '0 0 6px #FF6B35' : '0 0 6px #00FFB2',
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
              <span style={{ fontFamily: HUD_FONT, fontSize: 7, letterSpacing: 1,
                color: nextPoll <= 30_000 ? '#FF6B35' : 'rgba(0,255,178,0.6)' }}>
                {nextPoll <= 30_000 ? '⚡ IMMINENT · MAJ 30s' :
                 nextPoll <= 60_000 ? '🔄 MAJ 1 MIN' : '🔄 MAJ 2 MIN'}
              </span>
            </div>
            <span style={{ fontFamily: HUD_FONT, fontSize: 7, letterSpacing: 1,
              color: 'rgba(232,244,248,0.2)' }}>
              {lbl(locale, 'lastUpdate')} {lastFetch.toLocaleTimeString(
                locale === 'fr' ? 'fr-FR' : 'en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' }
              )}
            </span>
          </div>
        )}

        {/* Contenu */}
        {loading && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(232,244,248,0.3)', fontFamily: HUD_FONT, fontSize: 10, letterSpacing: 3 }}>
            {lbl(locale, 'loading')}
          </div>
        )}

        {error && (
          <div style={{ padding: '1.5rem 16px', color: '#FF3A5C', fontFamily: HUD_FONT, fontSize: 10, letterSpacing: 2 }}>
            {lbl(locale, 'error')} — {error}
          </div>
        )}

        {!loading && !error && displayEvents.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(232,244,248,0.25)', fontFamily: HUD_FONT, fontSize: 10, letterSpacing: 2 }}>
            {focusMode
              ? (locale === 'fr' ? 'Aucune annonce en cours ou à venir aujourd\'hui.' : 'No current or upcoming events today.')
              : lbl(locale, 'noEvents')}
          </div>
        )}

        {!loading && displayEvents.map(event => {
          const id = `${event.title}-${event.date}`
          return (
            <EventRow
              key={id}
              event={event}
              locale={locale}
              onAnalyze={handleAnalyze}
              isAnalyzing={analyzingId === id && sigLoading}
            />
          )
        })}
      </div>

      {/* Signal généré */}
      {signal && (
        <div style={{ marginTop: 16 }}>
          <SignalCard signal={signal} type="news" />
        </div>
      )}

      {/* Erreur signal */}
      {sigError && (
        <div style={{
          marginTop: 12,
          background: 'rgba(255,58,92,0.06)',
          border: '1px solid rgba(255,58,92,0.2)',
          borderRadius: 6, padding: '10px 14px',
          fontFamily: HUD_FONT, fontSize: 10, color: '#FF3A5C', letterSpacing: 1,
        }}>
          {sigError}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.2} }
        select option { background: #06090F; }
      `}</style>
    </div>
  )
}
