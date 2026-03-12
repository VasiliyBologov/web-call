#!/bin/bash

# Script to safely restart WebCall services
# Usage: ./scripts/restart_services.sh

set -e

echo "🔍 Checking current service status..."
make ps

echo ""
echo "🛑 Stopping all services..."
make stop

echo ""
echo "🧹 Cleaning up any orphaned containers..."
docker container prune -f

echo ""
echo "🌐 Checking network status..."
docker network ls | grep webcall || echo "No webcall network found"

echo ""
echo "🚀 Starting services..."
make up

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "🔍 Checking service health..."
make ps

echo ""
echo "🏥 Running health checks..."
echo "Service health (Nginx):"
curl -f http://localhost/api/health || echo "Service not ready yet"

echo ""
echo "📊 Service logs (last 20 lines):"
docker logs --tail=20 web-call-app

echo ""
echo "✅ Restart complete! Check the logs above for any errors."
