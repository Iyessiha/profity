// ============================================================
// PROFITYX — PaymentMethods (paramètres)
// Gérer ses moyens de paiement + renouvellement automatique
// ============================================================
'use client'
import { useEffect, useState } from 'react'
import { supabasePublic } from '@/lib/supabase'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

interface PM { id: string; type: string; label: string; is_default: boolean }

const TYPES = [
  { v: 'orange_money', label: 'Orange Money', color: '#FF6600' },
  { v: 'mtn',          label: 'MTN MoMo',     color: '#FFCC00' },
  { v: 'moov',         label: 'Moov Money',   color: '#0066CC' },
  { v: 'wave',         label: 'Wave',         color: '#00BFFF' },
  { v: 'card',         label: 'Carte bancaire', color: '#888' },
]

export default function PaymentMethods({ autoRenew: initialAutoRenew = true, hasSubscription = false }: { autoRenew?: boolean; hasSubscription?: boolean }) {
  const [token, setToken] = useState('')
  const [items, setItems] = useState<PM[]>([])
  const [type, setType] = useState('orange_money')
  const [number, setNumber] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [autoRenew, setAutoRenew] = useState(initialAutoRenew)

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg2)', border: '1px solid var(--bd)',
    borderRadius: 8, padding: '1.5rem', marginBottom: '1rem',
  }

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabasePublic.auth.getSession()
      if (session) { setToken(session.access_token); load(session.access_token) }
    })()
  }, [])

  const load = async (tk: string) => {
    try {
      const res = await fetch('/api/payment-methods', { headers: { Authorization: `Bearer ${tk}` } })
      const json = await res.json()
      if (json.success) setItems(json.data)
    } catch { /* */ }
  }

  const add = async () => {
    setErr('')
    if (type !== 'card' && !/^\+?\d{8,15}$/.test(number.replace(/\s/g, ''))) {
      setErr('Numéro invalide'); return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type, number }),
      })
      const json = await res.json()
      if (json.success) { setItems(p => [...p, json.data]); setNumber('') }
      else setErr(json.error ?? 'Erreur')
    } catch { setErr('Erreur réseau') }
    finally { setBusy(false) }
  }

  const remove = async (id: string) => {
    setItems(p => p.filter(i => i.id !== id))
    await fetch(`/api/payment-methods?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
  }

  const setDefault = async (id: string) => {
    setItems(p => p.map(i => ({ ...i, is_default: i.id === id })))
    await fetch('/api/payment-methods', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ set_default: id }),
    }).catch(() => {})
  }

  const toggleRenew = async () => {
    const next = !autoRenew
    setAutoRenew(next)
    await fetch('/api/payment-methods', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ auto_renew: next }),
    }).catch(() => {})
  }

  const typeColor = (t: string) => TYPES.find(x => x.v === t)?.color ?? '#888'

  return (
    <>
      {/* Moyens de paiement */}
      <div style={cardStyle}>
        <div style={{ fontFamily: HUD, fontSize: 10, letterSpacing: 2, color: '#00D4FF', marginBottom: '1.25rem' }}>
          MOYENS DE PAIEMENT
        </div>

        {items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {items.map(pm => (
              <div key={pm.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(0,255,178,0.02)', border: '1px solid var(--bd)',
                borderRadius: 6, padding: '10px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: typeColor(pm.type) }} />
                  <span style={{ fontFamily: BODY, fontSize: 14, color: 'var(--tx0)' }}>{pm.label}</span>
                  {pm.is_default && (
                    <span style={{ fontFamily: HUD, fontSize: 7, letterSpacing: 1, color: '#00FFB2', background: 'rgba(0,255,178,0.1)', border: '1px solid rgba(0,255,178,0.2)', borderRadius: 2, padding: '2px 6px' }}>DÉFAUT</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {!pm.is_default && (
                    <button onClick={() => setDefault(pm.id)} style={{ background: 'transparent', border: '1px solid rgba(0,255,178,0.2)', color: '#00FFB2', fontFamily: HUD, fontSize: 7, letterSpacing: 1, padding: '4px 8px', borderRadius: 3, cursor: 'pointer' }}>DÉFAUT</button>
                  )}
                  <button onClick={() => remove(pm.id)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,58,92,0.7)', cursor: 'pointer', fontSize: 16 }} aria-label="Supprimer">
                    <i className="ti ti-trash" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ajout */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={type} onChange={e => setType(e.target.value)} style={{
            background: 'var(--bg1)', border: '1px solid rgba(0,255,178,0.15)', color: 'var(--tx0)',
            fontFamily: BODY, fontSize: 14, padding: '9px 12px', borderRadius: 4, cursor: 'pointer',
          }}>
            {TYPES.map(t => <option key={t.v} value={t.v} style={{ background: 'var(--bg1)' }}>{t.label}</option>)}
          </select>
          <input
            value={number} onChange={e => setNumber(e.target.value)}
            placeholder={type === 'card' ? '4 derniers chiffres' : '+225 07 00 00 00 00'}
            style={{ flex: 1, minWidth: 160, background: 'var(--bg1)', border: '1px solid rgba(0,255,178,0.15)', color: 'var(--tx0)', fontFamily: BODY, fontSize: 14, padding: '9px 12px', borderRadius: 4 }}
          />
          <button onClick={add} disabled={busy || !number} style={{
            background: 'rgba(0,255,178,0.1)', border: '1px solid rgba(0,255,178,0.25)', color: '#00FFB2',
            fontFamily: HUD, fontSize: 9, letterSpacing: 1, padding: '0 18px', borderRadius: 4, cursor: 'pointer',
          }}>AJOUTER</button>
        </div>
        {err && <div style={{ fontFamily: BODY, fontSize: 12, color: '#FF3A5C', marginTop: 8 }}>{err}</div>}
        <div style={{ fontFamily: BODY, fontSize: 11, color: 'rgba(232,244,248,0.3)', marginTop: 10 }}>
          Le numéro est masqué et stocké de façon sécurisée. Le paiement reste traité par GeniusPay.
        </div>
      </div>

      {/* Renouvellement automatique */}
      <div style={cardStyle}>
        <div style={{ fontFamily: HUD, fontSize: 10, letterSpacing: 2, color: '#00D4FF', marginBottom: '1.25rem' }}>
          RENOUVELLEMENT AUTOMATIQUE
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, paddingRight: 16 }}>
            <div style={{ fontFamily: HUD, fontSize: 11, color: 'var(--tx0)', letterSpacing: 1, marginBottom: 4 }}>
              ABONNEMENT RÉCURRENT
            </div>
            <div style={{ fontFamily: BODY, fontSize: 13, color: 'rgba(232,244,248,0.4)' }}>
              {autoRenew
                ? 'Votre abonnement se renouvelle automatiquement chaque mois.'
                : 'Votre abonnement prendra fin à l\'échéance, sans reconduction.'}
            </div>
          </div>
          <button onClick={toggleRenew} disabled={!hasSubscription} style={{
            width: 52, height: 28, borderRadius: 14, flexShrink: 0,
            background: autoRenew ? '#00FFB2' : 'rgba(232,244,248,0.1)',
            border: 'none', cursor: hasSubscription ? 'pointer' : 'not-allowed', position: 'relative',
            opacity: hasSubscription ? 1 : 0.4,
          }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: autoRenew ? 27 : 3, transition: 'left .3s' }} />
          </button>
        </div>
        {!hasSubscription && (
          <div style={{ fontFamily: BODY, fontSize: 12, color: 'rgba(232,244,248,0.3)', marginTop: 10 }}>
            Disponible une fois un abonnement actif.
          </div>
        )}
      </div>
    </>
  )
}
