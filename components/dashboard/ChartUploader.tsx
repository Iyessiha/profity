// ============================================================
// PROFITYX — ChartUploader
// Upload image → Claude Vision → Signal IA affiché
// ============================================================
'use client'
import { useState, useCallback, useRef } from 'react'
import { useChartAnalyze }               from '@/lib/hooks'
import SignalCard                         from '@/components/SignalCard'

interface Props { locale: string; userId: string; plan?: string; analysesLeft?: number }

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'
const MAX_MB  = 4.5

const T: Record<string, Record<string, string>> = {
  fr: {
    drop:      'Déposez votre chart ici',
    or:        'ou cliquez pour sélectionner',
    formats:   'JPG · PNG · WEBP · max 4.5MB',
    analyzing: 'ANALYSE EN COURS...',
    error_size: `Fichier trop lourd (max ${MAX_MB}MB)`,
    error_type: 'Format non supporté. Utilisez JPG, PNG ou WEBP.',
    new:       'NOUVELLE ANALYSE',
    timeframe: 'Timeframe',
    pair:      'Paire',
  },
  en: {
    drop:      'Drop your chart here',
    or:        'or click to select',
    formats:   'JPG · PNG · WEBP · max 4.5MB',
    analyzing: 'ANALYZING...',
    error_size: `File too large (max ${MAX_MB}MB)`,
    error_type: 'Unsupported format. Use JPG, PNG or WEBP.',
    new:       'NEW ANALYSIS',
    timeframe: 'Timeframe',
    pair:      'Pair',
  },
}

function t(locale: string, key: string) {
  return T[locale]?.[key] ?? T['fr'][key] ?? key
}

