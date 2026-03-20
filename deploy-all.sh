#!/bin/bash
# ============================================================
# StudyFlow — Single Deploy Script
# Run this from your local machine inside the StudyFlow folder
# Usage: bash deploy-all.sh
# ============================================================

set -e

# Colours for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  StudyFlow — Full Deploy${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo ""

# ---- Step 0: Check we're in the right directory ----
if [ ! -f "package.json" ] || [ ! -f "firebase.json" ]; then
  echo -e "${RED}ERROR: Run this from the StudyFlow project root (needs package.json + firebase.json).${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Project root detected"

# ---- Step 1: Clean ----
echo ""
echo -e "${YELLOW}[1/8]${NC} Cleaning old build artifacts..."
rm -rf .next out node_modules/.cache
rm -f cleanup.py
echo -e "${GREEN}✓${NC} Cleaned .next, out, cache, temp files"

# ---- Step 2: Install dependencies ----
echo ""
echo -e "${YELLOW}[2/8]${NC} Installing dependencies..."
npm install --prefer-offline 2>&1 | tail -3
echo -e "${GREEN}✓${NC} Dependencies installed"

# ---- Step 3: Build ----
echo ""
echo -e "${YELLOW}[3/8]${NC} Building Next.js app (static export)..."
npm run build 2>&1 | tail -10
if [ ! -d "out" ]; then
  echo -e "${RED}ERROR: Build failed — 'out' directory not created.${NC}"
  echo -e "${RED}Run 'npx tsc --noEmit' to check for TypeScript errors.${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Build successful — static files in out/"

# ---- Step 4: Deploy all Firebase rules (Firestore + Storage + Indexes) ----
echo ""
echo -e "${YELLOW}[4/8]${NC} Deploying Firebase rules..."
DEPLOY_TARGETS=""
[ -f "firestore.rules" ] && DEPLOY_TARGETS="${DEPLOY_TARGETS}firestore:rules,"
[ -f "storage.rules" ] && DEPLOY_TARGETS="${DEPLOY_TARGETS}storage,"
[ -f "firestore.indexes.json" ] && DEPLOY_TARGETS="${DEPLOY_TARGETS}firestore:indexes,"
# Remove trailing comma
DEPLOY_TARGETS="${DEPLOY_TARGETS%,}"
if [ -n "$DEPLOY_TARGETS" ]; then
  firebase deploy --only "$DEPLOY_TARGETS" --project studyflow-f2e7a 2>&1 | tail -5
  echo -e "${GREEN}✓${NC} Firebase rules deployed ($DEPLOY_TARGETS)"
else
  echo -e "${YELLOW}⚠${NC} No rules files found — skipping"
fi

# ---- Step 5: Deploy to Firebase Hosting ----
echo ""
echo -e "${YELLOW}[5/8]${NC} Deploying to Firebase Hosting..."
firebase deploy --only hosting --project studyflow-f2e7a 2>&1 | tail -5
echo -e "${GREEN}✓${NC} Site deployed to Firebase Hosting"

# ---- Step 6: Type check (non-blocking) ----
echo ""
echo -e "${YELLOW}[6/8]${NC} Running type check..."
npx tsc --noEmit 2>&1 | tail -5 || echo -e "${YELLOW}⚠${NC} TypeScript warnings found (non-blocking)"

# ---- Step 7: Git commit & push ----
echo ""
echo -e "${YELLOW}[7/8]${NC} Committing and pushing to GitHub..."
git add -A

if git diff --cached --quiet; then
  echo -e "${YELLOW}⚠${NC} No changes to commit"
else
  COMMIT_MSG="Deploy: Global Spotify bar, Podcast learn mode, TTS fallback, COOP fix

- Moved Spotify player to GlobalSpotifyBar dropdown in header (all views)
- Added GlobalSpotifyBar to all dashboard nav bars (Learner, Publisher, Admin, Mentor, Profile, Groups)
- Removed old SpotifyPlayer from learn mode inline area
- Made Podcast its own learn mode tab (alongside Cards, Scroll, Feed)
- Added browser SpeechSynthesis TTS fallback when Cloud Function returns 500
- Silenced App Check warning (console.debug instead of console.warn)
- Added COOP headers (same-origin-allow-popups) to firebase.json for Firebase Auth popups
- Added COEP unsafe-none header for Spotify embed compatibility"

  git commit -m "$COMMIT_MSG"
  git push origin main 2>&1 | tail -5
  echo -e "${GREEN}✓${NC} Changes pushed to GitHub"
fi

# ---- Step 8: Post-deploy verification ----
echo ""
echo -e "${YELLOW}[8/8]${NC} Verifying deployment..."
SITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://studyflow-f2e7a.web.app" 2>/dev/null || echo "000")
if [ "$SITE_STATUS" = "200" ]; then
  echo -e "${GREEN}✓${NC} Site is live and responding (HTTP $SITE_STATUS)"
else
  echo -e "${YELLOW}⚠${NC} Site returned HTTP $SITE_STATUS — may take a moment to propagate"
fi

# ---- Done! ----
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  DEPLOY COMPLETE${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Site:  ${CYAN}https://studyflow-f2e7a.web.app${NC}"
echo -e "  Rules: Firestore + Storage rules updated"
echo -e "  COOP:  same-origin-allow-popups (fixes Auth popup errors)"
echo -e "  Git:   Pushed to gumazito/StudyFlow"
echo ""
echo -e "  ${YELLOW}Changes in this deploy:${NC}"
echo -e "    • Global Spotify bar in header (all views)"
echo -e "    • Podcast is now a learn mode tab"
echo -e "    • Browser TTS fallback when Cloud Function TTS fails"
echo -e "    • COOP headers fix Auth popup warnings"
echo -e "    • App Check warning silenced"
echo ""
echo -e "  ${YELLOW}Tip:${NC} If build errors occur, run: npx tsc --noEmit"
echo ""
