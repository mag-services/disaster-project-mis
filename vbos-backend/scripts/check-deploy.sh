#!/bin/bash
# Run Django production checks before deploying.
# Requires DEBUG=False to avoid false warnings from check --deploy.
#
# Usage (from vbos-backend/):
#   ./scripts/check-deploy.sh
#
# With Docker:
#   docker-compose run --rm -e DJANGO_DEBUG=false web python manage.py check --deploy

set -e
cd "$(dirname "$0")/.."
export DJANGO_DEBUG=false
exec python manage.py check --deploy
