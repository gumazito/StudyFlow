# StudyFlow Feature Tracker

## Status Key
- ✅ DONE — Built and working
- 🔨 THIS SESSION — Building now
- 📋 NEXT SESSION — Queued for next session
- 💡 IDEA — Noted but not yet planned

---

## Phase 1: Core Foundation (React Rebuild) 🔨 THIS SESSION

### Authentication & Roles
- ✅ Firebase email/password login
- ✅ Create account with role selection
- ✅ Password reset via email
- ✅ System admin auto-detection (courtenay@hollis.family)
- ✅ Multi-role users (learner, publisher, admin — any combination)
- ✅ Role switcher for multi-role users
- ✅ Account approval workflow (pending → approved/rejected)
- ✅ Admin notification on new signups

### Admin Dashboard
- ✅ View all users with roles
- ✅ Approve/reject pending signups
- ✅ Toggle roles on/off for any user (learner/publisher/admin)
- ✅ Notifications feed
- ✅ Mentor role management (assignable in admin dashboard)

### Publisher (Authoring)
- ✅ Create/edit/delete learning packages
- ✅ Package metadata: name, subject, year level, description
- ✅ Upload research/learning content (PDF, TXT, DOCX, MD, HTML)
- ✅ Upload practice test content (separate from learning content)
- ✅ Content type distinction: research vs practice test
- ✅ Publish/unpublish toggle
- ✅ Auto-research toggle
- ✅ Search packages
- ✅ AI auto-research with real Claude/ChatGPT API
- ✅ AI API key management (add/update/remove key, stored per-user in Firestore)
- ✅ Editable individual facts (edit/delete generated facts inline)
- ✅ Share course with other publishers (owner/contributor roles)
- ✅ Publisher analytics dashboard (per-course, per-student)
- ✅ View student feedback with ratings

### Learner (Studying)
- ✅ Browse published courses
- ✅ Subject and year level filters
- ✅ Micro-learn mode (swipe cards + scroll)
- ✅ Test mode (MCQ, True/False, Select All That Apply)
- ✅ Dynamic question generation from research content
- ✅ Retry wrong answers with explanations
- ✅ Score screen with review of missed questions
- ✅ Search courses
- ✅ Smart filters: Active, New, In Progress, Completed
- ✅ Mark courses as complete
- ✅ Quick stats bar (tests taken, avg score, courses)
- ✅ Course detail screen with test history
- ✅ My Progress tab with cross-course overview
- ✅ Send feedback to publisher
- ✅ Practice-test-only vs broader testing toggle (Full Course / Exam Prep)
- ✅ Test results saved to Firestore
- ✅ DOB/age-based year level auto-detection
- ✅ Age-appropriate course matching (hide higher years by default)
- ✅ Dual ratings (learning content quality + test quality)

### Content & Test Engine
- ✅ Client-side PDF parsing
- ✅ Research fact extraction from uploaded content
- ✅ Practice test pattern detection (question styles, topics)
- ✅ Auto-research from hardcoded knowledge bank
- ✅ Auto-research from real AI API (Claude or ChatGPT)
- ✅ Question generation: MCQ, True/False, Select All
- ✅ Concept-based questions (not memorization)
- ✅ Practice test patterns influence question style weighting
- ✅ Practice-test-only testing scope option (Full Course / Exam Prep toggle)

---

## Phase 2: Social & Gamification ✅ DONE

### Gamification
- ✅ XP points system (earn XP for learning + testing)
- ✅ Daily/weekly streaks with streak counter
- ✅ Achievement badges (10 badges: first test, perfect score, streaks, XP milestones, etc.)
- ✅ Level progression system (11 levels based on XP thresholds)
- ✅ Visual XP bar, level display, streak fire indicator
- ✅ Badge unlock popup animation
- ✅ Leaderboard (shows you + followed learners ranked by XP)

### Social / Following
- ✅ Search for other learners by email
- ✅ Send follow request
- ✅ Accept/decline follow requests
- ✅ View followers/following list with progress
- ✅ See followed learners' XP, level, streak, badges, avg score
- ✅ Send encouragement/cheers with custom messages
- ✅ Receive cheers with notification banner
- ✅ Activity feed from followed learners (recent test scores)

