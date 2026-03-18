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

## Phase 3: Polish & Scale 💡 FUTURE

### DevOps
- ✅ GitHub repo + GitHub Pages deployment
- ✅ Firebase Hosting option documented
- 📋 Staging environment with mirrored production data
- 📋 GitHub Actions CI/CD pipeline
- 📋 Automated test suite
- 📋 Branch protection rules

### Publisher Collaboration
- ✅ Course owner vs contributor roles (basic — set in package editor)
- ✅ Invite other publishers by email
- ✅ Remove collaborators
- 📋 Contributor permissions enforcement (edit content, not delete)

### Advanced Features
- 📋 Spaced repetition algorithm for learn mode
- 📋 Export test results as PDF/CSV
- 📋 Custom branding per publisher
- 📋 Course templates
- 📋 Bulk student invite via CSV
- 📋 Push notifications for new courses
- 💡 Video content support
- 💡 Voice-based learning mode
- 💡 AI-powered study plan generator

---

## Technical Debt & Architecture Notes
- Rebuilt from single HTML to Vite + React project (this session)
- Firebase Auth for authentication
- Firestore for all data persistence
- GitHub Pages for hosting (consider Firebase Hosting for private repo)
- API keys stored in Firestore (per-publisher) not in source code
- Component structure: /src/components, /src/pages, /src/hooks, /src/utils, /src/context

---

*Last updated: March 19, 2026*
*Current session: Phase 1 rebuild + AI auto-research + editable facts + test toggle*
