#!/usr/bin/env bash
# .github/setup/02-homebrew-and-pg.sh

##############################################################################
# Removes old Postgres + installs postgresql@16 via Homebrew
# Then creates DB/role, builds pgvector from source
##############################################################################

if [ "$IS_MAC" = true ]; then
  ensure_homebrew

  echo "==> Stopping all Postgres services (any version)..."
  for ver in '' '@13' '@14' '@15' '@17'; do
    brew services stop "postgresql${ver}" || true
  done

  echo "==> Killing any leftover postgres processes..."
  pkill -x postgres || true

  echo "==> Removing common Postgres data directories..."
  rm -rf /usr/local/var/postgres /opt/homebrew/var/postgres

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
  for pkg in postgresql@16 yt-dlp ffmpeg ollama cmake; do
    quiet_brew_install "$pkg"
  done
fi

# Force usage of postgresql@16
echo "==> Locating postgresql@16..."
PG_PREFIX="$(brew --prefix postgresql@16 2>/dev/null || true)"

if [ -z "$PG_PREFIX" ] || [ ! -d "$PG_PREFIX" ]; then
  echo "Error: Could not locate a Homebrew postgresql@16 installation directory."
  exit 1
fi

if [ ! -x "$PG_PREFIX/bin/pg_config" ]; then
  echo "Error: $PG_PREFIX/bin/pg_config not found or not executable."
  exit 1
fi

echo "Using Postgres@16 prefix: $PG_PREFIX"
export PATH="$PG_PREFIX/bin:$PATH"

if is_docker_container; then
  echo "Detected Docker environment. Skipping 'brew services start' for postgresql@16."
else
  echo "Starting (or restarting) 'postgresql@16' via brew services..."
  brew services start postgresql@16 || true
fi

##############################################################################
# Now create role, DB, and install pgvector
##############################################################################
echo "Checking if role '$PGUSER' exists..."
if [ "$(PGPASSWORD="" psql -U "${USER}" -d postgres -tAc \
  "SELECT 1 FROM pg_roles WHERE rolname='$PGUSER'" 2>/dev/null || true)" = "1" ]; then
  echo "Role '$PGUSER' already exists."
else
  echo "Creating role '$PGUSER' with LOGIN and CREATEDB..."
  PGPASSWORD="" psql -U "${USER}" -d postgres \
    -c "CREATE ROLE $PGUSER WITH LOGIN CREATEDB PASSWORD '$PGPASSWORD'"
fi

echo "Checking if database '$PGDATABASE' exists..."
if [ "$(PGPASSWORD="" psql -U "${USER}" -d postgres -tAc \
  "SELECT 1 FROM pg_database WHERE datname='$PGDATABASE'" 2>/dev/null || true)" = "1" ]; then
  echo "Database '$PGDATABASE' already exists."
else
  echo "Creating database '$PGDATABASE' owned by '$PGUSER'..."
  PGPASSWORD="" createdb -U "${USER}" -h "${PGHOST}" -p "${PGPORT:-5432}" -O "$PGUSER" "$PGDATABASE"
fi

echo ""
echo "Installing pgvector from source for Postgres@16..."
TMP_PGVECTOR_DIR="/tmp/pgvector"
rm -rf "$TMP_PGVECTOR_DIR"
git clone https://github.com/pgvector/pgvector.git "$TMP_PGVECTOR_DIR" &>/dev/null

(
  cd "$TMP_PGVECTOR_DIR"
  make PG_CONFIG="$PG_PREFIX/bin/pg_config" &>/dev/null
  make install PG_CONFIG="$PG_PREFIX/bin/pg_config" &>/dev/null
)

echo ""
echo "Attempting to create extension 'vector' as superuser..."
SUPERUSER_TO_USE="postgres"
if ! PGPASSWORD="" psql -U postgres -d "$PGDATABASE" -c "SELECT 1" &>/dev/null; then
  SUPERUSER_TO_USE="$USER"
fi

PGPASSWORD="" psql -U "$SUPERUSER_TO_USE" -d "$PGDATABASE" \
  -c "CREATE EXTENSION IF NOT EXISTS vector"