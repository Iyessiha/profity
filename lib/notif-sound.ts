// ============================================================
// PROFITYX — Notification sounds (Web Audio API)
// Aucun fichier audio — tout généré en temps réel
// ============================================================

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx || ctx.state === 'closed') {
    ctx = new AudioContext()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function beep(
  frequency: number,
  duration:  number,
  volume:    number,
  type:      OscillatorType = 'sine',
  startAt:   number = 0,
): void {
  const ac  = getCtx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.connect(gain)
  gain.connect(ac.destination)

  osc.type      = type
  osc.frequency.setValueAtTime(frequency, ac.currentTime + startAt)

  gain.gain.setValueAtTime(0, ac.currentTime + startAt)
  gain.gain.linearRampToValueAtTime(volume, ac.currentTime + startAt + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + startAt + duration)

  osc.start(ac.currentTime + startAt)
  osc.stop(ac.currentTime + startAt + duration + 0.05)
}

// ── Sons par priorité ──────────────────────────────────────

/** Notification normale : bip doux montant */
export function playNormal() {
  beep(520, 0.12, 0.25, 'sine', 0)
  beep(780, 0.12, 0.2,  'sine', 0.14)
}

/** Notification haute priorité : double bip net */
export function playHigh() {
  beep(700, 0.1, 0.35, 'sine', 0)
  beep(700, 0.1, 0.35, 'sine', 0.15)
  beep(950, 0.15, 0.3, 'sine', 0.30)
}

/** Notification urgente : triple alarme */
export function playUrgent() {
  beep(880, 0.08, 0.45, 'square', 0)
  beep(880, 0.08, 0.45, 'square', 0.12)
  beep(1100, 0.12, 0.4, 'square', 0.24)
}

/** Son selon la priorité de la notif */
export function playForPriority(priority: string) {
  try {
    if (priority === 'urgent') playUrgent()
    else if (priority === 'high') playHigh()
    else playNormal()
  } catch {
    // Navigateurs sans Web Audio API — silencieux
  }
}

/** Vérifier si le son est activé (localStorage) */
export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('px_notif_sound') !== 'off'
}

/** Activer / désactiver */
export function toggleSound(): boolean {
  const next = !isSoundEnabled()
  localStorage.setItem('px_notif_sound', next ? 'on' : 'off')
  return next
}

// ── Sons dédiés à l'analyse de chart ─────────────────────

/** Son de démarrage analyse — scan initié */
export function playAnalysisStart() {
  try {
    const ac = getCtx()
    // Bip montant rapide × 2 (type "scanner")
    beep(300, 0.06, 0.18, 'sine', 0)
    beep(500, 0.06, 0.18, 'sine', 0.08)
    beep(700, 0.10, 0.15, 'sine', 0.16)
  } catch {}
}

/** Son de résultat — signal reçu (fanfare courte) */
export function playAnalysisComplete() {
  try {
    const ac = getCtx()
    // Accord montant satisfaisant
    beep(523, 0.10, 0.3, 'sine', 0)      // Do5
    beep(659, 0.10, 0.3, 'sine', 0.12)   // Mi5
    beep(784, 0.10, 0.3, 'sine', 0.24)   // Sol5
    beep(1047, 0.20, 0.25, 'sine', 0.36) // Do6 — note finale tenue
  } catch {}
}
