// ============================================================
// PROFITYX — Rate limiter simple en mémoire (Edge-compatible)
// ============================================================
const store = new Map<string, { count:number; reset:number }>()

interface RateLimitConfig {
  limit: number       // max requêtes
  window: number      // fenêtre en secondes
}

export function rateLimit(key: string, config: RateLimitConfig): { ok:boolean; remaining:number; reset:number } {
  const now = Date.now()
  const windowMs = config.window * 1000
  const entry = store.get(key)

  if (!entry || now > entry.reset) {
    store.set(key, { count:1, reset: now + windowMs })
    return { ok:true, remaining: config.limit - 1, reset: now + windowMs }
  }

  if (entry.count >= config.limit) {
    return { ok:false, remaining:0, reset: entry.reset }
  }

  entry.count++
  return { ok:true, remaining: config.limit - entry.count, reset: entry.reset }
}

// Nettoyage automatique toutes les 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    store.forEach((v, k) => { if (now > v.reset) store.delete(k) })
  }, 5 * 60 * 1000)
}
