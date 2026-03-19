# StudyFlow Architecture Rebuild Strategy

## Executive Summary

StudyFlow is a social learning platform for Australian high school students. The current prototype (single HTML file, 5000+ lines) has validated the product concept with 40+ features across learning, testing, gamification, social, mentoring, and group management. This document outlines the strategy for rebuilding StudyFlow as a production-grade application capable of supporting thousands of users, mobile apps, paid subscriptions, and rich media.

## Current State

**What exists today (Phases 1-4 complete):**
- Single `index.html` file (5000+ lines of React + inline CSS)
- Firebase Auth (email/password) + Firestore (NoSQL database)
- GitHub Pages hosting (static, public repo)
- 40+ features including: auth, admin, publisher, learner, mentor, groups, gamification, social following, spaced repetition, AI auto-research, course templates, dark/light mode, and more

**What cannot be built on the current architecture:**
- Server-side API integrations (Spotify OAuth, ABN lookup, TTS APIs)
- File uploads (verification documents, video/audio content)
- Background jobs (email/SMS notifications, AI credit monitoring)
- Mobile apps (iOS/Android)
- Payment processing (Stripe/subscription management)
- Real-time features at scale (WebSocket notifications)
- Proper security (API keys in environment variables, not source code)

## Target Architecture

```
┌─────────────────────────────────────────────┐
│              Client Applications             │
├──────────┬──────────┬──────────┬────────────┤
│ Next.js  │  iOS App │ Android  │  Admin     │
│ Web App  │ (React   │  App     │  Panel     │
│          │  Native) │ (React   │  (Next.js) │
│          │          │  Native) │            │
└────┬─────┴────┬─────┴────┬─────┴─────┬──────┘
     │          │          │           │
     └──────────┴──────────┴───────────┘
                    │
     ┌──────────────┴──────────────┐
     │     API Layer (Next.js      │
     │     API Routes / Cloud      │
     │     Functions)              │
     ├─────────────────────────────┤
     │ - Auth middleware           │
     │ - AI provider proxy/router  │
     │ - Spotify OAuth proxy       │
     │ - TTS generation            │
     │ - File upload handling      │
     │ - Email/SMS dispatch        │
     │ - Payment webhooks          │
     │ - ABN/ACARA lookup proxy    │
     │ - Push notification dispatch│
     └─────────────┬───────────────┘
                   │
     ┌─────────────┴───────────────┐
     │     Firebase Services        │
     ├──────────┬──────────────────┤
     │ Auth     │ Firestore (DB)   │
     │ Storage  │ Cloud Messaging  │
     │ Hosting  │ Analytics        │
     └──────────┴──────────────────┘
                   │
     ┌─────────────┴───────────────┐
     │     External Services        │
     ├──────────┬──────────────────┤
     │ Stripe   │ AI Providers     │
     │ SendGrid │ (Claude, GPT,    │
     │ Twilio   │  Gemini, Grok)   │
     │ Spotify  │ ElevenLabs (TTS) │
     │ ABR API  │ ACARA API        │
     └──────────┴──────────────────┘
```

## Rebuild Principles

1. **Incremental releases** — Every sprint produces a deployable, working application. No "big bang" rewrite where everything breaks for weeks.

2. **Feature parity first** — Before adding new features, ensure all existing features work in the new architecture.

3. **One migration at a time** — Move one component/feature to the new architecture per sprint, verify it works, then move the next.

4. **Keep the old app running** — The current HTML file stays live on GitHub Pages until the new app is fully deployed and verified.

5. **Mobile-first design** — All new UI work should be responsive-first, designed for mobile then adapted for desktop.

6. **Test before deploy** — Every sprint includes automated tests for the features being built/migrated.

## Sprint Structure

Each sprint is 1-2 working sessions (with Claude or a developer). Each sprint produces a deployable increment.

---

### Sprint 0: Foundation (MUST DO FIRST)
**Goal:** Set up the project, CI/CD, and deploy an empty shell.

