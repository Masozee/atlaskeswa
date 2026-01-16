#!/bin/bash

# Start Django backend for network access
# This allows mobile devices on the same WiFi to connect

cd "$(dirname "$0")/backend"

echo "=========================================="
echo "🚀 Starting Django Backend (Network Mode)"
echo "=========================================="
echo ""
echo "📱 Mobile/Network Access:"
echo "   http://192.168.0.105:8000"
echo ""
echo "💻 Local Access:"
echo "   http://localhost:8000"
echo ""
echo "⚠️  Requirements:"
echo "   - Firewall must allow port 8000"
echo "   - Mobile device on same WiFi"
echo ""
echo "🛑 Press Ctrl+C to stop"
echo "=========================================="
echo ""

python manage.py runserver 0.0.0.0:8000
