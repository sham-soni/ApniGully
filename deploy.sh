#!/bin/bash
set -e

echo "=== ApniGully Azure Deployment ==="

# Check .env.production exists
if [ ! -f .env.production ]; then
    echo "ERROR: .env.production not found!"
    echo "Copy .env.production.example to .env.production and fill in your values:"
    echo "  cp .env.production.example .env.production"
    echo "  nano .env.production"
    exit 1
fi

# Load env
set -a
source .env.production
set +a

# Validate required vars
for var in POSTGRES_PASSWORD JWT_SECRET CORS_ORIGINS NEXT_PUBLIC_API_URL NEXT_PUBLIC_WS_URL MINIO_ROOT_PASSWORD; do
    if [ -z "${!var}" ] || [[ "${!var}" == *"CHANGE_ME"* ]] || [[ "${!var}" == *"YOUR_VM"* ]]; then
        echo "ERROR: $var is not set or still has placeholder value in .env.production"
        exit 1
    fi
done

echo "1/4 Building images..."
docker compose -f docker-compose.prod.yml --env-file .env.production build

echo "2/4 Starting database..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d postgres
echo "Waiting for postgres to be healthy..."
sleep 5

echo "3/4 Starting all services..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

echo "4/4 Checking services..."
sleep 10
docker compose -f docker-compose.prod.yml ps

echo ""
echo "=== Deployment complete! ==="
echo "App: $NEXT_PUBLIC_API_URL"
echo "API docs: ${NEXT_PUBLIC_API_URL%/api/v1}/api/docs"
echo ""
echo "Useful commands:"
echo "  docker compose -f docker-compose.prod.yml logs -f        # View all logs"
echo "  docker compose -f docker-compose.prod.yml logs -f api    # API logs only"
echo "  docker compose -f docker-compose.prod.yml restart api    # Restart API"
echo "  docker compose -f docker-compose.prod.yml down           # Stop everything"
