'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

type Theme = 'dark' | 'light'
interface ThemeCtx { theme: Theme; toggleTheme: () => void; isDark: boolean }

const Ctx = createContext<ThemeCtx>({ theme: 'dark', toggleTheme: () => {}, isDark: true })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const saved = (typeof localStorage !== 'undefined' ? localStorage.getItem('pxTheme') : null) as Theme | null
    const initial = saved ?? 'dark'
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', next)
      if (typeof localStorage !== 'undefined') localStorage.setItem('pxTheme', next)
      return next
    })
  }, [])

  return <Ctx.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>{children}</Ctx.Provider>
}

export function useTheme() { return useContext(Ctx) }
