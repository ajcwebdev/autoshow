#!/usr/bin/env bash

# src/utils/scripts/setup.sh

# ------------------------------------------------------------------------------
# 1. OS DETECTION
# ------------------------------------------------------------------------------
IS_MAC=false
IS_LINUX=false

case "$OSTYPE" in
  darwin*)
    IS_MAC=true
    ;;
  linux*)
    IS_LINUX=true
    ;;
  *)
    echo "Unsupported OS: $OSTYPE"
    echo "Please install dependencies manually."
    exit 1
    ;;
esac

# ------------------------------------------------------------------------------
# 2. HELPER FUNCTIONS
# ------------------------------------------------------------------------------

# Check if a command is available
command_exists() {
  command -v "$1" &>/dev/null
}

# Ensure Homebrew on macOS
ensure_homebrew() {
  if ! command_exists brew; then
    echo "Homebrew is not installed on your system."
    echo "Please install Homebrew from https://brew.sh/ then rerun this script."
    exit 1
  fi
}

# Ensure apt on Linux
ensure_apt() {
  if ! command_exists apt-get; then
    echo "This script requires apt-get, but it was not found."
    echo "Please install dependencies manually, or add logic for your package manager."
    exit 1
  fi
}

# Install package if missing (macOS)
install_if_missing_brew() {
  local pkg=$1
  if ! brew list --formula | grep -qx "$pkg"; then
    echo "$pkg not found. Installing with Homebrew..."
    brew install "$pkg"
  else
    echo "$pkg is already installed."
  fi
}

# Install package if missing (Linux/apt)
install_if_missing_apt() {
  local pkg=$1
  if ! command_exists "$pkg"; then
    echo "$pkg not found. Installing with apt-get..."
    sudo apt-get update -y
    sudo apt-get install -y "$pkg"
  else
    echo "$pkg is already installed."
  fi
}

# Check if Ollama server is running
check_ollama_server() {
  if curl -s "http://127.0.0.1:11434" &> /dev/null; then
    echo "Ollama server is already running."
  else
    echo "Ollama server is not running. Starting Ollama server..."
    ollama serve > ollama.log 2>&1 &
    OLLAMA_PID=$!
    echo "Ollama server started with PID $OLLAMA_PID"
    sleep 5
  fi
}

# Check if a model is available, and pull it if not
check_and_pull_model() {
  local model=$1
  if ollama list | grep -q "$model"; then
    echo "Model '$model' is already available."
  else
    echo "Model '$model' is not available. Pulling the model..."
    ollama pull "$model"
  fi
}

# Try to detect or create a superuser role we can use for psql commands.
# We only print the final superuser's name to stdout so the caller can capture it.
detect_superuser() {
  # 1) Try connecting as user "postgres"
  echo "Attempting to connect as 'postgres'..." >&2
  if PGPASSWORD="" psql -U postgres -tc "SELECT version();" &>/dev/null; then
    echo "postgres"
    return 0
  fi

  # 2) Try connecting as local OS username
  local local_user
  local_user="$(whoami)"
  echo "Attempting to connect as '$local_user'..." >&2
  if PGPASSWORD="" psql -U "$local_user" -tc "SELECT version();" &>/dev/null; then
    echo "$local_user"
    return 0
  fi

  # 3) Attempt to create a superuser role for $(whoami)
  echo "Neither 'postgres' nor '$local_user' can connect as superuser." >&2
  echo "Attempting to create a superuser role for '$local_user' via createuser -s..." >&2

  if command_exists createuser; then
    createuser -s "$local_user" 2>/dev/null || {
      echo "Failed to create superuser role '$local_user'." >&2
      echo "Please run 'createuser -s $local_user' manually and rerun this script." >&2
      exit 1
    }
    echo "Superuser role '$local_user' created successfully." >&2

    # Now check again
    if PGPASSWORD="" psql -U "$local_user" -tc "SELECT version();" &>/dev/null; then
      echo "$local_user"
      return 0
    else
      echo "Still failed to connect as '$local_user' even after createuser -s." >&2
      echo "Please investigate your Postgres installation manually." >&2
      exit 1
    fi
  else
    echo "createuser command not found. Please install or configure Postgres manually." >&2
    exit 1
  fi
}

