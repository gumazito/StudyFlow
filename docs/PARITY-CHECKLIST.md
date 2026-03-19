# HTML → Next.js Parity Checklist

This document tracks exactly which features from the working HTML prototype (`index.html`) have been migrated to the Next.js rebuild. The switch to Firebase Hosting will NOT happen until all items are ✅.

## Status Key
- ✅ Migrated to Next.js
- 🔄 Partially migrated (basic version exists, needs full feature)
- ❌ Not yet migrated

---

## Authentication & Roles
- ✅ Email/password login
- ✅ Create account with multi-role selection (learner, publisher, mentor)
- ✅ Password reset via email
- ✅ DOB entry with auto year-level detection
- ✅ System admin auto-detection (courtenay@hollis.family)
- ✅ Multi-role users (any combination)
- ✅ Role switcher for multi-role users
- ✅ Account approval workflow (pending → approved/rejected)
- ✅ Admin notification on new signups
- ✅ Pending approval screen
- ✅ Rejected account screen

## Admin Dashboard
- ✅ View all users with roles
- ✅ Approve/reject pending signups
- ✅ Toggle roles (learner/publisher/mentor/admin)
- ✅ Notifications feed
- ✅ Verification review tab (approve/reject official groups)

## Publisher (Authoring)
- 🔄 Create packages (basic — creates empty package, no full editor)
- ❌ Full package editor with Details/Content/Preview tabs
- ❌ Upload research/learning content (PDF, TXT, DOCX parsing)
- ❌ Upload practice test content (separate type)
- 🔄 Publish/unpublish toggle (works but no content validation)
- ❌ Auto-research toggle in content tab
- ✅ Search packages
- ❌ AI auto-research with Claude/ChatGPT API
- ❌ AI API key management (add/update/remove)
- ❌ Editable individual facts (edit/delete inline)
- ❌ Course templates (7 built-in templates)
- ❌ Template picker overlay
- ❌ Course collaboration (owner/contributor)
- ❌ Custom branding (colour, icon, display name)
- ❌ Cross-publish to other groups (link/copy UI)
- ❌ Bulk student invite (email list + CSV export)
- 🔄 Publisher analytics (basic — shows results list, needs per-student breakdown)
- ✅ CSV export of results
- ❌ PDF export of results

## Learner (Studying)
- ✅ Browse published courses with search
- ❌ Smart filters: Active, New, In Progress, Completed
- ❌ Year-level-based course filtering (show/hide higher years)
- ❌ Group filter for courses
- 🔄 Micro-learn mode (basic flash cards — missing scroll mode, spaced repetition)
- ❌ Scroll mode (TikTok-style continuous scroll)
- ❌ Spaced repetition confidence rating (forgot/partly/knew it)
- ❌ Review mode (due-for-review cards prioritised)
- 🔄 Test engine (MCQ only — missing True/False, Select All That Apply)
- ❌ True/False question type
- ❌ Select All That Apply question type
- ❌ Practice-test-only vs Full Course toggle
- ❌ Category filtering for tests
- ❌ Configurable question count (5/10/15/20)
- ✅ Retry wrong answers with explanations
- ✅ Score screen with percentage
- ✅ Test results saved to Firestore
- ❌ Course detail screen with test history
- ❌ Mark courses as complete
- 🔄 My Progress tab (basic — needs per-course breakdown)
- ❌ Send feedback to publisher
- ❌ Dual ratings (learning + testing quality)
- 🔄 Quick stats bar (shows tests/avg/courses)
- ❌ New course announcements banner
- ❌ Accept/decline follow requests inline
- ❌ Accept/decline mentor requests inline
- ❌ Cheers notification banner

## Gamification
- ✅ XP system (earn on test completion)
- ✅ Level progression
- ✅ Streak tracking
- ✅ Badge checking and awarding
- ✅ Gamification bar (level, XP, streak)
- ❌ Badge unlock popup animation
- 🔄 Badges display (in Social tab — basic grid)
- ❌ Leaderboard (you + followed learners ranked by XP)
- ❌ Activity feed from followed learners

