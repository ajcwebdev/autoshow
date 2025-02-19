#!/usr/bin/env bash
set -e

echo "WARNING: This script will completely remove PostgreSQL (via Homebrew) and delete ALL local Postgres data!"
read -rp "Are you sure you want to proceed? (y/N) " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 1
fi

echo "Stopping all Postgres services (any version)..."
brew services stop postgresql || true
brew services stop postgresql@9.6 || true
brew services stop postgresql@10 || true
brew services stop postgresql@11 || true
brew services stop postgresql@12 || true
brew services stop postgresql@13 || true
brew services stop postgresql@14 || true
brew services stop postgresql@15 || true
brew services stop postgresql@17 || true

# Just in case any processes are still lingering
echo "Killing any leftover postgres processes..."
pkill -x postgres || true

echo "Removing common Postgres data directories..."
rm -rf /usr/local/var/postgres
rm -rf /opt/homebrew/var/postgres

echo "Uninstalling all Postgres formulae found in Homebrew..."
brew list --formula | grep -E '^postgresql(@.*)?$' | xargs -I {} brew uninstall --force {}

echo ""
echo "================================================================="
echo "PostgreSQL has been completely removed (via Homebrew), "
echo "and all local Postgres data directories are deleted."
echo "================================================================="