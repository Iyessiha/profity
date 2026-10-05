// 404 for URLs that match neither app (two root layouts → no shared layout).
import type { Metadata } from 'next'
import NotFoundView from '@/components/NotFoundView'
import './globals.css'

export const metadata: Metadata = {
  title: '404 — ProfityX',
}

const SET_LANG = `(function(){try{var l=localStorage.getItem('pxLang');if(l==='en'||l==='fr')document.documentElement.lang=l;}catch(e){}})();`

export default function GlobalNotFound() {
  return (
    <html lang="fr" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SET_LANG }} />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <NotFoundView />
      </body>
    </html>
  )
}
