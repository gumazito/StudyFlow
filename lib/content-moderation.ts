/**
 * Content Moderation System
 * ==========================
 * Client-side profanity filter + content screening.
 * Runs on all user-generated text before submission.
 */

// Common profanity words (censored for source code)
// This is a basic list — extend with a proper profanity library in production
const PROFANITY_LIST = [
  'fuck', 'shit', 'ass', 'damn', 'bitch', 'dick', 'piss', 'crap',
  'bastard', 'cunt', 'wanker', 'twat', 'bollocks', 'arsehole',
  'slut', 'whore', 'faggot', 'nigger', 'retard',
  // Common substitutions
  'f*ck', 'sh*t', 'b*tch', 'a$$', 'd!ck',
  'fuk', 'fck', 'sht', 'btch',
]

// Slur patterns (more harmful — auto-block)
const SEVERE_PATTERNS = [
  /\bkill\s+(your)?self\b/i,
  /\bkys\b/i,
  /\bdie\b.*\b(please|already)\b/i,
  /\bn[i1]gg[ae3]r/i,
  /\bf[a@]gg?[o0]t/i,
  /\bretard/i,
]

export interface ModerationResult {
  clean: boolean
  severity: 'none' | 'mild' | 'severe'
  flaggedWords: string[]
  sanitised: string
}

/**
 * Check text for profanity and harmful content.
 * Returns moderation result with sanitised text.
 */
export function moderateText(text: string): ModerationResult {
  const lower = text.toLowerCase()
  const flaggedWords: string[] = []
  let severity: 'none' | 'mild' | 'severe' = 'none'

  // Check severe patterns first
  for (const pattern of SEVERE_PATTERNS) {
    const match = lower.match(pattern)
    if (match) {
      severity = 'severe'
      flaggedWords.push(match[0])
    }
  }

  // Check profanity list
  const words = lower.split(/\s+/)
  for (const word of words) {
    const cleanWord = word.replace(/[^a-z*!$@]/g, '')
    if (PROFANITY_LIST.includes(cleanWord)) {
      if (severity !== 'severe') severity = 'mild'
      flaggedWords.push(word)
    }
  }

  // Also check within words (concatenated profanity)
  for (const profane of PROFANITY_LIST) {
    if (lower.includes(profane) && !flaggedWords.some(w => w.includes(profane))) {
      if (severity !== 'severe') severity = 'mild'
      flaggedWords.push(profane)
    }
  }

  // Sanitise: replace flagged words with asterisks
  let sanitised = text
  for (const word of flaggedWords) {
    const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    sanitised = sanitised.replace(regex, '*'.repeat(word.length))
  }

  return {
    clean: flaggedWords.length === 0,
    severity,
    flaggedWords: [...new Set(flaggedWords)],
    sanitised,
  }
}

/**
 * Quick check — returns true if text is clean.
 */
export function isClean(text: string): boolean {
  return moderateText(text).clean
}

/**
 * Pre-approved cheer templates for safe messaging.
 */
export const CHEER_TEMPLATES = [
  { text: 'Keep going! 💪', emoji: '💪' },
  { text: 'Great score! 🎉', emoji: '🎉' },
  { text: "You've got this! ⭐", emoji: '⭐' },
  { text: 'So proud of you! 🥳', emoji: '🥳' },
  { text: 'Amazing effort! 🔥', emoji: '🔥' },
  { text: 'Keep up the streak! 🏆', emoji: '🏆' },
  { text: 'Legend! 👏', emoji: '👏' },
  { text: "You're smashing it! 💥", emoji: '💥' },
  { text: 'Study buddy goals! 📚', emoji: '📚' },
  { text: 'Inspiring stuff! ✨', emoji: '✨' },
]

/**
 * Custom word block list per group (stored in Firestore).
 * This extends the base profanity filter for group-specific needs.
 */
export function moderateWithGroupBlacklist(text: string, groupBlockList: string[]): ModerationResult {
  const baseResult = moderateText(text)
  const lower = text.toLowerCase()

  for (const word of groupBlockList) {
    if (lower.includes(word.toLowerCase())) {
      baseResult.clean = false
      if (baseResult.severity === 'none') baseResult.severity = 'mild'
      baseResult.flaggedWords.push(word)
      const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
      baseResult.sanitised = baseResult.sanitised.replace(regex, '*'.repeat(word.length))
    }
  }

  return baseResult
}
