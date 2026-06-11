import { POSTS, getPostBySlug } from '@/lib/blog-posts'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'

// Génération statique de toutes les pages
export async function generateStaticParams() {
  return POSTS.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = getPostBySlug(params.slug)
  if (!post) return {}
  return {
    title: `${post.title} | ProfityX Blog`,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `https://profity-x.com/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://profity-x.com/blog/${post.slug}`,
      siteName: 'ProfityX',
      type: 'article',
      publishedTime: post.date,
      authors: ['ProfityX — MonWe Infinity LLC'],
      tags: post.keywords,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  }
}

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

function renderContent(content: string) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let key = 0

  for (const line of lines) {
    const l = line.trim()
    if (!l) { elements.push(<br key={key++} />); continue }

    if (l.startsWith('## ')) {
      elements.push(
        <h2 key={key++} style={{ fontFamily:HUD, fontSize:'clamp(16px,2.5vw,22px)', fontWeight:900, color:'#F0F8FF', marginTop:40, marginBottom:16, letterSpacing:0.5 }}>
          {l.replace('## ','')}
        </h2>
      )
    } else if (l.startsWith('### ')) {
      elements.push(
        <h3 key={key++} style={{ fontFamily:HUD, fontSize:14, fontWeight:700, color:'#00FFB2', marginTop:28, marginBottom:12, letterSpacing:1 }}>
          {l.replace('### ','')}
        </h3>
      )
    } else if (l.startsWith('**') && l.endsWith('**') && l.length > 4) {
      elements.push(
        <p key={key++} style={{ fontFamily:BODY, fontSize:16, fontWeight:700, color:'#F0F8FF', marginBottom:8 }}>
          {l.replace(/\*\*/g,'')}
        </p>
      )
    } else if (l.startsWith('- ') || l.startsWith('* ')) {
      elements.push(
        <div key={key++} style={{ display:'flex', gap:10, marginBottom:6, paddingLeft:8 }}>
          <span style={{ color:'#00FFB2', flexShrink:0, marginTop:2 }}>▸</span>
          <span style={{ fontFamily:BODY, fontSize:15, color:'rgba(240,248,255,0.75)', lineHeight:1.7 }}>
            {l.replace(/^[-*] /, '').replace(/\*\*(.*?)\*\*/g, '$1')}
          </span>
        </div>
      )
    } else if (l.startsWith('| ')) {
      // Table simple
      elements.push(
        <div key={key++} style={{ overflowX:'auto', margin:'16px 0' }}>
          <div style={{ fontFamily:BODY, fontSize:13, color:'rgba(240,248,255,0.6)', background:'rgba(0,255,178,0.04)', border:'1px solid rgba(0,255,178,0.1)', borderRadius:6, padding:'10px 14px' }}>
            {l.replace(/\|/g,' · ').trim()}
          </div>
        </div>
      )
    } else {
      // Paragraphe normal — inline bold
      const parts = l.split(/(\*\*.*?\*\*)/)
      elements.push(
        <p key={key++} style={{ fontFamily:BODY, fontSize:16, color:'rgba(240,248,255,0.72)', lineHeight:1.8, marginBottom:12 }}>
          {parts.map((part, i) =>
            part.startsWith('**') && part.endsWith('**')
              ? <strong key={i} style={{ color:'#F0F8FF', fontWeight:700 }}>{part.replace(/\*\*/g,'')}</strong>
              : part
          )}
        </p>
      )
    }
  }
  return elements
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug)
  if (!post) notFound()

  const related = POSTS.filter(p => p.slug !== post.slug && p.lang === post.lang).slice(0, 3)
  const cta    = post.lang === 'en' ? '/en' : '/'
  const ctaTxt = post.lang === 'en' ? 'START FREE — 10 CREDITS' : 'ESSAI GRATUIT — 10 CRÉDITS'

  // JSON-LD Article
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    keywords: post.keywords.join(', '),
    datePublished: post.date,
    author: { '@type': 'Organization', name: 'ProfityX — MonWe Infinity LLC', url: 'https://profity-x.com' },
    publisher: { '@type': 'Organization', name: 'ProfityX', url: 'https://profity-x.com' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://profity-x.com/blog/${post.slug}` },
  }

  return (
    <>
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div style={{ minHeight:'100vh', background:'#020408', color:'#F0F8FF', fontFamily:BODY }}>
        {/* Nav */}
        <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(2,4,8,0.95)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(0,255,178,0.07)', padding:'0 1.5rem', height:60, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Link href="/" style={{ fontFamily:HUD, fontSize:16, fontWeight:900, letterSpacing:2, color:'#00FFB2', textDecoration:'none' }}>
            <img src="/logos/profityx-logo.png" alt="ProfityX" style={{ height:28, width:'auto', objectFit:'contain' }} />
          </Link>
          <div style={{ display:'flex', gap:16, alignItems:'center' }}>
            <Link href="/blog" style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'rgba(240,248,255,0.45)', textDecoration:'none' }}>BLOG</Link>
            <Link href="/auth/login" style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'#020408', background:'#00FFB2', padding:'8px 16px', borderRadius:4, textDecoration:'none', fontWeight:700 }}>
              {post.lang === 'en' ? 'FREE TRIAL' : 'ESSAI GRATUIT'}
            </Link>
          </div>
        </nav>

        {/* Article */}
        <article style={{ maxWidth:780, margin:'0 auto', padding:'3rem 1.5rem 4rem' }}>
          {/* Breadcrumb */}
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:28, fontFamily:HUD, fontSize:8, letterSpacing:2 }}>
            <Link href="/" style={{ color:'rgba(240,248,255,0.35)', textDecoration:'none' }}>HOME</Link>
            <span style={{ color:'rgba(240,248,255,0.2)' }}>›</span>
            <Link href="/blog" style={{ color:'rgba(240,248,255,0.35)', textDecoration:'none' }}>BLOG</Link>
            <span style={{ color:'rgba(240,248,255,0.2)' }}>›</span>
            <span style={{ color:'rgba(0,255,178,0.6)' }}>{post.category.toUpperCase()}</span>
          </div>

          {/* Header */}
          <header style={{ marginBottom:40 }}>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:16 }}>
              <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'#00FFB2', background:'rgba(0,255,178,0.08)', border:'1px solid rgba(0,255,178,0.2)', borderRadius:100, padding:'4px 12px' }}>{post.category.toUpperCase()}</span>
              <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'rgba(240,248,255,0.35)', background:'rgba(255,255,255,0.04)', borderRadius:100, padding:'4px 12px' }}>{post.readTime} MIN READ</span>
              <span style={{ fontFamily:HUD, fontSize:7, letterSpacing:2, color:'rgba(240,248,255,0.35)', background:'rgba(255,255,255,0.04)', borderRadius:100, padding:'4px 12px' }}>{new Date(post.date).toLocaleDateString(post.lang === 'fr' ? 'fr-FR' : 'en-GB', { day:'numeric', month:'long', year:'numeric' })}</span>
            </div>
            <h1 style={{ fontFamily:HUD, fontSize:'clamp(20px,3.5vw,34px)', fontWeight:900, lineHeight:1.2, letterSpacing:0.5, marginBottom:16 }}>
              {post.title}
            </h1>
            <p style={{ fontFamily:BODY, fontSize:17, color:'rgba(240,248,255,0.55)', lineHeight:1.7 }}>
              {post.description}
            </p>
          </header>

          {/* CTA box */}
          <div style={{ background:'rgba(0,255,178,0.04)', border:'1px solid rgba(0,255,178,0.15)', borderRadius:10, padding:'1.25rem 1.5rem', marginBottom:40, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontFamily:HUD, fontSize:9, color:'#00FFB2', letterSpacing:2, marginBottom:4 }}>
                {post.lang === 'en' ? '🤖 ANALYZE YOUR CHARTS WITH AI' : '🤖 ANALYSEZ VOS CHARTS AVEC L\'IA'}
              </div>
              <div style={{ fontFamily:BODY, fontSize:13, color:'rgba(240,248,255,0.5)' }}>
                {post.lang === 'en' ? 'Entry · Stop Loss · Take Profit in 10 seconds' : 'Entrée · Stop Loss · Take Profit en 10 secondes'}
              </div>
            </div>
            <Link href="/auth/login" style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'#020408', background:'#00FFB2', padding:'10px 20px', borderRadius:4, textDecoration:'none', fontWeight:700, whiteSpace:'nowrap' }}>
              {ctaTxt}
            </Link>
          </div>

          {/* Contenu */}
          <div style={{ lineHeight:1.8 }}>
            {renderContent(post.content)}
          </div>

          {/* CTA final */}
          <div style={{ marginTop:56, background:'linear-gradient(135deg,rgba(0,255,178,0.05),rgba(0,212,255,0.03))', border:'1px solid rgba(0,255,178,0.2)', borderRadius:14, padding:'2.5rem', textAlign:'center' }}>
            <div style={{ fontFamily:HUD, fontSize:20, fontWeight:900, color:'#00FFB2', marginBottom:12 }}>
              <img src="/logos/profityx-logo.png" alt="ProfityX" style={{ height:28, width:'auto', objectFit:'contain' }} />
            </div>
            <p style={{ fontFamily:BODY, fontSize:16, color:'rgba(240,248,255,0.6)', marginBottom:24, maxWidth:500, margin:'0 auto 24px' }}>
              {post.lang === 'en'
                ? 'Stop analyzing manually. Get your SMC signal in 10 seconds with AI. 10 free credits, no card needed.'
                : 'Arrêtez d\'analyser manuellement. Obtenez votre signal SMC en 10 secondes avec l\'IA. 10 crédits gratuits, sans carte bancaire.'}
            </p>
            <Link href="/auth/login" style={{ fontFamily:HUD, fontSize:10, letterSpacing:2, color:'#020408', background:'#00FFB2', padding:'14px 36px', borderRadius:4, textDecoration:'none', fontWeight:700, boxShadow:'0 0 30px rgba(0,255,178,0.25)' }}>
              {ctaTxt} →
            </Link>
          </div>

          {/* Articles liés */}
          {related.length > 0 && (
            <div style={{ marginTop:56 }}>
              <div style={{ fontFamily:HUD, fontSize:9, letterSpacing:3, color:'rgba(0,255,178,0.5)', marginBottom:20 }}>
                {post.lang === 'en' ? 'RELATED ARTICLES' : 'ARTICLES LIÉS'}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:16 }}>
                {related.map(r => (
                  <Link key={r.slug} href={`/blog/${r.slug}`} style={{ textDecoration:'none' }}>
                    <div style={{ background:'#08111F', border:'1px solid rgba(0,255,178,0.07)', borderRadius:10, padding:'1.25rem', cursor:'pointer' }}>
                      <div style={{ fontFamily:HUD, fontSize:11, color:'#F0F8FF', lineHeight:1.4, marginBottom:8 }}>{r.title}</div>
                      <div style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'#00FFB2' }}>{r.readTime} MIN →</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Footer */}
        <footer style={{ borderTop:'1px solid rgba(255,255,255,0.05)', padding:'2rem', textAlign:'center' }}>
          <Link href="/" style={{ fontFamily:HUD, fontSize:12, letterSpacing:2, color:'#00FFB2', textDecoration:'none' }}>
            <img src="/logos/profityx-logo.png" alt="ProfityX" style={{ height:28, width:'auto', objectFit:'contain' }} />
          </Link>
          <div style={{ fontFamily:BODY, fontSize:12, color:'rgba(240,248,255,0.2)', marginTop:8 }}>© 2026 MonWe Infinity LLC</div>
        </footer>
      </div>
    </>
  )
}
