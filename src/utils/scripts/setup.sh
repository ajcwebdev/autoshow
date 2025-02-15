#!/usr/bin/env bash

##############################################################################
# Ultra-verbose Mac-only setup script for debugging the pgvector location.
# - Logs everything to setup.log (and prints to console).
# - No libpq or initdb references.
# - Installs postgresql@17, pgvector, etc. quietly but logs debug info heavily.
# - Creates extension as "postgres" superuser, then makes "myuser" a superuser.
##############################################################################

# Send all output (stdout+stderr) to setup.log as well as the terminal
exec > >(tee -a setup.log) 2>&1
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
  # Silently install a package if it isn’t already
  local pkg="$1"
  if ! brew list --formula | grep -qx "$pkg"; then
    echo "DEBUG: Installing $pkg (silent)..."
    brew install "$pkg" &>/dev/null
  else
    echo "DEBUG: $pkg is already installed."
  fi
}

command_exists() {
  command -v "$1" &>/dev/null
}

ensure_homebrew() {
  if ! command_exists brew; then
    echo "Homebrew not found! Please install from https://brew.sh/"
    exit 1
  fi
}

# Return the path to Homebrew's postgresql@17 install, or empty if not found
get_brew_postgres_prefix() {
  local formula="postgresql@17"
  if brew ls --versions "$formula" &>/dev/null; then
    brew --prefix "$formula" 2>/dev/null || true
  else
    echo ""
  fi
}

get_brew_pg_config() {
  local pg_prefix
  pg_prefix="$(get_brew_postgres_prefix)"
  if [ -n "$pg_prefix" ] && [ -x "$pg_prefix/bin/pg_config" ]; then
    echo "$pg_prefix/bin/pg_config"
  else
    echo ""
  fi
}

##############################################################################
# 3. INSTALL DEPENDENCIES (macOS ONLY), NO libpq AND NO initdb
##############################################################################
if [ "$IS_MAC" = true ]; then
  ensure_homebrew

  echo "DEBUG: Homebrew overall prefix: $(brew --prefix || true)"
  echo "DEBUG: Installing dependencies quietly..."

  quiet_brew_install "postgresql@17"   # We'll rely on user to have it started
  quiet_brew_install "yt-dlp"
  quiet_brew_install "ffmpeg"
  quiet_brew_install "ollama"
  quiet_brew_install "cmake"
fi

##############################################################################
# Force usage of Homebrew’s postgresql@17
##############################################################################
echo "DEBUG: Checking info for postgresql@17..."
brew info postgresql@17 || true

echo "DEBUG: Checking installed versions for postgresql@17..."
brew list --versions postgresql@17 || true

BREW_PG_CONFIG="$(get_brew_pg_config)"
if [ -z "$BREW_PG_CONFIG" ]; then
  echo "Error: Could not locate a Homebrew postgresql@17 installation with a valid pg_config."
  exit 1
fi

BREW_PG_BIN="$(dirname "$BREW_PG_CONFIG")"
BREW_PG_PREFIX="$(dirname "$BREW_PG_BIN")"
echo "DEBUG: postgresql@17 prefix: $BREW_PG_PREFIX"
echo "DEBUG: postgresql@17 bin dir: $BREW_PG_BIN"
echo "DEBUG: Prepending $BREW_PG_BIN to PATH..."
export PATH="$BREW_PG_BIN:$PATH"
echo "DEBUG: Updated PATH: $PATH"

echo "Attempting to start (or restart) postgresql@17 (quietly)..."
brew services start postgresql@17 &>/dev/null || true

##############################################################################
# 4. .ENV SETUP
##############################################################################
if [ -f ".env" ]; then
  echo ".env file already exists, skipping copy."
else
  cp .env.example .env
  echo "Created .env from .env.example"
fi

##############################################################################
# 5. OLLAMA SERVER AND MODELS
##############################################################################
if command_exists ollama; then
  echo "Checking if Ollama server is running..."
  if curl -s "http://127.0.0.1:11434" &>/dev/null; then
    echo "Ollama server is already running."
  else
    echo "Starting Ollama server..."
    ollama serve > ollama.log 2>&1 &
    OLLAMA_PID=$!
    echo "Ollama server started with PID $OLLAMA_PID"
    sleep 5
  fi

  echo "Checking if 'qwen2.5:0.5b' model is available..."
  if ollama list | grep -q "qwen2.5:0.5b"; then
    echo "'qwen2.5:0.5b' model is already available."
  else
    echo "Pulling 'qwen2.5:0.5b' model..."
    ollama pull "qwen2.5:0.5b"
  fi
fi

##############################################################################
# 6. NPM DEPENDENCIES
##############################################################################
echo "Installing npm dependencies..."
npm install

