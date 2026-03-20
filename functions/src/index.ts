/**
 * StudyFlow Firebase Cloud Functions
 * ===================================
 * Backend services for features requiring server-side logic:
 * - ABN company lookup (ABR API proxy)
 * - Spotify OAuth (token exchange + refresh)
 * - Text-to-speech generation (OpenAI TTS / ElevenLabs)
 * - Email notifications (SendGrid)
 * - SMS notifications (Twilio)
 * - Stripe payment processing (subscriptions)
 * - Push notifications (FCM)
 */

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import cors from 'cors'

admin.initializeApp()

const corsHandler = cors({ origin: true })

// Re-export all function groups
export { abnLookup } from './abn-lookup'
export { spotifyAuth, spotifyRefresh, spotifyCallback } from './spotify'
export { textToSpeech } from './tts'
export { sendEmailNotification, sendSmsNotification, weeklyProgressSummary, inactiveUserReminder } from './notifications'
export { createCheckoutSession, stripeWebhook, getSubscriptionStatus, cancelSubscription } from './stripe'
export { sendPushNotification, subscribeToPush } from './push'
