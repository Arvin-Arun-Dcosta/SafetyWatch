#!/usr/bin/env bash
# Starts SafetyWatch for local development: installs dependencies when needed,
# starts the local Postgres container if DATABASE_URL points at it, applies
# pending migrations and runs the dev server.
#
#   ./start.sh          start the app
#   ./start.sh --seed   also create the admin account and demo reports first
set -euo pipefail
cd "$(dirname "$0")"

DB_CONTAINER="safetywatch-pg"

if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example. Fill in the values, then run this script again."
  exit 1
fi

if [ ! -d node_modules ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  echo "==> Installing dependencies"
  npm install
fi

# A database in a distant region can take longer to accept a connection than
# Node's default 250 ms per address allows.
export NODE_OPTIONS="${NODE_OPTIONS:-} --network-family-autoselection-attempt-timeout=1000"

database_url="$(grep -E '^DATABASE_URL=' .env.local | tail -n 1 | cut -d= -f2- | tr -d "\"'" || true)"
if [[ "$database_url" =~ @(localhost|127\.0\.0\.1)[:/] ]] && command -v docker >/dev/null 2>&1 &&
  docker container inspect "$DB_CONTAINER" >/dev/null 2>&1; then
  echo "==> Starting local database ($DB_CONTAINER)"
  docker start "$DB_CONTAINER" >/dev/null
  until docker exec "$DB_CONTAINER" pg_isready -q -U postgres; do sleep 1; done
fi

echo "==> Applying database migrations"
npm run db:deploy

if [ "${1:-}" = "--seed" ]; then
  echo "==> Seeding the admin account and demo reports"
  npm run db:seed
fi

echo "==> Starting the dev server at http://localhost:3000"
exec npm run dev