### Mentor Role
- ✅ Mentor role in signup (3-way: Learner, Publisher, Mentor)
- ✅ Mentor requests to add learners (learner must approve)
- ✅ Mentor dashboard: see all mentees with stats
- ✅ Per-mentee detail view: XP, streak, badges, completed courses
- ✅ Test history and scores per mentee (expandable)
- ✅ Search by email to add mentees

### Additional Phase 2 Features
- ✅ DOB/age-based year level auto-detection on signup
- ✅ Age-appropriate course matching (hides higher years, toggle to show all)
- ✅ Dual ratings: learning content quality + test quality (per course)
- ✅ Course collaboration: owner/contributor sharing for publishers
- ✅ Mentor request handling in learner view (accept/decline)

---

## Phase 3: Polish & Scale ✅ DONE

### DevOps
- ✅ GitHub repo + GitHub Pages deployment
- ✅ Firebase Hosting option documented
- ✅ Staging environment guide (STAGING-GUIDE.md with branch-based + local + Netlify options)
- ✅ GitHub Actions CI/CD pipeline (deploy.yml — auto-deploys on push to main)
- ✅ Automated test suite (test.yml — structural, Firebase, feature completeness, syntax checks)
- ✅ Branch protection rules guide (BRANCH-PROTECTION.md with step-by-step setup)

### Publisher Collaboration
- ✅ Course owner vs contributor roles (set in package editor)
- ✅ Invite other publishers by email
- ✅ Remove collaborators
- ✅ Contributor permissions enforcement (contributors can edit but not delete)

### Advanced Features
- ✅ Spaced repetition algorithm for learn mode (confidence rating: forgot/partly/knew it)
- ✅ Smart review mode (due-for-review cards prioritized)
- ✅ Export test results as CSV
- ✅ Export test results as PDF (print-ready)
- ✅ Course templates (7 templates: blank, AI-researched, practice test prep, subject-specific)
- ✅ Bulk student invite via email list + CSV export
- ✅ New course announcements (in-app notification for learners)
- ✅ Custom branding per publisher (brand colour, icon, display name)
- ✅ User profile screen (edit name, DOB, email, password, request roles)
- ✅ Professional toast notifications (replaced all browser alert/prompt dialogs)

---

## Phase 4: Groups & Multi-Tenancy ✅ DONE

### Groups System
- ✅ Group data model (id, name, type, members, roles, inviteCode, shareLinks)
- ✅ Group types: school, company, personal, community, other
- ✅ Create group (any approved user)
- ✅ Group admin role (creator is default admin)
- ✅ Search and add users to group by name/email
- ✅ Unique invite link with pre-set roles (copy link)
- ✅ Invite code displayed for manual sharing
- ✅ Existing users click invite link → login → auto-join group
- ✅ Group admin manages member roles (L/P/M/A toggles per member)
- ✅ Official vs Community flag for schools/companies
- ✅ Users can search and browse all groups + request to join
- ✅ Default personal group auto-created for every user
- ✅ Super user (courtenay@hollis.family) has access to all groups
- ✅ ACARA school name lookup (MySchool API integration)
- ✅ ABN company lookup (Cloud Function proxy to ABR API)
- ✅ Group join requests: approval/rejection UI in group admin view
- ✅ Migrate existing content into default test group (scripts/migrate-to-groups.ts)

### Official Group Verification Workflow
- ✅ When creating an "Official" school/company group, require verification submission
- ✅ Collect: official contact name, office phone, mobile phone, official email address
- ✅ For companies: ABN field required
- ✅ Verification request sent to super admin for review (stored in Firestore)
- ✅ Super admin Verifications tab: review details, approve (→ Official badge) or reject with reason
- ✅ Group shows verification status: pending/approved/rejected with ability to resubmit
- ✅ Official badge displayed on group card
- ✅ Community groups do NOT need verification
- ✅ PDF upload of letterhead via Firebase Storage (FileUpload component wired into VerificationForm)

