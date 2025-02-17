#!/bin/sh
# .github/docker-entrypoint.sh

set -e

log_error() {
    echo "Error: $1" >&2
    exit 1
}

# 1. Wait for Postgres to be ready
echo "Checking if Postgres is up (host=$PGHOST port=$PGPORT user=$PGUSER)..."
TIMEOUT=30
while ! pg_isready -h "${PGHOST:-localhost}" -p "${PGPORT:-5432}" -U "${PGUSER:-postgres}" >/dev/null 2>&1; do
  echo "Postgres is unavailable - sleeping"
  sleep 2
  TIMEOUT=$((TIMEOUT - 2))
  if [ $TIMEOUT -le 0 ]; then
    log_error "Postgres did not become available in time."
  fi
done
echo "Postgres is up!"

# 2. Attempt to create the 'vector' extension (optional)
if [ -n "$PGDATABASE" ]; then
  echo "Creating extension 'vector' in database: $PGDATABASE"
  psql -h "${PGHOST:-localhost}" -p "${PGPORT:-5432}" -U "${PGUSER:-postgres}" -d "$PGDATABASE" -c "CREATE EXTENSION IF NOT EXISTS vector;" || \
    echo "Warning: Could not create extension 'vector'. Possibly not superuser or extension is unavailable."
fi

# 3. Run Prisma migrations, referencing your prisma/schema.prisma
echo "Running prisma migrate deploy to ensure DB schema is up to date..."
npx prisma migrate deploy --schema=/usr/src/app/prisma/schema.prisma || log_error "Failed to run prisma migrate deploy."

echo "Generating Prisma client..."
npx prisma generate --schema=/usr/src/app/prisma/schema.prisma || log_error "Failed to run prisma generate."

# 4. Now proceed with original entrypoint logic
if [ "$1" = "serve" ]; then
    echo "Starting Autoshow server..."
    shift
    tsx --no-warnings src/fastify.ts "$@" || log_error "Server failed to start"
else
    echo "Running Autoshow CLI..."
    tsx --no-warnings src/commander.ts "$@" || log_error "CLI failed to start"
fi