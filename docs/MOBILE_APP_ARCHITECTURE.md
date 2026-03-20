# StudyFlow Mobile App — Architecture & Setup Guide

## Tech Stack
- **Framework:** React Native + Expo SDK 52+
- **Language:** TypeScript
- **State:** React Context (matching web app)
- **Backend:** Same Firebase project (studyflow-f2e7a)
- **Auth:** Firebase Auth (Google, Apple, Microsoft)
- **Offline:** AsyncStorage + SQLite for cached courses/tests
- **Testing:** Expo Go (dev), EAS Build (preview), TestFlight (iOS), Internal Testing (Android)

---

## Project Structure

```
studyflow-mobile/
├── app/                          # Expo Router (file-based routing)
│   ├── (auth)/                   # Auth screens (login, signup)
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── _layout.tsx
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── learn.tsx             # Browse & learn packages
│   │   ├── test.tsx              # Practice tests
│   │   ├── progress.tsx          # Stats, streaks, badges
│   │   ├── social.tsx            # Groups, followers, leaderboards
│   │   └── _layout.tsx           # Tab bar config
│   ├── package/[id].tsx          # Package detail
│   ├── test/[id].tsx             # Test taking screen
│   ├── study-buddy.tsx           # AI chat
│   ├── naplan.tsx                # NAPLAN practice
│   ├── settings.tsx              # Profile, avatar, preferences
│   └── _layout.tsx               # Root layout with auth guard
├── components/
│   ├── ui/                       # Shared UI components
│   ├── cards/                    # Swipe/flash cards
│   ├── audio/                    # Podcast player, TTS
│   └── ai/                       # AI mentor, visual learning
├── lib/
│   ├── firebase.ts               # Firebase init (React Native)
│   ├── auth-context.tsx          # Auth provider (React Native)
│   ├── db.ts                     # Firestore helpers (shared logic)
│   ├── offline.ts                # Offline cache manager
│   ├── ai-providers.ts           # AI integration (shared)
│   └── constants.ts              # Shared constants
├── assets/                       # Images, fonts, icons
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
└── package.json
```

---

## Step 1: Create the Project

```bash
# Create Expo project with TypeScript
npx create-expo-app studyflow-mobile -t tabs
cd studyflow-mobile

# Install core dependencies
npx expo install firebase
npx expo install @react-native-async-storage/async-storage
npx expo install expo-sqlite
npx expo install expo-apple-authentication
npx expo install expo-auth-session expo-web-browser
npx expo install @expo-google-fonts/inter
npx expo install expo-image-picker
npx expo install expo-av                    # Audio playback
npx expo install expo-speech                # Text-to-speech
npx expo install expo-haptics               # Haptic feedback
npx expo install expo-notifications         # Push notifications
npx expo install react-native-reanimated    # Animations
npx expo install react-native-gesture-handler  # Swipe cards
npx expo install expo-secure-store          # Secure API key storage
```

---

## Step 2: Firebase Configuration (React Native)

```typescript
// lib/firebase.ts (React Native version)
import { initializeApp, getApps } from 'firebase/app'
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import AsyncStorage from '@react-native-async-storage/async-storage'

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: 'studyflow-f2e7a.firebaseapp.com',
  projectId: 'studyflow-f2e7a',
  storageBucket: 'studyflow-f2e7a.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// React Native needs AsyncStorage for auth persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
})
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
```

---

## Step 3: Offline Mode Architecture

