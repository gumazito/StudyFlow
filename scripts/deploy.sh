#!/bin/bash
# ============================================================
# StudyFlow — Quick Deploy
# ============================================================
# Run this after making changes to redeploy.
# Usage: cd ~/Development/StudyFlow && bash scripts/deploy.sh
#
# Options:
#   bash scripts/deploy.sh              → Deploy everything
#   bash scripts/deploy.sh site         → Website only (fastest)
#   bash scripts/deploy.sh functions    → Cloud Functions only
#   bash scripts/deploy.sh rules        → Firestore rules only
#   bash scripts/deploy.sh full         → Everything + git push
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

success() { echo -e "${GREEN}  ✅ $1${NC}"; }
warn()    { echo -e "${YELLOW}  ⚠️  $1${NC}"; }
fail()    { echo -e "${RED}  ❌ $1${NC}"; exit 1; }
info()    { echo -e "${CYAN}  → $1${NC}"; }

MODE="${1:-all}"
START_TIME=$(date +%s)

# Check we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "firebase.json" ]; then
  fail "Not in the StudyFlow directory. Run: cd ~/Development/StudyFlow && bash scripts/deploy.sh"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🚀 StudyFlow Deploy — mode: ${GREEN}$MODE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ─── FUNCTIONS ───
deploy_functions() {
  info "Building Cloud Functions..."
  cd functions && npm run build && cd .. || fail "Functions build failed"
  info "Deploying Cloud Functions..."
  firebase deploy --only functions || fail "Functions deploy failed"
  success "Cloud Functions deployed"
}

# ─── SITE ───
deploy_site() {
  info "Building website..."
  npm run build || fail "Build failed — check TypeScript errors above"
  info "Deploying to Firebase Hosting..."
  firebase deploy --only hosting || fail "Hosting deploy failed"
  success "Website deployed to https://studyflow-f2e7a.web.app"
}

# ─── RULES ───
deploy_rules() {
  info "Deploying Firestore rules & indexes..."
  firebase deploy --only firestore || fail "Firestore deploy failed"
  success "Firestore rules deployed"
}

# ─── GIT ───
git_push() {
  if ! command -v git &> /dev/null; then
    warn "Git not found — skipping"
    return
  fi

  if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
    success "No changes to commit"
    return
  fi

  info "Staging changes..."
  git add -A

  # Auto-generate commit message from changed files
  CHANGED=$(git diff --cached --stat | tail -1)
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M')

  info "Committing..."
  git commit -m "Deploy $TIMESTAMP — $CHANGED" || warn "Nothing to commit"

  info "Pushing to GitHub..."
  git push origin main 2>/dev/null || git push 2>/dev/null || warn "Push failed — check your remote"
  success "Pushed to GitHub"
}

# ─── EXECUTE ───
case "$MODE" in
  site|hosting|web)
    deploy_site
    ;;
  functions|fn)
    deploy_functions
    ;;
  rules|firestore)
    deploy_rules
    ;;
  full)
    deploy_functions
    deploy_rules
    deploy_site
    git_push
    ;;
  all)
    deploy_site
    deploy_functions
    ;;
  git)
    git_push
    ;;
  *)
    echo "Usage: bash scripts/deploy.sh [site|functions|rules|full|git]"
    echo ""
    echo "  site       Website only (fastest — ~30s)"
    echo "  functions  Cloud Functions only"
    echo "  rules      Firestore security rules"
    echo "  full       Everything + git commit & push"
    echo "  git        Just commit and push (no deploy)"
    echo "  (empty)    Website + functions (default)"
    exit 0
    ;;
esac

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Done in ${DURATION}s — https://studyflow-f2e7a.web.app${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
