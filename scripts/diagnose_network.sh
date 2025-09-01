#!/bin/bash

# Script to diagnose Docker network and DNS issues
# Usage: ./scripts/diagnose_network.sh

set -e

echo "🔍 Docker Network Diagnostics"
echo "=============================="

echo ""
echo "📋 Current containers:"
docker ps -a

echo ""
echo "🌐 Docker networks:"
docker network ls

echo ""
echo "🔗 WebCall network details:"
docker network inspect webcall-network 2>/dev/null || echo "WebCall network not found"

echo ""
echo "📡 Container IP addresses:"
if docker ps | grep -q webcall-backend; then
    echo "Backend IP: $(docker inspect webcall-backend | jq -r '.[0].NetworkSettings.Networks.webcall-network.IPAddress')"
else
    echo "Backend container not running"
fi

if docker ps | grep -q webcall-frontend; then
    echo "Frontend IP: $(docker inspect webcall-frontend | jq -r '.[0].NetworkSettings.Networks.webcall-network.IPAddress')"
else
    echo "Frontend container not running"
fi

echo ""
echo "🔍 DNS resolution test from frontend container:"
if docker ps | grep -q webcall-frontend; then
    echo "Testing nslookup backend from frontend:"
    docker exec webcall-frontend nslookup backend 127.0.0.11 || echo "nslookup failed"
    
    echo ""
    echo "Testing ping backend from frontend:"
    docker exec webcall-frontend ping -c 3 backend || echo "ping failed"
else
    echo "Frontend container not running"
fi

echo ""
echo "🌐 Network connectivity test:"
if docker ps | grep -q webcall-backend && docker ps | grep -q webcall-frontend; then
    echo "Testing connection from frontend to backend:8000:"
    docker exec webcall-frontend nc -zv backend 8000 || echo "Connection failed"
else
    echo "Both containers not running"
fi

echo ""
echo "📊 Container logs (last 10 lines each):"
echo "Backend logs:"
docker logs --tail=10 webcall-backend 2>/dev/null || echo "Backend container not found"

echo ""
echo "Frontend logs:"
docker logs --tail=10 webcall-frontend 2>/dev/null || echo "Frontend container not found"

echo ""
echo "✅ Diagnostics complete!"
