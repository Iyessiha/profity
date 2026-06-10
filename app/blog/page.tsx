import { POSTS } from '@/lib/blog-posts'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog Trading SMC — Stratégies, Tutoriels et Signaux | ProfityX',
  description: 'Articles experts sur le Smart Money Concept, Order Blocks, FVG, Boom 1000, Crash 500 et signaux IA. Apprenez à trader comme les institutionnels.',
  keywords: ['blog trading SMC', 'tutoriel order block', 'signaux trading Deriv', 'stratégie Boom 1000'],
  alternates: { canonical: 'https://profity-x.com/blog' },
  openGraph: {
    title: 'Blog ProfityX — Tout sur le Trading SMC',
    description: 'Stratégies, tutoriels et guides pour trader Deriv avec le Smart Money Concept.',
    url: 'https://profity-x.com/blog',
    siteName: 'ProfityX',
    type: 'website',
  },
}

import { useEffect, useState } from 'react'

function useLang() {
  const [l,s]=useState('fr')
  useEffect(()=>{s(localStorage.getItem('pxLang')||'fr')},[]);return l
}

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

const CAT_COLORS: Record<string, string> = {
  'Stratégie': '#00FFB2', 'Strategy': '#00D4FF',
  'Éducation': '#C9A84C', 'Education': '#C9A84C',
  'Technologie': '#A78BFA', 'Technology': '#A78BFA',
}

