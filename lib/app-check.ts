'use client'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import app from './firebase'

/**
 * Firebase App Check — protects your Firebase resources from abuse.
 *
 * Setup steps:
 * 1. Go to Firebase Console → App Check → Register your app
 * 2. Choose reCAPTCHA v3 provider
 * 3. Go to Google reCAPTCHA Admin Console: https://www.google.com/recaptcha/admin
 * 4. Create a new reCAPTCHA v3 site
 *    - Label: "StudyFlow"
 *    - Type: reCAPTCHA v3
 *    - Domains: studyflow-f2e7a.web.app, studyflow-f2e7a.firebaseapp.com (+ custom domain)
 * 5. Copy the SITE KEY and add it to your .env.local:
 *    NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
 * 6. Copy the SECRET KEY and add it to Firebase Console → App Check → reCAPTCHA v3
 * 7. In Firebase Console → App Check, enforce App Check for:
 *    - Cloud Firestore
 *    - Cloud Storage
 *    - Authentication (optional but recommended)
 *
 * IMPORTANT: Only enforce AFTER deploying the code with App Check initialised,
 * otherwise existing users will be locked out!
 */

let appCheckInitialised = false

export function initAppCheck() {
  if (appCheckInitialised) return
  if (typeof window === 'undefined') return // SSR guard

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

  if (!siteKey) {
    console.debug('[AppCheck] No reCAPTCHA site key found. Set NEXT_PUBLIC_RECAPTCHA_SITE_KEY in .env.local to enable App Check.')
    return
  }

  try {
    // In development, you can use debug tokens instead
    if (process.env.NODE_ENV === 'development') {
      // @ts-ignore — debug token for local development
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN || true
    }

    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    })

    appCheckInitialised = true
    console.log('[AppCheck] Initialised successfully')
  } catch (err) {
    console.warn('[AppCheck] Failed to initialise:', err)
  }
}
