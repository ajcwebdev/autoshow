#!/usr/bin/env bash
# .github/setup/01-npm-and-env-vars.sh
#
# Sets up .env and installs npm packages
# Modified to remove database environment variable requirements

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

# Note: We no longer check for PG* environment variables since we're not using a database in CLI mode

echo "Installing npm dependencies..."
npm install