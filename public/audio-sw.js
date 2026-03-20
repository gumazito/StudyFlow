/**
 * Audio Service Worker — Background Playback
 * ============================================
 * Keeps audio playing when the browser tab is backgrounded or screen is off.
 * Used for podcast/audio learning mode in StudyFlow.
 *
 * Registration: navigator.serviceWorker.register('/audio-sw.js')
 */

const CACHE_NAME = 'studyflow-audio-v1'

// Install — cache the offline fallback
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([])
    })
  )
  self.skipWaiting()
})

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Cache audio files for offline playback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Only cache audio requests
  const isAudio =
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.wav') ||
    url.pathname.endsWith('.ogg') ||
    url.pathname.endsWith('.m4a') ||
    event.request.headers.get('accept')?.includes('audio/')

  if (!isAudio) return

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request)
      if (cached) return cached

      try {
        const response = await fetch(event.request)
        // Cache successful audio responses (clone since body can only be read once)
        if (response.ok) {
          cache.put(event.request, response.clone())
        }
        return response
      } catch {
        // Return cached version if network fails
        if (cached) return cached
        return new Response('Audio not available offline', { status: 503 })
      }
    })
  )
})

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data?.type === 'KEEP_ALIVE') {
    // Acknowledge keep-alive to prevent SW from going idle
    event.ports?.[0]?.postMessage({ type: 'ALIVE' })
  }

  if (event.data?.type === 'CACHE_AUDIO') {
    // Pre-cache audio URL
    const audioUrl = event.data.url
    if (audioUrl) {
      caches.open(CACHE_NAME).then((cache) => {
        cache.add(audioUrl).catch(() => {})
      })
    }
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME)
  }
})
