// ============================================================
// PROFITYX — Système de thème Dark / Light
// ============================================================
'use client'
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export type Theme = 'dark' | 'light'

interface ThemeCtx {
  theme: Theme
  toggleTheme: () => void
  isDark: boolean
}

const Ctx = createContext<ThemeCtx>({ theme: 'dark', toggleTheme: () => {}, isDark: true })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const saved = (typeof localStorage !== 'undefined' ? localStorage.getItem('pxTheme') : null) as Theme | null
    const initial = saved ?? 'light'
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem('pxTheme', next)
      return next
    })
  }, [])

  return <Ctx.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>{children}</Ctx.Provider>
}

export function useTheme() { return useContext(Ctx) }
