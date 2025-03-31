#!/usr/bin/env bash
# .github/setup/setup.sh
#
# Main Mac-only setup script, which sources other scripts:
#   0) 00-cleanup.sh
#   1) 01-npm-and-env-vars.sh
#   2) 02-homebrew.sh
#   4) 03-whisper.sh
#
# The script sets up required dependencies for the application without database integration.

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
# 3. SOURCE SCRIPTS
##############################################################################
source "$(dirname "$0")/01-npm-and-env-vars.sh"
source "$(dirname "$0")/02-homebrew.sh"
source "$(dirname "$0")/03-whisper.sh"

##############################################################################
# 4. FINAL SUCCESS MESSAGE
##############################################################################
echo ""
echo "Setup completed successfully!"
echo "You can now run your CLI commands or start your server:"
echo "  npm run up"
echo ""