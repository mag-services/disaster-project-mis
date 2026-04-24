#!/bin/bash
# VM deployment script – run from project root
set -e

VM_HOST="${DJANGO_VM_HOST:-http://10.252.0.158}"
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "=== VBoS VM Deployment ==="
echo "Project root: $PROJECT_ROOT"
echo ""

# Check .env
if [ ! -f vbos-backend/.env ]; then
  echo "Creating vbos-backend/.env from example..."
  cp vbos-backend/.env.example vbos-backend/.env
  echo "  → Edit vbos-backend/.env and set DJANGO_SECRET_KEY, DJANGO_DEBUG=false"
  exit 1
fi

# Check frontend build
if [ ! -d vbos-frontend/dist ]; then
  echo "Frontend not built. Do the following first:"
  echo "  1. Create vbos-frontend/.env.production.local:"
  echo "     VITE_API_HOST=$VM_HOST"
  echo "     VITE_TITILER_API=$VM_HOST:8002"
  echo "  2. Run: cd vbos-frontend && pnpm install && pnpm build"
  exit 1
fi

echo "Starting services..."
docker compose -f deploy/vm/docker-compose.yml up -d
echo ""
echo "Done. App: $VM_HOST  (ensure firewall allows ports 80, 8000, 8002)"
echo "Create superuser: docker compose -f deploy/vm/docker-compose.yml exec web ./manage.py createsuperuser"
