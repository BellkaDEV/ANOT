#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

# Run migrations and setup cache
echo "Running migrations..."
php artisan migrate --force

echo "Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Starting Supervisor..."
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