export default function ChartUploader({ locale, plan = 'free', analysesLeft }: Props) {
  const fileRef  = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileErr,  setFileErr]  = useState<string | null>(null)

  const { analyze, loading, signal, error, quotaErr, reset } = useChartAnalyze()

  const HUD  = "'Orbitron', monospace"
  const BODY = "'Rajdhani', sans-serif"

  // Valider et traiter le fichier
  const processFile = useCallback(async (file: File) => {
    setFileErr(null)

    // Validations
    if (!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) {
      setFileErr(t(locale, 'error_type')); return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setFileErr(t(locale, 'error_size')); return
    }

    // Prévisualisation
    const url = URL.createObjectURL(file)
    setPreview(url)

    // Analyser
    await analyze(file, locale)
  }, [analyze, locale])

  const handleFile = (files: FileList | null) => {
    if (files?.[0]) processFile(files[0])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files)
  }

  const handleReset = () => {
    reset()
    setPreview(null)
    setFileErr(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  // ── État : résultat disponible ────────────────────────────
  if (signal) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn .4s ease' }}>
        {/* Image + Signal côte à côte */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Image uploadée */}
          <div style={{
            background: '#06090F', border: '1px solid rgba(0,255,178,0.1)',
            borderRadius: 8, overflow: 'hidden', position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              background: 'linear-gradient(90deg,transparent,#00FFB2,transparent)',
            }} />
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(0,255,178,0.06)' }}>
              <span style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 2, color: '#00D4FF' }}>
                {t(locale, 'pair')} : {signal.pair} · {t(locale, 'timeframe')} : {signal.timeframe}
              </span>
            </div>
            {preview && (
              <img
                src={preview} alt="Chart analysé"
                style={{ width: '100%', height: 300, objectFit: 'contain', background: '#020408' }}
              />
            )}
          </div>

          {/* Signal */}
          <SignalCard signal={signal} type="chart" />

          {/* Comparateur contextuel (upsell après analyse) */}
          {plan === 'free' && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(0,255,178,0.06), rgba(0,212,255,0.04))',
              border: '1px solid rgba(0,255,178,0.2)', borderRadius: 10, padding: '1.25rem 1.5rem',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#00FFB2,#00D4FF,transparent)' }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                <i className="ti ti-bolt" style={{ fontSize: 26, color: '#00FFB2', flexShrink: 0 }} aria-hidden="true" />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontFamily: HUD, fontSize: 12, letterSpacing: 1, color: '#00FFB2', marginBottom: 6 }}>
                    {locale === 'fr' ? 'AVEC PRO, VOUS AURIEZ EU PLUS' : 'WITH PRO, YOU\'D GET MORE'}
                  </div>
                  <div style={{ fontFamily: BODY, fontSize: 14, color: 'rgba(232,244,248,0.6)', lineHeight: 1.6 }}>
                    {locale === 'fr'
                      ? 'Une alerte push automatique avant chaque annonce sur cette paire, un historique complet de 90 jours, et 100 analyses par mois au lieu de 3.'
                      : 'An automatic push alert before each event on this pair, 90-day full history, and 100 analyses/month instead of 3.'}
                  </div>
                </div>
                <a href="/pricing" style={{
                  background: '#00FFB2', color: '#020408', fontFamily: HUD, fontSize: 9, letterSpacing: 2,
                  padding: '10px 18px', borderRadius: 4, textDecoration: 'none', fontWeight: 700, whiteSpace: 'nowrap', alignSelf: 'center',
                }}>
                  {locale === 'fr' ? 'PASSER PRO →' : 'GO PRO →'}
                </a>
              </div>
            </div>
          )}
          {plan === 'pro' && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(201,168,76,0.06), rgba(201,168,76,0.02))',
              border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, padding: '1rem 1.5rem',
              display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            }}>
              <i className="ti ti-crown" style={{ fontSize: 22, color: '#C9A84C', flexShrink: 0 }} aria-hidden="true" />
              <div style={{ flex: 1, minWidth: 180, fontFamily: BODY, fontSize: 14, color: 'rgba(232,244,248,0.6)' }}>
                {locale === 'fr'
                  ? 'Passez Elite pour des analyses illimitées et des alertes prioritaires.'
                  : 'Go Elite for unlimited analyses and priority alerts.'}
              </div>
              <a href="/pricing" style={{
                background: 'transparent', border: '1px solid rgba(201,168,76,0.4)', color: '#C9A84C',
                fontFamily: HUD, fontSize: 9, letterSpacing: 2, padding: '8px 16px', borderRadius: 4,
                textDecoration: 'none', fontWeight: 700, whiteSpace: 'nowrap',
              }}>
                {locale === 'fr' ? 'DÉCOUVRIR ELITE' : 'DISCOVER ELITE'}
              </a>
            </div>
          )}
        </div>

        {/* Bouton nouvelle analyse */}
        <button
          onClick={handleReset}
          style={{
            alignSelf:    'flex-start',
            background:   'transparent',
            border:       '1px solid rgba(0,255,178,0.25)',
            color:        '#00FFB2',
            fontFamily:   HUD,
            fontSize:     10,
            letterSpacing:2,
            padding:      '10px 24px',
            borderRadius: 4,
            cursor:       'pointer',
            transition:   'all .2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,255,178,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          ← {t(locale, 'new')}
        </button>
      </div>
    )
  }

  // ── État : en cours d'analyse ─────────────────────────────
  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 24, padding: '4rem 2rem',
        background: '#06090F', border: '1px solid rgba(0,255,178,0.1)',
        borderRadius: 8,
      }}>
        {preview && (
          <img
            src={preview} alt="Chart"
            style={{ width: '100%', maxWidth: 400, height: 200, objectFit: 'contain',
                     borderRadius: 4, opacity: 0.5 }}
          />
        )}
        {/* Loader animé */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48, height: 48, border: '2px solid rgba(0,255,178,0.1)',
            borderTop: '2px solid #00FFB2', borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <div style={{ fontFamily: HUD, fontSize: 11, letterSpacing: 3, color: '#00FFB2' }}>
            {t(locale, 'analyzing')}
          </div>
          <div style={{ fontFamily: BODY, fontSize: 13, color: 'rgba(232,244,248,0.3)' }}>
            {locale === 'fr'
              ? 'Claude analyse la structure de marché...'
              : 'Claude is analyzing market structure...'}
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // ── État : zone de dépôt ──────────────────────────────────
  const lowQuota = plan === 'free' && typeof analysesLeft === 'number' && analysesLeft <= 2 && analysesLeft > 0
  const noQuota  = plan === 'free' && analysesLeft === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Bandeau de rareté */}
      {(lowQuota || noQuota) && (
        <div style={{
          background: noQuota ? 'rgba(255,58,92,0.08)' : 'rgba(201,168,76,0.08)',
          border: `1px solid ${noQuota ? 'rgba(255,58,92,0.3)' : 'rgba(201,168,76,0.3)'}`,
          borderRadius: 8, padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className={'ti ' + (noQuota ? 'ti-lock' : 'ti-alert-triangle')} style={{ fontSize: 20, color: noQuota ? '#FF3A5C' : '#C9A84C' }} aria-hidden="true" />
            <div>
              <div style={{ fontFamily: HUD, fontSize: 10, letterSpacing: 1, color: noQuota ? '#FF3A5C' : '#C9A84C', marginBottom: 2 }}>
                {noQuota
                  ? (locale === 'fr' ? 'QUOTA ÉPUISÉ' : 'QUOTA REACHED')
                  : (locale === 'fr' ? `PLUS QUE ${analysesLeft} ANALYSE${analysesLeft! > 1 ? 'S' : ''} CE MOIS-CI` : `ONLY ${analysesLeft} ANALYSIS LEFT THIS MONTH`)}
              </div>
              <div style={{ fontFamily: BODY, fontSize: 13, color: 'rgba(232,244,248,0.55)' }}>
                {locale === 'fr' ? 'Débloquez 100 analyses/mois avec le plan Pro.' : 'Unlock 100 analyses/month with Pro.'}
              </div>
            </div>
          </div>
          <a href="/pricing" style={{
            background: noQuota ? '#FF3A5C' : '#C9A84C', color: '#020408',
            fontFamily: HUD, fontSize: 9, letterSpacing: 2, padding: '9px 16px', borderRadius: 4,
            textDecoration: 'none', fontWeight: 700, whiteSpace: 'nowrap',
          }}>
            {locale === 'fr' ? 'DÉBLOQUER →' : 'UNLOCK →'}
          </a>
        </div>
      )}

      {/* Zone de dépôt */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border:       `2px dashed ${dragOver ? '#00FFB2' : 'rgba(0,255,178,0.15)'}`,
          borderRadius: 8,
          background:   dragOver ? 'rgba(0,255,178,0.04)' : '#06090F',
          padding:      '4rem 2rem',
          display:      'flex',
          flexDirection:'column',
          alignItems:   'center',
          justifyContent:'center',
          gap:          16,
          cursor:       'pointer',
          transition:   'all .25s',
          minHeight:    280,
          position:     'relative',
          overflow:     'hidden',
        }}
      >
        {/* Coins déco */}
        {['tl','tr','bl','br'].map(c => (
          <div key={c} style={{
            position: 'absolute',
            [c.includes('t') ? 'top' : 'bottom']: 16,
            [c.includes('l') ? 'left' : 'right']: 16,
            width: 12, height: 12,
            borderTop:    c.includes('t') ? `1px solid ${dragOver ? '#00FFB2' : 'rgba(0,255,178,0.3)'}` : 'none',
            borderBottom: c.includes('b') ? `1px solid ${dragOver ? '#00FFB2' : 'rgba(0,255,178,0.3)'}` : 'none',
            borderLeft:   c.includes('l') ? `1px solid ${dragOver ? '#00FFB2' : 'rgba(0,255,178,0.3)'}` : 'none',
            borderRight:  c.includes('r') ? `1px solid ${dragOver ? '#00FFB2' : 'rgba(0,255,178,0.3)'}` : 'none',
            transition: 'border-color .25s',
          }} />
        ))}

        {/* Icône */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: dragOver ? 'rgba(0,255,178,0.12)' : 'rgba(0,255,178,0.06)',
          border: `1px solid ${dragOver ? 'rgba(0,255,178,0.4)' : 'rgba(0,255,178,0.15)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .25s',
        }}>
          <i className="ti ti-upload" style={{ fontSize: 28, color: dragOver ? '#00FFB2' : 'rgba(0,255,178,0.4)' }} aria-hidden="true" />
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: HUD, fontSize: 13, letterSpacing: 2, color: dragOver ? '#00FFB2' : '#E8F4F8', marginBottom: 6 }}>
            {t(locale, 'drop')}
          </div>
          <div style={{ fontFamily: BODY, fontSize: 14, color: 'rgba(232,244,248,0.35)' }}>
            {t(locale, 'or')}
          </div>
          <div style={{ fontFamily: HUD, fontSize: 9, color: 'rgba(232,244,248,0.2)', letterSpacing: 2, marginTop: 8 }}>
            {t(locale, 'formats')}
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files)}
        />
      </div>

      {/* Erreur fichier */}
      {(fileErr || error) && (
        <div style={{
          background: 'rgba(255,58,92,0.06)', border: '1px solid rgba(255,58,92,0.2)',
          borderRadius: 6, padding: '10px 14px',
          fontFamily: HUD, fontSize: 10, color: '#FF3A5C', letterSpacing: 1,
        }}>
          {fileErr ?? error}
        </div>
      )}

      {/* Quota dépassé */}
      {quotaErr && (
        <div style={{
          background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.25)',
          borderRadius: 6, padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: HUD, fontSize: 10, color: '#C9A84C', letterSpacing: 1, marginBottom: 3 }}>
              {locale === 'fr' ? 'QUOTA ÉPUISÉ' : 'QUOTA EXCEEDED'}
            </div>
            <div style={{ fontFamily: BODY, fontSize: 13, color: 'rgba(232,244,248,0.5)' }}>
              {locale === 'fr'
                ? 'Passez au plan Pro pour continuer — 100 analyses/mois.'
                : 'Upgrade to Pro for 100 analyses/month.'}
            </div>
          </div>
          <a href="/pricing" style={{
            background: '#C9A84C', color: '#020408',
            fontFamily: HUD, fontSize: 9, letterSpacing: 2,
            padding: '8px 16px', borderRadius: 3, textDecoration: 'none',
            fontWeight: 700, whiteSpace: 'nowrap',
          }}>
            {locale === 'fr' ? 'UPGRADE' : 'UPGRADE'}
          </a>
        </div>
      )}

      {/* Tips */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
      }}>
        {[
          { icon: 'ti-zoom-in',    fr: 'Chart bien visible', en: 'Clear chart view' },
          { icon: 'ti-clock',      fr: 'Timeframe lisible',  en: 'Readable timeframe' },
          { icon: 'ti-chart-line', fr: 'Bougies visibles',   en: 'Candles visible' },
        ].map(tip => (
          <div key={tip.fr} style={{
            background: 'rgba(0,255,178,0.02)', border: '1px solid rgba(0,255,178,0.06)',
            borderRadius: 4, padding: '8px 10px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <i className={`ti ${tip.icon}`} style={{ fontSize: 14, color: 'rgba(0,255,178,0.4)' }} aria-hidden="true" />
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: 'rgba(232,244,248,0.35)' }}>
              {locale === 'fr' ? tip.fr : tip.en}
            </span>
          </div>
        ))}
      </div>

      {/* Aperçu flouté des fonctions Pro (teasing) */}
      {plan === 'free' && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 2, color: 'rgba(232,244,248,0.3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-lock" style={{ fontSize: 13, color: '#C9A84C' }} aria-hidden="true" />
            {locale === 'fr' ? 'DÉBLOQUÉ AVEC PRO & ELITE' : 'UNLOCKED WITH PRO & ELITE'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
            {[
              { icon: 'ti-bell-ringing', fr: 'Alertes push temps réel', en: 'Real-time push alerts' },
              { icon: 'ti-history',      fr: 'Historique 90 jours',     en: '90-day history' },
              { icon: 'ti-infinity',     fr: 'Signaux news illimités',  en: 'Unlimited news signals' },
            ].map(f => (
              <a key={f.fr} href="/pricing" style={{
                position: 'relative', background: '#06090F', border: '1px solid rgba(201,168,76,0.15)',
                borderRadius: 8, padding: '1rem', textDecoration: 'none', overflow: 'hidden', display: 'block',
              }}>
                {/* Contenu flouté */}
                <div style={{ filter: 'blur(3px)', opacity: 0.5, pointerEvents: 'none' }}>
                  <i className={'ti ' + f.icon} style={{ fontSize: 22, color: '#C9A84C', marginBottom: 8, display: 'block' }} aria-hidden="true" />
                  <div style={{ fontFamily: HUD, fontSize: 10, letterSpacing: 1, color: '#E8F4F8' }}>{locale === 'fr' ? f.fr : f.en}</div>
                  <div style={{ fontFamily: BODY, fontSize: 12, color: 'rgba(232,244,248,0.4)', marginTop: 4 }}>●●●●●●●●</div>
                </div>
                {/* Cadenas overlay */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <i className="ti ti-lock" style={{ fontSize: 18, color: '#C9A84C' }} aria-hidden="true" />
                  <span style={{ fontFamily: HUD, fontSize: 7, letterSpacing: 1, color: '#C9A84C' }}>{locale === 'fr' ? 'DÉBLOQUER' : 'UNLOCK'}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
