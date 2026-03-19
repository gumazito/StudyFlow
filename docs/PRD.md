# StudyFlow — Product Requirements Document (PRD)

**Version:** 1.0
**Date:** March 19, 2026
**Author:** Courtenay Hollis + Claude (AI)
**Status:** Living Document

---

## 1. Product Vision

StudyFlow is a social learning platform that makes studying interactive, fun, and effective for Australian high school students (Years 7-12). It combines micro-learning, AI-powered content generation, gamification, social features, and mentorship into a single platform that students actually want to use.

**Tagline:** "Learn Smarter. Together."

**Target Users:**
- Primary: Australian high school students (ages 12-18)
- Secondary: Parents (as mentors), Teachers (as publishers), Tutors, Schools (as groups)
- Tertiary: Companies providing workplace training (future expansion)

**Competitive Landscape:**
- Duolingo: Gamification model (we adapt for academic subjects)
- Google Classroom: School/teacher management (we add gamification + social)
- Quizlet: Flash cards + tests (we add AI generation + spaced repetition)
- Khan Academy: Video learning (we add social + gamification + Australian curriculum alignment)

**Differentiators:**
- AI-generated content from any uploaded material (not pre-built courses only)
- Practice test analysis that generates targeted learning
- Multi-AI provider support (Claude, ChatGPT, Gemini, Grok)
- Social learning with following, cheers, leaderboards
- Australian curriculum aligned (ACARA, year level matching)
- Group-based multi-tenancy (schools, companies, communities)
- Mentor role for parents/tutors to track progress

---

## 2. User Roles & Permissions

### 2.1 Learner
- Browse and access published courses within their groups
- Take micro-learn sessions (flash cards, scroll mode)
- Take tests (MCQ, True/False, Select All That Apply)
- Track progress (XP, streaks, badges, levels)
- Follow other learners, send cheers
- Rate courses (learning content + test quality)
- Submit feedback to publishers
- Mark courses as complete
- View test history and progress analytics
- Set date of birth for year-level matching
- Accept/decline mentor requests
- Accept/decline follow requests
- Join groups via invite link or code

### 2.2 Publisher (Teacher/Content Creator)
- Create, edit, delete learning packages
- Upload research content (PDF, TXT, DOCX, MD, HTML)
- Upload practice test content (analysed for question patterns)
- Use AI auto-research to generate content
- Edit individual facts (add, modify, delete)
- Set course metadata (name, subject, year level, description)
- Publish/unpublish courses
- Custom brand courses (colour, icon, display name)
- View analytics (per-course, per-student performance)
- Export results as CSV/PDF
- Cross-publish courses to other groups (link or copy)
- Collaborate with other publishers (owner/contributor)
- Use course templates (7+ built-in templates)
- Bulk invite students via email list

### 2.3 Mentor (Parent/Tutor)
- Request to mentor specific learners (learner must approve)
- View mentee dashboard: XP, streak, badges, test scores
- View detailed test history per mentee
- See time spent learning and completion rates
- Identify areas where mentee needs help
- Search for learners by name or email

### 2.4 Group Administrator
- Create and configure groups (type, name, description)
- Add/remove group members
- Set member roles within the group
- Generate invite links with pre-set roles
- Manage join requests (approve/reject)
- Submit official verification requests (schools/companies)
- View group-level analytics

### 2.5 System Administrator (Super Admin)
- Access all groups and all data
- Approve/reject user signups
- Toggle any user's roles
- Review and approve/reject group verification requests
- View system-wide notifications
- Manage system settings

---

## 3. Feature Requirements

### 3.1 Authentication & Onboarding

**3.1.1 Sign Up**
- Email + password registration
- Full name (required)
- Date of birth (required for learners — auto-detects Australian year level)
- Role selection: Learner, Publisher, Mentor (multi-select)
- Optional: Group join via invite code
- Account requires admin approval (configurable per group)
- Terms of Service and Privacy Policy acceptance (required)
- Age verification: users under 13 require parental consent (COPPA compliance)

