// ============================================================
// PROFITYX — Hook useCalendar
// Gère le fetch + filtres + polling du calendrier économique
// ============================================================
'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import type { FFEvent } from '@/types'

export type EventStatus = 'upcoming' | 'imminent' | 'overdue' | 'published'

export interface EnrichedEvent extends FFEvent {
  status:       EventStatus
  minutes_until: number
}

export type ImpactFilter  = 'High' | 'Medium' | 'Low' | 'all'
export type CountryFilter = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'all'

interface UseCalendarOptions {
  impact?:         ImpactFilter
  country?:        CountryFilter
  pollIntervalMs?: number   // rafraîchissement auto (défaut : 5 min)
}

export function useCalendar(opts: UseCalendarOptions = {}) {
  const {
    impact         = 'High',
    country        = 'all',
    pollIntervalMs = 5 * 60 * 1000,
  } = opts

  const [events,  setEvents]  = useState<EnrichedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  const fetch_ = useCallback(async () => {
    // Annuler le fetch précédent
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (impact  !== 'all') params.set('impact',  impact)
      if (country !== 'all') params.set('country', country)

      const res = await fetch(`/api/calendar?${params}`, {
        signal: abortRef.current.signal,
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'Erreur calendrier')

      setEvents(json.data ?? [])
      setLastFetch(new Date())
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return
      setError('Impossible de charger le calendrier.')
      console.error('[useCalendar]', err)
    } finally {
      setLoading(false)
    }
  }, [impact, country])

  // Fetch initial + quand les filtres changent
  useEffect(() => {
    fetch_()
  }, [fetch_])

  // Polling automatique
  useEffect(() => {
    if (!pollIntervalMs) return
    const id = setInterval(fetch_, pollIntervalMs)
    return () => clearInterval(id)
  }, [fetch_, pollIntervalMs])

  // Mise à jour des statuts toutes les 30s (sans refetch réseau)
  useEffect(() => {
    const id = setInterval(() => {
      setEvents(prev => prev.map(e => {
        const diff = new Date(e.date).getTime() - Date.now()
        return {
          ...e,
          status: e.actual != null ? 'published'
            : diff < 0                  ? 'overdue'
            : diff < 15 * 60 * 1000    ? 'imminent'
            : 'upcoming',
          minutes_until: Math.floor(diff / 60000),
        }
      }))
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  return { events, loading, error, lastFetch, refetch: fetch_ }
}

// ─── Utilitaires ─────────────────────────────────────────────

// Formater le temps restant avant une annonce
export function formatCountdown(minutes: number, locale = 'fr'): string {
  if (minutes < 0) return locale === 'fr' ? 'Publié' : 'Published'
  if (minutes < 1) return locale === 'fr' ? 'Imminent' : 'Imminent'
  if (minutes < 60) return locale === 'fr' ? `dans ${minutes}min` : `in ${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (locale === 'fr') return m > 0 ? `dans ${h}h${m}min` : `dans ${h}h`
  return m > 0 ? `in ${h}h${m}min` : `in ${h}h`
}

// Formater la date/heure d'une annonce
export function formatEventTime(dateStr: string, locale = 'fr'): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    hour:   '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

// Couleur selon l'impact
export const IMPACT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  High:    { bg: 'rgba(255,58,92,0.1)',   text: '#FF3A5C', dot: '#FF3A5C' },
  Medium:  { bg: 'rgba(201,168,76,0.1)',  text: '#C9A84C', dot: '#C9A84C' },
  Low:     { bg: 'rgba(100,100,120,0.1)', text: '#888',    dot: '#888'    },
  Holiday: { bg: 'rgba(0,212,255,0.05)',  text: '#00D4FF', dot: '#00D4FF' },
}

// Couleur selon le statut
export const STATUS_COLORS: Record<EventStatus, string> = {
  upcoming:  '#888',
  imminent:  '#C9A84C',
  overdue:   'rgba(232,244,248,0.3)',
  published: '#00E676',
}
