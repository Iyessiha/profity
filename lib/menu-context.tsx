// ============================================================
// PROFITYX — MenuContext : état du drawer mobile partagé
// entre TopBar (le bouton) et Sidebar (le panneau)
// ============================================================
'use client'
import { createContext, useContext, useState, type ReactNode } from 'react'

interface MenuCtx { open: boolean; toggle: () => void; close: () => void }
const Ctx = createContext<MenuCtx>({ open: false, toggle: () => {}, close: () => {} })

export function MenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <Ctx.Provider value={{ open, toggle: () => setOpen(v => !v), close: () => setOpen(false) }}>
      {children}
    </Ctx.Provider>
  )
}

export const useMenu = () => useContext(Ctx)
