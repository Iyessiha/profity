// ============================================================
// PROFITYX — ChartAnnotation : overlay SVG sur chart uploadé
// Réserved aux plans Pro+ (annotation) et Elite (complète)
// ============================================================
'use client'
import { useEffect, useRef, useState } from 'react'
import type { ChartSignal } from '@/types'

const HUD  = "'Orbitron', monospace"
const BODY = "'Rajdhani', sans-serif"

interface Props {
  imageFile?: File | null
  imageBase64?: string
  signal: ChartSignal
  plan?: string
}

const TYPE_COLORS: Record<string, string> = {
  entry:         '#00FFB2',
  sl:            '#FF3A5C',
  tp1:           '#00FFB2',
  tp2:           '#00D4FF',
  tp3:           '#7B61FF',
  ob_bullish:    '#00FFB2',
  ob_bearish:    '#FF3A5C',
  fvg_bullish:   '#C9A84C',
  fvg_bearish:   '#C9A84C',
  bos:           '#00D4FF',
  choch:         '#FF6B35',
  liquidity_high:'#FF3A5C',
  liquidity_low: '#00FFB2',
  premium:       'rgba(255,58,92,0.3)',
  discount:      'rgba(0,255,178,0.3)',
}

function priceToY(price: number, rangeHigh: number, rangeLow: number, height: number): number {
  if (rangeHigh <= rangeLow) return height / 2
  return ((rangeHigh - price) / (rangeHigh - rangeLow)) * height
}

