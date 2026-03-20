'use client'

/**
 * StudyFlow Accessibility Utilities — WCAG 2.1 AA Compliance
 *
 * Key areas:
 * 1. Focus management for keyboard navigation
 * 2. Skip-to-content link support
 * 3. Screen reader announcements (live regions)
 * 4. Reduced motion detection
 * 5. High contrast mode detection
 * 6. Focus trap for modals/overlays
 */

// ─── Screen Reader Announcements ───────────────────────────────────

let announceEl: HTMLElement | null = null

/** Create an ARIA live region for screen reader announcements */
export function initAriaLive() {
  if (typeof window === 'undefined') return
  if (document.getElementById('sf-aria-live')) return

  announceEl = document.createElement('div')
  announceEl.id = 'sf-aria-live'
  announceEl.setAttribute('role', 'status')
  announceEl.setAttribute('aria-live', 'polite')
  announceEl.setAttribute('aria-atomic', 'true')
  announceEl.className = 'sr-only'
  document.body.appendChild(announceEl)
}

/** Announce a message to screen readers */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  if (!announceEl) initAriaLive()
  if (!announceEl) return
  announceEl.setAttribute('aria-live', priority)
  announceEl.textContent = ''
  // Force reflow so screen readers detect the change
  void announceEl.offsetHeight
  announceEl.textContent = message
}

// ─── Focus Management ──────────────────────────────────────────────

/** Move focus to main content area (for skip link) */
export function focusMainContent() {
  const main = document.querySelector('[role="main"], main, #main-content')
  if (main instanceof HTMLElement) {
    main.setAttribute('tabindex', '-1')
    main.focus()
    main.removeAttribute('tabindex')
  }
}

/** Trap focus within a container (for modals) */
export function createFocusTrap(container: HTMLElement) {
  const focusable = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  const handler = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }
  }

  container.addEventListener('keydown', handler)
  first?.focus()

  return () => container.removeEventListener('keydown', handler)
}

// ─── Media Queries ─────────────────────────────────────────────────

/** Check if user prefers reduced motion */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Check if user prefers high contrast */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(forced-colors: active)').matches
}

// ─── Keyboard Navigation Helpers ───────────────────────────────────

/** Handle keyboard interaction for custom buttons/cards */
export function handleKeyActivate(e: React.KeyboardEvent, action: () => void) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    action()
  }
}

/** Enable visible focus ring only for keyboard users */
export function initKeyboardFocusDetection() {
  if (typeof window === 'undefined') return

  let usingKeyboard = false

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      usingKeyboard = true
      document.body.classList.add('keyboard-navigation')
    }
  })

  document.addEventListener('mousedown', () => {
    usingKeyboard = false
    document.body.classList.remove('keyboard-navigation')
  })
}

// ─── Color Contrast Helpers ────────────────────────────────────────

/** Calculate relative luminance (WCAG 2.1) */
function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c /= 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/** Calculate contrast ratio between two hex colors */
export function contrastRatio(hex1: string, hex2: string): number {
  const parse = (hex: string) => {
    hex = hex.replace('#', '')
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)]
  }
  const [r1, g1, b1] = parse(hex1)
  const [r2, g2, b2] = parse(hex2)
  const l1 = luminance(r1, g1, b1)
  const l2 = luminance(r2, g2, b2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Check if contrast meets WCAG AA for normal text (4.5:1) */
export function meetsContrastAA(hex1: string, hex2: string): boolean {
  return contrastRatio(hex1, hex2) >= 4.5
}

/** Check if contrast meets WCAG AA for large text (3:1) */
export function meetsContrastAALarge(hex1: string, hex2: string): boolean {
  return contrastRatio(hex1, hex2) >= 3.0
}
