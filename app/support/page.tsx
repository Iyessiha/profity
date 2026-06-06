'use client'
export const dynamic = 'force-dynamic'
import { useTheme } from '@/lib/theme'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

export default function SupportPage() {
  const { toggleTheme, theme } = useTheme()
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg0)', color:'var(--tx0)', fontFamily:BODY, display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <header style={{ background:'var(--bg1)', borderBottom:'1px solid var(--bd)', padding:'0 1.5rem', height:60, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
        <a href="/dashboard" style={{ fontFamily:HUD, fontSize:18, letterSpacing:4, color:'var(--ac)', textDecoration:'none' }}>
          PROFIT<span style={{ color:'var(--ac2)' }}>YX</span>
        </a>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={toggleTheme} style={{ width:36,height:36,borderRadius:8,border:'1px solid var(--bd1)',background:'var(--bg2)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:theme==='dark'?'#C9A84C':'#0EA5E9' }}>
            <i className={'ti '+(theme==='dark'?'ti-sun':'ti-moon')} style={{ fontSize:16 }} />
          </button>
          <a href="/dashboard" style={{ fontFamily:HUD, fontSize:9, letterSpacing:2, color:'var(--tx2)', padding:'0 14px', display:'flex', alignItems:'center', textDecoration:'none', border:'1px solid var(--bd)', borderRadius:4 }}>← RETOUR</a>
        </div>
      </header>

      <main style={{ flex:1, maxWidth:700, margin:'0 auto', padding:'3rem 1.5rem', width:'100%' }}>
        {/* Titre */}
        <div style={{ textAlign:'center', marginBottom:'3rem' }}>
          <div style={{ width:80, height:80, borderRadius:'50%', background:'color-mix(in srgb, var(--ac) 12%, transparent)', border:'2px solid color-mix(in srgb, var(--ac) 30%, transparent)', margin:'0 auto 1.5rem', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className="ti ti-headset" style={{ fontSize:38, color:'var(--ac)' }} />
          </div>
          <h1 style={{ fontFamily:HUD, fontSize:'clamp(22px,5vw,36px)', fontWeight:900, color:'var(--tx0)', marginBottom:12 }}>
            ASSISTANCE <span style={{ color:'var(--ac)' }}>PROFITYX</span>
          </h1>
          <p style={{ fontSize:16, color:'var(--tx2)', lineHeight:1.7 }}>
            Notre équipe est disponible pour vous aider à utiliser ProfityX, résoudre vos problèmes techniques, ou répondre à vos questions sur nos abonnements.
          </p>
        </div>

        {/* WhatsApp CTA */}
        <div style={{ background:'linear-gradient(135deg, #25D366, #128C7E)', borderRadius:16, padding:'2rem', textAlign:'center', marginBottom:'2rem', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at top right, rgba(255,255,255,0.1), transparent 60%)', pointerEvents:'none' }} />
          <i className="ti ti-brand-whatsapp" style={{ fontSize:48, color:'#fff', marginBottom:12, display:'block' }} />
          <div style={{ fontFamily:HUD, fontSize:16, color:'#fff', letterSpacing:1, marginBottom:8 }}>SUPPORT WHATSAPP</div>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.8)', marginBottom:'1.5rem', lineHeight:1.6 }}>
            Discutez directement avec notre équipe. Réponse rapide en français, anglais et autres langues.
          </p>
          <a href="https://wa.me/+2250500446464" target="_blank" rel="noopener noreferrer"
            style={{ display:'inline-flex', alignItems:'center', gap:10, background:'#fff', color:'#25D366', fontFamily:HUD, fontSize:11, letterSpacing:2, fontWeight:700, padding:'14px 28px', borderRadius:8, textDecoration:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}>
            <i className="ti ti-brand-whatsapp" style={{ fontSize:20 }} />
            CONTACTER SUR WHATSAPP
          </a>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.6)', marginTop:12 }}>+225 0500 44 64 64 · Lun–Sam 8h–20h GMT</p>
        </div>

        {/* Autres options */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:14, marginBottom:'2rem' }}>
          {[
            { icon:'ti-mail', title:'Email', desc:'monweci@gmail.com', action:'mailto:monweci@gmail.com', label:'Envoyer un email', color:'#00D4FF' },
            { icon:'ti-link', title:'Linktree', desc:'Coach Yessiha', action:'https://linktr.ee/coachyessiha', label:'Voir les liens', color:'#39E09B' },
            { icon:'ti-book', title:'Documentation', desc:'FAQ & guides', action:'/legal/cgu', label:'Consulter', color:'var(--ac3)' },
          ].map(o => (
            <a key={o.title} href={o.action} target={o.action.startsWith('http')?'_blank':undefined} rel="noopener noreferrer"
              style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.25rem', textDecoration:'none', display:'flex', flexDirection:'column', gap:10 }}>
              <i className={'ti '+o.icon} style={{ fontSize:26, color:o.color }} />
              <div>
                <div style={{ fontFamily:HUD, fontSize:11, color:'var(--tx0)', letterSpacing:1, marginBottom:4 }}>{o.title}</div>
                <div style={{ fontFamily:BODY, fontSize:13, color:'var(--tx2)' }}>{o.desc}</div>
              </div>
              <span style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:o.color as string }}>{o.label} →</span>
            </a>
          ))}
        </div>

        {/* FAQ rapide */}
        <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:10, padding:'1.5rem' }}>
          <div style={{ fontFamily:HUD, fontSize:10, letterSpacing:2, color:'var(--tx3)', marginBottom:'1rem' }}>FAQ RAPIDE</div>
          {[
            ['Comment fonctionne l\'analyse IA ?', 'Uploadez un screenshot de votre chart. L\'IA l\'analyse et vous donne Entrée, Stop Loss et Take Profit en quelques secondes.'],
            ['Comment upgrader mon plan ?', 'Allez dans Paramètres → Abonnement, ou cliquez sur "Passer Pro" dans le dashboard.'],
            ['Mes quotas ne se sont pas renouvelés', 'Les quotas se renouvellent le 1er de chaque mois. Si le problème persiste, contactez-nous sur WhatsApp.'],
            ['Comment activer les notifications push ?', 'Paramètres → Notifications → Activer les alertes. Autorisez les notifications dans votre navigateur.'],
          ].map(([q, r]) => (
            <details key={q as string} style={{ borderBottom:'1px solid var(--bd)', paddingBottom:'0.75rem', marginBottom:'0.75rem' }}>
              <summary style={{ fontFamily:HUD, fontSize:10, letterSpacing:1, color:'var(--tx0)', cursor:'pointer', userSelect:'none' }}>{q}</summary>
              <p style={{ fontFamily:BODY, fontSize:14, color:'var(--tx2)', lineHeight:1.6, marginTop:8, paddingLeft:8 }}>{r}</p>
            </details>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background:'var(--bg1)', borderTop:'1px solid var(--bd)', padding:'1.5rem', textAlign:'center' }}>
        <p style={{ fontFamily:HUD, fontSize:8, letterSpacing:1, color:'var(--tx3)' }}>© 2026 MonWe Infinity LLC · Albuquerque, NM, USA · EIN 38-4396094</p>
      </footer>
    </div>
  )
}