**3.1.2 Login**
- Email + password
- "Remember me" option
- Forgot password (email reset link)
- Social login: Google, Apple (future — Sprint 15)
- SSO for schools (SAML/OAuth — future)

**3.1.3 Onboarding Flow (New Users)**
- Welcome screen with role explanation
- Guided setup wizard: set preferences, join groups, complete profile
- First-time tips/tooltips on key features
- Suggest courses based on year level and interests

**3.1.4 Invite Link Flow**
- URL contains group ID and pre-set roles
- Existing users: login → auto-join group
- New users: signup → auto-join group
- Invite codes for manual entry (alternative to links)

### 3.2 Learning Engine

**3.2.1 Micro-Learn Mode (Flash Cards)**
- Swipe cards: tap to flip, swipe up/down to navigate
- Scroll mode: TikTok-style continuous scroll with snap-to-card
- Spaced repetition: confidence rating (Forgot / Partly / Knew it)
- Review mode: prioritises cards due for review
- Progress bar and card counter
- Category filtering within a course

**3.2.2 Test Engine**
- Question types: Multiple Choice, True/False, Select All That Apply
- Dynamic question generation from research content
- Practice-test-informed question style weighting
- Test scope toggle: Full Course vs Exam Prep (practice-test topics only)
- Configurable question count (5, 10, 15, 20)
- Category filtering for tests
- Retry wrong answers with explanation
- Timer display
- Score screen with percentage, correct/wrong counts, time
- Review of missed questions with explanations
- Test results persisted in database

**3.2.3 Audio Learning (Podcast Mode)**
- AI-generated audio summaries of course content (TTS)
- "Podcast style" — engaging, conversational tone for young learners
- Audio player UI (play, pause, skip, speed control)
- Background playback (continue learning while browsing)
- Download for offline listening (future)

**3.2.4 Video Content**
- YouTube/Vimeo embed support
- Direct video upload (Firebase Storage)
- Video player in learn mode alongside flash cards
- Timestamp bookmarks (future)

**3.2.5 Voice-Based Learning**
- Voice input for test answers (Web Speech API)
- "Study Buddy" — conversational AI tutor
- Voice commands: "next card", "flip", "explain this"

**3.2.6 AI Study Plan Generator**
- Analyses learner's test results and weak areas
- Generates personalised daily/weekly study plan
- Prioritises topics with lowest scores
- Adjusts dynamically as learner improves
- Push notification reminders for study sessions

### 3.3 Content Management

**3.3.1 Document Upload & Parsing**
- Supported formats: PDF, TXT, DOCX, MD, HTML, CSV
- Client-side PDF parsing (PDF.js)
- Research content: extracted as learning facts
- Practice test content: analysed for question patterns and topics
- Content type distinction (Research vs Practice Test)

**3.3.2 AI Auto-Research**
- Real AI API integration (Claude, ChatGPT, Gemini, Grok)
- Per-user API key management (stored securely in Firestore)
- Guided setup wizard per provider
- Multi-provider support with automatic fallback
- Practice test topics guide AI content generation
- Built-in knowledge bank as fallback (water cycle, algebra, etc.)
- Generated facts are editable (edit, delete, add)

**3.3.3 Course Templates**
- Built-in templates: Blank, AI-Researched, Practice Test Prep, subject-specific
- Custom user templates (save current course as template)
- Template marketplace (future — share templates between groups)

**3.3.4 Course Metadata**
- Name, subject, year level, description
- Subject dropdown (13+ subjects + custom)
- Year level (Year 7-12)
- Custom branding: brand colour, icon, publisher display name
- Auto-research toggle
- Collaborators (owner/contributor)
- Group ownership

### 3.4 Gamification

**3.4.1 XP System**
- Earn XP for: learning sessions (10), test completion (25), passing test (50), perfect score (100)
- Streak bonus XP (+15/day)
- XP visible in gamification bar on all screens