- [ ] Create Next.js 14+ project with TypeScript, Tailwind, App Router
- [ ] Set up Firebase SDK (Auth, Firestore, Storage)
- [ ] Create environment variables for all API keys
- [ ] Set up Firebase Hosting (replaces GitHub Pages)
- [ ] Configure GitHub Actions for auto-deploy to Firebase
- [ ] Create staging environment (separate Firebase project: `studyflow-staging`)
- [ ] Set up Playwright for end-to-end tests
- [ ] Deploy empty app to production URL
- [ ] Verify deployment pipeline works: push → test → deploy

**Deliverable:** Empty app live at `studyflow.web.app` with working CI/CD.

---

### Sprint 1: Auth + Core Layout
**Goal:** Users can log in and see the role picker.

- [ ] Migrate Firebase Auth (login, signup, forgot password, DOB)
- [ ] Create AuthContext provider
- [ ] Create ThemeContext (dark/light mode)
- [ ] Build shared layout: Nav, Toast, Modal components
- [ ] Build role picker screen
- [ ] Build pending approval / rejected screens
- [ ] Migrate system admin auto-detection
- [ ] Migrate multi-role support (learner, publisher, mentor, admin)
- [ ] Write tests for auth flows

**Deliverable:** Users can sign up, log in, and see their role options.

---

### Sprint 2: Admin Dashboard
**Goal:** Admin can manage users, roles, and verifications.

- [ ] Build Admin Dashboard page
- [ ] Migrate user management (view, approve, reject, toggle roles)
- [ ] Migrate notifications feed
- [ ] Migrate group verification review panel
- [ ] Write tests for admin flows

**Deliverable:** Admin can manage all users and review group verifications.

---

### Sprint 3: Groups System
**Goal:** Users can create, join, and manage groups.

- [ ] Build Groups page (list, create, manage, browse)
- [ ] Migrate group types, school lookup (ACARA), official flag
- [ ] Migrate invite link system (URL params, auto-join)
- [ ] Migrate join request approval/rejection
- [ ] Migrate verification form and workflow
- [ ] Build group selector in navigation
- [ ] Create API route for ACARA school lookup proxy
- [ ] Create API route for ABN lookup proxy (register for ABR GUID)
- [ ] Add Firebase Storage for verification document upload
- [ ] Write tests for group flows

**Deliverable:** Full group management with school lookup and document upload.

---

### Sprint 4: Publisher / Content Management
**Goal:** Publishers can create and manage courses.

- [ ] Build Publisher dashboard page
- [ ] Migrate package editor (details, content tabs)
- [ ] Migrate file upload and parsing (PDF, TXT, DOCX)
- [ ] Migrate auto-research (AI + built-in knowledge bank)
- [ ] Migrate editable facts
- [ ] Migrate cross-publish to groups
- [ ] Migrate course templates
- [ ] Migrate collaborators and branding
- [ ] Migrate publisher analytics with CSV/PDF export
- [ ] Write tests for publisher flows

**Deliverable:** Publishers can create, edit, and publish courses with all existing features.

---

### Sprint 5: AI Provider System
**Goal:** Multi-AI provider support with automatic fallback.

- [ ] Build AI Settings page in user Profile
- [ ] Support Claude, ChatGPT, Gemini, Grok API keys
- [ ] Build guided setup wizard per provider
- [ ] Create API route to proxy AI calls (keys never in client)
- [ ] Implement automatic fallback rotation
- [ ] Add credit monitoring (where APIs support it)
- [ ] Add provider status indicators in Profile
- [ ] Write tests for AI provider flows

**Deliverable:** Users can configure multiple AI providers with automatic failover.

---

### Sprint 6: Learner Core + Test Engine
**Goal:** Learners can browse courses, learn, and take tests.

- [ ] Build Learner dashboard page
- [ ] Migrate course browse with search, filters, year-level matching
- [ ] Migrate group filter for courses
- [ ] Migrate Micro-Learn mode (swipe cards + scroll + spaced repetition)
- [ ] Migrate test engine (MCQ, True/False, Select All, practice-test toggle)
- [ ] Migrate score screen
- [ ] Migrate test result persistence
- [ ] Migrate course detail screen with test history
- [ ] Migrate My Progress tab
- [ ] Migrate mark-as-complete
- [ ] Migrate feedback and dual ratings
- [ ] Write tests for learner flows

**Deliverable:** Complete learning and testing experience.

---