### Cross-Group Content
- ✅ Cross-publish DB helpers (link mode + copy mode)
- ✅ Cross-publish UI in package editor: select target groups with Link or Copy buttons
- ✅ Two modes: "Link" (shared reference) or "Copy" (independent duplicate)
- ✅ Group filter in learner course browse view (chip filter per group)
- ✅ Course card shows which group it belongs to (📂 badge)
- ✅ New packages automatically tagged with active group context
- ✅ Linked courses: propagation of updates (Sync Now button in PackageEditor + DB propagation)

### Account Management
- ✅ Delete profile / right to be forgotten (deletes all user data from Firestore + Auth)
- ✅ Dark mode / light mode toggle (persists during session)

---

## Phase 5: Media, Music & Social Audio — ✅ DONE

### Spotify Music Integration — ✅ DONE
- ✅ Embedded Spotify player (iframe embed with free radio mode)
- ✅ Search for songs, artists, or playlists within the app (requires connected account)
- ✅ Study music presets (Lo-Fi Study Beats, Deep Focus, Peaceful Piano, Nature Sounds, Classical Focus)
- ✅ Spotify OAuth via Cloud Function (token exchange + refresh)
- ✅ Connection status indicator in player
- ✅ "Currently listening" status visible to followers (real-time Firestore broadcasting, 5-min expiry)
- ✅ Hi-5 / cheer for what someone is listening to (integrated into follower cards)
- ✅ Social music sharing (share a song/playlist with followers, "🎶 Shared With You" section)

### Audio Learning (Podcast-Style) — ✅ DONE
- ✅ AI text-to-speech: convert course facts into audio via Cloud Function (OpenAI TTS / ElevenLabs)
- ✅ "Podcast mode" — sequential audio playback of course facts in learn mode
- ✅ Audio player UI with play/pause/skip controls + progress bar
- ✅ Voice selector (Nova, Alloy, Echo, Shimmer)
- ✅ Auto-play next fact when current finishes
- ✅ Audio caching to Firebase Storage for repeat plays
- ✅ Background playback support (audio service worker + MediaSession API for lock-screen controls)

### Video Content — ✅ DONE
- ✅ Publishers can embed video content (YouTube, Vimeo) in course editor
- ✅ Video player in learn mode alongside flash cards (switchable between videos)
- ✅ Direct video upload via Firebase Storage (MP4/MOV/WebM, up to 100MB, in PackageEditor)

### Voice-Based Learning — ✅ DONE (Phase 1)
- ✅ Voice input for answering True/False test questions (Web Speech API, browser-native)
- ✅ Visual listening indicator with interim transcript
- ✅ Graceful fallback for unsupported browsers
- ✅ "Study buddy" — conversational AI tutor with personality styles (encouraging/strict/humorous)

### AI-Powered Study Plan Generator — ✅ DONE
- ✅ Analyse learner's test results, weak areas, and progress
- ✅ Generate a personalised 7-day study plan via AI
- ✅ Prioritise topics where scores are lowest
- ✅ Dynamically generates new plans on demand
- ✅ Uses multi-provider fallback (Claude → ChatGPT → Gemini → Grok)

### Streak Freeze — ✅ DONE
- ✅ Earn streak freeze tokens (1 per 7-day streak milestone, max 3)
- ✅ Auto-uses freeze if learner misses exactly one day
- ✅ Freeze count shown in gamification bar (🧊 indicator)

---

## Phase 6: Multi-AI Provider System — ✅ DONE (client-side)

### Provider Support — ✅ DONE
- ✅ Claude (Anthropic) — API key setup with link to console.anthropic.com
- ✅ ChatGPT (OpenAI) — API key setup with link to platform.openai.com
- ✅ Gemini (Google) — API key setup with link to aistudio.google.com
- ✅ Grok (xAI) — API key setup with link to console.x.ai

### Key Management — ✅ DONE
- ✅ Guided setup wizard per provider (step-by-step with direct links)
- ✅ If user has existing account: direct to API key page
- ✅ Multi-key management in Profile → AI Provider Settings section
- ✅ Visual status per provider: ✅ Connected / Not set up
- ✅ Social login (Google/Apple/Microsoft) via Firebase Auth with signInWithPopup

### Automatic Fallback & Rotation — ✅ DONE
- ✅ Priority order set by user (drag up/down) — persisted to Firestore
- ✅ If primary provider returns error, automatically tries next in priority
- ✅ Content engine (auto-research) uses multi-provider fallback
- ✅ Study plan generator uses multi-provider fallback
- 💡 Credit balance monitoring (requires provider-specific APIs — future enhancement)

