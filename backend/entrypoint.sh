#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Running migrations..."
python manage.py makemigrations
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting server..."
exec "$@"

