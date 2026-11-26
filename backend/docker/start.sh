#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

# Render provides PORT dynamically. Keep 80 as the Docker-compatible default.
: "${PORT:=80}"
export PORT
envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Ensure storage and bootstrap directories exist with correct permissions
mkdir -p /var/www/storage/framework/views \
         /var/www/storage/framework/cache/data \
         /var/www/storage/framework/sessions \
         /var/www/storage/logs \
         /var/www/bootstrap/cache
chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Cache application configuration. Database migrations are a release step and
# must be executed explicitly once, outside the concurrent container startup.
echo "Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache || true

echo "Starting Supervisor..."
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
