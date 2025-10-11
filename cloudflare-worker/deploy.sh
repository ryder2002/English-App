#!/bin/bash

# Deploy Cloudflare Email Worker
# Run this script to deploy the email worker to Cloudflare

echo "🚀 Deploying English App Email Worker to Cloudflare..."

# Make sure wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler not found. Installing..."
    npm install -g wrangler
fi

# Deploy the worker
echo "📦 Deploying worker..."
cd cloudflare-worker
wrangler deploy

echo "🔐 Setting up secret token..."
echo "Please run the following command to set your email worker token:"
echo "wrangler secret put EMAIL_WORKER_TOKEN"
echo ""
echo "✅ Deployment completed!"
echo "📝 Your worker URL will be: https://english-app-email-worker.YOUR_SUBDOMAIN.workers.dev"
echo ""
echo "🔧 Update your .env file with:"
echo "EMAIL_SERVICE_ENABLED=\"true\""
echo "EMAIL_SERVICE_PROVIDER=\"cloudflare\""
echo "CLOUDFLARE_EMAIL_WORKER_URL=\"https://english-app-email-worker.YOUR_SUBDOMAIN.workers.dev\""
echo "CLOUDFLARE_EMAIL_WORKER_TOKEN=\"your-secret-token\""
echo "CLOUDFLARE_EMAIL_FROM=\"noreply@yourdomain.com\""
