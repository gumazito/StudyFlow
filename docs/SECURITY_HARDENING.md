# StudyFlow Security Hardening Guide

## 1. Firebase App Check (Prevents API Abuse)

### Status: Code Ready — Needs Configuration

**What it does:** Ensures only your app can access your Firebase resources. Blocks bots, scrapers, and unauthorised API calls.

### Setup:
```bash
# 1. Install (if not already)
npm install firebase

# 2. Add to .env.local:
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_v3_site_key
NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN=your_debug_token  # for local dev only
```

### Steps:
1. **Google reCAPTCHA Console** → https://www.google.com/recaptcha/admin
   - Create reCAPTCHA v3 site → Copy Site Key and Secret Key
   - Add domains: `studyflow-f2e7a.web.app`, `studyflow-f2e7a.firebaseapp.com`

2. **Firebase Console** → App Check → Register app
   - Choose reCAPTCHA v3 → Paste the Secret Key
   - **DO NOT enforce yet** — deploy code first!

3. **Deploy** the code with App Check initialised

4. **Enforce** App Check in Firebase Console for:
   - Cloud Firestore ✅
   - Cloud Storage ✅
   - Authentication ✅

### Initialise in your app:
```typescript
// In app/layout.tsx or app/page.tsx
import { initAppCheck } from '@/lib/app-check'
useEffect(() => { initAppCheck() }, [])
```

---

## 2. Firestore Security Rules (Already Updated)

The rules have been simplified to fix the "Missing or insufficient permissions" errors.
Deploy with: `firebase deploy --only firestore:rules`

### Key rules:
- All authenticated users can read most collections
- Write access requires authentication
- Admin collections restricted to admin users
- User documents: users can only write their own

---

## 3. Content Security Policy (CSP)

Add to `next.config.js`:

```javascript
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://www.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.googleusercontent.com https://*.firebasestorage.googleapis.com",
      "frame-src https://accounts.google.com https://appleid.apple.com https://login.microsoftonline.com https://open.spotify.com https://www.youtube.com https://player.vimeo.com",
      "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.anthropic.com https://api.openai.com https://generativelanguage.googleapis.com https://api.x.ai https://api.perplexity.ai wss://*.firebaseio.com",
    ].join('; ')
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
]
```

---

## 4. Rate Limiting (Client-Side)

The `lib/error-tracking.ts` module includes global error handlers.
For API key protection, AI provider calls already go through the user's own API keys.

### Recommended: Firebase Security Rules Rate Limiting
```
// In firestore.rules — limit writes per user
match /test_results/{resultId} {
  allow create: if isAuth()
    && request.resource.data.userId == request.auth.uid
    && get(/databases/$(database)/documents/rate_limits/$(request.auth.uid)).data.lastWrite < request.time - duration.value(1, 's');
}
```

---

## 5. Environment Variables Checklist

```bash
# .env.local — NEVER commit this file

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=studyflow-f2e7a.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=studyflow-f2e7a
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=studyflow-f2e7a.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# App Check
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=

# Microsoft OAuth
NEXT_PUBLIC_MICROSOFT_APP_ID=e4021569-f628-46e6-87df-4cbb48b38a0b
```

---

## 6. Storage Security Rules

Create/update `storage.rules`:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Avatars — users can upload their own
    match /avatars/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024  // 5MB max
        && request.resource.contentType.matches('image/.*');
    }

    // Video uploads — authenticated users, 100MB max
    match /videos/{packageId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.resource.size < 100 * 1024 * 1024;
    }

    // Group files
    match /groups/{groupId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.resource.size < 50 * 1024 * 1024;
    }

    // Default deny
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 7. Authentication Security

### Already implemented:
- ✅ Email/password with Firebase Auth
- ✅ Google OAuth
- ✅ Microsoft OAuth (App ID: e4021569-f628-46e6-87df-4cbb48b38a0b)
- ✅ Apple Sign In (code ready, needs Apple Developer Console config)
- ✅ Super user auto-approval system
- ✅ Admin notification on new signups

### Recommended additions:
- [ ] Enable Email enumeration protection in Firebase Console → Authentication → Settings
- [ ] Set up authorised domains in Firebase Console → Authentication → Settings
- [ ] Enable multi-factor authentication (MFA) for admin accounts
- [ ] Set password policy: minimum 8 characters, require complexity

---

## Priority Order for Implementation

1. **Deploy Firestore rules** (fixes current permissions errors) — `bash deploy-all.sh`
2. **App Check** (biggest security win for least effort)
3. **Storage rules** (protect uploads)
4. **CSP headers** (prevent XSS)
5. **Sentry** (catch errors before users report them)
6. **Email enumeration protection** (quick toggle in Firebase Console)
