#!/usr/bin/env bash
# .github/setup/setup.sh
#
# Main Mac-only setup script, which sources other scripts:
#   0) 00-cleanup.sh
#   1) 01-npm-and-env-vars.sh
#   2) 02-homebrew-and-pg.sh
#   3) 03-ollama.sh
#   4) 04-whisper.sh
#
# Finally, it does a verification for pgvector extension and prints success.

# 0) Source our new cleanup script (timestamped logfile + trap)
source "$(dirname "$0")/00-cleanup.sh"

# Safe shell flags after sourcing cleanup.sh so the trap still fires on error
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

command_exists() { command -v "$1" &>/dev/null; }

ensure_homebrew() {
  if ! command_exists brew; then
    echo "Homebrew not found! Please install from https://brew.sh/ then rerun."
    exit 1
  fi
}

is_docker_container() {
  [ -f "/.dockerenv" ] || [ -f "/run/.containerenv" ]
}

##############################################################################
# 3. SOURCE SCRIPTS (order ensures .env is loaded before Postgres tasks)
##############################################################################
source "$(dirname "$0")/01-npm-and-env-vars.sh"
source "$(dirname "$0")/02-homebrew-and-pg.sh"
source "$(dirname "$0")/03-ollama.sh"
source "$(dirname "$0")/04-whisper.sh"

##############################################################################
# 4. FINAL CHECK: verify pgvector extension, print success info
##############################################################################
echo ""
echo "Verifying that 'vector' is recognized in '$PGDATABASE'..."
PSQL_CHECK="$(PGPASSWORD="${PGPASSWORD:-}" psql -U "${PGUSER:-}" -d "${PGDATABASE:-}" -tAc \
  "SELECT extname FROM pg_extension WHERE extname='vector';" 2>/dev/null || true)"

if [ "$PSQL_CHECK" = "vector" ]; then
  echo "pgvector extension is active in $PGDATABASE."
else
  echo "ERROR: 'vector' extension not found in '$PGDATABASE' after creation!"
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