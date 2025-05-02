#!/usr/bin/env bash
# .github/setup/setup.sh

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
LOGFILE="setup-${TIMESTAMP}.log"
exec > >(tee -a "$LOGFILE") 2>&1

cleanup_log() {
  local status=$?
  if [ "$status" -eq 0 ]; then
    rm -f "$LOGFILE"
  else
    echo ""
    echo "ERROR: Script failed (exit code $status)."
    echo "Logs have been saved in: $LOGFILE"
  fi
  exit $status
}
trap cleanup_log EXIT

set -euo pipefail

IS_MAC=false
case "$OSTYPE" in
  darwin*) IS_MAC=true ;;
  *) echo "Unsupported OS: $OSTYPE (only macOS is supported)."; exit 1 ;;
esac

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

is_docker_container() { [ -f "/.dockerenv" ] || [ -f "/run/.containerenv" ]; }

if [ -f ".env" ]; then
  echo ".env file already exists, skipping copy."
else
  echo "Creating .env from .env.example..."
  cp .env.example .env
fi

echo "Loading environment variables from .env..."
set -a
source .env
set +a

echo "Installing npm dependencies..."
npm install

if [ "$IS_MAC" != true ]; then
  echo "ERROR: This script only supports macOS."
  exit 1
fi

ensure_homebrew
echo "==> Checking required Homebrew formulae..."
echo "==> Installing required tools via Homebrew..."
quiet_brew_install "ffmpeg"
echo "All required Homebrew packages have been installed."

echo "Setup completed successfully!"
echo "You can now run your CLI commands or start your server:"
echo "  npm run dev"
