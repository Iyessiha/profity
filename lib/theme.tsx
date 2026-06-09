'use client'
import { createContext, useContext, useEffect } from 'react'

type Theme = 'dark'
interface ThemeCtx { theme: Theme; toggleTheme: () => void; isDark: boolean }

const Ctx = createContext<ThemeCtx>({ theme: 'dark', toggleTheme: () => {}, isDark: true })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
    if (typeof localStorage !== 'undefined') localStorage.removeItem('pxTheme')
  }, [])
  return <Ctx.Provider value={{ theme: 'dark', toggleTheme: () => {}, isDark: true }}>{children}</Ctx.Provider>
}

export function useTheme() { return useContext(Ctx) }
