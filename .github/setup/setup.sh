#!/usr/bin/env bash
# .github/setup/setup.sh

##############################################################################
# Main Mac-only setup script, which sources other scripts:
#   1) npm-and-env-vars.sh    (sets up .env, ensures PGUSER, etc.)
#   2) homebrew-and-pg.sh     (removes old PG, reinstalls, creates roles/db)
#   3) ollama.sh              (starts Ollama server and pulls model)
#   4) whisper.sh             (sets up whisper.cpp)
#
# Finally, it does a verification for pgvector extension and prints success.
##############################################################################

# 0) Create a timestamped logfile and setup a trap to remove it on success
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
LOGFILE="setup-${TIMESTAMP}.log"

exec > >(tee -a "$LOGFILE") 2>&1
cleanup_log() {
  local status=$?
  if [ "$status" -eq 0 ]; then
    rm -f "$LOGFILE"
  else
    echo ""
    echo "============================================================"
    echo "ERROR: Script failed (exit code $status)."
    echo "Logs have been saved in: $LOGFILE"
    echo "============================================================"
  fi
  exit $status
}
trap cleanup_log EXIT

set -euo pipefail

##############################################################################
# 1. OS DETECTION (Mac-only)
##############################################################################
IS_MAC=false
case "$OSTYPE" in
  darwin*) IS_MAC=true ;;
  *)
    echo "Unsupported OS: $OSTYPE (only macOS is supported)."
    exit 1
    ;;
esac

##############################################################################
# 2. HELPER FUNCTIONS
##############################################################################
quiet_brew_install() {
  local pkg="$1"
  if ! brew list --formula | grep -qx "$pkg"; then
    echo "Installing $pkg (silent)..."
    brew install "$pkg" &>/dev/null
  else
    echo "$pkg is already installed."
  fi
}

command_exists() {
  command -v "$1" &>/dev/null
}

ensure_homebrew() {
  if ! command_exists brew; then
    echo "Homebrew not found! Please install from https://brew.sh/ then rerun."
    exit 1
  fi
}

is_docker_container() {
  if [ -f "/.dockerenv" ] || [ -f "/run/.containerenv" ]; then
    return 0
  fi
  return 1
}

##############################################################################
# Source our broken-out scripts *in an order that ensures .env is loaded first*
##############################################################################

# 1) Load environment variables *before* referencing $PGUSER in Postgres tasks
source "$(dirname "$0")/npm-and-env-vars.sh"

# 2) Now do Homebrew + Postgres
source "$(dirname "$0")/homebrew-and-pg.sh"

# 3) Ollama server + model
source "$(dirname "$0")/ollama.sh"

# 4) Whisper.cpp
source "$(dirname "$0")/whisper.sh"


##############################################################################
# Final check: verify pgvector extension, print success info
##############################################################################
echo ""
echo "Verifying that 'vector' is recognized in '$PGDATABASE'..."
PSQL_CHECK=$(PGPASSWORD="${PGPASSWORD:-}" psql -U "${PGUSER:-}" -d "${PGDATABASE:-}" -tAc \
  "SELECT extname FROM pg_extension WHERE extname='vector';" 2>/dev/null || true)

if [ "$PSQL_CHECK" = "vector" ]; then
  echo "pgvector extension is active in $PGDATABASE."
else
  echo "ERROR: 'vector' extension not found in $PGDATABASE' after creation!"
  exit 1
fi

echo ""
echo "Setup completed successfully!"
echo "You can now run your server:"
echo "  npm run serve"
echo ""
echo "Environment variables used:"
echo "PGHOST=${PGHOST:-}"
echo "PGPORT=${PGPORT:-5432}"
echo "PGUSER=${PGUSER:-}"
echo "PGPASSWORD=${PGPASSWORD:-}"
echo "PGDATABASE=${PGDATABASE:-}"