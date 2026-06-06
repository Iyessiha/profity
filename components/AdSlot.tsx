// ============================================================
// PROFITYX — AdSlot : emplacement publicitaire
// Supporte Google AdSense + annonces manuelles
// ============================================================
'use client'
import { useEffect, useRef } from 'react'

interface AdSlotProps {
  type:    'banner' | 'rectangle' | 'interstitial' | 'native'
  slot?:   string  // ID slot Google AdSense
  manual?: { title: string; desc: string; cta: string; url: string; logo?: string; color?: string }
  showAds?: boolean  // contrôlé par admin
}

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

export default function AdSlot({ type, slot, manual, showAds = true }: AdSlotProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Google AdSense injection
  useEffect(() => {
    if (!slot || !showAds || !ref.current) return
    if (typeof window === 'undefined') return
    // Injecter le script AdSense si pas encore chargé
    if (!document.getElementById('adsense-script')) {
      const script = document.createElement('script')
      script.id = 'adsense-script'
      script.async = true
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7885889662324153'
      script.crossOrigin = 'anonymous'
      document.head.appendChild(script)
    }
    // Déclencher l'affichage
    try { ((window as Record<string,unknown>).adsbygoogle as unknown[])?.push({}) } catch {}
  }, [slot, showAds])

  if (!showAds) return null

  // Annonce manuelle (priorité sur AdSense)
  if (manual) {
    const color = manual.color ?? 'var(--ac)'
    const sizes: Record<string, { h: string }> = {
      banner: { h: '70px' }, rectangle: { h: '120px' }, native: { h: '80px' }, interstitial: { h: '150px' },
    }
    return (
      <div style={{ height:sizes[type]?.h, background:'var(--bg2)', border:`1px solid color-mix(in srgb, ${color} 20%, transparent)`, borderRadius:8, padding:'0.75rem 1rem', display:'flex', alignItems:'center', gap:14, overflow:'hidden', position:'relative' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${color}, transparent)` }} />
        <div style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, color:'var(--tx3)', position:'absolute', top:6, right:8 }}>PARTENAIRE</div>
        {manual.logo && (
          <div style={{ width:40, height:40, borderRadius:8, background:`color-mix(in srgb, ${color} 12%, transparent)`, border:`1px solid color-mix(in srgb, ${color} 25%, transparent)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:HUD, fontSize:11, color, flexShrink:0 }}>
            {manual.logo}
          </div>
        )}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:1, color:'var(--tx0)', marginBottom:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{manual.title}</div>
          <div style={{ fontFamily:BODY, fontSize:12, color:'var(--tx2)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{manual.desc}</div>
        </div>
        <a href={manual.url} target="_blank" rel="noopener noreferrer sponsored" style={{ background:color, color:'#020408', fontFamily:HUD, fontSize:8, letterSpacing:1, padding:'7px 12px', borderRadius:3, textDecoration:'none', fontWeight:700, whiteSpace:'nowrap', flexShrink:0 }}>
          {manual.cta}
        </a>
      </div>
    )
  }

  // Google AdSense
  if (slot) {
    const heights: Record<string, number> = { banner:70, rectangle:250, native:100, interstitial:150 }
    return (
      <div ref={ref} style={{ minHeight:heights[type], background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:6, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
        <div style={{ position:'absolute', top:4, right:8, fontFamily:HUD, fontSize:6, color:'var(--tx3)', letterSpacing:1 }}>PUBLICITÉ</div>
        <ins className="adsbygoogle"
          style={{ display:'block', width:'100%', height:`${heights[type]}px` }}
          data-ad-client="ca-pub-7885889662324153"
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true" />
      </div>
    )
  }

  return null
}

// Annonces intégrées ProfityX (brokers affiliés)
export const PROFITYX_ADS = [
  { title:'Exness — Spreads dès 0.0 pip', desc:'Ouvrez un compte Exness et commencez à trader', cta:'OUVRIR UN COMPTE', url:'https://one.exnessonelink.com/a/o13sztxg6a', logo:'EX', color:'#F7D000' },
  { title:'Deriv — Indices Synthétiques', desc:'Tradez les indices Deriv 24/7 sans interruption', cta:'COMMENCER', url:'https://deriv.partners/rx?sidc=3FE806F1-F584-4A05-BC12-54EE5EE8709E', logo:'DV', color:'#FF444F' },
  { title:'WelTrade — CFD & Forex', desc:'Spreads compétitifs sur 200+ instruments', cta:'S\'INSCRIRE', url:'https://gowt.net/ib66022', logo:'WT', color:'#0066B3' },
  { title:'Binance — Crypto Exchange', desc:'Tradez 350+ cryptos avec les meilleurs frais', cta:'REJOINDRE', url:'https://www.binance.com/en/activity/referral-entry/CPA?ref=CPA_0080G3N0DZ', logo:'BNB', color:'#F0B90B' },
  { title:'HFM — Forex & Métaux', desc:'Bonus et cashback sur vos transactions', cta:'DÉCOUVRIR', url:'https://www.hfm.com/sv/en/?refid=30490867', logo:'HFM', color:'#E30613' },
]

export function RandomAd({ type = 'banner' }: { type?: AdSlotProps['type'] }) {
  const ad = PROFITYX_ADS[Math.floor(Math.random() * PROFITYX_ADS.length)]
  return <AdSlot type={type} manual={ad} showAds={true} />
}
