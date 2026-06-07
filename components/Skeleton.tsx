// ============================================================
// PROFITYX — Skeleton loaders
// ============================================================
'use client'

export function SkeletonCard({ height = 80 }: { height?: number }) {
  return (
    <div style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:10, height, overflow:'hidden', position:'relative' }}>
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite' }} />
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </div>
  )
}

export function SkeletonText({ width = '100%', height = 14 }: { width?: string | number; height?: number }) {
  return (
    <div style={{ width, height, background:'var(--bd)', borderRadius:4, overflow:'hidden', position:'relative' }}>
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite' }} />
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {/* Stats grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10 }}>
        {[...Array(4)].map((_,i) => <SkeletonCard key={i} height={90} />)}
      </div>
      {/* Modules */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:12 }}>
        {[...Array(3)].map((_,i) => <SkeletonCard key={i} height={110} />)}
      </div>
      {/* Cards */}
      {[...Array(3)].map((_,i) => <SkeletonCard key={i} height={160} />)}
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {[...Array(rows)].map((_,i) => (
        <div key={i} style={{ background:'var(--bg1)', border:'1px solid var(--bd)', borderRadius:8, padding:'12px 16px', display:'flex', gap:12, alignItems:'center' }}>
          <SkeletonText width={120} height={12} />
          <SkeletonText width={60} height={12} />
          <SkeletonText width={80} height={12} />
          <SkeletonText width={100} height={12} />
        </div>
      ))}
    </div>
  )
}
