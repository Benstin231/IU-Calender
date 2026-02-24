#!/bin/bash

# IU Calendar Backend Setup Script (PostgreSQL)
# 使用方法: ./scripts/setup.sh

echo "IU Calendar Backend Setup (PostgreSQL)"
echo "======================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "IMPORTANT: Please edit .env and fill in the following:"
    echo "  - DATABASE_URL  (PostgreSQL connection string)"
    echo "  - SPOTIFY_CLIENT_ID"
    echo "  - SPOTIFY_CLIENT_SECRET"
    echo ""
    echo "Example DATABASE_URL:"
    echo "  postgresql://postgres:password@localhost:5432/iu_calendar"
    echo ""
    echo "After editing .env, re-run this script."
    exit 1
fi

# Check DATABASE_URL is set
if grep -q 'DATABASE_URL=postgresql://postgres:password' .env; then
    echo "WARNING: DATABASE_URL still contains the default placeholder."
    echo "Please edit .env and set your actual PostgreSQL credentials."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "Applying database migrations..."
npx prisma migrate deploy 2>/dev/null || npx prisma db push

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Make sure PostgreSQL is running"
echo "  2. Run 'npm start' to start the server"
echo ""