### Firebase Storage — ✅ DONE
- ✅ FileUpload component for verification documents (PDF, images, DOCX)
- ✅ Integrated into group verification form (replaces placeholder)

---

## Phase 7: Backend Services (Cloud Functions) — ✅ DONE

### Firebase Cloud Functions Infrastructure — ✅ DONE
- ✅ Functions project setup (TypeScript, Node 18)
- ✅ All functions authenticated via Firebase Auth ID tokens
- ✅ CORS enabled for cross-origin requests from static frontend
- ✅ Environment config via `firebase functions:config:set`

### ABN Company Lookup — ✅ DONE
- ✅ Cloud Function proxy to ABR (Australian Business Register) API
- ✅ ABN validation (11-digit format check)
- ✅ Entity name, type, status, state, postcode extraction from XML response
- ✅ AbnLookup UI component with auto-format + inline lookup button
- ✅ Integrated into group verification form (replaces plain text input)

### Email Notifications (SendGrid) — ✅ DONE
- ✅ Cloud Function for sending email via SendGrid API
- ✅ HTML template support + dynamic template data
- ✅ Admin-only access control
- ✅ Notification logging to Firestore
- ✅ Auto-email on new course announcements (Firestore trigger)
- ✅ Admin notification sender UI (email tab)

### SMS Notifications (Twilio) — ✅ DONE
- ✅ Cloud Function for sending SMS via Twilio API
- ✅ Admin-only access control
- ✅ Notification logging with Twilio SID
- ✅ Admin notification sender UI (SMS tab)

### Payment Processing (Stripe) — ✅ DONE
- ✅ Stripe Checkout session creation (monthly + yearly plans)
- ✅ Stripe webhook handler (checkout.session.completed, subscription.updated/deleted, invoice.payment_failed)
- ✅ Subscription status tracking in Firestore (active/past_due/cancelled)
- ✅ Auto-create Stripe customer on first checkout
- ✅ SubscriptionPanel UI in Profile screen (pricing cards, status indicator)
- ✅ getSubscriptionStatus endpoint

### Push Notifications (FCM) — ✅ DONE
- ✅ Firebase Cloud Messaging service worker (background + foreground)
- ✅ FCM token registration Cloud Function
- ✅ Send push to specific user or all users
- ✅ Auto-push to mentors when mentee completes a test (Firestore trigger)
- ✅ Invalid token cleanup (auto-removes expired FCM tokens)
- ✅ Admin notification sender UI (push tab)
- ✅ Push notification initialization in app providers
- ✅ Foreground message handling (browser notification)

---

## Architecture Rebuild — ✅ COMPLETE (Next.js)

### Rebuild Status
The architecture rebuild from single HTML to Next.js is **complete**. All 40+ features from Phases 1-4 have been migrated.

### Current Architecture: Next.js 14 + Firebase + Cloud Functions

**Frontend (Next.js React) — 25 component files**
- `app/` — layout.tsx, page.tsx, providers.tsx, globals.css
- `components/auth/` — AuthScreen.tsx
- `components/admin/` — AdminDashboard.tsx, NotificationSender.tsx
- `components/publisher/` — PublisherDashboard.tsx, PackageEditor.tsx, CrossPublishPanel.tsx, PdfExport.tsx
- `components/learner/` — LearnerDashboard.tsx, StudyPlanPanel.tsx, VoiceInput.tsx, SpotifyPlayer.tsx, PodcastPlayer.tsx
- `components/mentor/` — MentorDashboard.tsx
- `components/groups/` — GroupsView.tsx, VerificationForm.tsx, JoinRequestsPanel.tsx, FileUpload.tsx, AbnLookup.tsx
- `components/profile/` — ProfileScreen.tsx, AiProviderSettings.tsx, SubscriptionPanel.tsx
- `components/layout/` — RolePicker.tsx
- `lib/contexts/` — AuthContext.tsx, ThemeContext.tsx (Toast, Modal, Processing)
- `lib/` — firebase.ts, db.ts, constants.ts, question-generator.ts, ai-providers.ts, content-engine.ts, cloud-functions.ts, push-notifications.ts