**3.4.2 Levels**
- 11 levels based on XP thresholds (0 → 20,000 XP)
- Level displayed with XP progress bar
- Level-up animation/notification

**3.4.3 Streaks**
- Daily activity tracking
- Streak counter with fire emoji
- Best streak record
- Streak freeze (protect streak when sick — future, paid feature?)

**3.4.4 Badges**
- 10+ achievement badges (First Steps, Quiz Whiz, On Fire, Unstoppable, etc.)
- Badge unlock popup animation
- Badge display on profile and social
- Custom badges per group (future)

**3.4.5 Leaderboard**
- Ranked by XP among followed learners
- Medal icons (gold, silver, bronze)
- Opt-in (users can hide from leaderboard)
- Group-specific leaderboards
- Weekly/monthly/all-time views (future)

### 3.5 Social Features

**3.5.1 Following**
- Search for learners by name or email
- Send follow request (requires acceptance)
- View following/followers list
- See followed learners' level, XP, streak, badges, avg score

**3.5.2 Encouragement**
- Send cheers with custom messages
- Cheer notification banner
- Hi-5 for achievements and milestones

**3.5.3 Activity Feed**
- Recent test scores from followed learners
- Badge unlocks from followed learners
- Course completions from followed learners

**3.5.4 Music Sharing (Spotify)**
- Embedded Spotify player
- Song/playlist search within app
- "Currently listening" status on social profile
- Hi-5/cheer for what someone is listening to
- Study music playlist suggestions
- Requires: Spotify Developer App + OAuth backend

### 3.6 Groups & Multi-Tenancy

**3.6.1 Group Types**
- School, Company/Organisation, Personal, Community, Other
- Personal group auto-created for every user

**3.6.2 Group Management**
- Create groups (any approved user)
- Group admin manages: members, roles, settings
- Member roles: Learner, Publisher, Mentor, Admin
- Add members by name/email search
- Invite links with pre-set roles
- Invite codes for manual joining
- Join request approval/rejection

**3.6.3 Official Verification**
- For schools: ACARA school name lookup
- For companies: ABN lookup (ABR API)
- Verification form: contact name, phone, mobile, email, ABN
- Document upload: letter of authority on letterhead
- Super admin review and approve/reject
- Official badge on verified groups
- Community groups do not need verification

**3.6.4 Cross-Group Content**
- Publishers can cross-publish courses to other groups
- Two modes: Link (shared reference) or Copy (independent)
- Group filter in learner course browse
- Course cards show group badge

### 3.7 Notifications

**3.7.1 In-App Notifications**
- New course published in your group
- Follow request received
- Mentor request received
- Cheer received
- Badge unlocked
- Verification status changed
- Account approved/rejected
- Role change approved

