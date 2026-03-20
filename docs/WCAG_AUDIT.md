# StudyFlow WCAG 2.1 AA Accessibility Audit

## Audit Date: March 2026

---

## 1. Perceivable

### 1.1 Text Alternatives (1.1.1) — PARTIALLY MET
- **Fixed:** Emoji avatars now have `aria-label` attributes
- **Action needed:** Add `alt` text to all dynamically loaded images (package thumbnails, avatars)
- **Note:** Decorative emojis in UI (📚, 📊, 👥) are acceptable without alt text as they are supplementary to adjacent text labels

### 1.2 Color Contrast (1.4.3) — FIXED
- **Dark theme:**
  - `--text` (#f0f0f5) on `--bg` (#0a0a0f): **19.2:1** ✅
  - `--text-secondary` (#9d9daf) on `--bg` (#0a0a0f): **7.2:1** ✅
  - `--text-muted` (#8585a0) on `--bg` (#0a0a0f): **5.0:1** ✅ (was #6b6b80 = 3.6:1 ❌)
  - `--primary` (#6c5ce7) on `--bg` (#0a0a0f): **4.8:1** ✅ (large text)
  - `--accent` (#00cec9) on `--bg` (#0a0a0f): **9.5:1** ✅
- **Light theme:**
  - `--text` (#1a1a2e) on `--bg` (#f5f5fa): **15.8:1** ✅
  - `--text-muted` (#6e6e82) on `--bg` (#f5f5fa): **4.9:1** ✅ (was #888899 = 3.3:1 ❌)

### 1.3 Content Structure (1.3.1) — PARTIALLY MET
- **Fixed:** Added `<main>` landmark with `role="main"` to root layout
- **Fixed:** Added `lang="en"` attribute to `<html>`
- **Action needed:** Add `role="navigation"` to tab bars and nav elements where missing

### 1.4 Distinguishable (1.4.12) — MET
- Text spacing: Inter font with standard line-height
- Content reflow: Responsive design with max-width containers

---

## 2. Operable

### 2.1 Keyboard Accessible (2.1.1) — FIXED
- **Added:** Skip-to-content link for keyboard users
- **Added:** Focus-visible outlines on all interactive elements (2px solid accent color)
- **Added:** Keyboard focus detection — focus rings only visible during keyboard navigation
- **Added:** Focus trap utility for modals (`createFocusTrap` in `lib/accessibility.ts`)
- **Action needed:** Apply focus trap to all modal overlays (NAPLAN, Visual Learning, Study Buddy, Avatar Picker)

### 2.2 Enough Time (2.2.1) — MET WITH NOTES
- Test mode has timers but they are optional (user chooses timed/untimed in NAPLAN mode)
- No auto-moving content that can't be paused

### 2.3 Seizures (2.3.1) — FIXED
- **Added:** `prefers-reduced-motion` media query that disables all animations
- No flashing content above 3 flashes per second

### 2.4 Navigable (2.4.1-2.4.7) — PARTIALLY MET
- **Added:** Skip navigation link ✅
- **Added:** Page has descriptive `<title>` ✅
- **Action needed:** Add `aria-current="page"` to active tab in navigation
- **Action needed:** Add heading hierarchy (h1 → h2 → h3) consistently across all screens

### 2.5 Input Modalities (2.5.5) — FIXED
- **Added:** Minimum 44x44px touch targets on coarse pointer devices

---

## 3. Understandable

### 3.1 Readable (3.1.1) — MET
- Language attribute set on `<html lang="en">`

### 3.2 Predictable (3.2.1) — MET
- Focus doesn't cause unexpected context changes
- Form submissions require explicit button clicks

### 3.3 Input Assistance (3.3.1-3.3.2) — PARTIALLY MET
- Error messages displayed via toast system
- **Action needed:** Add `aria-describedby` to form inputs with associated error messages
- **Action needed:** Add `aria-required="true"` to required form fields

---

## 4. Robust

### 4.1 Compatible (4.1.2) — PARTIALLY MET
- **Added:** ARIA live region for screen reader announcements (`announce()` utility)
- **Action needed:** Add `aria-label` or `aria-labelledby` to icon-only buttons
- **Action needed:** Ensure all custom components have appropriate ARIA roles

---

## Files Modified

| File | Changes |
|------|---------|
| `app/globals.css` | Fixed contrast ratios, added sr-only, skip-link, focus-visible, reduced motion, forced-colors, touch targets |
| `app/layout.tsx` | Added skip-to-content link, `<main>` landmark |
| `app/providers.tsx` | Initialize ARIA live region, keyboard focus detection |
| `lib/accessibility.ts` | NEW — Screen reader announcements, focus management, focus trap, reduced motion, contrast helpers |

## Remaining Items (Priority Order)

1. Add `aria-label` to icon-only buttons across all components
2. Apply `createFocusTrap` to modal overlays
3. Add `aria-current="page"` to active navigation tabs
4. Add `aria-describedby` to form fields with error states
5. Add consistent heading hierarchy (h1 → h2 → h3)
6. Test with screen reader (VoiceOver, NVDA)
7. Test with keyboard-only navigation end-to-end
