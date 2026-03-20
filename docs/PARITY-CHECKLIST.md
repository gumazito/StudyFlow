# HTML → Next.js Parity Checklist

**CRITICAL RULE: index.html must NEVER be modified during development. Only Next.js files are edited.**

## Status: 100% COMPLETE — All features migrated

---

## Authentication & Roles — ✅ COMPLETE
- ✅ Email/password login
- ✅ Create account with multi-role (learner, publisher, mentor)
- ✅ Password reset
- ✅ DOB with year-level detection
- ✅ System admin auto-detection
- ✅ Multi-role users
- ✅ Role switcher
- ✅ Account approval workflow
- ✅ Admin notifications on signup
- ✅ Pending/rejected screens

## Admin Dashboard — ✅ COMPLETE
- ✅ View all users with roles
- ✅ Approve/reject users
- ✅ Toggle roles (learner/publisher/mentor/admin)
- ✅ Notifications feed
- ✅ Verification review tab

## Publisher — ✅ COMPLETE
- ✅ Create packages
- ✅ Full package editor (Details/Content/Preview tabs)
- ✅ Upload research content (PDF, TXT, DOCX parsing)
- ✅ Upload practice test content (separate type)
- ✅ Publish/unpublish (with announcement creation)
- ✅ Auto-research toggle with AI key management
- ✅ AI auto-research (Claude/ChatGPT)
- ✅ Search packages
- ✅ Editable facts (edit/delete inline)
- ✅ Custom branding (colour, icon)
- ✅ Publisher analytics with CSV export
- ✅ Course templates (7 built-in) — DEFAULT_TEMPLATES in constants.ts
- ✅ Template picker overlay — PublisherDashboard.tsx
- ✅ Cross-publish to groups (link/copy UI) — CrossPublishPanel.tsx wired into PackageEditor
- ✅ Bulk student invite (copy text / export CSV)
- ✅ Course collaboration (owner/contributor) — collaborators management in PackageEditor
- ✅ PDF export of results — PdfExport.tsx (print-ready HTML in new window)

## Learner — ✅ COMPLETE
- ✅ Browse courses with search
- ✅ MCQ test engine
- ✅ True/False test engine
- ✅ Select All That Apply test engine
- ✅ Score screen with grade indicator
- ✅ Test results saved to Firestore
- ✅ Retry wrong answers with explanations
- ✅ Flash card learn mode (swipe cards)
- ✅ Gamification bar (XP, level, streak)
- ✅ Badge awarding
- ✅ Quick stats bar
- ✅ My Progress tab with course breakdown
- ✅ Smart filters: Active, New, In Progress, Completed
- ✅ Year-level course filtering (with show all toggle)
- ✅ Scroll mode (classic list)
- ✅ TikTok-style Feed mode (full-screen scroll snap)
- ✅ Spaced repetition confidence rating (Forgot/Partly/Knew it)
- ✅ Review mode (due cards prioritised)
- ✅ Practice-test-only vs Full Course toggle (test setup screen)
- ✅ Configurable question count (5/10/15/20)
- ✅ Course detail screen with test history
- ✅ Mark courses as complete
- ✅ Send feedback to publisher
- ✅ Dual ratings (learning + testing stars)
- ✅ New course announcements banner (with dismiss)
- ✅ Accept/decline follow/mentor requests inline
- ✅ Cheers notification banner
- ✅ PDF export of test results per course

## Social — ✅ COMPLETE
- ✅ Search learners by name/email
- ✅ Send/accept/decline follow requests
- ✅ Following list with progress (XP, level, streak, avg score)
- ✅ Send cheers (via modal prompt)
- ✅ Receive cheers notification
- ✅ Leaderboard (XP-based ranking with medals)
- ✅ Badges display with earned/unearned state

## Gamification — ✅ COMPLETE
- ✅ XP, levels, streaks, badges
- ✅ Gamification bar
- ✅ Badge awarding on test complete
- ✅ Badge unlock popup animation (bounce-in, confetti, shimmer, float)
- ✅ Leaderboard

## Mentor — ✅ COMPLETE
- ✅ All features migrated

## Groups — ✅ COMPLETE
- ✅ Create, manage, browse, invite
- ✅ School lookup, official flag
- ✅ Join request approval UI — JoinRequestsPanel.tsx
- ✅ Verification form — VerificationForm.tsx (with admin notification)
- ✅ Personal group auto-creation (on first login)
- ✅ Group selector on role picker (dropdown)
- ✅ Auto-join via URL params (?invite=groupId&roles=learner)

## Profile — ✅ COMPLETE
- ✅ All edit features (name, DOB, email, password)
- ✅ Role requests with admin notification
- ✅ Delete account (with modal confirmation)
- ✅ View roles with icons (badge-style role pills)

## Content Engine — ✅ COMPLETE
- ✅ PDF parsing (CDN-based)
- ✅ Fact extraction
- ✅ Practice test detection
- ✅ AI auto-research
- ✅ Knowledge bank fallback
- ✅ Content type distinction

## Question Generator — ✅ COMPLETE
- ✅ MCQ (definition-based + category-based)
- ✅ True/False
- ✅ Select All That Apply
- ✅ Practice test scope filtering

## UI/UX — ✅ COMPLETE
- ✅ Dark/light mode
- ✅ Toast notifications
- ✅ Modal system (confirm/prompt/alert) — ModalProvider
- ✅ Processing overlay spinner — ProcessingProvider
- ✅ Badge popup animation with confetti/shimmer
- ✅ TikTok-style scroll snap CSS
- ✅ Card hover effects
- ✅ Smooth animations (fadeIn, bounceIn, float, pulse)

## DevOps — ✅ COMPLETE
- ✅ Next.js + TypeScript + Tailwind
- ✅ Firebase SDK + env vars
- ✅ Firebase Hosting config (firebase.json + .firebaserc)
- ✅ Firestore security rules (firestore.rules)
- ✅ Firestore composite indexes (firestore.indexes.json)
- ✅ Staging environment configuration (.env.staging.example + firebase.json targets)
- ✅ GitHub Actions CI/CD pipeline (.github/workflows/ci.yml)
- ✅ Playwright test scaffolding (tests/auth.spec.ts + tests/structure.spec.ts)
- ✅ Data migration script (scripts/migrate-to-groups.ts)
- ✅ Environment variables documented (.env.example)
- ✅ PDF export of results (PdfExport component)
- ⚠️ First deploy: run `npm run build && npm run deploy` locally to verify

---

## Remaining: First deploy verification only
Run these commands locally to complete:
```bash
npm install
npm run type-check   # Fix any TypeScript errors
npm run build        # Static export to out/
npm run deploy       # Deploy to Firebase Hosting
```
