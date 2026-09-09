const VAPID_CACHE_KEY = 'jobmatch.vapid.public'

function urlBase64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)))
}

export function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false
  const media = window.matchMedia('(display-mode: standalone)').matches
  const ios = 'standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  return media || ios
}

export function isIosSafari() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export async function registerPushWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  return navigator.serviceWorker.register('/sw.js', { scope: '/' })
}

async function vapidPublicKey() {
  const cached = sessionStorage.getItem(VAPID_CACHE_KEY)
  if (cached) return cached
  const response = await fetch('/api/push/vapid')
  const data = (await response.json().catch(() => ({}))) as { publicKey?: string }
  if (data.publicKey) sessionStorage.setItem(VAPID_CACHE_KEY, data.publicKey)
  return data.publicKey ?? ''
}

export async function enablePushNotifications() {
  if (typeof window === 'undefined') {
    return { granted: false, error: 'Notifications need a browser.' }
  }
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    return { granted: false, error: 'This browser cannot receive notifications.' }
  }
  if (isIosSafari() && !isStandaloneDisplay()) {
    return {
      granted: false,
      error: 'On iPhone, tap Share → Add to Home Screen, then open JobMatch from your home screen to turn pings on.',
    }
  }

  const registration = await registerPushWorker()
  if (!registration) return { granted: false, error: 'Could not start notification service.' }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { granted: false, error: 'Notifications were not allowed. You can turn them on later in Account.' }
  }

  const ready = await navigator.serviceWorker.ready
  const publicKey = await vapidPublicKey()
  if (publicKey && 'PushManager' in window) {
    const existing = await ready.pushManager.getSubscription()
    const subscription =
      existing ??
      (await ready.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }))
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ granted: true, subscription }),
    }).catch(() => undefined)
  }

  await ready.showNotification('JobMatch', {
    body: 'We’ll ping you when this week’s 10 are ready.',
    tag: 'jobmatch-weekly',
    data: { url: '/app/matches' },
  })

  return { granted: true }
}

export async function notifyWeeklyListReady(count = 10) {
  if (typeof window === 'undefined' || Notification.permission !== 'granted') return
  const ready = await navigator.serviceWorker.ready.catch(() => null)
  ready?.active?.postMessage({
    type: 'notify',
    title: 'JobMatch',
    body: `${count} new roles this week. Newest first.`,
    url: '/app/matches',
  })
}
