// ============================================================
// PROFITYX — Hook React useAnalyze
// Gère l'upload d'image + appel API + état côté client
// ============================================================
'use client'
import { useState, useCallback } from 'react'
import { supabasePublic }        from '@/lib/supabase'
import type { ChartSignal, NewsSignal, ApiResponse } from '@/types'

// ─── Hook analyse de chart ──────────────────────────────────
export function useChartAnalyze() {
  const [loading,  setLoading]  = useState(false)
  const [signal,   setSignal]   = useState<ChartSignal | null>(null)
  const [error,    setError]    = useState<string | null>(null)
  const [quotaErr, setQuotaErr] = useState(false)

  const analyze = useCallback(async (file: File, locale = 'fr') => {
    setLoading(true)
    setError(null)
    setSignal(null)
    setQuotaErr(false)

    try {
      // Récupérer le token Supabase
      const { data: { session } } = await supabasePublic.auth.getSession()
      if (!session) {
        setError('Vous devez être connecté.')
        return null
      }

      // Construire le FormData
      const formData = new FormData()
      formData.append('image',  file)
      formData.append('locale', locale)

      // Appel API
      const res = await fetch('/api/analyze', {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        body:    formData,
      })

      const json: ApiResponse<ChartSignal> = await res.json()

      if (!json.success || !json.data) {
        if (json.code === 'QUOTA_EXCEEDED') setQuotaErr(true)
        setError(json.error ?? 'Erreur inconnue')
        return null
      }

      setSignal(json.data)
      return json.data

    } catch (err) {
      setError('Erreur réseau — vérifiez votre connexion.')
      console.error('[useChartAnalyze]', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setSignal(null)
    setError(null)
    setQuotaErr(false)
  }, [])

  return { analyze, loading, signal, error, quotaErr, reset }
}

// ─── Hook signal sur annonce ─────────────────────────────────
export function useNewsSignal() {
  const [loading,  setLoading]  = useState(false)
  const [signal,   setSignal]   = useState<NewsSignal | null>(null)
  const [error,    setError]    = useState<string | null>(null)
  const [quotaErr, setQuotaErr] = useState(false)

  const analyze = useCallback(async (params: {
    event_title: string
    country:     string
    impact:      string
    actual:      string
    forecast:    string
    previous:    string
    locale?:     string
  }) => {
    setLoading(true)
    setError(null)
    setSignal(null)
    setQuotaErr(false)

    try {
      const { data: { session } } = await supabasePublic.auth.getSession()
      if (!session) {
        setError('Vous devez être connecté.')
        return null
      }

      const res = await fetch('/api/news/signal', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(params),
      })

      const json: ApiResponse<NewsSignal> = await res.json()

      if (!json.success || !json.data) {
        if (json.code === 'QUOTA_EXCEEDED') setQuotaErr(true)
        setError(json.error ?? 'Erreur inconnue')
        return null
      }

      setSignal(json.data)
      return json.data

    } catch (err) {
      setError('Erreur réseau — vérifiez votre connexion.')
      console.error('[useNewsSignal]', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setSignal(null)
    setError(null)
    setQuotaErr(false)
  }, [])

  return { analyze, loading, signal, error, quotaErr, reset }
}
