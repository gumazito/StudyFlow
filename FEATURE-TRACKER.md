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
- 📋 ABN company lookup (requires backend proxy — ABR API needs registered GUID key)
- ✅ Group join requests: approval/rejection UI in group admin view
- 📋 Migrate existing content into default test group (data migration script)

### Official Group Verification Workflow
- ✅ When creating an "Official" school/company group, require verification submission
- ✅ Collect: official contact name, office phone, mobile phone, official email address
- ✅ For companies: ABN field required
- ✅ Verification request sent to super admin for review (stored in Firestore)
- ✅ Super admin Verifications tab: review details, approve (→ Official badge) or reject with reason
- ✅ Group shows verification status: pending/approved/rejected with ability to resubmit
- ✅ Official badge displayed on group card
- ✅ Community groups do NOT need verification
- 📋 PDF upload of letterhead (requires Firebase Storage — workaround: email to admin)

### Cross-Group Content
- ✅ Cross-publish DB helpers (link mode + copy mode)
- ✅ Cross-publish UI in package editor: select target groups with Link or Copy buttons
- ✅ Two modes: "Link" (shared reference) or "Copy" (independent duplicate)
- ✅ Group filter in learner course browse view (chip filter per group)
- ✅ Course card shows which group it belongs to (📂 badge)
- ✅ New packages automatically tagged with active group context
- 📋 Linked courses: propagation of updates (requires backend sync)

### Account Management
- ✅ Delete profile / right to be forgotten (deletes all user data from Firestore + Auth)
- ✅ Dark mode / light mode toggle (persists during session)

---

## Phase 5: Media, Music & Social Audio (POST-REBUILD) 📋 REQUIRES BACKEND

### Spotify Music Integration
- 📋 Embedded Spotify player (free radio / Web Playback SDK)
- 📋 Search for songs, artists, or playlists within the app
- 📋 "Currently listening" status visible to followers on Social tab
- 📋 Hi-5 / cheer for what someone is listening to
- 📋 Social music sharing (share a song/playlist with followers)
- 📋 Study music playlists (curated or AI-suggested based on subject)
- 📋 Requires: Spotify Developer App registration + OAuth backend proxy

### Audio Learning (Podcast-Style)
- 📋 AI text-to-speech: convert course facts into short audio learning tracks
- 📋 "Podcast mode" — auto-generate hip, engaging audio summaries for young learners
- 📋 Audio player UI integrated into learn mode (play/pause/skip)
- 📋 Background playback support (keep learning while browsing)
- 📋 Requires: TTS API (e.g. ElevenLabs, Google TTS, or OpenAI TTS)

### Video Content
- 📋 Publishers can upload or embed video content (YouTube, Vimeo, or direct upload)
- 📋 Video player in learn mode alongside flash cards
- 📋 Requires: Firebase Storage for direct uploads, or embed URLs for YouTube/Vimeo

### Voice-Based Learning
- 📋 Voice input for answering test questions (speech-to-text)
- 📋 "Study buddy" — conversational AI tutor that explains concepts verbally
- 📋 Requires: Web Speech API (browser-native) + AI API for conversation

### AI-Powered Study Plan Generator
- 📋 Analyse learner's test results, weak areas, and progress
- 📋 Generate a personalised daily/weekly study plan
- 📋 Prioritise topics where scores are lowest
- 📋 Adjust plan dynamically as learner improves
- 📋 Requires: AI API (Claude/ChatGPT) + learner history data

---

## Phase 6: Multi-AI Provider System (POST-REBUILD) 📋 REQUIRES BACKEND

### Provider Support
- 📋 Claude (Anthropic) — API key setup with link to console.anthropic.com
- 📋 ChatGPT (OpenAI) — API key setup with link to platform.openai.com
- 📋 Gemini (Google) — API key setup with link to aistudio.google.com
- 📋 Grok (xAI) — API key setup with link to console.x.ai

### Key Management
- 📋 Guided setup wizard: "Which AI would you like to use?" → step-by-step key creation
- 📋 If user has existing account: direct to API key page
- 📋 If new user: guide through free account creation → then API key
- 📋 OAuth login linking where providers support it (Google/OpenAI)
- 📋 Multi-key management in user Profile → AI Settings section
- 📋 Visual status per provider: ✅ Connected / ❌ Not set up / ⚠️ Low credits

### Automatic Fallback & Rotation
- 📋 Priority order set by user (e.g. Claude first, then ChatGPT, then Gemini)
- 📋 If primary provider returns rate limit or credit error, automatically try next
- 📋 Credit balance monitoring (where API supports it)
- 📋 Alert notification: "Your Claude credits are running low — add more or set up a backup provider"
- 📋 Requires: Backend service to proxy API calls and manage rotation logic

---

## Architecture Rebuild Plan (NEXT MAJOR SESSION)

### Why Rebuild?
The single HTML file has served its purpose as a rapid prototype, but at 4700+ lines it's reached the limit of what's maintainable. The following features CANNOT be built in a static HTML file and require a proper backend:
- Spotify OAuth (requires server-side token exchange)
- ABN/ACARA API proxy (APIs require server-side keys)
- File uploads for verification docs and video/audio content (Firebase Storage)
- Text-to-speech generation (TTS APIs)
- AI provider rotation with credit monitoring (server-side logic)
- Real-time notifications (Firestore listeners need proper setup)
- Proper error handling, loading states, and offline support

### Current Architecture: Single HTML file (4700+ lines)
### Target Architecture: Next.js + Firebase

**Frontend (Next.js React)**
- 30-40 component files, properly organised
- Pages: auth, role-picker, admin, publisher, learner, mentor, groups, profile, social
- Shared components: nav, toast, modal, cards, filters, search
- Context providers: auth, theme, groups, gamification
- Proper routing with Next.js App Router

**Backend (Next.js API Routes or Firebase Cloud Functions)**
- Spotify OAuth proxy + player state management
- ABN lookup via ABR API (registered GUID)
- ACARA school lookup proxy
- Text-to-speech generation endpoint
- AI provider management: key validation, rotation, credit checks
- File upload handling (Firebase Storage)
- Email notifications (Firebase Extensions or SendGrid)

**Database (Firestore — properly indexed)**
- Collections: users, groups, packages, test_results, learner_progress, gamification, feedback, ratings, follow_requests, mentor_requests, cheers, announcements, ai_config, spaced_rep, cross_publish, group_requests, verification_requests
- Composite indexes for all query patterns
- Security rules scoped to groups

**Infrastructure**
- Firebase Hosting (replaces GitHub Pages — private repo)
- Firebase Storage (for file uploads: verification docs, video, audio)
- GitHub Actions CI/CD (auto-deploy on push to main)
- Staging branch → staging Firebase project
- Playwright end-to-end tests
- Proper environment variables (no API keys in source)

---

*Last updated: March 19, 2026*
*Current status: Phases 1-4 complete in single HTML file. Next step: architecture rebuild, then Phase 5-6.*
*Super admin: courtenay@hollis.family*
*Live URL: https://gumazito.github.io/StudyFlow/*
*Repo: https://github.com/gumazito/studyflow*