## Social
- ❌ Search for learners by name/email
- ❌ Send follow request
- ❌ Accept/decline follow requests
- ❌ View following list with progress
- ❌ Send cheers/encouragement
- ❌ Receive cheers with notification
- ❌ Activity feed (recent test scores from followed)
- 🔄 Social tab exists but is placeholder text only

## Mentor
- ✅ Search and add mentees by name/email
- ✅ Mentor request flow
- ✅ Mentee stats overview (XP, streak, tests, avg, courses)
- ✅ Expandable test history per mentee

## Groups
- ✅ Create groups with type selection
- ✅ ACARA school name lookup
- ✅ Official vs Community flag
- ✅ Manage members with role toggles
- ✅ Invite link with pre-set roles
- ✅ Browse and search groups
- ✅ Request to join groups
- ❌ Join request approval in group admin
- ❌ Verification form (contact, phone, email, ABN)
- ❌ Invite code entry on signup
- ❌ Auto-join via URL params on load
- ❌ Personal group auto-creation on first login
- ❌ Group selector on role picker

## Profile
- ✅ Edit name
- ✅ Edit DOB with year level display
- ✅ Change email (with password confirmation)
- ✅ Change password
- ✅ Request additional roles
- ✅ Delete account / right to be forgotten
- ❌ View current roles with icons

## Content Engine
- ❌ Client-side PDF parsing (pdfjs-dist is installed but not wired up)
- ❌ Research fact extraction from uploaded text
- ❌ Practice test pattern detection
- ❌ Auto-research from hardcoded knowledge bank
- ❌ Auto-research from AI API
- ❌ Content type distinction (research vs practice test)

## Question Generator
- 🔄 MCQ generation (basic — from facts, concept-based)
- ❌ True/False generation
- ❌ Select All That Apply generation
- ❌ Practice test pattern weighting
- ❌ Number-based questions
- ❌ Definition-based questions ("What is X?")

## UI/UX
- ✅ Dark/light mode toggle
- ✅ Toast notifications (success/error/info)
- ❌ Professional modal system (confirm/prompt dialogs)
- ❌ Processing/loading overlay with spinner

## DevOps
- ✅ Next.js project structure
- ✅ TypeScript throughout
- ✅ Tailwind CSS
- ✅ Firebase SDK in environment variables
- ✅ Build passes cleanly
- ❌ Firebase Hosting configured
- ❌ GitHub Actions deploy to Firebase
- ❌ Staging environment

---

## Summary

| Category | Total | ✅ Done | 🔄 Partial | ❌ Missing |
|----------|-------|--------|------------|-----------|
| Auth | 11 | 11 | 0 | 0 |
| Admin | 5 | 5 | 0 | 0 |
| Publisher | 17 | 2 | 3 | 12 |
| Learner | 25 | 5 | 4 | 16 |
| Gamification | 8 | 5 | 1 | 2 |
| Social | 8 | 0 | 1 | 7 |
| Mentor | 4 | 4 | 0 | 0 |
| Groups | 12 | 6 | 0 | 6 |
| Profile | 6 | 5 | 0 | 1 |
| Content | 6 | 0 | 0 | 6 |
| Questions | 6 | 0 | 1 | 5 |
| UI/UX | 4 | 2 | 0 | 2 |
| DevOps | 7 | 5 | 0 | 2 |
| **TOTAL** | **119** | **50** | **10** | **59** |

**Parity: ~42% complete. 59 features still need migration.**

### Priority Order for Remaining Work
1. **Content Engine** (PDF parsing, fact extraction, content types) — everything else depends on this
2. **Full Package Editor** (Details/Content/Preview tabs, file upload, AI research)
3. **Question Generator** (True/False, Select All, pattern weighting)
4. **Learner Features** (filters, spaced rep, scroll mode, test config, feedback, ratings)
5. **Social System** (following, cheers, leaderboard, activity feed)
6. **Groups** (join requests, verification form, auto-join, personal groups)
7. **UI Polish** (modal system, loading states, badge popups)
8. **Publisher Advanced** (templates, branding, collaboration, cross-publish, bulk invite)
9. **DevOps** (Firebase Hosting, deploy pipeline)

---

*Last updated: March 19, 2026*
*Next session: Start with Content Engine (Priority 1)*