# ------------------------------------------------------------------------------
# 3. INSTALL DEPENDENCIES (yt-dlp, ffmpeg, ollama)
# ------------------------------------------------------------------------------
if [ "$IS_MAC" = true ]; then
  ensure_homebrew

  # We'll install "postgres" (an alias for the postgresql formula) and "pgvector" as well
  BREW_PACKAGES=("postgresql@14" "pgvector" "yt-dlp" "ffmpeg" "ollama")
  for pkg in "${BREW_PACKAGES[@]}"; do
    install_if_missing_brew "$pkg"
  done
fi

if [ "$IS_LINUX" = true ]; then
  ensure_apt
  APT_PACKAGES=("yt-dlp" "ffmpeg" "postgresql" "postgresql-contrib")
  for pkg in "${APT_PACKAGES[@]}"; do
    install_if_missing_apt "$pkg"
  done

  if ! command_exists ollama; then
    echo "Ollama is not installed. There's no official apt package yet."
    echo "Please see: https://github.com/jmorganca/ollama"
    exit 1
  else
    echo "Ollama is already installed."
  fi
fi

# ------------------------------------------------------------------------------
# 4. SETUP .ENV
# ------------------------------------------------------------------------------
if [ -f ".env" ]; then
  echo ""
  echo ".env file already exists. Skipping copy of .env.example."
  echo ""
else
  echo ""
  echo ".env file does not exist. Copying .env.example to .env."
  echo ""
  cp .env.example .env
fi

# ------------------------------------------------------------------------------
# 5. OLLAMA SERVER AND MODELS
# ------------------------------------------------------------------------------
if command_exists ollama; then
  check_ollama_server
  check_and_pull_model "qwen2.5:0.5b"
fi

# ------------------------------------------------------------------------------
# 6. NPM DEPENDENCIES
# ------------------------------------------------------------------------------
echo ""
echo "Installing npm dependencies..."
echo ""
npm install

# ------------------------------------------------------------------------------
# 7. WHISPER.CPP SETUP
# ------------------------------------------------------------------------------
if [ -d "whisper.cpp" ]; then
  echo "whisper.cpp directory already exists. Skipping clone and setup."
else
  echo "Cloning whisper.cpp repository..."
  git clone https://github.com/ggerganov/whisper.cpp.git

  echo "Downloading whisper models..."
  bash ./whisper.cpp/models/download-ggml-model.sh tiny
  bash ./whisper.cpp/models/download-ggml-model.sh base
  # bash ./whisper.cpp/models/download-ggml-model.sh large-v3-turbo

  echo "Compiling whisper.cpp..."
  cmake -B whisper.cpp/build -S whisper.cpp
  cmake --build whisper.cpp/build --config Release

  rm -rf whisper.cpp/.git
fi

# ------------------------------------------------------------------------------
# 8. POSTGRES SETUP & PGVECTOR
# ------------------------------------------------------------------------------
echo ""
echo "PostgreSQL setup..."
echo "Loading environment variables from .env (if present)..."
if [ -f ".env" ]; then
  set -a
  . .env
  set +a
fi

# Ensure required env vars
if [ -z "$PGHOST" ] || [ -z "$PGUSER" ] || [ -z "$PGPASSWORD" ] || [ -z "$PGDATABASE" ]; then
  echo "One or more Postgres environment variables are not set."
  echo "Please ensure PGHOST, PGUSER, PGPASSWORD, PGDATABASE, and optionally PGPORT are in .env or your environment."
  echo "Skipping database setup."
  exit 1
fi

if [ "$IS_MAC" = true ]; then
  echo ""
  echo "Setting up PostgreSQL on macOS with Homebrew..."
  echo "Starting PostgreSQL service with Homebrew..."
  brew services start postgresql || true
fi

if [ "$IS_LINUX" = true ]; then
  echo ""
  echo "Setting up PostgreSQL on Linux..."
  echo "Starting PostgreSQL service..."
  sudo service postgresql start
fi

