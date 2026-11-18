/*
 * Listeners de notificaciones para el service worker generado por Workbox.
 *
 * Workbox crea el SW de precaché (offline); este archivo solo agrega dos
 * eventos que Workbox no genera por su cuenta. Se inyecta con
 * `workbox.importScripts` desde vite.config.ts.
 */

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = event.notification.data || {}
  const target = typeof data.url === 'string' ? data.url : '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            if ('navigate' in client) client.navigate(target).catch(() => {})
            return client.focus()
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(target)
        return undefined
      }),
  )
})

// Push real enviado por el backend (funciona con la app cerrada).
self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { body: event.data ? event.data.text() : '' }
  }

  const emoji = payload.emoji ? payload.emoji + ' ' : ''
  const title = emoji + (payload.title || 'EL PARCHE')

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || '',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: payload.tag || 'elparche',
      data: { url: payload.url || payload.actionUrl || '/' },
    }),
  )
})