**3.7.2 Email Notifications (SendGrid)**
- Account signup confirmation
- Password reset
- Account approved
- New course published
- Weekly progress summary
- Mentor request received
- Inactive reminder (haven't studied in X days)

**3.7.3 SMS Notifications (Twilio — Optional)**
- Account verification
- Password reset (alternative to email)
- Critical notifications only

**3.7.4 Push Notifications (Firebase Cloud Messaging)**
- Mobile app notifications
- Study reminder (configurable time)
- New course in your group
- Streak about to break

**3.7.5 Notification Preferences**
- Per-user settings
- Per-group settings (e.g. mute a group)
- Per-channel: in-app, email, SMS, push
- Do-not-disturb hours

### 3.8 User Profile & Settings

**3.8.1 Profile Fields**
- Display name
- Email (changeable with password confirmation)
- Date of birth (auto-calculates year level)
- Password management
- Avatar/profile picture (future)

**3.8.2 Role Management**
- View current roles
- Request additional roles (admin approval required)
- Role change notifications

**3.8.3 AI Settings**
- Add/update/remove API keys per AI provider
- Guided setup wizard per provider
- Provider priority order for fallback
- Provider status indicators
- Credit monitoring alerts

**3.8.4 Notification Preferences**
- Toggle each notification type on/off
- Per-group notification settings
- Email/SMS/push channel preferences
- Do-not-disturb schedule

**3.8.5 Privacy & Data**
- Delete account / right to be forgotten (GDPR-style)
- Export my data as ZIP (GDPR data portability)
- Privacy settings (who can find me, who can see my progress)
- Data retention policy display

**3.8.6 Appearance**
- Dark/light mode toggle
- Language preference (English default, future: multi-language)

### 3.9 Payments & Subscription (Stripe)

**3.9.1 Tier Structure (Suggested)**
| Feature | Free | Plus ($4.99/mo) | Pro ($9.99/mo) | School (Custom) |
|---------|------|-----------------|----------------|-----------------|
| Courses | 3 | Unlimited | Unlimited | Unlimited |
| Tests per day | 5 | Unlimited | Unlimited | Unlimited |
| AI auto-research | Basic | Full | Full + priority | Full |
| Groups | 1 personal | 3 | Unlimited | Unlimited |
| Audio learning | - | ✅ | ✅ | ✅ |
| Video uploads | - | - | ✅ | ✅ |
| Spotify integration | - | ✅ | ✅ | ✅ |
| Study plans | - | ✅ | ✅ | ✅ |
| Analytics export | - | CSV | CSV + PDF | CSV + PDF + API |
| Custom branding | - | - | ✅ | ✅ |
| Priority support | - | - | ✅ | ✅ |
| Admin dashboard | - | - | - | ✅ |
| SLA | - | - | - | 99.9% |

**3.9.2 Payment Features**
- Stripe Checkout for subscription
- Free trial period (14 days?)
- Annual discount (2 months free)
- Student discount verification
- School/bulk pricing
- Invoice generation
- Subscription management in Profile
- Cancellation flow with retention offer
- Refund policy

### 3.10 Mobile Applications

**3.10.1 iOS App (React Native)**
- Full feature parity with web app
- Native push notifications
- Offline mode (cached courses and tests)
- Touch ID / Face ID login
- App Store submission and review compliance
- Minimum iOS version: 15+

**3.10.2 Android App (React Native)**
- Full feature parity with web app
- Native push notifications
- Offline mode
- Fingerprint/biometric login
- Google Play Store submission
- Minimum Android version: 10+

**3.10.3 Shared Code**
- React Native with Expo
- Share Firebase config, data models, business logic with web
- Platform-specific UI adaptations where needed

### 3.11 Website & Marketing

**3.11.1 Landing Page**
- Product description and value proposition
- Feature highlights with screenshots
- Pricing table
- Testimonials / social proof
- Call-to-action: Sign up free
- Download links for iOS and Android apps
- Footer: About, Privacy Policy, Terms, Contact, Blog

**3.11.2 SEO**
- Meta tags, Open Graph, Twitter Cards
- Structured data (JSON-LD) for educational app
- Sitemap.xml
- robots.txt
- Blog for content marketing (study tips, education news)
- Target keywords: "study app Australia", "high school revision", "exam prep app"

**3.11.3 Analytics**
- Google Analytics 4
- Conversion tracking (signup, subscription)
- User engagement metrics
- Funnel analysis (landing → signup → first course → first test)

**3.11.4 Legal Pages**
- Terms of Service
- Privacy Policy (GDPR + Australian Privacy Act compliant)
- Cookie Policy
- Acceptable Use Policy
- COPPA compliance statement (for users under 13)
- Data Processing Agreement (for schools)

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Page load time: < 2 seconds on 4G mobile
- Time to interactive: < 3 seconds
- Test question generation: < 1 second
- AI auto-research: < 15 seconds
- Search results: < 500ms

### 4.2 Scalability
- Support 10,000+ concurrent users
- 1,000+ groups
- 100,000+ test results
- Firestore scales automatically
- CDN for static assets (Firebase Hosting)

### 4.3 Security
- HTTPS everywhere
- API keys in environment variables (never in client code)
- Firebase Security Rules per collection per group
- Rate limiting on API routes
- Input sanitisation (XSS prevention)
- CSRF protection
- Password hashing (Firebase Auth handles this)
- Data encryption at rest (Firebase handles this)
- Regular security audits

### 4.4 Accessibility
- WCAG 2.1 AA compliance
- Screen reader support
- Keyboard navigation
- Sufficient colour contrast (both themes)
- Alt text for images
- Focus indicators
- Reduced motion support

### 4.5 Reliability
- 99.9% uptime target
- Automated error tracking (Sentry)
- Graceful degradation when services are unavailable
- Offline mode for mobile apps
- Database backup strategy

### 4.6 Compliance
- Australian Privacy Act 1988
- GDPR (for any EU users)
- COPPA (for users under 13)
- Right to be forgotten / data deletion
- Data portability (export user data)
- Parental consent mechanisms
- School data agreements

### 4.7 Internationalisation (Future)
- Multi-language support (i18n framework)
- Currency localisation for payments
- Timezone handling for notifications
- Date format localisation (DD/MM/YYYY for Australia)
- Curriculum alignment for other countries

---

## 5. Data Model

### 5.1 Core Collections (Firestore)

**users**
```
{
  uid, name, email, dob, yearLevel, roles[], status,
  createdAt, updatedAt, notificationPrefs, privacySettings,
  subscriptionTier, stripeCustomerId, avatar
}
```

**groups**
```
{
  id, name, type, description, official, verificationStatus,
  verificationData, createdBy, createdAt, inviteCode,
  members[{userId, email, name, roles[], joinedAt}],
  settings{requireApproval, allowPublicJoin}
}
```

**packages (courses)**
```
{
  id, name, subject, yearLevel, description, status,
  authorId, authorName, groupId, groupName,
  autoResearch, brandColor, brandIcon, publisherDisplayName,
  collaborators[], crossPublished[],
  content[], facts[], categories[], testPatterns,
  createdAt, updatedAt
}
```

**test_results**
```
{
  id, userId, userName, userEmail, packageId, packageName,
  score, total, correct, elapsed, timestamp
}
```

**gamification**
```
{
  userId, xp, level, streak, bestStreak, lastActive,
  badges[], testsCompleted, perfectScores, coursesAccessed
}
```

**Additional collections:** learner_progress, feedback, ratings, follow_requests, mentor_requests, cheers, announcements, ai_config, spaced_rep, cross_publish, group_requests, admin_notifications, templates, subscriptions

---

## 6. API Routes Required

| Route | Method | Purpose | External Service |
|-------|--------|---------|-----------------|
| /api/auth/session | POST | Session management | Firebase Auth |
| /api/ai/generate | POST | AI content generation proxy | Claude/GPT/Gemini/Grok |
| /api/ai/tts | POST | Text-to-speech generation | ElevenLabs/OpenAI TTS |
| /api/spotify/auth | GET | Spotify OAuth callback | Spotify API |
| /api/spotify/search | GET | Search songs/playlists | Spotify API |
| /api/lookup/school | GET | ACARA school search | MySchool API |
| /api/lookup/abn | GET | ABN company lookup | ABR API |
| /api/notifications/email | POST | Send email notification | SendGrid |
| /api/notifications/sms | POST | Send SMS notification | Twilio |
| /api/payments/webhook | POST | Stripe webhook handler | Stripe |
| /api/payments/checkout | POST | Create checkout session | Stripe |
| /api/export/results | GET | Export test results | Internal |
| /api/upload/file | POST | File upload handler | Firebase Storage |
| /api/moderation/check | POST | Content moderation screening | OpenAI Moderation API |
| /api/lms/seqta | GET | SEQTA LMS content import | SEQTA API |
| /api/lms/canvas | GET | Canvas LMS content import | Canvas API |
| /api/lms/moodle | GET | Moodle LMS content import | Moodle API |
| /api/auth/microsoft | GET | Microsoft SSO callback | Azure AD |
| /api/auth/google | GET | Google OAuth callback | Google Identity |
| /api/auth/apple | GET | Apple Sign-In callback | Apple ID |
| /api/mentors/search | GET | Search mentor marketplace | Internal |
| /api/naplan/questions | GET | NAPLAN practice questions | Internal/ACARA |

---

## 7. Success Metrics

### 7.1 Engagement
- Daily Active Users (DAU)
- Average session duration
- Tests completed per user per week
- Learn mode sessions per user per week
- Streak retention (% of users maintaining 7+ day streaks)
- Social interactions per user (follows, cheers)

### 7.2 Learning Outcomes
- Average test score improvement over time
- Number of courses completed
- Spaced repetition adherence (% of due cards reviewed)
- Time between first test and passing score

### 7.3 Growth
- New signups per week
- Conversion: free → paid
- Group creation rate
- Invite link click-through rate
- App store ratings

### 7.4 Business
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Churn rate
- Net Promoter Score (NPS)

---

## 8. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| AI API costs escalate | High | Medium | User-provided keys, usage limits per tier |
| Spotify API changes/restrictions | Medium | Low | Graceful degradation, alternative music APIs |
| Firebase costs at scale | High | Medium | Monitor usage, optimise queries, caching |
| Content quality from AI | Medium | Medium | Publisher review/edit, user ratings |
| Student safety concerns | High | Low | Age verification, content moderation, privacy controls |
| App store rejection | High | Low | Follow guidelines, proper age ratings, privacy policy |
| Data breach | Critical | Low | Security audits, encryption, minimal data collection |
| Low adoption | High | Medium | Focus on school partnerships, teacher training |

---

## 9. Strategic Decisions (Resolved)

### 9.1 Social Login
**Decision: Yes — Google, Apple, AND Microsoft from day one.**
Schools may require Microsoft logins (Office 365/Azure AD) for staff and students. Google for personal use. Apple for iOS users. This is a Sprint 1 priority in the rebuild.

### 9.2 Free Tier Limits
**Decision: Generous free tier to maximise adoption, with clear upgrade triggers.**
- Free: 3 courses created, 10 tests/day, BYO AI key, 1 personal group, join up to 3 groups, full social/gamification
- Rationale: Students (largest user base) rarely need to pay. Conversion happens through creation limits (publishers) and advanced features (audio, video, study plans). See PRICING-STRATEGY.md for full details.

### 9.3 Content Moderation
**Decision: Yes — mandatory for under-18 platform.**
- AI-powered content screening on all user-generated text (cheers, feedback, course content)
- Profanity filter on all text inputs (real-time, before submission)
- Inappropriate content flagging with auto-block and admin review
- Report button on all user content
- Public groups require additional moderation (admin approval of posts)
- Legal: Terms of Service must explicitly prohibit harmful content; users agree on signup
- Consider: Integration with Google Cloud Natural Language API or OpenAI Moderation API

### 9.4 White-Labelling
**Decision: Yes — core architectural principle for schools, companies, and product vendors.**
- Schools: custom subdomain (schoolname.studyflow.app), custom logo, school colours
- Companies: same plus custom branding on certificates/reports
- Product vendors: full white-label with own domain, logo, and content integration
- Content provider integration: connect to external content APIs (not just file upload) to pull in learning material from other platforms
- Strategic: This opens B2B revenue via licensing/reseller agreements

### 9.5 Admin Panel
**Decision: Stay within the same app — seamless mode switching.**
All admin functions accessible through the role picker (Admin view). No separate panel needed. The current design already supports this with the role switcher.

### 9.6 LMS Integration
**Decision: Yes — Canvas, Moodle, AND SEQTA.**
- SEQTA is critical (Courtenay's daughter's school uses it — students download materials from there)
- Integration types: (1) Direct API connection to pull assignments/resources, (2) Manual upload (current — must remain as the easy fallback), (3) Browser extension to "clip" content from any LMS
- The platform must NEVER lose sight of how easy it is for anyone (especially non-technical students) to create courses from any source material
- Fully AI-generated courses: user provides a prompt describing what they want to learn, AI generates all content, facts, and test questions. Guided wizard collects: subject, year level, specific topics, depth, learning goals
- AI-generated content MUST have clear legal disclaimer: "This content was generated by AI and may contain errors. StudyFlow does not guarantee accuracy. Always verify with your teacher or official curriculum materials."
- Ratings and feedback should feed back to improve AI-generated content over time

### 9.7 NAPLAN Alignment
**Decision: Yes — include NAPLAN practice and alignment.**
- NAPLAN practice mode: specific question types matching NAPLAN format
- Year level alignment with NAPLAN testing years (3, 5, 7, 9)
- Potential to white-label to state/territory education departments
- Schools would value this as a selling point for the School tier

### 9.8 Study Buddy AI Personality
**Decision: Yes — with customisable avatar and personality.**
- Default persona: friendly, encouraging, age-appropriate
- Avatar: animated character (not human-like — think Duolingo owl style)
- Voice: engaging, conversational tone for young learners
- Customisation: users can choose from personality styles (encouraging, strict, humorous)
- Future: AI-generated personalised feedback and encouragement based on learner's progress

### 9.9 Parent/Mentor App
**Decision: Mentor view is sufficient. Expand mentor concept to include paid tutors and community mentors.**
- Mentor role covers: parents, teachers, tutors, community volunteers
- New feature: Mentor marketplace — mentors can create a profile with skills, location, availability
- Learners/parents can search for mentors and request their support
- Community spirit: retired professionals can share knowledge/experience
- Not-for-profit mentoring alongside paid tutoring
- Mentor profiles: areas of expertise, qualifications, availability, ratings from mentees

### 9.10 Inappropriate Content Prevention
**Decision: Prevent it from being possible, not just moderate after the fact.**
- Real-time profanity filter on ALL text inputs (cheers, feedback, course names, descriptions)
- AI content screening before any text is submitted to the database
- Character limit on cheers/messages (prevent long rants)
- Pre-approved cheer templates (in addition to custom messages): "Keep going! 💪", "Great score! 🎉", "You've got this! ⭐"
- Block list: customisable per group (school admins can add words)
- Report button on all user content with admin notification
- Auto-flag and hide content that triggers filters, pending admin review
- Repeat offenders: automatic account suspension after 3 flags

---

## 10. New Requirements (from Strategic Decisions)

### 10.1 Content Provider Integration
- API connectors for external content sources (LMS, textbook publishers)
- Browser extension for "clipping" content from any website/LMS
- Support for structured content import (SCORM, xAPI — future)

### 10.2 Fully AI-Generated Course Wizard
- Step-by-step guided wizard: subject → year level → topics → depth → learning goals
- AI generates: course description, learning facts, categories, test questions
- Publisher reviews and edits before publishing
- Legal disclaimer auto-attached to all AI-generated content
- Feedback loop: ratings improve future AI generations

### 10.3 Mentor Marketplace
- Mentor profiles: expertise, qualifications, location, availability, pricing (free/paid)
- Search and filter mentors by subject, year level, location
- Request mentoring relationship
- Ratings and reviews from mentees
- Community volunteer programme (not-for-profit mentoring)

### 10.4 NAPLAN Practice Mode
- NAPLAN-specific question formats
- Year 3, 5, 7, 9 practice tests
- Progress tracking against NAPLAN benchmarks
- Report generation for schools

### 10.5 Content Moderation System
- Real-time profanity filter (client-side + server-side)
- AI content screening API integration
- Pre-approved message templates for cheers
- Report/flag system with admin review queue
- Auto-suspension after repeated violations
- Per-group word block lists

### 10.6 White-Label Architecture
- Configurable per group: logo, colours, fonts, domain
- Theme engine supporting custom branding at group level
- Content provider branding on embedded content
- Removable StudyFlow branding on Enterprise/White-label tier

---

*This is a living document. Updated as requirements evolve.*
*Last updated: March 19, 2026*
*Strategic direction confirmed by: Courtenay Hollis*
