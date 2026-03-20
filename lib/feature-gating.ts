/**
 * Feature Gating — Free-tier limits
 * ===================================
 * Enforces usage limits for free-tier users.
 * Premium users (active subscription or trialing) bypass all limits.
 */

export interface TierLimits {
  maxCoursesCreated: number
  maxTestsPerDay: number
  maxGroups: number
  hasAudioLearning: boolean
  hasVideoUploads: boolean
  hasSpotify: boolean
  hasStudyPlans: boolean
  hasAdvancedExport: boolean
  hasCustomBranding: boolean
}

export const FREE_LIMITS: TierLimits = {
  maxCoursesCreated: 3,
  maxTestsPerDay: 10,
  maxGroups: 3,
  hasAudioLearning: false,
  hasVideoUploads: false,
  hasSpotify: false,
  hasStudyPlans: false,
  hasAdvancedExport: false,
  hasCustomBranding: false,
}

export const PREMIUM_LIMITS: TierLimits = {
  maxCoursesCreated: Infinity,
  maxTestsPerDay: Infinity,
  maxGroups: Infinity,
  hasAudioLearning: true,
  hasVideoUploads: true,
  hasSpotify: true,
  hasStudyPlans: true,
  hasAdvancedExport: true,
  hasCustomBranding: true,
}

// Always-premium accounts — these users never need to pay
const ALWAYS_PREMIUM_EMAILS = [
  'courtenay@hollis.family',
  'savannah@hollis.family',
  'ezrela@hollis.family',
  'ethan@hollis.family',
]

export function isAlwaysPremium(email?: string): boolean {
  if (!email) return false
  return ALWAYS_PREMIUM_EMAILS.includes(email.toLowerCase())
}

export function getLimitsForUser(subscriptionStatus?: string, email?: string, isAdmin?: boolean, manualPremium?: boolean): TierLimits {
  // Admin, always-premium accounts, and manually granted users bypass all limits
  if (isAdmin || isAlwaysPremium(email) || manualPremium) {
    return PREMIUM_LIMITS
  }
  if (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') {
    return PREMIUM_LIMITS
  }
  return FREE_LIMITS
}

export function isPremiumUser(subscriptionStatus?: string, email?: string, isAdmin?: boolean, manualPremium?: boolean): boolean {
  return isAdmin || isAlwaysPremium(email) || manualPremium ||
    subscriptionStatus === 'active' || subscriptionStatus === 'trialing' || false
}

export function canTakeTest(testsToday: number, premium: boolean): { allowed: boolean; message?: string } {
  if (premium) return { allowed: true }
  if (testsToday >= FREE_LIMITS.maxTestsPerDay) {
    return { allowed: false, message: `Free accounts are limited to ${FREE_LIMITS.maxTestsPerDay} tests per day. Upgrade to Premium for unlimited tests!` }
  }
  return { allowed: true }
}

export function canCreateCourse(coursesCreated: number, premium: boolean): { allowed: boolean; message?: string } {
  if (premium) return { allowed: true }
  if (coursesCreated >= FREE_LIMITS.maxCoursesCreated) {
    return { allowed: false, message: `Free accounts can create up to ${FREE_LIMITS.maxCoursesCreated} courses. Upgrade to Premium for unlimited!` }
  }
  return { allowed: true }
}

export function canAccessFeature(feature: keyof TierLimits, premium: boolean): { allowed: boolean; message?: string } {
  if (premium) return { allowed: true }
  const limits = FREE_LIMITS
  const val = limits[feature]
  if (typeof val === 'boolean' && !val) {
    return { allowed: false, message: 'This feature requires StudyFlow Premium. Start your 14-day free trial!' }
  }
  return { allowed: true }
}