### Sprint 7: Gamification + Social
**Goal:** XP, badges, following, leaderboards, cheers.

- [ ] Migrate gamification engine (XP, levels, streaks, badges)
- [ ] Build gamification bar UI
- [ ] Migrate badge unlock popup
- [ ] Migrate social following (search, request, accept/decline)
- [ ] Migrate cheers/encouragement system
- [ ] Migrate leaderboard
- [ ] Migrate activity feed
- [ ] Write tests for gamification and social

**Deliverable:** Full gamification and social features.

---

### Sprint 8: Mentor System
**Goal:** Mentors can track and guide learners.

- [ ] Build Mentor dashboard page
- [ ] Migrate mentor request flow (request, approve/decline)
- [ ] Migrate mentee detail view (stats, test history, progress)
- [ ] Write tests for mentor flows

**Deliverable:** Mentor system fully operational.

---

### Sprint 9: User Profile + Notifications
**Goal:** Profile management, notification preferences, email/SMS.

- [ ] Build Profile page (edit name, email, password, DOB)
- [ ] Migrate role change requests
- [ ] Migrate delete profile / right to be forgotten
- [ ] Integrate SendGrid for email notifications
- [ ] Integrate Twilio for SMS notifications (optional)
- [ ] Build notification preferences per user per group
- [ ] Add email notifications: new signup, course published, test results
- [ ] Add in-app notification centre
- [ ] Write tests for profile and notifications

**Deliverable:** Full profile management with email/SMS notifications.

---

### Sprint 10: Media — Video + Audio
**Goal:** Publishers can add video/audio content, learners can consume it.

- [ ] Add YouTube/Vimeo embed support in course editor
- [ ] Add direct video upload via Firebase Storage
- [ ] Build video player in learn mode
- [ ] Create API route for TTS generation (ElevenLabs or OpenAI TTS)
- [ ] Build "Podcast mode" — auto-generate audio summaries
- [ ] Build audio player UI in learn mode
- [ ] Add background audio playback
- [ ] Write tests for media features

**Deliverable:** Video and audio content in courses.

---

### Sprint 11: Spotify + Social Music
**Goal:** Integrated music player with social features.

- [ ] Register Spotify Developer App
- [ ] Create API route for Spotify OAuth token exchange
- [ ] Build embedded Spotify player component
- [ ] Add song/playlist search
- [ ] Add "currently listening" status to social profile
- [ ] Add hi-5/cheer for listening activity
- [ ] Build study music playlist suggestions
- [ ] Write tests for Spotify integration

**Deliverable:** Spotify integration with social music sharing.

---

### Sprint 12: AI Study Plans + Voice
**Goal:** AI-powered personalised study plans and voice interaction.

- [ ] Build study plan generator (analyses weak areas, creates daily/weekly plan)
- [ ] Add voice input for test answers (Web Speech API)
- [ ] Build "Study Buddy" — conversational AI tutor
- [ ] Add speech-to-text for learning mode
- [ ] Write tests for AI features

**Deliverable:** Personalised AI study plans and voice-based learning.

---

### Sprint 13: Payments + Subscription Plans
**Goal:** Free and paid tiers with Stripe integration.

- [ ] Define tier structure (Free, Plus, Pro, School)
- [ ] Integrate Stripe for subscription management
- [ ] Build pricing page
- [ ] Build subscription management in Profile
- [ ] Implement feature gating based on tier
- [ ] Add Stripe webhook handlers
- [ ] Build admin billing dashboard
- [ ] Write tests for payment flows

**Deliverable:** Working subscription system with free and paid tiers.

---

### Sprint 14: Mobile Apps
**Goal:** iOS and Android apps via React Native.

- [ ] Set up React Native / Expo project
- [ ] Share core logic and Firebase config with web app
- [ ] Build mobile auth screens
- [ ] Build mobile learner experience (swipe cards, tests)
- [ ] Build mobile gamification UI
- [ ] Build mobile social features
- [ ] Add push notifications (Firebase Cloud Messaging)
- [ ] Submit to App Store and Google Play
- [ ] Write mobile tests

**Deliverable:** StudyFlow on iOS and Android.

---

### Sprint 15: Polish + Scale
**Goal:** Production hardening and performance.

