// ============================================================
// PROFITYX — Hook useCalendar (polling intelligent permanent)
// ============================================================
'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import type { FFEvent } from '@/types'

export type EventStatus   = 'upcoming' | 'imminent' | 'overdue' | 'published'
export type ImpactFilter  = 'High' | 'Medium' | 'Low' | 'all'
export type CountryFilter = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'all'

export interface EnrichedEvent extends FFEvent {
  status:        EventStatus
  minutes_until: number
}

interface UseCalendarOptions {
  impact?:  ImpactFilter
  country?: CountryFilter
}

// Intervalles de polling
const POLL_IMMINENT_MS = 30  * 1000   //  30s  — si événement dans < 30 min
const POLL_SOON_MS     = 60  * 1000   //   1 min — si événement dans < 2h
const POLL_NORMAL_MS   = 2   * 60_000 //   2 min — sinon

export function useCalendar(opts: UseCalendarOptions = {}) {
  const { impact = 'High', country = 'all' } = opts

  const [events,    setEvents]    = useState<EnrichedEvent[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const [nextPoll,  setNextPoll]  = useState<number>(POLL_NORMAL_MS)

  const abortRef   = useRef<AbortController | null>(null)
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  // Calcule l'intervalle optimal selon les prochains événements
  const getInterval = (evs: EnrichedEvent[]): number => {
    const mins = evs
      .filter(e => e.status !== 'published')
      .map(e => Math.abs(e.minutes_until))
    if (!mins.length) return POLL_NORMAL_MS
    const nearest = Math.min(...mins)
    if (nearest <= 30)  return POLL_IMMINENT_MS
    if (nearest <= 120) return POLL_SOON_MS
    return POLL_NORMAL_MS
  }

  const load = useCallback(async (silent = false) => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    if (!silent) setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (impact  !== 'all') params.set('impact',  impact)
      if (country !== 'all') params.set('country', country)
      params.set('t', Date.now().toString())   // cache-buster

      const res = await window.fetch(`/api/calendar?${params}`, {
        signal: abortRef.current.signal,
        cache:  'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'Erreur calendrier')

      if (!mountedRef.current) return

      const enriched = json.data as EnrichedEvent[]
      setEvents(enriched)
      setLastFetch(new Date())
      setNextPoll(getInterval(enriched))
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return
      if (!mountedRef.current) return
      setError((err as Error)?.message ?? 'Erreur réseau')
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [impact, country])

  // Planifier le prochain poll
  const scheduleNext = useCallback((interval: number) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      load(true)   // silent = pas de spinner
    }, interval)
  }, [load])

  // Lancer le polling à chaque changement de nextPoll
  useEffect(() => {
    scheduleNext(nextPoll)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [nextPoll, scheduleNext])

  // Chargement initial
  useEffect(() => {
    mountedRef.current = true
    load(false)
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [load])

  // Re-planifier après chaque fetch
  useEffect(() => {
    if (!lastFetch) return
    scheduleNext(nextPoll)
  }, [lastFetch, nextPoll, scheduleNext])

  const refetch = useCallback(() => load(false), [load])

  return { events, loading, error, lastFetch, nextPoll, refetch }
}

// ── Utilitaires ────────────────────────────────────────────
export function formatCountdown(minutes: number, locale = 'fr'): string {
  const abs = Math.abs(minutes)
  if (abs < 1)  return locale === 'fr' ? 'maintenant' : 'now'
  if (abs < 60) return `${abs} min`
  const h = Math.floor(abs / 60), m = abs % 60
  return m > 0 ? `${h}h${m.toString().padStart(2,'0')}` : `${h}h`
}

export function formatEventTime(dateStr: string, locale = 'fr'): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    hour: '2-digit', minute: '2-digit',
  })
}
