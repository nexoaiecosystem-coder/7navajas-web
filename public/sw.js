// Service worker: solo atiende notificaciones push, no cachea nada
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let datos = { title: '7 Navajas', body: 'Tenés un aviso nuevo.', url: '/#panel' }
  try {
    datos = { ...datos, ...event.data.json() }
  } catch {
    // si el payload no es JSON, se usa el texto plano como cuerpo
    if (event.data) datos.body = event.data.text()
  }

  event.waitUntil(
    self.registration.showNotification(datos.title, {
      body: datos.body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      data: { url: datos.url },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/#panel'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      for (const cliente of lista) {
        if (cliente.url.includes('#panel') && 'focus' in cliente) return cliente.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    }),
  )
})