- [ ] Performance audit and optimisation
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Security audit (penetration testing, rate limiting)
- [ ] Database index optimisation
- [ ] Firestore security rules tightened per collection per group
- [ ] Error tracking (Sentry or similar)
- [ ] Analytics dashboard (user engagement, retention)
- [ ] Documentation (API docs, developer guide, user guide)
- [ ] Load testing

**Deliverable:** Production-ready, scalable, secure application.

---

## Deployment Strategy

### Environment Setup
| Environment | URL | Firebase Project | Branch |
|-------------|-----|-----------------|--------|
| Development | localhost:3000 | studyflow-dev | feature/* |
| Staging | staging.studyflow.web.app | studyflow-staging | staging |
| Production | studyflow.web.app | studyflow-f2e7a | main |

### Release Process
1. Developer works on feature branch
2. Push triggers CI: lint + type check + unit tests
3. Create Pull Request to `staging`
4. PR triggers: full test suite + preview deployment
5. Manual QA on staging
6. Merge to `main`
7. Auto-deploy to production
8. Smoke tests run against production

### Database Migration
- Sprint 0 creates a migration script to move existing Firestore data into the new schema
- Each sprint that changes the data model includes a migration script
- Migrations are idempotent (safe to run multiple times)

## Technology Choices

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Frontend | Next.js 14 + React 18 | SSR, API routes, file-based routing, huge ecosystem |
| Styling | Tailwind CSS | Consistent, mobile-first, fast to build |
| Language | TypeScript | Type safety prevents bugs at scale |
| Database | Firestore | Already in use, scales well, real-time listeners |
| Auth | Firebase Auth | Already in use, supports email, Google, Apple |
| Storage | Firebase Storage | File uploads for docs, video, audio |
| Hosting | Firebase Hosting | Private repo, CDN, custom domain, free SSL |
| CI/CD | GitHub Actions | Already set up, free for public repos |
| Email | SendGrid | Free tier: 100 emails/day, reliable delivery |
| SMS | Twilio | Pay-per-message, good Australia coverage |
| Payments | Stripe | Industry standard, great docs, supports AUD |
| Music | Spotify Web API | Free tier available, embedded player SDK |
| TTS | OpenAI TTS or ElevenLabs | High quality, API-based, reasonable cost |
| AI | Claude, ChatGPT, Gemini, Grok | Multi-provider with fallback |
| Mobile | React Native / Expo | Share code with web, single codebase |
| Testing | Playwright + Vitest | E2E + unit testing |
| Monitoring | Sentry | Error tracking and performance monitoring |

## Estimated Timeline

| Sprint | Duration | Features |
|--------|----------|----------|
| 0 | 1 session | Foundation + CI/CD |
| 1-2 | 1-2 sessions | Auth + Admin |
| 3-4 | 2-3 sessions | Groups + Publisher |
| 5-6 | 2-3 sessions | AI Providers + Learner |
| 7-8 | 1-2 sessions | Gamification + Social + Mentor |
| 9 | 1 session | Profile + Notifications |
| 10-11 | 2-3 sessions | Media + Spotify |
| 12 | 1-2 sessions | AI Study Plans + Voice |
| 13 | 2 sessions | Payments |
| 14 | 3-4 sessions | Mobile Apps |
| 15 | 1-2 sessions | Polish + Scale |
| **Total** | **~16-24 sessions** | **Complete platform** |

## Cost Estimates (Monthly, at Scale)

| Service | Free Tier | Estimated Cost (1000 users) |
|---------|-----------|----------------------------|
| Firebase (Auth + Firestore) | 50K reads/day | $0-25/mo |
| Firebase Hosting | 10GB storage | $0/mo |
| Firebase Storage | 5GB | $0-5/mo |
| SendGrid | 100 emails/day | $0/mo |
| Twilio | - | $10-50/mo |
| Stripe | 2.9% + 30c per tx | Per transaction |
| Spotify API | Free | $0/mo |
| AI APIs | Varies | User-provided keys |
| Domain name | - | $15/year |
| **Total** | | **$0-80/mo** |

---

*Document created: March 19, 2026*
*Author: Claude (AI) + Courtenay Hollis*
*Project: StudyFlow — Interactive Learning Platform*
