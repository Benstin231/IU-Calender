#!/bin/bash

# IU Calendar Backend Setup Script
# 使用方法: ./scripts/setup.sh

echo "🚀 IU Calendar Backend Setup"
echo "=============================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  請編輯 .env 檔案並填入你的 API 金鑰"
    echo "   - SPOTIFY_CLIENT_ID"
    echo "   - SPOTIFY_CLIENT_SECRET"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Create database
echo "🗄️  Creating database..."
npx prisma db push

echo ""
echo "✅ Setup complete!"
echo ""
echo "📌 Next steps:"
echo "   1. Edit .env and add your Spotify API credentials"
echo "   2. Run 'npm start' to start the server"
echo ""
