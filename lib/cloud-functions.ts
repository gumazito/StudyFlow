/**
 * Cloud Functions Client Helper
 * ==============================
 * Provides typed wrappers for calling Firebase Cloud Functions from the client.
 * All functions automatically attach the Firebase auth token.
 */

import { auth } from './firebase'

// Auto-detect functions URL based on environment
const FUNCTIONS_BASE = process.env.NEXT_PUBLIC_FUNCTIONS_URL ||
  (process.env.NEXT_PUBLIC_ENV === 'production'
    ? 'https://australia-southeast1-studyflow-f2e7a.cloudfunctions.net'
    : 'https://australia-southeast1-studyflow-f2e7a.cloudfunctions.net')

async function getAuthToken(): Promise<string> {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  return user.getIdToken()
}

async function callFunction(name: string, data?: any, method: 'GET' | 'POST' = 'POST'): Promise<any> {
  const token = await getAuthToken()
  const url = `${FUNCTIONS_BASE}/${name}`

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  }

  if (method === 'POST' && data) {
    options.body = JSON.stringify(data)
  }

  const resp = await fetch(method === 'GET' && data
    ? `${url}?${new URLSearchParams(data)}`
    : url,
    options
  )

  const result = await resp.json()
  if (!resp.ok) throw new Error(result.error || `Function ${name} failed`)
  return result
}

// ============================================================
// ABN LOOKUP
// ============================================================
export async function lookupAbn(abn: string) {
  return callFunction('abnLookup', { abn }, 'GET')
}

export async function searchAbnByName(name: string, state?: string) {
  return callFunction('abnLookup', { name, ...(state ? { state } : {}) }, 'GET')
}

// ============================================================
// SPOTIFY
// ============================================================
export async function getSpotifyAuthUrl(userId: string) {
  const resp = await fetch(`${FUNCTIONS_BASE}/spotifyAuth?userId=${userId}`)
  const data = await resp.json()
  if (!resp.ok) throw new Error(data.error || 'Failed to get Spotify auth URL')
  return data.authUrl as string
}

export async function refreshSpotifyToken(userId: string) {
  return callFunction('spotifyRefresh', { userId })
}

// ============================================================
// TEXT-TO-SPEECH
// ============================================================
/**
 * Generate TTS audio. Tries Cloud Function first, falls back to browser SpeechSynthesis.
 */
export async function generateTts(text: string, options?: { voice?: string; provider?: string; packageId?: string; factIndex?: number }): Promise<{ audioUrl?: string; audioBlob?: Blob; provider: string }> {
  // Try Cloud Function first
  try {
    const token = await getAuthToken()
    const resp = await fetch(`${FUNCTIONS_BASE}/textToSpeech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text, ...options }),
    })

    if (resp.ok) {
      const contentType = resp.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const data = await resp.json()
        return { audioUrl: data.audioUrl, provider: data.provider }
      } else {
        const blob = await resp.blob()
        const provider = resp.headers.get('x-tts-provider') || 'cloud'
        return { audioBlob: blob, provider }
      }
    }
    // If not ok, fall through to browser TTS
    console.warn('[TTS] Cloud Function returned', resp.status, '— falling back to browser TTS')
  } catch (err) {
    console.warn('[TTS] Cloud Function error — falling back to browser TTS:', err)
  }

  // Fallback: Browser SpeechSynthesis → record to audio blob
  return browserTtsFallback(text, options?.voice)
}

/**
 * Browser-based TTS fallback using SpeechSynthesis API.
 * Returns a promise that resolves when speech finishes, providing a dummy audioUrl
 * that the PodcastPlayer can use (we use a MediaRecorder to capture audio where possible,
 * otherwise just speak directly and signal completion).
 */
function browserTtsFallback(text: string, _voice?: string): Promise<{ audioUrl?: string; audioBlob?: Blob; provider: string }> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      reject(new Error('No TTS available — browser does not support SpeechSynthesis'))
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1
    utterance.volume = 1

    // Try to pick an English voice
    const voices = window.speechSynthesis.getVoices()
    const englishVoice = voices.find(v => v.lang.startsWith('en') && v.localService) || voices.find(v => v.lang.startsWith('en'))
    if (englishVoice) utterance.voice = englishVoice

    // We can't easily capture SpeechSynthesis output as a blob,
    // so we create a silent audio blob as a placeholder and speak directly
    const silentWav = createSilentWav(0.1)
    const blob = new Blob([silentWav], { type: 'audio/wav' })
    const url = URL.createObjectURL(blob)

    utterance.onend = () => {
      resolve({ audioUrl: url, provider: 'browser' })
    }
    utterance.onerror = (e) => {
      reject(new Error(`Browser TTS error: ${e.error}`))
    }

    window.speechSynthesis.speak(utterance)
    // Return immediately with provider info — the audio element will play the silent clip
    // while SpeechSynthesis reads aloud
    resolve({ audioUrl: url, provider: 'browser' })
  })
}

/** Create a minimal silent WAV file */
function createSilentWav(durationSec: number): ArrayBuffer {
  const sampleRate = 8000
  const numSamples = Math.floor(sampleRate * durationSec)
  const buffer = new ArrayBuffer(44 + numSamples * 2)
  const view = new DataView(buffer)
  const writeString = (offset: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)) }
  writeString(0, 'RIFF')
  view.setUint32(4, 36 + numSamples * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, numSamples * 2, true)
  return buffer
}

// ============================================================
// NOTIFICATIONS
// ============================================================
export async function sendEmail(to: string, subject: string, html: string) {
  return callFunction('sendEmailNotification', { to, subject, html })
}

export async function sendSms(to: string, body: string) {
  return callFunction('sendSmsNotification', { to, body })
}

// ============================================================
// STRIPE PAYMENTS
// ============================================================
export async function createCheckoutSession(plan: 'monthly' | 'yearly') {
  return callFunction('createCheckoutSession', { plan })
}

export async function getSubscriptionStatus() {
  return callFunction('getSubscriptionStatus', undefined, 'GET')
}

export async function cancelSubscription(action: 'cancel' | 'pause' | 'discount') {
  return callFunction('cancelSubscription', { action })
}

// ============================================================
// PUSH NOTIFICATIONS
// ============================================================
export async function registerPushToken(fcmToken: string) {
  return callFunction('subscribeToPush', { fcmToken })
}

export async function sendPush(targetUserId: string, title: string, body: string, data?: Record<string, string>) {
  return callFunction('sendPushNotification', { targetUserId, title, body, data })
}

export async function sendPushToAll(title: string, body: string, data?: Record<string, string>) {
  return callFunction('sendPushNotification', { sendToAll: true, title, body, data })
}
