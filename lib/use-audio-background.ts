'use client'

/**
 * Background Audio Playback Hook
 * ================================
 * Registers the audio service worker and provides utilities for
 * keeping audio playing when the tab is backgrounded.
 *
 * Uses MediaSession API for lock-screen controls on mobile.
 */

import { useEffect, useRef, useCallback } from 'react'

interface AudioMetadata {
  title: string
  artist?: string
  album?: string
  artwork?: string
}

export function useAudioBackground() {
  const swRegistration = useRef<ServiceWorkerRegistration | null>(null)
  const keepAliveInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  // Register the audio service worker
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/audio-sw.js')
      .then((reg) => {
        swRegistration.current = reg
        console.log('[AudioBG] Service worker registered')
      })
      .catch((err) => {
        console.warn('[AudioBG] SW registration failed:', err)
      })

    return () => {
      if (keepAliveInterval.current) {
        clearInterval(keepAliveInterval.current)
      }
    }
  }, [])

  // Start keep-alive pings to prevent SW from sleeping
  const startKeepAlive = useCallback(() => {
    if (keepAliveInterval.current) clearInterval(keepAliveInterval.current)

    keepAliveInterval.current = setInterval(() => {
      if (swRegistration.current?.active) {
        const channel = new MessageChannel()
        swRegistration.current.active.postMessage({ type: 'KEEP_ALIVE' }, [channel.port2])
      }
    }, 20000) // Ping every 20 seconds
  }, [])

  const stopKeepAlive = useCallback(() => {
    if (keepAliveInterval.current) {
      clearInterval(keepAliveInterval.current)
      keepAliveInterval.current = null
    }
  }, [])

  // Pre-cache an audio URL for offline playback
  const cacheAudio = useCallback((url: string) => {
    if (swRegistration.current?.active) {
      swRegistration.current.active.postMessage({ type: 'CACHE_AUDIO', url })
    }
  }, [])

  // Set Media Session metadata (lock screen controls)
  const setMediaSession = useCallback((metadata: AudioMetadata, handlers?: {
    onPlay?: () => void
    onPause?: () => void
    onNext?: () => void
    onPrev?: () => void
  }) => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: metadata.title,
      artist: metadata.artist || 'StudyFlow',
      album: metadata.album || 'Audio Learning',
      artwork: metadata.artwork
        ? [{ src: metadata.artwork, sizes: '512x512', type: 'image/png' }]
        : [],
    })

    if (handlers?.onPlay) navigator.mediaSession.setActionHandler('play', handlers.onPlay)
    if (handlers?.onPause) navigator.mediaSession.setActionHandler('pause', handlers.onPause)
    if (handlers?.onNext) navigator.mediaSession.setActionHandler('nexttrack', handlers.onNext)
    if (handlers?.onPrev) navigator.mediaSession.setActionHandler('previoustrack', handlers.onPrev)
  }, [])

  // Create an audio element that persists across tab backgrounding
  const createPersistentAudio = useCallback((url: string): HTMLAudioElement => {
    const audio = new Audio(url)
    // Prevent browser from pausing when tab is hidden
    audio.setAttribute('x-webkit-airplay', 'allow')

    // Use a silent audio context to keep the audio pipeline active
    const keepActive = () => {
      try {
        const ctx = new AudioContext()
        const source = ctx.createMediaElementSource(audio)
        source.connect(ctx.destination)
      } catch {
        // AudioContext already connected or not supported — fine
      }
    }

    audio.addEventListener('play', () => {
      keepActive()
      startKeepAlive()
    })

    audio.addEventListener('pause', stopKeepAlive)
    audio.addEventListener('ended', stopKeepAlive)

    return audio
  }, [startKeepAlive, stopKeepAlive])

  return {
    cacheAudio,
    setMediaSession,
    createPersistentAudio,
    startKeepAlive,
    stopKeepAlive,
  }
}
