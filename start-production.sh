#!/bin/bash

# Atlas Keswa - Production Start Script
# This script builds and starts the Next.js frontend in production mode

set -e

echo "============================================"
echo "     Atlas Keswa - Production Start"
echo "============================================"

# Configuration
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "Error: Frontend directory not found at $FRONTEND_DIR"
    exit 1
fi

# Navigate to frontend directory
cd "$FRONTEND_DIR"

echo ""
echo "[1/3] Installing dependencies..."
npm ci --production=false

echo ""
echo "[2/3] Building production bundle..."
npm run build

echo ""
echo "[3/3] Starting production server..."
cd "$SCRIPT_DIR"

# Check if PM2 is installed
if command -v pm2 &> /dev/null; then
    echo "Starting with PM2..."
    pm2 start ecosystem.config.js --env production
    pm2 save
    echo ""
    echo "Server started with PM2. Use 'pm2 logs atlas-keswa' to view logs."
else
    echo "PM2 not found. Starting with Node.js directly..."
    NODE_ENV=production node server.js
fi

echo ""
echo "============================================"
echo "     Atlas Keswa is now running!"
echo "============================================"
