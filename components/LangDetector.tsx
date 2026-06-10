// ============================================================
// PROFITYX — LangDetector
// Détecte la langue au premier chargement (si pas de préférence)
// Redirige vers /en si pays anglophone
// ============================================================
'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function LangDetector() {
  const pathname = usePathname()
  const router   = useRouter()

  useEffect(() => {
    // Ne pas rediriger si l'utilisateur a déjà une préférence
    if (typeof localStorage === 'undefined') return
    const saved = localStorage.getItem('pxLang')
    if (saved) return // préférence déjà définie → pas touche

    // Ne pas rediriger depuis le dashboard, settings, admin, etc.
    const noRedirect = ['/dashboard','/analysis','/admin','/settings',
                        '/auth','/invoice','/blog','/pricing','/results']
    if (noRedirect.some(p => pathname.startsWith(p))) return

    // Détecter via API
    fetch('/api/detect-lang')
      .then(r => r.json())
      .then(({ lang, country }) => {
        localStorage.setItem('pxLang', lang)

        // Rediriger vers la bonne landing page
        if (lang === 'en' && pathname === '/') {
          console.log(`[LangDetector] ${country} → /en`)
          router.replace('/en')
        } else if (lang === 'fr' && pathname === '/en') {
          console.log(`[LangDetector] ${country} → /`)
          router.replace('/')
        }
      })
      .catch(() => {})
  }, [pathname, router])

  return null
}