export default function ChartAnnotation({ imageFile, imageBase64, signal, plan = 'free' }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const [imgUrl,   setImgUrl]   = useState<string | null>(null)
  const [showAnnot,setShowAnnot]= useState(true)
  const [loaded,   setLoaded]   = useState(false)
  const [dims,     setDims]     = useState({ w: 0, h: 0 })

  // Créer l'URL de l'image
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile)
      setImgUrl(url)
      return () => URL.revokeObjectURL(url)
    } else if (imageBase64) {
      setImgUrl(`data:image/jpeg;base64,${imageBase64}`)
    }
  }, [imageFile, imageBase64])

  // Charger l'image et dessiner sur canvas
  useEffect(() => {
    if (!imgUrl || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      // Dimensions adaptées à l'écran mobile
      const maxW = Math.min(window.innerWidth - 32, 640)
      const ratio = img.height / img.width
      const w = maxW
      const h = Math.round(w * ratio)

      canvas.width  = w
      canvas.height = h
      setDims({ w, h })

      // Dessiner l'image
      ctx.drawImage(img, 0, 0, w, h)
      setLoaded(true)
    }
    img.src = imgUrl
  }, [imgUrl])

  // Dessiner les annotations SVG en overlay
  const chartRange = signal.chart_range
  const annotations = signal.annotations ?? []

  // Construire des annotations depuis les niveaux du signal si pas d'annotations explicites
  const effectiveAnnotations = annotations.length > 0 ? annotations : (() => {
    if (!chartRange || chartRange.high <= chartRange.low) return []
    const list: typeof annotations = []
    if (signal.entry)     list.push({ type:'entry', price:signal.entry,     label:'ENTRÉE', color:'#00FFB2', style:'solid' })
    if (signal.stop_loss) list.push({ type:'sl',    price:signal.stop_loss, label:'STOP',   color:'#FF3A5C', style:'solid' })
    if (signal.tp1)       list.push({ type:'tp1',   price:signal.tp1,       label:'TP1',    color:'#00FFB2', style:'dashed' })
    if (signal.tp2)       list.push({ type:'tp2',   price:signal.tp2!,      label:'TP2',    color:'#00D4FF', style:'dashed' })
    if (signal.tp3)       list.push({ type:'tp3',   price:signal.tp3!,      label:'TP3',    color:'#7B61FF', style:'dashed' })
    if (signal.order_block) {
      list.push({ type: signal.direction === 'LONG' ? 'ob_bullish' : 'ob_bearish',
        price:signal.order_block.low, label:signal.order_block.label||'OB',
        color: signal.direction==='LONG'?'#00FFB2':'#FF3A5C', style:'zone', zone_end:signal.order_block.high })
    }
    if (signal.fvg) {
      list.push({ type:'fvg_bullish', price:signal.fvg.low, label:signal.fvg.label||'FVG',
        color:'#C9A84C', style:'zone', zone_end:signal.fvg.high })
    }
    if (signal.bos_level)   list.push({ type:'bos',  price:signal.bos_level,  label:'BOS',  color:'#00D4FF', style:'dashed' })
    if (signal.choch_level) list.push({ type:'choch', price:signal.choch_level,label:'CHOCH',color:'#FF6B35', style:'dashed' })
    if (signal.liquidity_high) list.push({ type:'liquidity_high', price:signal.liquidity_high, label:'BSL', color:'#FF3A5C', style:'dashed' })
    if (signal.liquidity_low)  list.push({ type:'liquidity_low',  price:signal.liquidity_low,  label:'SSL', color:'#00FFB2', style:'dashed' })
    return list
  })()

  const range = chartRange ?? (() => {
    // Estimer le range depuis les prix du signal
    const prices = [signal.entry, signal.stop_loss, signal.tp1, signal.tp2, signal.tp3]
      .filter((p): p is number => p != null && p > 0)
    if (!prices.length) return null
    const margin = (Math.max(...prices) - Math.min(...prices)) * 0.3
    return { high: Math.max(...prices) + margin, low: Math.min(...prices) - margin }
  })()

  if (!imgUrl) return null

  return (
    <div style={{ position:'relative', borderRadius:10, overflow:'hidden', background:'#020408' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'8px 12px', background:'rgba(0,255,178,0.06)', borderBottom:'1px solid rgba(0,255,178,0.1)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#00FFB2' }} />
          <span style={{ fontFamily:HUD, fontSize:8, letterSpacing:2, color:'#00FFB2' }}>
            CHART ANNOTÉ · {signal.pair} {signal.timeframe}
          </span>
        </div>
        <button onClick={() => setShowAnnot(v => !v)}
          style={{ fontFamily:HUD, fontSize:7, letterSpacing:1, padding:'3px 10px', borderRadius:4,
            border:'1px solid rgba(0,255,178,0.2)', background:'transparent', color:'rgba(0,255,178,0.6)', cursor:'pointer' }}>
          {showAnnot ? '👁 MASQUER' : '👁 AFFICHER'}
        </button>
      </div>

      {/* Image + Overlay SVG */}
      <div style={{ position:'relative', lineHeight:0 }}>
        {/* Canvas pour l'image */}
        <canvas ref={canvasRef}
          style={{ width:'100%', display:'block', maxHeight:400, objectFit:'contain' }} />

        {/* SVG overlay — tracés courts ancrés à droite, rendu pro */}
        {loaded && showAnnot && range && dims.w > 0 && (() => {
          const fmt = (p: number) => p.toFixed(p > 100 ? 2 : 5)
          const TAG_H  = 13
          const STRUCT = new Set(['bos', 'choch', 'liquidity_high', 'liquidity_low'])

          const zones = effectiveAnnotations.filter(a => a.style === 'zone' && a.zone_end != null)
          const lines = effectiveAnnotations.filter(a => !(a.style === 'zone' && a.zone_end != null))

          // Niveaux : position Y + tag prix avec anti-chevauchement vertical
          const items = lines
            .map(ann => ({ ann, y: priceToY(ann.price, range.high, range.low, dims.h) }))
            .filter(it => it.y >= 0 && it.y <= dims.h)
            .sort((a, b) => a.y - b.y)
            .map(it => ({ ...it, tagY: Math.max(TAG_H / 2 + 2, Math.min(dims.h - TAG_H / 2 - 2, it.y)) }))
          for (let i = 1; i < items.length; i++) {
            if (items[i].tagY - items[i - 1].tagY < TAG_H + 1) items[i].tagY = items[i - 1].tagY + TAG_H + 1
          }

          return (
            <svg
              viewBox={`0 0 ${dims.w} ${dims.h}`}
              style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none' }}
              preserveAspectRatio="none"
            >
              {/* Zones OB / FVG : boîtes compactes sur la moitié droite */}
              {zones.map((ann, i) => {
                const yA = priceToY(ann.price, range.high, range.low, dims.h)
                const yB = priceToY(ann.zone_end!, range.high, range.low, dims.h)
                const yTop = Math.max(0, Math.min(yA, yB))
                const yBot = Math.min(dims.h, Math.max(yA, yB))
                if (yBot <= 0 || yTop >= dims.h) return null
                const color = ann.color || TYPE_COLORS[ann.type] || '#00FFB2'
                const x0 = dims.w * 0.52
                const zw = dims.w * 0.465
                const tall = yBot - yTop >= 12
                return (
                  <g key={`z${i}`}>
                    <rect x={x0} y={yTop} width={zw} height={Math.max(yBot - yTop, 1.5)} rx={2}
                      fill={color} fillOpacity={0.10} stroke={color} strokeWidth={0.8} strokeOpacity={0.4} />
                    <text x={x0 + 5} y={tall ? (yTop + yBot) / 2 : Math.max(yTop - 4, 7)}
                      fill={color} fontSize={7} fontFamily="Orbitron, monospace"
                      dominantBaseline={tall ? 'middle' : 'auto'} opacity={0.85} letterSpacing={0.5}>
                      {ann.label}
                    </text>
                  </g>
                )
              })}

              {/* Niveaux : segment court + tag prix aligné à droite */}
              {items.map(({ ann, y, tagY }, i) => {
                const color    = ann.color || TYPE_COLORS[ann.type] || '#00FFB2'
                const isStruct = STRUCT.has(ann.type)
                const xStart   = dims.w * (isStruct ? 0.68 : 0.55)
                const text     = `${ann.label} ${fmt(ann.price)}`
                const tagW     = text.length * 5 + 10
                const tagX     = dims.w - tagW - 3
                const dash     = ann.style === 'dashed' ? (isStruct ? '2,3' : '5,3') : undefined
                return (
                  <g key={i}>
                    <circle cx={xStart} cy={y} r={1.6} fill={color} fillOpacity={isStruct ? 0.55 : 0.9} />
                    <line x1={xStart} y1={y} x2={tagX - 4} y2={y}
                      stroke={color} strokeWidth={isStruct ? 0.8 : 1.1}
                      strokeOpacity={isStruct ? 0.55 : 0.85}
                      strokeDasharray={dash} strokeLinecap="round" />
                    {Math.abs(tagY - y) > 1 && (
                      <line x1={tagX - 4} y1={y} x2={tagX} y2={tagY}
                        stroke={color} strokeWidth={0.6} strokeOpacity={0.35} />
                    )}
                    <rect x={tagX} y={tagY - TAG_H / 2} width={tagW} height={TAG_H} rx={2.5}
                      fill="rgba(2,4,8,0.88)" stroke={color} strokeWidth={0.7} strokeOpacity={0.8} />
                    <text x={tagX + tagW / 2} y={tagY + 0.5} textAnchor="middle" dominantBaseline="middle"
                      fill={color} fontSize={7.5} fontFamily="Orbitron, monospace" letterSpacing={0.3}>
                      {text}
                    </text>
                  </g>
                )
              })}
            </svg>
          )
        })()}
      </div>

      {/* Légende */}
      {loaded && showAnnot && effectiveAnnotations.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, padding:'8px 10px',
          background:'rgba(0,0,0,0.4)', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          {effectiveAnnotations.slice(0, 8).map((ann, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:12, height:2, background:ann.color || TYPE_COLORS[ann.type] || '#00FFB2',
                display:'inline-block', borderRadius:1 }} />
              <span style={{ fontFamily:HUD, fontSize:6, letterSpacing:1,
                color:'rgba(232,244,248,0.5)' }}>{ann.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Badge plan requis si non Elite */}
      {plan === 'pro' && !chartRange && (
        <div style={{ padding:'6px 12px', background:'rgba(201,168,76,0.06)',
          fontFamily:HUD, fontSize:7, letterSpacing:1, color:'#C9A84C', textAlign:'center' }}>
          ⭐ ELITE — Annotations précises basées sur les zones réelles détectées par l'IA
        </div>
      )}
    </div>
  )
}
