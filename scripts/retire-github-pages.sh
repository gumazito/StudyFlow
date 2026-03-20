#!/bin/bash
# ============================================================
# StudyFlow — Retire GitHub Pages
# ============================================================
# This script:
# 1. Disables GitHub Pages via the GitHub CLI
# 2. Pushes changes to GitHub
#
# After running this, the old gumazito.github.io/StudyFlow URL
# will stop working. Everyone will use the Firebase URL instead.
#
# Usage: cd ~/Development/StudyFlow && bash scripts/retire-github-pages.sh
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

success() { echo -e "${GREEN}  ✅ $1${NC}"; }
warn()    { echo -e "${YELLOW}  ⚠️  $1${NC}"; }
info()    { echo -e "${BLUE}  → $1${NC}"; }

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Retiring GitHub Pages — moving to Firebase${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if gh CLI is available
if command -v gh &> /dev/null; then
  info "Disabling GitHub Pages via CLI..."
  gh api repos/gumazito/studyflow/pages -X DELETE 2>/dev/null && success "GitHub Pages disabled" || warn "Could not disable via CLI — do it manually (instructions below)"
else
  warn "GitHub CLI (gh) not installed."
  echo ""
  echo "  To disable GitHub Pages manually:"
  echo "  1. Go to: https://github.com/gumazito/studyflow/settings/pages"
  echo "  2. Under 'Source', select 'None' (or 'Disable')"
  echo "  3. Click Save"
  echo ""
  echo "  To install gh CLI for next time: brew install gh"
fi

# Delete the gh-pages branch if it exists
info "Checking for gh-pages branch..."
if git branch -r | grep -q "origin/gh-pages"; then
  info "Deleting remote gh-pages branch..."
  git push origin --delete gh-pages 2>/dev/null && success "gh-pages branch deleted from GitHub" || warn "Could not delete gh-pages branch"
else
  success "No gh-pages branch found (already clean)"
fi

# Delete local gh-pages branch if it exists
if git branch | grep -q "gh-pages"; then
  git branch -D gh-pages 2>/dev/null
  success "Local gh-pages branch deleted"
fi

# Commit and push
info "Committing documentation updates..."
git add -A
git commit -m "Retire GitHub Pages — all hosting now on Firebase (studyflow-f2e7a.web.app)" 2>/dev/null || success "Nothing to commit"
git push origin main 2>/dev/null || git push 2>/dev/null || warn "Push failed"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Done! GitHub Pages is retired.${NC}"
echo -e "${GREEN}  Your live site: https://studyflow-f2e7a.web.app${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  If the CLI couldn't disable Pages, do it manually:"
echo "  https://github.com/gumazito/studyflow/settings/pages"
echo "  → Set Source to 'None' → Save"
echo ""
