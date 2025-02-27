#!/usr/bin/env bash
# .github/setup/02-homebrew.sh
#
# Install required Homebrew packages for the application
# without any database-related installations or configurations.

if [ "$IS_MAC" != true ]; then
  echo "ERROR: This script only supports macOS."
  exit 1
fi

ensure_homebrew

echo "==> Checking required Homebrew formulae..."

# Install essential packages
echo "==> Installing required tools via Homebrew..."
quiet_brew_install "cmake"              # For building whisper.cpp
quiet_brew_install "ffmpeg"             # For audio/video processing

echo ""
echo "======================================================"
echo "All required Homebrew packages have been installed."
echo "The application is now set up to run in CLI mode."
echo "======================================================"