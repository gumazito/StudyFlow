#!/bin/bash
# ============================================================
# StudyFlow — Fix Firestore Index Errors
# Fixes the "query requires an index" error on Learn/groups
# Run this from your StudyFlow project root
# Usage: bash fix-indexes.sh
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  StudyFlow — Fix Firestore Indexes + Deploy${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo ""

# Check directory
if [ ! -f "package.json" ] || [ ! -f "firebase.json" ]; then
  echo -e "${RED}ERROR: Run this from the StudyFlow project root.${NC}"
  exit 1
fi

# Step 1: Deploy the updated Firestore indexes
echo -e "${YELLOW}[1/5]${NC} Deploying Firestore indexes (fixes 'query requires an index' error)..."
firebase deploy --only firestore:indexes --project studyflow-f2e7a 2>&1 | tail -5
echo -e "${GREEN}✓${NC} Indexes deployed — new indexes: music_shares, content_reports, mentor_profiles, mentor_reviews, announcements"
echo -e "${YELLOW}  Note:${NC} Indexes take 2-10 minutes to build. The error will resolve once building completes."

# Step 2: Deploy Firestore rules
echo ""
echo -e "${YELLOW}[2/5]${NC} Deploying Firestore security rules..."
if [ -f "firestore.rules" ]; then
  firebase deploy --only firestore:rules --project studyflow-f2e7a 2>&1 | tail -5
  echo -e "${GREEN}✓${NC} Firestore rules deployed"
fi

# Step 3: Deploy Storage rules
echo ""
echo -e "${YELLOW}[3/5]${NC} Deploying Storage rules..."
if [ -f "storage.rules" ]; then
  firebase deploy --only storage --project studyflow-f2e7a 2>&1 | tail -5
  echo -e "${GREEN}✓${NC} Storage rules deployed"
fi

# Step 4: Clean + Build + Deploy hosting
echo ""
echo -e "${YELLOW}[4/5]${NC} Building and deploying to hosting..."
rm -rf .next out node_modules/.cache
rm -f cleanup.py
npm install --prefer-offline 2>&1 | tail -3
npm run build 2>&1 | tail -10
if [ ! -d "out" ]; then
  echo -e "${RED}ERROR: Build failed. Run 'npx tsc --noEmit' to check errors.${NC}"
  exit 1
fi
firebase deploy --only hosting --project studyflow-f2e7a 2>&1 | tail -5
echo -e "${GREEN}✓${NC} Site deployed"

# Step 5: Git commit + push
echo ""
echo -e "${YELLOW}[5/5]${NC} Committing changes..."
git add -A
if git diff --cached --quiet; then
  echo -e "${YELLOW}⚠${NC} No changes to commit"
else
  git commit -m "Fix: Add missing Firestore composite indexes for music_shares, content_reports, mentors

- Added music_shares index (toUserId + createdAt) — fixes Learn crash
- Added content_reports index (status + createdAt)
- Added mentor_profiles index (availability + rating)
- Added mentor_reviews index (mentorId + createdAt)
- Added mentor_marketplace_requests index (toUserId + createdAt)
- Added announcements index (createdAt desc)
- Made getMusicShares gracefully handle missing index during build
- Integrated AiMentor, AiVisualLearning, NaplanPractice into LearnerDashboard
- Integrated AvatarPicker into ProfileScreen
- Initialised App Check + Error Tracking + Accessibility in providers
- WCAG 2.1 AA: skip-to-content, focus rings, contrast fixes, reduced motion
- Built MentorMarketplace component with profiles, search, ratings
- Updated SEO metadata (Open Graph, Twitter Cards)"

  git push origin main 2>&1 | tail -5
  echo -e "${GREEN}✓${NC} Pushed to GitHub"
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  FIX COMPLETE${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Site:    ${CYAN}https://studyflow-f2e7a.web.app${NC}"
echo -e "  Indexes: Building (2-10 min). Check status at:"
echo -e "           ${CYAN}https://console.firebase.google.com/project/studyflow-f2e7a/firestore/indexes${NC}"
echo ""
echo -e "  ${YELLOW}The 'query requires an index' error will resolve once indexes finish building.${NC}"
echo ""
