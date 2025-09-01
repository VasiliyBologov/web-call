#!/bin/bash

# Script to safely restart WebCall services
# Usage: ./scripts/restart_services.sh

set -e

echo "🔍 Checking current service status..."
docker-compose ps

echo ""
echo "🛑 Stopping all services..."
docker-compose down

echo ""
echo "🧹 Cleaning up any orphaned containers..."
docker container prune -f

echo ""
echo "🌐 Checking network status..."
docker network ls | grep webcall || echo "No webcall network found"

echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "🔍 Checking service health..."
docker-compose ps

echo ""
echo "🏥 Running health checks..."
echo "Backend health:"
curl -f http://localhost:8000/api/health || echo "Backend not ready yet"

echo ""
echo "Frontend health:"
curl -f http://localhost:5173/health || echo "Frontend not ready yet"

echo ""
echo "📊 Service logs (last 20 lines):"
docker-compose logs --tail=20

echo ""
echo "✅ Restart complete! Check the logs above for any errors."
