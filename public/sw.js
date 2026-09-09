self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

function notifyFromPayload(payload) {
  const title = payload.title || 'JobMatch'
  const body = payload.body || 'This week’s 10 are ready.'
  const url = payload.url || '/app/matches'
  return self.registration.showNotification(title, {
    body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'jobmatch-weekly',
    renotify: true,
    data: { url },
  })
}

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(notifyFromPayload(payload))
})

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'notify') return
  event.waitUntil(
    notifyFromPayload({
      title: event.data.title,
      body: event.data.body,
      url: event.data.url,
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/app/matches'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((client) => client.url.includes('/app'))
      if (existing) {
        existing.postMessage({ type: 'open-matches' })
        return existing.focus()
      }
      return self.clients.openWindow(url)
    }),
  )
})