**Backend (Firebase Cloud Functions) — 6 function modules**
- `functions/src/index.ts` — Entry point, re-exports all functions
- `functions/src/abn-lookup.ts` — ABR API proxy for ABN validation
- `functions/src/spotify.ts` — Spotify OAuth flow (auth, callback, refresh)
- `functions/src/tts.ts` — Text-to-speech (OpenAI TTS / ElevenLabs)
- `functions/src/notifications.ts` — Email (SendGrid) + SMS (Twilio) + auto-notifications
- `functions/src/stripe.ts` — Stripe Checkout, webhooks, subscription status
- `functions/src/push.ts` — FCM push notifications + auto-push triggers

**Database (Firestore — indexed)**
- 16 collections with composite indexes (firestore.indexes.json)
- Security rules per collection (firestore.rules)

**Infrastructure — Ready for deploy**
- ✅ Firebase Hosting config (production + staging targets)
- ✅ GitHub Actions CI/CD (lint → type-check → build → deploy)
- ✅ Playwright test suite (auth + structural tests)
- ✅ Environment variables via .env.local (no keys in source)
- ✅ Staging environment (separate Firebase project)
- ✅ Data migration script (scripts/migrate-to-groups.ts)

---

## Phase 8: Premium, Moderation & Engagement — ✅ DONE

### Feature Gating (Free / Premium Tiers) — ✅ DONE
- ✅ Free-tier limits: 3 courses, 10 tests/day, no audio/video/spotify/study plans
- ✅ Premium tier: unlimited everything (active subscription or trialing)
- ✅ Always-premium accounts bypass all limits (courtenay/savannah/ezrela/ethan @hollis.family)
- ✅ Admin can grant/revoke premium manually for any user or group
- ✅ `lib/feature-gating.ts` — centralised tier enforcement
- ✅ 14-day free trial for first-time subscribers (Stripe Checkout)
- ✅ Subscription cancellation retention flow (reasons → 50% discount / pause / cancel)

### Content Moderation & Safety — ✅ DONE
- ✅ Content flagging system (🚩 report button on follower cards)
- ✅ Content reports admin tab (pending/actioned/dismissed with action buttons)
- ✅ Auto-suspension after 3+ flags (checkAndSuspendUser)
- ✅ Client-side profanity filter on cheers and feedback
- ✅ Terms of Service page (`/terms`)
- ✅ Privacy Policy page (`/privacy`) — GDPR + Australian Privacy Act compliant
- ✅ Cookie Policy page (`/cookies`)
- ✅ Acceptable Use Policy page (`/acceptable-use`)

### Authentication Enhancements — ✅ DONE
- ✅ "Remember me" toggle (browser local vs session persistence)
- ✅ Social login: Google, Apple, Microsoft (signInWithPopup)
- ✅ Invite code entry in onboarding wizard (auto-join group on signup)

### Privacy Controls — ✅ DONE
- ✅ Privacy settings in Profile: appear in search, show progress, show on leaderboard
- ✅ Leaderboard opt-in/opt-out toggle (👁️ Visible / 🙈 Hidden)

### Test Enhancements — ✅ DONE
- ✅ Category filter on test setup (filter by specific topic when course has multiple categories)
- ✅ Group-specific leaderboards (select group → see ranked members)

### Scheduled Notifications — ✅ DONE
- ✅ Weekly progress summary email (Monday 7am AEST via SendGrid + pub/sub schedule)
- ✅ Inactive user reminder (daily 5pm AEST, nudge after 7+ days inactive, one-per-period)

### Remaining Ideas (nice-to-have)
- 💡 Credit balance monitoring for AI providers (requires provider-specific APIs)
- 💡 OAuth login linking for AI providers (Google/OpenAI account binding)

---

*Last updated: March 20, 2026*
*Current status: All phases 1-8 complete. All buildable features implemented.*
*Super admin: courtenay@hollis.family*
*Always-premium: courtenay@hollis.family, savannah@hollis.family, ezrela@hollis.family, ethan@hollis.family*
*Live URL: https://studyflow-f2e7a.web.app (Firebase Hosting)*
*Repo: https://github.com/gumazito/studyflow*