```typescript
// lib/offline.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SQLite from 'expo-sqlite'

const CACHE_PREFIX = 'sf_cache_'
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 days

interface CachedPackage {
  id: string
  data: any
  facts: any[]
  cachedAt: number
}

export class OfflineManager {
  private db: SQLite.SQLiteDatabase | null = null

  async init() {
    this.db = await SQLite.openDatabaseAsync('studyflow_offline')
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS packages (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        cached_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS test_results (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS progress (
        package_id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `)
  }

  // Cache a package for offline use
  async cachePackage(pkg: any) {
    if (!this.db) await this.init()
    await this.db!.runAsync(
      'INSERT OR REPLACE INTO packages (id, data, cached_at) VALUES (?, ?, ?)',
      [pkg.id, JSON.stringify(pkg), Date.now()]
    )
  }

  // Get cached packages
  async getCachedPackages(): Promise<any[]> {
    if (!this.db) await this.init()
    const rows = await this.db!.getAllAsync('SELECT * FROM packages')
    return rows.map((r: any) => JSON.parse(r.data))
  }

  // Queue test result for sync
  async queueTestResult(result: any) {
    if (!this.db) await this.init()
    await this.db!.runAsync(
      'INSERT INTO test_results (id, data, synced, created_at) VALUES (?, ?, 0, ?)',
      [result.id, JSON.stringify(result), Date.now()]
    )
  }

  // Sync queued results to Firestore
  async syncPendingResults(saveToFirestore: (result: any) => Promise<void>) {
    if (!this.db) await this.init()
    const pending = await this.db!.getAllAsync(
      'SELECT * FROM test_results WHERE synced = 0'
    )
    for (const row of pending as any[]) {
      try {
        await saveToFirestore(JSON.parse(row.data))
        await this.db!.runAsync('UPDATE test_results SET synced = 1 WHERE id = ?', [row.id])
      } catch {
        // Will retry on next sync
      }
    }
    return pending.length
  }

  // Check if we're online
  async isOnline(): Promise<boolean> {
    try {
      const response = await fetch('https://firestore.googleapis.com', { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  }
}

export const offlineManager = new OfflineManager()
```

---

## Step 4: Testing Without App Stores

### Development Testing (Expo Go)
```bash
# Start dev server
npx expo start

# Scan QR code with Expo Go app (iOS/Android)
# OR press 'i' for iOS simulator, 'a' for Android emulator
```

### Preview Builds (EAS Build)
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build preview APK (Android) — share via link
eas build --platform android --profile preview

# Build preview IPA (iOS) — requires Apple Developer account
eas build --platform ios --profile preview
```

### eas.json Configuration:
```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

### Internal Distribution (No App Store Needed!)
```bash
# Android: Generates downloadable APK link
eas build --platform android --profile preview

# iOS: Internal distribution via TestFlight or ad-hoc
eas build --platform ios --profile preview

# Share the build link with testers directly!
```

---

## Step 5: App Store Submission (When Ready)

### iOS (App Store Connect)
```bash
eas submit --platform ios
```
Requires Apple Developer account ($99/year).

### Android (Google Play)
```bash
eas submit --platform android
```
Requires Google Play Developer account ($25 one-time).

---

## Shared Code Strategy

The following modules can be shared between web and mobile with minimal changes:

| Module | Sharing Strategy |
|--------|-----------------|
| `lib/constants.ts` | Copy directly — no platform-specific code |
| `lib/db.ts` | Copy directly — Firestore API is identical |
| `lib/ai-providers.ts` | Copy directly — uses `fetch()` which works in RN |
| `lib/content-engine.ts` | Copy with minor changes (file parsing uses browser APIs) |
| `lib/question-generator.ts` | Copy directly |
| Auth context | Rewrite — different Firebase Auth init for RN |
| UI components | Rewrite — React Native components vs HTML/CSS |

---

## App Identifiers

| Platform | Bundle/Package ID |
|----------|-------------------|
| iOS | `com.studyflow.app` |
| Android | `com.studyflow.app` |
| Web | `studyflow-f2e7a.web.app` |

---

## Estimated Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| 1. Scaffold + Auth | 1-2 weeks | Login, signup, Google/Apple auth working |
| 2. Core Learning | 2-3 weeks | Browse packages, learn mode (cards), basic tests |
| 3. Offline + Sync | 1 week | Cached courses, queued test results |
| 4. AI Features | 1-2 weeks | Study Buddy, AI mentor, podcast player |
| 5. Social + Gamification | 1 week | Streaks, badges, leaderboards, following |
| 6. Polish + Testing | 1-2 weeks | Animations, haptics, accessibility, beta testing |
| 7. App Store | 1 week | Screenshots, descriptions, submission |

**Total: ~8-12 weeks for production-ready mobile apps**
