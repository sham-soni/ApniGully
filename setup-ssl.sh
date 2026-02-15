#!/bin/bash
set -e

DOMAIN="gullywale.com"
EMAIL="${1:-admin@gullywale.com}"

echo "=== ApniGully SSL Setup ==="
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"

# Step 1: Use init config (no SSL) so nginx can start
echo "1/4 Starting with HTTP-only config..."
cp nginx/nginx-init.conf nginx/nginx-active.conf

# Temporarily point nginx to the init config
docker compose -f docker-compose.prod.yml --env-file .env.production up -d nginx
sleep 5

# Step 2: Get SSL certificate
echo "2/4 Requesting SSL certificate from Let's Encrypt..."
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

# Step 3: Switch to full SSL config
echo "3/4 Switching to HTTPS config..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d nginx --force-recreate

# Step 4: Start certbot renewal daemon
echo "4/4 Starting certificate auto-renewal..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d certbot

echo ""
echo "=== SSL Setup Complete ==="
echo "Site: https://$DOMAIN"
echo "API:  https://$DOMAIN/api/v1"
echo "Docs: https://$DOMAIN/api/docs"
echo ""
echo "Certificates will auto-renew every 12 hours (if needed)."
