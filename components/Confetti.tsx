'use client'
import { useEffect, useRef } from 'react'

export default function Confetti({ duration = 4000 }: { duration?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return
    const colors = ['#00FFB2','#00D4FF','#C9A84C','#FF3A5C','#E8F4F8']
    const pieces = Array.from({ length: 60 }, (_, i) => {
      const el = document.createElement('div')
      const size = 6 + Math.random() * 8
      el.style.cssText = `
        position:fixed; pointer-events:none; z-index:9999;
        width:${size}px; height:${size}px;
        background:${colors[i % colors.length]};
        border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
        left:${Math.random() * 100}vw;
        top:-10px;
        opacity:1;
        animation: confettiFall ${1.5 + Math.random() * 2}s ${Math.random() * 1}s linear forwards;
      `
      container.appendChild(el)
      return el
    })
    const style = document.createElement('style')
    style.textContent = `@keyframes confettiFall { to { transform: translateY(110vh) rotate(${360 + Math.random()*360}deg); opacity:0; } }`
    document.head.appendChild(style)
    const timer = setTimeout(() => {
      pieces.forEach(p => p.remove())
      style.remove()
    }, duration)
    return () => { clearTimeout(timer); pieces.forEach(p => p.remove()); style.remove() }
  }, [duration])

  return <div ref={ref} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:9999 }} />
}
