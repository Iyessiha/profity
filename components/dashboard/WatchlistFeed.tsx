// ============================================================
// PROFITYX — WatchlistFeed
// Watchlist de paires favorites + feed d'activité (preuve sociale)
// ============================================================
'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabasePublic } from '@/lib/supabase'

interface Props { userId: string; locale?: string }

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

const SUGGESTED = ['BTC/USD', 'ETH/USD', 'EUR/USD', 'GBP/USD', 'XAU/USD', 'USD/JPY']

interface Feed {
  analyses_1h: number
  analyses_24h: number
  active_traders: number
  top_pairs: { pair: string; count: number }[]
}

export default function WatchlistFeed({ userId, locale = 'fr' }: Props) {
  const [items, setItems] = useState<{ id: string; symbol: string }[]>([])
  const [feed, setFeed] = useState<Feed | null>(null)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [token, setToken] = useState('')

  // Récupérer le token de session
  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabasePublic.auth.getSession()
      if (session) setToken(session.access_token)
    })()
  }, [])

  const loadWatchlist = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/watchlist', { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (json.success) setItems(json.data)
    } catch { /* silencieux */ }
  }, [token])

  useEffect(() => { loadWatchlist() }, [loadWatchlist])

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data } = await supabasePublic.rpc('get_activity_feed')
      if (active && data) setFeed(data as Feed)
    })()
    return () => { active = false }
  }, [])

  const add = async (symbol: string) => {
    const s = symbol.trim().toUpperCase()
    if (!s || busy) return
    if (items.some(i => i.symbol === s)) { setInput(''); return }
    if (!token) { setErr(locale === 'fr' ? 'Session expirée, rechargez la page' : 'Session expired, reload'); return }
    setBusy(true); setErr('')
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ symbol: s }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setItems(prev => prev.some(i => i.id === json.data.id) ? prev : [...prev, json.data])
        setInput('')
      } else {
        setErr(json.error ?? (locale === 'fr' ? 'Erreur ajout' : 'Add error'))
      }
    } catch {
      setErr(locale === 'fr' ? 'Erreur réseau' : 'Network error')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
    if (!token) return
    await fetch(`/api/watchlist?id=${encodeURIComponent(id)}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: '1.5rem' }}>

      {/* ── Watchlist ── */}
      <div style={{ background: 'var(--bg1)', border: '1px solid rgba(0,255,178,0.1)', borderRadius: 10, padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <i className="ti ti-star" style={{ fontSize: 18, color: '#C9A84C' }} aria-hidden="true" />
          <span style={{ fontFamily: HUD, fontSize: 11, letterSpacing: 2, color: 'var(--tx0)' }}>
            {locale === 'fr' ? 'MA WATCHLIST' : 'MY WATCHLIST'}
          </span>
        </div>

        {/* Champ d'ajout */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') add(input) }}
            placeholder={locale === 'fr' ? 'Ex : BTC/USD' : 'e.g. BTC/USD'}
            style={{
              flex: 1, background: 'var(--bg2)', border: '1px solid rgba(0,255,178,0.15)',
              borderRadius: 4, padding: '8px 12px', color: 'var(--tx0)',
              fontFamily: BODY, fontSize: 14, outline: 'none',
            }}
          />
          <button onClick={() => add(input)} disabled={busy || !input.trim()} style={{
            background: 'rgba(0,255,178,0.1)', border: '1px solid rgba(0,255,178,0.25)',
            color: '#00FFB2', borderRadius: 4, padding: '0 14px', cursor: 'pointer',
            fontFamily: HUD, fontSize: 16, fontWeight: 700,
          }}>+</button>
        </div>

        {err && (
          <div style={{ fontFamily: BODY, fontSize: 12, color: '#FF3A5C', marginBottom: 10 }}>{err}</div>
        )}

        {/* Liste */}
        {items.length === 0 ? (
          <div>
            <div style={{ fontFamily: BODY, fontSize: 13, color: 'var(--tx2)', marginBottom: 10 }}>
              {locale === 'fr' ? 'Ajoutez vos paires favorites pour les suivre.' : 'Add your favorite pairs to track them.'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SUGGESTED.map(s => (
                <button key={s} onClick={() => add(s)} style={{
                  background: 'rgba(0,255,178,0.04)', border: '1px solid rgba(0,255,178,0.12)',
                  color: 'var(--tx1)', borderRadius: 100, padding: '4px 12px',
                  fontFamily: HUD, fontSize: 9, letterSpacing: 1, cursor: 'pointer',
                }}>+ {s}</button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.map(it => (
              <div key={it.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--bg2)', border: '1px solid rgba(0,255,178,0.06)',
                borderRadius: 4, padding: '8px 12px',
              }}>
                <span style={{ fontFamily: HUD, fontSize: 12, letterSpacing: 1, color: 'var(--tx0)' }}>{it.symbol}</span>
                <button onClick={() => remove(it.id)} style={{
                  background: 'transparent', border: 'none', color: 'rgba(255,58,92,0.6)',
                  cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0,
                }} aria-label="Retirer">
                  <i className="ti ti-x" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Feed d'activité ── */}
      <div style={{ background: 'var(--bg1)', border: '1px solid rgba(0,212,255,0.1)', borderRadius: 10, padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00E676', animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontFamily: HUD, fontSize: 11, letterSpacing: 2, color: 'var(--tx0)' }}>
            {locale === 'fr' ? 'ACTIVITÉ EN DIRECT' : 'LIVE ACTIVITY'}
          </span>
        </div>

        {feed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, background: 'var(--bg2)', borderRadius: 6, padding: '10px 12px' }}>
                <div style={{ fontFamily: HUD, fontSize: 22, fontWeight: 900, color: '#00FFB2' }}>{feed.analyses_24h}</div>
                <div style={{ fontFamily: BODY, fontSize: 11, color: 'var(--tx2)' }}>{locale === 'fr' ? 'analyses (24h)' : 'analyses (24h)'}</div>
              </div>
              <div style={{ flex: 1, background: 'var(--bg2)', borderRadius: 6, padding: '10px 12px' }}>
                <div style={{ fontFamily: HUD, fontSize: 22, fontWeight: 900, color: '#00D4FF' }}>{feed.active_traders}</div>
                <div style={{ fontFamily: BODY, fontSize: 11, color: 'var(--tx2)' }}>{locale === 'fr' ? 'traders actifs' : 'active traders'}</div>
              </div>
            </div>

            {feed.analyses_1h > 0 && (
              <div style={{ fontFamily: BODY, fontSize: 13, color: 'rgba(232,244,248,0.55)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="ti ti-flame" style={{ color: '#FF8800', fontSize: 15 }} aria-hidden="true" />
                {locale === 'fr'
                  ? `${feed.analyses_1h} analyse${feed.analyses_1h > 1 ? 's' : ''} dans la dernière heure`
                  : `${feed.analyses_1h} analysis in the last hour`}
              </div>
            )}

            {feed.top_pairs.length > 0 && (
              <div>
                <div style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 2, color: 'var(--tx3)', marginBottom: 8 }}>
                  {locale === 'fr' ? 'PAIRES TENDANCE' : 'TRENDING PAIRS'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {feed.top_pairs.map(p => (
                    <span key={p.pair} style={{
                      background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)',
                      borderRadius: 100, padding: '4px 12px', fontFamily: HUD, fontSize: 9,
                      letterSpacing: 1, color: '#00D4FF',
                    }}>{p.pair} · {p.count}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontFamily: BODY, fontSize: 13, color: 'var(--tx3)' }}>
            {locale === 'fr' ? 'Chargement...' : 'Loading...'}
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.2} }`}</style>
    </div>
  )
}
