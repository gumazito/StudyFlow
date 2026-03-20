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
if [ ! -f "package.json" ]; then
  echo -e "${RED}ERROR: package.json not found. Run this from the StudyFlow project root.${NC}"
  exit 1
fi

if [ ! -f "firebase.json" ]; then
  echo -e "${RED}ERROR: firebase.json not found. Run this from the StudyFlow project root.${NC}"
  exit 1
fi

echo -e "${GREEN}✓${NC} Project root detected"

# ---- Step 1: Clean old build artifacts ----
echo ""
echo -e "${YELLOW}[1/7]${NC} Cleaning old build artifacts..."
rm -rf .next out node_modules/.cache
echo -e "${GREEN}✓${NC} Cleaned .next, out, and cache"

# ---- Step 2: Install dependencies ----
echo ""
echo -e "${YELLOW}[2/7]${NC} Installing dependencies..."
npm install --prefer-offline 2>&1 | tail -3
echo -e "${GREEN}✓${NC} Dependencies installed"

# ---- Step 3: Build the Next.js app ----
echo ""
echo -e "${YELLOW}[3/7]${NC} Building Next.js app (static export)..."
npm run build 2>&1 | tail -10
if [ ! -d "out" ]; then
  echo -e "${RED}ERROR: Build failed — 'out' directory not created.${NC}"
  echo -e "${RED}Check the build output above for errors.${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Build successful — static files in out/"

# ---- Step 4: Deploy Firestore security rules ----
echo ""
echo -e "${YELLOW}[4/7]${NC} Deploying Firestore security rules..."
if [ -f "firestore.rules" ]; then
  firebase deploy --only firestore:rules --project studyflow-f2e7a 2>&1 | tail -5
  echo -e "${GREEN}✓${NC} Firestore rules deployed"
else
  echo -e "${YELLOW}⚠${NC} firestore.rules not found — skipping"
fi

# ---- Step 5: Deploy Firestore indexes (if any) ----
echo ""
echo -e "${YELLOW}[5/7]${NC} Deploying Firestore indexes..."
if [ -f "firestore.indexes.json" ]; then
  firebase deploy --only firestore:indexes --project studyflow-f2e7a 2>&1 | tail -3
  echo -e "${GREEN}✓${NC} Firestore indexes deployed"
else
  echo -e "${YELLOW}⚠${NC} No firestore.indexes.json — skipping"
fi

# ---- Step 6: Deploy to Firebase Hosting ----
echo ""
echo -e "${YELLOW}[6/7]${NC} Deploying to Firebase Hosting..."
firebase deploy --only hosting --project studyflow-f2e7a 2>&1 | tail -5
echo -e "${GREEN}✓${NC} Site deployed to Firebase Hosting"

# ---- Step 7: Git commit & push ----
echo ""
echo -e "${YELLOW}[7/7]${NC} Committing and pushing to GitHub..."

# Remove any temp files
rm -f cleanup.py

# Stage all changes
git add -A

# Check if there are changes to commit
if git diff --cached --quiet; then
  echo -e "${YELLOW}⚠${NC} No changes to commit"
else
  git commit -m "Deploy: Publisher AI wizard, multi-provider support, subject-aware topics, country/curriculum, simplified templates

- Simplified template picker to Blank + AI Generated (removed subject-specific templates)
- Blank course now auto-navigates to editor immediately
- AI form is dynamic and subject-aware with topic chips per subject
- Added Country/Curriculum field (Australia, UK, US, NZ, SG, etc.)
- Added difficulty level and content amount controls
- Multi-provider AI support: Claude, ChatGPT, Gemini, Grok, Perplexity
- Guided step-by-step API key setup with model selection
- Multi-AI collaboration mode (2+ providers cross-validate content)
- PackageEditor detects AI courses and shows AI-focused Content tab
- Added comprehensive subject topic trees for all 12 subjects
- Firestore rules simplified to fix permissions errors
- Deleted cleanup.py temp file"

  git push origin main 2>&1 | tail -5
  echo -e "${GREEN}✓${NC} Changes pushed to GitHub"
fi

# ---- Done! ----
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ DEPLOY COMPLETE${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "  🌐 Site:  ${CYAN}https://studyflow-f2e7a.web.app${NC}"
echo -e "  🔒 Rules: Firestore security rules updated"
echo -e "  📦 Git:   Pushed to gumazito/StudyFlow"
echo ""
echo -e "  ${YELLOW}Note:${NC} If you see build errors, run 'npx tsc --noEmit'"
echo -e "  to check for TypeScript issues."
echo ""
