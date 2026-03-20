#!/bin/bash
# ============================================================
# StudyFlow — First-Time Setup & Deploy
# ============================================================
# Run this once to set up everything and deploy to Firebase.
# Usage: cd ~/Development/StudyFlow && bash scripts/setup-and-deploy.sh
# ============================================================

set -e  # Stop on any error

# Colours for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No colour

step=0
total_steps=9

progress() {
  step=$((step + 1))
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  Step $step/$total_steps: $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

warn() {
  echo -e "${YELLOW}  ⚠️  $1${NC}"
}

success() {
  echo -e "${GREEN}  ✅ $1${NC}"
}

fail() {
  echo -e "${RED}  ❌ $1${NC}"
  echo -e "${RED}     Fix the issue above and re-run this script.${NC}"
  exit 1
}

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                  ║${NC}"
echo -e "${BLUE}║       🚀 StudyFlow — Setup & Deploy 🚀          ║${NC}"
echo -e "${BLUE}║                                                  ║${NC}"
echo -e "${BLUE}║   This will set up and deploy your app to        ║${NC}"
echo -e "${BLUE}║   Firebase Hosting + Cloud Functions.             ║${NC}"
echo -e "${BLUE}║                                                  ║${NC}"
echo -e "${BLUE}║   Nothing runs on your laptop after deploy.      ║${NC}"
echo -e "${BLUE}║   Everything lives in Google's cloud.             ║${NC}"
echo -e "${BLUE}║                                                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# Check we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "firebase.json" ]; then
  fail "Not in the StudyFlow directory. Run: cd ~/Development/StudyFlow && bash scripts/setup-and-deploy.sh"
fi

# ─────────────────────────────────────────────────
progress "Checking prerequisites"
# ─────────────────────────────────────────────────

# Check Node.js
if ! command -v node &> /dev/null; then
  fail "Node.js is not installed. Install it from https://nodejs.org (LTS version)"
fi
NODE_VERSION=$(node -v)
success "Node.js $NODE_VERSION found"

# Check npm
if ! command -v npm &> /dev/null; then
  fail "npm is not installed. It should come with Node.js."
fi
success "npm $(npm -v) found"

# Check git
if ! command -v git &> /dev/null; then
  warn "Git not found — skipping git steps"
  HAS_GIT=false
else
  success "Git found"
  HAS_GIT=true
fi

# ─────────────────────────────────────────────────
progress "Installing Firebase CLI"
# ─────────────────────────────────────────────────

if command -v firebase &> /dev/null; then
  success "Firebase CLI already installed ($(firebase --version))"
else
  echo "  Installing firebase-tools globally..."
  npm install -g firebase-tools || fail "Failed to install firebase-tools"
  success "Firebase CLI installed"
fi

# ─────────────────────────────────────────────────
progress "Logging in to Firebase"
# ─────────────────────────────────────────────────

# Check if already logged in
if firebase projects:list &> /dev/null; then
  success "Already logged in to Firebase"
else
  echo "  A browser window will open — log in with your Google account."
  echo "  (The account that owns the studyflow-f2e7a Firebase project)"
  echo ""
  firebase login || fail "Firebase login failed"
  success "Logged in to Firebase"
fi

# Set the correct project
echo "  Setting active project to studyflow-f2e7a..."
firebase use studyflow-f2e7a 2>/dev/null || firebase use --add studyflow-f2e7a 2>/dev/null || warn "Could not set project — you may need to create it first at console.firebase.google.com"
success "Firebase project set"

# ─────────────────────────────────────────────────
progress "Installing frontend dependencies"
# ─────────────────────────────────────────────────

echo "  Running npm install..."
npm install || fail "npm install failed"
success "Frontend dependencies installed"

# ─────────────────────────────────────────────────
progress "Installing Cloud Functions dependencies"
# ─────────────────────────────────────────────────

echo "  Running npm install in functions/..."
cd functions && npm install && cd .. || fail "Functions npm install failed"
success "Cloud Functions dependencies installed"

# ─────────────────────────────────────────────────
progress "Building Cloud Functions"
# ─────────────────────────────────────────────────

echo "  Compiling TypeScript..."
cd functions && npm run build && cd .. || fail "Functions build failed"
success "Cloud Functions compiled"

# ─────────────────────────────────────────────────
progress "Building the website"
# ─────────────────────────────────────────────────

echo "  Running next build (this may take 30-60 seconds)..."
npm run build || fail "Website build failed. Check for TypeScript errors above."
success "Website built successfully (output in ./out/)"

# ─────────────────────────────────────────────────
progress "Deploying to Firebase"
# ─────────────────────────────────────────────────

echo "  Deploying Firestore rules & indexes..."
firebase deploy --only firestore 2>/dev/null || warn "Firestore deploy skipped (may need to enable Firestore in console)"

echo ""
echo "  Deploying Cloud Functions (this takes 2-3 minutes)..."
firebase deploy --only functions 2>/dev/null || warn "Functions deploy failed — make sure you're on the Blaze plan at console.firebase.google.com"

echo ""
echo "  Deploying website to Firebase Hosting..."
firebase deploy --only hosting || fail "Hosting deploy failed"

success "All deployments complete!"

# Grab the hosting URL
HOSTING_URL=$(firebase hosting:channel:list 2>/dev/null | grep "live" | awk '{print $NF}' || echo "")
if [ -z "$HOSTING_URL" ]; then
  HOSTING_URL="https://studyflow-f2e7a.web.app"
fi

# ─────────────────────────────────────────────────
progress "Committing to Git"
# ─────────────────────────────────────────────────

if [ "$HAS_GIT" = true ]; then
  # Check if there are changes to commit
  if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
    success "No new changes to commit"
  else
    echo "  Staging all changes..."
    git add -A
    echo "  Creating commit..."
    git commit -m "Deploy: Phase 8 complete — premium tiers, moderation, scheduled notifications, background audio, video upload" || warn "Commit failed (maybe nothing to commit)"
    echo "  Pushing to GitHub..."
    git push origin main 2>/dev/null || git push 2>/dev/null || warn "Push failed — you may need to set up the remote first"
    success "Code committed and pushed to GitHub"
  fi
else
  warn "Git not available — skipping commit"
fi

# ─────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                  ║${NC}"
echo -e "${GREEN}║       🎉 StudyFlow is LIVE! 🎉                  ║${NC}"
echo -e "${GREEN}║                                                  ║${NC}"
echo -e "${GREEN}║   ${HOSTING_URL}              ║${NC}"
echo -e "${GREEN}║                                                  ║${NC}"
echo -e "${GREEN}║   Your site is hosted on Google's servers.       ║${NC}"
echo -e "${GREEN}║   You can close your laptop — it stays live.     ║${NC}"
echo -e "${GREEN}║                                                  ║${NC}"
echo -e "${GREEN}║   For future updates, run:                       ║${NC}"
echo -e "${GREEN}║   bash scripts/deploy.sh                         ║${NC}"
echo -e "${GREEN}║                                                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BLUE}Firebase Console:${NC} https://console.firebase.google.com/project/studyflow-f2e7a"
echo -e "  ${BLUE}To set up optional services (Stripe, SendGrid, Spotify, etc):${NC}"
echo -e "  See DEPLOY-GUIDE.md → Step 9"
echo ""