##############################################################################
# 7. WHISPER.CPP SETUP
##############################################################################
if [ -d "whisper.cpp" ]; then
  echo "whisper.cpp already exists, skipping."
else
  echo "Cloning whisper.cpp..."
  git clone https://github.com/ggerganov/whisper.cpp.git &>/dev/null

  echo "Downloading whisper models (tiny, base)..."
  bash ./whisper.cpp/models/download-ggml-model.sh tiny &>/dev/null
  bash ./whisper.cpp/models/download-ggml-model.sh base &>/dev/null

  echo "Compiling whisper.cpp..."
  cmake -B whisper.cpp/build -S whisper.cpp &>/dev/null
  cmake --build whisper.cpp/build --config Release &>/dev/null

  rm -rf whisper.cpp/.git
fi

##############################################################################
# 8. POSTGRES SETUP & PGVECTOR (NO initdb)
##############################################################################
echo "Loading environment variables from .env (if present)..."
if [ -f ".env" ]; then
  set -a
  . .env
  set +a
fi

# Ensure required env vars
if [ -z "${PGHOST:-}" ] || [ -z "${PGUSER:-}" ] || [ -z "${PGPASSWORD:-}" ] || [ -z "${PGDATABASE:-}" ]; then
  echo "Missing PGHOST/PGUSER/PGPASSWORD/PGDATABASE in env. Skipping DB setup."
  exit 1
fi

# 8a. CREATE USER (ROLE) IF MISSING
echo "Checking if role '$PGUSER' exists in Postgres..."
ROLE_EXISTS=$(
  PGPASSWORD="" psql -U "$USER" -d postgres -tAc \
    "SELECT 1 FROM pg_roles WHERE rolname='$PGUSER'" 2>/dev/null \
    || true
)
echo "DEBUG: 'SELECT 1 FROM pg_roles...' returned: '$ROLE_EXISTS'"

if [ "$ROLE_EXISTS" = "1" ]; then
  echo "Role '$PGUSER' already exists."
else
  echo "Creating role '$PGUSER' with LOGIN CREATEDB..."
  if ! PGPASSWORD="" psql -U "$USER" -d postgres \
       -c "CREATE ROLE $PGUSER WITH LOGIN CREATEDB PASSWORD '$PGPASSWORD'"; then
    echo "Error creating role '$PGUSER'. Check your superuser privileges."
    exit 1
  fi
  echo "Role '$PGUSER' created."
fi

# 8b. CREATE DATABASE IF MISSING
echo "Checking if database '$PGDATABASE' exists..."
DB_EXISTS=$(
  PGPASSWORD="" psql -U "$USER" -d postgres -tAc \
    "SELECT 1 FROM pg_database WHERE datname='$PGDATABASE'" 2>/dev/null \
    || true
)
echo "DEBUG: 'SELECT 1 FROM pg_database...' returned: '$DB_EXISTS'"

if [ "$DB_EXISTS" = "1" ]; then
  echo "Database '$PGDATABASE' already exists."
else
  echo "Creating database '$PGDATABASE' owned by '$PGUSER'..."
  if ! PGPASSWORD="" createdb \
       -U "$USER" \
       -h "${PGHOST:-localhost}" \
       -p "${PGPORT:-5432}" \
       -O "$PGUSER" "$PGDATABASE"; then
    echo "Error creating database '$PGDATABASE'."
    exit 1
  fi
  echo "Database '$PGDATABASE' created."
fi

# 8c. ENSURE PGVECTOR EXTENSION - With extensive logging
echo ""
echo "Checking for 'vector' extension in '$PGDATABASE'..."

echo "DEBUG: Brew info for pgvector:"
brew info pgvector || true

echo "DEBUG: Brew installed versions for pgvector:"
brew list --versions pgvector || true

echo "DEBUG: Checking postgresql@17 share dir via pg_config..."
PG_SHAREDIR="$($BREW_PG_CONFIG --sharedir)"
echo "DEBUG: \$PG_SHAREDIR is $PG_SHAREDIR"

EXT_DIR1="$PG_SHAREDIR/postgresql@17/extension"   # sometimes used
EXT_DIR2="$PG_SHAREDIR/postgresql/extension"      # sometimes used
EXT_DIR3="$PG_SHAREDIR/extension"                 # fallback
echo "DEBUG: Potential extension dirs:"
echo "DEBUG: 1) $EXT_DIR1"
echo "DEBUG: 2) $EXT_DIR2"
echo "DEBUG: 3) $EXT_DIR3"

echo "DEBUG: ls -l of $EXT_DIR1 (if exists):"
[ -d "$EXT_DIR1" ] && ls -l "$EXT_DIR1" || echo "(does not exist)"

echo "DEBUG: ls -l of $EXT_DIR2 (if exists):"
[ -d "$EXT_DIR2" ] && ls -l "$EXT_DIR2" || echo "(does not exist)"

