// ============================================================
// PROFITYX — Protection anti-clic droit globale
// Bloque : clic droit, drag d'images, raccourcis DevTools
// ============================================================
'use client'
import { useEffect } from 'react'

export default function RightClickGuard() {
  useEffect(() => {
    // 1. Bloquer le clic droit
    const blockContextMenu = (e: MouseEvent) => e.preventDefault()

    // 2. Bloquer le drag des images
    const blockDrag = (e: DragEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'IMG') e.preventDefault()
    }

    // 3. Bloquer raccourcis DevTools courants
    const blockShortcuts = (e: KeyboardEvent) => {
      // F12, Ctrl+Shift+I/J/C/U, Cmd+Option+I/J/C/U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['i','I','j','J','c','C','u','U'].includes(e.key)) ||
        (e.metaKey && e.altKey && ['i','I','j','J','c','C'].includes(e.key))
      ) {
        e.preventDefault()
        return false
      }
    }

    document.addEventListener('contextmenu', blockContextMenu)
    document.addEventListener('dragstart', blockDrag)
    document.addEventListener('keydown', blockShortcuts)

    return () => {
      document.removeEventListener('contextmenu', blockContextMenu)
      document.removeEventListener('dragstart', blockDrag)
      document.removeEventListener('keydown', blockShortcuts)
    }
  }, [])

  return null
}
