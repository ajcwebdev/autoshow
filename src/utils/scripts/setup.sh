#!/usr/bin/env zsh

##############################################################################
# Mac-only setup script w/ pgvector + PostgreSQL@16.
# - Logs go to a timestamped file: "setup-YYYYmmdd-HHMMSS.log"
#   * If the script fails, we preserve the log file.
#   * If the script succeeds, we remove it.
# - Verbose output (no quiet mode).
# - No final superuser promotion of the normal role.
# - Checks for older Postgres versions, Docker environment, version mismatches, etc.
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

detect_and_stop_older_postgres() {
  # We'll see if postgresql@14 or the unversioned "postgresql" is installed & running.
  local other_versions=("postgresql" "postgresql@14" "postgresql@15" "postgresql@17")
  # The current is "postgresql@16", so we skip that in this detection loop.

  local found_running=false
  for ov in "${other_versions[@]}"; do
    if brew ls --versions "$ov" &>/dev/null; then
      # It's installed. Check if running:
      local is_running
      is_running="$(brew services list | grep -E "^$ov\s" | grep started || true)"
      if [ -n "$is_running" ]; then
        echo "Detected older Postgres formula '$ov' is running."
        found_running=true
        # Prompt to stop it
        read -q "?Stop the older '$ov' service now? [y/N]: "
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
          brew services stop "$ov" || true
        fi
      fi
    fi
  done

  if $found_running; then
    echo "Older Postgres version(s) were found running. Attempted to stop as requested."
  else
    echo "No older Postgres versions detected running. Continuing."
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
# 3. INSTALL DEPENDENCIES, DETECT OLDER VERSIONS, ETC.
##############################################################################
if [ "$IS_MAC" = true ]; then
  ensure_homebrew

  echo "==> Checking for older Postgres versions..."
  detect_and_stop_older_postgres

  echo "==> Installing dependencies..."
  quiet_brew_install "postgresql@16"
  quiet_brew_install "yt-dlp"
  quiet_brew_install "ffmpeg"
  quiet_brew_install "ollama"
  quiet_brew_install "cmake"
fi

##############################################################################
# 4. Force usage of postgresql@16; check version match
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

echo "Using Postgres@17 prefix: $PG_PREFIX"

# Check that `pg_config --version` actually says 17.x
INSTALLED_VERSION="$("$PG_PREFIX/bin/pg_config" --version || true)"
if [[ ! "$INSTALLED_VERSION" =~ 17\.[0-9] ]]; then
  echo "WARNING: Found postgresql@16, but 'pg_config --version' returned:"
  echo "         '$INSTALLED_VERSION'"
  echo "We will attempt to rebuild or correct installation for 17.x..."
  # Potentially force a reinstall from source
  brew uninstall pgvector || true
  PG_CONFIG="$PG_PREFIX/bin/pg_config" brew install pgvector --build-from-source || true
fi

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

  echo "Downloading whisper models (tiny, base)..."
  bash ./whisper.cpp/models/download-ggml-model.sh tiny &>/dev/null
  bash ./whisper.cpp/models/download-ggml-model.sh base &>/dev/null
  bash ./whisper.cpp/models/download-ggml-model.sh large-v3-turbo &>/dev/null

  echo "Compiling whisper.cpp..."
  cmake -B whisper.cpp/build -S whisper.cpp &>/dev/null
  cmake --build whisper.cpp/build --config Release &>/dev/null

  rm -rf whisper.cpp/.git
fi

##############################################################################
# 9. POSTGRES SETUP & PGVECTOR
##############################################################################
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

# Attempt to create extension as a superuser (postgres or local user)
echo ""
echo "Ensuring 'vector' extension is installed..."

# 9a. Find vector.control
PG_CONFIG="$PG_PREFIX/bin/pg_config"
SHARE_DIR="$($PG_CONFIG --sharedir)"
echo "Sharedir = $SHARE_DIR"
# We'll do a minimal check for vector.control; skip big directory logs
VECTOR_FILE="$(find "$SHARE_DIR" -name vector.control 2>/dev/null | head -n1 || true)"
if [ -z "$VECTOR_FILE" ]; then
  echo "vector.control not found. Attempting to (re)install pgvector from source..."
  brew uninstall pgvector || true
  PG_CONFIG="$PG_PREFIX/bin/pg_config" brew install pgvector --build-from-source || true
fi

# Now create the extension as a superuser
echo "Attempting to create extension 'vector' as superuser..."
SUPERUSER_TO_USE="postgres"
if ! PGPASSWORD="" psql -U postgres -d "$PGDATABASE" -c "SELECT 1" &>/dev/null; then
  # fallback to local user if 'postgres' not accessible
  SUPERUSER_TO_USE="$USER"
fi

PGPASSWORD="" psql -U "$SUPERUSER_TO_USE" -d "$PGDATABASE" \
  -c "CREATE EXTENSION IF NOT EXISTS vector" &>/dev/null
echo "Successfully created/confirmed 'vector' extension with superuser: $SUPERUSER_TO_USE"

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