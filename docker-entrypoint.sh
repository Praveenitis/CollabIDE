#!/bin/sh
set -e

# Set defaults if not provided
BACKEND_HOST=${BACKEND_HOST:-backend}
BACKEND_PORT=${BACKEND_PORT:-3001}

# Replace placeholders in nginx config template
envsubst '${BACKEND_HOST} ${BACKEND_PORT}' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/nginx.conf

# Start nginx
exec nginx -g 'daemon off;'
