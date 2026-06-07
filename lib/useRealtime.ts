// ============================================================
// PROFITYX — Hook Supabase Realtime pour sync temps réel
// ============================================================
'use client'
import { useEffect, useCallback } from 'react'
import { supabasePublic } from '@/lib/supabase'

interface RealtimeOptions {
  userId: string
  onCreditChange?: (balance: number) => void
  onProfileChange?: (profile: Record<string, unknown>) => void
  onActivityChange?: () => void
}

export function useRealtimeSync({ userId, onCreditChange, onProfileChange, onActivityChange }: RealtimeOptions) {
  const subscribe = useCallback(() => {
    if (!userId) return () => {}

    // Canal unique par utilisateur
    const channel = supabasePublic
      .channel(`user-sync-${userId}`)

      // Écouter les changements de crédits
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'credits',
        filter: `user_id=eq.${userId}`,
      }, payload => {
        const newRow = payload.new as { balance?: number }
        if (newRow?.balance !== undefined && onCreditChange) {
          onCreditChange(newRow.balance)
        }
      })

      // Écouter les changements de profil (analyses_used, streak, plan)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`,
      }, payload => {
        if (payload.new && onProfileChange) {
          onProfileChange(payload.new as Record<string, unknown>)
        }
        if (onActivityChange) onActivityChange()
      })

      // Écouter les nouvelles analyses (pour l'historique)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chart_analyses',
        filter: `user_id=eq.${userId}`,
      }, () => {
        if (onActivityChange) onActivityChange()
      })

      .subscribe()

    return () => {
      supabasePublic.removeChannel(channel)
    }
  }, [userId, onCreditChange, onProfileChange, onActivityChange])

  useEffect(() => {
    const unsub = subscribe()
    return unsub
  }, [subscribe])
}
