#!/bin/bash
# ============================================================
# StudyFlow — Quick Deploy
# ============================================================
# Run this after making changes to redeploy.
# Usage: cd ~/Development/StudyFlow && bash scripts/deploy.sh
#
# Options:
#   bash scripts/deploy.sh              → Deploy site + functions (default)
#   bash scripts/deploy.sh site         → Website only (fastest, ~30s)
#   bash scripts/deploy.sh functions    → Cloud Functions only
#   bash scripts/deploy.sh rules        → Firestore rules + indexes
#   bash scripts/deploy.sh full         → Everything + git commit & push
#   bash scripts/deploy.sh git          → Just commit and push (no deploy)
#   bash scripts/deploy.sh config       → Show current configuration
#   bash scripts/deploy.sh rotate-keys  → Check & rotate OAuth secrets
#   bash scripts/deploy.sh update-domain → Update domain/project/region config
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
  config|status)
    echo ""
    echo -e "${CYAN}  📋 Current Configuration:${NC}"
    echo ""
    PROJECT=$(grep '"default"' .firebaserc 2>/dev/null | sed 's/.*: *"\(.*\)".*/\1/')
    REGION=$(grep 'NEXT_PUBLIC_FUNCTIONS_URL' .env.local 2>/dev/null | sed 's/.*https:\/\/\([^-]*-[^-]*\)-.*/\1/')
    echo -e "  Firebase Project:  ${GREEN}$PROJECT${NC}"
    echo -e "  Region:            ${GREEN}$REGION${NC}"
    echo -e "  Hosting URL:       ${GREEN}https://${PROJECT}.web.app${NC}"
    echo -e "  Functions URL:     ${GREEN}https://${REGION}-${PROJECT}.cloudfunctions.net${NC}"
    echo ""
    echo -e "  ${CYAN}OAuth Providers:${NC}"
    echo "    Google    — configured in Firebase Console"
    echo "    Apple     — configured in Firebase Console"
    echo "    Microsoft — Azure App ID: e4021569-f628-46e6-87df-4cbb48b38a0b"
    echo "                Secret expires: March 2028"
    echo ""
    echo -e "  ${CYAN}Super Users (auto-admin, auto-approved):${NC}"
    echo "    courtenay@hollis.family"
    echo "    ezrela@hollis.family"
    echo ""
    echo -e "  ${CYAN}Always Premium:${NC}"
    echo "    courtenay@hollis.family"
    echo "    savannah@hollis.family"
    echo "    ezrela@hollis.family"
    echo "    ethan@hollis.family"
    echo ""
    ;;
  rotate-keys|rotate|keys)
    if [ -f "scripts/rotate-microsoft-key.sh" ]; then
      bash scripts/rotate-microsoft-key.sh
    else
      fail "rotate-microsoft-key.sh not found"
    fi
    ;;
  update-domain|domain)
    if [ -f "scripts/update-domain.sh" ]; then
      bash scripts/update-domain.sh --all
    else
      fail "update-domain.sh not found"
    fi
    ;;
  *)
    echo ""
    echo -e "${BLUE}Usage: bash scripts/deploy.sh [command]${NC}"
    echo ""
    echo -e "${CYAN}  Deploy Commands:${NC}"
    echo "    site             Website only (fastest — ~30s)"
    echo "    functions        Cloud Functions only"
    echo "    rules            Firestore security rules + indexes"
    echo "    full             Everything + git commit & push"
    echo "    (no argument)    Website + functions (default)"
    echo ""
    echo -e "${CYAN}  Git Commands:${NC}"
    echo "    git              Just commit and push (no deploy)"
    echo ""
    echo -e "${CYAN}  Configuration:${NC}"
    echo "    config           Show current project configuration"
    echo "    rotate-keys      Check & rotate Microsoft OAuth secret"
    echo "    update-domain    Update domain, project ID, or region"
    echo ""
    echo -e "${CYAN}  Examples:${NC}"
    echo "    bash scripts/deploy.sh              # deploy site + functions"
    echo "    bash scripts/deploy.sh site          # quick site-only deploy"
    echo "    bash scripts/deploy.sh full          # deploy everything + push to git"
    echo "    bash scripts/deploy.sh config        # see current setup"
    echo "    bash scripts/deploy.sh rotate-keys   # check OAuth key expiry"
    echo ""
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
