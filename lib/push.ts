// ============================================================
// PROFITYX — lib/push.ts
// Gestion des notifications push Web (VAPID)
// Côté client uniquement
// ============================================================

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

// ─── Enregistrer le Service Worker ────────────────────────
export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null
  if (!('serviceWorker' in navigator))  return null
  if (!('PushManager'   in window))     return null

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    console.log('[Push] SW enregistré:', reg.scope)
    return reg
  } catch (err) {
    console.error('[Push] Erreur enregistrement SW:', err)
    return null
  }
}

// ─── Demander la permission ────────────────────────────────
export async function requestPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined') return 'denied'
  if (!('Notification' in window))   return 'denied'

  if (Notification.permission === 'granted')  return 'granted'
  if (Notification.permission === 'denied')   return 'denied'

  return await Notification.requestPermission()
}

// ─── Souscrire aux push (génère un PushSubscription) ──────
export async function subscribeToPush(reg: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  try {
    // Vérifier si déjà abonné
    const existing = await reg.pushManager.getSubscription()
    if (existing) return existing

    if (!VAPID_PUBLIC) {
      console.error('[Push] VAPID_PUBLIC_KEY manquant')
      return null
    }

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    })

    return subscription
  } catch (err) {
    console.error('[Push] Erreur abonnement push:', err)
    return null
  }
}

// ─── Se désabonner ────────────────────────────────────────
export async function unsubscribeFromPush(reg: ServiceWorkerRegistration): Promise<boolean> {
  try {
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return true
    return await sub.unsubscribe()
  } catch (err) {
    console.error('[Push] Erreur désabonnement:', err)
    return false
  }
}

// ─── Envoyer la subscription au serveur ───────────────────
export async function saveSubscriptionToServer(
  subscription: PushSubscription,
  token:         string
): Promise<boolean> {
  try {
    const res = await fetch('/api/push/subscribe', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        user_agent:   navigator.userAgent,
        platform:     navigator.platform,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

// ─── Supprimer la subscription du serveur ─────────────────
export async function deleteSubscriptionFromServer(
  subscription: PushSubscription,
  token:        string
): Promise<boolean> {
  try {
    const res = await fetch('/api/push/unsubscribe', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    })
    return res.ok
  } catch {
    return false
  }
}

// ─── Test notification locale ──────────────────────────────
export async function sendTestNotification(): Promise<void> {
  if (Notification.permission !== 'granted') return
  const reg = await navigator.serviceWorker.ready
  await reg.showNotification('ProfityX — Test', {
    body:  '🎯 Notifications actives ! Vous recevrez les alertes avant chaque annonce.',
    icon:  '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag:   'profityx-test',
    vibrate: [200, 100, 200],
  })
}

// ─── Utilitaire VAPID ─────────────────────────────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData  = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// ─── Hook état des notifications ──────────────────────────
export function getNotificationState(): {
  supported:  boolean
  permission: NotificationPermission | 'unsupported'
} {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { supported: false, permission: 'unsupported' }
  }
  return {
    supported:  'PushManager' in window && 'serviceWorker' in navigator,
    permission: Notification.permission,
  }
}