export default function BlogPage() {
  const lang = useLang()
  const frPosts = POSTS.filter(p => p.lang === 'fr')
  const enPosts = POSTS.filter(p => p.lang === 'en')

  return (
    <div style={{ minHeight:'100vh', background:'#020408', color:'#F0F8FF', fontFamily:BODY }}>
      {/* Nav */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(2,4,8,0.95)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(0,255,178,0.07)', padding:'0 1.5rem', height:60, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Link href="/" style={{ fontFamily:HUD, fontSize:16, fontWeight:900, letterSpacing:2, color:'#00FFB2', textDecoration:'none' }}>
          PROFIT<span style={{ color:'#00D4FF' }}>YX</span>
        </Link>
        <div style={{ display:'flex', gap:20, alignItems:'center' }}>
          <Link href="/" style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'rgba(240,248,255,0.45)', textDecoration:'none' }}>ACCUEIL</Link>
          <Link href="/auth/login" style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'#020408', background:'#00FFB2', padding:'8px 16px', borderRadius:4, textDecoration:'none', fontWeight:700 }}>ESSAI GRATUIT</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding:'4rem 2rem 2rem', maxWidth:1100, margin:'0 auto', textAlign:'center' }}>
        <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:3, color:'rgba(0,255,178,0.6)', marginBottom:12 }}>RESSOURCES TRADING</div>
        <h1 style={{ fontFamily:HUD, fontSize:'clamp(28px,4vw,48px)', fontWeight:900, marginBottom:16 }}>
          Blog <span style={{ color:'#00FFB2' }}>SMC Trading</span>
        </h1>
        <p style={{ fontFamily:BODY, fontSize:16, color:'rgba(240,248,255,0.5)', maxWidth:600, margin:'0 auto' }}>
          Guides, stratégies et tutoriels pour maîtriser le Smart Money Concept sur Deriv et Forex.
        </p>
      </section>

      {/* Articles FR */}
      <section style={{ padding:'2rem', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:3, color:'rgba(0,255,178,0.5)', marginBottom:20, paddingBottom:10, borderBottom:'1px solid rgba(0,255,178,0.08)' }}>
          🇫🇷 ARTICLES EN FRANÇAIS
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:20, marginBottom:48 }}>
          {frPosts.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration:'none' }}>
              <article style={{ background:'#08111F', border:'1px solid rgba(0,255,178,0.08)', borderRadius:12, padding:'1.5rem', height:'100%', cursor:'pointer', transition:'all .2s', display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color: CAT_COLORS[post.category] ?? '#00FFB2', background:`${CAT_COLORS[post.category] ?? '#00FFB2'}15`, border:`1px solid ${CAT_COLORS[post.category] ?? '#00FFB2'}30`, borderRadius:100, padding:'3px 10px' }}>
                    {post.category}
                  </span>
                  <span style={{ fontFamily:HUD, fontSize:7, color:'rgba(240,248,255,0.3)', letterSpacing:1 }}>{post.readTime} MIN</span>
                </div>
                <h2 style={{ fontFamily:HUD, fontSize:13, fontWeight:900, color:'#F0F8FF', lineHeight:1.4, margin:0 }}>{post.title}</h2>
                <p style={{ fontFamily:BODY, fontSize:13, color:'rgba(240,248,255,0.5)', lineHeight:1.6, margin:0, flex:1 }}>
                  {post.description.slice(0, 100)}...
                </p>
                <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'#00FFB2', marginTop:'auto' }}>LIRE L'ARTICLE →</div>
              </article>
            </Link>
          ))}
        </div>

        {/* Articles EN */}
        <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:3, color:'rgba(0,212,255,0.5)', marginBottom:20, paddingBottom:10, borderBottom:'1px solid rgba(0,212,255,0.08)' }}>
          🇬🇧 ARTICLES IN ENGLISH
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:20 }}>
          {enPosts.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration:'none' }}>
              <article style={{ background:'#08111F', border:'1px solid rgba(0,212,255,0.08)', borderRadius:12, padding:'1.5rem', height:'100%', cursor:'pointer', transition:'all .2s', display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color: CAT_COLORS[post.category] ?? '#00D4FF', background:`${CAT_COLORS[post.category] ?? '#00D4FF'}15`, border:`1px solid ${CAT_COLORS[post.category] ?? '#00D4FF'}30`, borderRadius:100, padding:'3px 10px' }}>
                    {post.category}
                  </span>
                  <span style={{ fontFamily:HUD, fontSize:7, color:'rgba(240,248,255,0.3)', letterSpacing:1 }}>{post.readTime} MIN</span>
                </div>
                <h2 style={{ fontFamily:HUD, fontSize:13, fontWeight:900, color:'#F0F8FF', lineHeight:1.4, margin:0 }}>{post.title}</h2>
                <p style={{ fontFamily:BODY, fontSize:13, color:'rgba(240,248,255,0.5)', lineHeight:1.6, margin:0, flex:1 }}>
                  {post.description.slice(0, 100)}...
                </p>
                <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'#00D4FF', marginTop:'auto' }}>READ ARTICLE →</div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:'4rem 2rem', textAlign:'center', maxWidth:700, margin:'0 auto' }}>
        <h2 style={{ fontFamily:HUD, fontSize:'clamp(20px,3vw,32px)', fontWeight:900, marginBottom:16 }}>
          lang === 'en' ? 'Ready to trade with ' : "Prêt à trader avec l'"<span style={{ color:'#00FFB2' }}>IA</span> ?
        </h2>
        <p style={{ fontFamily:BODY, fontSize:15, color:'rgba(240,248,255,0.5)', marginBottom:28 }}>
          {lang === 'en' ? 'Analyze your Boom 1000, Crash 500 and Forex charts in 10 seconds.' : 'Analysez vos charts Boom 1000, Crash 500 et Forex en 10 secondes.'}, Crash 500 et Forex en 10 secondes.
        </p>
        <Link href="/auth/login" style={{ fontFamily:HUD, fontSize:11, letterSpacing:2, color:'#020408', background:'#00FFB2', padding:'16px 40px', borderRadius:4, textDecoration:'none', fontWeight:700 }}>
          ESSAI GRATUIT — 10 CRÉDITS →
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.05)', padding:'2rem', textAlign:'center' }}>
        <Link href="/" style={{ fontFamily:HUD, fontSize:12, letterSpacing:2, color:'#00FFB2', textDecoration:'none' }}>PROFIT<span style={{ color:'#00D4FF' }}>YX</span></Link>
        <div style={{ fontFamily:BODY, fontSize:12, color:'rgba(240,248,255,0.2)', marginTop:8 }}>© 2026 MonWe Infinity LLC</div>
      </footer>
    </div>
  )
}