echo ""
echo "Detecting a superuser for initial psql commands..."
PSQL_SUPERUSER="$(detect_superuser)"
echo "Superuser role detected: $PSQL_SUPERUSER"

# ------------------------------------------------------------------------------
# 8a. CREATE USER (ROLE) IF MISSING
# ------------------------------------------------------------------------------
echo ""
echo "Checking if role '$PGUSER' exists..."
ROLE_EXISTS=$(PGUSER="$PSQL_SUPERUSER" PGPASSWORD="" psql -U "$PSQL_SUPERUSER" -tc "SELECT 1 FROM pg_roles WHERE rolname='$PGUSER'" 2>/dev/null | grep -q 1; echo $?)
if [ "$ROLE_EXISTS" -eq 0 ]; then
  echo "Role '$PGUSER' already exists."
else
  echo "Creating role '$PGUSER' with LOGIN and CREATEDB..."
  if ! PGPASSWORD="" psql -U "$PSQL_SUPERUSER" -c "CREATE ROLE $PGUSER WITH LOGIN CREATEDB PASSWORD '$PGPASSWORD'"; then
    echo "Failed to create role '$PGUSER'!"
    exit 1
  fi
  echo "Role '$PGUSER' created successfully."
fi

# ------------------------------------------------------------------------------
# 8b. CREATE DATABASE IF MISSING
# ------------------------------------------------------------------------------
echo ""
echo "Checking if database '$PGDATABASE' exists..."
DB_EXISTS=$(PGUSER="$PSQL_SUPERUSER" PGPASSWORD="" psql -U "$PSQL_SUPERUSER" -tc "SELECT 1 FROM pg_database WHERE datname = '$PGDATABASE'" 2>/dev/null | grep -q 1; echo $?)
if [ "$DB_EXISTS" -eq 0 ]; then
  echo "Database '$PGDATABASE' already exists."
else
  echo "Creating database '$PGDATABASE' owned by '$PGUSER'..."
  if ! PGPASSWORD="" createdb -U "$PSQL_SUPERUSER" -O "$PGUSER" "$PGDATABASE"; then
    echo "Failed to create database '$PGDATABASE'!"
    exit 1
  fi
  echo "Database '$PGDATABASE' created successfully."
fi

# ------------------------------------------------------------------------------
# 8c. ENSURE PGVECTOR EXTENSION
# ------------------------------------------------------------------------------
echo ""
echo "Ensuring 'vector' extension is available in '$PGDATABASE'..."
if ! PGPASSWORD="" psql -U "$PSQL_SUPERUSER" -d "$PGDATABASE" -c "CREATE EXTENSION IF NOT EXISTS vector" &>/dev/null; then
  echo "Failed to create or confirm 'vector' extension!"
  echo ""
  echo "If you see an error about 'could not open extension control file', then you"
  echo "likely need to install pgvector at the system level. On macOS, try:"
  echo "  brew install pgvector"
  echo "On Linux/apt, see pgvector docs: https://github.com/pgvector/pgvector"
  exit 1
fi
echo "Extension 'vector' is set up successfully."

# ------------------------------------------------------------------------------
# 8d. VERIFY WE CAN CONNECT WITH PGUSER
# ------------------------------------------------------------------------------
echo ""
echo "Verifying we can connect as '$PGUSER' to '$PGDATABASE'..."
if ! PGPASSWORD="$PGPASSWORD" psql -U "$PGUSER" -d "$PGDATABASE" -c "SELECT 'Connected as ' || current_user || ', database=' || current_database()" &>/dev/null; then
  echo "Failed to connect as '$PGUSER' to '$PGDATABASE'!"
  echo "Check your credentials or remove the old DB/user and rerun setup."
  exit 1
fi

echo ""
echo "PostgreSQL setup complete."
echo ""
echo "Setup completed successfully!"

echo ""
echo "To run your server in watch mode with Postgres ready, use a command like:"
echo "  PGHOST=$PGHOST PGUSER=$PGUSER PGPASSWORD=$PGPASSWORD PGDATABASE=$PGDATABASE PGPORT=${PGPORT:-5432} OPENAI_API_KEY=sk-xxxxxx \\"
echo "    npm run tsx:base -- --watch src/fastify.ts"