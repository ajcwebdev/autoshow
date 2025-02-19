#!/usr/bin/env bash

##############################################################################
# Mac-only setup script w/ pgvector + PostgreSQL@16.
# - Logs go to a timestamped file: "setup-YYYYmmdd-HHMMSS.log"
#   * If the script fails, we preserve the log file.
#   * If the script succeeds, we remove it.
# - Verbose output (no quiet mode).
# - Includes logic to completely remove any existing Postgres + data directories.
# - Builds pgvector from source (no brew formula).
##############################################################################

# 0) Create a timestamped logfile and setup a trap to remove it on success
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
LOGFILE="setup-${TIMESTAMP}.log"

# We'll capture all stdout/stderr into this log *and* show in console
exec > >(tee -a "$LOGFILE") 2>&1

# If the script ends with an error, keep the log; if success, remove it
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

# Safeguards
set -euo pipefail

##############################################################################
# 1. OS DETECTION (Mac-only, zsh assumed)
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
  # Verbose to console, but we won't spam brew install logs
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
  # A common approach is to check for /.dockerenv or /run/.containerenv
  if [ -f "/.dockerenv" ] || [ -f "/run/.containerenv" ]; then
    return 0
  fi
  return 1
}

##############################################################################
# 3. REMOVE ALL EXISTING POSTGRES + INSTALL DEPENDENCIES
##############################################################################
if [ "$IS_MAC" = true ]; then
  ensure_homebrew

  echo "==> Stopping all Postgres services (any version)..."
  brew services stop postgresql || true
  brew services stop postgresql@13 || true
  brew services stop postgresql@14 || true
  brew services stop postgresql@15 || true
  brew services stop postgresql@17 || true

  # Just in case any processes are still lingering
  echo "==> Killing any leftover postgres processes..."
  pkill -x postgres || true

  echo "==> Removing common Postgres data directories..."
  rm -rf /usr/local/var/postgres
  rm -rf /opt/homebrew/var/postgres

  echo "==> Uninstalling all Postgres formulae found in Homebrew..."
  brew list --formula | grep -E '^postgresql(@.*)?$' || true \
    | xargs -I {} brew uninstall --force {} || true

  echo ""
  echo "================================================================="
  echo "PostgreSQL has been completely removed (via Homebrew), "
  echo "and all local Postgres data directories are deleted."
  echo "================================================================="

  echo ""
  echo "==> Installing dependencies..."
  quiet_brew_install "postgresql@16"
  quiet_brew_install "yt-dlp"
  quiet_brew_install "ffmpeg"
  quiet_brew_install "ollama"
  quiet_brew_install "cmake"
fi

##############################################################################
# 4. Force usage of postgresql@16
##############################################################################
echo "==> Locating postgresql@16..."
PG_PREFIX="$(brew --prefix postgresql@16 2>/dev/null || true)"

if [ -z "$PG_PREFIX" ] || [ ! -d "$PG_PREFIX" ]; then
  echo "Error: Could not locate a Homebrew postgresql@16 installation directory."
  exit 1
fi

# Validate that we have pg_config from the correct path
if [ ! -x "$PG_PREFIX/bin/pg_config" ]; then
  echo "Error: $PG_PREFIX/bin/pg_config not found or not executable."
  exit 1
fi

echo "Using Postgres@16 prefix: $PG_PREFIX"

# Prepend bin so we pick up the right Postgres commands
export PATH="$PG_PREFIX/bin:$PATH"

# If not in Docker, start the service
if is_docker_container; then
  echo "Detected Docker environment. Skipping 'brew services start' for postgresql@16."
else
  echo "Starting (or restarting) 'postgresql@16' via brew services..."
  brew services start postgresql@16 || true
fi

##############################################################################
# 5. .ENV SETUP
##############################################################################
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

##############################################################################
# 6. OLLAMA SERVER AND MODELS
##############################################################################
if command_exists ollama; then
  echo "Checking if Ollama server is running..."
  if curl -s "http://127.0.0.1:11434" &>/dev/null; then
    echo "Ollama server is already running."
  else
    echo "Starting Ollama server..."
    ollama serve > ollama.log 2>&1 &
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
# 7. NPM DEPENDENCIES
##############################################################################
echo "Installing npm dependencies..."
npm install

##############################################################################
# 8. WHISPER.CPP SETUP
##############################################################################
if [ -d "whisper.cpp" ]; then
  echo "whisper.cpp already exists, skipping."
