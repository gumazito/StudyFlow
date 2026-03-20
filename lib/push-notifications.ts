/**
 * Push Notification Client Helper
 * =================================
 * Registers service worker, requests notification permission,
 * and obtains FCM token for push notifications.
 */

import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import app from './firebase'
import { registerPushToken } from './cloud-functions'

let messaging: any = null

function getMessagingInstance() {
  if (typeof window === 'undefined') return null
  if (!messaging) {
    try {
      messaging = getMessaging(app)
    } catch {
      // FCM not supported in this browser
      return null
    }
  }
  return messaging
}

/**
 * Request notification permission and register FCM token.
 * Returns the FCM token if successful, null otherwise.
 */
export async function initPushNotifications(): Promise<string | null> {
  if (typeof window === 'undefined') return null

  // Check browser support
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.warn('Push notifications not supported in this browser')
    return null
  }

  // Request permission
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    console.warn('Notification permission denied')
    return null
  }

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

    const msg = getMessagingInstance()
    if (!msg) return null

    // Get FCM token
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    const token = await getToken(msg, {
      vapidKey,
      serviceWorkerRegistration: registration,
    })

    if (token) {
      // Register with our Cloud Function
      await registerPushToken(token)
      return token
    }
  } catch (err) {
    console.error('Push notification setup failed:', err)
  }

  return null
}

/**
 * Listen for foreground messages and show toast notification.
 */
export function onForegroundMessage(callback: (payload: any) => void) {
  const msg = getMessagingInstance()
  if (!msg) return () => {}

  return onMessage(msg, (payload) => {
    callback(payload)
  })
}

/**
 * Check if push notifications are supported and enabled.
 */
export function isPushSupported(): boolean {
  return typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator
}

export function isPushEnabled(): boolean {
  return typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted'
}
