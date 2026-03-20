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
    ? 'https://us-central1-studyflow-app.cloudfunctions.net'
    : 'https://us-central1-studyflow-staging.cloudfunctions.net')

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
export async function generateTts(text: string, options?: { voice?: string; provider?: string; packageId?: string; factIndex?: number }): Promise<{ audioUrl?: string; audioBlob?: Blob; provider: string }> {
  const token = await getAuthToken()
  const resp = await fetch(`${FUNCTIONS_BASE}/textToSpeech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text, ...options }),
  })

  // Check if response is JSON (cached URL) or audio blob
  const contentType = resp.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const data = await resp.json()
    if (!resp.ok) throw new Error(data.error || 'TTS failed')
    return { audioUrl: data.audioUrl, provider: data.provider }
  } else {
    const blob = await resp.blob()
    const provider = resp.headers.get('x-tts-provider') || 'unknown'
    return { audioBlob: blob, provider }
  }
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
