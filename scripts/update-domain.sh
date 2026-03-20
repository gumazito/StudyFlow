#!/bin/bash
# ============================================================
# StudyFlow — Domain/Project Update Script
# ============================================================
# Updates the domain name and project references across ALL
# configuration files in one go. Safe to run multiple times.
#
# Usage:
#   bash scripts/update-domain.sh                          → Show current config
#   bash scripts/update-domain.sh --domain NEW_DOMAIN      → Update hosting domain
#   bash scripts/update-domain.sh --project NEW_PROJECT_ID → Update Firebase project
#   bash scripts/update-domain.sh --region NEW_REGION      → Update Cloud Functions region
#   bash scripts/update-domain.sh --all                    → Interactive update of everything
#
# Examples:
#   bash scripts/update-domain.sh --domain myapp.com
#   bash scripts/update-domain.sh --project studyflow-prod --region us-central1
#   bash scripts/update-domain.sh --all
#
# What gets updated:
#   - .env.local (environment variables)
#   - lib/cloud-functions.ts (API base URLs)
#   - scripts/deploy.sh (deploy output URLs)
#   - .firebaserc (project ID)
#   - Azure redirect URI reminder
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

# Check we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "firebase.json" ]; then
  fail "Not in the StudyFlow directory. Run: cd ~/Development/StudyFlow && bash scripts/update-domain.sh"
fi

