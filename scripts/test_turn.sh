#!/bin/bash

# TURN Server Test Script
# This script tests the TURN server configuration

set -e

echo "=== TURN Server Test Script ==="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
TURN_HOST=${TURN_HOST:-localhost}
TURN_PORT=${TURN_PORT:-3478}
TURN_USERNAME=${TURN_USERNAME:-user}
TURN_PASSWORD=${TURN_PASSWORD:-secret}

echo "Testing TURN server at ${TURN_HOST}:${TURN_PORT}"
echo "Username: ${TURN_USERNAME}"
echo ""

# Function to test port connectivity
test_port() {
    local host=$1
    local port=$2
    local protocol=$3
    
    echo -n "Testing ${protocol} connection to ${host}:${port}... "
    
    if timeout 5 bash -c "</dev/tcp/${host}/${port}" 2>/dev/null; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Function to test TURN server with curl
test_turn_curl() {
    echo -n "Testing TURN server with curl... "
    
    # Test STUN binding request
    if curl -s --connect-timeout 5 --max-time 10 \
        -H "Content-Type: application/json" \
        -d '{"username":"'${TURN_USERNAME}'","password":"'${TURN_PASSWORD}'"}' \
        "http://${TURN_HOST}:${TURN_PORT}/stun" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Function to test with netcat
test_turn_netcat() {
    echo -n "Testing TURN server with netcat... "
    
    # Send a simple STUN binding request
    local stun_request="000100002112a442b7e7a701bc34d686fa87dfae"
    
    if echo -n "$stun_request" | xxd -r -p | nc -w 5 ${TURN_HOST} ${TURN_PORT} > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Main test sequence
echo "1. Testing basic connectivity..."
test_port ${TURN_HOST} ${TURN_PORT} "TCP"
test_port ${TURN_HOST} ${TURN_PORT} "UDP"

echo ""
echo "2. Testing TURN server functionality..."

# Check if curl is available
if command -v curl >/dev/null 2>&1; then
    test_turn_curl
else
    echo -e "${YELLOW}⚠ curl not available, skipping curl test${NC}"
fi

# Check if netcat is available
if command -v nc >/dev/null 2>&1; then
    test_turn_netcat
else
    echo -e "${YELLOW}⚠ netcat not available, skipping netcat test${NC}"
fi

echo ""
echo "3. Testing TLS port (if available)..."
test_port ${TURN_HOST} 5349 "TCP"

echo ""
echo "=== Test Summary ==="
echo "If all tests passed, your TURN server should be working correctly."
echo ""
echo "For WebRTC testing, use this ICE configuration:"
echo 'VITE_ICE_JSON=[{"urls":["stun:'${TURN_HOST}':'${TURN_PORT}'"]},{"urls":["turn:'${TURN_HOST}':'${TURN_PORT}'?transport=udp","turn:'${TURN_HOST}':'${TURN_PORT}'?transport=tcp"],"username":"'${TURN_USERNAME}'","credential":"'${TURN_PASSWORD}'"}]'
echo ""
echo "To test with the web application:"
echo "1. Copy the ICE configuration above to your .env file"
echo "2. Restart the application: docker compose up --build"
echo "3. Try connecting from different networks/devices"
