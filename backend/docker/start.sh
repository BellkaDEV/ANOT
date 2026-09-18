#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

# Cache application configuration. Database migrations are a release step and
# must be executed explicitly once, outside the concurrent container startup.
echo "Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Starting Supervisor..."
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
