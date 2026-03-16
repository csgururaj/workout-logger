const CACHE = 'workout-' + self.registration.scope

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(['/', '/manifest.json'])))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      // Network first — always try to get fresh assets, fall back to cache offline
      try {
        const res = await fetch(e.request)
        if (res.ok) cache.put(e.request, res.clone())
        return res
      } catch {
        return await cache.match(e.request)
      }
    })
  )
})