# ─── Read current values ───
CURRENT_PROJECT=$(grep '"default"' .firebaserc 2>/dev/null | sed 's/.*: *"\(.*\)".*/\1/' || echo "unknown")
CURRENT_REGION=$(grep 'NEXT_PUBLIC_FUNCTIONS_URL' .env.local 2>/dev/null | sed 's/.*https:\/\/\([^-]*-[^-]*\)-.*/\1/' || echo "unknown")
CURRENT_AUTH_DOMAIN=$(grep 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN' .env.local 2>/dev/null | cut -d= -f2 || echo "unknown")
CURRENT_HOSTING_URL="https://${CURRENT_PROJECT}.web.app"

# ─── Show current config ───
show_config() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  📋 Current StudyFlow Configuration${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "  Firebase Project:  ${GREEN}$CURRENT_PROJECT${NC}"
  echo -e "  Region:            ${GREEN}$CURRENT_REGION${NC}"
  echo -e "  Auth Domain:       ${GREEN}$CURRENT_AUTH_DOMAIN${NC}"
  echo -e "  Hosting URL:       ${GREEN}$CURRENT_HOSTING_URL${NC}"
  echo -e "  Functions URL:     ${GREEN}https://${CURRENT_REGION}-${CURRENT_PROJECT}.cloudfunctions.net${NC}"
  echo ""
}

# ─── Update project ID across all files ───
update_project() {
  local OLD_PROJECT="$1"
  local NEW_PROJECT="$2"

  if [ "$OLD_PROJECT" = "$NEW_PROJECT" ]; then
    info "Project ID unchanged, skipping"
    return
  fi

  info "Updating project ID: $OLD_PROJECT → $NEW_PROJECT"

  # .firebaserc
  if [ -f ".firebaserc" ]; then
    sed -i.bak "s/$OLD_PROJECT/$NEW_PROJECT/g" .firebaserc && rm -f .firebaserc.bak
    success ".firebaserc updated"
  fi

  # .env.local
  if [ -f ".env.local" ]; then
    sed -i.bak "s/$OLD_PROJECT/$NEW_PROJECT/g" .env.local && rm -f .env.local.bak
    success ".env.local updated"
  fi

  # lib/cloud-functions.ts
  if [ -f "lib/cloud-functions.ts" ]; then
    sed -i.bak "s/$OLD_PROJECT/$NEW_PROJECT/g" lib/cloud-functions.ts && rm -f lib/cloud-functions.ts.bak
    success "lib/cloud-functions.ts updated"
  fi

  # scripts/deploy.sh
  if [ -f "scripts/deploy.sh" ]; then
    sed -i.bak "s/$OLD_PROJECT/$NEW_PROJECT/g" scripts/deploy.sh && rm -f scripts/deploy.sh.bak
    success "scripts/deploy.sh updated"
  fi

  # scripts/setup-and-deploy.sh
  if [ -f "scripts/setup-and-deploy.sh" ]; then
    sed -i.bak "s/$OLD_PROJECT/$NEW_PROJECT/g" scripts/setup-and-deploy.sh && rm -f scripts/setup-and-deploy.sh.bak
    success "scripts/setup-and-deploy.sh updated"
  fi

  # scripts/rotate-microsoft-key.sh
  if [ -f "scripts/rotate-microsoft-key.sh" ]; then
    sed -i.bak "s/$OLD_PROJECT/$NEW_PROJECT/g" scripts/rotate-microsoft-key.sh && rm -f scripts/rotate-microsoft-key.sh.bak
    success "scripts/rotate-microsoft-key.sh updated"
  fi

  # DEPLOY-GUIDE.md
  if [ -f "DEPLOY-GUIDE.md" ]; then
    sed -i.bak "s/$OLD_PROJECT/$NEW_PROJECT/g" DEPLOY-GUIDE.md && rm -f DEPLOY-GUIDE.md.bak
    success "DEPLOY-GUIDE.md updated"
  fi

  # FEATURE-TRACKER.md
  if [ -f "FEATURE-TRACKER.md" ]; then
    sed -i.bak "s/$OLD_PROJECT/$NEW_PROJECT/g" FEATURE-TRACKER.md && rm -f FEATURE-TRACKER.md.bak
    success "FEATURE-TRACKER.md updated"
  fi
}

# ─── Update region across all files ───
update_region() {
  local OLD_REGION="$1"
  local NEW_REGION="$2"

  if [ "$OLD_REGION" = "$NEW_REGION" ]; then
    info "Region unchanged, skipping"
    return
  fi

  info "Updating region: $OLD_REGION → $NEW_REGION"

  # .env.local
  if [ -f ".env.local" ]; then
    sed -i.bak "s/$OLD_REGION/$NEW_REGION/g" .env.local && rm -f .env.local.bak
    success ".env.local updated"
  fi

  # lib/cloud-functions.ts
  if [ -f "lib/cloud-functions.ts" ]; then
    sed -i.bak "s/$OLD_REGION/$NEW_REGION/g" lib/cloud-functions.ts && rm -f lib/cloud-functions.ts.bak
    success "lib/cloud-functions.ts updated"
  fi

  # Cloud Functions source files
  for f in functions/src/*.ts; do
    if [ -f "$f" ]; then
      if grep -q "$OLD_REGION" "$f"; then
        sed -i.bak "s/$OLD_REGION/$NEW_REGION/g" "$f" && rm -f "${f}.bak"
        success "$(basename $f) updated"
      fi
    fi
  done
}

# ─── Update custom domain ───
update_custom_domain() {
  local NEW_DOMAIN="$1"

  info "Setting custom domain: $NEW_DOMAIN"
  echo ""
  echo -e "${YELLOW}  Custom domain setup requires two steps:${NC}"
  echo ""
  echo "  1. Firebase Console → Hosting → Add custom domain"
  echo "     URL: https://console.firebase.google.com/project/$CURRENT_PROJECT/hosting/sites"
  echo "     Add: $NEW_DOMAIN"
  echo "     Firebase will give you DNS records to add to your domain registrar."
  echo ""
  echo "  2. Azure Entra → App registrations → StudyFlow → Authentication"
  echo "     URL: https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
  echo "     Add redirect URI: https://$NEW_DOMAIN/__/auth/handler"
  echo "     (Keep the old firebaseapp.com one too, as a backup)"
  echo ""
  echo "  3. Update .env.local AUTH_DOMAIN if using custom domain for auth:"
  echo "     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEW_DOMAIN"
  echo ""
  success "Domain update instructions displayed"
}

# ─── Azure redirect URI reminder ───
azure_reminder() {
  local PROJECT="$1"
  echo ""
  echo -e "${YELLOW}  ⚠️  IMPORTANT: Update Azure redirect URI${NC}"
  echo ""
  echo "  Go to: https://entra.microsoft.com"
  echo "  → App registrations → StudyFlow → Authentication"
  echo "  → Update redirect URI to: https://${PROJECT}.firebaseapp.com/__/auth/handler"
  echo ""
  echo "  This ensures Microsoft login keeps working with the new domain."
  echo ""
}

# ─── Parse arguments ───
if [ $# -eq 0 ]; then
  show_config
  echo "  Run with --all for interactive update, or use flags:"
  echo "    --project NEW_ID    Update Firebase project ID"
  echo "    --region NEW_REGION Update Cloud Functions region"
  echo "    --domain NEW_DOMAIN Set up custom domain"
  echo ""
  exit 0
fi

NEW_PROJECT=""
NEW_REGION=""
NEW_DOMAIN=""
INTERACTIVE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project)
      NEW_PROJECT="$2"
      shift 2
      ;;
    --region)
      NEW_REGION="$2"
      shift 2
      ;;
    --domain)
      NEW_DOMAIN="$2"
      shift 2
      ;;
    --all)
      INTERACTIVE=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🔧 StudyFlow Configuration Update${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$INTERACTIVE" = true ]; then
  show_config

  echo -e "  Enter new values (press Enter to keep current):"
  echo ""

  read -p "  Firebase Project ID [$CURRENT_PROJECT]: " INPUT_PROJECT
  NEW_PROJECT="${INPUT_PROJECT:-$CURRENT_PROJECT}"

  read -p "  Cloud Functions Region [$CURRENT_REGION]: " INPUT_REGION
  NEW_REGION="${INPUT_REGION:-$CURRENT_REGION}"

  read -p "  Custom domain (optional, blank to skip): " INPUT_DOMAIN
  NEW_DOMAIN="$INPUT_DOMAIN"

  echo ""
  echo -e "  ${CYAN}New configuration:${NC}"
  echo -e "    Project:  $NEW_PROJECT"
  echo -e "    Region:   $NEW_REGION"
  [ -n "$NEW_DOMAIN" ] && echo -e "    Domain:   $NEW_DOMAIN"
  echo ""

  read -p "  Apply these changes? (y/n): " CONFIRM
  if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "  Cancelled."
    exit 0
  fi
fi

echo ""

# Apply updates
CHANGES_MADE=false

if [ -n "$NEW_PROJECT" ] && [ "$NEW_PROJECT" != "$CURRENT_PROJECT" ]; then
  update_project "$CURRENT_PROJECT" "$NEW_PROJECT"
  CHANGES_MADE=true
fi

if [ -n "$NEW_REGION" ] && [ "$NEW_REGION" != "$CURRENT_REGION" ]; then
  update_region "$CURRENT_REGION" "$NEW_REGION"
  CHANGES_MADE=true
fi

if [ -n "$NEW_DOMAIN" ]; then
  update_custom_domain "$NEW_DOMAIN"
  CHANGES_MADE=true
fi

# Remind about Azure if project changed
if [ -n "$NEW_PROJECT" ] && [ "$NEW_PROJECT" != "$CURRENT_PROJECT" ]; then
  azure_reminder "$NEW_PROJECT"
fi

if [ "$CHANGES_MADE" = true ]; then
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  ✅ Configuration updated!${NC}"
  echo -e "${GREEN}  Run 'bash scripts/deploy.sh full' to deploy the changes${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
else
  echo -e "${GREEN}  No changes needed.${NC}"
fi
echo ""
