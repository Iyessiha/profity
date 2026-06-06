import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from '@/lib/theme'
import { MenuProvider } from '@/lib/menu-context'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#020408' },
    { media: '(prefers-color-scheme: light)', color: '#EEF1F6' },
  ],
}

export const metadata: Metadata = {
  title: 'ProfityX — Signaux de Trading IA',
  description: 'Analysez vos graphiques et les annonces économiques avec l\'IA. Entrée, Stop Loss, Take Profit en quelques secondes.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'ProfityX' },
  icons: { icon: '/favicon.svg', apple: '/favicon.svg', other: [{ rel: 'apple-touch-icon', url: '/icon-192.png' }] },
  keywords: ['trading', 'forex', 'crypto', 'signaux', 'IA', 'analyse technique', 'SMC'],
  openGraph: { title: 'ProfityX — Trading IA', description: 'Signaux de trading propulsés par l\'IA', type: 'website', locale: 'fr_FR' },
}

const ANTI_FLASH = `(function(){try{var t=localStorage.getItem('pxTheme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`
const REGISTER_SW = `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ANTI_FLASH }} />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.17.0/dist/tabler-icons.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <ThemeProvider>
          <MenuProvider>
            {children}
          </MenuProvider>
        </ThemeProvider>
        <script dangerouslySetInnerHTML={{ __html: REGISTER_SW }} />
      </body>
    </html>
  )
}
