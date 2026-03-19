# StudyFlow Pricing Strategy

## Philosophy

The pricing strategy follows the "Spotify/Duolingo model" — make the free tier genuinely useful so users fall in love with the product, then offer premium features that power users and institutions can't resist. The key principle: **free users should still be happy users, not frustrated ones.**

## Cost Drivers (What We Need to Cover)

| Cost | Free Tier Impact | Paid Tier Impact |
|------|-----------------|-----------------|
| Firebase Firestore | ~$0.05/1000 reads | Scales with usage |
| Firebase Auth | Free up to 50K users | Free |
| Firebase Hosting | Free 10GB | Free |
| Firebase Storage | $0.026/GB/month | Video/audio uploads |
| SendGrid (email) | Free 100/day | $15/mo for 50K/mo |
| AI API calls | User-provided keys OR our keys | Our keys with limits |
| TTS generation | ~$0.015/1000 chars | Major cost for audio |
| Stripe fees | N/A | 2.9% + 30c per tx |
| Domain + SSL | ~$15/year | Included |
| **Estimated total** | **~$50-100/mo** (1000 users) | **Scales with usage** |

## Tier Structure

### Free (forever)
**Goal:** Get users hooked. Prove value. Create lock-in through data and social connections.

| Feature | Limit |
|---------|-------|
| Personal group | 1 (auto-created) |
| Join other groups | Up to 3 |
| Courses you can access | Unlimited |
| Courses you can create/publish | 3 |
| Tests per day | 10 |
| AI auto-research | Uses YOUR API key only (BYO key) |
| Audio learning | Preview only (first 30 seconds) |
| Video content | YouTube/Vimeo embeds only |
| Social features | Full (following, cheers, leaderboard) |
| Gamification | Full (XP, badges, streaks, levels) |
| Mentoring | Accept 1 mentor |
| Analytics | Basic (own progress only) |
| Export | None |
| Support | Community/self-service |
| Ads | Minimal, non-intrusive (future consideration) |

**Why this works:** Users get the full social and gamification experience for free. They can learn, test, and compete with friends. The limits are on *creation* and *advanced features*, not consumption. This means students (the largest user base) rarely need to pay.

### Plus ($4.99/mo or $49.99/year)
**Goal:** Power users who want more creation and advanced features.

| Feature | Limit |
|---------|-------|
| Everything in Free | ✅ |
| Courses you can create | 20 |
| Tests per day | Unlimited |
| AI auto-research | Included (our API keys, fair use) |
| Audio learning | Full access |
| Groups you can create | 5 |
| Study plan generator | ✅ |
| Spotify integration | ✅ |
| Analytics | Detailed (progress over time) |
| Export | CSV |
| Priority email support | ✅ |
| Ad-free | ✅ |
| Streak freeze | 1 per month |

### Pro ($9.99/mo or $99.99/year)
**Goal:** Teachers, tutors, and serious creators.

| Feature | Limit |
|---------|-------|
| Everything in Plus | ✅ |
| Courses you can create | Unlimited |
| Groups you can create | Unlimited |
| AI auto-research | Priority (faster, more detailed) |
| Video upload | Direct upload (1GB storage) |
| Custom branding | ✅ |
| Publisher analytics | Full (per-student, per-course) |
| Export | CSV + PDF |
| Bulk student invite | ✅ |
| Course templates (custom) | ✅ |
| Streak freeze | 3 per month |
| Priority support | ✅ |

### School ($299/year per school or custom quote)
**Goal:** Institutional adoption. This is where the real revenue is.

| Feature | Limit |
|---------|-------|
| Everything in Pro | ✅ |
| Official school group (verified) | ✅ |
| Unlimited teachers/publishers | ✅ |
| Unlimited students | ✅ |
| Admin dashboard | Full school-level analytics |
| SSO integration | ✅ (Google Workspace, Microsoft 365) |
| Custom domain | yourschool.studyflow.app |
| Data export API | ✅ |
| SLA | 99.9% uptime |
| Dedicated support | ✅ |
| Onboarding training | ✅ |
| NAPLAN alignment reports | ✅ (future) |
| White-label option | Custom pricing |
| Invoice billing | ✅ (no credit card needed) |
| Student data agreement | ✅ |
| Volume pricing | 50+ students: $199/yr, 200+: custom |

### Enterprise (Custom Pricing)
**Goal:** Companies, training providers, large organisations.

| Feature | Limit |
|---------|-------|
| Everything in School | ✅ |
| Custom content types | ✅ |
| API access | Full REST API |
| Custom integrations | ✅ |
| Multi-location support | ✅ |
| Compliance reporting | ✅ |
| Dedicated infrastructure | Optional |

## Conversion Strategy

### Free → Plus
**Triggers:**
1. User hits 3-course creation limit: "Upgrade to create more courses"
2. User tries audio learning: "Upgrade for full audio access"
3. User wants study plan: "Upgrade for AI study plans"
4. After 7-day streak: "Protect your streak with streak freeze (Plus feature)"
5. After completing 10 tests: "See your detailed progress analytics with Plus"

### Plus → Pro
**Triggers:**
1. User creates 15+ courses: "Running low on courses — go Pro for unlimited"
2. User wants to upload video: "Pro includes video uploads"
3. User wants publisher analytics: "See how students perform with Pro analytics"
4. User wants to export PDF: "Pro includes PDF export"

### Individual → School
**Triggers:**
1. Teacher has 20+ students in a group: "Get the School plan for unlimited students"
2. Multiple teachers at same school using Plus/Pro: "Your school could save with a School plan"
3. School admin requests verification: "Official schools get the best features with the School plan"

## Revenue Projection (Year 1)

**Assumptions:**
- 1,000 users in 6 months, 5,000 in 12 months
- 5% convert to Plus, 2% to Pro, 0.5% to School
- Average school has 200 students

| Month | Free Users | Plus | Pro | School | MRR |
|-------|-----------|------|-----|--------|-----|
| 1 | 50 | 0 | 0 | 0 | $0 |
| 3 | 200 | 10 | 4 | 0 | $90 |
| 6 | 1,000 | 50 | 20 | 1 | $475 |
| 9 | 3,000 | 150 | 60 | 3 | $1,425 |
| 12 | 5,000 | 250 | 100 | 5 | $2,575 |
| **Year 1 total** | | | | | **~$15,000** |

**Break-even estimate:** ~$1,200/year in infrastructure costs at 5,000 users. Revenue exceeds costs from month ~4.

## Key Decisions

1. **AI costs:** Free tier uses BYO keys. Paid tiers use our keys with fair-use limits. This avoids us subsidising AI costs for free users while still making the premium experience seamless.

2. **School pricing:** Annual flat fee (not per-student for simplicity). Volume discount for larger schools. Invoice billing so schools don't need credit cards.

3. **No time-limited trials:** The free tier IS the trial. No "14 days then pay" — users stay free as long as they want. Conversion happens through feature discovery, not urgency.

4. **Student safety:** Under-18 users cannot make purchases. Parent/guardian approval required for paid plans for minors.

5. **Annual discount:** 2 months free on annual plans (~17% discount). This improves cash flow and reduces churn.

---

*Last updated: March 19, 2026*