else
  echo "Cloning whisper.cpp..."
  git clone https://github.com/ggerganov/whisper.cpp.git &>/dev/null

  echo "Downloading whisper models (tiny, base, large-v3-turbo)..."
  bash ./whisper.cpp/models/download-ggml-model.sh tiny &>/dev/null
  bash ./whisper.cpp/models/download-ggml-model.sh base &>/dev/null
  bash ./whisper.cpp/models/download-ggml-model.sh large-v3-turbo &>/dev/null

  echo "Compiling whisper.cpp..."
  cmake -B whisper.cpp/build -S whisper.cpp &>/dev/null
  cmake --build whisper.cpp/build --config Release &>/dev/null

  rm -rf whisper.cpp/.git
fi

##############################################################################
# 9. POSTGRES SETUP (Role, DB) & BUILD PGVECTOR FROM SOURCE
##############################################################################
# 9a. Ensure role + DB exist
echo "Checking if role '$PGUSER' exists..."
ROLE_EXISTS=$(PGPASSWORD="" psql -U "${USER}" -d postgres -tAc \
  "SELECT 1 FROM pg_roles WHERE rolname='$PGUSER'" 2>/dev/null || true)

if [ "$ROLE_EXISTS" = "1" ]; then
  echo "Role '$PGUSER' already exists."
else
  echo "Creating role '$PGUSER' with LOGIN and CREATEDB..."
  PGPASSWORD="" psql -U "${USER}" -d postgres \
    -c "CREATE ROLE $PGUSER WITH LOGIN CREATEDB PASSWORD '$PGPASSWORD'"
fi

echo "Checking if database '$PGDATABASE' exists..."
DB_EXISTS=$(PGPASSWORD="" psql -U "${USER}" -d postgres -tAc \
  "SELECT 1 FROM pg_database WHERE datname='$PGDATABASE'" 2>/dev/null || true)

if [ "$DB_EXISTS" = "1" ]; then
  echo "Database '$PGDATABASE' already exists."
else
  echo "Creating database '$PGDATABASE' owned by '$PGUSER'..."
  PGPASSWORD="" createdb -U "${USER}" -h "${PGHOST}" -p "${PGPORT:-5432}" -O "$PGUSER" "$PGDATABASE"
fi

# 9b. Build and install pgvector from source
echo ""
echo "Installing pgvector from source for Postgres@16..."
# You can pick a different dir than /tmp if you want
TMP_PGVECTOR_DIR="/tmp/pgvector"
rm -rf "$TMP_PGVECTOR_DIR"
git clone https://github.com/pgvector/pgvector.git "$TMP_PGVECTOR_DIR" &>/dev/null

cd "$TMP_PGVECTOR_DIR"
make PG_CONFIG="$PG_PREFIX/bin/pg_config" &>/dev/null
make install PG_CONFIG="$PG_PREFIX/bin/pg_config" &>/dev/null
cd - &>/dev/null

# 9c. Create the extension once, as a superuser
echo ""
echo "Attempting to create extension 'vector' as superuser..."
SUPERUSER_TO_USE="postgres"
if ! PGPASSWORD="" psql -U postgres -d "$PGDATABASE" -c "SELECT 1" &>/dev/null; then
  # fallback to local user if 'postgres' not accessible
  SUPERUSER_TO_USE="$USER"
fi

PGPASSWORD="" psql -U "$SUPERUSER_TO_USE" -d "$PGDATABASE" \
  -c "CREATE EXTENSION IF NOT EXISTS vector"

##############################################################################
# 10. Final Checks
##############################################################################
echo ""
echo "Verifying that 'vector' is recognized in '$PGDATABASE'..."
PSQL_CHECK=$(PGPASSWORD="$PGPASSWORD" psql -U "$PGUSER" -d "$PGDATABASE" -tAc \
  "SELECT extname FROM pg_extension WHERE extname='vector';" 2>/dev/null || true)
if [ "$PSQL_CHECK" = "vector" ]; then
  echo "pgvector extension is active in $PGDATABASE."
else
  echo "ERROR: 'vector' extension not found in $PGDATABASE after creation!"
  exit 1
fi

echo ""
echo "Setup completed successfully!"
echo "You can now run your server:"
echo "  npm run serve"
echo ""
echo "Environment variables used:"
echo ""
echo "PGHOST=$PGHOST"
echo "PGPORT=${PGPORT:-5432}"
echo "PGUSER=$PGUSER"
echo "PGPASSWORD=$PGPASSWORD"
echo "PGDATABASE=$PGDATABASE"