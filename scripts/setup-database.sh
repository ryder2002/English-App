#!/usr/bin/env bash

echo "🗄️  Setting up PostgreSQL for English App..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    echo "📥 Download from: https://www.postgresql.org/download/"
    exit 1
fi

# Create database
echo "📁 Creating database..."
createdb english_app_db 2>/dev/null || echo "ℹ️  Database already exists"

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
npx prisma migrate dev --name init

# Generate Prisma client
echo "⚙️  Generating Prisma client..."
npx prisma generate

echo "✅ Database setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update your .env.local file with the correct DATABASE_URL"
echo "2. Run 'npm run migrate:firebase' to import data from Firebase"
echo "3. Update your app to use the new PostgreSQL services"