echo "DEBUG: ls -l of $EXT_DIR3 (if exists):"
[ -d "$EXT_DIR3" ] && ls -l "$EXT_DIR3" || echo "(does not exist)"

vector_control_exists=""

if [ -f "$EXT_DIR1/vector.control" ]; then
  vector_control_exists="$EXT_DIR1/vector.control"
elif [ -f "$EXT_DIR2/vector.control" ]; then
  vector_control_exists="$EXT_DIR2/vector.control"
elif [ -f "$EXT_DIR3/vector.control" ]; then
  vector_control_exists="$EXT_DIR3/vector.control"
fi

if [ -z "$vector_control_exists" ]; then
  echo "DEBUG: 'vector.control' not found in EXT_DIR1/2/3. Reinstalling pgvector (quietly) now..."
  brew reinstall pgvector &>/dev/null || true

  echo "DEBUG: Checking again after reinstall..."
  if [ -f "$EXT_DIR1/vector.control" ]; then
    vector_control_exists="$EXT_DIR1/vector.control"
  elif [ -f "$EXT_DIR2/vector.control" ]; then
    vector_control_exists="$EXT_DIR2/vector.control"
  elif [ -f "$EXT_DIR3/vector.control" ]; then
    vector_control_exists="$EXT_DIR3/vector.control"
  fi

  if [ -z "$vector_control_exists" ]; then
    echo "ERROR: pgvector still not found in any recognized extension directory!"

    echo "DEBUG: Doing a broader 'find' under $BREW_PG_PREFIX and /opt/homebrew for vector.control..."
    find "$BREW_PG_PREFIX" -name vector.control -print || echo "No hits in $BREW_PG_PREFIX"
    find /opt/homebrew -name vector.control -print || echo "No hits in /opt/homebrew"

    exit 1
  fi
fi

echo "DEBUG: Found vector.control at: $vector_control_exists"

##############################################################################
# 8c-i. CREATE EXTENSION AS SUPERUSER
##############################################################################
# We attempt to connect as 'postgres' first; fallback to $USER if that is superuser
echo ""
echo "Attempting to create extension 'vector' as a superuser..."

superuser_to_use="postgres"

# Check if we can connect as 'postgres' with no password:
if ! PGPASSWORD="" psql -U postgres -d "$PGDATABASE" -c "SELECT version();" &>/dev/null; then
  # If that fails, fallback to connecting as your local macOS user, if it is superuser
  echo "Cannot connect as 'postgres'. Falling back to '$USER'..."
  superuser_to_use="$USER"
fi

echo "Using superuser role: $superuser_to_use"

if ! PGPASSWORD="" psql -U "$superuser_to_use" -d "$PGDATABASE" \
     -c "CREATE EXTENSION IF NOT EXISTS vector" &>/dev/null; then
  echo "ERROR: Could not create extension 'vector' as superuser ($superuser_to_use)."
  exit 1
fi

echo "DEBUG: Successfully created/confirmed 'vector' extension with superuser '$superuser_to_use'."

##############################################################################
# 8c-ii. Permanently promote $PGUSER to SUPERUSER
##############################################################################
echo "Promoting role '$PGUSER' to SUPERUSER (permanently)..."

if ! PGPASSWORD="" psql -U "$superuser_to_use" -d postgres \
     -c "ALTER ROLE $PGUSER WITH SUPERUSER;" &>/dev/null; then
  echo "ERROR: Could not grant superuser to '$PGUSER'."
  exit 1
fi

echo "DEBUG: '$PGUSER' is now a superuser."

##############################################################################
# 8d. Verify Connection
##############################################################################
echo ""
echo "Verifying connection as '$PGUSER' to '$PGDATABASE' (now a superuser)..."
if ! PGPASSWORD="$PGPASSWORD" psql \
      -U "$PGUSER" \
      -h "${PGHOST:-localhost}" \
      -p "${PGPORT:-5432}" \
      -d "$PGDATABASE" \
      -c "SELECT 'Connected as ' || current_user || ', DB=' || current_database(), 'SUPERUSER=' || (SELECT rolsuper FROM pg_roles WHERE rolname=current_user)::text;"; then
  echo "ERROR: Could not connect as $PGUSER to $PGDATABASE!"
  exit 1
fi

##############################################################################
# DONE
##############################################################################
echo ""
echo "Setup completed successfully!"
echo "Logs have been written to setup.log."
echo ""
echo "You can now run your server, for example:"
echo "  PGHOST=$PGHOST PGPORT=${PGPORT:-5432} PGUSER=$PGUSER PGPASSWORD=$PGPASSWORD PGDATABASE=$PGDATABASE \\"
echo "    npm run tsx:base -- --watch src/fastify.ts"