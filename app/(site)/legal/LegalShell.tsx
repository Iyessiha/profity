'use client'
import React from 'react'

const HUD = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

export default function LegalShell({ title, updated, children }: {
  title: string; updated: string; children: React.ReactNode
}) {
  return (
    <div style={{ minHeight: '100vh', background: '#020408', color: '#E8F4F8', fontFamily: BODY }}>
      <nav style={{ borderBottom: '1px solid rgba(0,255,178,0.08)', padding: '0 2rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ fontFamily: HUD, fontSize: 18, letterSpacing: 4, color: '#00FFB2', textDecoration: 'none' }}>
          PROFIT<span style={{ color: '#00D4FF' }}>YX</span>
        </a>
        <a href="/" style={{ fontFamily: HUD, fontSize: 9, letterSpacing: 2, color: 'rgba(232,244,248,0.4)', textDecoration: 'none' }}>← ACCUEIL</a>
      </nav>

      <article style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 2rem 5rem' }}>
        <h1 style={{ fontFamily: HUD, fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, letterSpacing: 1, marginBottom: 8 }}>{title}</h1>
        <p style={{ fontSize: 13, color: 'rgba(232,244,248,0.35)', marginBottom: '2.5rem' }}>Dernière mise à jour : {updated}</p>
        <div style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(232,244,248,0.7)', fontWeight: 300 }}>
          {children}
        </div>
      </article>

      <footer style={{ borderTop: '1px solid rgba(0,255,178,0.06)', padding: '2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          <a href="/legal/cgu" style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 1, color: 'rgba(232,244,248,0.4)', textDecoration: 'none' }}>CGU</a>
          <a href="/legal/confidentialite" style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 1, color: 'rgba(232,244,248,0.4)', textDecoration: 'none' }}>CONFIDENTIALITÉ</a>
          <a href="/legal/mentions" style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 1, color: 'rgba(232,244,248,0.4)', textDecoration: 'none' }}>MENTIONS LÉGALES</a>
        </div>
        <p style={{ fontFamily: HUD, fontSize: 8, letterSpacing: 1, color: 'rgba(232,244,248,0.2)' }}>© 2026 MonWe Infinity LLC</p>
      </footer>
    </div>
  )
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontFamily: HUD, fontSize: 16, letterSpacing: 1, color: '#00FFB2', margin: '2rem 0 0.75rem' }}>{children}</h2>
}
