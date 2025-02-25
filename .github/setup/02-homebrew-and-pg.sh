#!/usr/bin/env bash
# .github/setup/02-homebrew-and-pg.sh
#
# 1) Uninstall *all* Postgres versions & remove data directories (via Homebrew)
# 2) Install postgresql@16
# 3) Manually initdb a fresh cluster at /opt/homebrew/var/postgresql@16
# 4) Manually start Postgres on port 5432
# 5) Wait for readiness
# 6) Create a SUPERUSER role named $PGUSER
# 7) Drop/create $PGDATABASE
# 8) Install pgvector
# 9) Force a full Prisma DB reset (drops all data, re-applies migrations)

if [ "$IS_MAC" != true ]; then
  echo "ERROR: This script only supports macOS."
  exit 1
fi

ensure_homebrew

echo "==> Stopping all Postgres services (any version)..."
for ver in '' '@13' '@14' '@15' '@16' '@17'; do
  brew services stop "postgresql${ver}" || true
done

echo "==> Killing any leftover postgres processes..."
pkill -x postgres || true

echo "==> Removing all Postgres data directories..."
rm -rf /usr/local/var/postgres* /usr/local/var/postgresql@*
rm -rf /opt/homebrew/var/postgres* /opt/homebrew/var/postgresql@*

echo "==> Uninstalling all Postgres formulae found in Homebrew..."
brew list --formula | grep -E '^postgresql(@.*)?$' || true \
  | xargs -I {} brew uninstall --force {} || true

echo ""
echo "================================================================="
echo "PostgreSQL (all versions) uninstalled, all local data directories removed."
echo "================================================================="

echo ""
echo "==> Installing postgresql@16..."
quiet_brew_install "postgresql@16"

# Path where Postgres@16 is installed:
PG_PREFIX="$(brew --prefix postgresql@16 2>/dev/null || true)"
if [ -z "$PG_PREFIX" ] || [ ! -d "$PG_PREFIX" ]; then
  echo "ERROR: Could not locate a Homebrew postgresql@16 installation directory!"
  exit 1
fi

# We'll define PGDATA explicitly in /opt/homebrew/var/postgresql@16
PGDATA="/opt/homebrew/var/postgresql@16"
export PGDATA

echo "Using Postgres@16 prefix: $PG_PREFIX"
echo "Using PGDATA directory:   $PGDATA"
echo "Adding $PG_PREFIX/bin to PATH..."
export PATH="$PG_PREFIX/bin:$PATH"

##############################################################################
# 1) initdb: create a new cluster
##############################################################################
echo ""
echo "==> Initializing fresh Postgres data folder: $PGDATA"
rm -rf "$PGDATA"
mkdir -p "$PGDATA"
initdb --locale=C -E UTF8 -D "$PGDATA"

##############################################################################
# 2) Manually start Postgres (bypass brew services) on port 5432
##############################################################################
echo ""
echo "==> Starting Postgres manually on port 5432..."
pg_ctl start -D "$PGDATA" -l /tmp/postgres.log -o "-p 5432" &
sleep 1  # give it a moment to spawn

##############################################################################
# 3) Wait up to 30 seconds for Postgres to accept connections
##############################################################################
echo ""
echo "Waiting up to 30 seconds for Postgres to become ready..."
READY=0
for i in {1..30}; do
  if pg_isready -h "localhost" -p "5432" >/dev/null 2>&1; then
    READY=1
    echo "Postgres is up (after $i second(s))!"
    break
  fi
  sleep 1
done

if [ "$READY" -eq 0 ]; then
  echo "ERROR: Postgres never became ready after 30 seconds!"
  cat /tmp/postgres.log || true
  exit 1
fi

##############################################################################
# 4) Create a SUPERUSER role for $PGUSER (so it can create extension "vector")
##############################################################################
echo ""
echo "Checking if role '$PGUSER' exists..."
ROLE_EXISTS=$(
  psql -U "$USER" -d postgres -tAc \
    "SELECT 1 FROM pg_roles WHERE rolname='$PGUSER'" 2>/dev/null || true
)
if [ "$ROLE_EXISTS" = "1" ]; then
  echo "Role '$PGUSER' already exists; converting to SUPERUSER..."
  psql -U "$USER" -d postgres -c "ALTER ROLE $PGUSER WITH SUPERUSER"
else
  echo "Creating role '$PGUSER' as SUPERUSER with LOGIN and CREATEDB..."
  psql -U "$USER" -d postgres \
    -c "CREATE ROLE $PGUSER WITH SUPERUSER LOGIN CREATEDB PASSWORD '$PGPASSWORD'"
fi

##############################################################################
# 5) Drop & create $PGDATABASE
##############################################################################
echo "Dropping any existing database '$PGDATABASE' (this is destructive!)..."
dropdb -U "$USER" -h "localhost" -p "5432" --if-exists "$PGDATABASE" || true

echo "Creating database '$PGDATABASE' owned by '$PGUSER'..."
createdb -U "$USER" -h "localhost" -p "5432" -O "$PGUSER" "$PGDATABASE"

##############################################################################
# 6) Install pgvector from source (cluster-level), then create extension
##############################################################################
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
echo "Attempting to create extension 'vector' in $PGDATABASE..."
psql -U "$USER" -d "$PGDATABASE" \
  -c "CREATE EXTENSION IF NOT EXISTS vector"

##############################################################################
# 7) Force a full Prisma DB reset
##############################################################################
echo ""
echo "==> Forcing a full Prisma reset now (drops ALL data!)"
npx prisma migrate reset --force

echo ""
echo "======================================================"
echo "All done! Postgres 16 is running in the background."
echo "Data folder: $PGDATA"
echo "Your user '$PGUSER' is a SUPERUSER (dev only!)."
echo "======================================================"