#!/bin/sh
set -e

echo "🚀 Starting application setup..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
while ! pg_isready -h postgres -p 5432 -U postgres; do
  sleep 1
done
echo "PostgreSQL is ready!"

# Check if migrations directory exists
if [ ! -d "/app/prisma/migrations" ]; then
  echo "Error: Migrations directory not found at /app/prisma/migrations"
  ls -la /app/prisma/
  exit 1
fi

# Run Prisma migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

echo "🎉 Setup completed! Starting application..."

# Start the application
echo "Starting the application..."
exec /usr/local/bin/node /app/dist/server.js
