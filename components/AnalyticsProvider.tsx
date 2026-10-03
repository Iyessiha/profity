'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { initAnalytics, trackPage } from '@/lib/analytics'

export default function AnalyticsProvider({ children }: { children?: React.ReactNode }) {
  const path = usePathname()
  useEffect(() => { initAnalytics() }, [])
  useEffect(() => { if (path) trackPage(path) }, [path])
  return <>{children}</>
}
