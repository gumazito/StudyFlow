# HTML → Next.js Parity Checklist

**CRITICAL RULE: index.html must NEVER be modified during development. Only Next.js files are edited.**

## Status: ~65% complete after content engine + question generator migration

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

## Publisher — ✅ MOSTLY COMPLETE
- ✅ Create packages
- ✅ Full package editor (Details/Content/Preview tabs)
- ✅ Upload research content (PDF, TXT, DOCX parsing)
- ✅ Upload practice test content (separate type)
- ✅ Publish/unpublish
- ✅ Auto-research toggle with AI key management
- ✅ AI auto-research (Claude/ChatGPT)
- ✅ Search packages
- ✅ Editable facts (edit/delete inline)
- ✅ Custom branding (colour, icon)
- ✅ Publisher analytics with CSV export
- ❌ Course templates (7 built-in)
- ❌ Template picker overlay
- ❌ Course collaboration (owner/contributor)
- ❌ Cross-publish to groups (link/copy UI)
- ❌ Bulk student invite
- ❌ PDF export of results

## Learner — 🔄 NEEDS WORK
- ✅ Browse courses with search
- ✅ MCQ test engine
- ✅ True/False test engine
- ✅ Select All That Apply test engine
- ✅ Score screen
- ✅ Test results saved to Firestore
- ✅ Retry wrong answers with explanations
- ✅ Flash card learn mode
- ✅ Gamification bar (XP, level, streak)
- ✅ Badge awarding
- ✅ Quick stats bar
- ✅ My Progress tab (basic)
- ❌ Smart filters: Active, New, In Progress, Completed
- ❌ Year-level course filtering
- ❌ Scroll mode (TikTok-style)
- ❌ Spaced repetition confidence rating
- ❌ Review mode (due cards prioritised)
- ❌ Practice-test-only vs Full Course toggle
- ❌ Category filtering for tests
- ❌ Configurable question count (5/10/15/20)
- ❌ Course detail screen with test history
- ❌ Mark courses as complete
- ❌ Send feedback to publisher
- ❌ Dual ratings
- ❌ New course announcements banner
- ❌ Accept/decline follow/mentor requests inline
- ❌ Cheers notification banner

## Social — ❌ NOT STARTED
- ❌ Search learners by name/email
- ❌ Send/accept/decline follow requests
- ❌ Following list with progress
- ❌ Send cheers
- ❌ Receive cheers notification
- ❌ Leaderboard
- ❌ Activity feed

## Gamification — 🔄 PARTIAL
- ✅ XP, levels, streaks, badges
- ✅ Gamification bar
- ✅ Badge awarding on test complete
- ❌ Badge unlock popup animation
- ❌ Leaderboard
- ❌ Activity feed

## Mentor — ✅ COMPLETE
- ✅ All features migrated

## Groups — 🔄 PARTIAL
- ✅ Create, manage, browse, invite
- ✅ School lookup, official flag
- ❌ Join request approval UI
- ❌ Verification form
- ❌ Personal group auto-creation
- ❌ Group selector on role picker
- ❌ Auto-join via URL params

## Profile — ✅ MOSTLY COMPLETE
- ✅ All edit features
- ✅ Role requests
- ✅ Delete account
- ❌ View roles with icons

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

## UI/UX
- ✅ Dark/light mode
- ✅ Toast notifications
- ❌ Modal system (confirm/prompt)
- ❌ Processing overlay spinner

## DevOps
- ✅ Next.js + TypeScript + Tailwind
- ✅ Firebase SDK + env vars
- ✅ Build passes
- ❌ Firebase Hosting deploy
- ❌ Staging environment

---

## Remaining Count: ~35 items
## Priority Order:
1. Learner features (filters, test config, course detail, feedback, ratings)
2. Social system (following, cheers, leaderboard)
3. Groups (join requests, verification, personal groups)
4. Publisher advanced (templates, collaboration, cross-publish)
5. UI polish (modals, spinners, badge popups)
6. DevOps (Firebase Hosting deploy)
