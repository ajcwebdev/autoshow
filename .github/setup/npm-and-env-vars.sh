#!/usr/bin/env bash
# .github/setup/npm-and-env-vars.sh

##############################################################################
# Sets up .env, ensures Postgres env vars, installs npm packages
##############################################################################

# Create .env if none exists
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

# Ensure required env vars exist
if [ -z "${PGHOST:-}" ] || [ -z "${PGUSER:-}" ] || [ -z "${PGPASSWORD:-}" ] || [ -z "${PGDATABASE:-}" ]; then
  echo "One or more Postgres env vars missing (PGHOST, PGUSER, PGPASSWORD, PGDATABASE)."
  exit 1
fi

echo "Installing npm dependencies..."
npm install