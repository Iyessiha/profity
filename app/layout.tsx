import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { ThemeProvider } from '@/lib/theme'
import { MenuProvider } from '@/lib/menu-context'
import PWAInstall from '@/components/PWAInstall'
import AnalyticsProvider from '@/components/AnalyticsProvider'
import RightClickGuard from '@/components/RightClickGuard'
import LangDetector    from '@/components/LangDetector'
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

// ── Facebook Pixel 971512922538139 ────────────────────────
// ── Google Ads ID hardcodé ─────────────────────────────────
const GOOGLE_ADS_ID = 'AW-18224201183'
const GTAG_SCRIPT = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GOOGLE_ADS_ID}');`
const FB_PIXEL = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','971512922538139');fbq('track','PageView');`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ANTI_FLASH }} />
        {/* Facebook Pixel */}
        <script dangerouslySetInnerHTML={{ __html: FB_PIXEL }} />
        <noscript dangerouslySetInnerHTML={{ __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=971512922538139&ev=PageView&noscript=1"/>` }} />
        {/* Google AdSense */}
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7885889662324153" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.17.0/dist/tabler-icons.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        {/* Apple Touch Icon — utilisé par iOS pour l'écran d'accueil */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ProfityX" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <ThemeProvider>
          <MenuProvider>
            {children}
          </MenuProvider>
        </ThemeProvider>
        <script dangerouslySetInnerHTML={{ __html: REGISTER_SW }} />
        <PWAInstall />
        <AnalyticsProvider />
        <RightClickGuard />
        <LangDetector />
        {/* Google Ads Tag — next/script pour chargement garanti */}
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`} strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: GTAG_SCRIPT }} />
        <style>{`
          img { -webkit-user-drag: none; user-select: none; -webkit-user-select: none; pointer-events: auto; }
          canvas { -webkit-user-drag: none; user-select: none; }
        `}</style>
      </body>
    </html>
  )
}
