'use client'

/**
 * Error Tracking — Sentry Integration for StudyFlow
 *
 * Setup steps:
 * 1. Create a Sentry account: https://sentry.io/signup/
 * 2. Create a new project → Platform: Next.js
 * 3. Copy the DSN and add to .env.local:
 *    NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
 * 4. Install Sentry:
 *    npm install @sentry/nextjs
 * 5. Run the Sentry wizard:
 *    npx @sentry/wizard@latest -i nextjs
 *
 * For now, this module provides a lightweight error tracking system
 * that works without Sentry (console + Firestore logging) and
 * seamlessly upgrades when Sentry is installed.
 */

import { doc, setDoc, collection } from 'firebase/firestore'
import { db } from './firebase'

interface ErrorReport {
  message: string
  stack?: string
  component?: string
  userId?: string
  userEmail?: string
  url?: string
  timestamp: number
  severity: 'error' | 'warning' | 'info'
  metadata?: Record<string, any>
}

let sentryAvailable = false
let Sentry: any = null

// Try to load Sentry if installed (hidden from webpack via variable)
async function loadSentry() {
  try {
    // Use a variable to prevent webpack from resolving this at build time
    const sentryModule = '@sentry/' + 'nextjs'
    Sentry = await (Function('m', 'return import(m)')(sentryModule))
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: 0.2,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      })
      sentryAvailable = true
      console.log('[ErrorTracking] Sentry initialised')
    }
  } catch {
    // Sentry not installed — using Firestore fallback
  }
}

// Initialise on import
if (typeof window !== 'undefined') {
  loadSentry()
}

/**
 * Explicit initializer — call from app root to ensure module is loaded
 * and global error handlers are attached.
 */
export function initErrorTracking() {
  if (typeof window === 'undefined') return
  // Attach global unhandled error handlers
  window.addEventListener('error', (event) => {
    trackError(event.error || event.message, { component: 'global', metadata: { type: 'unhandled' } })
  })
  window.addEventListener('unhandledrejection', (event) => {
    trackError(event.reason instanceof Error ? event.reason : String(event.reason), { component: 'global', metadata: { type: 'unhandled_promise' } })
  })
}

/**
 * Track an error. Sends to Sentry if available, otherwise logs to Firestore.
 */
export function trackError(error: Error | string, context?: { component?: string; userId?: string; userEmail?: string; metadata?: Record<string, any> }) {
  const err = typeof error === 'string' ? new Error(error) : error
  const report: ErrorReport = {
    message: err.message,
    stack: err.stack,
    component: context?.component,
    userId: context?.userId,
    userEmail: context?.userEmail,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    timestamp: Date.now(),
    severity: 'error',
    metadata: context?.metadata,
  }

  // Console log in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[ErrorTracking]', report)
  }

  // Send to Sentry if available
  if (sentryAvailable && Sentry) {
    Sentry.captureException(err, {
      tags: { component: context?.component },
      user: context?.userId ? { id: context.userId, email: context.userEmail } : undefined,
      extra: context?.metadata,
    })
    return
  }

  // Fallback: log to Firestore (admin can review)
  logToFirestore(report).catch(() => {})
}

/**
 * Track a warning (non-critical issue)
 */
export function trackWarning(message: string, context?: { component?: string; metadata?: Record<string, any> }) {
  if (sentryAvailable && Sentry) {
    Sentry.captureMessage(message, { level: 'warning', tags: { component: context?.component }, extra: context?.metadata })
    return
  }

  if (process.env.NODE_ENV === 'development') {
    console.warn('[ErrorTracking]', message, context)
  }
}

/**
 * Set user context for error tracking
 */
export function setErrorTrackingUser(userId: string, email: string, name?: string) {
  if (sentryAvailable && Sentry) {
    Sentry.setUser({ id: userId, email, username: name })
  }
}

/**
 * Clear user context (on logout)
 */
export function clearErrorTrackingUser() {
  if (sentryAvailable && Sentry) {
    Sentry.setUser(null)
  }
}

/**
 * Wrap an async function with error tracking
 */
export function withErrorTracking<T>(fn: () => Promise<T>, component: string): Promise<T> {
  return fn().catch(err => {
    trackError(err, { component })
    throw err
  })
}

// Firestore fallback logging
async function logToFirestore(report: ErrorReport) {
  try {
    const ref = doc(collection(db, 'error_logs'))
    await setDoc(ref, {
      ...report,
      stack: report.stack?.slice(0, 2000), // Truncate stack traces
    })
  } catch {
    // Silently fail — don't create infinite error loops
  }
}

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    trackError(event.reason || 'Unhandled promise rejection', { component: 'global' })
  })

  window.addEventListener('error', (event) => {
    trackError(event.error || event.message, { component: 'global' })
  })
}
