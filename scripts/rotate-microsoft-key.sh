#!/bin/bash
# ============================================================
# StudyFlow — Microsoft OAuth Key Rotation
# ============================================================
# Checks if your Microsoft client secret is nearing expiry
# and walks you through renewal if needed.
#
# Usage: bash scripts/rotate-microsoft-key.sh
#
# What this does:
#   1. Checks Azure CLI is installed and logged in
#   2. Reads the current secret expiry from Azure
#   3. Warns you if it expires within 30 days
#   4. Creates a new secret and updates Firebase automatically
#
# Prerequisites:
#   - Azure CLI: brew install azure-cli
#   - Firebase CLI: npm install -g firebase-tools
#   - Logged into both: az login && firebase login
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

# ─── Configuration ───
APP_ID="e4021569-f628-46e6-87df-4cbb48b38a0b"
FIREBASE_PROJECT="studyflow-f2e7a"
WARN_DAYS=30

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🔑 Microsoft OAuth Key Rotation Check${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ─── Step 1: Check Azure CLI ───
if ! command -v az &> /dev/null; then
  echo ""
  echo -e "${YELLOW}Azure CLI is not installed.${NC}"
  echo ""
  echo "Install it with:"
  echo "  brew install azure-cli    (macOS)"
  echo "  curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash   (Linux)"
  echo ""
  echo "Then log in with:"
  echo "  az login"
  echo ""
  fail "Azure CLI required. Install it and try again."
fi

# ─── Step 2: Check login ───
info "Checking Azure login..."
az account show &> /dev/null || {
  warn "Not logged into Azure. Running az login..."
  az login || fail "Azure login failed"
}
success "Azure CLI authenticated"

# ─── Step 3: Check current secrets ───
info "Checking current client secrets for StudyFlow app..."

SECRETS=$(az ad app credential list --id "$APP_ID" --query "[].{description:displayName, endDate:endDateTime}" -o tsv 2>/dev/null)

if [ -z "$SECRETS" ]; then
  warn "No client secrets found for app $APP_ID"
  echo "Creating a new one..."
else
  echo ""
  echo -e "${CYAN}  Current secrets:${NC}"
  echo "$SECRETS" | while IFS=$'\t' read -r desc endDate; do
    # Parse expiry date
    EXPIRY_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$endDate" "+%s" 2>/dev/null || date -d "$endDate" "+%s" 2>/dev/null || echo "0")
    NOW_EPOCH=$(date "+%s")
    DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))

    if [ "$DAYS_LEFT" -lt 0 ]; then
      echo -e "    ${RED}■ $desc — EXPIRED ($endDate)${NC}"
    elif [ "$DAYS_LEFT" -lt "$WARN_DAYS" ]; then
      echo -e "    ${YELLOW}■ $desc — expires in $DAYS_LEFT days ($endDate)${NC}"
    else
      echo -e "    ${GREEN}■ $desc — $DAYS_LEFT days remaining ($endDate)${NC}"
    fi
  done
  echo ""

  # Check if any secret is expiring soon
  NEEDS_ROTATION=false
  while IFS=$'\t' read -r desc endDate; do
    EXPIRY_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$endDate" "+%s" 2>/dev/null || date -d "$endDate" "+%s" 2>/dev/null || echo "0")
    NOW_EPOCH=$(date "+%s")
    DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))
    if [ "$DAYS_LEFT" -lt "$WARN_DAYS" ]; then
      NEEDS_ROTATION=true
    fi
  done <<< "$SECRETS"

  if [ "$NEEDS_ROTATION" = false ]; then
    success "All secrets are valid. No rotation needed."
    echo ""
    exit 0
  fi

  warn "A secret is expiring soon or has expired!"
fi

# ─── Step 4: Create new secret ───
echo ""
read -p "  Create a new 24-month secret and update Firebase? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
  echo "  Cancelled."
  exit 0
fi

info "Creating new client secret (24 months)..."
NEW_SECRET=$(az ad app credential reset \
  --id "$APP_ID" \
  --display-name "Firebase-$(date +%Y%m%d)" \
  --end-date "$(date -v+24m +%Y-%m-%d 2>/dev/null || date -d '+24 months' +%Y-%m-%d)" \
  --query "password" -o tsv 2>/dev/null)

if [ -z "$NEW_SECRET" ]; then
  fail "Failed to create new secret. Check your Azure permissions."
fi

success "New secret created"

# ─── Step 5: Update Firebase ───
info "Updating Firebase Microsoft auth provider..."
echo ""
echo -e "${YELLOW}  IMPORTANT: You need to manually update the Application Secret in Firebase Console:${NC}"
echo ""
echo "  1. Go to: https://console.firebase.google.com/project/$FIREBASE_PROJECT/authentication/providers"
echo "  2. Click on Microsoft"
echo "  3. Replace the Application secret with this new value:"
echo ""
echo -e "     ${GREEN}$NEW_SECRET${NC}"
echo ""
echo "  4. Click Save"
echo ""

# Copy to clipboard if possible
echo "$NEW_SECRET" | pbcopy 2>/dev/null && success "New secret copied to clipboard" || true

# ─── Step 6: Optionally delete old secrets ───
echo ""
read -p "  Delete old/expired secrets from Azure? (y/n): " DELETE_OLD
if [ "$DELETE_OLD" = "y" ] || [ "$DELETE_OLD" = "Y" ]; then
  OLD_KEY_IDS=$(az ad app credential list --id "$APP_ID" --query "[?displayName!='Firebase-$(date +%Y%m%d)'].keyId" -o tsv 2>/dev/null)
  for KEY_ID in $OLD_KEY_IDS; do
    az ad app credential delete --id "$APP_ID" --key-id "$KEY_ID" 2>/dev/null && \
      success "Deleted old secret $KEY_ID" || warn "Could not delete $KEY_ID"
  done
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  🔑 Key rotation complete${NC}"
echo -e "${GREEN}  Remember to update Firebase Console with the new secret${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
